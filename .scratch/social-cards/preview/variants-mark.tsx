// PROTOTYPE — ticket 04, round 2. Throwaway; nothing ships.
//
// The maintainer's verdict on round 1: *"I like the mark-dark where it only shows
// the site name, but it's really plain. It's no fun. You should add some assets or
// maybe make some variation of this same design… Don't make it plain. User should
// be able to see what the site is about. It should delight the eyes."*
//
// So: **the wordmark stays the hero in all six**, and each one adds a different way
// of showing what the catalogue actually is. They differ in the *device*, not the
// palette — six arrangements of the same few parts.
//
//   | | Name       | The added device                                  |
//   |---|------------|---------------------------------------------------|
//   | 1 | **Halo**   | 21 real Posters scattered in an ellipse, each rotated, each lit by its own `--media-glow` at its own `hue` |
//   | 2 | **Deck**   | 5 Posters **uncropped** in device frames on a shelf, bleeding off the bottom |
//   | 3 | **Marquee**| a credit-roll line of 11 real Recording captions beneath the mark |
//   | 4 | **Ramp**   | a diagonal cascade of tiles running off the right edge — the card implies motion |
//   | 5 | **Orbit**  | 16 tiles on an ellipse *around* the mark, so the name sits in the middle of the catalogue |
//   | 6 | **Bloom**  | a four-hue radial bloom behind the mark with three large tiles in front of it |
//
// Three devices this round needed and ticket 02 never tested, because every card
// so far has been axis-aligned rectangles on a flat canvas. All three are measured
// by RGBA-diffing against the element-free render (`probe/ticket04/device-probe.ts`):
//
//   radial-gradient      renders (218k px)
//   transform: rotate    renders (181k px, both signs)
//   border-radius: 50%   renders (213k px)
//   conic-gradient       **THROWS** — "Failed to parse declaration" — so no variant uses it
//
// One asset deliberately not used: `public/logo.png`. It is a red-and-white
// paintbrush and the Design's accent is green (`--acc #6FE3CC`), so putting it on a
// card would break the palette the rest of this map is bound to. Worth the
// maintainer's knowing rather than silently omitting.

import { createElement as h, type ReactNode } from "react"
import { readFileSync } from "node:fs"

import { MONO, SANS, type_ } from "./tokens"

export type Mode = "dark" | "light"

const C = {
  dark: {
    canvas: "#0A0B0D", panel: "#101216",
    t1: "#F1F2F4", t2: "#B2B8C2", t3: "#8E949F",
    acc: "#6FE3CC", line: "rgba(255,255,255,0.11)", line2: "rgba(255,255,255,0.22)",
  },
  light: {
    canvas: "#F4F4F1", panel: "#FFFFFF",
    t1: "#14161A", t2: "#4F545C", t3: "#666B74",
    acc: "#0E7062", line: "rgba(16,18,22,0.13)", line2: "rgba(16,18,22,0.24)",
  },
} as const

export const STATS = { recordings: 298, contributors: 24, categories: 18 }
export const CLAIM = "A community-made catalogue of React Native interfaces."

type Pal = (typeof C)[Mode] & { line2: string }

// -- Assets ------------------------------------------------------------------

const b64 = (p: string) =>
  `data:image/jpeg;base64,${readFileSync(new URL(p, import.meta.url).pathname).toString("base64")}`

/** The 22 small tiles, chosen by greedy farthest-point on the hue circle. */
type Tile = { key: string; hue: number }
const SMALL: Tile[] = JSON.parse(
  readFileSync(new URL("./grid/small/index.json", import.meta.url).pathname, "utf8")
).map((r: any) => ({ key: r.key, hue: r.hue }))

/** The five true-ratio Posters, for the uncropped devices. */
const DEVICES: { key: string; hue: number; aspect: number }[] = [
  { key: "snake", hue: 356, aspect: 0.477 },
  { key: "fluid", hue: 167, aspect: 0.4721 },
  { key: "ripple", hue: 25, aspect: 0.605 },
  { key: "land", hue: 210, aspect: 1.7778 },
  { key: "morphingLoader", hue: 163, aspect: 0.4633 },
]

const smallTile = (key: string) => b64(`./grid/small/${key}.jpg`)
const bigTile = (key: string) => b64(`./grid/${key}.jpg`)
const poster = (key: string) => b64(`./renditions/${key}-tall-h900.jpg`)

// -- The parts ----------------------------------------------------------------

function Mark({ size, pal }: { size: number; pal: Pal }) {
  return h(
    "div",
    {
      style: {
        display: "flex", fontFamily: SANS, fontSize: size, fontWeight: 700,
        letterSpacing: "-0.02em", lineHeight: 1.05,
      },
    },
    h("span", { style: { color: pal.t1 } }, "rnui"),
    h("span", { style: { color: pal.acc } }, ".dev")
  )
}

/** `--media-glow` at a Recording's own hue — the grid tile's own treatment. */
const glow = (hue: number, strength = 1) =>
  `0 0 0 1px hsla(${hue},60%,62%,${0.26 * strength}), 0 26px 60px -18px hsla(${hue},70%,58%,${0.5 * strength})`

/** A soft radial wash — measured as rendering, see the header. */
function wash(hue: number, size: number, alpha: number, x: number, y: number): ReactNode {
  return h("div", {
    style: {
      position: "absolute", left: x, top: y, width: size, height: size,
      borderRadius: size / 2,
      background: `radial-gradient(circle, hsla(${hue},72%,58%,${alpha}) 0%, hsla(${hue},72%,58%,${alpha * 0.35}) 38%, hsla(${hue},72%,58%,0) 70%)`,
    },
  })
}

/** One scattered small Poster. */
function Chip({ t, size = 92, rotate = 0, opacity = 1 }: { t: Tile; size?: number; rotate?: number; opacity?: number }) {
  return h("img", {
    src: smallTile(t.key),
    style: {
      width: size, height: Math.round((size * 116) / 92), objectFit: "cover",
      borderRadius: 10, boxShadow: glow(t.hue, 0.8), transform: `rotate(${rotate}deg)`, opacity,
    },
  })
}

/**
 * The centre plate: mark + counts inside **one opaque object**.
 *
 * The first attempts put the mark on a plate and the counts *floating beneath it*,
 * and the tile ring drew straight through the counts in both Halo and Orbit — the
 * ellipse's hole is only ~700px wide at the strip's y, and the strip was ~700px
 * wide, so it was clipped by tiles on both sides. Putting the counts *inside* the
 * plate removes the class of bug: there is no text over the ring at all.
 */
function CentrePlate({ pal, markSize, children, wide }: { pal: Pal; markSize: number; children?: ReactNode; wide?: boolean }) {
  return h(
    "div",
    {
      style: {
        position: "relative", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: markSize > 100 ? 30 : 22,
        padding: wide ? "40px 76px" : "34px 60px",
        borderRadius: 28,
        background: pal.canvas,
      },
    },
    h(Mark, { size: markSize, pal }),
    children
  )
}

/** A one-line metadata strip in the site's mono, at the platform floor. */
/**
 * `tone` exists because of a measured failure, not for variety.
 *
 * `--t3` on `--canvas` is 6.46:1 in dark and 4.86:1 in light — both fine on the
 * flat canvas. But a Strip laid directly over a radial **wash** is not on the flat
 * canvas: the wash lifts the backdrop on dark and drops it on light, and `--t3`
 * measured **4.80:1 dark and 4.44:1 light** — under AA in light mode. Every Strip
 * that sits on a wash therefore takes `tone: "t2"`, which measures ~6.6 / ~6.0.
 * One of the two checks in the first version of `audit-mark.ts` found this; the
 * other found nothing real and was dropped.
 */
function Strip({ items, pal, size = 30, tone = "t3" }: { items: string[]; pal: Pal; size?: number; tone?: "t2" | "t3" }) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 18, fontFamily: MONO, fontSize: size, letterSpacing: "0.06em", color: pal[tone] } },
    ...items.flatMap((t, i) => [
      i > 0 ? h("span", { key: `d${i}`, style: { color: pal.acc, opacity: 0.55 } }, "/") : null,
      h("span", { key: t }, t),
    ])
  )
}

/** The counts, as the site's hero sets them. */
function Stats({ pal, size = 40 }: { pal: Pal; size?: number }) {
  return h(
    "div",
    { style: { display: "flex", gap: 44 } },
    ...(
      [
        [String(STATS.recordings), "RECORDINGS"],
        [String(STATS.contributors), "CONTRIBUTORS"],
        [String(STATS.categories), "CATEGORIES"],
      ] as [string, string][]
    ).map(([n, label]) =>
      h(
        "div",
        { key: label, style: { display: "flex", flexDirection: "column", gap: 5 } },
        h("div", { style: { fontFamily: SANS, fontSize: size, lineHeight: 1.1, fontWeight: 500, color: pal.t1, fontVariantNumeric: "tabular-nums" } }, n),
        h("div", { style: { fontFamily: MONO, fontSize: 19, lineHeight: 1.2, letterSpacing: "0.14em", color: pal.t3 } }, label)
      )
    )
  )
}

// -- 1. Halo ------------------------------------------------------------------
// The mark centred, a wide ellipse of 21 real Posters around it, each rotated a
// little and lit by its own hue. The bet: a name ringed by the things it names.

function Halo({ pal }: { pal: Pal }) {
  const CX = 600
  const CY = 300
  // The ring is wider and flatter than the first attempt (470x232). At 232 the
  // lower arc passed *through* the metadata strip, and because Satori has no
  // sibling-overlap protection — ticket 06's finding — the tiles simply drew over
  // the text. Widening RY pushes the arc clear of the centre column.
  const RX = 492
  const RY = 272
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: pal.canvas, position: "relative", overflow: "hidden" } },
    wash(175, 900, 0.16, CX - 450, CY - 450),
    ...Array.from({ length: 21 }, (_, i) => {
      // An ellipse, sampled evenly in angle. The tiles nearest the horizontal
      // extremes are drawn first so the ones nearest the mark overlap them,
      // which reads as depth rather than as a ring of stickers.
      const a = (i / 21) * Math.PI * 2 + 0.22
      const depth = (Math.sin(a) + 1) / 2 // 0 = far, 1 = near
      const size = 62 + Math.round(depth * 34)
      const x = CX + Math.cos(a) * RX - size / 2
      const y = CY + Math.sin(a) * RY - (size * 116) / 92 / 2
      const t = SMALL[i % SMALL.length]
      return h("div", { key: i, style: { position: "absolute", left: Math.round(x), top: Math.round(y), display: "flex" } },
        h(Chip, { t, size, rotate: Math.round(Math.cos(a) * 13), opacity: 0.62 + depth * 0.38 })
      )
    }),
    // The mark on top, on its own soft plate so no tile can touch it.
    h(
      "div",
      { style: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 } },
      // A **solid** plate, not a faded one. The first attempt used
      // `radial-gradient(ellipse, canvas 0%, canvas 66%, transparent 100%)` and
      // Satori rendered it as a grey lozenge with a visible rim — it read as a
      // button, which is the opposite of the intent. `radial-gradient` works (see
      // device-probe) but it does not produce a soft alpha falloff at this size, so
      // a plate that must not show an edge has to be a flat fill.
      h(CentrePlate, { pal, markSize: 108, wide: true },
        h(Strip, { items: ["298 Recordings", "18 Categories", "24 Contributors"], pal, size: 26 })
      )
    )
  )
}

// -- 2. Deck ------------------------------------------------------------------
// The mark top-left at 108px, and five Posters **uncropped** in device frames on a
// shelf, bleeding off the bottom edge. The bet: each one is a real running demo,
// and the frame is the proof. Ticket 06's rule holds — never cropped — and the
// frame follows `aspect`, so the 1.7778 landscape gets a wide frame.

function Deck({ pal }: { pal: Pal }) {
  // A fixed *width* per device, and the height derived from `aspect`, rather than
  // a fixed height. The first attempt fixed the height at 470 and asked for five
  // devices beside a 500px text column: the four portrait ones wanted 216px each
  // and the 1.7778 landscape wanted 835, so only three and a half were on the card
  // and the metadata strip ran underneath them.
  //
  // Bottom-aligning and letting the height fall out of the aspect is what makes the
  // landscape honest rather than broken — it becomes a 200x113 letterbox sitting on
  // the same shelf as four phones, which is exactly what a 1.7778 Poster *is*.
  const DW = 200
  const GAP = 40
  const total = DEVICES.length * DW + (DEVICES.length - 1) * GAP
  const x0 = (1200 - total) / 2

  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    wash(175, 900, 0.15, -220, -300),
    wash(273, 700, 0.11, 700, -240),
    // The shelf. `bottom: -70` so the frames are cropped by the card edge rather
    // than by an `overflow: hidden` on a parent, which would clip their glow.
    h(
      "div",
      { style: { position: "absolute", left: 0, right: 0, bottom: -70, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: GAP } },
      ...DEVICES.map((d, i) =>
        h("img", {
          key: d.key,
          src: poster(d.key),
          style: {
            width: DW,
            height: Math.round(DW / d.aspect),
            objectFit: "cover",
            borderRadius: 14,
            boxShadow: glow(d.hue, 1),
            // Staggered lift, so the shelf has a rhythm rather than a fence.
            marginBottom: [0, 40, 14, 52, 24][i],
          },
        })
      )
    ),
    h(
      "div",
      { style: { position: "absolute", left: 72, top: 66, display: "flex", flexDirection: "column", gap: 26 } },
      h(Mark, { size: 96, pal })
    ),
    h(
      "div",
      { style: { position: "absolute", right: 72, top: 78, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 } },
      h("div", {
        style: { fontFamily: SANS, fontSize: 32, lineHeight: 1.35, color: pal.t2, textAlign: "right", maxWidth: 520 },
      }, CLAIM),
      h(Strip, { items: ["298 Recordings", "24 Contributors", "18 Categories"], pal, size: 28, tone: "t2" })
    )
  )
}

// -- 3. Marquee ---------------------------------------------------------------
// The mark centred and a credit-roll of eleven real captions beneath it. The bet:
// the fastest way to say what a catalogue *contains* is to name some of it.

const ROLL = [
  "Snake", "Fluid Carousels", "Toast", "Morphing Loader", "Coinbase Charts",
  "Dynamic Blur Tabs", "Live Voice", "Blurred Scroll", "Loading Button",
  "Dynamic Accordion", "Ripple Effect",
]

function Marquee({ pal }: { pal: Pal }) {
  // **Every block gets a fixed height.** The first attempt used
  // `justifyContent: center` on a column whose contents summed to more than 630 —
  // and because Satori neither clamps nor reports an overflow (ticket 06: no
  // line-clamp, `gap` does not stop siblings overlapping), the claim's third line
  // and the credit roll drew straight through each other. So the budget is
  // written down and each block is sized from it:
  //
  //   mark 112*1.05 = 118 · claim 2 lines at 46px*1.35 = 124 · roll 2 rows = 74
  //   stats 36*1.1 + 19*1.2 = 62 · gaps 4 x 34 = 136  ->  514 of 630, 116 spare
  //
  // The claim also drops from `t1` to `t2` and from 81px to 46px. It was never the
  // hero — the mark is — and at 81px it needed three lines in an 860px column,
  // which is what broke the budget in the first place.
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34, background: pal.canvas, position: "relative", overflow: "hidden" } },
    wash(175, 1000, 0.13, 100, -260),
    wash(273, 720, 0.10, 620, 180),
    h(Mark, { size: 112, pal }),
    h(
      "div",
      {
        style: {
          fontFamily: SANS, fontSize: 46, lineHeight: 1.35, fontWeight: 400,
          color: pal.t2, textAlign: "center", maxWidth: 980,
          // Fixed, so the composition cannot change with the copy.
          height: Math.round(46 * 1.35 * 2), overflow: "hidden",
        },
      },
      CLAIM
    ),
    // The roll. Two rows of five and six, so it fills the width without a single
    // line long enough to need truncating.
    h(
      "div",
      {
        style: {
          display: "flex", flexDirection: "column", alignItems: "center", gap: 13,
          // A hard width, so a future caption cannot bleed off the card. Six per row
          // measured 1303px — the roll ran off both edges, and Satori clips an
          // overflow silently rather than reporting it.
          width: 1040, overflow: "hidden",
        },
      },
      ...[ROLL.slice(0, 4), ROLL.slice(4, 8), ROLL.slice(8)].map((row, ri) =>
        h(
          "div",
          { key: ri, style: { display: "flex", alignItems: "center", gap: 20 } },
          ...row.flatMap((c, i) => [
            i > 0 ? h("div", { key: `d${i}`, style: { width: 4, height: 4, borderRadius: 2, background: pal.acc, opacity: 0.5 } }) : null,
            h("div", { key: c, style: { fontFamily: MONO, fontSize: 27, letterSpacing: "0.04em", color: pal.t3 } }, c),
          ])
        )
      )
    ),
    h(Stats, { pal, size: 36 })
  )
}

// -- 4. Ramp ------------------------------------------------------------------
// The mark on the left and a diagonal cascade of tiles running off the right edge.
// The bet: a catalogue of *animations* should not be a static grid, and a
// diagonal is the cheapest way to imply that without an animated format.

function Ramp({ pal }: { pal: Pal }) {
  const rows = 4
  const cols = 7
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    ...Array.from({ length: rows * cols }, (_, i) => {
      const r = Math.floor(i / cols)
      const c = i % cols
      const size = 104
      const step = 132
      // A shear: each row starts further right than the one above it.
      const x = 640 + c * step + r * 86
      const y = -70 + r * step * 0.62
      const t = SMALL[(i * 5) % SMALL.length]
      return h("div", { key: i, style: { position: "absolute", left: Math.round(x), top: Math.round(y), display: "flex" } },
        h(Chip, { t, size, rotate: -8 + ((i * 7) % 17) })
      )
    }),
    // A wash so the mark's end of the card has depth behind it.
    wash(210, 820, 0.14, -180, 40),
    h(
      "div",
      { style: { position: "absolute", left: 88, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 } },
      h(Mark, { size: 104, pal }),
      h("div", { style: { fontFamily: SANS, fontSize: 32, lineHeight: 1.35, color: pal.t2, maxWidth: 440 } }, CLAIM),
      h(Strip, { items: ["298 Recordings", "18 Categories"], pal, size: 28, tone: "t2" })
    )
  )
}

// -- 5. Orbit -----------------------------------------------------------------
// Sixteen tiles on an ellipse with the mark in the middle. The bet: the catalogue
// surrounds the name, rather than the name sitting above a list.

function Orbit({ pal }: { pal: Pal }) {
  const CX = 600
  const CY = 315
  const RX = 452
  const RY = 246
  const N = 16
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: pal.canvas, position: "relative", overflow: "hidden" } },
    wash(175, 760, 0.14, CX - 380, CY - 380),
    // The ring itself: a hairline, so the tiles read as sitting *on* a path
    // rather than floating at random.
    h("div", {
      style: {
        position: "absolute", left: CX - RX, top: CY - RY, width: RX * 2, height: RY * 2,
        borderRadius: "50%",
        // 1px at `--line` (11% white) measured as invisible against `--canvas`.
        // The Design's own ring treatment is `--line2` at 22%, and a 2px stroke
        // gives the ellipse enough presence to read as a path the tiles sit *on*.
        border: `2px solid ${pal.line2}`,
      },
    }),
    ...Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2
      const depth = (Math.sin(a) + 1) / 2
      const size = 78 + Math.round(depth * 26)
      const tw = Math.round((size * 116) / 92)
      const x = CX + Math.cos(a) * RX - size / 2
      const y = CY + Math.sin(a) * RY - tw / 2
      return h("div", { key: i, style: { position: "absolute", left: Math.round(x), top: Math.round(y), display: "flex" } },
        h(Chip, { t: SMALL[(i * 3) % SMALL.length], size, rotate: Math.round(Math.cos(a) * 10) })
      )
    }),
    h(
      "div",
      { style: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 } },
      h(CentrePlate, { pal, markSize: 84 },
        h(Stats, { pal, size: 28 })
      )
    )
  )
}

// -- 6. Bloom -----------------------------------------------------------------
// A four-hue radial bloom behind the mark with three large Posters in front. The
// bet: depth and colour before information — the card should look like the site
// *feels*, and the three tiles prove what the colour is made of.

function Bloom({ pal }: { pal: Pal }) {
  // The three tiles are in the **corners**, and the text column is narrower than
  // the gap between them. The first attempt put tiles at x = 92 / 1210 / 150 and a
  // 760px claim centred at x = 220, so the bottom-left tile and the claim occupied
  // the same space and the claim's first line drew across a Poster — the same
  // overlap Satori refuses to prevent in Marquee.
  //
  // The rule that fixes it: a centred column of width W spans 600 +/- W/2, so every
  // absolutely-positioned element must sit outside [600 - W/2, 600 + W/2]. At
  // W = 560 that is [320, 880]; the widest tile ends at 300.
  const COL_W = 560
  const band = 1200 / 2 - COL_W / 2 // 320
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    wash(175, 1000, 0.20, -140, -220),
    wash(273, 820, 0.16, 620, -160),
    wash(25, 760, 0.13, 300, 180),
    wash(346, 700, 0.11, 800, 260),
    ...[
      { i: 40, t: 40, size: 200, rot: -7 },
      { i: 1200 - 40 - 186, t: 96, size: 186, rot: 5 },
      { i: 40, t: 630 - 40 - 240, size: 200, rot: -3 },
    ].map((t, k) =>
      h("div", { key: k, style: { position: "absolute", left: t.i, top: t.t, display: "flex" } },
        h(Chip, { t: SMALL[[2, 9, 14][k]], size: t.size, rotate: t.rot })
      )
    ),
    // A right-hand tile for balance, kept clear of the column by the same rule.
    h("div", { style: { position: "absolute", left: 1200 - 40 - 168, top: 300, display: "flex" } },
      h(Chip, { t: SMALL[17], size: 168, rotate: 8 })
    ),
    h(
      "div",
      {
        style: {
          position: "absolute", left: 0, top: 0, right: 0, bottom: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30,
        },
      },
      h(Mark, { size: 124, pal }),
      h("div", {
        style: {
          fontFamily: SANS, fontSize: 34, lineHeight: 1.35, color: pal.t2,
          textAlign: "center", width: COL_W, height: Math.round(34 * 1.35 * 2), overflow: "hidden",
        },
      }, CLAIM),
      h(Stats, { pal, size: 34 })
    ),
    h("div", {
      style: {
        position: "absolute", left: 0, right: 0, bottom: 0, height: 1,
        background: pal.canvas,
      },
    }),
    // The band assertion, kept in the source rather than only in the audit: if
    // COL_W grows past 760 the corners will collide with it again.
    void band
  )
}

export const VARIANTS = [
  { key: "Halo", name: "Halo", bet: "21 real Posters in an ellipse around the mark, each lit by its own hue", fn: (p: Pal) => Halo({ pal: p }) },
  { key: "Deck", name: "Deck", bet: "5 Posters uncropped in device frames on a shelf, bleeding off the bottom", fn: (p: Pal) => Deck({ pal: p }) },
  { key: "Marquee", name: "Marquee", bet: "The mark, the claim, and eleven real captions as a credit roll", fn: (p: Pal) => Marquee({ pal: p }) },
  { key: "Ramp", name: "Ramp", bet: "A diagonal cascade of tiles — the card implies motion", fn: (p: Pal) => Ramp({ pal: p }) },
  { key: "Orbit", name: "Orbit", bet: "16 tiles on a hairline ellipse, the name in the middle of the catalogue", fn: (p: Pal) => Orbit({ pal: p }) },
  { key: "Bloom", name: "Bloom", bet: "A four-hue radial bloom with three large Posters in front", fn: (p: Pal) => Bloom({ pal: p }) },
] as const

export type VariantKey = (typeof VARIANTS)[number]["key"]

export function render(variant: VariantKey, mode: Mode) {
  return VARIANTS.find((v) => v.key === variant)!.fn(C[mode])
}
