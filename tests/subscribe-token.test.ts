import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { issueToken, verifyToken } from "../lib/subscribe-token"

// The signature exists for one attack, found by an adversarial review of the
// Firestore rules rather than by reading the code.
//
// `allow create` on the signup collection is open by necessity: the signup write
// goes through the same public client SDK a browser uses, so Firestore cannot
// tell this server's write from anybody else's. Without a signature an attacker
// plants their own pending record at a document id they chose --
//
//     setDoc(doc(db, "emails", "id-i-picked"),
//            { email: "victim@example.org", confirmed: false, ... })
//     GET /api/confirm-subscription?token=id-i-picked
//
// -- and the confirm route pushes an address into the Resend audience that was
// never mailed and never consented. That is double opt-in defeated end to end,
// so the case below named "refuses an id an attacker planted" is the one that
// matters most in this file.

const SECRET = "test-secret-not-the-real-one"

describe("the confirmation token", () => {
  const realSecret = process.env.SUBSCRIBE_TOKEN_SECRET

  beforeEach(() => {
    process.env.SUBSCRIBE_TOKEN_SECRET = SECRET
  })

  afterEach(() => {
    process.env.SUBSCRIBE_TOKEN_SECRET = realSecret
  })

  it("round-trips: a token it issued resolves to the document id", () => {
    const { id, token } = issueToken()
    expect(token.startsWith(`${id}.`)).toBe(true)
    expect(verifyToken(token)).toBe(id)
  })

  it("keeps the signature out of the document id", () => {
    const { id, token } = issueToken()
    // The id is what Firestore stores under; the signature only ever travels in
    // the link. Storing the signature would make reading one record enough to
    // mint a working link for it.
    expect(id).not.toContain(".")
    expect(token.length).toBeGreaterThan(id.length + 1)
  })

  it("issues a distinct id every time", () => {
    const ids = new Set(Array.from({ length: 50 }, () => issueToken().id))
    expect(ids.size).toBe(50)
  })

  // THE case. An attacker can write a Firestore document at an id of their
  // choosing; they cannot sign one.
  it("refuses an id an attacker planted, with no signature at all", () => {
    expect(verifyToken("attacker-chosen-id-0001")).toBeNull()
  })

  it("refuses a planted id carrying a made-up signature", () => {
    expect(verifyToken("attacker-chosen-id-0001.YWJjZGVmZ2g")).toBeNull()
    expect(verifyToken("attacker-chosen-id-0001.")).toBeNull()
  })

  it("refuses a real id whose signature belongs to a different id", () => {
    const a = issueToken()
    const b = issueToken()
    const spliced = `${a.id}.${b.token.slice(b.token.lastIndexOf(".") + 1)}`
    expect(verifyToken(spliced)).toBeNull()
  })

  it("refuses a token signed with a different secret", () => {
    const { token } = issueToken()
    process.env.SUBSCRIBE_TOKEN_SECRET = "a-different-secret"
    expect(verifyToken(token)).toBeNull()
  })

  it("refuses a tampered id", () => {
    const { id, token } = issueToken()
    const sig = token.slice(token.lastIndexOf(".") + 1)
    expect(verifyToken(`${id.slice(0, -1)}x.${sig}`)).toBeNull()
  })

  it("refuses malformed input rather than throwing", () => {
    for (const bad of ["", ".", ".sig", "no-dot-at-all"]) {
      expect(verifyToken(bad)).toBeNull()
    }
  })

  // Fail closed. An unsigned token is one anybody can mint, so a deployment
  // missing the secret must refuse to issue OR accept one — never quietly fall
  // back to an unauthenticated token.
  it("refuses to issue or accept anything when the secret is unset", () => {
    delete process.env.SUBSCRIBE_TOKEN_SECRET
    expect(() => issueToken()).toThrow(/SUBSCRIBE_TOKEN_SECRET/)
    expect(() => verifyToken("anything.atall")).toThrow(
      /SUBSCRIBE_TOKEN_SECRET/
    )
  })
})
