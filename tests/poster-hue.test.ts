import { describe, expect, it } from "vitest"

import { dominantHue } from "../lib/poster-hue"

// The one non-obvious piece of arithmetic in `pnpm assets:measure`, tested
// directly so the script never has to be executed to prove it. The algorithm
// exists because sharp's own stats() dominant colour is wrong for this
// catalogue: the largest block of pixels on a UI recording's Poster is the
// app's white or black background, so "the dominant colour" comes back grey
// and its hue is 0 — which would tint the whole tile red.
//
// The floor values here are the ticket's, stated in the script's header:
// chroma below 0.08 is treated as chrome, and colour covering less than
// 0.5% of the pixels is too little to glow in.

function rgbFill(
  r: number,
  g: number,
  b: number,
  width: number,
  height: number
): Buffer {
  const buf = Buffer.alloc(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    buf[i * 3] = r
    buf[i * 3 + 1] = g
    buf[i * 3 + 2] = b
  }
  return buf
}

// Paint a sub-rectangle over a raw RGB buffer.
function paint(
  buf: Buffer,
  width: number,
  r: number,
  g: number,
  b: number,
  x0: number,
  y0: number,
  w: number,
  h: number
): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * width + x) * 3
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
    }
  }
}

describe("dominantHue", () => {
  // The background of every UI Poster is some grey; that is the whole reason
  // the algorithm exists, so grey must come back null rather than red (hue 0).
  it("returns null for a buffer of pure grey", () => {
    expect(dominantHue(rgbFill(128, 128, 128, 8, 8))).toBeNull()
  })

  it("returns null for white with a handful of red pixels", () => {
    const width = 100
    const buf = rgbFill(255, 255, 255, width, 100)
    paint(buf, width, 255, 0, 0, 0, 0, 10, 1)
    expect(dominantHue(buf)).toBeNull()
  })

  it("returns a hue within 2 degrees of 0 for half red, half white", () => {
    const width = 100
    const buf = rgbFill(255, 255, 255, width, 100)
    paint(buf, width, 255, 0, 0, 0, 0, width, 50)
    const hue = dominantHue(buf)
    expect(hue).not.toBeNull()
    expect(Math.abs(hue! - 0)).toBeLessThan(2)
  })

  it("returns a hue within 2 degrees of 210 for half (0,128,255), half black", () => {
    const width = 100
    const buf = rgbFill(0, 0, 0, width, 100)
    paint(buf, width, 0, 128, 255, 0, 0, width, 50)
    const hue = dominantHue(buf)
    expect(hue).not.toBeNull()
    expect(Math.abs(hue! - 210)).toBeLessThan(2)
  })
})
