import { describe, expect, it } from "vitest"

import { allRecordings } from "../data/catalogue"
import type { Recording } from "../data/recording"
import {
  assertNoLeftoverTokens,
  DIGEST_ITEM_LIMIT,
  digestContent,
  formatDigestDate,
  renderDigest,
  UNSUBSCRIBE_TOKEN,
} from "../lib/digest"
import {
  CONTACT_EMAIL,
  POSTAL_ADDRESS,
  SENDER_NAME,
} from "../lib/sender-identity"
import { SITE_ORIGIN } from "../lib/site-origin"

// notify-and-preview ticket 09 — the first Digest, and what it may claim.
//
// The ticket's acceptance is mostly about sentences, which are hard to test and easy to
// drift. Two of its bullets are not sentences and are pinned here instead:
//
//   1. **`{{SIGNUP_DATE}}` is filled per recipient.** It is a live token in ticket 04's
//      footer block and this is the ticket that has to fill it. If it ever renders
//      literally, the Digest ships the string `{{SIGNUP_DATE}}` inside the one sentence
//      that tells somebody when they consented.
//   2. **The count and the window match what the list will actually receive.** The
//      subject and the body both read the same computed figure, so they cannot disagree
//      with each other or with the catalogue.

function digest(overrides: Partial<Parameters<typeof renderDigest>[0]> = {}) {
  return renderDigest({
    signupDate: "2024-12-30T09:38:23.316Z",
    unsubscribeUrl: UNSUBSCRIBE_TOKEN,
    ...overrides,
  })
}

function recording(overrides: Partial<Recording> = {}): Recording {
  return {
    id: "01AAAAAAAAAAAAAAAAAAAAAAAA",
    caption: "A Recording",
    contributor: "A Contributor",
    category: "Misc",
    created_at: "2025-01-01T00:00:00.000Z",
    demoPath: "demo/misc/a.mp4",
    posterPath: "thumbnails/misc/a.avif",
    source: "https://example.com/source",
    ...overrides,
  }
}

describe("the window and the count", () => {
  it("counts every distinct Recording id, so a Re-record is not a second one", () => {
    // A Re-record keeps its id and its created_at, so the same row reaching the renderer
    // twice must still count once — map decision 9's "genuinely new Recording id".
    const one = recording()
    const content = digestContent([
      one,
      { ...one, demoPath: "demo/misc/b.mp4" },
    ])
    expect(content.total).toBe(1)
  })

  it("counts the whole catalogue on the first Digest, not a week of it", () => {
    // There was no last Digest, so the window is the catalogue's own life. Asserted
    // against the data rather than a number typed here: if a Recording is added, the
    // count moves with it and this test still means what it says.
    const content = digestContent(allRecordings)
    expect(content.total).toBe(new Set(allRecordings.map((r) => r.id)).size)
    expect(content.total).toBeGreaterThan(DIGEST_ITEM_LIMIT)
  })

  it("states the same figure in the subject and in the body", () => {
    const { subject, html, content } = digest()
    expect(subject).toContain(String(content.total))
    expect(html).toContain(`${content.total} Recordings`)
  })

  it("names the window it covers, from the oldest Recording to the newest", () => {
    const { html, content } = digest()
    expect(html).toContain(
      `${formatDigestDate(content.firstAdded)} and ${formatDigestDate(content.lastAdded)}`
    )
    expect(content.firstAdded < content.lastAdded).toBe(true)
  })

  it("shows the newest six and says how many are behind the link", () => {
    const { html, content } = digest()
    expect(content.shown).toHaveLength(DIGEST_ITEM_LIMIT)
    expect(content.more).toBe(content.total - DIGEST_ITEM_LIMIT)
    expect(html).toContain(`and ${content.more} more`)
  })

  it("shows the newest six, and nothing older than what it leaves behind", () => {
    // Stated as a property of the result rather than by re-running the production
    // comparator in the test: no shown row may be older than any row it did not show.
    const { shown, total } = digest().content
    expect(total).toBe(allRecordings.length)

    const at = (r: Recording) => r.created_at ?? ""
    const shownIds = new Set(shown.map((r) => r.id))
    const left = allRecordings.filter((r) => !shownIds.has(r.id))

    const oldestShown = shown.map(at).sort()[0]
    const newestLeft = left.map(at).sort().at(-1) ?? ""
    expect(oldestShown >= newestLeft).toBe(true)

    // Within the shown six, dates never increase.
    const dates = shown.map(at)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it("breaks a shared timestamp deterministically, in favour of the higher id", () => {
    // 2026-10-11 is a bulk import whose rows share one `created_at` to the millisecond.
    // Without a tie-break the six shown would depend on array order; with it, re-rendering
    // the same catalogue cannot change the message.
    const { shown } = digest().content
    const newestDate = shown[0].created_at
    const tied = allRecordings
      .filter((r) => r.created_at === newestDate)
      .sort((a, b) => b.id.localeCompare(a.id))
    const shownTied = shown.filter((r) => r.created_at === newestDate)
    expect(shownTied.map((r) => r.id)).toEqual(
      tied.slice(0, shownTied.length).map((r) => r.id)
    )
  })

  it("drops the 'more' line when nothing is left behind it", () => {
    const { html, content } = digest({
      recordings: [
        recording({ id: "01A" }),
        recording({ id: "01B" }),
        recording({ id: "01C" }),
      ],
    })
    expect(content.more).toBe(0)
    expect(html).not.toContain("more →")
  })
})

describe("the signup date", () => {
  it("is stated in the opening line, with the place it was given", () => {
    const { html } = digest()
    expect(html).toContain(
      "You signed up for the rnui.dev Digest at rnui.dev on 30 December 2024."
    )
  })

  it("never ships the token, for any consent date the survivor list holds", () => {
    // Real dates from research/scrub-survivors.json, oldest to newest, plus the two
    // edges a Firestore timestamp can produce (a leap day and a midnight UTC).
    const dates = [
      "2024-12-30T09:38:23.316Z",
      "2025-01-04T10:53:13.999Z",
      "2025-04-09T04:54:40.084Z",
      "2026-05-13T00:00:00.000Z",
      "2024-02-29T23:59:59.999Z",
    ]
    for (const signupDate of dates) {
      const { subject, html } = digest({ signupDate })
      expect(html).not.toContain("{{SIGNUP_DATE}}")
      // The one template token the body may carry is Resend's unsubscribe URL; strip it
      // and nothing token-shaped may remain.
      expect(html.replaceAll(UNSUBSCRIBE_TOKEN, "")).not.toContain("{{")
      expect(subject).not.toContain("{{")
      expect(html).toContain(formatDigestDate(signupDate))
    }
  })

  it("refuses to return a body that still carries a template token", () => {
    // The token ticket 04's footer block holds, arriving through anything that is not the
    // per-recipient interpolation. Checked on rendered bytes, so it catches a future edit.
    expect(() =>
      assertNoLeftoverTokens("<p>{{SIGNUP_DATE}}</p>", UNSUBSCRIBE_TOKEN)
    ).toThrow(/SIGNUP_DATE/)
    expect(() =>
      assertNoLeftoverTokens(
        `<a href="${UNSUBSCRIBE_TOKEN}">Unsubscribe</a>`,
        UNSUBSCRIBE_TOKEN
      )
    ).not.toThrow()
  })

  it("fails closed on a date it cannot read rather than printing Invalid Date", () => {
    expect(() => digest({ signupDate: "not a date" })).toThrow(
      /cannot read a Digest date/
    )
    expect(() => formatDigestDate("")).toThrow()
  })

  it("formats in UTC, so a consent at midnight does not slip a day", () => {
    expect(formatDigestDate("2024-12-30T00:00:00.000Z")).toBe(
      "30 December 2024"
    )
    expect(formatDigestDate("2024-12-30T23:59:59.999Z")).toBe(
      "30 December 2024"
    )
  })
})

describe("the footer", () => {
  it("carries ticket 04's identity and postal address", () => {
    const { html } = digest()
    expect(html).toContain(SENDER_NAME)
    expect(html).toContain(POSTAL_ADDRESS)
    expect(html).toContain(CONTACT_EMAIL)
  })

  it("carries a visible one-click unsubscribe in the body, not only in a header", () => {
    // Resend rewrites this token per recipient for a broadcast. It has to stay a
    // template token, so it is checked verbatim rather than with an escaped value.
    const { html } = digest()
    expect(html).toContain(
      '<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a>'
    )
  })

  it("takes the unsubscribe URL from its caller, so a per-recipient send can pass a real one", () => {
    // No default. A renderer that silently fell back to Resend's broadcast token would
    // ship that literal string to every inbox the first time ticket 10 sent per recipient.
    const { html } = digest({
      unsubscribeUrl: "https://www.rnui.dev/unsubscribe/abc",
    })
    expect(html).toContain('href="https://www.rnui.dev/unsubscribe/abc"')
    expect(html).not.toContain("{{{")
  })

  it("links the privacy policy at the www host", () => {
    const { html } = digest()
    expect(html).toContain(`${SITE_ORIGIN}/privacypolicy`)
  })

  it("does not promise a frequency the Digest does not keep", () => {
    // Ticket 01 and the 2026-10-09 edit removed "weekly" from the form and the page
    // description because the cadence is undecided. A footer that re-makes the promise
    // is the same lie in the message that outlives the page.
    const { html } = renderDigest({
      signupDate: "2024-12-30T09:38:23.316Z",
      unsubscribeUrl: UNSUBSCRIBE_TOKEN,
    })
    expect(html.toLowerCase()).not.toContain("weekly")
  })
})

describe("the six shown Recordings", () => {
  it("links every one to its own page", () => {
    const { html, content } = digest()
    for (const row of content.shown) {
      expect(html).toContain(
        `<a href="${SITE_ORIGIN}/recording/${encodeURIComponent(row.id)}">`
      )
      expect(html).toContain(row.caption)
    }
  })

  it("escapes a caption and a Contributor name", () => {
    // Catalogue data is reviewed, but it is still text typed by a person, and it is
    // rendered into a mail client. The same rule lib/email-html.ts exists for.
    const { html } = digest({
      recordings: [
        recording({
          id: "01A",
          caption: '<a href="https://evil.example">Open</a>',
          contributor: "A & B",
        }),
      ],
    })
    expect(html).not.toContain('<a href="https://evil.example">Open</a>')
    expect(html).toContain("A &amp; B")
  })
})

describe("the survey ask", () => {
  it("comes after the content, never as the message's purpose", () => {
    // Map decision 2 and the CAN-SPAM primary-purpose test both put this section after
    // the Digest. Position is the whole of the constraint, so it is asserted by index.
    const { html, content } = digest()
    const ask = html.indexOf("One more thing")
    const lastRow = html.lastIndexOf(content.shown[content.shown.length - 1].id)
    expect(ask).toBeGreaterThan(-1)
    expect(ask).toBeGreaterThan(lastRow)
    expect(ask).toBeGreaterThan(html.indexOf("more"))
  })

  it("does not send anyone to the retired Preview", () => {
    // Measured 2026-10-22: https://preview.rnui.dev answers 308 to https://www.rnui.dev,
    // and survey 01a00821 was stopped on 2026-10-02. The ticket's bullet asking for a
    // link there described a host that no longer exists; see the ticket's Comments.
    const { html } = digest()
    expect(html).not.toContain("preview.rnui.dev")
  })
})

describe("the subject", () => {
  it("says what it is, without a fake thread or urgency", () => {
    const { subject } = digest()
    expect(subject.toLowerCase()).not.toMatch(/^re:|^fwd?:/)
    expect(subject.toLowerCase()).not.toMatch(
      /urgent|last chance|expires|act now/
    )
    expect(subject).not.toContain("\n")
  })
})
