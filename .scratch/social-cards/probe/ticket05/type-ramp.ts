// PROTOTYPE — ticket 05, the text-size study. Throwaway; nothing ships.
//
//   pnpm tsx prototypes/og-cards/probe/type-ramp.ts
//
// The maintainer read the Plain, no-disc card and said the texts would be hard to read.
// Agreeing is not a measurement, so this measures the two things that decide it.
//
// **1. How big can the name actually go?** The card's name has a measured ceiling of
// **68px** in **1068px** — Slack's crop-safe width — because the widest of the 24 real
// names, `Enzo Manuel Mangano (Reactiive)`, inks to 930px at 60px. Everything above 68
// needs the name to wrap, so this renders the five real names at six sizes and ink-counts
// each, and reports **one line** or **two**. It is the only way to know whether "bigger"
// costs the one-line guarantee.
//
// **2. How big can the count go before the line is wider than the card?** The count line
// is `138 RECORDINGS · 11 CATEGORIES` — 29 characters of JetBrains Mono at 0.11em
// tracking, which is the *widest* form any Contributor's card can take (Enzo: highest
// count, most categories; and "CATEGORIES" is 10 characters against "CATEGORY"'s 8).
// Mono is a fixed advance, so this is arithmetic rather than a guess — but measured,
// because 0.6em is an approximation and the tracking adds up.
//
// Both answers are ceilings, and the point of the ramp is to find where each one lands
// rather than to argue about it.

import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

import { CAST } from "../../preview/variants-contrib"
import { probeFonts } from "./fonts"

const fonts = probeFonts()

const SANS = "Space Grotesk"
const MONO = "JetBrains Mono"
const SAFE_W = 1068

/** Ink width of one nowrap run, rendered and counted. Never estimated. */
async function inkWidth(
  text: string,
  size: number,
  fontFamily: string,
  weight: number,
  tracking: number,
  maxW = 2400
): Promise<number> {
  const W = maxW + 80
  const H = size * 3 + 40
  const node = h(
    "div",
    { style: { width: W, height: H, display: "flex", background: "#000", alignItems: "center" } },
    h(
      "div",
      {
        style: {
          display: "flex", fontFamily, fontSize: size, fontWeight: weight,
          letterSpacing: `${tracking}em`, color: "#fff", whiteSpace: "nowrap", marginLeft: 30,
        },
      },
      text
    )
  )
  const res = new ImageResponse(node as any, { width: W, height: H, fonts })
  const buf = Buffer.from(await res.arrayBuffer())
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width
  let maxX = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  }
  return maxX < 0 ? 0 : maxX - minX
}

const NAME_SIZES = [60, 68, 76, 84, 92, 100]
const COUNT_SIZES = [26, 34, 42, 48, 54, 60]

/** The widest count line any real Contributor's card can produce. */
const countLine = (w: { count: number; categories: number }) =>
  `${w.count} ${w.count === 1 ? "RECORDING" : "RECORDINGS"} · ${w.categories} ${w.categories === 1 ? "CATEGORY" : "CATEGORIES"}`

async function main() {
  console.log(`\n== NAMES — one-line fit inside Slack's ${SAFE_W}px safe width ==\n`)
  console.log("name".padEnd(34) + NAME_SIZES.map((s) => `${s}px`.padStart(8)).join(""))
  for (const w of CAST) {
    const cells: string[] = []
    for (const s of NAME_SIZES) {
      const px = await inkWidth(w.name, s, SANS, 500, -0.024)
      cells.push((px > SAFE_W ? `${px}✗` : `${px}✓`).padStart(8))
    }
    console.log(w.name.padEnd(34) + cells.join(""))
  }

  console.log(`\n== COUNT LINES — mono 400, tracking 0.11em ==\n`)
  console.log("count line".padEnd(34) + COUNT_SIZES.map((s) => `${s}px`.padStart(8)).join(""))
  for (const w of CAST) {
    const cells: string[] = []
    for (const s of COUNT_SIZES) {
      const px = await inkWidth(countLine(w), s, MONO, 400, 0.11)
      cells.push((px > SAFE_W ? `${px}✗` : `${px}✓`).padStart(8))
    }
    console.log(countLine(w).padEnd(34) + cells.join(""))
  }

  console.log(`\n== THE MARK — "rnui.dev", sans 700, tracking -0.022em ==\n`)
  for (const s of [32, 40, 48, 56]) {
    const px = await inkWidth("rnui.dev", s, SANS, 700, -0.022)
    console.log(`  ${s}px -> ${px}px`)
  }

  console.log(`\n== SLACK RENDER — a 360px-wide card is a ${(360 / 1200 * 100).toFixed(0)}% scale ==\n`)
  for (const s of [26, 32, 40, 48, 56, 68]) {
    console.log(`  ${s}px on the card renders at ${(s * 360 / 1200).toFixed(1)}px on screen`)
  }
  console.log()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})