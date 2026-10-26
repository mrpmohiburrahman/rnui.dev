// PROTOTYPE — ticket 04. Throwaway.
//
//   pnpm tsx .scratch/social-cards/probe/ticket04/shadow-clip-probe.tsx
//
// `clip-probe.tsx` proved `overflow: hidden` clips a child's **background**. This
// asks the next question, which round 3's audit forced: does it clip the child's
// **`box-shadow`**?
//
// It does not, and that is why round 3's cards still showed ink in the 42px gap
// between the text column and the tile field: the tiles are clipped, but each
// glowing tile drags a blurred green halo out past the boundary. The brightest
// spill pixel measured `[59,75,39]` against a canvas of `[10,11,13]` — green, not
// type. So a card whose whole safety argument is "the field is clipped" has a hole
// in it exactly where the type needs to be legible.

import { readFileSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [F("SpaceGrotesk", 400)]
const OUT = new URL("../../preview/probe-t04/", import.meta.url).pathname

async function main() {
  // A glowing child flush against the box's LEFT edge, inside a clipped container.
  // Its 60px blur should reach 60px to the left of x=620 if shadows are not clipped.
  const tree = (shadow: string) =>
    h(
      "div",
      { style: { width: "100%", height: "100%", display: "flex", background: "#0A0B0D", position: "relative" } },
      h(
        "div",
        { style: { position: "absolute", left: 620, top: 0, bottom: 0, right: 0, display: "flex", overflow: "hidden" } },
        h("div", {
          style: {
            position: "absolute", left: 0, top: 200, width: 200, height: 200,
            background: "#101216", borderRadius: 10, boxShadow: shadow,
          },
        })
      )
    )

  for (const [label, shadow] of [
    ["glow", "0 0 0 1px rgba(111,227,204,0.3), 0 22px 54px -20px rgba(111,227,204,0.55)"],
    ["flat", "0 0 0 1px rgba(255,255,255,0.09)"],
  ] as [string, string][]) {
    const res = new ImageResponse(tree(shadow) as any, { width: 1200, height: 630, fonts })
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(`${OUT}shadow-${label}.png`, buf)
    const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const at = (x: number, y: number) => {
      const o = (y * info.width + x) * info.channels
      return [data[o], data[o + 1], data[o + 2]]
    }
    const bg = [0x0a, 0x0b, 0x0d]
    // How far left of the clip edge (x=620) does non-canvas ink reach, at the
    // child's own vertical centre (y=300)?
    let reach = 0
    let peak = 0
    for (let x = 620; x >= 0; x--) {
      const q = at(x, 300)
      const d = Math.max(q[0] - bg[0], q[1] - bg[1], q[2] - bg[2])
      if (d > 8) { reach = 620 - x; peak = Math.max(peak, d) }
    }
    console.log(`${label.padEnd(5)} shadow escapes the clip by ${reach}px left of x=620 (peak channel delta ${peak})`)
  }
  console.log("\nExpected if shadows are clipped: 0px for both.")
}

main().catch((e) => { console.error(e); process.exit(1) })
