import { beforeEach, describe, expect, it, vi } from "vitest"

import starCountFile from "../scripts/star-count.json"

// The double goes in before @/lib/analytics is loaded, because that module takes
// the posthog-js singleton at import time — the same arrangement
// tests/analytics.test.ts uses, and for the same reason.
const { capture } = vi.hoisted(() => ({ capture: vi.fn() }))
vi.mock("posthog-js", () => ({ default: { capture } }))

import { starClicked } from "@/lib/analytics"

// github-star-button ticket 04, step 1: the count is inlined at build time.
//
// **GitHub is never in a visitor's request path.** The count arrives in the
// committed file, the weekly workflow refreshes it, and the build inlines it. So
// the highest-value assertion available is an equality between the served HTML
// and this file — and that belongs in tests/e2e/star-control.spec.ts, which can
// read the served document. What this file can do is pin the *file's* contract,
// because a malformed file inlines a malformed number into every page and no
// unit test anywhere would notice.
//
// Expectations are written by hand where they can be, per ADR-0005: a test that
// takes its expectation from the thing under test cannot catch that thing being
// wrong. The file's own `stars` is read from the file — that is the only honest
// way to assert it is a number at all — but the *shape* around it is stated here.

describe("the committed star count", () => {
  it("carries exactly two keys: the count and the date", () => {
    // Exactly two, because the date is the one thing the render must never
    // disclose (ticket 03) and a third key is where a future contributor would
    // add a second one. A workflow that writes an extra field fails here rather
    // than shipping it.
    expect(Object.keys(starCountFile).sort()).toEqual([
      "generated_at",
      "stars",
    ])
  })

  it("stars is a non-negative integer", () => {
    // GitHub counts whole stars, so a decimal or a negative number means the
    // workflow's parsing broke and the number on every page is wrong.
    expect(Number.isInteger(starCountFile.stars)).toBe(true)
    expect(starCountFile.stars).toBeGreaterThan(0)
  })

  it("generated_at is an ISO date, and is the only date in the file", () => {
    // The date exists for the workflow's staleness alert and for nothing else.
    // `^\d{4}-\d{2}-\d{2}$` rather than a parse, so a timestamp with a time
    // component — which `date -d` would accept and this render must never see —
    // is rejected here.
    expect(starCountFile.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("is inlined by import, not fetched at runtime", () => {
    // The architectural claim, stated as a fact about this file's shape: it is a
    // static JSON import resolved at build time, which is why there is no fetch
    // to intercept and why the e2e served-HTML assertion can be an equality. If
    // someone replaces this with `fs.readFileSync` at request time, this test
    // still passes — so the real guard is the e2e one, and this line is here to
    // say what the e2e one is proving.
    expect(typeof starCountFile.stars).toBe("number")
  })
})

describe("the reporter", () => {
  beforeEach(() => {
    capture.mockClear()
  })

  it("carries exactly one property: the count that was on screen", () => {
    // github-star-button ticket 04's event contract, and the reason it is a new
    // event rather than a reuse of `repo_clicked` (which carries a Recording's
    // facts — there is no Recording behind a star control, so reuse would need
    // null fields or would give an existing event a second meaning).
    starClicked(starCountFile.stars)

    expect(capture).toHaveBeenCalledTimes(1)
    const [event, props] = capture.mock.calls[0]
    expect(event).toBe("star_clicked")
    // Exactly one key. A `staleness_days` here would reintroduce the disclosure
    // ticket 03 decided against, and it is the path of least resistance.
    expect(Object.keys(props)).toEqual(["stars"])
    expect(props.stars).toBe(starCountFile.stars)
    // And no visitor-entered text, which is the rule lib/analytics.ts states as
    // total across every event on the site.
    for (const value of Object.values(props)) {
      expect(typeof value).toBe("number")
    }
  })

  it("never emits the retired vocabulary", () => {
    // ADR-0008. The naming rule is the domain's, and this event is the newest
    // thing to touch it.
    starClicked(starCountFile.stars)

    const [event, props] = capture.mock.calls[0]
    const emitted = [event, ...Object.keys(props)].join(" ")
    expect(emitted).not.toMatch(/entry_id|entry_opened/)
    expect(emitted).not.toMatch(/author/i)
  })
})