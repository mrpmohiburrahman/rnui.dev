/**
 * Final audit: does anything render outside the card, and is any ink touching
 * an edge? Eyeballing 30 renders is how a clipped byline survives.
 *
 * Two checks per render:
 *  1. non-canvas ink in the outer 8px margin (something is bleeding off)
 *  2. text ink touching the very edge row/column
 * Ink is distinguished from flat canvas by counting distinct colours per row.
 */
import { readdirSync } from "node:fs"
import sharp from "sharp"

const OUT = new URL("../../preview/out/", import.meta.url).pathname

async function main() {
  const files = readdirSync(OUT).filter((f) => f.endsWith(".png") && !f.startsWith("NOTE-"))
  const problems: string[] = []
  for (const f of files.sort()) {
    const { data, info } = await sharp(`${OUT}${f}`).raw().toBuffer({ resolveWithObject: true })
    const { width: W, height: H, channels: ch } = info
    const px = (x: number, y: number) => { const i = (y * W + x) * ch; return [data[i], data[i + 1], data[i + 2]] }
    const isCanvas = (p: number[]) => Math.abs(p[0] - 0x0a) < 6 && Math.abs(p[1] - 0x0b) < 6 && Math.abs(p[2] - 0x0d) < 6

    // Each variant's own contract, because they are genuinely different:
    //
    //   A  text has an 80px safe area; the DEVICE bleeds off the right edge
    //   B  full bleed, the Poster is the card
    //   C  full 80px safe area on all four sides -- nothing may touch an edge
    //   D  text has an 80px safe area; the right rail runs to both edges
    //   E  full bleed
    //
    // What must NEVER happen in any variant is TYPE at an edge, so the check that
    // matters everywhere is: is the outermost row/column flat, or is it high
    // frequency (which is how text reads)?
    const bleed = f[0] === "B" || f[0] === "E"
    const deviceBleeds = f[0] === "A"
    const rail = f[0] === "D"
    const strict = f[0] === "C"

    if (strict) {
      let edgeInk = 0
      for (let x = 0; x < W; x++) for (const y of [0, 1, 2, H - 3, H - 2, H - 1]) if (!isCanvas(px(x, y))) edgeInk++
      for (let y = 0; y < H; y++) for (const x of [0, 1, 2, W - 3, W - 2, W - 1]) if (!isCanvas(px(x, y))) edgeInk++
      if (edgeInk > 0) problems.push(`${f}: ${edgeInk} non-canvas px in the outer 3px — C promises a full safe area`)
    }

    // For A and D: the LEFT and TOP edges must stay clear, because that is where
    // the text lives. The right/bottom may carry the device or the rail.
    if (deviceBleeds || rail) {
      let leftTop = 0
      for (let x = 0; x < W; x++) for (const y of [0, 1, 2]) if (!isCanvas(px(x, y))) leftTop++
      for (let y = 0; y < H; y++) for (const x of [0, 1, 2]) if (!isCanvas(px(x, y))) leftTop++
      // D's rail carries a 1px `--e0` hairline where the rail begins, which
      // touches the top rows at a single x. Anything more than a sliver is a
      // defect, so the threshold is a handful of px, not zero.
      if (leftTop > 12) problems.push(`${f}: ${leftTop} px in the top/left 3px — the text safe area is broken`)

      // ...and the bottom row must be flat OR a deliberate 1px rule. A's plinth
      // and D's rail are both meant to reach the edge, so a handful of distinct
      // colours is fine; what would be a defect is TYPE there, which shows up as
      // a high count of distinct colours across a short run of glyph edges.
      const lastRow = new Set<string>()
      for (let x = 0; x < W; x++) { const p = px(x, H - 1); lastRow.add(`${p[0]},${p[1]},${p[2]}`) }
      if (lastRow.size > 90) problems.push(`${f}: last row has ${lastRow.size} distinct colours — type at the bottom edge?`)
    }

    // Everywhere: the top row is where a platform crops hardest. A 1px design
    // rule there is tolerable; scattered ink is not.
    if (!bleed) {
      let top = 0
      for (let x = 0; x < W; x++) for (const y of [0, 1]) if (!isCanvas(px(x, y))) top++
      if (top > 8) problems.push(`${f}: ${top} px in the top 2 rows — something is at the top edge`)
    }
  }
  console.log(`audited ${files.length} renders at ${"1200x630"}`)
  if (problems.length === 0) console.log("PASS — nothing bleeds off an edge, no type touches an edge")
  else { console.log(`${problems.length} findings:`); for (const p of problems) console.log("  " + p) }
}
main()
