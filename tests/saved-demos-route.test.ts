import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
  type KeyInput,
} from "jose"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { DELETE, GET, POST } from "../app/api/saved-demos/route"
import { SAVE_FAILED } from "../hooks/use-saved-demos"
import { allRecordings } from "../data/catalogue"

// sign-in-to-save ticket 07.
//
// A route handler is the one place where a mistake is invisible from a
// browser: a merge that quietly starts a Reader's list from empty, or a read
// scoped to the wrong account, looks exactly like a route that works. So what
// is pinned here is the scoping and the counting rather than the happy path
// alone: every D1 statement carries the verified uid, the merge is a union,
// an idempotent re-merge costs a read and no write, and anything unsigned or
// unverifiable is a 401 that touches nothing.
//
// No network here. Tokens are REAL RS256 JWTs signed by a key the tests own,
// verified against a stubbed JWKS exactly as tests/firebase-token.test.ts
// does — a mocked signature path would pass while the real check was broken.
// D1 is an in-memory fake keyed by the uid bound parameter, so a query that
// forgot its scope would read or write the wrong Reader's row rather than the
// right one.

const PROJECT_ID = "rnui-pixellog-d1008"
const ISSUER = `https://securetoken.google.com/${PROJECT_ID}`
const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"

const CATALOGUE_IDS = allRecordings.map((r) => r.id)
const [IDA, IDB, IDC, IDD] = CATALOGUE_IDS

const UID_A = "reader-uid-a"
const UID_B = "reader-uid-b"

const savedEnv = {
  account: process.env.CLOUDFLARE_ACCOUNT_ID,
  database: process.env.CLOUDFLARE_D1_DATABASE_ID,
  token: process.env.CLOUDFLARE_D1_API_TOKEN,
  project: process.env.FIREBASE_PROJECT_ID,
}

function restore(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

beforeEach(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct-123"
  process.env.CLOUDFLARE_D1_DATABASE_ID = "db-456"
  process.env.CLOUDFLARE_D1_API_TOKEN = "tok-789"
  process.env.FIREBASE_PROJECT_ID = PROJECT_ID
  vi.useRealTimers()
})

afterEach(() => {
  restore("CLOUDFLARE_ACCOUNT_ID", savedEnv.account)
  restore("CLOUDFLARE_D1_DATABASE_ID", savedEnv.database)
  restore("CLOUDFLARE_D1_API_TOKEN", savedEnv.token)
  restore("FIREBASE_PROJECT_ID", savedEnv.project)
  vi.unstubAllGlobals()
})

async function signer(): Promise<{
  privateKey: KeyInput
  publicJwk: JWK
}> {
  const { privateKey, publicKey } = await generateKeyPair("RS256")
  return {
    privateKey,
    publicJwk: {
      ...(await exportJWK(publicKey)),
      kid: "test-kid-1",
      alg: "RS256",
      use: "sig",
    },
  }
}

// One key for the whole file. `lib/firebase-token.ts` memoises the JWKS per
// module instance (tests/firebase-token.test.ts re-imports per test for the
// same reason), so minting each test's tokens from a fresh key would verify
// the first test and reject the rest — against the first test's cached key.
let privateKey!: KeyInput
let publicJwk!: JWK

beforeAll(async () => {
  const pair = await signer()
  privateKey = pair.privateKey
  publicJwk = pair.publicJwk
})

async function mint(key: KeyInput, subject: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: "test-kid-1" })
    .setIssuer(ISSUER)
    .setAudience(PROJECT_ID)
    .setSubject(subject)
    .setIssuedAt(now - 10)
    .setExpirationTime(now + 3600)
    .sign(key)
}

type D1Call = { sql: string; params: unknown[] }

/**
 * The network, dispatched on URL: Google's JWKS document for the key the
 * tests own, and an in-memory D1 keyed by the uid bound parameter — so scope
 * is behaviour, not a string match. INSERT applies the union the real
 * statement applies; UPDATE removes; SELECT reads one row.
 */
function stubNetwork(store: Map<string, string[]>, publicJwk: JWK) {
  const d1Calls: D1Call[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: { body?: string }) => {
      if (url === JWKS_URL) {
        return new Response(JSON.stringify({ keys: [publicJwk] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      const { sql, params } = JSON.parse(init?.body ?? "{}") as D1Call
      d1Calls.push({ sql, params })
      if (sql.startsWith("SELECT")) {
        const ids = store.get(params[0] as string)
        return d1Response(
          ids === undefined ? [] : [{ recording_ids: JSON.stringify(ids) }]
        )
      }
      if (sql.startsWith("INSERT")) {
        const [uid, incomingJson] = params as [string, string]
        const incoming = JSON.parse(incomingJson) as string[]
        const merged = [...(store.get(uid) ?? [])]
        for (const id of incoming) {
          if (!merged.includes(id)) merged.push(id)
        }
        store.set(uid, merged)
        return d1Response([])
      }
      if (sql.startsWith("UPDATE")) {
        const [recordingId, , uid] = params as [string, string, string]
        store.set(
          uid,
          (store.get(uid) ?? []).filter((id) => id !== recordingId)
        )
        return d1Response([])
      }
      throw new Error(`unexpected SQL: ${sql.slice(0, 60)}`)
    })
  )
  return { d1Calls }
}

function d1Response(results: Record<string, unknown>[]) {
  return new Response(
    JSON.stringify({
      result: [{ results, success: true, meta: {} }],
      errors: [],
      messages: [],
      success: true,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  )
}

/** The uid a D1 statement is scoped to — bound first, never interpolated. */
function scopedUid(call: D1Call): unknown {
  if (call.sql.startsWith("UPDATE")) return call.params[2]
  return call.params[0]
}

function request(
  token: string | null,
  options: { method?: string; body?: unknown } = {}
): Request {
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  return new Request("https://rnui.dev/api/saved-demos", {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
}

describe("GET /api/saved-demos", () => {
  it("returns a Reader's own list in one primary-key read", async () => {
    const store = new Map([[UID_A, [IDA, IDB]]])
    const { d1Calls } = stubNetwork(store, publicJwk)

    const res = await GET(request(await mint(privateKey, UID_A)))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ids: [IDA, IDB] })
    // The read-count discipline, counted: one statement for the whole list,
    // however many Demos — never one read per Recording.
    expect(d1Calls).toHaveLength(1)
    expect(d1Calls[0].sql).toMatch(/^SELECT/)
    expect(d1Calls[0].params[0]).toBe(UID_A)
  })

  it("answers an empty list for a Reader who saved nothing", async () => {
    stubNetwork(new Map(), publicJwk)

    const res = await GET(request(await mint(privateKey, UID_A)))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ids: [] })
  })

  it("refuses an unsigned request without touching D1", async () => {
    const { d1Calls } = stubNetwork(new Map(), publicJwk)

    const res = await GET(request(null))

    expect(res.status).toBe(401)
    expect(d1Calls).toHaveLength(0)
  })

  it("refuses a forged token without touching D1", async () => {
    // Signed by a key that is NOT in the JWKS: minting your own token buys an
    // attacker nothing, and the refusal costs no D1 read.
    const { privateKey: attackerKey } = await signer()
    const { d1Calls } = stubNetwork(new Map(), publicJwk)

    const res = await GET(request(await mint(attackerKey, UID_A)))

    expect(res.status).toBe(401)
    expect(d1Calls).toHaveLength(0)
  })

  it("fails closed when Google's JWKS endpoint is unreachable", async () => {
    // Ticket 02's outage case, through the route: no cached-key fallback,
    // because falling back is how a token that should have been rejected gets
    // accepted. This is the failure the merge keeps the local copy against.
    //
    // A fresh module, because the file shares one key and its JWKS is warm by
    // now — a warm cache answering without fetching is correct behaviour, not
    // the outage. Cold cache plus dead network is the case that must refuse.
    const token = await mint(privateKey, UID_A)
    const fetching = vi.fn(async () => {
      throw new TypeError("fetch failed")
    })
    vi.stubGlobal("fetch", fetching)
    vi.resetModules()
    const { GET: coldGET } = await import("../app/api/saved-demos/route")

    const res = await coldGET(request(token))

    expect(res.status).toBe(401)
    expect(fetching).toHaveBeenCalled()
  })
})

describe("POST /api/saved-demos, the merge", () => {
  it("unions the browser's list with the account's, order stable", async () => {
    const store = new Map([[UID_A, [IDB, IDC]]])
    const { d1Calls } = stubNetwork(store, publicJwk)

    const res = await POST(
      request(await mint(privateKey, UID_A), {
        method: "POST",
        body: { ids: [IDA, IDB] },
      })
    )

    expect(res.status).toBe(200)
    // The account's order first, then whatever the browser adds. A merge that
    // reshuffles on every sign-in is one the Reader notices and stops trusting.
    await expect(res.json()).resolves.toEqual({ ids: [IDB, IDC, IDA] })
    expect(store.get(UID_A)).toEqual([IDB, IDC, IDA])
    // One read and one write for the whole merge, however many ids it carries.
    expect(d1Calls).toHaveLength(2)
  })

  it("costs a read and no write when there is nothing new", async () => {
    // The idempotent re-merge: the browser kept its copy (ADR-0013), so every
    // later sign-in merges again. Writes are the binding ceiling (ticket 05),
    // so the skipped write is the point of reading first.
    const store = new Map([[UID_A, [IDA]]])
    const { d1Calls } = stubNetwork(store, publicJwk)

    const res = await POST(
      request(await mint(privateKey, UID_A), {
        method: "POST",
        body: { ids: [IDA] },
      })
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ids: [IDA] })
    expect(d1Calls).toHaveLength(1)
    expect(d1Calls[0].sql).toMatch(/^SELECT/)
  })

  it("refuses a malformed id with nothing written", async () => {
    const store = new Map([[UID_A, [IDA]]])
    const { d1Calls } = stubNetwork(store, publicJwk)

    const res = await POST(
      request(await mint(privateKey, UID_A), {
        method: "POST",
        body: { ids: ["not-a-recording-id"] },
      })
    )

    expect(res.status).toBe(400)
    expect(store.get(UID_A)).toEqual([IDA])
    // The read happened; the write did not.
    expect(d1Calls).toHaveLength(1)
  })

  it("refuses a body without an ids array", async () => {
    const { d1Calls } = stubNetwork(new Map(), publicJwk)

    const res = await POST(
      request(await mint(privateKey, UID_A), {
        method: "POST",
        body: { ids: "01J9ZQ8N4P5R6S7T8U9V0ABCD" },
      })
    )

    expect(res.status).toBe(400)
    expect(d1Calls).toHaveLength(0)
  })

  it("refuses an unsigned merge without touching D1", async () => {
    const store = new Map([[UID_A, [IDA]]])
    const { d1Calls } = stubNetwork(store, publicJwk)

    const res = await POST(
      request(null, { method: "POST", body: { ids: [IDB] } })
    )

    expect(res.status).toBe(401)
    expect(d1Calls).toHaveLength(0)
    expect(store.get(UID_A)).toEqual([IDA])
  })
})

describe("POST and GET never touch another account's saved Demos", () => {
  it("a token for A reads and writes A's row only", async () => {
    const store = new Map([
      [UID_A, [IDA]],
      [UID_B, [IDB, IDC]],
    ])
    const { d1Calls } = stubNetwork(store, publicJwk)
    const token = await mint(privateKey, UID_A)

    const got = await GET(request(token))
    await expect(got.json()).resolves.toEqual({ ids: [IDA] })

    const posted = await POST(
      request(token, { method: "POST", body: { ids: [IDD] } })
    )
    await expect(posted.json()).resolves.toEqual({ ids: [IDA, IDD] })

    // B's list is byte-identical, and every statement the route sent was
    // scoped to A's verified uid — the uid came from the token, never from a
    // body field the caller could have named.
    expect(store.get(UID_B)).toEqual([IDB, IDC])
    for (const call of d1Calls) {
      expect(scopedUid(call)).toBe(UID_A)
    }
  })

  it("a token for B cannot see A's saves either", async () => {
    const store = new Map([[UID_A, [IDA, IDB, IDC]]])
    const { d1Calls } = stubNetwork(store, publicJwk)

    const res = await GET(request(await mint(privateKey, UID_B)))

    await expect(res.json()).resolves.toEqual({ ids: [] })
    expect(store.get(UID_A)).toEqual([IDA, IDB, IDC])
    for (const call of d1Calls) {
      expect(scopedUid(call)).toBe(UID_B)
    }
  })
})

describe("DELETE /api/saved-demos", () => {
  it("removes one Demo and leaves the rest", async () => {
    const store = new Map([[UID_A, [IDA, IDB]]])
    stubNetwork(store, publicJwk)

    const res = await DELETE(
      request(await mint(privateKey, UID_A), {
        method: "DELETE",
        body: { recordingId: IDA },
      })
    )

    expect(res.status).toBe(200)
    expect(store.get(UID_A)).toEqual([IDB])
  })

  it("is a no-op on a Demo never saved, not an error", async () => {
    // The caller is reacting to a click, and a double-click must not error.
    const store = new Map([[UID_A, [IDA]]])
    stubNetwork(store, publicJwk)

    const res = await DELETE(
      request(await mint(privateKey, UID_A), {
        method: "DELETE",
        body: { recordingId: IDB },
      })
    )

    expect(res.status).toBe(200)
    expect(store.get(UID_A)).toEqual([IDA])
  })

  it("refuses an unsigned removal without touching D1", async () => {
    const store = new Map([[UID_A, [IDA]]])
    const { d1Calls } = stubNetwork(store, publicJwk)

    const res = await DELETE(
      request(null, { method: "DELETE", body: { recordingId: IDA } })
    )

    expect(res.status).toBe(401)
    expect(d1Calls).toHaveLength(0)
    expect(store.get(UID_A)).toEqual([IDA])
  })
})

describe("the vocabulary", () => {
  it("never calls the signed-in person a user, member, or account", async () => {
    // CONTEXT.md: the signed-in person is a Reader. The route's refusals are
    // the copy an anonymous visitor actually reads, so the sweep runs over
    // real response bodies rather than a hard-coded list a copy edit could
    // silently leave behind.
    stubNetwork(new Map(), publicJwk)

    const bodies: string[] = []
    const token = await mint(privateKey, UID_A)
    bodies.push(
      JSON.stringify(await (await GET(request(null))).json()),
      JSON.stringify(
        await (
          await POST(
            request(token, {
              method: "POST",
              body: { ids: "01J9ZQ8N4P5R6S7T8U9V0ABCD" },
            })
          )
        ).json()
      ),
      JSON.stringify(
        await (
          await POST(
            request(token, {
              method: "POST",
              body: { ids: ["nope"] },
            })
          )
        ).json()
      ),
      JSON.stringify(
        await (
          await DELETE(
            request(token, {
              method: "DELETE",
              body: { recordingId: "nope" },
            })
          )
        ).json()
      ),
      SAVE_FAILED
    )
    const copy = bodies.join(" ")
    expect(copy).not.toMatch(/\buser\b/i)
    expect(copy).not.toMatch(/\bmember\b/i)
    expect(copy).not.toMatch(/\baccount\b/i)
  })
})
