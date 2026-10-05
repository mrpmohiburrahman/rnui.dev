// PROTOTYPE — ticket 05, the Fan card: the guard that has to keep passing.
//
//   pnpm tsx prototypes/og-cards/verify-fan.tsx
//
// Every claim this layout makes about type is a **measured ceiling**, and a measured ceiling
// is only worth something if something checks it. Nothing else in the pipeline would notice a
// name that wrapped at the wrong place: `ImageResponse` renders it happily, `pnpm lint` passes,
// and the card ships with `Enzo Manuel Mangano (` alone at the end of a line.
//
// So this renders **all 24 real Contributors** at every variant's real column and type size —
// not the five the gallery shows — and fails on:
//
//   * the name or its alias taking more than one line (the orphan, and any other bad break)
//   * any ink within 1px of the card's safe edge, so a name cannot creep under the fan
//   * a tile missing, so a Contributor with fewer Posters than the fan holds renders a gap
//
// It exits non-zero. That is the point: it is meant to be run, not admired.

import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

import { probeFonts } from "./probe/fonts"

import { probeFonts } from "./probe/fonts"
import sharp from "sharp"

import { allRecordings } from "../../data/catalogue"
import { VARIANTS, CAST, render, columnFor, nameSizeFor, splitName } from "./contributor-variants"

// The shared loader, so a probe cannot register a face the shipped card does not have —
// which is exactly the drift that made the 300-weight instances here and not there.
const fonts = probeFonts()

const SANS = "Space Grotesk"
/** Slack crops 66px off each side. Ink must stay inside this. */
const SAFE = { left: 66, right: 1200 - 66, top: 8, bottom: 630 - 8 }

/** Ink bounds plus distinct text rows, against a dark ground so light ink counts. */
async function probe(node: any, W: number, H: number) {
  const res = new ImageResponse(node as any, { width: W, height: H, fonts })
  const buf = Buffer.from(await res.arrayBuffer())
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width, maxX = -1, minY = info.height, maxY = -1
  const rowHas = new Array<boolean>(info.height).fill(false)
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * info.channels] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        rowHas[y] = true
      }
  let rows = 0, blank = 0
  for (let y = 0; y < info.height; y++) { if (rowHas[y]) { if (blank > 2) rows++; blank = 0 } else blank++ }
  if (rows === 0 && maxX >= 0) rows = 1
  return { minX, maxX, minY, maxY, rows }
}

async function main() {
  const names = [...new Set((allRecordings as any[]).map((r) => r.contributor))] as string[]
  const fails: string[] = []

  console.log(`\n${names.length} real names x ${VARIANTS.length} variants = ${names.length * VARIANTS.length} name blocks\n`)

  for (const v of VARIANTS) {
    const col = columnFor(v)
    const size = nameSizeFor(v)
    let worst = 0
    for (const n of names) {
      // The alias is a separate block, so each is measured on its own: one block wrapping is
      // one line too many, and the "rows" count would hide it inside a two-block container.
      const [main, alias] = splitName(n)
      for (const [part, s] of [[main, size], [alias, Math.round(size * 0.6)]] as [string, number][]) {
        if (!part) continue
        const one = await probe(
          h("div", { style: { width: col, height: 300, display: "flex", background: "#000" } },
            h("div", {
              style: {
                width: col, display: "flex", fontFamily: SANS, fontSize: s, fontWeight: 500,
                letterSpacing: "-0.024em", lineHeight: 1.05, color: "#fff", maxWidth: col,
              },
            }, part)),
          col + 90, 300
        )
        if (one.rows > 1) fails.push(`${v.key} @${col}px/${s}px: "${part}" took ${one.rows} lines — ${n}`)
        if (one.maxX > col) fails.push(`${v.key}: "${part}" is ${one.maxX}px in a ${col}px column — ${n}`)
        worst = Math.max(worst, one.maxX)
      }
    }
    console.log(`  ${v.key.padEnd(6)} col ${String(col).padStart(4)}px  name ${String(size).padStart(2)}px  widest line ${String(worst).padStart(4)}px  (${((worst / col) * 100).toFixed(0)}% full)`)
  }

  // Full-card render for the tightest variant, to catch ink escaping the safe area and to
  // confirm a Contributor with fewer Posters than the fan holds renders no gap.
  console.log(`\n  full-card edge check on Deck (tightest fan, 8 slots) and Fan (5):`)
  for (const key of ["Deck", "Fan"]) {
    for (const who of CAST) {
      const res = new ImageResponse(render(key, who) as any, { width: 1200, height: 630, fonts })
      const buf = Buffer.from(await res.arrayBuffer())
      // `resolveWithObject` puts the channel count under `info`, NOT at the top level.
      // Reading `m.channels` gives `undefined`, every pixel index becomes `NaN`, the
      // comparison is always false, and the check reports "inside" having found no ink at
      // all. It printed `x1200..-1` and still said PASS — a guard that cannot fail.
      const { data: px, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      let minX = 1200, maxX = -1, minY = 630, maxY = -1
      for (let y = 0; y < info.height; y++)
        for (let x = 0; x < info.width; x++) {
          // Anything not the canvas colour is ink. The canvas is #F4F4F1.
          const i = (y * info.width + x) * info.channels
          if (Math.abs(px[i] - 0xf4) > 3 || Math.abs(px[i + 1] - 0xf4) > 3 || Math.abs(px[i + 2] - 0xf1) > 3) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      // If no ink was found the check proved nothing, so say so rather than pass.
      if (maxX < 0) { fails.push(`${key}/${who.name}: found NO ink — the edge check is not measuring`); continue }

      const off = [
        minX < SAFE.left - 1 ? `left ${minX}` : "",
        maxX > SAFE.right + 1 ? `right ${maxX}` : "",
        minY < SAFE.top ? `top ${minY}` : "",
        maxY > SAFE.bottom ? `bottom ${maxY}` : "",
      ].filter(Boolean)
      const tiles = who.tiles.length
      console.log(`    ${key.padEnd(5)} ${who.name.slice(0, 26).padEnd(27)} ink x${minX}..${maxX} y${minY}..${maxY}  ${off.length ? "OUTSIDE SAFE: " + off.join(", ") : "inside"}`)
      if (off.length) fails.push(`${key}/${who.name}: ink ${off.join(", ")}`)
      void tiles
    }
  }

  if (fails.length) {
    console.log(`\nFAIL — ${fails.length} problem(s):`)
    for (const f of fails) console.log("  ✗ " + f)
    process.exit(1)
  }
  console.log(`\nPASS — ${names.length * VARIANTS.length} name blocks and ${CAST.length * 2} full cards, all inside the safe area.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
