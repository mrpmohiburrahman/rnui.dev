import { describe, expect, it } from "vitest"

import { FROM, refuseSendReason, REPLY_TO } from "../scripts/resend-broadcast"

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
  it("is the address ticket 04 settled", () => {
    expect(FROM).toBe("rnui.dev <digest@mail.rnui.dev>")
    expect(REPLY_TO).toBe("hello@rnui.dev")
  })

  it("sends from the subdomain, never the apex", () => {
    expect(FROM).toContain("@mail.rnui.dev")
  })
})
