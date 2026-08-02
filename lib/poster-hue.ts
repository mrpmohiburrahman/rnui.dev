// lib/poster-hue.ts
//
// The one piece of non-obvious arithmetic behind `pnpm assets:measure`, split
// out of the script so it can be unit-tested without fetching 277 Posters.
// lib/asset-path.ts is the precedent: a lib/ module whose consumers are mostly
// scripts.
//
// Why this exists at all: sharp's stats() dominant colour is the wrong answer
// for this catalogue. A UI recording's Poster is mostly the app's white or
// black background, so the largest block of pixels is grey, its hue is 0, and
// feeding that to the tile's glow would tint 240-odd tiles red. The hue has to
// come from the coloured minority of the pixels, not from the majority.
//
// The algorithm, stated exactly:
//
//   - For each pixel compute max, min and chroma c = max - min on the 0-1
//     scale, and skip any pixel with c < 0.08 — the greyscale of the app
//     chrome (white sheets, black backgrounds, grey text), which is most of
//     every Poster in this catalogue.
//   - For the rest, hue in degrees by the usual sextant formula, accumulated
//     into 36 bins of 10 degrees, each pixel weighted by its own chroma.
//   - If the total accumulated chroma is below 0.005 × pixelCount, a Poster
//     whose colour is half a percent of its area has no colour worth glowing
//     in — return null.
//   - Otherwise take the heaviest bin and return the chroma-weighted circular
//     mean inside it, not the bin's centre, so committed values are real
//     numbers rather than a set of multiples of ten.

const BINS = 36
const BIN_DEGREES = 10
/** Below this chroma a pixel is treated as grey app chrome, not as colour. */
const CHROMA_FLOOR = 0.08
/** Below this share of the pixels, the colour is noise, not an emission. */
const COVERAGE_FLOOR = 0.005

/**
 * The dominant hue of a raw 3-channel RGB buffer, in integer degrees in
 * [0, 360), or null when the buffer has no colour worth glowing in.
 */
export function dominantHue(rgb: Buffer): number | null {
  const pixelCount = rgb.length / 3
  const sumC = new Float64Array(BINS)
  const sumX = new Float64Array(BINS)
  const sumY = new Float64Array(BINS)

  for (let i = 0; i < rgb.length; i += 3) {
    const r = rgb[i] / 255
    const g = rgb[i + 1] / 255
    const b = rgb[i + 2] / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const c = max - min

    if (c < CHROMA_FLOOR) continue

    // Sextant formula, hue in degrees on [0, 360).
    let hue: number
    if (max === r) hue = ((g - b) / c) % 6
    else if (max === g) hue = (b - r) / c + 2
    else hue = (r - g) / c + 4
    hue *= 60
    if (hue < 0) hue += 360

    const bin = Math.min(Math.floor(hue / BIN_DEGREES), BINS - 1)
    const rad = (hue * Math.PI) / 180
    sumC[bin] += c
    sumX[bin] += c * Math.cos(rad)
    sumY[bin] += c * Math.sin(rad)
  }

  let totalC = 0
  for (let bin = 0; bin < BINS; bin++) totalC += sumC[bin]

  if (totalC < COVERAGE_FLOOR * pixelCount) return null

  let heaviest = 0
  for (let bin = 1; bin < BINS; bin++) {
    if (sumC[bin] > sumC[heaviest]) heaviest = bin
  }

  const degrees = (Math.atan2(sumY[heaviest], sumX[heaviest]) * 180) / Math.PI
  return Math.round((degrees + 360) % 360)
}
