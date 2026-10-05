import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { allRecordings } from "../data/catalogue"

// demo-capture-ratio ticket 02. The tile presents every Demo in the shape it was
// captured in, so the tile's box IS the capture standard — and the standard
// otherwise lives only in prose, in .claude/skills/add-recording/SKILL.md. A
// literal in a className and a sentence in a skill file are two statements of
// one rule with nothing comparing them, which is how the tile drifts back to
// 9/16 without anybody deciding to.
//
// The expectation below is written out by hand and deliberately NOT read from
// the component or from the skill, for the reason ADR-0005 gives: a test that
// takes its expectation from the code under test can no longer catch that code
// being wrong, because both sides are reading one sentence. Two statements of
// one rule read as an oversight and invite a tidy-up that removes the only
// guard. Do not merge them. See
// docs/adr/0005-the-data-test-states-the-asset-path-rules-independently.md.

// The iPhone 18 Pro simulator's own geometry, measured from a real
// `simctl io recordVideo` output. iPhone 17 and 17 Pro produce byte-identical
// dimensions on two different runtimes, so this is not one generation's
// artefact. Evidence: .scratch/demo-capture-ratio/evidence/README.md.
const CAPTURE_WIDTH = 1206
const CAPTURE_HEIGHT = 2622

const tile = readFileSync("components/demo-tile.tsx", "utf8")

// The box the tile reserves. Read as the literal pair, not as a computed
// fraction: the point is to catch the pair changing, and parsing one number out
// of a computed ratio would let the other move unnoticed.
function tileAspectPair(): { w: number; h: number } | null {
  const match = tile.match(/aspect-\[(\d+)\/(\d+)\]/)
  if (!match) return null
  return { w: Number(match[1]), h: Number(match[2]) }
}

describe("the tile presents a Demo in the shape it was captured in", () => {
  it("the tile's box is the capture standard, stated here independently", () => {
    expect(tileAspectPair()).toEqual({
      w: CAPTURE_WIDTH,
      h: CAPTURE_HEIGHT,
    })
  })

  it("the tile is not the uniform 9/16 it replaced", () => {
    // The crop this fixes: at 9/16 the box cuts ~22% off the height of every
    // one of the 171 phone-shaped Demos, status bars and home indicators
    // included. Stated as a ratio rather than as the literal string so the
    // assertion is about the geometry, not about one way of spelling it.
    const pair = tileAspectPair()
    expect(pair).not.toBeNull()
    expect(pair!.w / pair!.h).not.toBeCloseTo(9 / 16, 4)
  })

  it("the ratio is within the skill's own +/-0.5% tolerance of the standard", () => {
    // The band is the skill's, and 0.5% is not arbitrary: the catalogue's
    // commonest ratio is 0.4611, 0.25% away, so a tighter band would reject
    // the Demos already published.
    const pair = tileAspectPair()!
    const actual = pair.w / pair.h
    const standard = CAPTURE_WIDTH / CAPTURE_HEIGHT
    expect(Math.abs(actual - standard) / standard).toBeLessThanOrEqual(0.005)
  })

  it("the skill states the same dimensions and the same ratio the tile uses", () => {
    // The standard's other statement, and the two must agree. If a future iPhone
    // changes the geometry and only one of these two files moves, this fails
    // rather than the drift shipping silently.
    const skill = readFileSync(".claude/skills/add-recording/SKILL.md", "utf8")
    expect(skill).toContain(`${CAPTURE_WIDTH}x${CAPTURE_HEIGHT}`)
    // The skill's own spelling of the ratio, which is six places — checked as
    // the computed value rather than pasted, so a rounding change in the skill
    // is caught without this file having to know how many digits it uses.
    expect(skill).toContain((CAPTURE_WIDTH / CAPTURE_HEIGHT).toFixed(6))
  })

  it("the band the skill chose is wide enough for the Demos already published", () => {
    // Why the tolerance is 0.5% and not tighter. This is the claim that decides
    // it, and the claim is about the catalogue rather than about the tile — so
    // it is checked against the catalogue, not asserted here. 133 of 298 sit
    // inside the band and the commonest ratio, 0.4611, is 0.25% away, so a
    // tighter band would reject Demos that are already published.
    const STANDARD = CAPTURE_WIDTH / CAPTURE_HEIGHT
    const withinBand = allRecordings.filter(
      (r) =>
        typeof r.aspect === "number" &&
        Math.abs(r.aspect - STANDARD) / STANDARD <= 0.005
    )
    expect(withinBand.length).toBeGreaterThan(100)
  })
})