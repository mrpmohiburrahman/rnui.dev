import { describe, expect, it } from "vitest"

import { SIGNUP_DISCLOSURE, SIGNUP_HEADING } from "../lib/sender-identity"
import {
  createConfirmSubscription,
  isUndeliverableByDefinition,
  type ConsentStore,
  type PendingSignup,
} from "../lib/subscription-consent"

// notify-and-preview ticket 06 asks for one runnable check over the token path:
// an unconfirmed address never reaches the audience, and a token cannot be
// replayed. Both are properties of ordering, not of Firestore, so the store is
// faked — the same split lib/counters.ts makes so that a counter can be tested
// without Firebase.
//
// Every address below is invented, per the same rule as scrub-email-list.test.ts:
// this repo is public and the real 29 are never committed.

// `id` IS the token — the production store keys documents by it so the confirm
// read is a `get` of a secret rather than a `list` over every Subscriber. The
// fake models that, or it would be testing a shape the real store no longer has.
type Row = { id: string; email: string; confirmed: boolean }

/** Firestore and Resend in about twenty lines, with the writes observable. */
function fakeStore(rows: Row[]) {
  const audience: string[] = []
  const store: ConsentStore = {
    async findPending(token) {
      const row = rows.find((r) => r.id === token)
      if (!row || row.confirmed) return null
      return { id: row.id, email: row.email } satisfies PendingSignup
    },
    async confirm(id) {
      rows.find((r) => r.id === id)!.confirmed = true
    },
    async addToAudience(email) {
      audience.push(email)
    },
  }
  return { store, audience, rows }
}

describe("confirmSubscription", () => {
  it("puts a confirmed address in the audience exactly once", async () => {
    const { store, audience, rows } = fakeStore([
      { id: "t1", email: "someone@rnui.example", confirmed: false },
    ])
    const confirm = createConfirmSubscription(store)

    await expect(confirm("t1")).resolves.toBe(true)
    expect(audience).toEqual(["someone@rnui.example"])
    expect(rows[0].confirmed).toBe(true)
  })

  // The bullet in full: "an unconfirmed address never enters the Resend
  // audience until confirmed". A token nobody was ever issued is the cheapest
  // way to hold a pending row and try to make it a Subscriber anyway.
  it("leaves an unconfirmed address out of the audience", async () => {
    const { store, audience, rows } = fakeStore([
      { id: "t1", email: "someone@rnui.example", confirmed: false },
    ])
    const confirm = createConfirmSubscription(store)

    await expect(confirm("not-a-real-token")).resolves.toBe(false)
    expect(audience).toEqual([])
    expect(rows[0].confirmed).toBe(false)
  })

  // The replay guard is the `confirmed` flag, which `findPending` refuses on.
  // Without it a forwarded or logged confirmation link stays live forever.
  it("refuses the same token a second time", async () => {
    const { store, audience } = fakeStore([
      { id: "t1", email: "someone@rnui.example", confirmed: false },
    ])
    const confirm = createConfirmSubscription(store)

    await expect(confirm("t1")).resolves.toBe(true)
    await expect(confirm("t1")).resolves.toBe(false)
    expect(audience).toEqual(["someone@rnui.example"])
  })

  // Order is the decision, not an accident: consent is recorded before the
  // audience write, so a Resend outage cannot leave an address in the sending
  // audience with no consent record behind it.
  it("records consent before the audience write, so a failing send cannot outrun it", async () => {
    const rows: Row[] = [
      { id: "t1", email: "someone@rnui.example", confirmed: false },
    ]
    const base = fakeStore(rows)
    const confirm = createConfirmSubscription({
      ...base.store,
      async addToAudience() {
        throw new Error("Resend is down")
      },
    })

    await expect(confirm("t1")).rejects.toThrow(/Resend is down/)
    expect(rows[0].confirmed).toBe(true)
  })
})

// tests/e2e/undrawn-routes.spec.ts submits an @example.com address on every
// Playwright run and .env.local carries a live RESEND_API_KEY, so without this
// the suite hard-bounces a sending domain that has not sent its first Digest.
describe("isUndeliverableByDefinition", () => {
  it("catches the reserved names that can never receive mail", () => {
    for (const address of [
      "subscriber@example.com",
      "a@example.net",
      "a@example.org",
      "a@mail.example.com",
      "a@anything.test",
      "a@anything.invalid",
      "a@localhost",
      "A@Example.COM",
    ]) {
      expect(isUndeliverableByDefinition(address)).toBe(true)
    }
  })

  it("leaves a deliverable address alone", () => {
    for (const address of [
      "someone@gmail.com",
      "someone@rnui.dev",
      // Not reserved: the reserved name is the whole registrable domain, and
      // "examples.com" or "myexample.com" are ordinary domains someone owns.
      "someone@examples.com",
      "someone@myexample.com",
      "someone@example.co.uk",
    ]) {
      expect(isUndeliverableByDefinition(address)).toBe(false)
    }
  })
})

// The consent string is stored on every record and rendered by the form. If the
// two ever diverge the stored record stops being evidence of anything, so the
// pieces the form composes are pinned to the joined string here.
describe("the signup disclosure", () => {
  it("carries ECPR s.4's four elements", () => {
    expect(SIGNUP_DISCLOSURE).toContain("MD. MOHIBUR RAHMAN")
    expect(SIGNUP_DISCLOSURE).toContain(
      "Halima Nagar, Cumilla 3502, Bangladesh"
    )
    expect(SIGNUP_DISCLOSURE).toContain("hello@rnui.dev")
    expect(SIGNUP_DISCLOSURE).toContain("Unsubscribe any time")
  })

  it("uses the domain's own vocabulary, not the words CONTEXT.md avoids", () => {
    const copy = `${SIGNUP_HEADING} ${SIGNUP_DISCLOSURE}`.toLowerCase()
    for (const avoided of ["animation", "newsletter", "entry", "item"]) {
      expect(copy).not.toContain(avoided)
    }
    expect(SIGNUP_DISCLOSURE).toContain("Recordings")
  })
})
