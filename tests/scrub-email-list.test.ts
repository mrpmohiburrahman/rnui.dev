import { describe, expect, it } from "vitest"

import {
  isGeneratedString,
  looksGenerated,
  normalise,
  verdict,
} from "../scripts/scrub-email-list"

// The decision half of the list scrub (notify-and-preview ticket 03), lifted out
// so it can be tested without Firestore.
//
// Every address below is invented. They reproduce the *shape* of what the real
// data had on 2026-08-14 — the dot-obfuscation, the syllable-plus-digits run, the
// pairing gaps — and none of them is anybody's address. This repo is public, so
// a real one committed here would be published permanently, which is the whole
// thing ticket 03 exists to prevent.
//
// What each case is defending is the arithmetic in
// .scratch/notify-and-preview/research/scrub-2026-08-14.md: get one of these
// wrong and the surviving count that tickets 09 and 10 depend on moves.

const SIGNUP = "2026-01-16T03:14:54.870Z"
const at = (iso: string) => Date.parse(iso)

describe("normalise", () => {
  it("strips the dots gmail ignores, so a dot-obfuscated bot collapses onto its plain twin", () => {
    expect(normalise("f.o.b.a.z.i.q.u.4.2@gmail.com")).toBe(
      "fobaziqu42@gmail.com"
    )
  })

  it("leaves dots alone off gmail, where they are significant", () => {
    expect(normalise("first.last@example.com")).toBe("first.last@example.com")
  })
})

describe("isGeneratedString", () => {
  it("flags the mixed-case runs the contact-form bot submits", () => {
    expect(isGeneratedString("THMqjmXWzUSfCrZKDGJGs")).toBe(true)
  })

  it("spares a real first name, which is too short to qualify", () => {
    expect(isGeneratedString("Monica")).toBe(false)
  })

  it("spares real feedback, which has spaces in it", () => {
    expect(isGeneratedString("Hello, Bookmarks caught my eye")).toBe(false)
  })
})

// The corroborating signature, not a drop rule. Its value is entirely in what it
// does NOT match: relax the strict consonant-vowel syllable and it starts
// swallowing real people, which would turn a second opinion into a false one.
describe("looksGenerated", () => {
  it("matches the generator's syllable-plus-digits shape", () => {
    expect(looksGenerated("wucabepaz18@gmail.com")).toBe(true)
  })

  it("matches it through gmail's dot-obfuscation too", () => {
    expect(looksGenerated("f.o.b.a.z.i.q.u.4.2@gmail.com")).toBe(true)
  })

  it("spares a real name carrying a consonant digraph", () => {
    expect(looksGenerated("banoduweshira922@example.com")).toBe(false)
  })

  it("spares a real name with a consonant cluster", () => {
    expect(looksGenerated("viktoradeshina922@example.com")).toBe(false)
  })

  it("needs the trailing digits — a bare word is not the shape", () => {
    expect(looksGenerated("samoloba@gmail.com")).toBe(false)
  })

  it("needs at least three syllables, so short locals do not match", () => {
    expect(looksGenerated("niko240@example.com")).toBe(false)
  })
})

describe("verdict", () => {
  it("keeps an ordinary address", () => {
    expect(verdict("someone@gmail.com", SIGNUP, [], true)).toEqual({
      keep: true,
    })
  })

  // The case that justifies pairing on timestamps rather than on how the local
  // part reads: this bot wore a plausible human name and no pattern match found
  // it. It was 1 of the 18.
  it("drops a bot whose address looks like a real person's name", () => {
    const v = verdict(
      "janedoe17@example.com",
      SIGNUP,
      [at(SIGNUP) + 31_000],
      true
    )
    expect(v.keep).toBe(false)
    expect(v).toMatchObject({
      rule: "bot",
      detail: expect.stringContaining("+31s"),
    })
  })

  // The mirror of the above, and the more expensive mistake: a real person's
  // pending address that happens to read like the generator's output. (Pending,
  // not a Subscriber — the map reserves that word for a confirmed address, and
  // nothing on this list is confirmed until ticket 06's double opt-in.) Nothing
  // paired with it, so it stays.
  it("keeps a syllabic-looking address that no contact submission pairs with", () => {
    expect(verdict("banoduwesira922@example.com", SIGNUP, [], true)).toEqual({
      keep: true,
    })
  })

  it("reports the pairing in either direction — the bot filed feedback first about half the time", () => {
    expect(
      verdict("a@gmail.com", SIGNUP, [at(SIGNUP) - 21_000], true)
    ).toMatchObject({
      rule: "bot",
      detail: expect.stringContaining("-21s"),
    })
  })

  it("keeps an address whose junk submission is far outside the window", () => {
    expect(
      verdict("a@gmail.com", SIGNUP, [at(SIGNUP) + 3_600_000], true)
    ).toEqual({
      keep: true,
    })
  })

  it("drops a role mailbox", () => {
    expect(verdict("dev@example.com", SIGNUP, [], true)).toMatchObject({
      rule: "role",
    })
  })

  it("drops a domain that publishes no MX", () => {
    expect(verdict("a@nowhere.example", SIGNUP, [], false)).toMatchObject({
      rule: "mx",
    })
  })

  it("drops a malformed address before it ever asks about MX", () => {
    expect(verdict("not-an-address", SIGNUP, [], true)).toMatchObject({
      rule: "syntax",
    })
  })

  // Order matters: a bot on a role local part is dropped as a bot, so the
  // disposition table names the evidence that actually caught it.
  it("prefers the bot rule over the role rule", () => {
    expect(
      verdict("dev@example.com", SIGNUP, [at(SIGNUP) + 20_000], true)
    ).toMatchObject({
      rule: "bot",
    })
  })
})
