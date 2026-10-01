// tests/recording-detail.test.ts
//
// The two pure derivations the Recording detail makes that are cheap to pin
// exactly: the media box's "a:b" label from ticket 03's measured aspect, and
// the Contributor-block initials rule (ticket 09 step 5) — `Thomino` gives `T`,
// `Enzo Manuel Mangano (Reactiive)` gives `EM`, and `Epicode | 0xV` gives `E`
// rather than `E|`.
import { describe, expect, it } from "vitest"

import { contributorInitials, formatAspect } from "@/components/recording-detail"

describe("contributorInitials", () => {
  it("takes the first letter of the first two alphabetic words", () => {
    expect(contributorInitials("Thomino")).toBe("T")
    expect(contributorInitials("Daehyeon Mun (文…)")).toBe("DM")
    expect(contributorInitials("Enzo Manuel Mangano (Reactiive)")).toBe("EM")
  })

  it("skips words that do not begin with a letter", () => {
    expect(contributorInitials("Epicode | 0xV")).toBe("E")
  })
})

describe("formatAspect", () => {
  it("renders a measured width÷height as a:b", () => {
    expect(formatAspect(0.5625)).toBe("9:16")
    expect(formatAspect(1)).toBe("1:1")
    expect(formatAspect(1.5)).toBe("3:2")
  })
})
