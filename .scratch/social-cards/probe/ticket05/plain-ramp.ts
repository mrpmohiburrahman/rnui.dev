// PROTOTYPE — ticket 05, the text-size study on the **Plain** layout. Throwaway.
//
//   pnpm tsx prototypes/og-cards/probe/plain-ramp.ts
//
// The Plain, no-disc card puts **the mark, the name and the count in a 560px column** on
// the left, with a 3x2 grid of 152px Posters on the right. So unlike the shelf layout,
// **every line of type on this card is capped by 560px, not by Slack's 1068px** — and the
// previous study answered the wrong question by measuring against 1068.
//
// This measures the two ceilings that actually bind here:
//
// **1. The name.** One line is possible only up to `560 / 15.45 = 36px`. Above that it
// wraps, and then the ceiling is set by the *break point* rather than by the total: a
// two-line name needs each line to fit, so what matters is the longest single segment the
// wrap can produce. For `Enzo Manuel Mangano (Reactiive)` the best split is 19 characters
// either way, so two lines buy `560 / (19 * 0.515) = 57px`, not 1120/15.45 = 72px. The
// naive total-capacity arithmetic is wrong by 15px and would have shipped a clipping card.
//
// **2. The count.** `138 RECORDINGS · 11 CATEGORIES` is 29 characters and lives in the
// same 560px column, so its one-line ceiling is `560 / 34.4 = 16px` — *below* the 26px the
// card already uses. It already does not fit on one line. Which means the count on this
// card is either clipped or wrapped, and the study has to know which.
//
// So this renders the real strings in the real column at each candidate size and reports
// **how many lines each one takes and whether it overflows** — measured, never estimated,
// because Satori's line breaker does not agree with arithmetic about where it breaks.

import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

import { CAST } from "../../preview/variants-contrib"
import { probeFonts } from "./fonts"

const fonts = probeFonts()

const SANS = "Space Grotesk"
const MONO = "JetBrains Mono"
const MIDDOT = "\u00b7"

/** The Plain layout's left column. Not a guess: `VPlain`'s measured width. */
const COL = 560

/** Ink bounds of a rendered node, plus the number of distinct text rows it occupies. */
async function measure(
  node: any,
  W: number,
  H: number
): Promise<{ w: number; rows: number; inkH: number }> {
  const res = new ImageResponse(node as any, { width: W, height: H, fonts })
  const buf = Buffer.from(await res.arrayBuffer())
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width
  let maxX = -1
  let minY = info.height
  let maxY = -1
  const rowHas = new Array<boolean>(info.height).fill(false)
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        rowHas[y] = true
      }
    }
  }
  // Count ink bands separated by a fully blank run of rows.
  let rows = 0
  let blank = 0
  for (let y = 0; y < info.height; y++) {
    if (rowHas[y]) {
      if (blank > 2) rows++
      blank = 0
    } else blank++
  }
  if (rows === 0 && maxY >= 0) rows = 1
  return { w: maxX < 0 ? 0 : maxX - minX, rows, inkH: maxY < 0 ? 0 : maxY - minY }
}

/** One string at one size, wrapped inside the real column. Reports lines + overflow. */
async function inColumn(
  text: string,
  size: number,
  font: string,
  weight: number,
  tracking: number,
  lineHeight: number
) {
  // **No padding.** `VPlain`'s column is `width: 560` at `left: 66`, so its children get
  // the full 560 — a probe that adds a 20px inset measures a 540px column and reports the
  // name wrapping a line early. That bug put Enzo's 36px name on two lines when the real
  // card has it on one.
  const node = h(
    "div",
    { style: { width: COL, height: 460, display: "flex", background: "#000" } },
    h(
      "div",
      {
        style: {
          width: COL, display: "flex", fontFamily: font, fontSize: size, fontWeight: weight,
          letterSpacing: `${tracking}em`, lineHeight, color: "#fff",
        },
      },
      text
    )
  )
  const m = await measure(node, COL + 60, 460)
  return { w: m.w, rows: m.rows, overflow: m.w > COL }
}

const NAME_SIZES = [36, 44, 48, 52, 56, 60, 64, 68]
const COUNT_SIZES = [26, 32, 38, 44, 50, 56]

const countLine = (w: { count: number; categories: number }) =>
  `${w.count} ${w.count === 1 ? "RECORDING" : "RECORDINGS"} ${MIDDOT} ${w.categories} ${w.categories === 1 ? "CATEGORY" : "CATEGORIES"}`

const MARK = "rnui.dev"

async function main() {
  console.log(`\n== THE NAME in the Plain layout's ${COL}px column ==`)
  console.log("rendered and ink-counted. `rows` = text lines. `OVER` = wider than the column.\n")
  console.log("name".padEnd(34) + NAME_SIZES.map((s) => `${s}px`.padStart(9)).join(""))
  for (const w of CAST) {
    const cells: string[] = []
    for (const s of NAME_SIZES) {
      const r = await inColumn(w.name, s, SANS, 500, -0.024, 1.06)
      cells.push((r.overflow ? `${r.w} OVER` : `${r.w} x${r.rows}`).padStart(9))
    }
    console.log(w.name.padEnd(34) + cells.join(""))
  }

  console.log(`\n== THE COUNT LINE in the same ${COL}px column ==\n`)
  console.log("count line".padEnd(34) + COUNT_SIZES.map((s) => `${s}px`.padStart(9)).join(""))
  for (const w of CAST) {
    const cells: string[] = []
    for (const s of COUNT_SIZES) {
      const r = await inColumn(countLine(w), s, MONO, 400, 0.11, 1.2)
      cells.push((r.overflow ? `${r.w} OVER` : `${r.w} x${r.rows}`).padStart(9))
    }
    console.log(countLine(w).padEnd(34) + cells.join(""))
  }

  console.log(`\n== THE MARK — "rnui.dev", sans 700 ==\n`)
  for (const s of [34, 40, 44, 48, 52]) {
    const r = await inColumn(MARK, s, SANS, 700, -0.022, 1)
    console.log(`  ${s}px -> ${r.w}px  ${r.rows} line${r.rows === 1 ? "" : "s"}  ${r.overflow ? "OVERFLOW" : "fits"}`)
  }

  console.log(`\n== ON SCREEN — a 360px Slack card is a 30% scale ==\n`)
  console.log("  the Plain card's name is 36px, which is 10.8px on screen.")
  console.log("  The shelf card's name was 68px, which is 20.4px on screen.")
  console.log("  That 1.9x gap is the whole difference between the two layouts.\n")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})