import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  addContact,
  FROM,
  refuseSendReason,
  REPLY_TO,
} from "../scripts/resend-broadcast"

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
      refuseSendReason({ data: [{ email: TO }], has_more: false }, TO)
    ).toBeNull()
  })

  it("allows a send to an empty audience", () => {
    expect(refuseSendReason({ data: [], has_more: false }, TO)).toBeNull()
  })

  it("refuses when anybody else is in the audience", () => {
    const page = {
      data: [{ email: TO }, { email: "survivor@example.com" }],
      has_more: false,
    }
    expect(refuseSendReason(page, TO)).toMatch(/1 other contact/)
  })

  // The case that motivated lifting this out. `GET /audiences/{id}/contacts` is
  // paginated and the response carries `has_more`; the first version read only
  // `data` and would have sent on a truncated page that happened to show the
  // maintainer first. A page cannot prove what is on the pages after it.
  it("refuses when the page is truncated, even if it looks clean", () => {
    const page = { data: [{ email: TO }], has_more: true }
    expect(refuseSendReason(page, TO)).toMatch(/more contacts than one page/)
  })

  // Resend echoes back whatever case the address was created with, and the
  // comparison is an equality test on a safety path, so it normalises both ends.
  it("treats a differently-cased address as the same recipient", () => {
    const page = { data: [{ email: " Maintainer@Example.COM " }] }
    expect(refuseSendReason(page, TO)).toBeNull()
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

describe("addContact", () => {
  const realFetch = globalThis.fetch
  const realKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key"
  })

  afterEach(() => {
    globalThis.fetch = realFetch
    process.env.RESEND_API_KEY = realKey
  })

  const respondWith = (status: number, body: unknown) => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify(body), { status })) as typeof fetch
  }

  it("swallows a 409, because a duplicate address is a no-op here", async () => {
    respondWith(409, { message: "Contact already exists" })
    await expect(
      addContact("aud_1", "someone@example.com")
    ).resolves.toBeUndefined()
  })

  // The defect this replaced: the 409 was matched as `String(err).includes("409")`
  // against a message that interpolates the request path and the response body.
  // An audience id with hex `409` anywhere in it turned every failure — 500, 429,
  // a bad key — into a silent no-op, so the contact would be missing and the send
  // would go out believing it was there.
  it("rethrows a 500 raised against an id that contains 409", async () => {
    respondWith(500, { message: "internal error" })
    await expect(
      addContact("409e0a1c-0000-4000-8000-000000000409", "someone@example.com")
    ).rejects.toThrow(/500/)
  })
})
