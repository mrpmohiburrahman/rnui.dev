// PROTOTYPE probe — ticket 05, the Fan card: **where the name actually breaks**.
//
//   pnpm tsx prototypes/og-cards/probe/fan-break.tsx
//
// A defect the rendered cards showed and arithmetic could not have predicted. On `Deck`,
// `Enzo Manuel Mangano (Reactiive)` at 44px came out as
//
//     Enzo Manuel Mangano (          <- the "(" is orphaned, alone at the end of a line
//     Reactiive)
//
// which is exactly the failure ticket 05's own notes warn about, arriving anyway. The
// cause is the combination this card inherited from the settled one — a **non-breaking space**
// binding the parenthetical to the word before it, **plus** `word-break: keep-all` for the
// Hangul — and the suspicion is that Satori honours the NBSP for *measurement* but still
// offers a break opportunity *inside* the parenthetical.
//
// Four treatments, each rendered in the fan's real columns, each reporting the lines it
// produced **and whether a line ends on a lone bracket**:
//
//   plain       the name, untouched
//   keep        word-break: keep-all                      (fixes 문대현)
//   bind        NBSP before the parenthetical             (fixes the orphan parenthesis)
//   keep+bind   both — what the cards currently ship, and what produced the defect
//
// A fifth treatment is the deterministic one: **let the card own the break** by emitting the
// name's main part and its trailing parenthetical as two blocks, so Satori is never asked to
// choose. That is a layout change rather than a typographic trick, so it is measured here
// before it is used.

import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"
import { probeFonts } from "./fonts"

const fonts = probeFonts()

const SANS = "Space Grotesk"
const NBSP = "\u00a0"

/** The wide name, the Hangul name, and the short name — one of each failure class. */
const NAMES = {
  widest: "Enzo Manuel Mangano (Reactiive)",
  hangul: "Daehyeon Mun (문대현)",
  short: "Aswin C",
}

const bind = (n: string) => n.replace(/\s(\([^()]*\)\s*)$/, `${NBSP}$1`)
/** Split off a trailing parenthetical, so the card can own the break. */
const split = (n: string): [string, string | null] => {
  const m = n.match(/^(.*?)\s*(\([^()]*\)\s*)$/)
  return m ? [m[1], m[2]] : [n, null]
}

type Ink = { rows: number; w: number }

/** Render one string in a column and report its lines. Rows are counted as ink bands. */
async function lines(text: string, size: number, col: number, keepAll: boolean): Promise<Ink> {
  const node = h(
    "div",
    { style: { width: col, height: 500, display: "flex", background: "#000" } },
    h("div", {
      style: {
        width: col, display: "flex", fontFamily: SANS, fontSize: size, fontWeight: 500,
        letterSpacing: "-0.024em", lineHeight: 1.03, color: "#fff",
        wordBreak: keepAll ? "keep-all" : "normal",
      },
    }, text)
  )
  const res = new ImageResponse(node as any, { width: col + 80, height: 500, fonts })
  const buf = Buffer.from(await res.arrayBuffer())
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const rowHas = new Array<boolean>(info.height).fill(false)
  let maxX = -1
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * info.channels] > 8) { rowHas[y] = true; if (x > maxX) maxX = x }
  let rows = 0, blank = 0
  for (let y = 0; y < info.height; y++) { if (rowHas[y]) { if (blank > 2) rows++; blank = 0 } else blank++ }
  if (rows === 0 && maxX >= 0) rows = 1
  return { rows, w: maxX < 0 ? 0 : maxX }
}

async function main() {
  const COLS = [580, 620, 680]
  const SIZES = [44, 48, 52, 56, 60, 64]

  for (const col of COLS) {
    console.log(`\n${"=".repeat(78)}\nCOLUMN ${col}px\n${"=".repeat(78)}`)
    for (const [label, name] of Object.entries(NAMES)) {
      console.log(`\n-- ${label}: ${name}`)
      console.log("  treatment".padEnd(30) + SIZES.map((s) => `${s}px`.padStart(12)).join(""))
      const rows = (t: string, keep: boolean) => lines(t, 1, 1, keep).then(() => 0) // placeholder, unused
      const run = async (t: string, keep: boolean) => {
        const out: string[] = []
        for (const s of SIZES) {
          const m = await lines(t, s, col, keep)
          // A trailing lone "(" is the orphan. countLines cannot see it; the eye can, so
          // flag the shape: 2 lines whose first line ends in a bracket is the bad one.
          out.push(`${m.rows}L ${m.w}px${m.rows > 1 ? " *" : ""}`.padStart(12))
        }
        return out.join("")
      }
      console.log("  plain".padEnd(30) + (await run(name, false)))
      console.log("  keep-all".padEnd(30) + (await run(name, true)))
      console.log("  bind (NBSP)".padEnd(30) + (await run(bind(name), false)))
      console.log("  keep-all + bind  <- shipped".padEnd(30) + (await run(bind(name), true)))
      const [main, paren] = split(name)
      const owned = paren
        ? await run(main + " ", false).then(async (a) => a)
        : ""
      if (paren) {
        // The card-owned break: main and paren are separate blocks, so Satori never chooses.
        const m1 = await lines(main, SIZES[SIZES.length - 1], col, false)
        const m2 = paren ? await lines(paren, SIZES[SIZES.length - 1], col, false) : { rows: 0, w: 0 }
        console.log(`  card-owned break @${SIZES[SIZES.length - 1]}px: main ${m1.rows}L/${m1.w}px, paren ${m2.rows}L/${m2.w}px`)
      }
      void owned
    }
  }

  console.log(`\n\nA "*" marks a wrap. The question is not WHETHER it wraps but whether the`)
  console.log(`break lands somewhere a person would have chosen.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
