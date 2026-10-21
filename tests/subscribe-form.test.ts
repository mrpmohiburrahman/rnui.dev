import { describe, expect, it, vi } from "vitest"

import {
  SUBMITTED_ADDRESS_KEY,
  submitSubscription,
} from "../lib/subscribe-form"

// subscribe-popup ticket 10. The footer form, /subscribe and the popup all go
// through this one call, so the Reader token reaches subscribeEmail from every
// capture surface. tests/subscribe-popup.test.ts covers the popup's path through
// it with the popup's own adapters; this file pins the call itself.

function form(email = "reader@example.test") {
  const data = new FormData()
  data.set("email", email)
  return data
}

describe("submitSubscription", () => {
  it("forwards a signed-in Reader's token to the subscribe action", async () => {
    const data = form()
    const subscribeEmail = vi.fn(async () => ({ ok: true as const }))
    const result = await submitSubscription(data, {
      getReaderToken: async () => "reader-token",
      subscribeEmail,
    })
    expect(result).toEqual({ ok: true })
    expect(subscribeEmail).toHaveBeenCalledExactlyOnceWith(data, "reader-token")
  })

  it("submits with no token when nobody is signed in", async () => {
    const data = form()
    const subscribeEmail = vi.fn(async () => ({ ok: true as const }))
    await submitSubscription(data, {
      getReaderToken: async () => null,
      subscribeEmail,
    })
    expect(subscribeEmail).toHaveBeenCalledExactlyOnceWith(data, null)
  })

  it("returns the action's refusal unchanged", async () => {
    const refusal = { ok: false as const, message: "Enter a valid email address" }
    const result = await submitSubscription(form("invalid"), {
      getReaderToken: async () => "reader-token",
      subscribeEmail: async () => refusal,
    })
    expect(result).toBe(refusal)
  })

  it("answers with a retry message when the Reader token cannot be fetched", async () => {
    // getIdToken rejects offline or on a revoked session. Before this the two
    // forms never touched auth, so a rejection here must not become a silent
    // no-op that leaves the address in the field with nothing said.
    const subscribeEmail = vi.fn(async () => ({ ok: true as const }))
    const result = await submitSubscription(form(), {
      getReaderToken: async () => {
        throw new Error("network")
      },
      subscribeEmail,
    })
    expect(result).toEqual({
      ok: false,
      message: "Could not submit your address. Try again.",
    })
    expect(subscribeEmail).not.toHaveBeenCalled()
  })

  it("answers with the same retry message when the action itself throws", async () => {
    const result = await submitSubscription(form(), {
      getReaderToken: async () => null,
      subscribeEmail: async () => {
        throw new Error("server action unreachable")
      },
    })
    expect(result).toEqual({
      ok: false,
      message: "Could not submit your address. Try again.",
    })
  })

  it("keeps the browser's submitted-address key spelled as it always was", () => {
    // Renaming it would show the form again to everyone who already signed up
    // (components/newsletter-form.tsx), and the popup reads the same string.
    expect(SUBMITTED_ADDRESS_KEY).toBe("newsletterSubscribed")
  })
})
