// PROTOTYPE — ticket 04, the default card. Throwaway; nothing ships.
//
// Five structurally different answers, and every one of them renders in BOTH
// modes, because the ticket's largest open question is dark versus light:
//
//   | | Name      | What it is                                                        |
//   |---|-----------|-------------------------------------------------------------------|
//   | 1 | **Hero**  | the homepage's own hero at card scale — the claim plus the three counts |
//   | 2 | **Mark**  | the wordmark alone, and nothing else                              |
//   | 3 | **Scale** | the three counts as the *headline*, the claim demoted to a caption |
//   | 4 | **Wall**  | a 4x2 grid of cropped Poster tiles, the wordmark over it          |
//   | 5 | **Facets**| the Category list with counts — an index, shown as an index         |
//
// The ticket named a fifth direction, "a poster-child card". It is not built
// here, and the reason is worth stating rather than leaving as an omission: a
// poster-child card is the Recording card with the caption removed, and ticket
// 06 already settled that shape — Poster at true ratio on a rail, uncropped.
// Building it twice would be the same card twice.
//
// What carries over from ticket 06, because it is measured rather than chosen:
//   * K = 2.8, bounded above by the catalogue's longest caption
//   * the wordmark at the header's *treatment*, `wordmark.tsx`
//   * a wordmark over imagery sits on a solid --canvas chip (--t1 is invisible
//     on a pale one and blending is unavailable)
//   * a scrim is sized FROM the text block, never as a literal
//
// What this ticket decides that 06 could not: the default card has no caption
// and no Contributor, so its hierarchy is a different problem — the site's name
// leads, and then *what the site is*.

import { createElement as h, type ReactNode } from "react"
import { readFileSync } from "node:fs"

import { type_, MONO, SANS } from "./tokens"
import { Wordmark } from "./wordmark"

// -- The numbers, read off the catalogue rather than off the shipped card.
//
// `app/opengraph-image.tsx:56` claims "343+ animations". The catalogue has 298
// Recordings. The claim is wrong by 45 and uses the wrong noun: the domain is
// **Recording** (CONTEXT.md, ADR-0008), and 6 of the 298 are Full Apps rather
// than animations at all.
export const STATS = { recordings: 298, contributors: 24, categories: 18 }

/** The homepage's own h1, verbatim — components/hero.tsx:23. */
export const CLAIM = "A community-made catalogue of React Native interfaces."

// The type scale. K from ticket 06 for the headline; the small steps promoted
// further for platform legibility, on the same reasoning: nothing readable sits
// under 11px at Slack's 360px.
export const K_HERO = 2.8
export const K_NUM = 3.8

/**
 * The **platform floor**, as a card size.
 *
 * A card is 1200px wide and Slack renders it at 360 — a factor of 0.3. So an
 * element clears an 11px on-screen size only at **>= 37 card px**. This is the
 * single most useful number in this ticket and it is arithmetic rather than
 * taste: it turns "is this legible?" into a comparison.
 *
 * It is the same constraint ticket 06 found from the other end, where it bounded
 * the caption's scale from *above*. Here it bounds the small steps from
 * *below*, and the two pull in opposite directions in the same column — which is
 * why the stat labels had to be promoted off the number's own proportion rather
 * than scaled with it.
 */
export const FLOOR_CARD_PX = Math.ceil((11 * 1200) / 360) // 37
const LABEL_PX = FLOOR_CARD_PX

// -- Both palettes, as literals (CSS custom properties do not resolve in
// ImageResponse — ticket 02). app/globals.css:200-285.
export type Mode = "dark" | "light"

type Pal = {
  canvas: string; panel: string; rail: string
  t1: string; t2: string; t3: string
  acc: string; onAcc: string
  line: string; line2: string
  e0: string
  scrim: string
}

const PAL: Record<Mode, Pal> = {
  dark: {
    canvas: "#0A0B0D", panel: "#101216", rail: "#0C0D11",
    t1: "#F1F2F4", t2: "#B2B8C2", t3: "#8E949F",
    acc: "#6FE3CC", onAcc: "#06120F",
    line: "rgba(255,255,255,0.11)", line2: "rgba(255,255,255,0.22)",
    e0: "0 0 0 1px rgba(255,255,255,0.07)",
    scrim: "rgba(4,5,8,0.74)",
  },
  light: {
    canvas: "#F4F4F1", panel: "#FFFFFF", rail: "#EFEFEB",
    t1: "#14161A", t2: "#4F545C", t3: "#666B74",
    acc: "#0E7062", onAcc: "#FFFFFF",
    line: "rgba(16,18,22,0.13)", line2: "rgba(16,18,22,0.24)",
    e0: "0 0 0 1px rgba(16,18,22,0.10)",
    scrim: "rgba(24,26,30,0.52)",
  },
}

/** Wordmark sized for a card, in either palette. */
function Mark({ size, pal }: { size: number; pal: Pal }) {
  return h(
    "div",
    { style: { fontFamily: SANS, fontSize: size, fontWeight: 700, letterSpacing: "-0.02em", display: "flex" } },
    h("span", { style: { color: pal.t1 } }, "rnui"),
    h("span", { style: { color: pal.acc } }, ".dev")
  )
}

/**
 * The three counts, in the homepage hero's own treatment.
 *
 * components/hero.tsx:26-39: a sans number in --t1 with `tabular-nums`, and a
 * mono label in --t3, stacked, right-aligned, 22px apart. Copied rather than
 * restyled, so the card and the page say the same thing in the same way.
 */
function StatRow({ pal, size, align = "flex-start" }: { pal: Pal; size: number; align?: string }) {
  const items: [string, string][] = [
    [String(STATS.recordings), "RECORDINGS"],
    [String(STATS.contributors), "CONTRIBUTORS"],
    [String(STATS.categories), "CATEGORIES"],
  ]
  return h(
    "div",
    { style: { display: "flex", gap: size * 0.55, alignItems: "flex-start", justifyContent: align } },
    ...items.map(([n, label]) =>
      h(
        "div",
        { key: label, style: { display: "flex", flexDirection: "column", gap: Math.round(size * 0.16) } },
        h(
          "div",
          {
            style: {
              fontFamily: SANS,
              fontSize: size,
              lineHeight: 1.1,
              fontWeight: 500,
              color: pal.t1,
              fontVariantNumeric: "tabular-nums",
            },
          },
          n
        ),
        h(
          "div",
          {
            style: {
              fontFamily: MONO,
              // **Promoted above the proportion the hero uses.** The hero's label is
              // 10px on a 380px tile; at the number's own size it would be 16px on a
              // 1200px card, which is 4.8px at Slack's 360px -- unreadable, and these
              // three labels are what turn three numbers into a sentence. The floor is
              // arithmetic: a card shown at 360px needs >= 37 card px to clear 11px.
              fontSize: LABEL_PX,
              lineHeight: 1.2,
              letterSpacing: "0.14em",
              color: pal.t3,
            },
          },
          label
        )
      )
    )
  )
}

// -- 1. Hero -----------------------------------------------------------------
// The site's own homepage hero, at card scale. The claim is the h1 verbatim and
// the counts are the hero's own stat row. The bet: a share of the root URL is a
// share of *the site*, and this is the one card that can say so in the site's
// own words rather than inventing a pitch for it.

function Hero({ pal }: { pal: Pal }) {
  const t = type_("hero")
  return h(
    "div",
    {
      style: {
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: 80, background: pal.canvas,
      },
    },
    h(Mark, { size: 40, pal }),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 40, maxWidth: 940 } },
      h(
        "div",
        { style: { ...t, fontFamily: SANS, color: pal.t1, maxWidth: 940 } },
        CLAIM
      ),
      h(StatRow, { pal, size: Math.round(10 * K_NUM) })
    )
  )
}

// -- 2. Mark -----------------------------------------------------------------
// The wordmark and nothing else. The bet: a stranger who has seen the card needs
// to know *which site*, and everything else is a reason to add later. The cost is
// that it says nothing about what a Recording is, so it cannot persuade anyone
// who does not already recognise the name — which is the whole point of a share.

function MarkOnly({ pal }: { pal: Pal }) {
  return h(
    "div",
    {
      style: {
        width: "100%", height: "100%", display: "flex", alignItems: "center",
        justifyContent: "center", background: pal.canvas,
      },
    },
    h(Mark, { size: 108, pal })
  )
}

// -- 3. Scale ----------------------------------------------------------------
// The counts ARE the headline; the claim is a caption beneath them. The bet: a
// number is the thing that makes a catalogue clickable, and 298 is more
// interesting than any adjective. The cost: a bare number says nothing about
// what is being counted, so it needs the claim to survive as a stranger's first
// question.

function Scale({ pal }: { pal: Pal }) {
  return h(
    "div",
    {
      style: {
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", gap: 44, padding: 80, background: pal.canvas,
      },
    },
    h(Mark, { size: 40, pal }),
    h(StatRow, { pal, size: Math.round(10 * K_NUM) * 2.1 }),
    h(
      "div",
      {
        style: {
          fontFamily: SANS,
          fontSize: Math.round(12 * 2.4),
          lineHeight: 1.4,
          fontWeight: 400,
          color: pal.t2,
          maxWidth: 820,
        },
      },
      CLAIM
    )
  )
}

// -- 4. Wall -----------------------------------------------------------------
// Eight real Posters, cropped to tiles, filling the card; the wordmark on a solid
// --canvas chip over the top-left.
//
// The crop is the cost and it is measured: a tile keeps 57-76% of its Poster's
// height (grid-renditions.ts), which is far better than the 25% a single-poster
// card measures, and defensible here for a reason it is not defensible on a
// Recording card — **no tile is being read as a device**. What is lost is the
// frame: the home indicator and the tab bar are cropped away. The other cost is
// in the render rather than the crop: one tile in eight measures mean luma 246,
// and 64 of 297 Posters are near-white app chrome, so a wall can put a white
// block next to the chip the wordmark sits on. The chip is opaque --canvas for
// exactly that reason.

type Tile = { key: string; hue: number }
const TILES: Tile[] = [
  { key: "ripple_effect_daehyeon_mun", hue: 25 },
  { key: "loading-button_enzo_manuel_mangano_reactiive", hue: 206 },
  { key: "dynamic-blur-tabs_enzo_manuel_mangano_reactiive", hue: 114 },
  { key: "live_voice_david_mokos", hue: 304 },
  { key: "blurred-scroll_enzo_manuel_mangano_reactiive", hue: 258 },
  { key: "morphingLoader", hue: 163 },
  { key: "coinbase_charts_william_candillon", hue: 346 },
  { key: "dynamic_accordion_hewad_mubariz", hue: 86 },
]

function tile(key: string) {
  return `data:image/jpeg;base64,${readFileSync(
    new URL(`./grid/${key}.jpg`, import.meta.url).pathname
  ).toString("base64")}`
}

function Wall({ pal }: { pal: Pal }) {
  const TW = 264
  const TH = 330
  const gap = 10
  // 4 x 2 = 1086 x 670 in a 1200 x 630 card, so the wall overhangs by 114px on
  // the right and 40px at the bottom *deliberately* — an exact fit would leave a
  // ragged 114px of empty canvas down the right edge, which reads as a mistake.
  // The first attempt used 250 x 315 and overflowed the bottom by **8px**, which
  // is the worst of both: too little to read as intentional and enough to clip a
  // tile mid-corner.
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas } },
    h(
      "div",
      {
        style: {
          width: TW * 4 + gap * 3,
          display: "flex",
          flexWrap: "wrap",
          gap,
          alignContent: "flex-start",
        },
      },
      ...TILES.map((t) =>
        h("img", {
          key: t.key,
          src: tile(t.key),
          style: { width: TW, height: TH, objectFit: "cover", display: "flex" },
        })
      )
    ),
    // The chip. Opaque --canvas, sized from its own content — the ticket-06
    // finding that a wordmark over imagery needs a solid chip, because --t1 is
    // invisible on a pale Poster and no blend mode exists to save it. Here the
    // chip is also load-bearing twice over: one tile in eight measures mean luma
    // 246, and 64 of 297 Posters are near-white app chrome, so a wall can put a
    // white block directly against the type.
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 72,
          top: 72,
          display: "flex",
          flexDirection: "column",
          gap: 26,
          padding: "34px 42px",
          borderRadius: 16,
          background: pal.canvas,
          boxShadow: pal.e0,
        },
      },
      h(Mark, { size: 44, pal }),
      h(StatRow, { pal, size: Math.round(10 * K_NUM) })
    )
  )
}

// -- 5. Facets ---------------------------------------------------------------
// The Category list, with counts — an index shown as an index. The bet: this site
// is browsable by facet, and a share of the root URL is usually someone asking
// "what is in here?". The cost is the ticket's own arithmetic: **18 Categories do
// not fit**, so a subset must be chosen, and any subset is a claim about which
// Categories matter that nobody made. Both are rendered — a 8-row subset in two
// columns, and all 18 in four columns at a size nobody can read — so the cost is
// visible rather than argued.

const SUBSET: [string, number][] = [
  ["Misc", 161], ["Buttons", 20], ["Tab bars", 19], ["Sliders", 18],
  ["List", 17], ["Carousels", 10], ["Loaders", 10], ["Charts", 9],
]

export const ALL18: [string, number][] = [
  ["Misc", 161], ["Buttons", 20], ["Tab bars", 19], ["Sliders", 18], ["List", 17],
  ["Carousels", 10], ["Loaders", 10], ["Charts", 9], ["Bottom Sheets", 6], ["Full Apps", 6],
  ["Onboarding", 6], ["Parallaxes", 4], ["Circular Progress Bars", 3], ["Headers", 3],
  ["Accordions", 2], ["Arc Sliders", 2], ["Drop Down", 1], ["Pickers", 1],
]

/**
 * Columns as **explicit containers**, not `flexWrap: wrap`.
 *
 * The first attempt used `flexWrap` and it is broken in Satori: the items packed
 * into ragged rows rather than columns, so each count's `marginLeft: auto` pushed
 * it into the *next item's* cell — "161BUTTONS" — and the third column ran off the
 * card's right edge entirely. Satori implements `flex-wrap` well enough to wrap
 * and not well enough to grid, so a multi-column list has to be built from nested
 * `flexDirection: column` boxes, which is deterministic.
 *
 * **Column widths are derived, never chosen.** The first fixed attempt hard-coded
 * 372 and it overflowed by 92px on a 1200 card, clipping the last count in every
 * row — a card that looks like a list and cuts its own data. `colsWidth()` below
 * hands out exactly what is left after the label column, the gap and the padding,
 * so a change to any of them cannot silently clip.
 */
const PAD_X = 80
const LABEL_W = 300
const FACET_GAP = 56
const COL_GAP = 28

function colsWidth(cols: number): number {
  const avail = 1200 - PAD_X * 2 - LABEL_W - FACET_GAP
  return Math.floor((avail - COL_GAP * (cols - 1)) / cols)
}

function Facets({ pal, all }: { pal: Pal; all?: boolean }) {
  const rows = all ? ALL18 : SUBSET
  const cols = all ? 4 : 2
  const colW = colsWidth(cols)
  // The subset clears the floor; all 18 provably cannot, and that is the point of
  // rendering it. See the audit: 18 rows at >= 37px in 4 columns leaves ~150px per
  // column, and the longest Category name needs ~500px at that size.
  const rowSize = all ? 19 : FLOOR_CARD_PX
  const perCol = Math.ceil(rows.length / cols)
  // Satori throws on an explicit `undefined` in a style object ("Cannot read
  // properties of undefined (reading 'trim')"), so optional numbers are spread
  // conditionally rather than passed as `undefined`.
  const rowBox = all ? { minHeight: 34 } : {}

  const columns = Array.from({ length: cols }, (_, c) =>
    h(
      "div",
      { key: c, style: { display: "flex", flexDirection: "column", gap: all ? 10 : 18, width: colW, flexShrink: 0 } },
      ...rows.slice(c * perCol, (c + 1) * perCol).map(([name, n]) =>
        h(
          "div",
          {
            key: name,
            style: {
              display: "flex", alignItems: "baseline", gap: 8, width: colW,
              paddingBottom: all ? 6 : 10, borderBottom: `1px solid ${pal.line}`,
              // The one place a truncation is honest: a Category's *name* may lose
              // its tail, exactly as a Contributor's name may on a Recording card
              // (ticket 06). A count may not.
              ...rowBox,
            },
          },
          h(
            "div",
            {
              style: {
                fontFamily: MONO, fontSize: rowSize, lineHeight: 1.25,
                letterSpacing: "0.02em", color: pal.t1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxWidth: colW - 34,
              },
            },
            name.toUpperCase()
          ),
          h(
            "div",
            {
              style: {
                fontFamily: MONO, fontSize: rowSize, lineHeight: 1.25,
                color: pal.t3, fontVariantNumeric: "tabular-nums", marginLeft: "auto",
                flexShrink: 0,
              },
            },
            String(n)
          )
        )
      )
    )
  )

  return h(
    "div",
    {
      style: {
        width: "100%", height: "100%", display: "flex", gap: FACET_GAP,
        padding: `72px ${PAD_X}px`, background: pal.canvas, alignItems: "center",
      },
    },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 24, flexShrink: 0, width: LABEL_W } },
      h(Mark, { size: 38, pal }),
      h(
        "div",
        { style: { fontFamily: SANS, fontSize: 28, lineHeight: 1.35, color: pal.t2 } },
        CLAIM
      )
    ),
    h("div", { style: { display: "flex", gap: COL_GAP } }, ...columns)
  )
}

/**
 * The Wall's chip box, computed from the same constants `Wall` lays out with.
 *
 * Exported so the audit never has to *hunt* for it. Two earlier versions of the
 * audit guessed the box from the stylesheet and were both wrong — the first by 90px
 * on the right, the second by a flood-fill that leaked, because the chip's fill IS
 * `--canvas` and so is the card behind it. A check that must infer the geometry it
 * is checking will eventually infer it wrongly; deriving it removes the failure.
 */
export function chipBox(): { l: number; t: number; w: number; h: number } {
  const left = 72
  const top = 72
  const padX = 42
  const padY = 34
  const gap = 26
  const markSize = 44
  const numSize = Math.round(10 * K_NUM)
  const labelSize = LABEL_PX
  // The widest label is "CONTRIBUTORS": 12 glyphs at 0.6em plus 0.14em tracking.
  const labelW = 12 * labelSize * (0.6 + 0.14)
  const contentW = Math.max(markSize * 3.1, labelW)
  const contentH = markSize * 1.2 + gap + (numSize * 1.1 + 6 + labelSize * 1.2)
  return { l: left, t: top, w: Math.round(contentW + padX * 2), h: Math.round(contentH + padY * 2) }
}

export const VARIANTS = [
  { key: "Hero", name: "Hero", bet: "The homepage's own h1 and its own three counts — the site, in its words", fn: (p: Pal) => Hero({ pal: p }) },
  { key: "Mark", name: "Mark", bet: "The wordmark alone. Says which site, says nothing else", fn: (p: Pal) => MarkOnly({ pal: p }) },
  { key: "Scale", name: "Scale", bet: "298 / 24 / 18 as the headline. The number is the hook", fn: (p: Pal) => Scale({ pal: p }) },
  { key: "Wall", name: "Wall", bet: "Eight real Posters, cropped to tiles. What the site is, not what it says", fn: (p: Pal) => Wall({ pal: p }) },
  { key: "Facets", name: "Facets", bet: "The Category list with counts. An index, shown as an index", fn: (p: Pal) => Facets({ pal: p }) },
  { key: "Facets18", name: "Facets (all 18)", bet: "The same list, complete — and unreadable. What the subset costs", fn: (p: Pal) => Facets({ pal: p, all: true }) },
] as const

export type VariantKey = (typeof VARIANTS)[number]["key"]

export function render(variant: VariantKey, mode: Mode) {
  const v = VARIANTS.find((x) => x.key === variant)!
  return v.fn(PAL[mode])
}

export function palette(mode: Mode): Pal {
  return PAL[mode]
}
