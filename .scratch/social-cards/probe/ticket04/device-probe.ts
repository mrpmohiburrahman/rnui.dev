// PROTOTYPE — ticket 04 round 2 probe. Throwaway.
//
//   pnpm tsx .scratch/social-cards/probe/ticket04/device-probe.ts
//
// The "Mark, but beautiful" variants want three devices ticket 02 never tested,
// because every card so far has been axis-aligned rectangles on a flat canvas:
//
//   1. **radial-gradient** — ticket 02 confirmed `linear-gradient` renders. A
//      radial one is a different function and was never checked.
//   2. **transform: rotate** — a scattered/ringed tile wants a little rotation.
//   3. **border-radius: 50%** — a glow wants a circle, not a rounded rect.
//
// A device that silently renders as *nothing* is the dangerous case, because a
// card with a missing glow still looks like a card. So each probe is measured by
// RGBA-diffing against the same render with the element removed, which is the
// method ticket 02 used — not read off a support list.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [...[400, 700].map((w) => F("SpaceGrotesk", w)), F("JetBrainsMono", 400)]

const OUT = new URL("../../preview/probe-t04/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const base = { width: "100%", height: "100%", display: "flex", background: "#0A0B0D" } as const

type Probe = { key: string; label: string; style: Record<string, unknown>; child?: boolean }

const PROBES: Probe[] = [
  { key: "radial", label: "radial-gradient", style: { width: 400, height: 400, borderRadius: 200, background: "radial-gradient(circle, rgba(111,227,204,0.55) 0%, rgba(111,227,204,0.08) 45%, rgba(111,227,204,0) 72%)" } },
  { key: "radial-ellipse", label: "radial-gradient(ellipse…)", style: { width: 500, height: 300, background: "radial-gradient(ellipse at center, rgba(111,227,204,0.5) 0%, rgba(111,227,204,0) 70%)" } },
  { key: "conic", label: "conic-gradient (expected absent)", style: { width: 300, height: 300, borderRadius: 150, background: "conic-gradient(from 0deg, #6FE3CC, #0E7062, #6FE3CC)" } },
  { key: "circle", label: "border-radius 50%", style: { width: 300, height: 300, borderRadius: "50%", background: "#6FE3CC" } },
  { key: "rotate", label: "transform rotate(18deg)", style: { width: 300, height: 200, background: "#6FE3CC", transform: "rotate(18deg)" } },
  { key: "rotate-neg", label: "transform rotate(-12deg)", style: { width: 300, height: 200, background: "#B2B8C2", transform: "rotate(-12deg)" } },
  { key: "scale", label: "transform scale(0.9)", style: { width: 300, height: 200, background: "#8E949F", transform: "scale(0.9)" } },
  { key: "shadow-blur", label: "box-shadow blur only", style: { width: 300, height: 200, background: "#101216", boxShadow: "0 0 90px 10px rgba(111,227,204,0.5)" } },
  { key: "opacity", label: "opacity 0.35", style: { width: 300, height: 200, background: "#6FE3CC", opacity: 0.35 } },
  { key: "border", label: "1px border (not shadow)", style: { width: 300, height: 200, background: "#101216", border: "1px solid rgba(111,227,204,0.6)" } },
  { key: "two-stop-grad", label: "linear-gradient 2 stops", style: { width: 400, height: 200, background: "linear-gradient(90deg, #6FE3CC 0%, #0E7062 100%)" } },
  { key: "rgba-grad", label: "linear-gradient with alpha", style: { width: 400, height: 200, background: "linear-gradient(180deg, rgba(111,227,204,0.6) 0%, rgba(111,227,204,0) 100%)" } },
]

function card(probe: Probe | null) {
  return h(
    "div",
    { style: base },
    probe ? h("div", { style: { position: "absolute", left: 400, top: 165, ...probe.style } }) : null
  )
}

async function render(node: unknown): Promise<Buffer> {
  const res = new ImageResponse(node as any, { width: 1200, height: 630, fonts })
  return Buffer.from(await res.arrayBuffer())
}

/** How many pixels differ from the element-free render, and by how much. */
async function diff(a: Buffer, b: Buffer) {
  const A = await sharp(a).removeAlpha().raw().toBuffer()
  const B = await sharp(b).removeAlpha().raw().toBuffer()
  let changed = 0
  let maxDelta = 0
  let sum = 0
  for (let i = 0; i < A.length; i++) {
    const d = Math.abs(A[i] - B[i])
    if (d > 8) { changed++; sum += d }
    if (d > maxDelta) maxDelta = d
  }
  return { changed, maxDelta, meanDelta: changed ? +(sum / changed).toFixed(1) : 0 }
}

async function main() {
  const blank = await render(card(null))
  writeFileSync(`${OUT}0-blank.png`, blank)
  const rows: any[] = []
  for (const p of PROBES) {
    try {
      const buf = await render(card(p))
      writeFileSync(`${OUT}${p.key}.png`, buf)
      const d = await diff(blank, buf)
      rows.push({
        probe: p.label,
        pixelsChanged: d.changed,
        maxDelta: d.maxDelta,
        verdict: d.changed < 500 ? "RENDERS NOTHING" : d.changed < 5000 ? "renders (small)" : "renders",
      })
    } catch (e) {
      rows.push({ probe: p.label, pixelsChanged: -1, maxDelta: -1, verdict: `THREW: ${(e as Error).message.slice(0, 60)}` })
    }
  }
  console.table(rows)
}

main().catch((e) => { console.error(e); process.exit(1) })
