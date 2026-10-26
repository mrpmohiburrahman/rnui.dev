/**
 * What is the largest scale factor at which EVERY caption in the catalogue
 * fits a fixed box? That is the real constraint -- 36 chars is the longest
 * caption that exists, so the design must hold it, not a typical one.
 *
 * Measured by rendering, not by estimating: Satori's line breaking is the
 * thing being measured, and estimating it with average-advance maths would be
 * exactly the kind of confidence that ships a clipped card.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createElement as h } from "react"
import sharp from "sharp"
import { ImageResponse } from "next/og"
import { allRecordings } from "@/data/catalogue"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)), F("JetBrainsMono", 400), F("JetBrainsMono", 700)]
const OUT = new URL("../../probe-out/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const C = { canvas: "#0A0B0D", t1: "#F1F2F4" }

/** Every distinct caption, longest first. */
const CAPS = Array.from(new Set(allRecordings.map((r) => r.caption))).sort(
  (a, b) => b.length - a.length
)
console.log(`${CAPS.length} distinct captions; longest ${CAPS[0].length} chars: "${CAPS[0]}"`)

async function main() {
  // The hardest case only, in a 520px column, at a ladder of scales.
  for (const K of [3.16, 2.8, 2.6, 2.4, 2.2]) {
    const buf = Buffer.from(
      await new ImageResponse(
        h(
          "div",
          { style: { background: C.canvas, width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 20 } },
          h(
            "div",
            {
              style: {
                fontFamily: "Space Grotesk", fontSize: 29 * K, lineHeight: 1.15, fontWeight: 500,
                letterSpacing: "-0.02em", color: C.t1, maxWidth: 520,
              },
            },
            CAPS[0]
          )
        ),
        { width: 560, height: 620, fonts }
      ).arrayBuffer()
    )
    // How many lines? Count rows of ink.
    const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true })
    const rowHasInk: boolean[] = []
    for (let y = 0; y < info.height; y++) {
      let ink = false
      for (let x = 0; x < info.width; x++) if (data[y * info.width + x] > 40) { ink = true; break }
      rowHasInk.push(ink)
    }
    // count ink bands, ignoring bands thinner than 4px (ascender/descender spill)
    let bands = 0, run = 0, lastY = -99
    for (let y = 0; y < rowHasInk.length; y++) {
      if (rowHasInk[y]) { if (y - lastY > 4) bands++; lastY = y }
    }
    const top = rowHasInk.findIndex(Boolean)
    const bottom = rowHasInk.lastIndexOf(true)
    const px = `${(29 * K).toFixed(0)}px`
    console.log(
      `K=${K}  hero ${px.padEnd(6)} lines=${bands}  ink ${top}..${bottom} of ${info.height}` +
        (bottom >= info.height ? "   <-- CLIPPED" : "")
    )
    writeFileSync(`${OUT}BND-K${String(K).replace(".", "")}.png`, buf)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
