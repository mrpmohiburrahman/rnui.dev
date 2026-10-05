// PROTOTYPE probe — ticket 05, the **fan** layout: what the name costs.
//
//   pnpm tsx prototypes/og-cards/probe/fan-ramp.ts
//
// The settled Plain card is text-left / grid-right, and its binding constraint was a
// **560px** text column, which capped the name at 36px on one line — 10.8px on a 360px
// Slack card. That was the reason the card reads small.
//
// The maintainer's reference inverts the halves: **fan on the left, type on the right**.
// So the constraint moves, and the whole question is what the fan's width leaves:
//
//     right column = 1200 - 66 (margin) - FAN_W - 48 (gutter) - 66 (margin)
//                  = 1020 - FAN_W
//
// A fan of five portrait tiles does not need 560px. Measured below, at 300 / 340 / 380 /
// 420 / 460 of fan width, and for the name at every candidate size: **how many lines it
// takes and whether it overflows.** Rendered and ink-counted, never estimated, because
// Satori's line breaker disagrees with arithmetic — as ticket 05 already found twice
// (the Hangul splitting, and 52px being *worse* than 44px).

import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

import { CAST } from "../contributor-variants"
import { probeFonts } from "./fonts"

const fonts = probeFonts()

const SANS = "Space Grotesk"
const MONO = "JetBrains Mono"
const MIDDOT = "\u00b7"
const NBSP = "\u00a0"
const bindParens = (n: string) => n.replace(/\s(\([^()]*\)\s*)$/, `${NBSP}$1`)

/** Ink bounds and distinct text rows, against a dark ground so light ink counts. */
async function measure(node: any, W: number, H: number) {
  const res = new ImageResponse(node as any, { width: W, height: H, fonts })
  const buf = Buffer.from(await res.arrayBuffer())
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width, maxX = -1
  const rowHas = new Array<boolean>(info.height).fill(false)
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * info.channels] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        rowHas[y] = true
      }
  let rows = 0, blank = 0
  for (let y = 0; y < info.height; y++) {
    if (rowHas[y]) { if (blank > 2) rows++; blank = 0 } else blank++
  }
  if (rows === 0 && maxX >= 0) rows = 1
  return { w: maxX < 0 ? 0 : maxX - minX, rows }
}

async function inCol(text: string, size: number, col: number, opts: { mono?: boolean; weight?: number; track?: number; lh?: number; keepAll?: boolean } = {}) {
  const node = h(
    "div",
    { style: { width: col, height: 620, display: "flex", background: "#000" } },
    h("div", {
      style: {
        width: col, display: "flex",
        fontFamily: opts.mono ? MONO : SANS,
        fontSize: size, fontWeight: opts.weight ?? 500,
        letterSpacing: `${opts.track ?? -0.024}em`, lineHeight: opts.lh ?? 1.05,
        color: "#fff", wordBreak: opts.keepAll ? "keep-all" : "normal",
      },
    }, text)
  )
  const m = await measure(node, col + 80, 620)
  return { ...m, over: m.w > col }
}

const FAN_W = [300, 340, 380, 420, 460]
const colFor = (f: number) => 1020 - f
const SIZES = [40, 44, 48, 52, 56, 60, 64, 68, 72]
const CSIZES = [24, 28, 32, 36, 40, 44]

const countLine = (w: any) =>
  `${w.count} ${w.count === 1 ? "RECORDING" : "RECORDINGS"} ${MIDDOT} ${w.categories} ${w.categories === 1 ? "CATEGORY" : "CATEGORIES"}`

async function main() {
  console.log(`\n== RIGHT COLUMN = 1020 - FAN_W ==`)
  for (const f of FAN_W) console.log(`  fan ${f}px  ->  column ${colFor(f)}px`)

  console.log(`\n== THE NAME, keep-all on, parens bound. 'OVER' = wider than the column ==`)
  for (const f of FAN_W) {
    const col = colFor(f)
    console.log(`\n-- fan ${f}px, column ${col}px --`)
    console.log("  name".padEnd(32) + SIZES.map((s) => `${s}`.padStart(8)).join(""))
    for (const w of CAST) {
      const cells: string[] = []
      for (const s of SIZES) {
        const r = await inCol(bindParens(w.name), s, col, { keepAll: true })
        cells.push((r.over ? `${r.w} OVER` : `${r.w} x${r.rows}`).padStart(8))
      }
      console.log("  " + w.name.padEnd(30) + cells.join(""))
    }
  }

  console.log(`\n== THE COUNT LINE, mono 0.11em ==`)
  for (const f of [300, 380, 460]) {
    const col = colFor(f)
    console.log(`\n-- fan ${f}px, column ${col}px --`)
    console.log("  count".padEnd(32) + CSIZES.map((s) => `${s}`.padStart(8)).join(""))
    for (const w of CAST) {
      const cells: string[] = []
      for (const s of CSIZES) {
        const r = await inCol(countLine(w), s, col, { mono: true, weight: 400, track: 0.11, lh: 1.2 })
        cells.push((r.over ? `${r.w} OVER` : `${r.w} x${r.rows}`).padStart(8))
      }
      console.log("  " + countLine(w).slice(0, 30).padEnd(30) + cells.join(""))
    }
  }

  console.log(`\n== THE MARK "rnui.dev", sans 700, -0.022em ==`)
  for (const f of [300, 460]) {
    const col = colFor(f)
    console.log(`  -- column ${col}px --`)
    for (const s of [32, 38, 44, 50]) {
      const r = await inCol("rnui.dev", s, col, { weight: 700, track: -0.022, lh: 1 })
      console.log(`    ${s}px -> ${r.w}px  ${r.rows} line${r.rows === 1 ? "" : "s"}  ${r.over ? "OVERFLOW" : "fits"}`)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
