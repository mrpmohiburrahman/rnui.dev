import { describe, expect, it } from "vitest"

import {
  CHANGE_QUESTION,
  COMPARISON_QUESTION,
  PREVIEW_HOST,
  PREVIEW_SURVEY_KEY,
  shouldShowPreviewSurvey,
  VERDICTS,
  type SurveyGate,
} from "@/lib/preview-survey"

// Ticket 13's acceptance, as far as it can be checked without a browser. The
// gate is the whole of "fires after the visitor has looked at something, once
// per person, and only on the Preview" — every one of those is a term in one
// boolean expression, and each is silent when it breaks: the panel just stops
// appearing, or starts appearing somewhere it must not.

/** Armed, unseen, on the Preview, nothing in the way — the case that shows. */
const SHOWING: SurveyGate = {
  hostname: PREVIEW_HOST,
  dev: false,
  seen: false,
  armed: true,
  recordingOpen: false,
}

describe("shouldShowPreviewSurvey", () => {
  it("shows on the Preview once the visitor has looked at something", () => {
    expect(shouldShowPreviewSurvey(SHOWING)).toBe(true)
  })

  it("never asks on arrival", () => {
    // The acceptance bullet in its own words: someone who has seen nothing has
    // no opinion worth collecting.
    expect(shouldShowPreviewSurvey({ ...SHOWING, armed: false })).toBe(false)
  })

  it("asks once per person", () => {
    expect(shouldShowPreviewSurvey({ ...SHOWING, seen: true })).toBe(false)
  })

  it("stays off the Recording that armed it", () => {
    // Opening a Recording is the trigger; the panel still waits for the close,
    // so it never lands on top of what the visitor just asked to see.
    expect(shouldShowPreviewSurvey({ ...SHOWING, recordingOpen: true })).toBe(
      false
    )
  })

  it.each([
    ["rnui.dev", "the live site, where the question is nonsense"],
    ["www.rnui.dev", "the same site by its other name"],
    [
      "rnui-dev-git-feat-studio-dark-mrp.vercel.app",
      "the branch alias nobody is sent to",
    ],
    ["localhost", "a production build served locally"],
  ])("asks nothing on %s — %s", (hostname) => {
    expect(shouldShowPreviewSurvey({ ...SHOWING, hostname })).toBe(false)
  })

  it("stands in for the Preview on localhost in development only", () => {
    // The one way to look at the panel before it is in front of visitors.
    // `dev` is `process.env.NODE_ENV === "development"` at the call site, which
    // is compiled to `false` in every build that ships.
    const local = { ...SHOWING, hostname: "localhost" }
    expect(shouldShowPreviewSurvey({ ...local, dev: true })).toBe(true)
    expect(shouldShowPreviewSurvey({ ...local, dev: false })).toBe(false)
  })

  it("does not let development loose on the live site", () => {
    expect(
      shouldShowPreviewSurvey({ ...SHOWING, hostname: "rnui.dev", dev: true })
    ).toBe(false)
  })
})

describe("decision 7's wording", () => {
  // The two questions were settled with the maintainer at charting. Reworded in
  // passing they would still collect answers, and the answers would be to a
  // different question than the one the decision records.
  it("asks the two questions decision 7 fixes, verbatim", () => {
    expect(COMPARISON_QUESTION).toBe("Compared to the old rnui.dev, this is…")
    expect(CHANGE_QUESTION).toBe("What's the one thing you'd change?")
  })

  it("offers better / about the same / worse, in that order", () => {
    expect(VERDICTS.map((v) => v.label)).toEqual([
      "Better",
      "About the same",
      "Worse",
    ])
    expect(VERDICTS.map((v) => v.value)).toEqual(["better", "same", "worse"])
  })
})

describe("the stored key", () => {
  it("is not one of the three frozen browser keys", () => {
    // Renaming any of those silently discards a visitor's saved state
    // (hooks/use-remembered-set.ts); colliding with one would do worse.
    expect(["bookmarkedItems", "votedItems", "viewedEntryIds"]).not.toContain(
      PREVIEW_SURVEY_KEY
    )
  })
})
