import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ensureContact, subscribeContact } from "../lib/resend"
import { FROM, REPLY_TO } from "../lib/sender-identity"
import { refuseSendReason } from "../scripts/resend-broadcast"

// The send guard from notify-and-preview ticket 05, lifted out of `main()` so it
// can be tested without the Resend API.
//
// What it defends: `pnpm broadcast:test` creates a Resend *broadcast*, and a
// broadcast goes to the whole audience rather than to one address. Today the
// "General" audience holds only the maintainer, so the test send is harmless.
// Tickets 09 and 11 populate an audience from the 29 scrub survivors, and from
// that moment the same command mails all of them a message whose subject says
// "test send". One complaint in 29 is 3.4%, roughly eleven times Google's 0.3%
// threshold — enough to cost the sending reputation this ticket exists to build.
//
// Every address below is invented, per the same rule as scrub-email-list.test.ts:
// this repo is public and the real 29 are never committed.

const TO = "maintainer@example.com"

describe("refuseSendReason", () => {
  it("allows a send when the audience is exactly the test recipient", () => {
    expect(
      refuseSendReason(
        { data: [{ email: TO, unsubscribed: false }], has_more: false },
        TO
      )
    ).toBeNull()
  })

  it("allows a send to an empty audience", () => {
    expect(refuseSendReason({ data: [], has_more: false }, TO)).toBeNull()
  })

  it("refuses when anybody else is in the audience", () => {
    const page = {
      data: [
        { email: TO, unsubscribed: false },
        { email: "survivor@example.com", unsubscribed: false },
      ],
      has_more: false,
    }
    expect(refuseSendReason(page, TO)).toMatch(/1 other contact/)
  })

  // The case that motivated lifting this out. `GET /audiences/{id}/contacts` is
  // paginated and the response carries `has_more`; the first version read only
  // `data` and would have sent on a truncated page that happened to show the
  // maintainer first. A page cannot prove what is on the pages after it.
  it("refuses when the page is truncated, even if it looks clean", () => {
    const page = { data: [{ email: TO, unsubscribed: false }], has_more: true }
    expect(refuseSendReason(page, TO)).toMatch(/more contacts than one page/)
  })

  // Resend echoes back whatever case the address was created with, and the
  // comparison is an equality test on a safety path, so it normalises both ends.
  it("treats a differently-cased address as the same recipient", () => {
    const page = {
      data: [{ email: " Maintainer@Example.COM ", unsubscribed: false }],
    }
    expect(refuseSendReason(page, TO)).toBeNull()
  })

  // Resend fans a broadcast out to the subscribed contacts only, so this send
  // would deliver nothing while still reporting success (ticket 08).
  it("refuses when the test recipient itself has unsubscribed", () => {
    const page = { data: [{ email: TO, unsubscribed: true }], has_more: false }
    expect(refuseSendReason(page, TO)).toMatch(/reach nobody/)
  })
})

// Ticket 04 settled these permanently and three tickets paste them. Changing the
// From: address after the first send resets sender reputation, so it is pinned
// here rather than left to a careless edit.
describe("sender identity", () => {
  // The exact strings carry decision 8 with them — mail.rnui.dev, never the
  // apex — so pinning them pins that too.
  it("is the address ticket 04 settled", () => {
    expect(FROM).toBe("rnui.dev <digest@mail.rnui.dev>")
    expect(REPLY_TO).toBe("hello@rnui.dev")
  })
})

// Ticket 08. The old contract here was "a duplicate address is a no-op, because
// Resend 409s" — and it is not true. Measured 2026-09-26 against the live API:
// `POST /audiences/{id}/contacts` is an *upsert* that answers **201** for an
// address that already exists, and it writes `unsubscribed: false` whenever that
// field is absent from the body. So the old `addContact` re-subscribed anyone who
// had opted out, and its 409 catch — the whole defence — never ran.
describe("the contact write path", () => {
  const realFetch = globalThis.fetch
  const realKey = process.env.RESEND_API_KEY
  let calls: { method: string; path: string; body?: string }[]

  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key"
    calls = []
  })

  afterEach(() => {
    globalThis.fetch = realFetch
    process.env.RESEND_API_KEY = realKey
  })

  /** Records every call, and answers by method so a GET and a POST can differ. */
  const route = (
    answer: (method: string, path: string) => { status: number; body: unknown }
  ) => {
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      const path = new URL(String(url)).pathname
      const method = init?.method ?? "GET"
      calls.push({ method, path, body: init?.body as string | undefined })
      const { status, body } = answer(method, path)
      return new Response(JSON.stringify(body), { status })
    }) as typeof fetch
  }

  // The invariant the whole ticket rests on: an import cannot touch an address
  // that is already there, so it cannot clear the flag.
  it("ensureContact never writes over a contact that already exists", async () => {
    route(() => ({
      status: 200,
      body: { email: "someone@example.com", unsubscribed: true },
    }))
    await ensureContact("aud_1", "someone@example.com")
    expect(calls.map((c) => c.method)).toEqual(["GET"])
  })

  it("ensureContact creates the contact when it is absent", async () => {
    route((method) =>
      method === "GET"
        ? { status: 404, body: { message: "not found" } }
        : { status: 201, body: { id: "c1" } }
    )
    await ensureContact("aud_1", "someone@example.com")
    expect(calls.map((c) => c.method)).toEqual(["GET", "POST"])
  })

  // The one caller allowed to clear the flag, and it is the confirmation route.
  it("subscribeContact posts unsubscribed:false, for the confirmation path", async () => {
    route(() => ({ status: 201, body: { id: "c1" } }))
    await subscribeContact("aud_1", "someone@example.com")
    expect(calls[0].method).toBe("POST")
    expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
      email: "someone@example.com",
      unsubscribed: false,
    })
  })

  // Still matched on the status number rather than on text: the message
  // interpolates the request path, so an audience id holding the digits `409`
  // would otherwise turn every failure into a silent no-op.
  it("rethrows a failure that is not a 404", async () => {
    route(() => ({ status: 500, body: { message: "internal error" } }))
    await expect(
      ensureContact(
        "409e0a1c-0000-4000-8000-000000000409",
        "someone@example.com"
      )
    ).rejects.toThrow(/500/)
  })
})
