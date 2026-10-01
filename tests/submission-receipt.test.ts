import { describe, expect, it } from "vitest"

import { CONTACT_EMAIL } from "../lib/sender-identity"
import { submissionReceipt } from "../lib/submission-receipt"

// submission-receipt ticket 07, whose wording ticket 02 settled. The acceptance asks
// for one case per sentence of that wording, so the sentences are pinned here rather
// than left to be read out of a template:
//
//   1. **Every sentence ticket 02 agreed is present.** A receipt that quietly drops
//      the either-way promise, or the 30 day deletion, is a different promise from the
//      one the Contributor read on the form.
//   2. **Everything a stranger wrote is escaped.** This is HTML in somebody's mail
//      client, and the caption is visitor text.
//   3. **The subject is a constant**, so a hostile caption cannot reach a header.

function receipt(
  overrides: Partial<Parameters<typeof submissionReceipt>[0]> = {}
) {
  return submissionReceipt({
    contributor: "Hewad Mubariz",
    caption: "Radial FAB",
    category: "Buttons",
    ...overrides,
  })
}

describe("the subject", () => {
  it("is the line ticket 02 decided, and nothing else", () => {
    expect(receipt().subject).toBe("We have your Demo")
  })

  it("cannot be reached by a caption, because nothing is interpolated into it", () => {
    // The notification interpolates, and therefore flattens with oneLine. This one
    // does not interpolate, so there is nothing to flatten and nothing to inject.
    const { subject } = receipt({
      caption: "Radial\r\nBcc: someone@else.example",
    })
    expect(subject).toBe("We have your Demo")
    expect(subject).not.toMatch(/[\r\n]/)
  })
})

describe("the body, sentence by sentence", () => {
  it("greets the Contributor by the name they gave", () => {
    expect(receipt().html).toContain("Hello Hewad Mubariz,")
  })

  it("says the Demo arrived, in the vocabulary CONTEXT.md fixes", () => {
    // Demo, never upload, video or entry.
    expect(receipt().html).toContain(
      "Your Demo arrived. Thank you for sending it to rnui.dev."
    )
    expect(receipt().html).not.toMatch(/\b(upload|entry)\b/i)
  })

  it("names which Submission this is, so it reads weeks later", () => {
    expect(receipt().html).toContain("Radial FAB (Buttons)")
  })

  it("makes the either way promise ticket 02 decided on", () => {
    expect(receipt().html).toContain(
      "Every Submission is looked at by hand, and you will hear from us either way: if it is published, and if it is not."
    )
  })

  it("says how credit works, without promising whether", () => {
    const { html } = receipt()
    expect(html).toContain('you are credited as "Hewad Mubariz"')
    expect(html).toContain("with the profile links you gave")
  })

  it("repeats the disclosure's own deletion promise, so the two cannot disagree", () => {
    expect(receipt().html).toContain(
      "the file is deleted within 30 days of arriving"
    )
  })

  it("asks for nothing", () => {
    expect(receipt().html).toContain("Nothing is needed from you.")
  })

  it("does not promise publication anywhere", () => {
    // The one sentence this message may never contain. The disclosure the Contributor
    // agreed to says publication is not guaranteed, so a promise here would contradict
    // the words they actually consented to.
    const { html } = receipt()
    expect(html).not.toMatch(/we will publish/i)
    expect(html).not.toMatch(/will be published/i)
    expect(html).not.toMatch(/we will be in touch soon/i)
  })

  it("carries nothing internal: no object key, no shell command", () => {
    // The notification carries both, because the maintainer needs them. A stranger
    // does not, and a bucket key in their inbox is a detail that only invites a
    // question.
    const { html } = receipt()
    expect(html).not.toMatch(/pnpm/)
    expect(html).not.toMatch(/submissions:open/)
    expect(html).not.toMatch(/\.mp4/)
  })

  it("carries the identity block, so a reply reaches a human", () => {
    expect(receipt().html).toContain(CONTACT_EMAIL)
  })

  it("adds no unsubscribe link, because a Contributor is not a Subscriber", () => {
    const { html } = receipt()
    expect(html).not.toMatch(/unsubscribe/i)
    expect(html).not.toMatch(/preferences/i)
  })

  it("has no table, which is what makes the plain text flatten faithful", () => {
    // Ticket 03 measured Resend's auto generated text part as lossy for the
    // notification, whose table runs labels into values. This body is paragraphs, so
    // the flatten reads correctly and no hand written text part is needed.
    expect(receipt().html).not.toContain("<table")
    expect(receipt().html).not.toContain("<tr")
  })

  describe("escaping, because a caption is a stranger's text", () => {
    it("escapes a forged link in the caption", () => {
      const { html } = receipt({
        caption: '<a href="https://evil.example">Open the Dashboard</a>',
      })
      expect(html).not.toContain('<a href="https://evil.example"')
      expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;")
    })

    it("escapes a script tag rather than passing it through", () => {
      const { html } = receipt({ caption: "<script>alert(1)</script>" })
      expect(html).not.toContain("<script>")
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    })

    it("escapes the Contributor name in the greeting and the credit line alike", () => {
      // Both places come from one escaped value, so they cannot diverge.
      const { html } = receipt({
        contributor: '<img src=x onerror="alert(1)">',
      })
      expect(html).not.toContain("<img")
      expect(
        html.match(/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/g)
      ).toHaveLength(2)
    })

    it("escapes the category too", () => {
      const { html } = receipt({ category: "Buttons <b>" })
      expect(html).not.toContain("<b>")
      expect(html).toContain("Buttons &lt;b&gt;")
    })

    it("escapes the ampersand first, so an entity is not double escaped", () => {
      const { html } = receipt({ caption: "<&>" })
      expect(html).toContain("&lt;&amp;&gt;")
      expect(html).not.toContain("&amp;lt;")
    })
  })
})
