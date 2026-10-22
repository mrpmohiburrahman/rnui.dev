import { describe, expect, it } from "vitest"

import {
  renderBroadcastDigest,
  renderDigest,
  renderMaintainerDigest,
  SIGNUP_DATE_TOKEN,
  UNSUBSCRIBE_TOKEN,
} from "../lib/digest"
import { refuseSignupDateProperty } from "../lib/digest-stages"
import { CONTACT_EMAIL } from "../lib/sender-identity"

const recordings = [
  {
    id: "01AAAAAAAAAAAAAAAAAAAAAAAA",
    caption: "A Recording",
    contributor: "A Contributor",
    category: "Misc" as const,
    created_at: "2025-06-01T00:00:00.000Z",
    demoPath: "demo/misc/a.mp4",
    posterPath: "thumbnails/misc/a.avif",
    source: "https://example.com/source",
  },
]

describe("renderBroadcastDigest", () => {
  it("keeps a contact property for the signup date and Resend's unsubscribe token", () => {
    const { html } = renderBroadcastDigest({
      recordings,
      unsubscribeUrl: UNSUBSCRIBE_TOKEN,
    })

    expect(html).toContain(
      `You signed up for the rnui.dev Digest at rnui.dev on ${SIGNUP_DATE_TOKEN}.`
    )
    expect(html).toContain(UNSUBSCRIBE_TOKEN)
    expect(html).not.toContain("{{SIGNUP_DATE}}")
    expect(html).toContain(CONTACT_EMAIL)
    expect(html).not.toContain("preview.rnui.dev")
  })

  it("does not invent a date when the property is missing", () => {
    const { html } = renderBroadcastDigest({
      recordings,
      unsubscribeUrl: UNSUBSCRIBE_TOKEN,
    })
    expect(html).not.toContain("30 December 2024")
    expect(html).not.toContain("1 January 1970")
  })
})

describe("renderMaintainerDigest", () => {
  it("uses an honest opening and the same unsubscribe token", () => {
    const { html } = renderMaintainerDigest({
      recordings,
      unsubscribeUrl: UNSUBSCRIBE_TOKEN,
    })

    expect(html).toContain("You are receiving this because you run rnui.dev.")
    expect(html).not.toContain("You signed up")
    expect(html).not.toContain(SIGNUP_DATE_TOKEN)
    expect(html).toContain(UNSUBSCRIBE_TOKEN)
    expect(html).toContain(CONTACT_EMAIL)
    expect(html).toContain("1 June 2025")
  })
})

describe("renderDigest", () => {
  it("still interpolates a real signup date", () => {
    const { html } = renderDigest({
      recordings,
      signupDate: "2024-12-30T09:38:23.316Z",
      unsubscribeUrl: UNSUBSCRIBE_TOKEN,
    })
    expect(html).toContain("on 30 December 2024.")
    expect(html).not.toContain(SIGNUP_DATE_TOKEN)
  })
})

describe("refuseSignupDateProperty", () => {
  it("refuses a missing property and the fallback, and accepts a Digest date", () => {
    expect(refuseSignupDateProperty(undefined)).toBe("signup_date is missing")
    expect(refuseSignupDateProperty("a date we could not read")).toBe(
      "signup_date is missing"
    )
    expect(refuseSignupDateProperty("2024-12-30")).toBe(
      "signup_date is not a Digest date"
    )
    expect(refuseSignupDateProperty("30 December 2024")).toBeNull()
  })
})
