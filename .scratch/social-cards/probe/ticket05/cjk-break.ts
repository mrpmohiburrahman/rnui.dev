// PROTOTYPE — ticket 05. Throwaway.
//
//   pnpm tsx prototypes/og-cards/probe/cjk-break.ts
//
// ## The defect
//
// Scaled to 56px in the Plain layout's 560px column, `Daehyeon Mun (문대현)` breaks as
// **`Daehyeon Mun (문대` / `현)`** — it splits the Hangul between the second and third
// syllable. `lib/contributor-match.ts:27-31` exists because every slugifier on this repo
// has already destroyed this name; a card that breaks it mid-word has done the same thing
// again, and a *broken* name is worse than a small one.
//
// The cause is that CSS breaks CJK between any two characters, which is correct for prose
// and wrong for a personal name. The property that says "do not break inside a word" is
// **`word-break: keep-all`**, and Satori's CSS coverage for it is not documented — so this
// renders the same string under four settings and reports what actually happens.
//
// It also checks the two settings that would break the space instead, because for
// `Enzo Manuel Mangano (Reactiive)` the break *should* be at a space:
//
//   `keep-all`      — no break inside a CJK run; spaces still break
//   `overflow-wrap` — allow a break anywhere rather than overflow
//   `line-break`    — strict, forbids breaking before a closing bracket
//
// If `keep-all` is not honoured the honest answer is that **no name over ~36px can be set
// on this layout without a risk of mangling one of the 24**, and the ramp's ceiling drops.

import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"
import { probeFonts } from "./fonts"

const fonts = probeFonts()

const COL = 560
const NAMES = ["Daehyeon Mun (문대현)", "Enzo Manuel Mangano (Reactiive)"]
const SIZES = [36, 44, 52, 56]

type Setting = { key: string; style: Record<string, string> }

const SETTINGS: Setting[] = [
  { key: "default", style: {} },
  { key: "keep-all", style: { wordBreak: "keep-all" } },
  { key: "line-break:strict", style: { lineBreak: "strict" } },
  { key: "keep-all+strict", style: { wordBreak: "keep-all", lineBreak: "strict" } },
]

/** Ink bands separated by >= 4 blank rows, so tight leading cannot merge two lines. */
async function lines(text: string, size: number, s: Setting): Promise<number> {
  const node = h(
    "div",
    { style: { width: COL, height: 500, display: "flex", background: "#000" } },
    h(
      "div",
      {
        style: {
          width: COL, display: "flex", fontFamily: "Space Grotesk", fontSize: size,
          fontWeight: 500, letterSpacing: "-0.024em", lineHeight: 1.04, color: "#fff",
          ...s.style,
        },
      },
      text
    )
  )
  const res = new ImageResponse(node as any, { width: COL + 60, height: 500, fonts })
  const buf = Buffer.from(await res.arrayBuffer())
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const rowHas = new Array<boolean>(info.height).fill(false)
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels] > 8) { rowHas[y] = true; break }
    }
  }
  let n = 0
  let blank = 99
  for (let y = 0; y < info.height; y++) {
    if (rowHas[y]) { if (blank >= 4) n++; blank = 0 } else blank++
  }
  return Math.max(n, 0)
}

async function main() {
  for (const s of SETTINGS) {
    console.log(`\n== wordBreak/lineBreak: ${s.key} ==`)
    console.log("name".padEnd(34) + SIZES.map((x) => `${x}px`.padStart(8)).join(""))
    for (const nm of NAMES) {
      const cells: string[] = []
      for (const sz of SIZES) cells.push(`${(await lines(nm, sz, s))} line(s)`.padStart(8))
      console.log(nm.padEnd(34) + cells.join(""))
    }
  }
  console.log(`
Reading it: a CJK run that breaks is the bug — \`문대 | 현\` is two pieces of a name.
1 line is safe. 2 lines is only safe if the break lands on a space.
`)
}

main().catch((e) => { console.error(e); process.exit(1) })