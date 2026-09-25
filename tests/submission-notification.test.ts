import { describe, expect, it } from "vitest"

import { CONTACT_EMAIL } from "../lib/sender-identity"
import { SUBMISSION_FORM_VERSION } from "../lib/submission-consent"
import {
  humanSize,
  OPEN_COMMAND,
  submissionNotification,
} from "../lib/submission-notification"

// public-submissions ticket 09. The message is the whole feature, a Submission
// nobody is told about is a Submission nobody opens, and two of its properties
// are not cosmetic:
//
//   1. **Every field an `add-recording` session needs is present**, the object key
//      and the command among them, because a presigned link dies in 7 days and the
//      object lives 30.
//   2. **Everything a stranger wrote is escaped.** This is HTML in somebody's mail
//      client, and a caption is visitor-supplied text.

const KEY = "01JD7Q9XKT3M8ZPW4R2YV6B1C0.mp4"

function notice(
  overrides: Partial<Parameters<typeof submissionNotification>[0]> = {}
) {
  return {
    contributor: "Hewad Mubariz",
    email: "hewad@example.com",
    github: "hewad-mubariz",
    linkedin: "hewadm",
    twitter: "hewadM1",
    caption: "Radial FAB",
    category: "Buttons",
    source: "https://github.com/example/radial-fab",
    fileBytes: 82_000,
    key: KEY,
    consent: {
      disclosure: "d",
      formVersion: SUBMISSION_FORM_VERSION,
      email: "hewad@example.com",
      ip: "203.0.113.9",
      at: new Date("2026-09-25T03:00:00.000Z"),
    },
    ...overrides,
  }
}

describe("the subject", () => {
  it("names the caption and the Contributor, so a list of them is scannable", () => {
    const { subject } = submissionNotification(notice())
    expect(subject).toBe("New Submission: Radial FAB, Hewad Mubariz")
  })

  it("is one line even when a visitor puts a newline in the caption", () => {
    // The validator trims a field's ends and does not forbid a newline in the
    // middle, so this is flattened rather than trusted: a newline in a header is
    // broken formatting at best.
    const { subject } = submissionNotification(
      notice({ caption: "Radial\r\nFAB\nsecond line" })
    )
    expect(subject).not.toMatch(/[\r\n]/)
    expect(subject).toBe(
      "New Submission: Radial FAB second line, Hewad Mubariz"
    )
  })
})

describe("the body", () => {
  it("carries every field an add-recording session needs", () => {
    const { html } = submissionNotification(notice())
    for (const value of [
      "Hewad Mubariz",
      "hewad@example.com",
      "hewad-mubariz",
      "hewadm",
      "hewadM1",
      "Radial FAB",
      "Buttons",
      "https://github.com/example/radial-fab",
      "80.1 KB",
    ]) {
      expect(html, `expected the body to carry ${value}`).toContain(value)
    }
  })

  it("prints the address to reply to, because that is why the form asks for one", () => {
    const { html } = submissionNotification(notice())
    expect(html).toContain("Reply to")
    expect(html).toContain("hewad@example.com")
  })

  it("carries the object key and a copy-pasteable command", () => {
    const { html } = submissionNotification(notice())
    expect(html).toContain(KEY)
    // The exact string ticket 04 established and scripts/open-submission.ts parses.
    expect(html).toContain(`${OPEN_COMMAND} ${KEY}`)
  })

  it("says the file expires, because 30 days is the whole window", () => {
    expect(submissionNotification(notice()).html).toMatch(/deleted 30 days/)
  })

  it("summarises the consent record: the version and the moment", () => {
    const { html } = submissionNotification(notice())
    expect(html).toContain(SUBMISSION_FORM_VERSION)
    expect(html).toContain("2026-09-25T03:00:00.000Z")
  })

  it("omits handles that were not given, rather than showing them blank", () => {
    // A blank row reads as "has a GitHub, we just could not read it", which sends
    // the maintainer looking for something that does not exist.
    const { html } = submissionNotification(
      notice({ github: "", linkedin: "", twitter: "" })
    )
    expect(html).not.toContain("GitHub")
    expect(html).not.toContain("LinkedIn")
    expect(html).not.toContain(">X<")
  })

  it("carries the reply address, so a reply reaches a human", () => {
    expect(submissionNotification(notice()).html).toContain(CONTACT_EMAIL)
  })
})

describe("escaping, because every one of these values is a stranger's text", () => {
  it("escapes HTML in the caption", () => {
    // Mail clients block script. They do not block a forged link, which is the
    // half that matters: without escaping, this arrives as a link wearing
    // rnui.dev's sender reputation.
    const { html } = submissionNotification(
      notice({
        caption: '<a href="https://evil.example">Open the Dashboard</a>',
      })
    )
    expect(html).not.toContain('<a href="https://evil.example"')
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;")
  })

  it("escapes a script tag rather than passing it through", () => {
    const { html } = submissionNotification(
      notice({ caption: "<script>alert(1)</script>" })
    )
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
  })

  it("escapes the name, the handles and the source too", () => {
    const { html } = submissionNotification(
      notice({
        contributor: '<img src=x onerror="alert(1)">',
        github: "a&b",
        source: "https://example.com/?a=1&b=<2>",
      })
    )
    expect(html).not.toContain("<img")
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")
    expect(html).toContain("a&amp;b")
    expect(html).toContain("&lt;2&gt;")
  })

  it("escapes the ampersand first, so an escaped entity is not double-escaped", () => {
    const { html } = submissionNotification(notice({ caption: "<&>" }))
    expect(html).toContain("&lt;&amp;&gt;")
    expect(html).not.toContain("&amp;lt;")
  })
})

describe("humanSize", () => {
  it("reads as a size rather than a byte count", () => {
    expect(humanSize(512)).toBe("512 B")
    expect(humanSize(2048)).toBe("2.0 KB")
    expect(humanSize(82_000)).toBe("80.1 KB")
    expect(humanSize(5 * 1024 * 1024)).toBe("5.00 MB")
  })
})
