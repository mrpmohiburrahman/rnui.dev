// PROTOTYPE — ticket 05, the **Fan** card. Throwaway; nothing ships.
//
//   pnpm tsx prototypes/og-cards/render-fan.tsx
//
// Needs `pnpm tsx prototypes/og-cards/probe/tiles.ts` first.
//
// ## The layout, and what is held fixed
//
// The maintainer's reference is a **fan of Posters on the left and one type block on the
// right**, and they said twice to keep that layout. So it is held here: the fan is always
// left, and the right column always carries exactly three things in this order —
//
//     rnui.dev        the wordmark, at the homepage's treatment
//     <name>          the Contributor's name, the largest thing on the card
//     138 RECORDINGS · 11 CATEGORIES    the count, smaller than the name
//
// What varies across the five is **the fan's geometry and the type scale**, and nothing
// else — same elements, same order, same light palette. That is what makes them comparable.
//
// ## One thing is decided by the card, not by CSS: **the card owns the name's break**
//
// A trailing parenthetical on this site is always an *alias* — `Enzo Manuel Mangano` /
// `(Reactiive)`, `Arnaud Dellinger` / `(evening kid)`. So it goes on its own line, as two
// blocks, and Satori is never asked to choose a break point.
//
// That is not a stylistic preference. It is the fix for a defect the rendered cards showed:
// with `word-break: keep-all` plus a non-breaking space binding the parenthetical — both
// inherited from the settled card — the widest name still came out as
//
//     Enzo Manuel Mangano (          <- the "(" orphaned at the end of a line
//     Reactiive)
//
// **Neither CSS setting fixes both breaks on its own**, which is the same wall the settled
// card hit and documented (`probe/ticket05/fan-break.tsx` measures all four combinations).
// Owning the break makes an orphan *impossible* rather than unlikely, and it makes
// `(문대현)` unsplittable for free, without needing `keep-all` at all.
//
// The gain is large, and it is not the fan's doing. All **24** real names, measured
// (`probe/ticket05/fan-ceiling.tsx`):
//
// | right column | settled card | this card | on a 360px Slack card |
// |---|---|---|---|
// | 560px | 36px | **48px** | 14.4px |
// | 600px | — | **52px** | 15.6px |
// | 640px | — | **56px** | 16.8px |
// | 680px | — | **60px** | 18.0px |
// | 720px | — | **64px** | 19.2px |
//
// **Every one of those ceilings is set by the same name: `Konstantinos Efkarpidis`** — 23
// characters and the only long name with *no* parenthetical, so it is measured whole and
// cannot be given a second line. He was never in the five-Contributor cast, and he is the
// name that decides the size. That is why every variant's `nameSize` below is a measured
// ceiling rather than a round number.
//
// ## Three things this file had to be told by a renderer, not by a list
//
// **1. `zIndex` does not exist.** Satori ignores it: a probe that ordered three overlapping
// cards by `zIndex` rendered byte-identically to the same three in DOM order, sampled at the
// overlap (`probe/ticket05/fan-probe.tsx`). So **the fan is emitted back-to-front in the DOM**
// and nothing in this file sets `zIndex`.
//
// **2. `transform-origin` DOES work** — the opposite result, and the reason the fan is CSS
// rather than trigonometry. `transform-origin: bottom center` and `50% 100%` produced
// **byte-identical** ink bounds (`406x255 @ x225..631`), so cards pivot on their own bottom
// edge and a shared pivot is just a shared horizontal offset. The arithmetic fallback in the
// probe was correct and is not needed.
//
// **3. The break point is not monotonic in size.** The widest name at 68px takes two lines
// and fits in 638px of a 680px column; at 72px it takes three. "As big as fits" is not a rule.
//
// ## Two slop rules that land on this design, from the maintainer's impeccable.style
//
// - **"Hero metric layout"** — a huge number over a small label. The brief dodges it for free
//   (the *name* is the largest thing, the count is smaller), and that is also why no variant
//   promotes the count, including `Deck` where 138 is at its most tempting: **138 is a fact
//   about a person, and this card is for the person.**
// - **"Hairline border with wide shadow"** — the fan tiles take a **shadow and no ring**, the
//   one place this departs from the site's own `--e1`. Nine overlapping tiles each drawing a
//   hairline over nine shadows is unreadable; the shadow alone is what separates the cards.
//
// And the reference's **beige background is not copied.** It is a warm cream, and
// `impeccable.style` names "cream / beige palette" as a default to be suspicious of. The
// canvas is the Design's own `--canvas` `#F4F4F1`, and the wordmark is the homepage's —
// `rnui` in `--t1`, `.dev` in `--acc`, weight **700**, tracking `-0.02em`, copied from
// `components/site-header.tsx:98-102` rather than invented.

import { createElement as h } from "react"
import { readFileSync } from "node:fs"

/** app/globals.css :root — light. A card has no visitor preference in hand. */
const C = {
  canvas: "#F4F4F1",
  panel: "#FFFFFF",
  rail: "#EFEFEB",
  t1: "#14161A",
  t2: "#4F545C",
  t3: "#666B74",
  acc: "#0E7062",
  line: "rgba(16,18,22,0.13)",
} as const

const SANS = "Space Grotesk"
const MONO = "JetBrains Mono"

export type Who = {
  name: string
  count: number
  categories: number
  tiles: string[]
  newest: { caption: string; at: string } | null
}

export const CAST: Who[] = JSON.parse(
  readFileSync(new URL("./tiles/contrib/index.json", import.meta.url).pathname, "utf8")
)

const b64 = (k: string) =>
  `data:image/jpeg;base64,${readFileSync(new URL(`./tiles/contrib/${k}.jpg`, import.meta.url).pathname).toString("base64")}`

/** The Posters are 168x212 on disk. Every tile keeps that ratio — no crop, no stretch. */
export const AR = 212 / 168

/** Slack crops 66px off each side; 1200 - 132 = 1068px of safe width. */
export const SAFE_W = 1068
/** The card's own margin, the same 66px the Plain card uses. */
export const MARGIN = 66
/** Between the fan's right edge and the type's left edge. */
export const GUTTER = 48

/**
 * **The card owns the name's break.** Split a trailing parenthetical off as its own block.
 *
 * The alias is always a *parenthetical handle* on this site — `(Reactiive)`, `(evening kid)`,
 * `(문대현)` — never part of the name itself, so it reads correctly on its own line. A name
 * with no parenthetical is returned whole and wraps naturally, which for the catalogue means
 * it never has to: `Konstantinos Efkarpidis` is measured at 527px in a 560px column, so it
 * fits at every ceiling below.
 */
export function splitName(n: string): [string, string | null] {
  const m = n.match(/^(.*?)\s*(\([^()]*\)\s*)$/)
  return m ? [m[1], m[2]] : [n, null]
}

/**
 * The shadow, and **the absence of a ring**.
 *
 * `--e1` is `0 0 0 1px rgba(16,18,22,0.10), 0 20px 44px -22px ...` — a hairline AND a
 * shadow, defining the same card twice. On one isolated tile that reads as intentional; on
 * **eight overlapping tiles** it reads as eight outlines drawn over eight shadows and the eye
 * cannot tell which edge belongs to which card. So the fan takes the shadow alone.
 *
 * Two terms, not one: a tight contact shadow where a card crosses its neighbour, and a wide
 * soft one for the stack against the canvas. At this overlap the difference is visible along
 * the top of the fan, where five card edges sit within 60px of each other.
 */
const shadow = (depth: number) =>
  `0 2px 8px -2px rgba(16,18,22,0.28), 0 ${16 + depth}px ${30 + depth * 2}px -${10 + depth * 2}px rgba(16,18,22,0.30)`

export type Geometry = {
  /**
   * The fan's target width in px, held constant.
   *
   * **The fan's footprint does not change; the cards inside it do.** An earlier version
   * stored a tile `w` and a `step`, which meant a Contributor with one Recording rendered as
   * one small card floating inside four pale empty slots — which read as a broken image, not
   * as "this person has one Recording". So the fan is specified by how wide it is and how
   * much of each card shows, and the tile width is solved for.
   *
   * The consequence is that **there are no empty slots at all.** A shortfall is not padded;
   * the cards that exist grow to fill the same width.
   */
  fanW: number
  /** The most tiles the fan can hold. */
  n: number
  /** `step / tileWidth` — what fraction of a card is left showing by its neighbour. */
  stepRatio: number
  /** Rotation step in degrees; the fan is centred, so an n=5 fan spans -2..+2 steps. */
  tilt: number
  /** Vertical rise per step. Negative climbs. 0 = every card on one baseline. */
  rise?: number
  /** Anchor: `bottom` pivots the arc; `top` steps each card up and right. */
  anchor: "bottom" | "top"
  /** Only `Drum`: one tile per ~24 Recordings, so 138 fills the fan and 1 does not. */
  scaleWithCount?: boolean
}

export type Variant = {
  key: string
  /** The display label. Deliberately not `name` — that collided with the font size once. */
  label: string
  /** The bet, in one line. What this one is trying that the others are not. */
  bet: string
  /** What it costs, in the same register as the bet. */
  cost: string
  geo: Geometry
  /** Wordmark size. */
  mark: number
  /**
   * Name size. **Leave it out** and it is derived from the column by `ceilingFor`, which is
   * the measured all-names ceiling.
   *
   * It was a stored number and it went stale the moment a fan's width changed, in four
   * variants at once. The renderer does not complain about a too-large name — it wraps, and a
   * wrap at the wrong place is exactly the defect this layout was rebuilt to remove. So the
   * size is a function of the geometry and cannot disagree with it.
   */
  nameSize?: number
  /** Count numeral size. */
  num: number
  /** Count word size. */
  word: number
  /** Palette role for the count's words: `t3` is 4.9:1 and only legible when small. */
  words: "t2" | "t3"
  /** Two lines for the count rather than letting Satori break it. */
  stackCount: boolean
  /**
   * `[singular, plural]` for the count's label. **Deck only** carries an override.
   *
   * The default is the domain's noun, `Recording` (`CONTEXT.md`, ADR-0008), which is what
   * ticket 05 settled after weighing "animations". The maintainer overrode that on
   * 2026-10-06 for the card they chose. It is recorded rather than silently applied, because
   * it is the one place this card's wording and the site's glossary now disagree — and
   * `lib/contributor-match.ts` and every other reader of the catalogue still speak of
   * Recordings.
   *
   * `ANIMATIONS` is 10 characters, the same as `RECORDINGS`, and the line is set in JetBrains
   * Mono, so the two render at **identical width**. Nothing reflows and no size was
   * re-measured — verified by re-running `verify-fan.tsx`, not by counting.
   */
  noun?: [string, string]
  /** Gap between the three type blocks. */
  gap: number
}

/**
 * The five fans. All five hold the layout; they differ in **how the cards are arranged** and
 * **how big the type is**.
 *
 * `nameSize` is not chosen, it is derived: `ceilingFor(columnFor(v))`, the largest size at
 * which all 24 real names keep each part on one line. Re-derive rather than edit one — if
 * you change a fan's width, its type size is now wrong and the renderer will not tell you.
 */
export const VARIANTS: Variant[] = [
  {
    key: "Fan",
    label: "Fan — five, arc, tight",
    bet: "The reference as drawn: five cards pivoting on one baseline, opening like a hand",
    cost: "Its name clears 60px. The tight step leaves 30px of each card showing, so the four behind the front one are texture rather than pictures",
    geo: { fanW: 327, n: 5, stepRatio: 0.167, tilt: 7, anchor: "bottom" },
    mark: 36, num: 30, word: 30, words: "t3", stackCount: false, gap: 22,
  },
  {
    key: "Stair",
    label: "Stair — four, climbing",
    bet: "The reference image's own arrangement, which is a staircase and not an arc: each card climbs and tilts",
    cost: "Four big cards rather than five, and they climb into the top margin. It pays for them with the name: 52px, against Fan's 60",
    geo: { fanW: 396, n: 4, stepRatio: 0.3, tilt: 5, rise: -38, anchor: "top" },
    mark: 36, num: 30, word: 30, words: "t3", stackCount: false, gap: 22,
  },
  {
    key: "Deck",
    label: "Deck — eight, heavy overlap",
    bet: "Only a sliver of each card shows, so the fan reads as a **stack with more behind it** rather than as five things",
    cost: "Six of the eight are unreadable as images. It buys the biggest name of the five, 64px, by being the tightest fan — 18px of each card shows",
    geo: { fanW: 287, n: 8, stepRatio: 0.129, tilt: 4, anchor: "bottom" },
    noun: ["ANIMATION", "ANIMATIONS"],
    mark: 36, num: 32, word: 32, words: "t2", stackCount: false, gap: 22,
  },
  {
    key: "Slab",
    label: "Slab — three, big, count stacks",
    bet: "Three big cards instead of many small ones — the Posters stay legible as pictures rather than as texture",
    cost: "The widest fan of the five, because three legible Posters need a real gap between them — and it pays the most: 48px, half of Deck's name. A 138-Recording contributor shows three, exactly as a 4-Recording one does",
    geo: { fanW: 430, n: 3, stepRatio: 0.36, tilt: 6, anchor: "bottom" },
    mark: 40, num: 30, word: 30, words: "t2", stackCount: true, gap: 20,
  },
  {
    key: "Drum",
    label: "Drum — six, symmetric, count scales",
    bet: "The fan's tile count **follows the Recording count**, so 138 fills the card and a Contributor with one Recording gets an honest single card",
    cost: "A card's composition changes with its subject, so two Contributors' cards are not comparable at a glance",
    geo: { fanW: 316, n: 6, stepRatio: 0.163, tilt: 6, anchor: "bottom", scaleWithCount: true },
    mark: 36, num: 32, word: 32, words: "t2", stackCount: true, gap: 20,
  },
]

/**
 * The measured all-names ceiling per column width, from `probe/ticket05/fan-ceiling.tsx`.
 *
 * The keys are the columns the five variants **actually produce**, not round numbers. An
 * earlier table used 560/600/640/680/720 and `ceilingFor` then had no entry at all for
 * Slab's 556px column and answered **0** — a hole in the table that read as a ceiling. Every
 * key here was measured at that exact width, and `ceilingFor` now fails loudly rather than
 * returning a small number for an unmeasured column.
 *
 * Every one of these ceilings is bound by **the same name**, `Konstantinos Efkarpidis`:
 * 23 characters, and the only long name with no parenthetical, so it is measured whole and
 * cannot be given a second line. He is not in the five-Contributor cast and he decides the
 * size on all five variants.
 */
const CEILING: Record<number, number> = { 556: 48, 590: 52, 624: 56, 693: 60, 704: 60, 733: 64 }

/**
 * How far a rotated card's **top corner** swings sideways past its own box.
 *
 * `w * AR * sin(maxTilt)`, and the **full** height — not half of it. The first version used
 * `(w * AR) / 2`, on the reasoning that a card pivots on its bottom edge so only the top half
 * swings. It does not: the pivot is at the bottom-*centre*, so the top-*left* corner travels a
 * distance of `h * sin(θ)` outward, a full height. Halving it understated the swing by 2x,
 * which is how `Fan`'s leftmost card ended up with its ink at **x=12** — 54px inside the 66px
 * Slack crops, so the outer card of the fan was cut off on every share.
 * `preview/verify-fan.tsx` is what found it, and it is why that file exists.
 */
function overhangOf(w: number, cap: number, tilt: number): number {
  const maxTiltDeg = Math.abs(tilt) * ((cap - 1) / 2)
  return w * AR * Math.sin((maxTiltDeg * Math.PI) / 180)
}

/**
 * How far a card's **shadow** reaches past its own box.
 *
 * `shadow()`'s widest term is `0 24px 46px -26px`, so its blur extends 20px — and it travels
 * with the rotation, so the outermost ink on a fanned card is shadow, not the card. A fan that
 * reserves room for the card alone is a fan whose shadow is cropped.
 */
const SHADOW_REACH = 24

/** The width a fan of `cap` tiles at width `w` occupies, **including shadow**. */
function occupiedBy(w: number, cap: number, geo: Geometry): number {
  const span = (cap - 1) * geo.stepRatio * w + w
  return span + 2 * overhangOf(w, cap, geo.tilt) + 2 * SHADOW_REACH
}

/** The vertical band a fan may use, and so the tallest a single card may be. */
const BAND = 630 - 2 * 66

/**
 * **Solve the tile width that makes this fan exactly `geo.fanW` wide.**
 *
 * `occupiedBy` is strictly increasing in `w`, so this bisects. It is not a lookup because
 * the fan's tile count varies — `Drum`'s does, and so does any Contributor's when they have
 * fewer Recordings than the fan holds — and a fan that changes width when its subject does
 * would silently resize the type column and invalidate every measured ceiling above it.
 *
 * Clamped to the band's height, since a single card for a one-Recording Contributor would
 * otherwise be solved to a width that runs off the bottom of the card. Being narrower than
 * target is harmless: the column only gains width, and the type size only goes up.
 */
export function tileWidthFor(who: Who, geo: Geometry): { w: number; cap: number; inset: number } {
  // How many cards the fan holds. `Drum` makes this a function of the Recording count; every
  // other variant fills its fan to the cap and then shrinks the cards to fit the width.
  const cap = geo.scaleWithCount
    ? Math.max(1, Math.min(geo.n, Math.ceil(who.count / 24)))
    : Math.min(geo.n, Math.max(1, who.tiles.length))

  const rise = Math.abs(geo.rise ?? 0) * (cap - 1)
  const maxW = Math.floor((BAND - rise) / AR)

  let lo = 40
  let hi = maxW
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (occupiedBy(mid, cap, geo) < geo.fanW) lo = mid
    else hi = mid
  }
  const w = Math.max(40, Math.min(maxW, Math.round((lo + hi) / 2)))
  return { w, cap, inset: overhangOf(w, cap, geo.tilt) + SHADOW_REACH }
}

/** The measured right column: 1200 - 2*MARGIN - fan - gutter. */
export function columnFor(v: Variant): number {
  return 1200 - MARGIN * 2 - v.geo.fanW - GUTTER
}

/** The largest measured size at or below this variant's column. */
export function ceilingFor(col: number): number {
  const sizes = Object.entries(CEILING).map(([c, s]) => [Number(c), s] as const).sort((a, b) => a[0] - b[0])
  let best = 0
  for (const [c, s] of sizes) if (col >= c) best = s
  return best
}

/**
 * Columns with no measured entry. A ceiling is a measurement, so an unmeasured column has no
 * ceiling — and quietly answering 0 for one is how a card ships with a 1px name.
 */
export function unmeasuredColumns(): string[] {
  return VARIANTS.filter((v) => !Object.keys(CEILING).some((c) => Math.abs(Number(c) - columnFor(v)) <= 8))
    .map((v) => `${v.key}: column ${columnFor(v)}px has no measured ceiling`)
}

/** The name size actually used: the hand-set one if given, else the measured ceiling. */
export function nameSizeFor(v: Variant): number {
  return v.nameSize ?? ceilingFor(columnFor(v))
}

/**
 * Fail loudly on a hand-set `nameSize` that exceeds its column's measured ceiling.
 *
 * Only useful for an **override**; a variant that derives its size cannot trip it. It stays
 * because the override is the one path by which the two numbers could disagree again.
 */
export function assertCeilings(): string[] {
  return VARIANTS.filter((v) => v.nameSize !== undefined && v.nameSize > ceilingFor(columnFor(v))).map(
    (v) => `${v.key}: nameSize ${v.nameSize} exceeds the measured ceiling ${ceilingFor(columnFor(v))} for its ${columnFor(v)}px column`
  )
}

/**
 * One tile. **No `zIndex`** — Satori ignores it, so the fan's order comes from the DOM.
 *
 * `objectFit: cover` on a box of the Posters' own 168:212 ratio, so nothing is cropped and
 * nothing is stretched. `borderRadius: 14` is the Design's own step, not a new radius: a fan
 * of eight cards at a large radius turns into a pile of lozenges.
 */
function Tile({ k, w, rot, left, top, depth }: {
  k: string; w: number; rot: number; left: number; top: number; depth: number
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
        // A surface behind the image, or two crossing cards show through each other.
        background: C.panel,
        display: "flex",
      },
    },
    h("img", { src: b64(k), style: { width: "100%", height: "100%", objectFit: "cover", display: "flex" } })
  )
}

/**
 * The fan, back to front.
 *
 * Emitted **outermost first**, so each later card paints over the one before it and the fan
 * closes toward the right. `transform-origin: bottom center` puts each card's pivot on its own
 * bottom edge, so a shared pivot is only a matter of a shared `bottom` — which is what `step`
 * and `rise` do.
 *
 * **No empty slots, at any count.** Hubert Ryan has one Recording, and the earlier version
 * rendered that as one 160px card inside four pale rectangles, which reads as four images that
 * failed to load. The cards that exist now grow to fill the fan's width instead, so a
 * one-Recording Contributor gets **one Poster shown properly** — which is both honest and the
 * better picture.
 */
function Fan({ who, geo }: { who: Who; geo: Geometry }) {
  const { w, cap, inset } = tileWidthFor(who, geo)
  const step = Math.round(geo.stepRatio * w)
  const hh = Math.round(w * AR)
  const rise = geo.rise ?? 0

  // Vertically centred in the band. A climb eats height at both ends, so the band it starts
  // from is taller by |rise| * (cap - 1), which is what keeps the top card off the margin.
  const span = Math.abs(rise) * (cap - 1)
  const top0 = 66 + Math.max(0, (BAND - (hh + span)) / 2)

  const slots = Array.from({ length: cap }, (_, i) => {
    const t = i - (cap - 1) / 2
    return { k: who.tiles[i], rot: t * geo.tilt, left: i * step, top: top0 + rise * t }
  })


  return h(
    "div",
    { style: { position: "absolute", left: MARGIN + inset, top: 0, width: 1200 - MARGIN * 2, height: 630, display: "flex" } },
    ...slots.map((s2, i) =>
      s2.k
        ? h(Tile, { key: `t${i}`, k: s2.k, w, rot: s2.rot, left: s2.left, top: s2.top, depth: (cap - i) * 2 })
        : null
    )
  )
}

/** The wordmark, copied from `components/site-header.tsx:98-102`. Weight **700**, not 500. */
function Mark({ size }: { size: number }) {
  return h(
    "div",
    {
      style: {
        display: "flex", fontFamily: SANS, fontSize: size, fontWeight: 700,
        letterSpacing: "-0.02em", lineHeight: 1, color: C.t1,
      },
    },
    h("span", { style: { color: C.t1 } }, "rnui"),
    h("span", { style: { color: C.acc } }, ".dev")
  )
}

/**
 * The name, at the size its column allows, as **two blocks when there is an alias**.
 *
 * No `nowrap` anywhere: a clipped name is the one failure this card exists to prevent, and a
 * second line is not a failure. `maxWidth` rather than `width`, so the block is as wide as the
 * text needs and Satori still wraps inside it.
 */
function Name({ who, size, width }: { who: Who; size: number; width: number }) {
  const [main, alias] = splitName(who.name)
  const name = h("div", {
    style: {
      fontFamily: SANS, fontSize: size, lineHeight: 1.03, fontWeight: 500,
      letterSpacing: "-0.024em", color: C.t1, maxWidth: width,
    },
  }, main)
  if (!alias) return name
  // **The alias is set at 0.6 of the name, in `--t2` rather than `--t1`.**
  //
  // The first render put `(Reactiive)` at the same 64px in the same `--t1` as the name, and
  // it competed: the card read as two equal lines of type rather than a person and a handle.
  // A trailing handle is not the name — `Enzo Manuel Mangano` is — so it is demoted twice
  // over, size and colour, and the demotion is what tells a reader which line is the person
  // before they have finished reading either.
  //
  // Being smaller also widens the margin: the alias was measured at the name's size in
  // `fan-ceiling.tsx` and was the second constraint at every column, so 0.6x is slack, not a
  // new risk.
  return h("div", { style: { display: "flex", flexDirection: "column" } },
    name,
    h("div", {
      style: {
        fontFamily: SANS, fontSize: Math.round(size * 0.6), lineHeight: 1.06, fontWeight: 400,
        letterSpacing: "-0.012em", color: C.t2, maxWidth: width,
      },
    }, alias)
  )
}

/**
 * `138 RECORDINGS · 11 CATEGORIES`.
 *
 * **"Recordings", never "animations."** The domain's noun (`CONTEXT.md`, ADR-0008) — and
 * "animations" is the root card's word, wrong there too. Singular for one, which is a real
 * render and not a nicety: Hubert Ryan has exactly one, and "1 Recordings" is visibly
 * machine-made on a real share.
 *
 * The numeral is the site's own counter treatment from `components/hero.tsx:28` — a bold sans
 * numeral in `--t1` beside a mono label in `--t3` — with the numeral in `--acc` so the count
 * is the one coloured thing under the name. `tabular-nums` is unlikely to survive Satori and
 * is not used; a one-to-two digit change is measured not to reflow this column instead.
 *
 * **`stack` puts the two facts on two lines with no leading separator.** The first version put
 * a middot at the start of line two, which reads as a bullet on an empty line — the separator
 * belongs between two facts on one line, and between two lines there is nothing to separate.
 */
function Count({ who, num, word, words, stack, width, noun }: {
  who: Who; num: number; word: number; words: "t2" | "t3"; stack: boolean; width: number
  noun: [string, string]
}) {
  const c = C[words]
  const gap = Math.round(word * 0.42)
  const label = (s: string) => h("span", { style: { fontSize: word, color: c } }, s)
  const numeral = (n: number) =>
    h("span", { style: { fontSize: num, color: C.acc, fontFamily: SANS, fontWeight: 700, letterSpacing: "-0.01em" } }, String(n))

  // Singular for one, which is a real render: Hubert Ryan has exactly one, and
  // "1 ANIMATIONS" is visibly machine-made on a real share.
  const label_ = who.count === 1 ? noun[0] : noun[1]

  // **The category count is gone, at the maintainer's request (2026-10-06).** Nothing else
  // moved: the numeral, the label, the mono step, the tracking, the size and the palette role
  // are all exactly as they were, so the five variants stay comparable to each other and to
  // the renders already approved.
  //
  // Two consequences, both of which are the removal and not further edits:
  //
  // 1. **`stack` is now a no-op.** `Slab` and `Drum` set it to put the two facts on two lines,
  //    and there is one fact left, so both render the single row. The flag is left in place
  //    rather than deleted, because removing it would be a second change and because it is
  //    what those two variants' `cost` lines refer to.
  // 2. **The line is shorter, so it cannot now overflow.** The count was never the binding
  //    constraint on any variant — the name was, in all five — and every ceiling here is
  //    measured from the name. So no size was re-measured and none needed to be.
  const row = h(
    "div",
    { style: { display: "flex", alignItems: "baseline", gap, fontFamily: MONO, letterSpacing: "0.11em", whiteSpace: "nowrap", maxWidth: width } },
    numeral(who.count), label(label_)
  )

  if (!stack) return row
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", fontFamily: MONO, letterSpacing: "0.11em" } },
    row
  )
}

export function render(vkey: string, who: Who) {
  const v = VARIANTS.find((x) => x.key === vkey)!
  const col = columnFor(v)
  return h(
    "div",
    { style: { width: 1200, height: 630, background: C.canvas, display: "flex", position: "relative", overflow: "hidden" } },
    h(Fan, { who, geo: v.geo }),
    h(
      "div",
      {
        style: {
          position: "absolute", right: MARGIN, top: 66, bottom: 66, width: col,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: v.gap,
        },
      },
      h(Mark, { size: v.mark }),
      h(Name, { who, size: nameSizeFor(v), width: col }),
      h(Count, { who, num: v.num, word: v.word, words: v.words, stack: v.stackCount, width: col, noun: v.noun ?? ["RECORDING", "RECORDINGS"] })
    )
  )
}
