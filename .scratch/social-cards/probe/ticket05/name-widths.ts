// PROTOTYPE — ticket 05, the Contributor card. Throwaway.
//
//   pnpm tsx prototypes/og-cards/probe/name-widths.ts
//
// The ticket's central question is *"where does the name sit, and what happens to a
// long one?"* and it says several of the 23 names will not fit. That is a
// measurement, so this is the measurement: **every one of the 24 real names, at every
// size the card might plausibly use, rendered and ink-counted** — not estimated from
// a character count, because the range includes Latin-ext (`Kapuściak`, `Öztürk`),
// Hangul (`문대현`), a pipe (`Epicode | 0xV`) and two 28-character names with
// parentheticals.
//
// Why ink-counting rather than measuring the font: a name is not a run of uniform
// advance. `Kapuściak` is narrow, `Öztürk` is not, `문대현` is three full-width CJK
// glyphs, and an average derived from one string is wrong for the other 23 — which
// is exactly the mistake round 4 of ticket 04 made and had to undo.

import { readFileSync, mkdirSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

import { allRecordings } from "../../../data/catalogue"
import { probeFonts } from "./fonts"

const fonts = probeFonts()
const SANS = "Space Grotesk"

const names = [...new Set((allRecordings as any[]).map((r) => r.contributor))].sort(
  (a, b) => b.length - a.length
)

/** Sizes worth testing: the Recording card's byline scale and its neighbours. */
const SIZES = [44, 52, 60, 72, 88]

async function widthOf(text: string, size: number, weight = 400): Promise<number> {
  const W = 1900
  const H = size * 3 + 40
  const node = h(
    "div",
    { style: { width: W, height: H, display: "flex", background: "#000", alignItems: "center" } },
    h(
      "div",
      {
        style: {
          display: "flex", fontFamily: SANS, fontSize: size, fontWeight: weight,
          letterSpacing: "-0.02em", color: "#fff", whiteSpace: "nowrap", marginLeft: 20,
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
      const o = (y * info.width + x) * info.channels
      if (data[o] > 80 && data[o + 1] > 80 && data[o + 2] > 80) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  }
  if (maxX < 0) return 0
  return maxX - minX
}

async function main() {
  mkdirSync(new URL("../../preview/probe-t05/", import.meta.url).pathname, { recursive: true })
  console.log(`${names.length} real Contributor names, ${SIZES.length} sizes, ink-counted\n`)

  const table: any[] = []
  for (const size of SIZES) {
    for (const name of names) {
      table.push({ size, name, glyphs: name.length, px: await widthOf(name, size) })
    }
  }

  for (const size of SIZES) {
    const rows = table.filter((r) => r.size === size).sort((a, b) => b.px - a.px)
    const widest = rows[0]
    const narrowest = rows[rows.length - 1]
    console.log(`--- ${size}px  (Space Grotesk 400, -0.02em)`)
    console.log(`    widest  ${String(widest.px).padStart(4)}px  ${widest.name}`)
    console.log(`    narrowest ${String(narrowest.px).padStart(3)}px  ${narrowest.name}`)
    console.log(`    spread   ${widest.px - narrowest.px}px, ratio ${(widest.px / narrowest.px).toFixed(1)}x`)
    // What a card column can actually hold, and who does not fit.
    for (const col of [420, 480, 540, 620, 700]) {
      const over = rows.filter((r) => r.px > col)
      console.log(
        `      col ${String(col).padStart(3)}px: ${String(rows.length - over.length).padStart(2)}/${rows.length} fit` +
          (over.length ? `  over: ${over.map((r) => `${r.name} (${r.px})`).join(", ")}` : "")
      )
    }
    console.log()
  }

  // The two the ticket names explicitly, at the two sizes a card would most plausibly use.
  console.log("== the two the ticket names, and what a Chat client does to them ==")
  for (const name of ["Enzo Manuel Mangano (Reactiive)", "Daehyeon Mun (문대현)"]) {
    for (const size of [52, 60, 72]) {
      const px = await widthOf(name, size)
      console.log(
        `  ${String(px).padStart(4)}px at ${size}px  ${name}  -> at Slack 360px that is ${((px * 360) / 1200).toFixed(0)}px on screen`
      )
    }
  }

  // And the truncation that a chat client does: Slack crops 66px off the sides,
  // Discord 30px off the height (ticket 06). What is the *safe* width?
  console.log("\n== safe width after a platform crop ==")
  console.log("  Slack crops 66px off EACH side -> a 1200px card has 1068px of safe width")
  console.log("  LinkedIn and X do not crop the image but display it smaller")
  for (const size of [52, 60, 72]) {
    const widest = table.filter((r) => r.size === size).sort((a, b) => b.px - a.px)[0]
    const slackPx = (widest.px * 360) / 1200
    const xPx = (widest.px * 504) / 1200
    console.log(`  ${size}px: widest name is ${widest.px}px = ${slackPx.toFixed(0)}px at Slack 360, ${xPx.toFixed(0)}px at X 504`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })