// PROTOTYPE — ticket 06. Five Recording-card designs at 1200x630.
//
// Each is a real Satori tree rendered by ImageResponse, not HTML: a card drawn
// in a browser would show devices that silently drop the day it is implemented.
// What the maintainer compares here is what the renderer will emit.
//
// The five are structurally different — different answers to "where does a 0.46
// Poster sit in a 1.905 frame", not one layout with the accent moved:
//
//   A  Device        the Poster as a phone on a plinth, text beside it
//   B  Bleed         the Poster cropped full-bleed, scrim + text over it
//   C  Stage         the Poster centred on a panel, caption under it
//   D  Split         Poster right at true ratio, a wide text column left
//   E  Poster-first  the Poster is the whole card; text is one quiet line
//
// Constraints honoured (ticket 02 + 14): literals only, no CSS variables, no
// mix-blend-mode, no line-clamp, `box-shadow` and gradients used because they
// were measured to render, and the Poster arrives as a JPEG Rendition.

import { readFileSync } from "node:fs"
import { createElement as h, type ReactNode } from "react"

import { C, MONO, PAD, R, SANS, e0, mediaGlow, type_ } from "./tokens"

export type Subject = {
  key: string
  caption: string
  contributor: string
  category: string
  hue: number | undefined
  /** The JPEG Rendition, as a data URI. Absent = the designed fallback state. */
  poster: string | null
  /** Poster width ÷ height, from the Recording's measured `aspect`. */
  aspect?: number
}

const dir = new URL("./renditions/", import.meta.url).pathname
export function rendition(key: string, shape: "tall" | "wide" | "cover"): string {
  const bytes = readFileSync(`${dir}${key}-${shape}-${shapeSuffix(shape)}.jpg`)
  return `data:image/jpeg;base64,${bytes.toString("base64")}`
}
const shapeSuffix = (s: "tall" | "wide" | "cover") => (s === "tall" ? "h900" : s === "wide" ? "w1200" : "1200x630")

// -- shared pieces -------------------------------------------------------
// Deliberately minimal. The prototype skill's warning is right: a shared
// <Layout> defeats the point, and these are the only things all five agree on.

/**
 * The site's wordmark, set the way the site's own header sets it.
 *
 * `onImage` is what the two overlay variants need: a wordmark in `--t1` is
 * invisible on a pale Poster, and 64 of 297 Posters are more than 90% near-white
 * or near-black app chrome (ticket 14). Measuring the ratio rather than assuming
 * it is the point — see the note on `WordmarkOnImage` below.
 */
function Wordmark({ size = 20 }: { size?: number }) {
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

/**
 * The wordmark for a variant that draws over the Poster.
 *
 * Satori cannot blend (ticket 02), so `--t1` cannot simply be assumed legible.
 * The fix that costs nothing: draw the wordmark on a solid `--canvas` chip, so
 * its contrast ratio is fixed at t1-on-canvas (measured 17.9:1) whatever the
 * Poster behind it is. The alternative — a second scrim — darkens the whole
 * image to save one word.
 */
function WordmarkOnImage({ size = 20 }: { size?: number }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        background: C.canvas,
        borderRadius: R.badge,
        padding: "6px 12px",
      },
    },
    h(
      "div",
      {
        style: {
          fontFamily: SANS,
          fontSize: size,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: C.t1,
          lineHeight: 1,
        },
      },
      "rnui.dev"
    )
  )
}

/** The `label` step, the site's mono uppercase. */
function Label({ children, color = C.acc }: { children: string; color?: string }) {
  return h(
    "div",
    {
      style: {
        ...type_("label"),
        fontFamily: MONO,
        color,
        textTransform: "uppercase",
      },
    },
    children
  )
}

/**
 * The caption, fitted.
 *
 * The ticket asked "what happens when a caption will not fit". Measured answer:
 * it wraps, and at K=2.8 the longest caption in the catalogue takes three lines
 * and clears. Satori's text wrapping is real — so this **wraps rather than
 * truncates**, because a caption is the Recording's identity (CONTEXT.md) and an
 * ellipsis would show a stranger a caption that is not on the page.
 *
 * `maxHeight` is set to exactly three lines' worth so a future caption cannot
 * grow past the space the layout reserved. Overflowing is a clipped card, which
 * is worse than a shortened one — so the bound is enforced, not hoped for.
 * `-webkit-line-clamp` is unavailable (ticket 02); `text-overflow: ellipsis`
 * *is* available, and is used for the byline, where losing the tail is honest.
 */
const LINES = 3

function Caption({
  text,
  maxWidth,
  step = "hero",
  color = C.t1,
}: {
  text: string
  maxWidth: number
  step?: "detail" | "hero"
  color?: string
}) {
  const t = type_(step)
  const box = Math.round(t.fontSize * t.lineHeight * LINES)
  return h(
    "div",
    {
      style: {
        ...t,
        fontFamily: SANS,
        color,
        maxWidth,
        // `height`, not `maxHeight`. Two reasons, and the second is the good
        // one:
        //
        // 1. it enforces the three-line bound -- `overflow: hidden` renders
        //    (ticket 02), so a longer caption is clipped rather than colliding
        //    with the byline. There is no line-clamp.
        // 2. **the text block's geometry is then the same for every Recording**,
        //    whether its caption is 5 characters or 36. A `maxHeight` box is
        //    sized by its content, so a short caption would pull the byline up
        //    and a card would be a different composition from the next one --
        //    which is both ugly and, as it turns out, unmeasurable: rendering a
        //    caption-less card to find each glyph's backdrop reflows the layout
        //    and the byline lands somewhere else. A fixed box makes the
        //    backdrop measurement exact.
        height: box,
        overflow: "hidden",
      },
    },
    text
  )
}

function Byline({ contributor, color = C.t2, maxWidth = 560 }: { contributor: string; color?: string; maxWidth?: number }) {
  const t = type_("body-sm")
  return h(
    "div",
    {
      style: {
        ...t,
        fontFamily: SANS,
        color,
        maxWidth,
        // Fixed for the same reason as Caption: one line, always.
        height: Math.round(t.fontSize * t.lineHeight),
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },
    contributor
  )
}

/**
 * The designed fallback from ticket 14: a hue-tinted panel with a device
 * outline, which is what the grid already shows for a Recording it has no hue
 * for. `--tile-hue` is 175 when unmeasured.
 */
function FallbackPanel({
  hue,
  height,
  width,
  framed = false,
}: {
  hue: number | undefined
  height: number | number[]
  width?: number | string
  framed?: boolean
}) {
  const hdeg = hue ?? 175
  return h(
    "div",
    {
      style: {
        position: "relative",
        height,
        // Sized by its slot. `width: "100%"` inside a `flex: 1` parent resolved
        // against the parent's free width, so the panel swallowed the card and
        // pushed C's byline off the bottom entirely -- a defect the tinted
        // Posters were hiding, because an <img> sizes to its own aspect.
        width: width ?? "100%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(160deg, hsla(${hdeg},45%,22%,0.6) 0%, hsla(${hdeg},45%,12%,0.3) 100%)`,
        borderRadius: framed ? 26 : R.tile,
        boxShadow: mediaGlow(hdeg),
      },
    },
    // No device outline. The first version drew one and was then placed inside
    // A's device shell, which rendered a phone inside a phone; and an outline
    // here is a promise of content that is not there. The tinted panel plus the
    // site's own glow is enough, and it is the grid's existing fallback.
    h(Label, { children: `poster unavailable · hue ${hdeg}`, color: `hsla(${hdeg},60%,72%,0.75)` })
  )
}

/** A Poster at true ratio, or the fallback when there is none. */
function Poster({
  s,
  shape,
  radius = R.tile,
  glow = true,
  height,
  width,
  framed = false,
  style = {},
}: {
  s: Subject
  shape: "tall" | "wide" | "cover"
  radius?: string
  glow?: boolean
  height?: number | number[]
  width?: number | string
  framed?: boolean
  style?: Record<string, unknown>
}) {
  if (!s.poster) {
    return h(FallbackPanel, { hue: s.hue, height: height ?? C_POSTER_H, width, framed, style })
  }
  const hue = s.hue ?? 175
  return h("img", {
    src: s.poster,
    style: {
      borderRadius: radius,
      objectFit: shape === "cover" ? "cover" : "contain",
      ...(glow ? { boxShadow: mediaGlow(hue) } : {}),
      ...style,
    },
  })
}

/**
 * Scrim heights, derived from the caption box rather than chosen.
 *
 * `hero` is three lines by construction (Caption), so the caption block is a
 * known height. A scrim has to cover that block plus the byline plus padding,
 * or the caption escapes it -- which is exactly the bug that gave E a measured
 * 1.01:1 against a pale Poster.
 */
const CAPTION_BOX = (() => {
  const t = type_("hero")
  return Math.round(t.fontSize * t.lineHeight * LINES)
})()
const BYLINE_BOX = (() => {
  const t = type_("body-sm")
  return Math.round(t.fontSize * t.lineHeight)
})()
/**
 * How far above the type the scrim fades out. The fade carries no text, so it
 * can go all the way to transparent without touching contrast.
 */
const FADE = 130

/** The height that actually contains type, per variant. */
const TEXT_B = CAPTION_BOX + BYLINE_BOX + 26
/**
 * Overlay padding. **36, not the 80 the non-overlay variants use** — and that
 * reduction is forced, not chosen. A three-line caption is 280px and a byline
 * 44px; at 80px padding a scrim tall enough to keep contrast ends up 660px on a
 * 630px card, i.e. it covers the entire card and the "the Poster is the card"
 * variant shows no Poster at all. At 36 it fits and leaves the top ~180px of
 * image. An overlay card and the site's 80px safe area are not compatible; the
 * number the maintainer approves is the cost of choosing an overlay.
 */
const OVERLAY_PAD = 36
const SCRIM_B = TEXT_B + OVERLAY_PAD * 2 + FADE
const SCRIM_E = TEXT_B + OVERLAY_PAD * 2 + FADE

/**
 * The scrim gradient, split at the text region.
 *
 * Below the type the scrim is fully opaque, so contrast under the caption is
 * fixed no matter what the Poster is doing -- which is the whole point, since
 * 64 of297 Posters are more than 90% near-white app chrome. Above the type,
 * where there is none, it fades to nothing so the Poster is not cut off by a
 * grey band with a hard edge. That hard edge is what the first version had, and
 * it made the overlay variants look like a mistake rather than a choice.
 */
/**
 * C's Poster height, budgeted rather than chosen. C stacks poster + caption +
 * byline vertically in a centred column, and with a three-line caption the first
 * version's 330px Poster left no room -- the byline was pushed off the bottom of
 * the card and clipped, which is the one thing a card must never do. 630 - the
 * caption block - the byline - the gaps - the accent rule - the two safe-area
 * margins is what is actually available.
 */
const C_POSTER_H = 250
/**
 * ...and C's Poster is also capped at 560px wide. Those two caps fight: a
 * landscape Poster (1.7778) at 250px tall is 444px wide and fits, but the
 * CENTRED column then pushed it off the top of the card -- the audit caught ink
 * in the top 3px on five of C's renders. The fix is to bound the Poster by the
 * space the card actually has above the caption, which is what C_POSTER_H is
 * for, and to keep the width cap below the card's own content width so a wide
 * Poster cannot reach the edge either.
 */
const C_POSTER_MAX_W = 460

const scrimGradient = (textH: number, totalH: number) => {
  // `to top` puts 0% at the bottom, so the opaque region is the BOTTOM
  // `textH` pixels -- which is the text region plus its padding. The remaining
  // FADE is above it and fades out. Getting this backwards paints the fade over
  // the caption, which measured 1.58:1 on a pale Poster.
  const solid = Math.round((textH / totalH) * 100)
  return `linear-gradient(to top, ${C.scrim} 0%, ${C.scrim} ${solid}%, rgba(4,5,8,0.5) ${Math.min(solid + 6, 99)}%, rgba(4,5,8,0) 100%)`
}

// -- A. Device ------------------------------------------------------------
// Betting: the Poster reads as a screen recording in motion, which is what the
// site actually sells. The phone is the proof.

function VariantA(s: Subject): ReactNode {
  const hue = s.hue ?? 175
  // 454px of height; the frame's width follows the Poster, capped so a very wide
  // Poster cannot swallow the text column.
  const aspect = s.aspect ?? 0.46
  const deviceWidth = Math.round(Math.min(454 * aspect, 520))
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        background: C.canvas,
        padding: PAD,
        gap: 48,
      },
    },
    // text column. 560 rather than 500: at K=2.8 the longest caption needs
    // three lines, and a narrower column pushes it to five.
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", flexShrink: 0, width: 604, gap: 16 } },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 12 } },
        h(Wordmark, { size: 22 }),
        h("div", { style: { width: 4, height: 4, borderRadius: 2, background: C.t3 } }),
        h("div", { style: { display: "flex", flexShrink: 0 } }, h(Label, { children: s.category }))
      ),
      h(Caption, { text: s.caption, maxWidth: 604, step: "hero" }),
      // No initials block here, deliberately. The widest name in the catalogue
      // needs 543px (measured, all 23) and this column is 560px, so a 40px disc
      // plus its gap forces `Enzo Manuel Mangano (Reactiive)` to truncate. The
      // name IS the Contributor's identity (CONTEXT.md); the initials block is
      // decoration, so the name wins and the disc is dropped. Variant D has a
      // 660px column and keeps both.
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 12, marginTop: 2 } },
        h("div", { style: { width: 8, height: 8, borderRadius: 4, background: `hsl(${hue},70%,60%)`, flexShrink: 0 } }),
        h(Byline, { contributor: s.contributor, color: C.t2, maxWidth: 604 })
      )
    ),
    // the device: a plinth, and the Poster standing on it
    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          flexGrow: 1,
          height: "100%",
        },
      },
      h("div", {
        style: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: C.line,
        },
      }),
      // The device frame follows the Poster's REAL shape.
      //
      // The ticket's premise was "a 0.46-ratio Poster on a 1.91-ratio card" and
      // "every Recording card therefore has a vertical image". **Measured: 195
      // of 297 Posters are phone-shaped, and 77 are wider than 0.8 -- up to
      // 1.7778.** A hard-coded phone shell therefore put a landscape screenshot
      // inside a portrait frame with two dead black bands, on a quarter of the
      // catalogue. So the shell is sized from `aspect`, and a wide Poster gets a
      // wide frame rather than a lie about its shape.
      h(
        "div",
        {
          style: {
            padding: 8,
            background: C.panel,
            // A phone gets a generous radius; a wide frame gets a small one,
            // because a 34px radius on a 560px-wide frame reads as a lozenge.
            borderRadius: aspect >= 1 ? 18 : 34,
            boxShadow: `0 0 0 1px ${C.line2}, ${mediaGlow(hue)}`,
            display: "flex",
            height: 470,
          },
        },
        h(Poster, {
          s, shape: "tall", radius: aspect >= 1 ? 10 : 26, glow: false,
          height: 454, width: deviceWidth, framed: true,
          style: { height: 454, width: deviceWidth },
        })
      )
    )
  )
}

// -- B. Bleed -------------------------------------------------------------
// Betting: the Poster is the card. Maximum image, minimum chrome.
// The catch this variant exists to price: cover keeps 25% of a portrait.

function VariantB(s: Subject): ReactNode {
  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        background: C.canvas,
      },
    },
    s.poster
      ? h("img", {
          src: s.poster,
          width: "100%",
          height: "100%",
          style: { objectFit: "cover", objectPosition: "center" },
        })
      : h("div", { style: { position: "absolute", inset: 0, display: "flex", background: `linear-gradient(160deg, hsla(${s.hue ?? 175},45%,22%,0.55), hsla(${s.hue ?? 175},45%,12%,0.25))` } }),
    // The scrim. `--scrim` is a flat 0.74 over canvas; a gradient is used
    // instead because Satori cannot blend, and a flat one would paint over the
    // whole frame rather than only where the text sits.
    // The scrim is sized FROM the text block, never guessed. Measured: with a
    // hand-picked 340px scrim the caption cleared 4.5:1 on 2 of 4 subjects and
    // failed on the rest (1.01-2.93:1), because a pale Poster shows through
    // wherever the gradient thins. Sizing it from the text plus a solid floor
    // is what makes it pass on every Poster rather than on the dark ones.
    h("div", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: SCRIM_B,
        background: scrimGradient(TEXT_B + OVERLAY_PAD * 2, SCRIM_B),
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: OVERLAY_PAD,
        gap: 12,
      },
    },
      h(Label, { children: s.category }),
      h(Caption, { text: s.caption, maxWidth: 900, step: "hero" }),
      h(Byline, { contributor: s.contributor, color: C.t2, maxWidth: 660 })
    ),
    h("div", {
      style: {
        position: "absolute",
        top: PAD / 2,
        left: PAD / 2,
        display: "flex",
      },
    }, h(WordmarkOnImage, { size: 20 }))
  )
}

// -- C. Stage -------------------------------------------------------------
// Betting: the Poster is a specimen on a plinth, centred, with the caption
// beneath it — the Recording detail page's own composition, at card size.

function VariantC(s: Subject): ReactNode {
  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: C.canvas,
      },
    },
    h("div", { style: { position: "absolute", top: PAD / 2, left: PAD / 2, display: "flex" } }, h(Wordmark, { size: 20 })),
    h("div", { style: { position: "absolute", top: PAD / 2, right: PAD / 2, display: "flex" } }, h(Label, { children: s.category })),
    // The Poster is ANCHORED, not centred. C used to centre the whole column, so
    // the column's height decided where the top landed -- and that height grows
    // with the caption, which pushed the Poster off the top of the card on every
    // three-line caption. The edge audit caught it; looking did not.
    h(
      "div",
      {
        style: {
          position: "absolute",
          top: PAD,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        },
      },
      h(Poster, {
        s, shape: "tall",
        height: C_POSTER_H,
        width: Math.round(Math.min(C_POSTER_H * (s.aspect ?? 0.46), C_POSTER_MAX_W)),
        style: {
          height: C_POSTER_H,
          width: Math.round(Math.min(C_POSTER_H * (s.aspect ?? 0.46), C_POSTER_MAX_W)),
          display: "flex",
          flexShrink: 0,
        },
      })
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          // Below the Poster, whatever shape it is.
          top: PAD + C_POSTER_H + 26,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        },
      },
      h(Caption, { text: s.caption, maxWidth: 900, step: "hero", color: C.t1 }),
      h(Byline, { contributor: s.contributor, color: C.t3, maxWidth: 900 })
    ),
    // **No accent rule here.** Four attempts at placing one failed the same way
    // for the same reason: C's column height depends on the caption, so any fixed
    // offset collides with the byline on a long caption and floats away on a
    // short one -- it struck through `Enzo Manuel Mangano` twice. It was
    // decoration, the hue already speaks through --media-glow, and a rule
    // through a Contributor's name is worse than no rule. If one is wanted later
    // it belongs inside the byline's own flow, not on the card's edge.
  )
}

// -- D. Split -------------------------------------------------------------
// Betting: the caption is the message and the Poster is evidence beside it, so
// the Poster gets its true ratio and is never cropped. The widest text column.

function VariantD(s: Subject): ReactNode {
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
          padding: PAD,
          gap: 16,
          // 820 is the BORDER box; content is 820 - 160 = 660, of which the
          // 40px initials disc and 14px gap leave 606 for the byline. The
          // earlier 660 was read as a content width and silently meant 500,
          // which is why the widest name clipped in every D render.
          width: 820,
          flexShrink: 0,
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 } },
        h(Wordmark, { size: 22 }),
        h("div", { style: { width: 4, height: 4, borderRadius: 2, background: C.t3 } }),
        h(Label, { children: s.category })
      ),
      h(Caption, { text: s.caption, maxWidth: 660, step: "hero" }),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 14, marginTop: 4 } },
        h(Initials, { name: s.contributor, hue }),
        h(Byline, { contributor: s.contributor, color: C.t2, maxWidth: 604 })
      )
    ),
    // Poster at true ratio, right-aligned, bleeding to both edges vertically
    h(
      "div",
      {
        style: {
          position: "relative",
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.rail,
          boxShadow: e0(),
        },
      },
      h(Poster, {
        s, shape: "tall",
        height: 470,
        // D is the one layout that can afford a wide Poster, because its rail is
        // the full remaining width -- but it is still capped at 520 so the frame
        // cannot eat the whole card.
        width: Math.round(Math.min(470 * (s.aspect ?? 0.46), 520)),
        style: {
          height: 470,
          width: Math.round(Math.min(470 * (s.aspect ?? 0.46), 520)),
          maxHeight: 470,
          display: "flex",
        },
      })
    )
  )
}

// -- E. Poster-first ------------------------------------------------------
// Betting: the share is a picture of the animation, and one line of type is
// enough. The most minimal of the five, and the one that tests whether a card
// needs words at all.

function VariantE(s: Subject): ReactNode {
  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        background: C.canvas,
      },
    },
    // The Poster fills the card, cropped — the one variant that accepts the
    // 25% and leans on it, so the crop can be judged rather than assumed.
    s.poster
      ? h("img", { src: s.poster, width: "100%", height: "100%", style: { objectFit: "cover" } })
      : h("div", { style: { position: "absolute", inset: 0, display: "flex", background: `linear-gradient(160deg, hsla(${s.hue ?? 175},45%,22%,0.55), hsla(${s.hue ?? 175},45%,12%,0.25))` } }),
    // Same rule as B, and this is where it was caught: E's scrim was a literal
    // 200px while a three-line caption at K=2.8 is 280px, so the top third of
    // the caption sat on bare Poster and measured 1.01:1 -- white text on a
    // white Poster. Derived from the text instead.
    h("div", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: SCRIM_E,
        background: scrimGradient(TEXT_B + OVERLAY_PAD * 2, SCRIM_E),
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: 36,
        gap: 24,
      },
    },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 } },
        h(Caption, { text: s.caption, maxWidth: 700, step: "hero" }),
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 10 } },
          h("div", { style: { width: 8, height: 8, borderRadius: 4, background: C.acc } }),
          h(Byline, { contributor: s.contributor, color: C.t2, maxWidth: 660 })
        )
      ),
      h(WordmarkOnImage, { size: 20 })
    )
  )
}

/**
 * The initials block. `lib/contributor-initials.ts` verbatim, on a disc sized
 * for the type rather than copied from the tile: the tile's 34px disc carries
 * 11px text, and scaling the disc by K while holding the text at `label` size
 * overflows it — measured, and it looked it. The disc is sized from the step.
 */
function Initials({ name, hue }: { name: string; hue: number }) {
  const t = type_("body-sm")
  const size = Math.round(t.fontSize * 1.9)
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
          ...type_("body-sm"),
          fontFamily: MONO,
          fontWeight: 500,
          color: C.t1,
          fontSize: Math.round(t.fontSize * 0.62),
          lineHeight: 1,
        },
      },
      initials(name)
    )
  )
}

/** lib/contributor-initials.ts, inlined: the same pure function. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
}

export const VARIANTS = [
  { key: "A", name: "Device", bet: "The Poster reads as a screen in motion", fn: VariantA },
  { key: "B", name: "Bleed", bet: "The Poster is the card; text rides on a scrim", fn: VariantB },
  { key: "C", name: "Stage", bet: "The Poster is a specimen, caption beneath", fn: VariantC },
  { key: "D", name: "Split", bet: "Caption leads, Poster is evidence, never cropped", fn: VariantD },
  { key: "E", name: "Poster-first", bet: "One line of type is enough", fn: VariantE },
] as const

export type VariantKey = (typeof VARIANTS)[number]["key"]

export function render(variant: VariantKey, s: Subject) {
  const v = VARIANTS.find((x) => x.key === variant)!
  // @ts-expect-error satori accepts an <img>
  return v.fn(s)
}