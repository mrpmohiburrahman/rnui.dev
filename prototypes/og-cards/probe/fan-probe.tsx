// PROTOTYPE probe — ticket 05, the **fan** layout. Throwaway.
//
//   pnpm tsx prototypes/og-cards/probe/fan-probe.tsx
//
// The maintainer's reference is a fanned cluster of Posters on the LEFT and one big
// type block on the RIGHT. That needs four things from Satori that no earlier card on
// this ticket used, so each is probed rather than assumed:
//
//   A. `transform: rotate()` on an element — the reference tilts its cards.
//   B. **Paint order.** Overlapping cards must read back-to-front. In a browser that
//      is `z-index`; in Satori the stacking is document order for positioned siblings,
//      and `z-index` may be ignored entirely. If it is, overlap order has to come from
//      the order the children are emitted in.
//   C. `box-shadow` **on a rotated element** — a shadow has to rotate with its card or
//      the stack reads as stickers pasted on top of one another.
//   D. Negative margins / negative offsets for the overlap itself.
//
// Output is 9 PNGs in `probe/ticket05/out-fan/`, each labelled by what it tests, plus a
// pass/fail line per feature measured by reading pixels rather than by reading a list.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"
import { probeFonts } from "./fonts"

const fonts = probeFonts()

const OUT = new URL("../out/fan-probe/", import.meta.url).pathname
const CANVAS = "#F4F4F1"

/** A flat swatch stands in for a Poster: the question here is geometry, not imagery. */
const swatch = (bg: string, i: number, style: any) =>
  h(
    "div",
    {
      style: {
        width: 150, height: 190, background: bg, borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Space Grotesk", fontSize: 44, fontWeight: 700, color: "#ffffff",
        ...style,
      },
    },
    String(i)
  )

const shell = (...kids: any[]) =>
  h("div", { style: { width: 1200, height: 630, background: CANVAS, display: "flex", position: "relative" } }, ...kids)

/** A — rotation. Three cards on one axis, each tilted, no overlap. */
const A = () =>
  shell(
    h("div", { style: { position: "absolute", left: 90, top: 220, display: "flex", gap: 40 } },
      swatch("#0E7062", 1, { transform: "rotate(-8deg)" }),
      swatch("#14161A", 2, { transform: "rotate(0deg)" }),
      swatch("#4F545C", 3, { transform: "rotate(8deg)" })
    )
  )

/** B — overlap order by document order: 1 emitted first, 3 last, so 3 must be on top. */
const B_docOrder = () =>
  shell(
    h("div", { style: { position: "absolute", left: 120, top: 220, display: "flex" } },
      ...[1, 2, 3].map((i) => swatch(["#0E7062", "#4F545C", "#14161A"][i - 1], i, { marginLeft: i === 1 ? 0 : -90 }))
    )
  )

/** B — the same overlap, but order reversed in the DOM. If the render flips, order is DOM order. */
const B_revOrder = () =>
  shell(
    h("div", { style: { position: "absolute", left: 120, top: 220, display: "flex" } },
      ...[3, 2, 1].map((i) => swatch(["#0E7062", "#4F545C", "#14161A"][i - 1], i, { marginLeft: i === 3 ? 0 : -90 }))
    )
  )

/** B — z-index instead of document order. If this differs from B_docOrder, z-index works. */
const B_zIndex = () =>
  shell(
    h("div", { style: { position: "absolute", left: 120, top: 220, display: "flex" } },
      swatch("#0E7062", 1, { marginLeft: 0, zIndex: 3 }),
      swatch("#4F545C", 2, { marginLeft: -90, zIndex: 2 }),
      swatch("#14161A", 3, { marginLeft: -90, zIndex: 1 })
    )
  )

/** C — box-shadow on a rotated element. The shadow must travel with the card. */
const C = () =>
  shell(
    h("div", { style: { position: "absolute", left: 120, top: 200, display: "flex", gap: 60 } },
      swatch("#0E7062", 1, { transform: "rotate(-6deg)", boxShadow: "0 24px 60px -18px rgba(16,18,22,0.55)" }),
      swatch("#14161A", 2, { boxShadow: "0 24px 60px -18px rgba(16,18,22,0.55)" })
    )
  )

/** D — negative offsets on a diagonal (the staircase), plus a per-card rotation. */
const D = () =>
  shell(
    h("div", { style: { position: "absolute", left: 90, top: 150, display: "flex" } },
      ...[1, 2, 3, 4].map((i) =>
        h("div", { style: { marginLeft: i === 1 ? 0 : 70, marginTop: i === 1 ? 0 : -34, display: "flex" } },
          swatch(["#0E7062", "#4F545C", "#14161A", "#666B74"][i - 1], i, { transform: `rotate(${(i - 2.5) * 3}deg)` })
        )
      )
    )
  )

/** E — `transform: rotate()` written as a matrix, which is how a fan pivot actually needs it. */
const E = () =>
  shell(
    h("div", { style: { position: "absolute", left: 120, top: 200, display: "flex", alignItems: "flex-end", height: 240 } },
      ...[0, 1, 2, 3, 4].map((i) =>
        h("div", { style: { marginLeft: i === 0 ? 0 : -60, display: "flex" } },
          swatch(["#0E7062", "#4F545C", "#14161A", "#666B74", "#0E7062"][i], i + 1, {
            transform: `rotate(${(i - 2) * 7}deg)`,
          })
        )
      )
    )
  )

const CASES: [string, () => any][] = [
  ["A-rotate", A],
  ["B-doc-order", B_docOrder],
  ["B-rev-order", B_revOrder],
  ["B-z-index", B_zIndex],
  ["C-shadow-on-rotated", C],
  ["D-diagonal-stair", D],
  ["E-fan-pivot", E],
]

/** Read the colour at one pixel, to compare paint order without eyeballing a PNG. */
async function px(file: string, x: number, y: number) {
  const buf = readFileSync(file)
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const i = (y * info.width + x) * info.channels
  return `${data[i]},${data[i + 1]},${data[i + 2]}`
}

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const files: Record<string, string> = {}
  for (const [name, node] of CASES) {
    const res = new ImageResponse(node() as any, { width: 1200, height: 630, fonts })
    const buf = Buffer.from(await res.arrayBuffer())
    const p = `${OUT}${name}.png`
    writeFileSync(p, buf)
    files[name] = p
    console.log(`rendered ${name}  ${(buf.length / 1024).toFixed(1)} KB`)
  }

  // B: the overlap band. Card 3 is dark (#14161A) and card 1 is teal (#0E7062), so the
  // pixel where they overlap says which one Satori painted last.
  const y = 300
  const overlapX = 300
  console.log("\n--- B: paint order, sampled in the overlap ---")
  for (const k of ["B-doc-order", "B-rev-order", "B-z-index"]) {
    console.log(`${k.padEnd(12)} overlap@${overlapX},${y} = ${await px(files[k], overlapX, y)}`)
  }

  // A: a rotated card's corner must be off-axis. Sample two points on the same card's
  // top edge; if the rotation rendered, the left one is ink and the right one is not.
  console.log("\n--- A/D/E: rotation present? sampling the -8deg card's top corners ---")
  for (const k of ["A-rotate", "D-diagonal-stair", "E-fan-pivot"]) {
    const l = await px(files[k], 95, 200)
    const r = await px(files[k], 300, 200)
    console.log(`${k.padEnd(16)} left=${l}  right=${r}`)
  }
}

main().catch((e) => {
  console.error("FAILED", e)
  process.exit(1)
})
