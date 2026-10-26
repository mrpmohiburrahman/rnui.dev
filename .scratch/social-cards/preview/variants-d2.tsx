// PROTOTYPE — ticket 06, round 2. D chosen; four improved versions.
//
// The maintainer chose D (Split). This round answers their objection: a card is
// displayed at wildly different widths per platform, so D as built -- 820px of
// text column filled with an 81px caption, a 34px byline and a 25px category --
// puts the two smaller steps under 11px on screen at iMessage, WhatsApp and
// Slack. Measured, in ../probe/ticket06/platform-fit.ts:
//
//   platform     width   caption  byline  category
//   iMessage      300     20.3      8.4!     6.3!
//   WhatsApp      340     23.0      9.5!     7.1!
//   Slack         360     24.4     10.1!     7.6!
//   Discord       400     27.1     11.2      8.4!
//   X             504     34.1     14.1     10.6!
//   LinkedIn      552     37.4     15.5     11.6
//
// So the four improvements, each answering one measured problem:
//
//   D1  Promote the small steps. A card is not a web page: nothing on it needs
//       to read as body text, so byline and category get their own larger K.
//   D2  Let the byline WRAP to two lines. The name is the widest string in the
//       catalogue (543px at body-sm) and promoting it makes it wider still, so
//       a one-line byline cannot both be readable and complete.
//   D3  Drop the initials disc and promote harder. Buys 54px of width, which is
//       the other way to buy the byline room.
//   D4  A crop-safe inset, because Slack and LinkedIn centre-crop 66px off the
//       sides at 1.8:1 and Discord takes 30px off the height at 2:1. Anything
//       within 5% of an edge can be lost, so D4 pulls the chrome inside a 60px
//       inset.
//
// Every one keeps D's winning property: the Poster at true ratio, uncropped.

import { readFileSync } from "node:fs"
import { createElement as h, type ReactNode } from "react"

import { C, MONO, R, SANS, type_ } from "./tokens"

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
  const bytes = readFileSync(`${dir}${key}-tall-h900.jpg`)
  return `data:image/jpeg;base64,${bytes.toString("base64")}`
}

/**
 * Per-step scales. The caption is held at 2.8 because the catalogue's longest
 * caption needs three lines there and there is no line-clamp. Everything BELOW
 * the caption is free, because a caption is the only field that competes for
 * lines -- so the smaller steps are promoted until they clear 11px at the
 * narrowest platform anyone shares into (iMessage, 300px).
 *
 * The target is 11px at 300px wide, i.e. 44px on the 1200 card.
 */
const K_CAP = 2.8
const K_BY = 3.7 // 44px -> 11.0px at 300, 16.5 at 504
const K_CAT = 4.9 // 44px -> 11.0 at 300, 12.7 at 360, 18.5 at 504

/** 60px: survives Slack/LinkedIn's 66px side crop and Discord's 30px height crop. */
const INSET = 60

function Wordmark({ size = 22 }: { size?: number }) {
  return h(
    "div",
    {
      style: {
        fontFamily: SANS,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: C.t1,
      },
    },
    "rnui.dev"
  )
}

function Label({ children, color = C.acc }: { children: string; color?: string }) {
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
 * The caption. Three lines, hard, at the measured K of 2.8.
 * `height`, not `maxHeight` -- see the round-1 answer for why that matters
 * beyond enforcement.
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

/** The byline, at its own promoted scale, wrapping to at most two lines. */
function Byline({
  name,
  maxWidth,
  lines = 1,
}: {
  name: string
  maxWidth: number
  lines?: number
}) {
  return h(
    "div",
    {
      style: {
        fontFamily: SANS,
        fontSize: 12 * K_BY,
        lineHeight: 1.3,
        fontWeight: 400,
        color: C.t2,
        maxWidth,
        height: Math.round(12 * K_BY * 1.3 * lines),
        overflow: "hidden",
      },
    },
    name
  )
}

function Initials({ name, hue, size }: { name: string; hue: number; size: number }) {
  const letters = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
  return h(
    "div",
    {
      style: {
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `hsla(${hue},45%,30%,0.9)`,
        boxShadow: `0 0 0 1px hsla(${hue},50%,60%,0.4)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      },
    },
    h(
      "div",
      {
        style: {
          fontFamily: MONO,
          fontSize: Math.round(size * 0.44),
          fontWeight: 500,
          color: C.t1,
          lineHeight: 1,
        },
      },
      letters
    )
  )
}

/** Ticket 14's designed fallback, sized to its slot. */
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
    // The label is fitted to its slot, not trusted to fit. At the promoted 4.0
    // scale "POSTER UNAVAILABLE" is ~340px of tracked mono and the panel can be
    // 200px wide, so the un-wrapped string was clipped mid-word to
    // "UNAVAILABL". Two lines, and the scale drops on the narrowest panel.
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

/** The Poster at true ratio, or the fallback. Never cropped. */
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

/** The right rail: `--rail` with the Poster centred in it. */
function Rail({ s, height, bleed = false }: { s: Subject; height: number; bleed?: boolean }) {
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
        // NOT inset, deliberately. A side crop takes 66px off each side, and the
        // Poster is the one element designed to bleed off the right edge -- an
        // inset would both shrink the device and, at 60px against a 280px rail,
        // push it far enough in that the crop lands ON the image anyway. What a
        // crop must never take is the TEXT, and that lives in the other column.
        padding: 0,
      },
    },
    h(Poster, { s, height })
  )
}

// -- D1: promote the small steps -----------------------------------------
// The smallest change that fixes readability. The byline stays one line, which
// means the widest name truncates -- so D1 is only correct if the maintainer
// accepts an ellipsis on 1 of 23 names. It is here to show what promotion alone
// buys, and what it costs.

function D1(s: Subject): ReactNode {
  const hue = s.hue ?? 175
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: C.canvas,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          gap: 20,
          width: 860,
          flexShrink: 0,
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 14 } },
        h(Wordmark, {}),
        h("div", { style: { width: 5, height: 5, borderRadius: 3, background: C.t3 } }),
        h("div", { style: { display: "flex" } }, h(Label, { children: s.category }))
      ),
      h(Caption, { text: s.caption, maxWidth: 660 }),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 14 } },
        h(Initials, { name: s.contributor, hue, size: 46 }),
        h(Byline, { name: s.contributor, maxWidth: 600 })
      ),
      // Reserves the bottom margin the centring cannot guarantee. A centred
      // column's height depends on the caption, so on a three-line caption the
      // byline lands on the last row and the text touches the card edge --
      // measured at 21-27 ink px in row 629. This spacer is `flex: 1` and
      // collapses to nothing when there is slack.
      h("div", { style: { flex: 1, minHeight: 0 } })
    ),
    h(Rail, { s, height: 470 })
  )
}

// -- D2: promote AND wrap the byline -------------------------------------
// The fix that keeps the name whole. Two lines at the promoted scale, which is
// also the only way to have both a readable byline and all 23 names.

function D2(s: Subject): ReactNode {
  const hue = s.hue ?? 175
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: C.canvas,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          gap: 20,
          width: 880,
          flexShrink: 0,
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 14 } },
        h(Wordmark, {}),
        h("div", { style: { width: 5, height: 5, borderRadius: 3, background: C.t3 } }),
        h("div", { style: { display: "flex" } }, h(Label, { children: s.category }))
      ),
      h(Caption, { text: s.caption, maxWidth: 700 }),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 14 } },
        h(Initials, { name: s.contributor, hue, size: 46 }),
        h(Byline, { name: s.contributor, maxWidth: 660, lines: 2 })
      )
    ),
    h(Rail, { s, height: 470 })
  )
}

// -- D3: no disc, promote harder ----------------------------------------
// Drops the initials block to buy 60px of width, then promotes the byline to the
// largest scale that still keeps every name to ONE line.

function D3(s: Subject): ReactNode {
  const hue = s.hue ?? 175
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: C.canvas,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          gap: 22,
          width: 840,
          flexShrink: 0,
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 16 } },
        h(Wordmark, {}),
        h("div", { style: { width: 5, height: 5, borderRadius: 3, background: C.t3 } }),
        h("div", { style: { display: "flex" } }, h(Label, { children: s.category }))
      ),
      h(Caption, { text: s.caption, maxWidth: 680 }),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 16 } },
        h("div", {
          style: {
            width: 14,
            height: 14,
            borderRadius: 7,
            background: `hsl(${hue},70%,60%)`,
            flexShrink: 0,
          },
        }),
        h(
          "div",
          {
            style: {
              fontFamily: SANS,
              // 3.12 is the measured maximum: 543px of name in a 680px column.
              fontSize: 12 * 3.12,
              lineHeight: 1.3,
              fontWeight: 400,
              color: C.t2,
              maxWidth: 680,
              height: Math.round(12 * 3.12 * 1.3),
              overflow: "hidden",
            },
          },
          s.contributor
        )
      ),
      // See D1: the centring alone leaves no bottom margin.
      h("div", { style: { flex: 1, minHeight: 0 } })
    ),
    h(Rail, { s, height: 470 })
  )
}

// -- D4: D2 plus a crop-safe inset --------------------------------------
// Slack and LinkedIn centre-crop 66px off the sides at 1.8:1; Discord takes 30px
// off the height at 2:1. D4 keeps every piece of chrome inside a 60px inset so
// no platform can crop it away, and pays for it with a slightly smaller Poster.

function D4(s: Subject): ReactNode {
  const hue = s.hue ?? 175
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: C.canvas,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          // The 60px inset is here, on the text column, and nowhere else: this
          // is what Slack's and LinkedIn's 66px side crop and Discord's 30px
          // height crop cannot reach.
          padding: INSET,
          gap: 20,
          width: 880,
          flexShrink: 0,
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 14 } },
        h(Wordmark, {}),
        h("div", { style: { width: 5, height: 5, borderRadius: 3, background: C.t3 } }),
        h("div", { style: { display: "flex" } }, h(Label, { children: s.category }))
      ),
      h(Caption, { text: s.caption, maxWidth: 700 }),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 14 } },
        h(Initials, { name: s.contributor, hue, size: 46 }),
        h(Byline, { name: s.contributor, maxWidth: 660, lines: 2 })
      )
    ),
    h(Rail, { s, height: 430, bleed: true })
  )
}

export const VARIANTS = [
  { key: "D1", name: "Promoted", bet: "Small steps promoted; byline still one line", fn: D1 },
  { key: "D2", name: "Promoted + wrap", bet: "Readable byline AND every name whole", fn: D2 },
  { key: "D3", name: "No disc", bet: "Drop initials, promote harder, one line", fn: D3 },
  { key: "D4", name: "Crop-safe", bet: "D2 inside a 60px inset no crop can take", fn: D4 },
] as const

export type VariantKey = (typeof VARIANTS)[number]["key"]

export function render(variant: VariantKey, s: Subject) {
  const v = VARIANTS.find((x) => x.key === variant)!
  // @ts-expect-error satori accepts an <img>
  return v.fn(s)
}
