/**
 * Contrast, measured against each glyph's TRUE backdrop.
 *
 * Method, and why each step is needed:
 *  1. render the card, and render it again with the caption text removed. The
 *     caption's box is a FIXED height (variants.tsx), so removing the text does
 *     not reflow anything -- the second render is a pixel-exact backdrop.
 *  2. a pixel is text ink where the two renders differ by >= 40 in sum AND the
 *     pixel is within tolerance of one of the four ink colours.
 *  3. reject anti-aliased edges: require the whole 5x5 neighbourhood to be the
 *     same ink. An edge pixel is a blend, and a blend always measures ~1.00 --
 *     which is a fact about the rasteriser, not about legibility.
 *  4. report the worst ratio over solid interiors.
 *
 * This is the measurement the ticket demanded: "a scrim over a busy Poster can
 * fail contrast, and that has to be measured rather than eyeballed."
 */
import { readFileSync } from "node:fs"
import sharp from "sharp"
import { ImageResponse } from "next/og"

import { VARIANTS, render, rendition, type Subject } from "../../preview/variants"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)), F("JetBrainsMono", 400), F("JetBrainsMono", 700)]

const lum = (r: number, g: number, b: number) => {
  const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: number, b: number) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05) }

const INKS: [string, number[]][] = [
  ["t1", [0xf1, 0xf2, 0xf4]], ["t2", [0xb2, 0xb8, 0xc2]], ["t3", [0x8e, 0x94, 0x9f]], ["acc", [0x6f, 0xe3, 0xcc]],
]
const near = (px: number[], ink: number[], tol = 30) =>
  Math.abs(px[0] - ink[0]) <= tol && Math.abs(px[1] - ink[1]) <= tol && Math.abs(px[2] - ink[2]) <= tol

async function main() {
  const subs: Subject[] = [
    { key: "snake", caption: "Snake", contributor: "Pushkar Tandon", category: "Full Apps", hue: 356, poster: rendition("snake", "tall"), aspect: 0.477 },
    { key: "fluid", caption: "Fluid Carousels", contributor: "William Candillon", category: "Carousels", hue: 167, poster: rendition("fluid", "tall"), aspect: 0.4721 },
    { key: "ripple", caption: "Ripple Effect With React Native Skia", contributor: "Daehyeon Mun (문대현)", category: "Misc", hue: 25, poster: rendition("ripple", "tall"), aspect: 0.605 },
    { key: "noster", caption: "Toast", contributor: "Enzo Manuel Mangano (Reactiive)", category: "Misc", hue: undefined, poster: null },
    { key: "worst", caption: "Spread Cards Effect ( Color Swatch )", contributor: "Enzo Manuel Mangano (Reactiive)", category: "Misc", hue: 273, poster: rendition("ripple", "tall"), aspect: 0.605 },
    { key: "land", caption: "Reanimated Bottom Sheet", contributor: "Kacper Kapuściak", category: "Bottom Sheets", hue: 210, poster: rendition("land", "tall"), aspect: 1.7778 },
  ]
  const rows: any[] = []
  for (const v of VARIANTS) {
    for (const s of subs) {
      const a = await sharp(Buffer.from(await new ImageResponse(render(v.key as any, s) as any, { width: 1200, height: 630, fonts }).arrayBuffer())).raw().toBuffer({ resolveWithObject: true })
      const b = await sharp(Buffer.from(await new ImageResponse(render(v.key as any, { ...s, caption: "" }) as any, { width: 1200, height: 630, fonts }).arrayBuffer())).raw().toBuffer({ resolveWithObject: true })
      const { width: W, height: H, channels: ch } = a.info
      const px = (buf: Buffer, x: number, y: number) => { const i = (y * W + x) * ch; return [buf[i], buf[i + 1], buf[i + 2]] }
      const R = 2
      let worst = Infinity, worstAt: any = null, n = 0
      for (let y = R; y < H - R; y++) for (let x = R; x < W - R; x++) {
        const p = px(a.data, x, y), q = px(b.data, x, y)
        if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) < 40) continue
        const found = INKS.find(([, c]) => near(p, c))
        if (!found) continue
        let solid = true
        for (let dy = -R; dy <= R && solid; dy++) for (let dx = -R; dx <= R; dx++)
          if (!near(px(a.data, x + dx, y + dy), found[1])) { solid = false; break }
        if (!solid) continue
        n++
        const r = ratio(lum(p[0], p[1], p[2]), lum(q[0], q[1], q[2]))
        if (r < worst) { worst = r; worstAt = { x, y, ink: found[0] } }
      }
      rows.push({ v: v.key, s: s.key, overlay: v.key === "B" || v.key === "E", worst: +worst.toFixed(2), n, at: worstAt })
    }
  }
  console.log("SOLID glyph interior vs true backdrop · fixed-height box, no reflow")
  console.log("var subj    overlay  worst  solid px  where")
  for (const r of rows.sort((a, b) => a.worst - b.worst))
    console.log(`${r.v}   ${r.s.padEnd(8)} ${String(r.overlay).padEnd(7)} ${String(r.worst).padEnd(6)} ${String(r.n).padEnd(9)} ${JSON.stringify(r.at)}${r.overlay && r.worst < 3 ? "  <-- OVERLAY UNDER 3:1" : ""}`)
  const ov = rows.filter((r) => r.overlay).map((r) => r.worst).sort((a, b) => a - b)
  const flat = rows.filter((r) => !r.overlay).map((r) => r.worst).sort((a, b) => a - b)
  console.log(`\noverlay (B,E) worst ${ov[0]} · median ${ov[Math.floor(ov.length / 2)]}`)
  console.log(`non-overlay (A,C,D) worst ${flat[0]} · median ${flat[Math.floor(flat.length / 2)]}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
