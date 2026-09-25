import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  deleteSubmission,
  encodeKey,
  putSubmission,
  submissionBucket,
  submissionKey,
} from "../lib/submission-storage"

// public-submissions ticket 07. Three things are worth holding still here:
//
//   1. **The key scheme.** Ticket 08 wrote `<ulid>.mp4` down and nothing enforces
//      it. A key that drifts is not a crash — it is a bucket whose contents stop
//      sorting by arrival, discovered much later and only by a person.
//   2. **That unconfigured storage refuses.** Same reason tests/turnstile.test.ts
//      covers its unconfigured paths: the symptom of this being wrong is "it
//      worked", which no reviewer catches.
//   3. **The request actually sent.** The upload goes through an endpoint
//      Cloudflare's own *Upload objects* page never mentions, so its shape is
//      asserted here rather than rediscovered in production.

const ENDPOINT =
  "https://api.cloudflare.com/client/v4/accounts/acct-123/r2/buckets/rnui-submissions/objects"

const saved = {
  account: process.env.CLOUDFLARE_ACCOUNT_ID,
  token: process.env.CLOUDFLARE_R2_TOKEN,
  bucket: process.env.R2_SUBMISSIONS_BUCKET,
}

function restore(key: string, value: string | undefined) {
  // `undefined` deleted rather than assigned, because assigning it writes the
  // STRING "undefined" and leaves a plausible-looking value behind. Same trap
  // tests/turnstile.test.ts documents.
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

beforeEach(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct-123"
  process.env.CLOUDFLARE_R2_TOKEN = "tok-456"
  delete process.env.R2_SUBMISSIONS_BUCKET
})

afterEach(() => {
  restore("CLOUDFLARE_ACCOUNT_ID", saved.account)
  restore("CLOUDFLARE_R2_TOKEN", saved.token)
  restore("R2_SUBMISSIONS_BUCKET", saved.bucket)
  vi.unstubAllGlobals()
})

/** A fetch that answers once with `status`, recording how it was called. */
function stubFetch(status = 200, body = "") {
  const mock = vi.fn().mockResolvedValue(new Response(body, { status }))
  vi.stubGlobal("fetch", mock)
  return mock
}

type Call = {
  url: string
  init: { method: string; headers: Record<string, string>; body: unknown }
}

function first(mock: ReturnType<typeof stubFetch>): Call {
  const [url, init] = mock.mock.calls[0] as [string, Call["init"]]
  return { url, init }
}

describe("submissionKey", () => {
  it("is a Crockford-base32 ULID and .mp4, with nothing around it", () => {
    // The alphabet is asserted, not just the length: a UUID would pass a length
    // check and silently break the ordering the next test pins.
    expect(submissionKey()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}\.mp4$/)
  })

  it("carries no prefix and no slash", () => {
    // Ticket 08: the separate bucket is what removes the need for prefix scoping,
    // so a slash here would be a boundary the bucket already draws.
    expect(submissionKey()).not.toContain("/")
  })

  it("does not repeat", () => {
    const keys = new Set(Array.from({ length: 500 }, () => submissionKey()))
    expect(keys.size).toBe(500)
  })

  it("sorts by arrival, which is the whole reason it is a ULID", () => {
    // Once the 30-day rule has been deleting objects for months, this ordering is
    // the only one left in a bucket listing.
    const earlier = submissionKey(new Date("2026-09-25T12:00:00.000Z"))
    const later = submissionKey(new Date("2026-09-26T12:00:00.000Z"))
    expect(earlier < later).toBe(true)
  })
})

describe("encodeKey", () => {
  it("keeps a slash as a separator and escapes everything else", () => {
    // The rule scripts/open-submission.ts and scripts/publish-assets.ts also
    // state. A key this code mints contains neither character; this is the rule
    // holding for a key a human pasted.
    expect(encodeKey("submissions/a b.mp4")).toBe("submissions/a%20b.mp4")
    expect(encodeKey("a?b#c.mp4")).toBe("a%3Fb%23c.mp4")
  })
})

describe("submissionBucket", () => {
  it("defaults to the one correct bucket", () => {
    expect(submissionBucket()).toBe("rnui-submissions")
  })

  it("is overridable for a fork or a staging bucket", () => {
    process.env.R2_SUBMISSIONS_BUCKET = "rnui-submissions-staging"
    expect(submissionBucket()).toBe("rnui-submissions-staging")
  })
})

describe("putSubmission", () => {
  it("PUTs the bytes to the REST endpoint with the Bearer token", async () => {
    const mock = stubFetch()
    // A genuine ArrayBuffer, built rather than borrowed from a Uint8Array: that
    // `.buffer` is `ArrayBufferLike`, which may be a SharedArrayBuffer, and the
    // signature here is deliberately the narrower type that `File.arrayBuffer()`
    // actually returns.
    const bytes = new ArrayBuffer(4)
    new Uint8Array(bytes).set([1, 2, 3, 4])
    await putSubmission("01ABC.mp4", bytes)

    const { url, init } = first(mock)
    expect(url).toBe(`${ENDPOINT}/01ABC.mp4`)
    expect(init.method).toBe("PUT")
    expect(init.headers.Authorization).toBe("Bearer tok-456")
    expect(init.headers["Content-Type"]).toBe("video/mp4")
    // Identity, not a copy: the handler has the bytes in hand and nothing here
    // should be re-encoding them.
    expect(init.body).toBe(bytes)
  })

  it("follows R2_SUBMISSIONS_BUCKET into the URL", async () => {
    process.env.R2_SUBMISSIONS_BUCKET = "rnui-submissions-staging"
    const mock = stubFetch()
    await putSubmission("01ABC.mp4", new ArrayBuffer(0))
    expect(first(mock).url).toContain(
      "/buckets/rnui-submissions-staging/objects/"
    )
  })

  it("throws with the status and the body, so a failure is diagnosable", async () => {
    stubFetch(403, '{"success":false,"errors":[{"code":10000}]}')
    await expect(
      putSubmission("01ABC.mp4", new ArrayBuffer(0))
    ).rejects.toThrow(/HTTP 403 .*10000/)
  })

  it("refuses rather than writing somewhere else when the account is unset", async () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID
    const mock = stubFetch()
    await expect(
      putSubmission("01ABC.mp4", new ArrayBuffer(0))
    ).rejects.toThrow(/CLOUDFLARE_ACCOUNT_ID/)
    expect(mock).not.toHaveBeenCalled()
  })

  it("refuses when the token is unset", async () => {
    delete process.env.CLOUDFLARE_R2_TOKEN
    const mock = stubFetch()
    await expect(
      putSubmission("01ABC.mp4", new ArrayBuffer(0))
    ).rejects.toThrow(/CLOUDFLARE_R2_TOKEN/)
    expect(mock).not.toHaveBeenCalled()
  })
})

describe("deleteSubmission", () => {
  it("DELETEs the one object, Bearer-authenticated", async () => {
    const mock = stubFetch()
    await deleteSubmission("01ABC.mp4")

    const { url, init } = first(mock)
    expect(url).toBe(`${ENDPOINT}/01ABC.mp4`)
    expect(init.method).toBe("DELETE")
    expect(init.headers.Authorization).toBe("Bearer tok-456")
  })

  it("throws on a 404 rather than reporting a clean-up that did not happen", async () => {
    // The caller logs its failure as an ORPHAN, and "already gone" must not read
    // the same as "could not reach R2".
    stubFetch(404, "not found")
    await expect(deleteSubmission("01ABC.mp4")).rejects.toThrow(/HTTP 404/)
  })
})
