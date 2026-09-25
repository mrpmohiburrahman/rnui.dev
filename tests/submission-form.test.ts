import { describe, expect, it } from "vitest"

import {
  hasErrors,
  MAX_DEMO_BYTES,
  validateSubmission,
  type SubmissionFields,
} from "../lib/submission-form"

// public-submissions ticket 05. The acceptance asks for a SPECIFIC message per
// rule, so each case below asserts the message rather than merely that a key is
// present — a validator that refuses everything correctly and explains nothing is
// the failure this file exists to catch.
//
// The size rule is the one that matters most: it has to run before compression
// starts, and it has to name both the limit and the actual size, because the
// visitor's next action depends on knowing both.

/** A submission that passes, so each case can spoil exactly one thing. */
function fields(overrides: Partial<SubmissionFields> = {}): SubmissionFields {
  return {
    contributor: "Hewad Mubariz",
    github: "",
    linkedin: "",
    twitter: "",
    caption: "Radial FAB",
    category: "Buttons",
    source: "https://github.com/example/radial-fab",
    fileBytes: 400 * 1024,
    consent: true,
    ...overrides,
  }
}

describe("validateSubmission", () => {
  it("accepts a complete submission", () => {
    expect(validateSubmission(fields())).toEqual({})
  })

  it("requires the name to credit", () => {
    expect(validateSubmission(fields({ contributor: "   " }))).toEqual({
      contributor: "Enter the name to credit this Demo to.",
    })
  })

  it("requires a caption", () => {
    expect(validateSubmission(fields({ caption: "" }))).toEqual({
      caption: "Give the Demo a short caption.",
    })
  })

  it("requires a Category that exists", () => {
    const expected = "Choose the Category this belongs to."
    expect(validateSubmission(fields({ category: "" })).category).toBe(expected)
    // A name that is not a Category at all. The type says this cannot happen;
    // the form's state is a string, so it can.
    expect(
      validateSubmission(fields({ category: "Transitions" })).category
    ).toBe(expected)
  })

  it("requires a source URL", () => {
    const expected = "The source must be a link starting with https://."
    expect(validateSubmission(fields({ source: "" })).source).toBe(expected)
    expect(validateSubmission(fields({ source: "github.com/x" })).source).toBe(
      expected
    )
    expect(
      validateSubmission(fields({ source: "ftp://x.example" })).source
    ).toBe(expected)
  })

  it("accepts http as well as https, because add-recording does", () => {
    // `add-recording` step 3 requires the source to match ^https?://, so http is
    // a valid Recording source. Refusing it here would reject a submission the
    // publish path would have accepted.
    expect(
      validateSubmission(fields({ source: "http://example.com/x" })).source
    ).toBeUndefined()
  })

  it("lets all three handles be left blank", () => {
    expect(validateSubmission(fields())).toEqual({})
  })

  it("accepts bare slugs", () => {
    expect(
      validateSubmission(
        fields({
          github: "hewad-mubariz",
          linkedin: "hewadm",
          twitter: "hewadM1",
        })
      )
    ).toEqual({})
  })

  it("refuses a handle written as @name", () => {
    expect(validateSubmission(fields({ github: "@hewad" })).github).toBe(
      "Enter the GitHub handle only — no @, no URL."
    )
  })

  it("refuses a handle written as a URL", () => {
    expect(
      validateSubmission(fields({ twitter: "https://x.com/hewad" })).twitter
    ).toBe("Enter the X handle only — no @, no URL.")
  })

  it("refuses a path, a space, a dot, or a hyphen at either end", () => {
    for (const bad of ["hewad/", "hew ad", "hewad.dev", "-hewad", "hewad-"]) {
      expect(
        validateSubmission(fields({ linkedin: bad })).linkedin,
        `expected "${bad}" to be refused`
      ).toBe("Enter the LinkedIn handle only — no @, no URL.")
    }
  })

  it("requires a file", () => {
    expect(validateSubmission(fields({ fileBytes: null })).fileBytes).toBe(
      "Choose a Demo to send."
    )
  })

  it("names the limit AND the actual size when the file is too big", () => {
    expect(
      validateSubmission(fields({ fileBytes: 7.5 * 1024 * 1024 })).fileBytes
    ).toBe(
      "A Demo can be at most 5 MB. That file is 7.5 MB — trim it and try again."
    )
  })

  it("accepts a file exactly at the limit", () => {
    // The boundary, asserted rather than assumed: `>` not `>=`, so a file of
    // exactly 5 MB is sent rather than refused by an off-by-one.
    expect(
      validateSubmission(fields({ fileBytes: MAX_DEMO_BYTES })).fileBytes
    ).toBeUndefined()
    expect(
      validateSubmission(fields({ fileBytes: MAX_DEMO_BYTES + 1 })).fileBytes
    ).toBeDefined()
  })

  it("requires the consent box", () => {
    expect(validateSubmission(fields({ consent: false })).consent).toBe(
      "Tick the box to confirm this is yours to send."
    )
  })

  it("reports every problem at once rather than the first", () => {
    // One field per round trip is how a form takes five attempts to fill in.
    const errors = validateSubmission(
      fields({ contributor: "", caption: "", category: "", consent: false })
    )
    expect(Object.keys(errors).sort()).toEqual([
      "caption",
      "category",
      "consent",
      "contributor",
    ])
  })
})

describe("hasErrors", () => {
  it("is false only for an empty error map", () => {
    expect(hasErrors({})).toBe(false)
    expect(hasErrors({ caption: "x" })).toBe(true)
  })
})
