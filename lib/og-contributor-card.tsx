// lib/og-contributor-card.tsx
//
// The Contributor Open Graph card. One variant — `Deck` — chosen by the maintainer on
// 2026-10-06 out of five rendered side by side.
//
// ## What this is, and what it deliberately is not
//
// It draws a 1200x630 card for a Contributor's **fan of Posters on the left** and **three
// facts on the right**: `rnui.dev`, the Contributor's name as the largest thing on the card,
// and how many animations they have. The layout was the maintainer's; the numbers in it were
// measured, and the two comments below are the ones that matter to anyone editing it.
//
// ## The three facts about Satori that this file is shaped around
//
// 1. **`zIndex` does not exist.** Satori ignores it: three overlapping cards ordered by
//    `zIndex` rendered byte-identically to the same three in DOM order, sampled at the
//    overlap. So the fan is emitted **back-to-front in the DOM** and nothing sets `zIndex`.
// 2. **`transform-origin` works.** `bottom center` and `50% 100%` produced byte-identical ink
//    bounds, so a card pivots on its own bottom edge and a shared pivot is only a shared
//    horizontal offset. That is what makes the fan CSS rather than trigonometry.
// 3. **A rotated card's corner swings a full height, not half.** Overhang is
//    `w * AR * sin(tilt)`. Halving it put the fan's leftmost ink at x=12 — inside the 66px
//    Slack crops, so the outer card was cut off on every share.
//
// ## Why the count is what it is, and why the name is set the way it is
//
// **The card owns the name's break.** A trailing parenthetical on this site is always an
// *alias* — `(Reactiive)`, `(evening kid)`, `(문대현)` — so it is emitted as its own block and
// Satori is never asked to choose a break point. With `word-break: keep-all` plus a
// non-breaking space, both of which the earlier card used, the widest name still broke as
// `Enzo Manuel Mangano (` / `Reactiive)`, orphaning the bracket. Neither CSS setting fixes
// both breaks alone; owning the break makes an orphan impossible and makes `(문대현)`
// unsplittable for free.
//
// **The name's size is measured, not chosen.** All 24 real names were rendered and
// ink-counted; 64px is the largest at which every one of them keeps each part on one line in
// this column, and **every ceiling is bound by `Konstantinos Efkarpidis`** — 23 characters,
// and the only long name with no parenthetical, so it is measured whole. Change the fan's
// width and that size is wrong; `nameSizeFor` recomputes it from the same measured table
// rather than trusting a stored number, and `lib/og-contributor-card.test.ts` fails if the
// two ever disagree.
//
// ## One departure from the Design, and one from the glossary
//
// - **The tiles take a shadow and no ring.** `--e1` is a hairline AND a shadow, defining the
//   same card twice. On one tile that is fine; on eight overlapping tiles it is eight
//   outlines drawn over eight shadows and the eye cannot tell which edge belongs to which
//   card. The shadow alone is what separates them.
// - **The count reads `ANIMATIONS`, not `RECORDINGS`.** The maintainer's explicit override of
//   what the effort had settled. `CONTEXT.md` and ADR-0008 still name the domain noun
//   Recording, and the rest of the site still says Recording; this card is the one surface
//   that says animation. Recorded rather than silently applied, because it is a divergence.

import { createElement as h } from "react"
import { readFileSync } from "node:fs"
import path from "node:path"

import { ImageResponse } from "next/og"

/** app/globals.css :root — light. A card is rendered with no visitor preference in hand. */
const C = {
  canvas: "#F4F4F1",
  panel: "#FFFFFF",
  t1: "#14161A",
  t2: "#4F545C",
  acc: "#0E7062",
} as const

const SANS = "Space Grotesk"
const MONO = "JetBrains Mono"

/**
 * The Posters are cropped to this ratio, keeping the top.
 *
 * **The source Posters are 0.46-ratio phone screenshots** (332x720 up to 1108x2410), and the
 * card shows them at 1:1.26. That is a real crop — roughly the middle 58% of each screenshot
 * is discarded — and it is deliberate, because it is what the approved renders showed and
 * changing it now would change the design that was chosen. `position: "top"` keeps the status
 * bar and the first screen of content, which is the most identifiable part of a screenshot.
 *
 * Cropping is a known cost rather than a free win: the effort measured a 25% crop at ticket 06
 * and it was expensive. **If this card is ever revised, try the full 0.46 ratio first** — the
 * fan's geometry would have to be re-derived, because a 1:2.17 tile is far taller than a
 * 1:1.26 one at the same width.
 */
export const AR = 212 / 168

/** The card's own margin, matching the settled cards. Slack crops 66px off each side. */
export const MARGIN = 66
/** The vertical band the fan may use. */
export const BAND = 630 - 2 * 66
/** Between the fan's right edge and the type's left edge. */
export const GUTTER = 48

/** How far a card's shadow reaches past its own box. It travels with the rotation. */
const SHADOW_REACH = 24

/**
 * `Deck`'s geometry. `fanW` is the width the fan **including shadow** is held to, and the tile
 * width is solved for — so a Contributor with one Recording gets one Poster at full size
 * rather than one small card inside empty slots.
 */
export const DECK = {
  fanW: 287,
  /** The most tiles the fan holds. */
  n: 8,
  /** `step / tileWidth` — what fraction of a card its neighbour leaves showing. */
  stepRatio: 0.129,
  tilt: 4,
} as const

/**
 * The measured all-names ceiling per column width.
 *
 * The keys are the column this geometry produces, not round numbers. Every value is
 * `Konstantinos Efkarpidis` measured whole — see the note above.
 */
const CEILING: Record<number, number> = { 733: 64, 704: 60, 693: 60, 624: 56, 590: 52, 556: 48, 560: 48 }

/** 1200 - 2*MARGIN - fanW - GUTTER. The right column's width is a fact, not a choice. */
export const COLUMN = 1200 - MARGIN * 2 - DECK.fanW - GUTTER

/** The measured ceiling at or below `col`. */
export function ceilingFor(col: number): number {
  let best = 0
  for (const [c, s] of Object.entries(CEILING).map(([c, s]) => [Number(c), s] as const).sort((a, b) => a[0] - b[0])) {
    if (col >= c) best = s
  }
  return best
}

/** The name's size for this card. Derived, so it cannot drift from the geometry. */
export function nameSizeFor(col: number = COLUMN): number {
  return ceilingFor(col)
}

/** How far a rotated card's top corner swings sideways past its own box. */
function overhangOf(w: number, cap: number, tilt: number): number {
  return w * AR * Math.sin((Math.abs(tilt) * ((cap - 1) / 2) * Math.PI) / 180)
}

/** The width a fan of `cap` tiles at width `w` occupies, shadow included. */
function occupiedBy(w: number, cap: number): number {
  return (cap - 1) * DECK.stepRatio * w + w + 2 * overhangOf(w, cap, DECK.tilt) + 2 * SHADOW_REACH
}

/**
 * Solve the tile width that holds this fan to exactly `DECK.fanW`, and the inset its left
 * overhang needs. `occupiedBy` increases in `w`, so this bisects.
 *
 * Clamped to the band's height so a one-Recording Contributor does not solve to a tile that
 * runs off the card. Narrower than target is harmless: the column only gains width.
 */
export function solveFan(cap: number): { w: number; inset: number } {
  const maxW = Math.floor(BAND / AR)
  let lo = 40
  let hi = maxW
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (occupiedBy(mid, cap) < DECK.fanW) lo = mid
    else hi = mid
  }
  const w = Math.max(40, Math.min(maxW, Math.round((lo + hi) / 2)))
  return { w, inset: overhangOf(w, cap, DECK.tilt) + SHADOW_REACH }
}

/**
 * Split a trailing parenthetical off as its own block. See the note above: this is the fix
 * for an orphaned bracket, and the reason the Hangul name cannot be split.
 */
export function splitName(name: string): [string, string | null] {
  const m = name.match(/^(.*?)\s*(\([^()]*\)\s*)$/)
  return m ? [m[1], m[2]] : [name, null]
}

/** The count's label. `ANIMATIONS` is the maintainer's word; see the note above. */
export function countLabel(count: number): string {
  return count === 1 ? "ANIMATION" : "ANIMATIONS"
}

const shadow = (depth: number) =>
  `0 2px 8px -2px rgba(16,18,22,0.28), 0 ${16 + depth}px ${30 + depth * 2}px -${10 + depth * 2}px rgba(16,18,22,0.30)`

export type TileInput = { /** A PNG data URI, already cropped and sized. */ src: string }

/** One tile. No `zIndex` — see the note above. */
function Tile({ src, w, rot, left, top, depth }: {
  src: string; w: number; rot: number; left: number; top: number; depth: number
}) {
  return h(
    "div",
    {
      style: {
        position: "absolute", left, top, width: w, height: Math.round(w * AR),
        borderRadius: 14,
        boxShadow: shadow(depth),
        transform: `rotate(${rot}deg)`,
        transformOrigin: "bottom center",
        overflow: "hidden",
        background: C.panel,
        display: "flex",
      },
    },
    h("img", { src, style: { width: "100%", height: "100%", objectFit: "cover", display: "flex" } })
  )
}

export type CardSubject = {
  /** The Contributor's exact name. The string is the identity — ADR-0009, no slug. */
  name: string
  /** How many animations they have. */
  count: number
  /** Their Posters, newest first, already cropped to a PNG data URI. May be empty. */
  tiles: TileInput[]
}

/**
 * The card.
 *
 * A shortfall is never padded with empty slots: the tiles that exist grow to fill the fan's
 * width, so a Contributor with one Recording gets one Poster shown properly rather than a
 * small card beside rectangles that read as images that failed to load.
 */
export function ContributorCard({ name, count, tiles }: CardSubject) {
  const cap = Math.max(1, Math.min(DECK.n, tiles.length || 1))
  const { w, inset } = solveFan(cap)
  const step = Math.round(DECK.stepRatio * w)
  const hh = Math.round(w * AR)
  const top0 = MARGIN + Math.max(0, (BAND - hh) / 2)

  const slots = Array.from({ length: cap }, (_, i) => {
    const t = i - (cap - 1) / 2
    return { src: tiles[i]?.src, rot: t * DECK.tilt, left: i * step, top: top0 + t * 0 }
  })

  const nameSize = nameSizeFor()
  const [main, alias] = splitName(name)

  return h(
    "div",
    { style: { width: 1200, height: 630, background: C.canvas, display: "flex", position: "relative", overflow: "hidden" } },

    // The fan, emitted back-to-front so each later tile paints over the one before it.
    h(
      "div",
      { style: { position: "absolute", left: MARGIN + inset, top: 0, width: 1200 - MARGIN * 2, height: 630, display: "flex" } },
      ...slots.map((s, i) =>
        s.src ? h(Tile, { key: `t${i}`, src: s.src, w, rot: s.rot, left: s.left, top: s.top, depth: (cap - i) * 2 }) : null
      )
    ),

    h(
      "div",
      {
        style: {
          position: "absolute", right: MARGIN, top: MARGIN, bottom: MARGIN, width: COLUMN,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 22,
        },
      },

      // The wordmark, copied from components/site-header.tsx:98-102.
      h(
        "div",
        { style: { display: "flex", fontFamily: SANS, fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: C.t1 } },
        h("span", { style: { color: C.t1 } }, "rnui"),
        h("span", { style: { color: C.acc } }, ".dev")
      ),

      // The name, as one or two blocks. The card owns the break.
      h(
        "div",
        { style: { display: "flex", flexDirection: "column" } },
        h("div", {
          style: {
            fontFamily: SANS, fontSize: nameSize, lineHeight: 1.03, fontWeight: 500,
            letterSpacing: "-0.024em", color: C.t1, maxWidth: COLUMN,
          },
        }, main),
        // The alias is demoted twice — 0.6x and --t2 — because it is a handle, not the name.
        alias
          ? h("div", {
              style: {
                fontFamily: SANS, fontSize: Math.round(nameSize * 0.6), lineHeight: 1.06,
                fontWeight: 400, letterSpacing: "-0.012em", color: C.t2, maxWidth: COLUMN,
              },
            }, alias)
          : null
      ),

      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", gap: 13, fontFamily: MONO, letterSpacing: "0.11em", whiteSpace: "nowrap" } },
        h("span", { style: { fontSize: 32, color: C.acc, fontFamily: SANS, fontWeight: 700, letterSpacing: "-0.01em" } }, String(count)),
        h("span", { style: { fontSize: 32, color: C.t2 } }, countLabel(count))
      )
    )
  )
}

/**
 * The four faces the card sets. Read from `public/fonts/` because Satori needs bytes and
 * `next/font` returns none — see that directory's README.
 *
 * Memoised at module scope: a warm server reads them once per process rather than per card.
 */
/**
 * `FontOptions["weight"]` is a literal union, not `number` — Satori matches a face to a
 * `font-weight` by exact value and has no interpolation. Typing it as `number` and casting at
 * the call site would hide exactly the mistake that union exists to catch, so the union is
 * restated here and the four faces are checked against it.
 */
type OgWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
type OgFont = { name: string; data: ArrayBuffer; weight: OgWeight; style: "normal" }

let FONTS: OgFont[] | null = null

export function ogFonts() {
  if (FONTS) return FONTS
  const dir = path.join(process.cwd(), "public", "fonts")
  /**
   * `file` and `family` are different strings and conflating them is the bug this signature
   * exists to prevent: the files are named `<family>-<weight>.ttf` because four static
   * instances cannot share one name, but Satori matches a face to a `font-weight` by the
   * **family** alone and has no idea what the file was called.
   */
  const load = (family: string, weight: OgWeight): OgFont => {
    const b = readFileSync(path.join(dir, `${family}-${weight}.ttf`))
    // `Buffer.buffer` is `ArrayBufferLike`, which includes SharedArrayBuffer; `ImageResponse`
    // wants a plain ArrayBuffer. The copy is what narrows it, and it happens once per process.
    const data = new Uint8Array(b).buffer
    return { name: family, data, weight, style: "normal" }
  }
  FONTS = [
    load("SpaceGrotesk", 400),
    load("SpaceGrotesk", 500),
    load("SpaceGrotesk", 700),
    load("JetBrainsMono", 400),
  ]
  return FONTS
}

/** Rasterise a subject to PNG bytes. */
export async function renderContributorCard(subject: CardSubject): Promise<Buffer> {
  const res = new ImageResponse(ContributorCard(subject) as React.ReactElement, {
    width: 1200,
    height: 630,
    fonts: ogFonts(),
  })
  return Buffer.from(await res.arrayBuffer())
}
