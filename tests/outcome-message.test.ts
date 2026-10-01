import { describe, expect, it } from "vitest"

import { outcomeMessage } from "../lib/outcome-message"
import { CONTACT_EMAIL } from "../lib/sender-identity"

// submission-receipt ticket 14, whose shape ticket 13 decided. The typed reason is the only
// prose in this pipeline that a human writes under pressure, so two things are pinned:
//
//   1. **The scaffold around it**, so the maintainer does not have to remember a greeting, an
//      identity block or a subject shape while writing bad news.
//   2. **The escaping**, because that prose reaches HTML in a stranger's mail client.

function message(
  overrides: Partial<Parameters<typeof outcomeMessage>[0]> = {}
) {
  return outcomeMessage({
    contributor: "Hewad Mubariz",
    caption: "Radial FAB",
    reason: "The recording is a good one, but it is 24 MB and the cap is 5 MB.",
    ...overrides,
  })
}

describe("the subject", () => {
  it("says which Submission this is about", () => {
    // It arrives after two messages that named it, and the reader has to know which one is
    // being discussed.
    expect(message().subject).toBe("About your Demo: Radial FAB")
  })

  it("is one line even when the caption holds a newline", () => {
    const { subject } = message({
      caption: "Radial\r\nFAB\nBcc: someone@else.example",
    })
    expect(subject).not.toMatch(/[\r\n]/)
    expect(subject).toBe(
      "About your Demo: Radial FAB Bcc: someone@else.example"
    )
  })
})

describe("the scaffold around the typed part", () => {
  it("greets the Contributor by name when there is one", () => {
    expect(message().html).toContain("Hello Hewad Mubariz,")
  })

  it("greets them as Hello when the name is not to hand", () => {
    // The name is optional on purpose: under pressure the maintainer may only have the address,
    // and a wrong name is worse than no name.
    const { html } = message({ contributor: "" })
    expect(html).toContain("Hello,")
    expect(html).not.toContain("Hello ,")
  })

  it("carries the typed reason", () => {
    expect(message().html).toContain(
      "The recording is a good one, but it is 24 MB and the cap is 5 MB."
    )
  })

  it("keeps a blank line as a paragraph break", () => {
    const { html } = message({
      reason: "First thing.\n\nSecond thing.",
    })
    expect(html).toContain("<p>First thing.</p>")
    expect(html).toContain("<p>Second thing.</p>")
  })

  it("keeps a single newline as a line break inside a paragraph", () => {
    const { html } = message({ reason: "First line.\nSecond line." })
    expect(html).toContain("<p>First line.<br>Second line.</p>")
  })

  it("carries the identity block, like the other two messages", () => {
    expect(message().html).toContain(CONTACT_EMAIL)
  })

  it("asks for nothing and promises nothing", () => {
    // Same tone as the other two: ticket 04 settled it, and this is the message where a reader
    // is least able to absorb a request.
    const { html } = message()
    expect(html).not.toMatch(/please (reply|send|let us know)/i)
    expect(html).not.toMatch(/unsubscribe/i)
    expect(html).not.toContain("<table")
  })
})

describe("escaping, because the reason is typed in a hurry", () => {
  it("escapes a forged link in the reason", () => {
    const { html } = message({
      reason: 'See <a href="https://evil.example">this</a> instead.',
    })
    expect(html).not.toContain('<a href="https://evil.example"')
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;")
  })

  it("escapes a script tag rather than passing it through", () => {
    const { html } = message({ reason: "<script>alert(1)</script>" })
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
  })

  it("escapes the Contributor name", () => {
    const { html } = message({ contributor: '<img src=x onerror="alert(1)">' })
    expect(html).not.toContain("<img")
    expect(html).toContain(
      "Hello &lt;img src=x onerror=&quot;alert(1)&quot;&gt;,"
    )
  })

  it("escapes the ampersand first, so an entity is not double escaped", () => {
    const { html } = message({ reason: "<&>" })
    expect(html).toContain("&lt;&amp;&gt;")
    expect(html).not.toContain("&amp;lt;")
  })

  it("does not let a typed angle bracket become a tag", () => {
    // The exact failure this test exists for: escaping happens before the newline becomes a
    // <br>, so the tag we add is ours and the one the maintainer typed is text.
    const { html } = message({ reason: "line<br>\nnext" })
    expect(html).toContain("<p>line&lt;br&gt;<br>next</p>")
  })
})
