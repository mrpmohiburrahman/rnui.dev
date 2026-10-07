import { describe, expect, it } from "vitest"

import {
  READER_PROVIDERS,
  readerErrorMessage,
  readerInitial,
} from "../hooks/use-reader"

// sign-in-to-save ticket 06: the nav sign-in's three load-bearing facts that a
// unit test can reach. Rendering needs a DOM the node runner has not got, so
// what this file pins is the contract the render depends on: which doors, in
// which order, what a failure says, and whose letter is on the avatar.

describe("the provider order", () => {
  it("ships both providers, GitHub first", () => {
    // Ticket 01: Google's consent screen shows the Firebase project id, not
    // rnui.dev, until the display-name rename is confirmed to propagate.
    // GitHub has neither problem, so it leads. Reordering this array is the
    // whole of that fallback — a UI ordering change, never a provider change.
    expect([...READER_PROVIDERS]).toEqual(["github", "google"])
  })

  it("is exactly two providers, never email and password", () => {
    // Map constraint, not a preference: Email/Password stays off in the
    // console, and a third entry here is where a code path for it would start.
    expect(READER_PROVIDERS).toHaveLength(2)
    expect(READER_PROVIDERS).not.toContain("email")
    expect(READER_PROVIDERS).not.toContain("password")
  })
})

describe("the avatar letter", () => {
  it("is the display name's first character, verbatim", () => {
    // Ticket 04's rule: `displayName.charAt(0)`, no transform. Uppercasing
    // here would "fix" a name the provider owns, and the letter is
    // display-only anyway (CONTEXT.md).
    expect(readerInitial("Rafiq", "rafiq@fastmail.com")).toBe("R")
    expect(readerInitial("rafiq", null)).toBe("r")
  })

  it("falls back to the email when the provider gave no name", () => {
    expect(readerInitial(null, "rafiq@fastmail.com")).toBe("r")
  })

  it("is empty when there is nothing to show — which is the signed-out state", () => {
    // Both null means signed out, and signed out draws the person glyph, not
    // an avatar. An eager "?" here would be a third state the nav never
    // renders.
    expect(readerInitial(null, null)).toBe("")
  })
})

describe("the failure copy", () => {
  it("hands the account-exists error to ticket 08, in the Reader's words", () => {
    // With "one account per email address" on, this error carries the pending
    // credential ticket 08 links with. Until that ticket lands, the message
    // must point at the other door — a dead end with an error toast is the
    // regression ticket 08 exists to prevent.
    const message = readerErrorMessage(
      "auth/account-exists-with-different-credential"
    )
    expect(message).toMatch(/other provider/)
    expect(message).not.toMatch(/account-exists-with-different-credential/)
  })

  it("names the allowlist when the domain is not authorised", () => {
    expect(readerErrorMessage("auth/unauthorized-domain")).toMatch(/allowlist/)
  })

  it("never leaks a Firebase code for an unknown failure", () => {
    expect(readerErrorMessage("auth/internal-error")).not.toMatch(/auth\//)
    expect(readerErrorMessage("")).not.toMatch(/auth\//)
  })
})

describe("the vocabulary", () => {
  it("never calls the signed-in person a user or member", () => {
    // CONTEXT.md: the signed-in person is a Reader. `user` is on
    // Contributor's avoid list twice over. This pins the helper copy; the
    // component's own "Account menu" wording is ticket 04's decided copy for
    // the menu widget rather than the person, and is kept verbatim.
    const copy = [
      ...READER_PROVIDERS,
      readerErrorMessage("auth/account-exists-with-different-credential"),
      readerErrorMessage("auth/unauthorized-domain"),
      readerErrorMessage("auth/internal-error"),
    ].join(" ")
    expect(copy).not.toMatch(/\buser\b/i)
    expect(copy).not.toMatch(/\bmember\b/i)
  })
})
