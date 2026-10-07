import { afterEach, describe, expect, it, vi } from "vitest"

import {
  fetchSavedDemos,
  forgetSavedDemos,
  loadSavedDemos,
  persistSavedDemos,
  removeSavedDemo,
  replaceSavedDemos,
} from "../lib/saved-demos-client"

// sign-in-to-save ticket 07.
//
// The client half of the read discipline: a page showing 280 Recordings does
// not issue 280 reads. Every `useSavedDemos` instance on the page — the header
// chip, the catalogue grid, the detail body — loads through one cached,
// in-flight-deduped request, so the whole page costs one GET however many
// components ask.

type Call = { url: string; init: RequestInit }

function stubApi() {
  const calls: Call[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init: init ?? {} })
      if (init?.method === "POST") {
        const { ids } = JSON.parse(init.body as string) as { ids: string[] }
        return new Response(JSON.stringify({ ids }), { status: 200 })
      }
      if (init?.method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(JSON.stringify({ ids: ["AAAA"] }), { status: 200 })
    })
  )
  return { calls }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("loadSavedDemos, one GET per Reader per page load", () => {
  it("dedupes concurrent and sequential loads into one request", async () => {
    const { calls } = stubApi()
    const uid = "reader-dedupe"

    const [a, b, c] = await Promise.all([
      loadSavedDemos(uid, "token-1"),
      loadSavedDemos(uid, "token-1"),
      loadSavedDemos(uid, "token-1"),
    ])
    const d = await loadSavedDemos(uid, "token-1")

    expect([a, b, c, d]).toEqual([["AAAA"], ["AAAA"], ["AAAA"], ["AAAA"]])
    expect(calls.filter((c) => c.url === "/api/saved-demos")).toHaveLength(1)
  })

  it("loads each Reader separately, not once globally", async () => {
    const { calls } = stubApi()

    await loadSavedDemos("reader-one", "token-1")
    await loadSavedDemos("reader-two", "token-2")

    expect(calls.filter((c) => c.url === "/api/saved-demos")).toHaveLength(2)
  })

  it("forgets on demand, so a retry reads again", async () => {
    const { calls } = stubApi()
    const uid = "reader-retry"

    await loadSavedDemos(uid, "token-1")
    forgetSavedDemos(uid)
    await loadSavedDemos(uid, "token-1")

    expect(calls.filter((c) => c.url === "/api/saved-demos")).toHaveLength(2)
  })

  it("a rejection clears the in-flight entry so a later load can try again", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 500 }))
    )
    const uid = "reader-failing"
    await expect(loadSavedDemos(uid, "token-1")).rejects.toThrow()
    // Second attempt must not hang on the first attempt's rejected promise.
    await expect(loadSavedDemos(uid, "token-1")).rejects.toThrow()
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(2)
  })

  it("a confirmed write seeds the cache without a second GET", async () => {
    const { calls } = stubApi()
    const uid = "reader-seeded"

    replaceSavedDemos(uid, ["AAAA", "BBBB"])
    await expect(loadSavedDemos(uid, "token-1")).resolves.toEqual([
      "AAAA",
      "BBBB",
    ])
    expect(calls).toHaveLength(0)
  })
})

describe("the writes", () => {
  it("saves with the bearer token and answers the merged list", async () => {
    const { calls } = stubApi()

    const merged = await persistSavedDemos("token-9", ["AAAA", "BBBB"])

    expect(merged).toEqual(["AAAA", "BBBB"])
    expect(calls).toHaveLength(1)
    expect(calls[0].init.method).toBe("POST")
    expect(
      (calls[0].init.headers as Record<string, string>).Authorization
    ).toBe("Bearer token-9")
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      ids: ["AAAA", "BBBB"],
    })
  })

  it("removes with the bearer token", async () => {
    const { calls } = stubApi()

    await removeSavedDemo("token-9", "AAAA")

    expect(calls).toHaveLength(1)
    expect(calls[0].init.method).toBe("DELETE")
    expect(
      (calls[0].init.headers as Record<string, string>).Authorization
    ).toBe("Bearer token-9")
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      recordingId: "AAAA",
    })
  })

  it("reads a 401 as signed-out, never as an empty list", async () => {
    // The distinction the merge depends on: an empty list merges to nothing,
    // while a rejected token must keep the browser's copy.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 401 }))
    )
    await expect(fetchSavedDemos("stale-token")).rejects.toThrow("signed-out")
    await expect(
      persistSavedDemos("stale-token", ["AAAA"])
    ).rejects.toThrow("signed-out")
    await expect(removeSavedDemo("stale-token", "AAAA")).rejects.toThrow(
      "signed-out"
    )
  })

  it("refuses an answer without a saved list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }))
    )
    await expect(fetchSavedDemos("token-1")).rejects.toThrow(/without a saved list/)
  })
})
