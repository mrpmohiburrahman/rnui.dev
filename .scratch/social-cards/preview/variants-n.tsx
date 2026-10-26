// PROTOTYPE — ticket 06 round 3. The maintainer chose D3 (no disc) and asked for
// three changes, applied to every variant:
//
//   1. **No initials disc anywhere.** D3 already dropped it; now all four do.
//   2. **The wordmark is the biggest name on the card**, not the Category. This
//      was a real defect: promoting the small steps for platform legibility had
//      left `FULL APPS` at 44px and `rnui.dev` at 22px, so the first line read as
//      the Category being the headline and the site's own name being a caption.
//      Wrong way round for a stranger seeing a share.
//   3. **The wordmark is set exactly as the homepage sets it** --
//      `components/site-header.tsx:98-102`: `rnui` in --t1, `.dev` in --acc, bold
//      (700, not 500), -0.02em, baseline-aligned. See ./wordmark.tsx.
//
// The resulting hierarchy is brand > content > metadata:
//
//     rnui.dev          <- biggest, bold, accent .dev
//     Spread Cards…     <- the caption, hero
//     Misc · Enzo …     <- metadata, small
//
// Four variants differ in how the brand sits and how big it is, all sharing the
// same hierarchy and none carrying a disc. D keeps what won in round 2: the
// Poster at true ratio, uncropped, on a --rail panel.

import { readFileSync } from "node:fs"
import { createElement as h, type ReactNode } from "react"

import { C, MONO, R, SANS, type_ } from "./tokens"
import { Wordmark } from "./wordmark"

export type Subject = {
  key: string
  caption: string
  contributor: string
  category: string
  hue: number | undefined
  poster: string | null
  aspect?: number
}

const dir = new URL("./renditions/", import.meta.url).pathname
export function rendition(key: string): string {
  return `data:image/jpeg;base64,${readFileSync(`${dir}${key}-tall-h900.jpg`).toString("base64")}`
}

/** The caption is held at 2.8: the longest caption needs three lines there. */
const K_CAP = 2.8
/** Promoted below the caption, so nothing readable sits under 11px at 360px. */
const K_META = 3.7
const K_CAT = 4.9

const INSET = 60

/**
 * The wordmark's largest size, and it is bounded exactly as the caption is.
 *
 * The wordmark shares a column with a three-line caption and a two-line byline,
 * so the vertical budget is 630 - (caption 280) - (byline 115) - (padding 128) -
 * (gaps 56) = **51px of line box**, and a bold wordmark's line box is ~1.05em.
 * That caps it at 48px.
 *
 * This was found by rendering: N2's first attempt was 92px, which clipped the
 * caption's third line mid-glyph ("Swatch )" became "Swatch"). The same mistake
 * as the K=3.16 caption -- treating a size as free when it competes for a fixed
 * box -- in the other direction.
 */
const WORDMARK_MAX = 48

/** Small metadata line: Category, or Contributor, at the meta scale. */
function Meta({ children, color = C.t3 }: { children: string; color?: string }) {
  return h(
    "div",
    {
      style: {
        fontFamily: MONO,
        fontSize: 9 * K_CAT,
        lineHeight: 1.2,
        fontWeight: 400,
        letterSpacing: "0.14em",
        color,
        textTransform: "uppercase",
      },
    },
    children
  )
}

/**
 * The Category, DEMOTED to 30px.
 *
 * Round 3 used `Meta` -- the promoted `label` step at 9 * 4.9 = 44px -- which was
 * promoted for platform legibility and ended up competing with the wordmark,
 * because the promotion was applied without asking which fields deserved it. The
 * maintainer's ranking is the site's name, the Recording's name, the Contributor's
 * name, and then the Category; so the Category gets its own size, fixed at 30px,
 * which is 62% of the wordmark's 48px.
 */
function Category({ children }: { children: string }) {
  return h(
    "div",
    {
      style: {
        fontFamily: MONO,
        fontSize: 30,
        lineHeight: 1.2,
        fontWeight: 400,
        letterSpacing: "0.14em",
        color: C.t3,
        textTransform: "uppercase",
      },
    },
    children
  )
}

/** The Contributor's name at the promoted meta scale, wrapping to two lines. */
function Byline({ name, maxWidth }: { name: string; maxWidth: number }) {
  return h(
    "div",
    {
      style: {
        fontFamily: SANS,
        fontSize: 12 * K_META,
        lineHeight: 1.3,
        fontWeight: 400,
        color: C.t2,
        maxWidth,
        height: Math.round(12 * K_META * 1.3 * 2),
        overflow: "hidden",
      },
    },
    name
  )
}

/**
 * The caption: three lines, hard.
 *
 * `height`, not `maxHeight` -- see the round-1 answer. The box is 1.15em per
 * line, the Design's `hero` leading, and it is NOT too short: rendered in a
 * 318px box the longest caption in the catalogue produces three ink bands of
 * 74/80/80px, **identical** to the same caption rendered unbounded. So no
 * descender allowance is needed and none is given; an earlier attempt added one
 * on the strength of a bad heuristic and it changed nothing measurable.
 */
function Caption({ text, maxWidth }: { text: string; maxWidth: number }) {
  const t = type_("hero")
  return h(
    "div",
    {
      style: {
        ...t,
        fontFamily: SANS,
        color: C.t1,
        maxWidth,
        height: Math.round(t.fontSize * t.lineHeight * 3),
        overflow: "hidden",
      },
    },
    text
  )
}

/** A metadata row: an accent dot, then the Contributor's name. No disc. */
function ByRow({ name, hue, maxWidth }: { name: string; hue: number; maxWidth: number }) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "flex-start", gap: 14, flexShrink: 0 } },
    h("div", {
      style: {
        width: 12,
        height: 12,
        borderRadius: 6,
        background: `hsl(${hue},70%,60%)`,
        flexShrink: 0,
        marginTop: Math.round(12 * K_META * 0.45),
      },
    }),
    h(Byline, { name, maxWidth })
  )
}

function Fallback({ hue, height, width }: { hue: number | undefined; height: number; width: number }) {
  const hdeg = hue ?? 175
  return h(
    "div",
    {
      style: {
        height,
        width,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(160deg, hsla(${hdeg},45%,22%,0.6) 0%, hsla(${hdeg},45%,12%,0.3) 100%)`,
        borderRadius: R.tile,
        boxShadow: `0 0 0 1px hsla(${hdeg},60%,62%,0.26), 0 40px 120px -32px hsla(${hdeg},70%,58%,0.5)`,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          maxWidth: width - 24,
        },
      },
      h(
        "div",
        {
          style: {
            fontFamily: MONO,
            fontSize: width < 240 ? 7 * K_CAT : 9 * K_CAT,
            letterSpacing: "0.14em",
            color: `hsla(${hdeg},60%,72%,0.75)`,
            textAlign: "center",
          },
        },
        "POSTER UNAVAILABLE"
      )
    )
  )
}

/** The Poster at true ratio. Never cropped. */
function Poster({ s, height }: { s: Subject; height: number }) {
  const width = Math.round(Math.min(height * (s.aspect ?? 0.46), 520))
  if (!s.poster) return h(Fallback, { hue: s.hue, height, width })
  return h("img", {
    src: s.poster,
    style: {
      width,
      height,
      objectFit: "contain",
      borderRadius: R.tile,
      boxShadow: `0 0 0 1px hsla(${s.hue ?? 175},60%,62%,0.26), 0 40px 120px -32px hsla(${s.hue ?? 175},70%,58%,0.5)`,
    },
  })
}

function Rail({ s, height }: { s: Subject; height: number }) {
  return h(
    "div",
    {
      style: {
        position: "relative",
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.rail,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.07)",
      },
    },
    h(Poster, { s, height })
  )
}

// -- M1: site name and Category side by side, Category demoted ----------
// The maintainer's first request: keep the side-by-side arrangement, but the two
// are NOT the same size. `rnui.dev` is the site's name and leads at 48px; the
// Category is context, not content, and drops to **30px** -- deliberately below
// the 11px floor at narrow widths, because the maintainer ranked it last and a
// stranger needs the site's name, the Recording's name and the Contributor's name
// before they need to know which of 18 Categories this is.
//
// Sizes on screen, measured: wordmark 48px = 14.4px at Slack / 20.2px at X;
// Category 30px = 9.0px at Slack / 12.6px at X. The ratio is 1.6:1 in favour of
// the site's name, which is what "not the main portion" has to look like.

function M1(s: Subject): ReactNode {
  const hue = s.hue ?? 175
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", flexDirection: "row", background: C.canvas } },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          gap: 24,
          width: 900,
          flexShrink: 0,
        },
      },
      // Side by side: site name, a rule, then the Category at 30px.
      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", gap: 20 } },
        h("div", { style: { display: "flex", flexShrink: 0 } }, h(Wordmark, { size: WORDMARK_MAX })),
        h("div", {
          style: { width: 1, height: 26, background: C.line2, flexShrink: 0, alignSelf: "center" },
        }),
        h("div", { style: { display: "flex", flexShrink: 0 } }, h(Category, { children: s.category }))
      ),
      h(Caption, { text: s.caption, maxWidth: 720 }),
      h(ByRow, { name: s.contributor, hue, maxWidth: 720 }),
      h("div", { style: { flex: 1, minHeight: 0 } })
    ),
    h(Rail, { s, height: 470 })
  )
}

// -- M2: no Category at all ----------------------------------------------
// The maintainer's second request, and the cleaner card: the site's name, the
// Recording's name, the Contributor's name. Nothing else.
//
// The cost is real and worth naming: the Category is what tells a stranger this
// is a Buttons demo rather than a Loader, and with 18 Categories the card no
// longer says which. The saving is a whole text row, so the caption and the
// byline can both breathe -- and nothing on the card sits below the readability
// floor at any width.

function M2(s: Subject): ReactNode {
  const hue = s.hue ?? 175
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", flexDirection: "row", background: C.canvas } },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          // M1's numbers, not roomier ones. Removing the Category row freed
          // ~56px, and the first attempt spent it on padding (72) and gap (30),
          // which pushed the caption's third line out of its box and sheared it
          // mid-glyph ("Swatch )" became a half-height "Swatch )"). The freed
          // space is left as slack; the vertical budget is M1's.
          padding: 64,
          gap: 24,
          width: 860,
          flexShrink: 0,
        },
      },
      h("div", { style: { display: "flex" } }, h(Wordmark, { size: WORDMARK_MAX })),
      h(Caption, { text: s.caption, maxWidth: 700 }),
      h(ByRow, { name: s.contributor, hue, maxWidth: 700 }),
      h("div", { style: { flex: 1, minHeight: 0 } })
    ),
    h(Rail, { s, height: 470 })
  )
}

export const VARIANTS = [
  { key: "M1", name: "With Category", bet: "rnui.dev at 48px beside a 30px Category — 1.6:1", fn: M1 },
  { key: "M2", name: "No Category", bet: "Site name, Recording, Contributor. Nothing else", fn: M2 },
] as const

export type VariantKey = (typeof VARIANTS)[number]["key"]

export function render(variant: VariantKey, s: Subject) {
  const v = VARIANTS.find((x) => x.key === variant)!
  // @ts-expect-error satori accepts an <img>
  return v.fn(s)
}
