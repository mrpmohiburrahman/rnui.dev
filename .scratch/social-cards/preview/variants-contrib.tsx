// PROTOTYPE — ticket 05, the Contributor card. Throwaway; nothing ships.
//
//   pnpm tsx .scratch/social-cards/preview/render-contrib.tsx
//
// Needs `pnpm tsx .scratch/social-cards/probe/ticket05/tiles.ts` first.
//
// ## What is left here
//
// The maintainer chose **Initials**, then **Initials without the disc**, then **Plain —
// no disc, light mode**: the card with `rnui.dev`, the name and the count in a **560px
// column on the left**, and a 3x2 grid of 152px Posters on the right. That is the layout
// kept here. The other seven skeletons are deleted, not archived — `Name`, `Shelf`,
// `Field`, `Metric`, `Initials`, `PlainGrid` and `PlainShelf` are gone, along with their
// renders. Their decisions live in `issues/05-the-contributor-card-several-ways.md` and
// none of them needed a render to stay true.
//
// What is left is **that one layout at five text sizes**, in light mode.
//
// ## Why the text on this card is small, measured
//
// **The 560px column is the binding constraint, and it is much tighter than Slack's 1068px
// safe width.** Every line of type on this card lives in that column, so each one is
// measured against 560 rather than 1068. Measured by rendering and ink-counting
// (`probe/ticket05/plain-ramp.ts`):
//
// | | one-line ceiling in 560px | why |
// |---|---|---|
// | the name | **36px** | `Enzo Manuel Mangano (Reactiive)` is 1050px at 68px, so 556px at 36px — **4px of margin**, which is why 36 is the last size that fits rather than a comfortable one |
// | the count | **30px** | `138 RECORDINGS - 11 CATEGORIES` is 29 mono characters at 0.638px per px of size, so 592px at 32px |
// | the mark | no ceiling | 125px wide at 34px, 192px at 52px |
//
// **So at Slack's 360px — a 30% scale — the current card puts its name at 10.8px on
// screen and its count at 7.8px.** For comparison, the shelf layout measured its name at
// 68px = 20.4px on screen. That **1.9x gap is the entire difference between the two
// layouts**, and it is why this card reads as small while looking correct at full size.
//
// ## What buys the size back, and it is only the type
//
// **Wrapping, not widening.** A name that wraps takes **56px** in the same 560px column
// against 36px on one line — because the constraint above 36px is the *break point*, not
// the total, and at 56px the widest line is 526px. At 60px it goes to **three** lines, so
// 56 is the ceiling. Similarly the count takes **two** lines by construction at 50px
// against 30px on one.
//
// So every scale below changes **only type sizes and the line counts they force** — same
// elements, same order, same 560px column, same 3x2 grid of 152px tiles, same 74px margins,
// same light palette. Nothing is re-laid-out. That is what makes the five comparable, and
// it is why this is a text-size study rather than five designs.
//
// **The one thing that does not fit inside the brief:** the name cannot go past 56px on
// this layout without a structural change, because 60px needs three lines and the column
// cannot grow without eating the grid. `Wide`, the last scale, is that structural change
// offered as a single point of comparison — name at 68px on one line, column 1068px, grid
// down to 2x2 of 168px — so the cost of the name is visible as a number rather than argued.

import { createElement as h } from "react"
import { readFileSync } from "node:fs"

export type Mode = "dark" | "light"

const C = {
  dark: {
    canvas: "#0A0B0D", panel: "#101216", rail: "#0C0D11",
    t1: "#F1F2F4", t2: "#B2B8C2", t3: "#8E949F",
    acc: "#6FE3CC", line: "rgba(255,255,255,0.11)",
  },
  light: {
    canvas: "#F4F4F1", panel: "#FFFFFF", rail: "#EFEFEB",
    t1: "#14161A", t2: "#4F545C", t3: "#666B74",
    acc: "#0E7062", line: "rgba(16,18,22,0.13)",
  },
} as const
type Pal = (typeof C)[Mode]

const SANS = "Space Grotesk"
/** A real middot. `"\u00b7"` as a bare escape rendered as the literal text. */
const MIDDOT = "\u00b7"
const MONO = "JetBrains Mono"

export type Who = {
  name: string
  count: number
  categories: number
  tiles: string[]
  newest: { caption: string; at: string } | null
}

export const CAST: Who[] = JSON.parse(
  readFileSync(new URL("./contrib/index.json", import.meta.url).pathname, "utf8")
)

const b64 = (k: string) =>
  `data:image/jpeg;base64,${readFileSync(new URL(`./contrib/${k}.jpg`, import.meta.url).pathname).toString("base64")}`

/** Slack's crop: 66px off each side. 1200 - 132 = 1068px of safe width. */
export const SAFE_W = 1068
/** The Plain layout's left column. Every line of type on this card is measured against it. */
export const COL = 560

/**
 * **The name's size is a function of its column, and the column is a function of what else
 * is on the card.** Derived rather than hand-set, because hand-setting it is what produced
 * two overflows earlier on this ticket.
 *
 * Measured constant: the widest of the 24 real names, `Enzo Manuel Mangano (Reactiive)`, is
 * **927px at 60px** (`probe/ticket05/name-widths.ts`, rendered and ink-counted) — so
 * **15.45px of column per 1px of font-size.**
 *
 * `fitName(560)` is **36** and `fitName(1068)` is **69**, which is why the same name reads
 * 10.8px on screen on this layout and 20.4px on the shelf one.
 */
export const NAME_WIDTH_PER_PX = 15.45

/** The largest size at which the widest real name still fits `width` on one line. */
export function fitName(width: number): number {
  return Math.floor(width / NAME_WIDTH_PER_PX)
}

/** The one-line ceiling for the Plain layout: 36. It clears 560 by 4px. */
export const NAME_ONE_LINE = fitName(COL)

/**
 * The two-line ceiling, **56**. Not derived — measured, because above 36px the constraint
 * is where Satori breaks the string and not the total: at 52px the widest line is 536px and
 * at 56px it is 526px, but at **60px the name takes three lines** and stops being a name.
 */
export const NAME_TWO_LINE = 56

/**
 * **Bind a trailing parenthetical to the word before it, with a non-breaking space.**
 *
 * Left alone, Satori's break point is not monotonic in the font size, and that is the whole
 * problem. Measured across the five scales at the widest real name:
 *
 * | | the break it chose | |
 * |---|---|---|
 * | 36px | `Enzo Manuel Mangano` / `(Reactiive)` | orphan |
 * | 44px | `Enzo Manuel Mangano (` / `Reactiive)` | clean |
 * | **52px** | `Enzo Manuel Mangano` / `(Reactiive)` | **orphan — the size above a clean one is worse** |
 * | 56px | `Enzo Manuel` / `Mangano (Reactiive)` | clean |
 *
 * So "pick a bigger size" does not reliably fix a bad break, and no single size suits all
 * 24 names. Binding the parenthetical to its word removes the decision: the only break
 * points left are the spaces before it, and 52px becomes `Enzo Manuel` /
 * `Mangano (Reactiive)` like 56px. A typographic non-breaking space (`\u00a0`) is invisible
 * and is not a name change — `who.name` is untouched, so nothing about the image key moves.
 */
const NBSP = "\u00a0"
const bindParens = (name: string) => name.replace(/\s(\([^()]*\)\s*)$/, `${NBSP}$1`)

const glow = (hue: number) => `0 0 0 1px hsla(${hue},60%,62%,0.30), 0 28px 64px -26px hsla(${hue},70%,58%,0.55)`

function Mark({ size, pal }: { size: number; pal: Pal }) {
  return h(
    "div",
    { style: { display: "flex", fontFamily: SANS, fontSize: size, fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1 } },
    h("span", { style: { color: pal.t1 } }, "rnui"),
    h("span", { style: { color: pal.acc } }, ".dev")
  )
}

/**
 * The name, at the size its column allows. `nowrap` only where one line is *guaranteed* —
 * at 36px it is guaranteed by 4px, so it is not, and the larger scales let it break rather
 * than clip. A clipped name is the one failure this ticket exists to prevent; a second line
 * is not a failure.
 *
 * **`keepAll` fixes one break and causes another, so it is a scale's decision, not a
 * default.** Measured (`probe/ticket05/cjk-break.ts`):
 *
 * | | `Daehyeon Mun (문대현)` at 56px | `Enzo Manuel Mangano (Reactiive)` at 36px |
 * |---|---|---|
 * | default | `… (문대` / `현)` — **the Hangul splits** | `… Mangano` / `(Reactiive)` — an orphan |
 * | `keep-all` | `… (` / `문대현)` — **whole** | `… Mangano (Reactiive` / `)` — **an orphan of one character** |
 *
 * So neither setting is right on its own. **`keep-all` is what every scale above `Current`
 * uses**, and it works there because those scales are large enough for `(Reactiive)` to fit
 * on the first line — at 44px and up the break lands at `… Mangano (` / `Reactiive)`. At
 * 36px there is no size that fixes both, so `Current` keeps the card's shipped behaviour
 * and its defect, which is the point of a control.
 *
 * `lib/contributor-match.ts:27-31` exists because every slugifier on this repo has already
 * destroyed the Hangul name. **A card that breaks it mid-word has done the same thing again**,
 * which is why `keep-all` is on at every size where it can be.
 */
function Name({ who, pal, size, nowrap, width, keepAll, bind }: {
  who: Who; pal: Pal; size: number; nowrap: boolean; width: number; keepAll: boolean; bind: boolean
}) {
  return h(
    "div",
    {
      style: {
        fontFamily: SANS, fontSize: size, lineHeight: 1.04, fontWeight: 500,
        letterSpacing: "-0.024em", color: pal.t1, maxWidth: width,
        whiteSpace: nowrap ? "nowrap" : "normal",
        wordBreak: keepAll ? "keep-all" : "normal",
      },
    },
    bind ? bindParens(who.name) : who.name
  )
}

/**
 * "138 Recordings / 11 Categories". The words are a palette role rather than a fixed colour
 * because a scale can promote them from `t3` at **4.9:1** to `t2` at **6.9:1** — measured on
 * `canvas` — and `t3` is only legible on this card because the sizes are small, which is
 * precisely the problem.
 *
 * `stack: true` puts the two facts on **two lines by construction** rather than letting
 * Satori break the string at an arbitrary point. At 50px one line needs 796px of a 560px
 * column, so the choice is not "wrap or clip" — it is "two lines, or nothing".
 */
function Count({
  who, pal, num, word, words, stack,
}: { who: Who; pal: Pal; num: number; word: number; words: "t2" | "t3"; stack: boolean }) {
  const c = pal[words]
  const gap = Math.round(word * 0.5)
  const first = h(
    "div",
    { style: { display: "flex", alignItems: "baseline", gap, fontFamily: MONO, letterSpacing: "0.11em", whiteSpace: "nowrap" } },
    h("span", { style: { fontSize: num, color: pal.acc } }, String(who.count)),
    h("span", { style: { fontSize: word, color: c } }, who.count === 1 ? "RECORDING" : "RECORDINGS")
  )
  if (!stack) {
    return h(
      "div",
      { style: { display: "flex", alignItems: "baseline", gap, fontFamily: MONO, letterSpacing: "0.11em", whiteSpace: "nowrap" } },
      h("span", { style: { fontSize: num, color: pal.acc } }, String(who.count)),
      h("span", { style: { fontSize: word, color: c } }, who.count === 1 ? "RECORDING" : "RECORDINGS"),
      h("span", { style: { fontSize: word, color: c, opacity: 0.7 } }, MIDDOT),
      h("span", { style: { fontSize: word, color: c } }, `${who.categories} ${who.categories === 1 ? "CATEGORY" : "CATEGORIES"}`)
    )
  }
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: Math.round(word * 0.34), fontFamily: MONO, letterSpacing: "0.11em" } },
    first,
    h(
      "div",
      { style: { display: "flex", alignItems: "baseline", gap, whiteSpace: "nowrap" } },
      h("span", { style: { fontSize: word, color: c, opacity: 0.7 } }, MIDDOT),
      h("span", { style: { fontSize: word, color: c } }, `${who.categories} ${who.categories === 1 ? "CATEGORY" : "CATEGORIES"}`)
    )
  )
}

/**
 * `key` and `k` are different things and both are needed: `key` is the reconciler identity
 * Satori wants, `k` is the tile filename the component actually reads. Collapsing them to
 * one (`{ key: k, w }`) left `k` undefined inside, and every render failed with an ENOENT
 * on a path ending in "undefined" — 20 failures across two variants that looked like a
 * missing-asset problem.
 */
function Tile({ k, w, radius = 12 }: { k: string; w: number; radius?: number }) {
  return h("img", { src: b64(k), style: { width: w, height: Math.round((w * 212) / 168), objectFit: "cover", display: "flex", borderRadius: radius } })
}

// -- The one layout ------------------------------------------------------------
// **Plain, no disc, light.** `rnui.dev`, the name, the count in a 560px column on the left;
// a 3x2 grid of their six most recent Posters on the right.
//
// No disc is the maintainer's call and the right one — a 190px circle is decoration, and
// `extreme-border-radius-on-cards` and `hero-metric-layout` both have something to say about
// it. What it cost is recorded in the ticket: `contributorInitials` is the site's mark for a
// person everywhere else, so this card stops looking like the Recording detail and About page.

/** The grid, as the maintainer chose it: 3 columns of 152px, 12px apart, 66px from the right. */
const GRID_COLS = 3
const GRID_T = 152
const GRID_GAP = 12
/** Two rows, never three: a third row of 152px tiles runs off the bottom of the card. */
const GRID_ROWS = 2

export type Scale = {
  key: string
  name: string
  bet: string
  mark: number
  name_: number
  nowrap: boolean
  keepAll: boolean
  bind: boolean
  num: number
  word: number
  words: "t2" | "t3"
  stack: boolean
  gap: number
  /** Only `Wide` departs from the layout, and it is here to be measured, not chosen. */
  col?: number
  gridT?: number
  gridCols?: number
}

/**
 * The five text scales. **Only the type changes between the first four** — same elements,
 * same order, same 560px column, same 3x2 grid of 152px tiles, same 74px margins, same
 * palette. `Wide` is the fifth and it is the control for what the column costs: the name at
 * the shelf layout's 68px, bought with a 1068px column and a 2x2 grid.
 *
 * Each size is a measured ceiling rather than a round number: the name's is 36 on one line
 * and 56 on two, the count's is 30 on one line and about 50 on two.
 *
 * **`Wide` is the arithmetic, not an option.** A name on one line of `width` costs
 * `15.45 x width` of column, and the card has to hold that column, a 43px shadow clearance
 * (this ticket's own measurement) and the grid inside `66 + column + 43 + grid + 66 = 1200`.
 * With the smallest grid worth having — 2 columns of 132px, 276px wide — that leaves
 * `15.45N <= 1025 - 276 = 749`, so **N <= 48**. The first attempt at this scale asked for
 * 68px in a 1068px column and the name ran straight under the tiles; the arithmetic says it
 * never could have worked, and 48px is what the one-line guarantee is actually worth here.
 */
export const SCALES: Scale[] = [
  {
    key: "Current", name: "Current — 34 / 36 / 26",
    bet: "The card exactly as it ships, defects included. Name 10.8px and count 7.8px on a 360px Slack card, and the words are t3 at 4.9:1",
    mark: 34, name_: NAME_ONE_LINE, nowrap: false, keepAll: false, bind: false, num: 26, word: 26, words: "t3", stack: false, gap: 26,
  },
  {
    key: "Read", name: "Read — 40 / 44 / 38",
    bet: "The first clean, legible step. keep-all on, so the Hangul survives, and 44px is enough for (Reactiive) to stay whole",
    mark: 40, name_: 44, nowrap: false, keepAll: true, bind: true, num: 38, word: 38, words: "t2", stack: true, gap: 26,
  },
  {
    key: "Loud", name: "Loud — 48 / 52 / 44",
    bet: "Name 15.6px on screen. 526px is the widest name line, of 560 — the column is nearly full",
    mark: 48, name_: 52, nowrap: false, keepAll: true, bind: true, num: 44, word: 44, words: "t2", stack: true, gap: 26,
  },
  {
    key: "Max", name: "Max — 52 / 56 / 50",
    bet: "The name's two-line ceiling. 60px takes THREE lines, so 56 is the last size that is still a name",
    mark: 52, name_: NAME_TWO_LINE, nowrap: false, keepAll: true, bind: true, num: 50, word: 50, words: "t2", stack: true, gap: 26,
  },
  {
    key: "Wide", name: "Wide — 52 / 48 / 50, one line",
    bet: "NOT the same layout, and deliberately: the grid drops to 2x2 of 132px to buy the name ONE line. It reaches 48px, not 68px — that is the whole price",
    mark: 52, name_: 48, nowrap: true, keepAll: true, bind: true, num: 50, word: 50, words: "t2", stack: true, gap: 26,
    col: 760, gridT: 132, gridCols: 2,
  },
]

export const VARIANTS = SCALES.map((s) => ({ key: s.key, name: s.name, bet: s.bet, scale: s }))
export type VariantKey = string

function VCard({ who, pal, s }: { who: Who; pal: Pal; s: Scale }) {
  const col = s.col ?? COL
  const t = s.gridT ?? GRID_T
  const cols = s.gridCols ?? GRID_COLS
  const gw = cols * t + (cols - 1) * GRID_GAP
  const n = Math.min(cols * GRID_ROWS, Math.max(1, who.tiles.length))
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      "div",
      {
        style: {
          position: "absolute", right: 66, top: 74, bottom: 74, width: gw,
          display: "flex", flexWrap: "wrap", gap: GRID_GAP, alignContent: "center",
        },
      },
      ...who.tiles.slice(0, n).map((k) => h(Tile, { key: k, k, w: t, radius: 10 })),
      // A Contributor's with fewer tiles than the grid holds gets an honest gap rather than
      // a repeated tile — Hubert Ryan has one, and padding it out would invent work.
      ...Array.from({ length: Math.max(0, Math.min(cols * GRID_ROWS, 6) - n) }, (_, i) =>
        h("div", { key: `gap${i}`, style: { width: t, height: Math.round((t * 212) / 168), flexShrink: 0, borderRadius: 10, background: pal.rail } })
      )
    ),
    h(
      "div",
      {
        style: {
          position: "absolute", left: 66, top: 74, bottom: 74, width: col,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: s.gap,
        },
      },
      h(Mark, { size: s.mark, pal }),
      h(Name, { who, pal, size: s.name_, nowrap: s.nowrap, width: col, keepAll: s.keepAll, bind: s.bind }),
      h(Count, { who, pal, num: s.num, word: s.word, words: s.words, stack: s.stack })
    )
  )
}

export function render(variant: VariantKey, mode: Mode, who: Who) {
  const v = VARIANTS.find((x) => x.key === variant)!
  return VCard({ who, pal: C[mode] as Pal, s: v.scale })
}
