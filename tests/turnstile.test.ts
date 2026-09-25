import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  interpretSiteverify,
  verifyTurnstile,
  type SiteverifyResponse,
} from "../lib/turnstile"

// public-submissions ticket 07. Two things are worth pinning here, and the
// second is the one nobody misses until it matters:
//
//   1. What counts as a pass. `interpretSiteverify` is the whole decision and it
//      is pure, so every branch is cheap to hold still.
//   2. That an unconfigured endpoint REFUSES. The symptom of this being wrong is
//      "the form works", which is exactly why it needs a test rather than a
//      reviewer.
//
// Deliberately not tested here: a real token against the real Siteverify. That
// needs a browser to solve a challenge, so it belongs in the integration pass
// against ticket 05's form, not in a unit suite that must stay offline.

const HOSTNAMES = new Set(["rnui.dev", "localhost"])

/** A response shaped like the one Siteverify actually returns on success. */
const passing = (): SiteverifyResponse => ({
  success: true,
  action: "submit",
  hostname: "rnui.dev",
  "error-codes": [],
})

describe("interpretSiteverify", () => {
  it("accepts a token for our action on an allowed hostname", () => {
    expect(interpretSiteverify(passing(), HOSTNAMES)).toEqual({ ok: true })
  })

  it("refuses when Cloudflare rejects the token, and keeps Cloudflare's reason", () => {
    expect(
      interpretSiteverify(
        { success: false, "error-codes": ["timeout-or-duplicate"] },
        HOSTNAMES
      )
    ).toEqual({ ok: false, reason: "timeout-or-duplicate" })
  })

  it("refuses a token minted for a different action", () => {
    // A token minted for another surface is a perfectly real token. Accepting it
    // would let a challenge solved on one form be spent on another.
    expect(
      interpretSiteverify({ ...passing(), action: "signup" }, HOSTNAMES)
    ).toEqual({ ok: false, reason: "action-mismatch" })
  })

  it("refuses a token minted on a hostname that is not ours", () => {
    expect(
      interpretSiteverify({ ...passing(), hostname: "evil.example" }, HOSTNAMES)
    ).toEqual({ ok: false, reason: "hostname-mismatch" })
  })

  it("refuses a success carrying no hostname rather than trusting it", () => {
    // Siteverify always sends `hostname`. A missing one means the response is
    // not the shape this code believes it is, and `undefined` must not read as
    // "allowed" — which is what a bare `hostnames.has(result.hostname!)` would
    // do if the truthiness guard were ever tidied away.
    expect(
      interpretSiteverify({ ...passing(), hostname: undefined }, HOSTNAMES)
    ).toEqual({ ok: false, reason: "hostname-mismatch" })
  })

  it("refuses everything when the allowlist is empty", () => {
    expect(interpretSiteverify(passing(), new Set())).toEqual({
      ok: false,
      reason: "hostname-mismatch",
    })
  })
})

describe("verifyTurnstile fails closed when unconfigured", () => {
  // Restored rather than deleted, and `undefined` handled explicitly: assigning
  // `undefined` to process.env writes the STRING "undefined", which would leave a
  // plausible-looking secret behind for the next test.
  const saved = {
    secret: process.env.TURNSTILE_SECRET_KEY,
    hostnames: process.env.TURNSTILE_HOSTNAMES,
  }

  function restore(key: string, value: string | undefined) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }

  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = "a-secret"
    process.env.TURNSTILE_HOSTNAMES = "rnui.dev"
  })

  afterEach(() => {
    restore("TURNSTILE_SECRET_KEY", saved.secret)
    restore("TURNSTILE_HOSTNAMES", saved.hostnames)
  })

  it("refuses without a secret instead of falling through to the handler", async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    await expect(verifyTurnstile("a-token")).resolves.toEqual({
      ok: false,
      reason: "not-configured",
    })
  })

  it("refuses when no hostname would ever be checked", async () => {
    delete process.env.TURNSTILE_HOSTNAMES
    await expect(verifyTurnstile("a-token")).resolves.toEqual({
      ok: false,
      reason: "not-configured",
    })
  })

  it("refuses an empty token before spending a request on it", async () => {
    // No fetch is attempted, which is the point: a form submitted before the
    // widget rendered sends "", and that must not cost a Siteverify round trip.
    await expect(verifyTurnstile("")).resolves.toEqual({
      ok: false,
      reason: "missing-token",
    })
  })
})
