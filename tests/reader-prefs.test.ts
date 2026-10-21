import { readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { readPopupSuppression, suppressPopup } from "../lib/reader-prefs"

let database: DatabaseSync
let calls: { sql: string; params: string[] }[]

beforeEach(() => {
  database = new DatabaseSync(":memory:")
  database.exec(readFileSync("migrations/0002_reader-prefs.sql", "utf8"))
  calls = []
  vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account")
  vi.stubEnv("CLOUDFLARE_D1_DATABASE_ID", "test-database")
  vi.stubEnv("CLOUDFLARE_D1_API_TOKEN", "test-token")
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const call = JSON.parse(String(init.body)) as (typeof calls)[number]
      calls.push(call)
      const results = database.prepare(call.sql).all(...call.params)
      return Response.json({ result: [{ success: true, results }] })
    })
  )
})

afterEach(() => {
  database?.close()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe("Reader popup suppression", () => {
  it("refuses empty Reader identifiers before contacting D1", async () => {
    await expect(readPopupSuppression("")).rejects.toThrow(/uid/)
    await expect(suppressPopup("", "dismissed")).rejects.toThrow(/uid/)
    expect(calls).toEqual([])
  })

  it("does not treat invalid stored state or D1 failure as absence", async () => {
    for (const body of [
      {
        result: [
          { success: true, results: [{ popup_suppressed_reason: "unknown" }] },
        ],
      },
      { result: [{ success: true, results: [{}] }] },
      { result: [{ success: false, results: [] }] },
      { result: [{ success: true }] },
    ]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json(body))
      )
      await expect(readPopupSuppression("reader-a")).rejects.toThrow()
    }
  })

  it("stores exactly one row per Reader and rejects unsupported reasons", async () => {
    await suppressPopup("reader-a", "subscribed")
    await suppressPopup("reader-a", "dismissed")
    await suppressPopup("reader-b", "dismissed")
    expect(await readPopupSuppression("reader-a")).toBe("subscribed")
    expect(await readPopupSuppression("reader-b")).toBe("dismissed")
    expect(database.prepare("SELECT * FROM reader_prefs").all()).toHaveLength(2)
    expect(() =>
      database
        .prepare("INSERT INTO reader_prefs VALUES (?, ?, ?)")
        .run("reader-c", "2026-10-01T00:00:00.000Z", "expired")
    ).toThrow()
    expect(() =>
      database
        .prepare("INSERT INTO reader_prefs VALUES (?, ?, ?)")
        .run("reader-a", "2026-10-01T00:00:00.000Z", "dismissed")
    ).toThrow()
  })

  it("writes once per decision and only upgrades dismissal to subscription", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"))
    const uid = "reader-'bound"
    await suppressPopup(uid, "dismissed")
    expect(calls).toHaveLength(1)
    expect(calls[0].params).toEqual([
      uid,
      "2026-10-01T00:00:00.000Z",
      "dismissed",
    ])
    expect(calls[0].sql).not.toContain(uid)
    expect(await readPopupSuppression(uid)).toBe("dismissed")
    vi.setSystemTime(new Date("2026-10-02T00:00:00.000Z"))
    await suppressPopup(uid, "dismissed")
    expect(database.prepare("SELECT * FROM reader_prefs").all()).toEqual([
      {
        reader_uid: uid,
        popup_suppressed_at: "2026-10-01T00:00:00.000Z",
        popup_suppressed_reason: "dismissed",
      },
    ])
    await suppressPopup(uid, "subscribed")
    expect(await readPopupSuppression(uid)).toBe("subscribed")
    vi.setSystemTime(new Date("2026-10-03T00:00:00.000Z"))
    await suppressPopup(uid, "dismissed")
    await suppressPopup(uid, "subscribed")
    expect(database.prepare("SELECT * FROM reader_prefs").all()).toEqual([
      {
        reader_uid: uid,
        popup_suppressed_at: "2026-10-01T00:00:00.000Z",
        popup_suppressed_reason: "subscribed",
      },
    ])
    expect(calls.filter(({ sql }) => sql.startsWith("INSERT"))).toHaveLength(5)
  })

  it("reads only the bound Reader with one primary-key lookup", async () => {
    database
      .prepare("INSERT INTO reader_prefs VALUES (?, ?, ?)")
      .run("reader-a", "2026-10-01T00:00:00.000Z", "dismissed")
    expect(await readPopupSuppression("reader-a")).toBe("dismissed")
    expect(calls).toHaveLength(1)
    expect(calls[0].params).toEqual(["reader-a"])
    expect(calls[0].sql).not.toContain("reader-a")
    expect(calls[0].sql).toMatch(/WHERE reader_uid = \?/)
    expect(await readPopupSuppression("reader-b")).toBeNull()
    expect(await readPopupSuppression("' OR 1=1 --")).toBeNull()
  })
})
