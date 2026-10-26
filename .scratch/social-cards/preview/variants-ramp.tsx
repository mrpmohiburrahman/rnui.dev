// PROTOTYPE — ticket 04, round 3. Throwaway; nothing ships.
//
// The maintainer chose **Ramp-dark** and asked for more variants of it: *"let's use
// ramp-dark, but I want more variant, use https://impeccable.style/ make more
// beautiful and asthetic variants."*
//
// ## What impeccable.style actually says about round 2
//
// It is a detector with **61 source rules and 6 design-review patterns**. Its CLI
// (`npx impeccable detect`) found `overused-font` in `app/globals.css` — Space
// Grotesk is on its overused list — but **reports nothing on this file**, because
// it reads `className` and CSS while a Satori card is `createElement` with inline
// style objects and cannot use either. So the rule catalogue was applied **by
// hand**, and it is not kind to round 2. These are genuine hits:
//
//   | rule | what round 2 did |
//   |---|---|
//   | `radial-gradient-background-halo` | a bright halo on a dark page — "a familiar AI background effect… remove the glow when it has no role in the design" |
//   | `soft-spotlight-behind-content` | and the halo sat *behind the content* specifically |
//   | `dark-mode-with-glowing-accents` | `--media-glow` on all 22 tiles — "a wall of neon" |
//   | `hairline-border-with-wide-shadow` | `glow()` is literally `0 0 0 1px ring` **plus** a 60px blur: the rule's own example |
//   | `hero-metric-layout` | `Stats` is "a huge number with a small label and supporting stats… a familiar landing-page template" |
//   | `ai-color-palette` | "bright cyan on dark backgrounds are familiar AI defaults" — `--acc #6FE3CC` is exactly that |
//   | `cream-beige-palette` | light `--canvas #F4F4F1` is cream |
//   | `extreme-border-radius-on-cards` | radius-28 plates and `999px` pills |
//   | `badge-above-the-main-headline` | the wordmark sits above the claim like a badge |
//   | `images-hidden-under-overlays` | the centre plate covers tiles to buy legibility |
//   | `monotonous-spacing` | one gap value everywhere |
//
// So the washes go, and that is the biggest change: a radial halo behind a
// wordmark is decorative and has no role, which is the rule's whole complaint.
//
// ## The one tension worth naming rather than hiding
//
// `ai-color-palette` and `cream-beige-palette` both indict **this Design's own
// tokens**. The map binds every card to `app/globals.css`, so a card cannot adopt
// a different accent to satisfy the rule. What the rule actually asks for is
// restraint — "reduce the glow so useful information stands out" — and that *is*
// available without touching a token: **`--media-glow` is the tile's own
// treatment, and a card may use it once instead of twenty-two times.** Every
// variant here does that. The glow is an accent, not a texture.
//
// ## The six
//
// All keep Ramp's diagonal energy and the wordmark as the hero, and all drop the
// wash:
//
//   1. **Ramp**      — the chosen design, cleaned. Tiles abut into a band, glow on three.
//   2. **Ribbon**    — one continuous diagonal ribbon off two edges; the mark sits in its notch.
//   3. **Aperture**  — a diagonal funnel narrowing *toward* the wordmark, so the eye arrives.
//   4. **Echo**      — one Poster repeated down the diagonal at falling scale. Repetition, not a diagonal, is what implies animation.
//   5. **Stack**     — the cascade as a strict edge-to-edge column; the left is pure typography.
//   6. **Ladder**    — the diagonal as rungs of a ladder, each rung a Category's worth of tiles.
//
// The type changes too, because `hero-metric-layout` was right: **the 298/24/18
// triple is gone from every variant.** Where the counts appear they are one inline
// fact in the strip, not a metric row. The claim is set in Space Grotesk **300** —
// a weight the Design already ships and nothing on the site uses at display size —
// which is what "vary size and weight before adding a second family" asks for.

import { readFileSync } from "node:fs"
import { createElement as h, type ReactNode } from "react"

export type Mode = "dark" | "light"

const C = {
  dark: {
    canvas: "#0A0B0D", panel: "#101216", rail: "#0C0D11",
    t1: "#F1F2F4", t2: "#B2B8C2", t3: "#8E949F",
    acc: "#6FE3CC", line: "rgba(255,255,255,0.11)", line2: "rgba(255,255,255,0.22)",
    e0: "0 0 0 1px rgba(255,255,255,0.07)",
  },
  light: {
    canvas: "#F4F4F1", panel: "#FFFFFF", rail: "#EFEFEB",
    t1: "#14161A", t2: "#4F545C", t3: "#666B74",
    acc: "#0E7062", line: "rgba(16,18,22,0.13)", line2: "rgba(16,18,22,0.24)",
    e0: "0 0 0 1px rgba(16,18,22,0.10)",
  },
} as const

export type Pal = (typeof C)[Mode]

export const STATS = { recordings: 298, contributors: 24, categories: 18 }
export const CLAIM = "A community-made catalogue of React Native interfaces."

const b64 = (p: string) =>
  `data:image/jpeg;base64,${readFileSync(new URL(p, import.meta.url).pathname).toString("base64")}`

type Tile = { key: string; hue: number; caption: string; contributor: string }
const TILES: Tile[] = JSON.parse(
  readFileSync(new URL("./grid/small/index.json", import.meta.url).pathname, "utf8")
)
const small = (key: string) => b64(`./grid/small/${key}.jpg`)

/**
 * The tile, with `glow` off by default.
 *
 * `--media-glow` is `0 0 0 1px hue-ring, 0 26px 60px -18px hue-blur` — and
 * `hairline-border-with-wide-shadow` is precisely the finding that a thin border
 * *and* a broad shadow define the same surface twice. So a tile takes **either** a
 * flat `--e0` hairline **or** the full glow, and the choice is a decision per tile
 * rather than a default. Three tiles per card carry the glow; the rest are flat.
 */
function Tile_({ t, w, glow, radius = 10 }: { t: Tile; w: number; glow?: boolean; radius?: number }) {
  // Spread conditionally rather than passing `undefined`. Satori reads a style
  // object's values without a guard and throws `Cannot read properties of
  // undefined (reading 'trim')` on the first undefined it meets — which cost a
  // whole render batch before it was spotted.
  const edge = glow
    ? { boxShadow: `0 0 0 1px hsla(${t.hue},60%,62%,0.30), 0 22px 54px -20px hsla(${t.hue},70%,58%,0.55)` }
    : { boxShadow: "0 0 0 1px rgba(255,255,255,0.09)" }
  return h("img", {
    src: small(t.key),
    style: {
      width: w,
      height: Math.round((w * 116) / 92),
      objectFit: "cover",
      // `radius` is 10px, not round 2's 28. `extreme-border-radius-on-cards` is
      // right that a big curve squeezes the contents and makes every element look
      // alike; at tile scale 10 reads as a photograph and 28 reads as a chip.
      borderRadius: radius,
      ...edge,
    },
  })
}

/**
 * The tile field, **clipped to its own half of the card**.
 *
 * Five of the six first drafts put tiles straight through the text: Ramp's band
 * reached x=380, Ribbon's ran across three lines of the claim, and the counts strip
 * — which measures **~750px at 26px mono**, not the 620 the column allowed —
 * ended underneath Ladder's third rung. All of it is one bug, and it is Satori's
 * oldest: absolutely-positioned siblings draw in source order and nothing stops them
 * colliding (ticket 06). Arithmetic about where a tile *should* end is not enough,
 * because the thing being measured — a mono string's width — is the easy part to get
 * wrong.
 *
 * So the field is a box at `left: FIELD_X` with `overflow: hidden`, and a tile that
 * strays into the text column is **clipped rather than drawn over it**. Clearance
 * becomes structural instead of calculated — with the 20px caveat above, which is
 * why `FIELD_X` carries the shadow's reach in its arithmetic rather than assuming
 * the clip is total.
 */
const FIELD_X = 644

/**
 * `FIELD_X` is 644 and not 620 because **a blurred `box-shadow` escapes
 * `overflow: hidden` in Satori** — measured, not assumed:
 * `probe/shadow-clip-probe.tsx` puts a glowing child flush against a clipped box's
 * left edge and finds its halo reaching **20px outside the clip**, while a flat 1px
 * hairline shadow reaches 0px. The child's *background* is clipped either way
 * (`probe/clip-probe.tsx`).
 *
 * So the clip alone is not a safety argument. The arithmetic that is:
 *
 *   text column ends at 76 + 500 = **576**
 *   glow can reach back 20px from the clip edge, so it starts at **624**
 *   clearance under the type: 624 - 576 = **48px**
 *
 * At the original FIELD_X of 620 the glow started at 600 and the clearance was 24px —
 * survivable, but 48px is a number rather than a hope, and the field only loses 24px
 * of width.
 */
const GLOW_ESCAPE = 20
const CLEARANCE = FIELD_X - GLOW_ESCAPE - 576

function Field({ children, style }: { children: ReactNode; style?: Record<string, unknown> }) {
  return h(
    "div",
    {
      style: {
        position: "absolute", left: FIELD_X, top: 0, bottom: 0, right: 0,
        overflow: "hidden", display: "flex", ...style,
      },
    },
    children
  )
}

/** The text column every variant shares: x 76 .. 576, clear of FIELD_X by 44px. */
function TextCol({ children }: { children: ReactNode }) {
  return h(
    "div",
    {
      style: {
        position: "absolute", left: 76, top: 0, bottom: 0, width: 500,
        display: "flex", flexDirection: "column", justifyContent: "center",
      },
    },
    ...children
  )
}

function Mark({ size, pal }: { size: number; pal: Pal }) {
  return h(
    "div",
    {
      style: {
        display: "flex", fontFamily: "Space Grotesk", fontSize: size, fontWeight: 700,
        letterSpacing: "-0.022em", lineHeight: 1,
      },
    },
    h("span", { style: { color: pal.t1 } }, "rnui"),
    h("span", { style: { color: pal.acc } }, ".dev")
  )
}

/**
 * The claim, in Space Grotesk **300** at display size.
 *
 * `flat-type-hierarchy` and `single-font-for-everything` both point the same way:
 * vary size and weight before reaching for a second family. Space Grotesk is a
 * variable 300–700 face and the site uses 400/500/700, so 300 at 62px is a weight
 * the Design already ships and nothing on the site reaches for. It is also the
 * only thing that makes a long sentence read as one confident line instead of a
 * paragraph.
 */
function Claim({ pal, size = 62, width = 620 }: { pal: Pal; size?: number; width?: number }) {
  return h(
    "div",
    {
      style: {
        fontFamily: "Space Grotesk", fontSize: size, lineHeight: 1.16, fontWeight: 300,
        letterSpacing: "-0.015em", color: pal.t1, width,
        // Fixed, so Satori's lack of line-clamp cannot change the composition.
        height: Math.round(size * 1.16 * 3), overflow: "hidden",
      },
    },
    CLAIM
  )
}

/**
 * The counts, as **one inline fact** rather than a metric row.
 *
 * `hero-metric-layout` ("a huge number with a small label and supporting stats is a
 * familiar landing-page template") was a fair hit on round 2's `Stats`. So there is
 * no number at display size anywhere in this round, and the counts live in a strip
 * at the label step — set in one colour rather than two, which is also
 * `label-above-a-heading` avoided by never separating them.
 */
/**
 * The counts, on **two lines at 22px**, and the size is measured rather than chosen.
 *
 * "298 RECORDINGS · 24 CONTRIBUTORS · 18 CATEGORIES" is 49 glyphs and JetBrains Mono
 * advances 0.6em, so it measures **668px at 22px** — wider than the 500px text column,
 * so it ran under the tiles in Aperture, Echo, Stack and Ladder even after the tile
 * field was clipped. (Clipping protects the *tiles*; it cannot help when the thing
 * overflowing is the text.) Split across two lines the widest is
 * "298 RECORDINGS · 24 CONTRIBUTORS" at **436px**, which fits with 64px to spare.
 */
function Counts({ pal, size = 22 }: { pal: Pal; size?: number }) {
  const row = (label: string, key: string) =>
    h(
      "div",
      { key, style: { display: "flex", alignItems: "baseline", gap: 12, fontFamily: "JetBrains Mono", fontSize: size, letterSpacing: "0.1em", whiteSpace: "nowrap" } },
      h("span", { style: { color: pal.t1 } }, label.split(" · ")[0]),
      h("span", { style: { color: pal.acc, opacity: 0.6 } }, "·"),
      h("span", { style: { color: pal.t3 } }, label.split(" · ")[1])
    )
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 8, width: 500 } },
    row("298 RECORDINGS · 24 CONTRIBUTORS", "a"),
    row("18 CATEGORIES · 290 DISTINCT NAMES", "b")
  )
}

/** The attribution line — three real captions, because naming things beats counting. */
function Names({ pal, size = 21 }: { pal: Pal; size?: number }) {
  // Two captions, not three, and each in a fixed-width box. The first version put
  // three in an unconstrained flex row and `Ripple Effect With React Native Skia`
  // (36 chars) drew straight through `Animated State Loading Circle` — the same
  // missing-wrap Satori problem, this time between two siblings rather than between
  // a sibling and a tile.
  // Two *short* real captions, chosen for width: "Accordion" (117px) and
  // "Animated Circle" (195px) rather than the two longest, which truncated to
  // "Ripple Effect With Rea…". Truncation is allowed for a Contributor's name on a
  // Recording card and pointless here, where any caption will do.
  const names = ["Accordion", "Animated Circle"]
  return h(
    "div",
    { style: { display: "flex", gap: 12, fontFamily: "JetBrains Mono", fontSize: size, color: pal.t3, width: 500, height: 28, overflow: "hidden" } },
    ...names.flatMap((n, i) => [
      i > 0 ? h("span", { key: `d${i}`, style: { color: pal.t2 } }, "/") : null,
      h("span", { key: n, style: { maxWidth: 244, whiteSpace: "nowrap" } }, n),
    ])
  )
}

// -- 1. Ramp, cleaned ---------------------------------------------------------
// The chosen design with the slop taken out. Round 2 scattered 28 tiles on a
// diagonal with a 132px step, which read as confetti: every tile had the full
// glow, so the "diagonal" was really just noise. Here the tiles **abut** into a
// band — a real diagonal edge rather than a field of separate objects — and only
// three carry the glow.

function RampClean({ pal }: { pal: Pal }) {
  const W = 132
  const cols = 6
  const rows = 4
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      Field,
      { style: { alignItems: "flex-start", justifyContent: "flex-start" } },
      // The band. Stepping both axes is what makes an edge read as a diagonal;
      // stepping only one makes a staircase. `rotate(-8deg)` is kept from round 2
      // because the gesture is the point, but the band now lives inside the field.
      h(
        "div",
        { style: { position: "absolute", right: -70, top: -30, display: "flex", flexDirection: "column", transform: "rotate(-8deg)" } },
        ...Array.from({ length: rows }, (_, r) =>
          h(
            "div",
            {
              key: r,
              style: {
                display: "flex",
                // `monotonous-spacing`: tiles inside a row abut exactly, and the gap
                // *between* rows is a different, larger number. Related things
                // close, separate things apart.
                marginBottom: 10,
                marginLeft: r * 74,
              },
            },
            ...Array.from({ length: cols }, (_, c) => {
              const i = r * cols + c
              return h(Tile_, { key: i, t: TILES[i % TILES.length], w: W, glow: i === 1 || i === 8 || i === 15 })
            })
          )
        )
      )
    ),
    h(
      TextCol,
      {},
      h(Mark, { size: 92, pal }),
      h("div", { style: { height: 40 } }),
      h(Claim, { pal, size: 54, width: 480 }),
      h("div", { style: { height: 30 } }),
      h(Names, { pal }),
      h("div", { style: { height: 16 } }),
      h(Counts, { pal })
    )
  )
}

// -- 2. Ribbon ----------------------------------------------------------------
// One continuous diagonal ribbon off two edges, so the card has a single gesture
// rather than a field. The wordmark sits in the notch the ribbon leaves.

function Ribbon({ pal }: { pal: Pal }) {
  // **Placed along an explicit diagonal, not stacked and rotated.**
  //
  // The first two attempts stacked 22 tiles vertically inside a `rotate(-19deg)`
  // wrapper and let the rotation carry them across the card. That gives no control
  // over how many are actually inside the 630px: at 118px only about four were
  // visible, at 86px about six — and the catalogue's *darkest* Posters (luma 18,
  // 21, 25) came round first, so the ribbon rendered as a diagonal line of faint
  // empty outlines. A ribbon has to be positioned, not rotated into place.
  //
  // Nine tiles on an explicit line from the field's lower-left to its upper-right,
  // each overlapping the next by a third so the band is continuous rather than a
  // dotted line, and stepped through the tile list by a stride that skips the
  // darkest tiles.
  const n = 9
  const W = 132
  const BRIGHT = TILES.filter((t) => t.hue !== undefined)
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      Field,
      {},
      ...Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1)
        const step = Math.round(96 - t * 34)
        return h(
          "div",
          {
            key: i,
            style: {
              position: "absolute",
              left: Math.round(20 + t * 300),
              top: Math.round(470 - t * 400),
              display: "flex",
            },
          },
          h(Tile_, { t: BRIGHT[(i * 3 + 4) % BRIGHT.length], w: step, glow: i === 2 || i === 5 || i === 8 })
        )
      })
    ),
    h(
      TextCol,
      {},
      h(Mark, { size: 88, pal }),
      h("div", { style: { height: 38 } }),
      h(Claim, { pal, size: 50, width: 470 }),
      h("div", { style: { height: 30 } }),
      h(Counts, { pal })
    )
  )
}

// -- 3. Aperture --------------------------------------------------------------
// The diagonal reversed: tiles funnel *inward* toward the wordmark instead of
// running away from it, so the composition has a destination rather than an escape.
// Sizes fall from 150 to 74 along the diagonal.

function Aperture({ pal }: { pal: Pal }) {
  const n = 11
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      Field,
      {},
      ...Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1)
        const w = Math.round(150 - t * 76)
        // Measured inside the field, not in card coordinates: the field starts at
        // FIELD_X, so x = 16 keeps the funnel's mouth off the text column.
        const x = 16 + t * 400
        const y = 430 - t * 360 + Math.sin(i * 1.1) * 24
        return h(
          "div",
          { key: i, style: { position: "absolute", left: Math.round(x), top: Math.round(y), display: "flex" } },
          h(Tile_, { t: TILES[(i * 3) % TILES.length], w, glow: i % 5 === 2 })
        )
      })
    ),
    h(
      TextCol,
      {},
      h(Mark, { size: 96, pal }),
      h("div", { style: { height: 40 } }),
      h(Claim, { pal, size: 52, width: 470 }),
      h("div", { style: { height: 30 } }),
      h(Counts, { pal })
    )
  )
}

// -- 4. Echo ------------------------------------------------------------------
// ONE Poster repeated down the diagonal at falling scale.
//
// Round 2's Ramp implied motion with a diagonal, which is a graphic device saying
// nothing about time. Echo says it with **repetition** — the way an animation
// actually looks — and it costs one image instead of twenty-eight, which matters
// because the PNG is the thing a scraper downloads.

function Echo({ pal }: { pal: Pal }) {
  const n = 9
  const t0 = TILES[7]
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      Field,
      {},
      ...Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1)
        const w = Math.round(206 - t * 128)
        return h(
          "div",
          {
            key: i,
            style: {
              position: "absolute",
              left: Math.round(14 + t * 420),
              top: Math.round(448 - t * 372),
              display: "flex",
              opacity: 0.34 + t * 0.66,
            },
          },
          h(Tile_, { t: t0, w, glow: i === n - 1 })
        )
      })
    ),
    h(
      TextCol,
      {},
      h(Mark, { size: 96, pal }),
      h("div", { style: { height: 40 } }),
      h(Claim, { pal, size: 52, width: 470 }),
      h("div", { style: { height: 30 } }),
      h(Counts, { pal })
    )
  )
}

// -- 5. Stack -----------------------------------------------------------------
// The cascade as a strict edge-to-edge column: one uninterrupted vertical edge
// where the tiles begin. The left is pure typography with nothing on it, which is
// the restraint round 2 lacked — it filled both halves and neither read.

function Stack({ pal }: { pal: Pal }) {
  const W = 140
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      Field,
      { style: { flexWrap: "wrap", gap: 8, alignContent: "flex-start", paddingLeft: 0 } },
      ...Array.from({ length: 16 }, (_, i) =>
        h(Tile_, { key: i, t: TILES[i % TILES.length], w: W, glow: i === 0 || i === 7 })
      )
    ),
    h(
      TextCol,
      {},
      h(Mark, { size: 100, pal }),
      h("div", { style: { height: 44 } }),
      h(Claim, { pal, size: 56, width: 480 }),
      h("div", { style: { height: 34 } }),
      h(Names, { pal }),
      h("div", { style: { height: 16 } }),
      h(Counts, { pal })
    )
  )
}

// -- 6. Ladder ----------------------------------------------------------------
// The diagonal as **rungs**: three horizontal bands, each offset further right and
// lower, with a gap between them far larger than the gap inside them — the same
// `monotonous-spacing` fix as the cleaned Ramp at a different rhythm.

function Ladder({ pal }: { pal: Pal }) {
  const W = 116
  // The three rungs, all fully on the card. The first attempt put rung 3 at y=482
  // with 146px tiles, so it ran 100px off the bottom and the ladder had no base —
  // it read as two rungs and a fragment. A rung that is half off the card is not a
  // rung, it is a crop, and only the top-right bleed is a deliberate one.
  const rungs = [
    { off: 6, y: 44, n: 5 },
    { off: 88, y: 244, n: 4 },
    { off: 170, y: 444, n: 3 },
  ]
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      Field,
      {},
      ...rungs.flatMap((r, ri) =>
        Array.from({ length: r.n }, (_, c) => {
          const i = ri * 5 + c
          return h(
            "div",
            { key: i, style: { position: "absolute", left: r.off + c * (W + 14), top: r.y, display: "flex" } },
            h(Tile_, { t: TILES[(i * 5) % TILES.length], w: W, glow: i === 0 || i === 6 })
          )
        })
      )
    ),
    h(
      TextCol,
      {},
      h(Mark, { size: 98, pal }),
      h("div", { style: { height: 42 } }),
      h(Claim, { pal, size: 54, width: 480 }),
      h("div", { style: { height: 32 } }),
      h(Counts, { pal })
    )
  )
}

export const VARIANTS = [
  { key: "Ramp", name: "Ramp (cleaned)", bet: "The chosen design with the confetti taken out — tiles abut into a band, glow on three", fn: (p: Pal) => RampClean({ pal: p }) },
  { key: "Ribbon", name: "Ribbon", bet: "One continuous diagonal off two edges. A single gesture, not a field", fn: (p: Pal) => Ribbon({ pal: p }) },
  { key: "Aperture", name: "Aperture", bet: "The diagonal reversed — tiles funnel inward toward the name", fn: (p: Pal) => Aperture({ pal: p }) },
  { key: "Echo", name: "Echo", bet: "One Poster repeated at falling scale. Repetition implies motion better than a diagonal", fn: (p: Pal) => Echo({ pal: p }) },
  { key: "Stack", name: "Stack", bet: "A strict edge-to-edge column; the left half is pure typography", fn: (p: Pal) => Stack({ pal: p }) },
  { key: "Ladder", name: "Ladder", bet: "Three offset rungs with a big gap between them and a small gap inside", fn: (p: Pal) => Ladder({ pal: p }) },
] as const

export type VariantKey = (typeof VARIANTS)[number]["key"]

export function render(variant: VariantKey, mode: Mode) {
  return VARIANTS.find((v) => v.key === variant)!.fn(C[mode])
}
