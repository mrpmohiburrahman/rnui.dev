// PROTOTYPE — ticket 04 round 3 audit. Throwaway.
//
//   pnpm tsx .scratch/social-cards/probe/ticket04/audit-ramp.ts
//
// Two checks, and they are exactly the two failures this round hit repeatedly —
// which is the only reason they exist. Neither infers geometry: both read the
// render and compare against constants the variant itself uses (`FIELD_X`).
//
//   1. **Text stays in its column.** The text column is `left: 76, width: 500`, so it
//      ends at **576**; anything with ink between 576 and the field's clip edge is a
//      string wider than its box. That is what happened to the counts strip four
//      times (668px of mono in a 500px column) and to the captions line once
//      ("Ripple Effect With Rea…" colliding with its neighbour).
//
//      The first version of this check asked for the rightmost text pixel to stop
//      before `FIELD_X` and reported three variants as overflowing at **x=619** —
//      one pixel inside the boundary. Dumped, those pixels are `[18,22,16]` against a
//      canvas of `[10,11,13]`: the **clip's own antialiased edge**, where a tile's
//      blurred `boxShadow` is cut off. Not a defect, and not text either. The check
//      now tests the column's declared width, which is a fact about the layout
//      rather than a guess about where the clip lands.
//
//      Which required knowing that the clip works at all — `probe/clip-probe.tsx`
//      measures it: **`overflow: hidden` on a container DOES clip its positioned
//      children** (a child at `left: -300` vanishes; without `overflow` it renders at
//      x=320). Satori also *requires* an explicit `display: flex` on any div with more
//      than one child, which is a hard error rather than a default.
//   2. **The tile field is not empty.** Ribbon rendered as a diagonal line of faint
//      outlines twice, and nothing said so. A field with no image content is a
//      silent failure: the card still looks like a card. Measured as the share of
//      the field's pixels that carry *colour* — a near-black canvas and a dark
//      Poster are both dark, so mean luminance cannot tell them apart, but
//      saturation and local variance can.
//
// Deliberately absent: any check that reconstructs a layout box from constants.
// Three earlier audits on this ticket did that and were wrong every time.

import { readdirSync } from "node:fs"
import sharp from "sharp"

const OUT = new URL("../../preview/out-ramp/", import.meta.url).pathname
const files = readdirSync(OUT).filter((f) => f.endsWith(".png") && !f.startsWith("_")).sort()

const BG = { dark: "#0A0B0D", light: "#F4F4F1" } as const
const FIELD_X = 644
/**
 * How far a clipped child's shadow reaches **outside** the clip.
 *
 *   flat 1px hairline:  0px   (probe/shadow-clip-probe.tsx)
 *   blurred glow:      20px  (same probe)
 *   blurred glow on a **rotated** child: 43px  (measured on Ramp-dark)
 *
 * The third figure is the one that matters and the probe does not produce it: a
 * shadow follows the child's *rotated* bounding box, which a -8deg rotation widens by
 * ~25px per side before the blur is added. So "the field is clipped" is not a safety
 * argument on its own, and the clearance a card needs is 43px, not 0.
 */
const GLOW_ESCAPE = 43
/** The window a text overflow would appear in: after the column, before the glow. */
const SPILL_X0 = 576
const SPILL_X1 = FIELD_X - GLOW_ESCAPE

async function audit(label: string) {
  const mode = label.endsWith("light") ? "light" : "dark"
  const key = label.replace(/-(dark|light)$/, "")
  const { data, info } = await sharp(`${OUT}${label}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const bgHex = BG[mode]
  const bgr = [1, 3, 5].map((i) => parseInt(bgHex.slice(i, i + 2), 16)) as number[]
  const at = (x: number, y: number) => {
    const o = (y * W + x) * C
    return [data[o], data[o + 1], data[o + 2]]
  }
  const isCanvas = (q: number[]) => Math.max(Math.abs(q[0] - bgr[0]), Math.abs(q[1] - bgr[1]), Math.abs(q[2] - bgr[2])) < 14

  // -- 1. Does any ink land between the text column's right edge and the clip?
  const COL_X0 = 76
  const COL_X1 = 576 // left 76 + width 500, both declared in the variant
  let maxTextX = 0
  let spill = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < FIELD_X; x++) {
      if (isCanvas(at(x, y))) continue
      if (x > maxTextX) maxTextX = x
    }
  }
  // Sustained **type-like** ink in the gap means a string overflowed its box.
  //
  // "Type-like" is the discriminator, and it is needed because the gap legitimately
  // contains the tiles' halo. Two earlier versions got this wrong:
  //
  //   * Count any non-canvas pixel — reported Ramp as 142 overflowing rows when the
  //     truth was that its glow reaches 43px and the type ends at 576, 25px clear.
  //   * Luminance above 100 with saturation below 30 — correct on dark, and wrong on
  //     **every light variant** (630 rows each), because on a `#F4F4F1` canvas the
  //     *background* is the bright thing and passes both tests.
  //
  // So the test is **contrast against this card's own canvas**, which means the same
  // in both modes. Measured deltas on the dark canvas: `--t1` 231, `--t2` ~170,
  // `--t3` ~140, and the glow's peak **49**. A threshold of 90 separates them with
  // room on both sides, and on the light canvas the deltas are the same magnitudes
  // with the sign flipped.
  const isType = (q: number[]) =>
    Math.max(Math.abs(q[0] - bgr[0]), Math.abs(q[1] - bgr[1]), Math.abs(q[2] - bgr[2])) > 90
  let spillRows = 0
  let haloReach = 9999
  for (let y = 0; y < H; y++) {
    let run = 0
    for (let x = SPILL_X0; x < SPILL_X1; x++) {
      const q = at(x, y)
      if (!isCanvas(q)) haloReach = Math.min(haloReach, x)
      if (isType(q)) run++
      else { if (run >= 3) { spillRows++; break } run = 0 }
    }
    if (run >= 3) spillRows++
  }

  // -- 2. Does the field carry image content?
  // Saturation: max(r,g,b) - min(r,g,b). The canvas is a neutral, so a neutral
  // region scores 0 whatever its luminance, and any Poster scores something.
  let coloured = 0
  let fieldPx = 0
  let fx0 = 9999
  let fx1 = -1
  for (let y = 0; y < H; y += 2) {
    for (let x = FIELD_X; x < W; x += 2) {
      fieldPx++
      const q = at(x, y)
      if (isCanvas(q)) continue
      const sat = Math.max(q[0], q[1], q[2]) - Math.min(q[0], q[1], q[2])
      if (sat <= 18) continue
      coloured++
      if (x < fx0) fx0 = x
      if (x > fx1) fx1 = x
    }
  }
  const coverage = (100 * coloured) / fieldPx
  // A sparse diagonal legitimately covers very little of the field — Aperture and
  // Echo are nine tiles in 580x630 and *should* read as ~10%. So coverage alone is
  // the wrong test (the first version demanded 12% and failed all three sparse
  // variants). What actually matters is that the imagery is **present** and spread
  // across the field rather than bunched in one corner, so the second half of the
  // check is the horizontal span.
  const span = fx1 < 0 ? 0 : (100 * (fx1 - fx0)) / W

  return {
    label,
    rightmostTextPx: maxTextX,
    haloReachPx: haloReach === 9999 ? "-" : haloReach,
    spillRows,
    textVerdict: spillRows === 0 ? "in column" : `${spillRows} ROWS OVERFLOW`,
    fieldColourPct: +coverage.toFixed(1),
    fieldSpanPct: +span.toFixed(0),
    fieldVerdict: coloured > 2000 && span > 25 ? "has imagery" : "FIELD IS EMPTY",
  }
}

async function main() {
  console.log(`== renders ==\n${files.map((f) => "  " + f).join("\n")}`)
  const rows: any[] = []
  for (const f of files) rows.push(await audit(f.replace(/\.png$/, "")))
  console.log(`\n== text column (x<${SPILL_X0}) vs glow reach (x>=${SPILL_X1}) + tile field ==`)
  console.table(rows)
  const bad = rows.filter((r) => !r.textVerdict.startsWith("in column") || r.fieldVerdict !== "has imagery")
  console.log(bad.length === 0 ? "\nAll 12 pass both checks." : `\n${bad.length} FAIL: ${bad.map((b) => b.label).join(", ")}`)
  console.log(
    `\nTwo numbers worth keeping:\n` +
      `  field-coverage % is NOT the test — a nine-tile diagonal covers little of a 556x630\n` +
      `  field by design. The test is presence plus horizontal spread.\n` +
      `  a clipped child's shadow is NOT contained: 0px for a flat hairline, 20px for a\n` +
      `  blurred glow, 43px for a blurred glow on a ROTATED child. Measured. So the type\n` +
      `  clearance a card needs is ${GLOW_ESCAPE}px, and "the field is clipped" is not by\n` +
      `  itself a safety argument.`
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
