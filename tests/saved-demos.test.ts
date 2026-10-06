import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { allRecordings } from "../data/catalogue"
import {
  readSavedDemos,
  saveDemo,
  saveDemos,
  unsaveDemo,
} from "../lib/saved-demos"

// sign-in-to-save ticket 05.
//
// No network here. These assert what lib/saved-demos.ts *sends* — one statement,
// one primary-key lookup, bound parameters and never interpolation — because the
// ticket's load-bearing claim is structural: "one module owns all D1 access, so
// the read discipline is a property of the code rather than a rule to remember".
// A test that exercised the live database would prove the SQL works; these prove
// the shape, and the live probe that measured it is recorded in the ticket.
//
// The catalogue-id test at the bottom exists because the id pattern was wrong
// once already. It is stricter than a ULID is supposed to be, and it rejected
// real Recording ids.

const QUERY_URL =
  "https://api.cloudflare.com/client/v4/accounts/acct-123/d1/database/db-456/query"

const CATALOGUE_IDS = allRecordings.map((r) => r.id)
const A = CATALOGUE_IDS[0]
const B = CATALOGUE_IDS[1]

const saved = {
  account: process.env.CLOUDFLARE_ACCOUNT_ID,
  database: process.env.CLOUDFLARE_D1_DATABASE_ID,
  token: process.env.CLOUDFLARE_D1_API_TOKEN,
}

function restore(key: string, value: string | undefined) {
  // `undefined` deleted rather than assigned, because assigning it writes the
  // STRING "undefined" — the same trap tests/turnstile.test.ts documents.
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

beforeEach(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct-123"
  process.env.CLOUDFLARE_D1_DATABASE_ID = "db-456"
  process.env.CLOUDFLARE_D1_API_TOKEN = "tok-789"
})

afterEach(() => {
  restore("CLOUDFLARE_ACCOUNT_ID", saved.account)
  restore("CLOUDFLARE_D1_DATABASE_ID", saved.database)
  restore("CLOUDFLARE_D1_API_TOKEN", saved.token)
  vi.unstubAllGlobals()
})

type Query = { sql: string; params: unknown[] }

/**
 * A fetch that answers every statement with `results`, recording the queries.
 *
 * `rows_read` in the response meta is echoed back so a test can assert the module
 * never asks for more than it needs — which is the one thing about this code that
 * is not visible in the SQL string.
 */
function stubD1(results: Record<string, unknown>[] = [], rowsRead = 1) {
  const queries: Query[] = []
  const mock = vi.fn(async (_url: string, init: { body: string }) => {
    const query = JSON.parse(init.body) as Query
    queries.push(query)
    return new Response(
      JSON.stringify({
        result: [
          {
            results,
            success: true,
            meta: { rows_read: rowsRead, rows_written: 0 },
          },
        ],
        errors: [],
        messages: [],
        success: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  })
  vi.stubGlobal("fetch", mock)
  return { queries, mock }
}

/** The single query sent, asserted to be the only one. */
function only(queries: Query[]): Query {
  expect(queries).toHaveLength(1)
  return queries[0]
}

describe("the read discipline", () => {
  it("reads with a single primary-key lookup scoped by uid", async () => {
    const { queries } = stubD1()
    await readSavedDemos("reader-1")

    const query = only(queries)
    expect(query.sql).toMatch(/SELECT\s+recording_ids\s+FROM\s+saved_demos/i)
    expect(query.sql).toMatch(/WHERE\s+reader_uid\s*=\s*\?/i)
  })

  it("never puts a uid in the SQL string", async () => {
    const { queries } = stubD1()
    await readSavedDemos('reader-1"; DROP TABLE saved_demos; --')

    // The uid is a bound parameter, so the statement is byte-identical whatever
    // the uid contains. This is the check that would fail if anyone ever
    // interpolated.
    expect(only(queries).sql).not.toContain("DROP TABLE")
    expect(only(queries).sql).not.toContain("reader-1")
    expect(only(queries).params).toEqual([
      'reader-1"; DROP TABLE saved_demos; --',
    ])
  })

  it("sends exactly one statement per call, however many ids are saved", async () => {
    // The forty-id case is the first-sign-in merge. One statement, one round
    // trip, one row written — not one per Demo.
    const { queries } = stubD1()
    await saveDemos("reader-1", CATALOGUE_IDS.slice(0, 40))

    expect(only(queries).sql.match(/INSERT INTO/gi)).toHaveLength(1)
  })

  it("has no exported way to read another Reader's saved Demos", async () => {
    // A structural assertion rather than a behavioural one, and the one this
    // ticket calls "the single most important thing it produces". `d1Query` is not
    // exported, so nothing outside this file can construct a query; every
    // exported function takes a uid as its first argument; and there is no
    // uid-less read. A route that forgets to scope a read therefore does not
    // compile, rather than quietly returning somebody else's saved Demos.
    //
    // The export list is asserted exactly rather than by pattern, so adding a
    // `readAllSavedDemos` later fails this test instead of passing it.
    // Named `module` is reserved by the Next.js ESLint rule, hence `api`.
    const api = await import("../lib/saved-demos")
    const exported = Object.entries(api).sort(([a], [b]) => a.localeCompare(b))

    expect(exported.map(([name]) => name)).toEqual([
      "readSavedDemos",
      "saveDemo",
      "saveDemos",
      "unsaveDemo",
    ])

    for (const [name, value] of exported) {
      // Arity, not the name: a uid-less read is the thing that must not exist,
      // and a function's parameter count is what stops it being called without
      // one. `saveDemos` and `readSavedDemos` both take exactly (uid, ...).
      expect(
        typeof value === "function" && value.length >= 1,
        `${name} takes no uid`
      ).toBe(true)
    }
  })
})

describe("readSavedDemos", () => {
  it("returns the stored ids", async () => {
    stubD1([{ recording_ids: JSON.stringify([A, B]) }])
    expect(await readSavedDemos("reader-1")).toEqual([A, B])
  })

  it("returns [] for a Reader who has saved nothing", async () => {
    // An absent row and an empty list mean the same thing, and a caller that had
    // to tell them apart would eventually get it wrong in the direction that
    // loses a save.
    stubD1([])
    expect(await readSavedDemos("nobody")).toEqual([])
  })

  it("returns [] rather than throwing if the column somehow holds a non-array", async () => {
    // The CHECK constraint in the migration makes this unreachable. It is here
    // for the day somebody edits that constraint without reading the migration:
    // a wrong-shaped column must not crash the bookmarks page, and must not
    // become somebody else's ids either.
    stubD1([{ recording_ids: JSON.stringify({ not: "an array" }) }])
    expect(await readSavedDemos("reader-1")).toEqual([])
  })

  it("drops non-string members rather than passing them on", async () => {
    stubD1([{ recording_ids: JSON.stringify([A, 42, null, B]) }])
    expect(await readSavedDemos("reader-1")).toEqual([A, B])
  })

  it("refuses an empty uid", async () => {
    // An empty uid would key every such Reader to the same row, so one visitor
    // would read as another's saved Demos.
    const { mock } = stubD1()
    await expect(readSavedDemos("")).rejects.toThrow(/uid/)
    expect(mock).not.toHaveBeenCalled()
  })
})

describe("saveDemos", () => {
  it("creates the row on first save, upserting on conflict", async () => {
    const { queries } = stubD1()
    await saveDemo("reader-1", A)

    const query = only(queries)
    expect(query.sql).toMatch(/INSERT INTO saved_demos/i)
    expect(query.sql).toMatch(/ON CONFLICT\(reader_uid\) DO UPDATE/i)
    expect(query.params[0]).toBe("reader-1")
  })

  it("appends rather than replaces", async () => {
    // The stored half of the array is kept unconditionally and only incoming ids
    // are tested against it, so the statement is the union of the two lists. An
    // earlier draft tested BOTH halves against each other and deleted any id
    // present in both — precisely the id a second device re-saves.
    const { queries } = stubD1()
    await saveDemos("reader-1", [A, B])

    const sql = only(queries).sql
    expect(sql).toMatch(/json_each\(saved_demos\.recording_ids\) AS stored/)
    expect(sql).toMatch(/UNION ALL/)
    expect(sql).toMatch(/NOT EXISTS/)
  })

  it("deduplicates ids the caller sends twice, before any SQL is sent", async () => {
    const { queries } = stubD1()
    await saveDemos("reader-1", [A, B, A, B, A])

    // The very first write is this array verbatim, so JS-side dedup is what keeps
    // a duplicate out of a Reader's very first list.
    expect(JSON.parse(only(queries).params[1] as string)).toEqual([A, B])
  })

  it("sends nothing at all for an empty list", async () => {
    // Creating a row for a Reader who saved nothing would make "signed in but
    // saved nothing" and "signed in and has a row" two states to reconcile.
    const { mock } = stubD1()
    await saveDemos("reader-1", [])
    expect(mock).not.toHaveBeenCalled()
  })

  it("writes updated_at as ISO-8601 UTC", async () => {
    const { queries } = stubD1()
    await saveDemo("reader-1", A)

    const stamp = only(queries).params[2] as string
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(Number.isNaN(Date.parse(stamp))).toBe(false)
  })

  it("rejects anything that is not a catalogue-shaped id, before any SQL", async () => {
    // The array column is JSON, so what may go into it is worth being strict
    // about. These are all rejected by the module rather than reaching D1.
    for (const bad of [
      "",
      "01JGQQ",
      "01jgqqt7ez1mgv46pfrzcqj0ny", // lowercase
      "01JGQQT7EZ1MGV46PFRZCQJ0N'", // a quote
      "01JGQQT7EZ1MGV46PFRZCQJ0N,1", // a comma
      "01JGQQT7EZ1MGV46PFRZCQJ0N]", // a bracket
      "01JGQQT7EZ1MGV46PFRZCQJ0N ", // trailing space
      "x".repeat(26),
    ]) {
      const { mock } = stubD1()
      await expect(saveDemo("reader-1", bad)).rejects.toThrow(
        /Not a Recording id/
      )
      expect(mock, `"${bad}" reached D1`).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    }
  })

  it("accepts every id the catalogue actually uses", async () => {
    // The pattern was a Crockford ULID alphabet once, which excludes `L` — and
    // real catalogue ids contain it. 298 of 298 ids are 26 uppercase
    // alphanumerics, so that is the pattern.
    stubD1()
    await expect(saveDemos("reader-1", CATALOGUE_IDS)).resolves.toBeUndefined()
  })
})

describe("unsaveDemo", () => {
  it("removes by id, scoped by uid, and preserves order explicitly", async () => {
    // `ORDER BY key` is what keeps the remaining ids in saved order. A bare
    // aggregate over json_each relies on an order SQLite does not promise, and
    // the bookmarks page would reshuffle the day it stopped holding.
    const { queries } = stubD1()
    await unsaveDemo("reader-1", B)

    const query = only(queries)
    expect(query.sql).toMatch(/UPDATE saved_demos/i)
    expect(query.sql).toMatch(/WHERE\s+reader_uid\s*=\s*\?/i)
    expect(query.sql).toMatch(/ORDER BY key/i)
    expect(query.params).toEqual([B, expect.stringMatching(/Z$/), "reader-1"])
  })

  it("leaves an empty array rather than null when the last id goes", async () => {
    const { queries } = stubD1()
    await unsaveDemo("reader-1", A)

    // COALESCE matters: the column is NOT NULL, and an aggregate over an empty
    // set is what the COALESCE is there to turn back into '[]'. Without it the
    // write fails and unsaving the last Demo is impossible.
    expect(only(queries).sql).toMatch(/COALESCE\(/)
    expect(only(queries).sql).toContain("'[]'")
  })

  it("rejects an id that is not catalogue-shaped", async () => {
    const { mock } = stubD1()
    await expect(unsaveDemo("reader-1", "nope")).rejects.toThrow(
      /Not a Recording id/
    )
    expect(mock).not.toHaveBeenCalled()
  })
})

describe("unconfigured storage refuses", () => {
  // Same reason tests/turnstile.test.ts covers its unconfigured paths: the
  // symptom of this being wrong is "it worked", which no reviewer catches.
  const missing = [
    ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID"],
    ["CLOUDFLARE_D1_DATABASE_ID", "CLOUDFLARE_D1_DATABASE_ID"],
    ["CLOUDFLARE_D1_API_TOKEN", "CLOUDFLARE_D1_API_TOKEN"],
  ] as const

  for (const [key, mentioned] of missing) {
    it(`refuses when ${key} is unset`, async () => {
      const { mock } = stubD1()
      delete process.env[key]
      await expect(readSavedDemos("reader-1")).rejects.toThrow(
        new RegExp(mentioned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      )
      expect(mock).not.toHaveBeenCalled()
    })
  }

  it("reads credentials per call, not at import", async () => {
    // So this module imports in a test with no environment set, and a missing
    // value fails at the request that needed it. Same as lib/resend.ts and
    // lib/submission-storage.ts.
    const { queries } = stubD1()
    await readSavedDemos("reader-1")
    delete process.env.CLOUDFLARE_D1_API_TOKEN
    await expect(readSavedDemos("reader-1")).rejects.toThrow(
      /CLOUDFLARE_D1_API_TOKEN/
    )
    // The first call still succeeded, so it was not cached at import.
    expect(queries).toHaveLength(1)
  })
})

describe("D1's response shape", () => {
  it("sends the token as a bearer credential to the account's query endpoint", async () => {
    const { mock } = stubD1()
    await readSavedDemos("reader-1")

    const [url, init] = mock.mock.calls[0] as unknown as [
      string,
      { method: string; headers: Record<string, string>; body: string },
    ]
    expect(url).toBe(QUERY_URL)
    expect(init.method).toBe("POST")
    expect(init.headers.Authorization).toBe("Bearer tok-789")
  })

  it("throws on a non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 }))
    )
    await expect(readSavedDemos("reader-1")).rejects.toThrow(/HTTP 500/)
  })

  it("throws when D1 answers 200 with success: false", async () => {
    // The case a `res.ok` check alone misses: D1 returns 200 with a failure
    // envelope for a constraint violation, so a write that did not happen can
    // look like one that did.
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              result: [
                { success: false, errors: [{ message: "CHECK failed" }] },
              ],
              errors: [{ code: 7500, message: "CHECK constraint failed" }],
              success: false,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
      )
    )
    await expect(saveDemo("reader-1", A)).rejects.toThrow(
      /CHECK constraint failed/
    )
  })
})
