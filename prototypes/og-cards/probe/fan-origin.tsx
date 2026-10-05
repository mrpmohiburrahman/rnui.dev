// PROTOTYPE probe — ticket 05, the **fan** layout, round 2.
//
//   pnpm tsx prototypes/og-cards/probe/fan-origin.tsx
//
// Round 1 settled three things (see fan-probe.tsx): `transform: rotate()` renders,
// `box-shadow` travels with a rotated element, and **paint order is DOM order —
// `zIndex` is ignored**, so a stack must be emitted back-to-front.
//
// What round 1 did not settle is the one that decides whether a *fan* is possible at all.
// A hand of cards radiates from a pivot below the wrist: card n is **rotated about a
// point near its own bottom edge**, not about its centre. That needs `transform-origin`.
// If Satori ignores it, every card turns about its own middle and the fan becomes a
// caterpillar — five cards leaning the same way, evenly spaced — which is a different
// shape and reads as a mistake rather than a hand.
//
// So: probe `transform-origin` at `bottom`, and — because it may be ignored — build the
// arc **arithmetically** as a fallback, by computing each card's x/y offset so that its
// *bottom* corner lands on a common point. A probe that only tries CSS is a probe that
// reports "no" when the answer might have been "yes, do it in JS".

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import { probeFonts } from "./fonts"

const fonts = probeFonts()

const OUT = new URL("../out/fan-probe/", import.meta.url).pathname
const CANVAS = "#F4F4F1"
const CW = 150
const CH = 190

const card = (bg: string, i: number, style: any) =>
  h(
    "div",
    {
      style: {
        position: "absolute", width: CW, height: CH, background: bg, borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Space Grotesk", fontSize: 40, fontWeight: 700, color: "#fff",
        ...style,
      },
    },
    String(i)
  )

const shell = (...kids: any[]) =>
  h("div", { style: { width: 1200, height: 630, background: CANVAS, display: "flex", position: "relative" } }, ...kids)

const INK = ["#0E7062", "#4F545C", "#14161A", "#666B74", "#0E7062", "#4F545C"]

/** F — `transform-origin: bottom` on a real fan. The easy way, if it works. */
const F_origin = () => {
  const pivotX = 430
  const pivotY = 560
  return shell(
    h("div", { style: { position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex" } },
      ...INK.map((bg, i) => {
        const t = i - (INK.length - 1) / 2
        return card(bg, i + 1, {
          left: pivotX - CW / 2 + t * 26,
          top: pivotY - CH,
          transform: `rotate(${t * 9}deg)`,
          transformOrigin: "bottom center",
          boxShadow: "0 20px 50px -16px rgba(16,18,22,0.5)",
        })
      })
    )
  )
}

/**
 * G — the same fan with **no `transform-origin`**, arc computed in JS.
 *
 * Each card is rotated about its own centre by `theta`. Rotating a point `(dx, dy)` from
 * the centre by `theta` moves it to `(dx·cosθ − dy·sinθ, dx·sinθ + dy·cosθ)`. To make the
 * cards look as though they pivot at the bottom, translate the card by the difference
 * between where its bottom-centre ended up and where it should be:
 *
 *     pivot is at local (0, +CH/2) below centre
 *     after rotation it is at (−(CH/2)·sinθ, (CH/2)·cosθ)
 *     we want it at (0, CH/2)  →  translate by ((CH/2)·sinθ, CH/2·(1 − cosθ))
 *
 * So the fallback is exact, not approximate, and needs nothing from Satori but `rotate`.
 */
const G_jsArc = () => {
  const pivotX = 430
  const pivotY = 560
  const rad = (d: number) => (d * Math.PI) / 180
  return shell(
    h("div", { style: { position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex" } },
      ...INK.map((bg, i) => {
        const t = i - (INK.length - 1) / 2
        const th = rad(t * 9)
        // Back-to-front: the outer cards first so the middle ones land on top.
        const back = Math.abs(t) > 1
        return card(bg, i + 1, {
          left: pivotX - CW / 2 + t * 26 + (CH / 2) * Math.sin(th) - (back ? 26 : 0),
          top: pivotY - CH + (CH / 2) * (1 - Math.cos(th)) - (back ? 16 : 0),
          transform: `rotate(${t * 9}deg)`,
          boxShadow: "0 20px 50px -16px rgba(16,18,22,0.5)",
        })
      })
    )
  )
}

/**
 * H — `transform-origin` with a **percentage**, which is the form a designer would reach
 * for first and the one round 1's guess did not cover. If percentages work and `bottom`
 * does not, the fan is still one line of CSS.
 */
const H_originPct = () => {
  const pivotX = 430
  const pivotY = 560
  return shell(
    h("div", { style: { position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex" } },
      ...INK.map((bg, i) => {
        const t = i - (INK.length - 1) / 2
        return card(bg, i + 1, {
          left: pivotX - CW / 2 + t * 26,
          top: pivotY - CH,
          transform: `rotate(${t * 9}deg)`,
          transformOrigin: "50% 100%",
          boxShadow: "0 20px 50px -16px rgba(16,18,22,0.5)",
        })
      })
    )
  )
}

/**
 * I — the diagonal **staircase** the reference actually shows, which is the honest
 * alternative: cards stepping up-and-right with a small rotation each, no pivot. Included
 * so the choice is between two measured shapes rather than between one and an assumption.
 */
const I_stair = () => {
  const cols = [
    { x: 60, y: 300, r: -5 },
    { x: 190, y: 210, r: -2.5 },
    { x: 320, y: 120, r: 0 },
  ]
  return shell(
    h("div", { style: { position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex" } },
      ...cols.map((c, i) =>
        card(INK[i], i + 1, {
          left: c.x, top: c.y, transform: `rotate(${c.r}deg)`,
          boxShadow: "0 20px 50px -16px rgba(16,18,22,0.5)",
        })
      )
    )
  )
}

const CASES: [string, () => any][] = [
  ["F-origin-bottom", F_origin],
  ["G-js-arc", G_jsArc],
  ["H-origin-pct", H_originPct],
  ["I-staircase", I_stair],
]

/** Ink bounds of the whole render, so a collapsed fan (all cards stacked) is detectable. */
async function bounds(file: string) {
  const { default: sharp } = await import("sharp")
  const buf = readFileSync(file)
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width, maxX = -1, minY = info.height, maxY = -1
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * info.channels] < 232) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
  return { w: maxX - minX, h: maxY - minY, minX, maxX, minY, maxY }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  for (const [name, node] of CASES) {
    const res = new ImageResponse(node() as any, { width: 1200, height: 630, fonts })
    const p = `${OUT}${name}.png`
    writeFileSync(p, Buffer.from(await res.arrayBuffer()))
    const b = await bounds(p)
    console.log(`${name.padEnd(18)} ink ${b.w}x${b.h}  x ${b.minX}..${b.maxX}  y ${b.minY}..${b.maxY}`)
  }
  console.log(`\nA fan's tell: a wide, SHORT ink box with the corners empty (the wedge). A`)
  console.log(`caterpillar's tell: ink right across the full width of the row.`)
}

main().catch((e) => {
  console.error("FAILED", e)
  process.exit(1)
})
