// PROTOTYPE probe — ticket 05, the Fan card: the name's ceiling under a **card-owned break**.
//
//   pnpm tsx prototypes/og-cards/probe/fan-ceiling.tsx
//
// `fan-break.tsx` found the defect: with `word-break: keep-all` plus a non-breaking space
// binding the parenthetical, `Enzo Manuel Mangano (Reactiive)` still broke as
// `… Mangano (` / `Reactiive)` — the "(" orphaned. Neither CSS setting alone fixes both
// breaks, which is the same wall ticket 05 hit on the settled card.
//
// The fix here is not another CSS setting. It is to **stop asking**: a trailing parenthetical
// on this site is always an *alias* (`Enzo Manuel Mangano` / `(Reactiive)`,
// `Arnaud Dellinger` / `(evening kid)`), so it belongs on its own line anyway. The card emits
// the two parts as two blocks and Satori is never given a choice. Three consequences, all
// measured here rather than argued:
//
//   1. **No orphan is possible**, at any size, for any name — there is no break to get wrong.
//   2. **The Hangul cannot split**, even without `keep-all`, because `(문대현)` is one block.
//   3. **The ceiling is now set by a different name.** With the parenthetical removed from the
//      measurement, the longest name is no longer Enzo's 31 characters but
//      `Konstantinos Efkarpidis` — **23 characters and no parenthetical at all**, so it is
//      measured whole. That name was never in the five-Contributor cast and it is now the one
//      that decides the size.
//
// All **24** real names are measured, not the five the cards happen to show, because the
// ceiling is a property of the catalogue and not of the cast.

import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

import { allRecordings } from "../../../data/catalogue"
import { probeFonts } from "./fonts"

const fonts = probeFonts()
const SANS = "Space Grotesk"

const NAMES = [...new Set((allRecordings as any[]).map((r) => r.contributor))] as string[]

/** A trailing parenthetical is an alias: split it off so the card can own the break. */
export function splitName(n: string): [string, string | null] {
  const m = n.match(/^(.*?)\s*(\([^()]*\)\s*)$/)
  return m ? [m[1], m[2]] : [n, null]
}

async function lines(text: string, size: number, col: number) {
  const node = h(
    "div",
    { style: { width: col, height: 460, display: "flex", background: "#000" } },
    h("div", {
      style: {
        width: col, display: "flex", fontFamily: SANS, fontSize: size, fontWeight: 500,
        letterSpacing: "-0.024em", lineHeight: 1.03, color: "#fff",
      },
    }, text)
  )
  const res = new ImageResponse(node as any, { width: col + 90, height: 460, fonts })
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

/** The part of a name that must fit one line: the larger of `main` and its alias. */
function governing(name: string) {
  const [main, paren] = splitName(name)
  return paren ? { main, paren } : { main, paren: null }
}

// The five columns the Fan variants actually produce, plus the settled card's 560 for
// comparison. Measuring only round numbers and then interpolating left Slab at 556px with no
// measured entry at all, and `ceilingFor` answered 0 for it — a hole in the table, not a
// ceiling.
const COLS = [556, 590, 624, 693, 704, 733]
const SIZES = [40, 44, 48, 52, 56, 60, 64, 68]

async function main() {
  console.log(`\n${NAMES.length} real names. 'xN' = it wrapped to N lines, which fails the ceiling.\n`)

  for (const col of COLS) {
    console.log(`\n${"=".repeat(96)}\nRIGHT COLUMN ${col}px — the largest size at which EVERY name keeps each part on one line\n${"=".repeat(96)}`)
    console.log("name".padEnd(32) + "alias?".padEnd(9) + SIZES.map((s) => `${s}`.padStart(7)).join(""))
    const worstAt = new Map<number, { w: number; who: string }>()
    for (const n of NAMES.sort((a, b) => b.length - a.length)) {
      const g = governing(n)
      const cells: string[] = []
      for (const s of SIZES) {
        // Both parts must be one line; the alias is measured in the same column.
        const m = await lines(g.main, s, col)
        const p = g.paren ? await lines(g.paren, s, col) : null
        const bad = m.rows > 1 || (p && p.rows > 1)
        cells.push((bad ? `x${Math.max(m.rows, p?.rows ?? 1)}` : `${Math.max(m.w, p?.w ?? 0)}`).padStart(7))
        if (!bad) {
          const cur = worstAt.get(s)
          if (!cur || m.w > cur.w) worstAt.set(s, { w: m.w, who: n })
        }
      }
      console.log("  " + n.slice(0, 30).padEnd(30) + (g.paren ? "yes" : "NO").padEnd(9) + cells.join(""))
    }
    // The ceiling is the largest size at which **no** name wraps — not the largest at which
    // some name still fits. The first version of this line took the max over the names that
    // happened to survive and reported 68px for a 560px column, which is nonsense: it was
    // reading the shortest name in the catalogue and calling it the constraint.
    const failures = new Map<number, string[]>()
    for (const n of NAMES) {
      const g = governing(n)
      for (const s of SIZES) {
        const m = await lines(g.main, s, col)
        const p2 = g.paren ? await lines(g.paren, s, col) : null
        if (m.rows > 1 || (p2 && p2.rows > 1)) {
          if (!failures.has(s)) failures.set(s, [])
          failures.get(s)!.push(n)
        }
      }
    }
    const ceiling = Math.max(0, ...SIZES.filter((s) => !failures.has(s)))
    const atCeiling = ceiling ? NAMES.filter(n => {
      const g = governing(n)
      return g.paren ? n : n
    }) : []
    console.log(`\n  ALL-NAMES ceiling in ${col}px = ${ceiling}px`)
    if (ceiling) {
      console.log(`  on a 360px Slack card that is ${(ceiling * 0.3).toFixed(1)}px on screen`)
      const next = SIZES.find(s => s > ceiling && failures.has(s))
      if (next) console.log(`  first size that breaks: ${next}px, breaking ${failures.get(next)!.length} name(s): ${failures.get(next)!.join(", ")}`)
    } else {
      console.log(`  nothing fits; even 40px breaks ${failures.get(SIZES[0])!.join(", ")}`)
    }
    void atCeiling; void worstAt
  }

  console.log(`\n\nA name with NO parenthetical cannot be given a second line by the card, so`)
  console.log(`"Konstantinos Efkarpidis" is the hard case and it is measured whole above.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
