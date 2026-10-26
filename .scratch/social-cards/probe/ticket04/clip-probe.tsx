// PROTOTYPE — ticket 04. Throwaway.
//
//   pnpm tsx .scratch/social-cards/probe/ticket04/clip-probe.tsx
//
// Does `overflow: hidden` on a **container** clip its children in Satori?
//
// This matters because round 3's structural fix for tile-over-text collisions was
// exactly that: put the tiles in a box at `left: 620` with `overflow: hidden` and
// let the clip enforce the clearance. The audit then reported ink at x=619 — one
// pixel inside the intended boundary — on three variants, which is what a
// non-clipping container looks like.
//
// Ticket 06 established `overflow: hidden` clips a *text block's* own content. It
// says nothing about a container clipping positioned children, and those are
// different code paths in Satori. Measured here rather than assumed, because the
// whole fix depends on the answer.

import { readFileSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [F("SpaceGrotesk", 400), F("SpaceGrotesk", 700)]
const OUT = new URL("../../preview/probe-t04/", import.meta.url).pathname

/** A 200px-wide red child placed at left: -100 inside the box — it must not escape. */
function probe(label: string, boxStyle: Record<string, unknown>) {
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: "#0A0B0D", position: "relative" } },
    h(
      "div",
      { key: label, style: { position: "absolute", left: 620, top: 0, bottom: 0, width: 580, ...boxStyle } },
      // Three children that all try to escape: one far left, one far right, one below.
      h("div", { style: { position: "absolute", left: -300, top: 60, width: 200, height: 200, background: "#FF3B30" } }),
      h("div", { style: { position: "absolute", right: -300, top: 200, width: 200, height: 200, background: "#34C759" } }),
      h("div", { style: { position: "absolute", left: 100, top: 500, width: 200, height: 200, background: "#FFD60A" } })
    )
  )
}

async function main() {
  const cases: [string, Record<string, unknown>][] = [
    // `display: flex` is present in all three: Satori *requires* an explicit
    // display on any div with more than one child, so omitting it is a hard error
    // rather than a variable. (Found by this probe failing, not by reading a list.)
    ["clipA", { display: "flex", overflow: "hidden" }],
    ["clipB", { display: "flex", overflow: "hidden", flexDirection: "column" }],
    ["clipC", { display: "flex" }],
  ]
  for (const [label, style] of cases) {
    const res = new ImageResponse(probe(label, style) as any, { width: 1200, height: 630, fonts })
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(`${OUT}${label}.png`, buf)
    const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const at = (x: number, y: number) => {
      const o = (y * info.width + x) * info.channels
      return [data[o], data[o + 1], data[o + 2]]
    }
    const isRed = (q: number[]) => q[0] > 180 && q[1] < 110 && q[2] < 110
    const isGreen = (q: number[]) => q[1] > 150 && q[0] < 120 && q[2] < 130
    const isYellow = (q: number[]) => q[0] > 180 && q[1] > 170 && q[2] < 120
    // Where did each child actually land?
    const find = (pred: (q: number[]) => boolean) => {
      let minX = 9999, maxX = -1, minY = 9999, maxY = -1
      for (let y = 0; y < info.height; y += 2)
        for (let x = 0; x < info.width; x += 2) {
          if (!pred(at(x, y))) continue
          minX = Math.min(minX, x); maxX = Math.max(maxX, x)
          minY = Math.min(minY, y); maxY = Math.max(maxY, y)
        }
      return maxX < 0 ? "not rendered" : `x ${minX}–${maxX}, y ${minY}–${maxY}`
    }
    console.log(`\n=== ${label}  ${JSON.stringify(style)}`)
    console.log(`  box is x 620–1200, y 0–630`)
    console.log(`  red child   wanted x 320–520  → ${find(isRed)}`)
    console.log(`  green child wanted x 1080–1280 → ${find(isGreen)}`)
    console.log(`  yellow child wanted y 500–700  → ${find(isYellow)}`)
    const escaped = find(isRed).includes("x 3") || find(isGreen).includes("108")
    console.log(`  VERDICT: ${escaped ? "children ESCAPE the box — overflow:hidden does NOT clip positioned children" : "children are clipped"}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
