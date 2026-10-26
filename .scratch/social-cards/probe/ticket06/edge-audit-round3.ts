/**
 * The same edge and overflow audit as round 1, applied to the four new variants.
 * The byline is now two lines and 44px tall, so the text column is taller than
 * before -- which is exactly the kind of change that clips at the bottom.
 */
import { readdirSync } from "node:fs"
import sharp from "sharp"

const OUT = new URL("../../preview/out-n/", import.meta.url).pathname

async function main() {
  const files = readdirSync(OUT).filter((f) => f.endsWith(".png")).sort()
  const problems: string[] = []
  for (const f of files) {
    const { data, info } = await sharp(`${OUT}${f}`).raw().toBuffer({ resolveWithObject: true })
    const { width: W, height: H, channels: ch } = info
    const px = (x: number, y: number) => { const i = (y * W + x) * ch; return [data[i], data[i + 1], data[i + 2]] }
    const isCanvas = (p: number[]) => Math.abs(p[0] - 0x0a) < 6 && Math.abs(p[1] - 0x0b) < 6 && Math.abs(p[2] - 0x0d) < 6

    // The text column must never touch the left or top edge. The right rail is
    // allowed to, and D4 additionally pulls its Poster in from the rail's edge.
    let left = 0, top = 0
    for (let y = 0; y < H; y++) for (const x of [0, 1, 2]) if (!isCanvas(px(x, y))) left++
    for (let x = 0; x < W; x++) for (const y of [0, 1, 2]) if (!isCanvas(px(x, y))) top++
    if (left > 12) problems.push(`${f}: ${left} px in the left 3 cols — text safe area broken`)
    if (top > 12) problems.push(`${f}: ${top} px in the top 3 rows — text safe area broken`)

    // Nothing may run off the BOTTOM of the TEXT COLUMN. Measured strictly
    // inside the column: the rail's 1px `--e0` hairline sits exactly on the
    // column/rail boundary and is a designed edge, so counting it reported a
    // false clipping failure on every render (D3 "21 ink px in row 629" was 21px
    // of hairline at x=839, not a byline). The column is 880 - 160 padding = 720
    // of content, and its right boundary is the rail.
    const colRight = f.startsWith("D2") || f.startsWith("D4") ? 800 : 760
    let bottomInk = 0
    for (let x = 0; x < colRight; x++) for (const y of [H - 3, H - 2, H - 1]) if (!isCanvas(px(x, y))) bottomInk++
    if (bottomInk > 0) problems.push(`${f}: ${bottomInk} px in the bottom 3 rows of the text column — clipped?`)

    let lowest = 0
    for (let y = H - 1; y >= 0; y--) {
      let any = false
      for (let x = 0; x < colRight; x++) if (!isCanvas(px(x, y))) { any = true; break }
      if (any) { lowest = y; break }
    }
    const margin = H - 1 - lowest
    if (margin < 40) problems.push(`${f}: lowest text ink is only ${margin}px from the bottom edge`)
    console.log(`${f.padEnd(18)} lowest text ink y=${String(lowest).padStart(3)}  margin ${String(margin).padStart(3)}px`)
  }
  console.log("")
  if (problems.length === 0) console.log("PASS — no clipping, no edge violations")
  else { console.log(`${problems.length} findings:`); for (const p of problems) console.log("  " + p) }
}
main()
