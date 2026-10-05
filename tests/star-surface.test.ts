import { describe, expect, it } from "vitest"

import { showStarControl } from "@/lib/star-surface"

// github-star-button ticket 04, step 1: the surface gate.
//
// `6acf554` is not the precedent here — this is the header. The control is
// **live site only**, because the Preview carries no build of its own
// (`3c32dfe` made `preview.rnui.dev` 308 to the live site) and a star chip on a
// branch alias would advertise a count to a build that is not the site.
//
// The decision that shapes this file: **the predicate is a module, not a
// constant.** A module-level `const SHOW_STARS = process.env.VERCEL_ENV !==
// "preview"` inside the header component cannot be unit tested at all — it is
// evaluated at import time, before any test can set an environment variable, so
// its truth table would be asserted by reading it rather than by running it. And
// a policy that fails silently is exactly the kind that does: a wrong constant
// hides the control on production and no test anywhere notices, because there is
// no test anywhere.
//
// So it is a function, and this file pins the whole table.

describe("showStarControl", () => {
  it("hides on the Preview, which serves no build of its own", () => {
    expect(showStarControl("preview")).toBe(false)
  })

  it("shows on production", () => {
    expect(showStarControl("production")).toBe(true)
  })

  it("shows when the variable is absent, so a local dev server still builds it", () => {
    // The fail-open half of the decision, asserted rather than described. Without
    // this the control is invisible on every local run and every screenshot.
    expect(showStarControl(undefined)).toBe(true)
    expect(showStarControl("")).toBe(true)
  })

  it("reads VERCEL_ENV by default, so no caller has to pass anything", () => {
    // The call sites pass nothing; this is what makes them testable. If a future
    // refactor makes the parameter required, the header stops compiling — which
    // is the point of not making it required.
    expect(showStarControl()).toBe(process.env.VERCEL_ENV !== "preview")
  })

  it("is stable across calls, so both header layouts read the same answer", () => {
    // Not memoized on purpose: `process.env.VERCEL_ENV` is inlined at build time,
    // so the value cannot change within a page's life and a `useMemo` would be
    // ceremony. What matters is that both header layouts read the SAME call —
    // two evaluations is how the two `Saved` spellings drifted apart.
    expect(showStarControl("production")).toBe(true)
    expect(showStarControl("production")).toBe(true)
  })
})