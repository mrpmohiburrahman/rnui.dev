import { describe, expect, it } from "vitest"

import { allRecordings } from "../data/catalogue"
import {
  contributorUrl,
  publicationNotice,
  recordingUrl,
  SITE_ORIGIN,
} from "../lib/publication-notice"
import { CONTACT_EMAIL } from "../lib/sender-identity"

// submission-receipt ticket 11, whose wording ticket 10 settled. Two things are pinned here
// that no other message in this pipeline has:
//
//   1. **The links.** This is the only message with a call to action, and a notice whose link
//      404s is worse than no notice. So the URLs are asserted piece by piece rather than by
//      "contains a URL".
//   2. **The absence of a forward claim.** It is the one message that can be wrong after the
//      fact, because a Recording can be unpublished or renamed after it lands in an inbox.

function notice(
  overrides: Partial<Parameters<typeof publicationNotice>[0]> = {}
) {
  return publicationNotice({
    contributor: "Hewad Mubariz",
    caption: "Radial FAB",
    category: "Buttons",
    recordingId: "radial_fab_hewad_mubariz",
    ...overrides,
  })
}

describe("the links", () => {
  it("names the www host, because the apex is a redirect", () => {
    // Measured 2026-09-25: https://rnui.dev/recording/x answers 307 to the www host. A link
    // in an inbox that has to redirect is a link that looks broken to a nervous reader.
    expect(SITE_ORIGIN).toBe("https://www.rnui.dev")
    expect(recordingUrl("abc")).toBe("https://www.rnui.dev/recording/abc")
    expect(recordingUrl("abc")).not.toContain("//rnui.dev")
  })

  it("addresses the Recording's own page", () => {
    expect(notice().html).toContain(
      "https://www.rnui.dev/recording/radial_fab_hewad_mubariz"
    )
  })

  it("addresses the Contributor's catalogue, with the name encoded", () => {
    // The space has to survive: it is the difference between a page with their work on it and
    // an empty one, and `URLSearchParams` is the construction app/products/page.tsx uses in its
    // own permanent redirect.
    expect(contributorUrl("Hewad Mubariz")).toBe(
      "https://www.rnui.dev/products?contributor=Hewad+Mubariz"
    )
    expect(notice().html).toContain(
      "https://www.rnui.dev/products?contributor=Hewad+Mubariz"
    )
  })

  it("survives a non-Latin name, which is why there is no per-Contributor slug", () => {
    // app/contributors/page.tsx records `Daehyeon Mun (문대현)` losing 문대현 under every
    // slugifier, and that is why the filter URL is the only address for one Contributor.
    const url = contributorUrl("Daehyeon Mun (문대현)")
    expect(url).toBe(
      "https://www.rnui.dev/products?contributor=Daehyeon+Mun+%28%EB%AC%B8%EB%8C%80%ED%98%84%29"
    )
    // Read back the way the app reads it, with URLSearchParams: `decodeURIComponent` alone
    // leaves the `+` in place, which is the mistake this assertion exists to catch.
    const query = new URLSearchParams(url.split("?")[1])
    expect(query.get("contributor")).toBe("Daehyeon Mun (문대현)")
  })

  it("points at a real Recording when given a real id", () => {
    // Cheap insurance that the shape matches data/recording.ts rather than only the fixture.
    const real = allRecordings[0]
    expect(recordingUrl(real.id)).toBe(`${SITE_ORIGIN}/recording/${real.id}`)
  })
})

describe("the subject", () => {
  it("names the Recording, because it arrives weeks later", () => {
    expect(notice().subject).toBe("Your Demo is live: Radial FAB")
  })

  it("is one line even when the caption holds a newline", () => {
    const { subject } = notice({
      caption: "Radial\r\nFAB\nBcc: someone@else.example",
    })
    expect(subject).not.toMatch(/[\r\n]/)
    expect(subject).toBe(
      "Your Demo is live: Radial FAB Bcc: someone@else.example"
    )
  })
})

describe("the body, sentence by sentence", () => {
  it("greets the Contributor and says what happened", () => {
    const { html } = notice()
    expect(html).toContain("Hello Hewad Mubariz,")
    expect(html).toContain("Your Demo is live on rnui.dev.")
  })

  it("names which Submission it is about", () => {
    expect(notice().html).toContain("Radial FAB (Buttons)")
  })

  it("labels both links, so neither is a bare URL", () => {
    const { html } = notice()
    expect(html).toContain("See it:")
    expect(html).toContain("Everything of yours on the site:")
  })

  it("asks for nothing, keeping the tone ticket 04 decided", () => {
    expect(notice().html).toContain("Nothing is needed from you.")
  })

  it("carries the identity block, like the other two messages", () => {
    expect(notice().html).toContain(CONTACT_EMAIL)
  })

  it("adds no unsubscribe link, because a Contributor is not a Subscriber", () => {
    expect(notice().html).not.toMatch(/unsubscribe/i)
  })
})

describe("what it may claim about a Recording that later changes", () => {
  it("claims the event and never the future", () => {
    // The whole reason ticket 10 exists. A Recording can be unpublished, renamed,
    // recategorised or have its Demo replaced after this text is in somebody's inbox, and
    // this message cannot be corrected. So no sentence may describe a state that persists.
    const { html, subject } = notice()
    const text = `${subject}\n${html}`
    for (const forbidden of [
      /permanent/i,
      /will stay/i,
      /from now on/i,
      /now part of/i,
      /will remain/i,
      /always be/i,
    ]) {
      expect(text, `the notice must not claim ${forbidden}`).not.toMatch(
        forbidden
      )
    }
  })

  it("promises nothing and counts nothing", () => {
    // A count of a Contributor's Recordings changes the moment another one is published.
    const { html } = notice()
    expect(html).not.toMatch(/you have \d+/i)
    expect(html).not.toMatch(/\b\d+ (Recording|Demo)s?\b/)
  })

  it("has no table, so the text flatten reads as prose", () => {
    const { html } = notice()
    expect(html).not.toContain("<table")
    expect(html).not.toContain("<tr")
  })
})

describe("escaping, because the caption and the name are a stranger's text", () => {
  it("escapes a forged link in the caption", () => {
    const { html } = notice({
      caption: '<a href="https://evil.example">Open the Dashboard</a>',
    })
    expect(html).not.toContain('<a href="https://evil.example"')
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;")
  })

  it("escapes the Contributor name, in the greeting and the link alike", () => {
    const { html } = notice({ contributor: '<img src=x onerror="alert(1)">' })
    expect(html).not.toContain("<img")
    // In the greeting it is escaped. In the URL it is percent-encoded by URLSearchParams, so
    // the danger never reaches the attribute at all, which is the other half of the guard.
    expect(html).toContain(
      "Hello &lt;img src=x onerror=&quot;alert(1)&quot;&gt;,"
    )
    expect(html).not.toContain("<img src=x")
  })

  it("escapes the category", () => {
    const { html } = notice({ category: "Buttons <b>" })
    expect(html).not.toContain("<b>")
    expect(html).toContain("Buttons &lt;b&gt;")
  })

  it("escapes the id if it ever held a quote", () => {
    // Built from encodeURIComponent today, so this cannot happen. The href is escaped as well
    // as the visible text so it still cannot if the construction ever changes.
    const { html } = notice({ recordingId: 'a"b' })
    expect(html).not.toContain('href="https://www.rnui.dev/recording/a"b"')
    expect(html).toContain("a%22b")
  })

  it("escapes the ampersand first, so an entity is not double escaped", () => {
    const { html } = notice({ caption: "<&>" })
    expect(html).toContain("&lt;&amp;&gt;")
    expect(html).not.toContain("&amp;lt;")
  })
})
