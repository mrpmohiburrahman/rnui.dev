// PROTOTYPE — ticket 06, the Recording card. Throwaway; nothing ships.
//
// The Design's tokens, as literals. Ticket 02 established that CSS custom
// properties do not resolve in ImageResponse, so every value here is spelled
// out. Dark mode, because the current card is dark and a card is rendered with
// no visitor preference in hand (ticket 04's open question, answered dark here
// and put to the maintainer).
//
// app/globals.css:249-285 (.dark) is the source for every colour;
// tailwind.config.ts is the source for every step.

export const C = {
  canvas: "#0A0B0D",
  panel: "#101216",
  rail: "#0C0D11",
  t1: "#F1F2F4",
  t2: "#B2B8C2",
  t3: "#8E949F",
  acc: "#6FE3CC",
  onAcc: "#06120F",
  line: "rgba(255,255,255,0.11)",
  line2: "rgba(255,255,255,0.22)",
  scrim: "rgba(4,5,8,0.74)",
  xbg: "rgba(255,255,255,0.13)",
  newFg: "#F3DEA6",
} as const

// The four borderRadius steps, Specimen.dc.html:146-149.
export const R = { tile: "16px", panel: "12px", chip: "9px", badge: "6px" } as const

// --media-glow keys on --tile-hue, so the Recording's own measured hue tints
// its frame. hsla() survives because Satori parses colour strings, not vars.
export function mediaGlow(hue: number) {
  return `0 0 0 1px hsla(${hue},60%,62%,0.26), 0 40px 120px -32px hsla(${hue},70%,58%,0.5)`
}
export function e0() {
  return "0 0 0 1px rgba(255,255,255,0.07)"
}

/**
 * The seven type steps, and the scale problem.
 *
 * tailwind.config.ts's steps are sized for a browser at 1x: `detail` is 36px on
 * a 380px-wide grid tile. A card is 1200px wide and is *seen* at roughly 400px
 * in a chat client, so a literal 36px lands at ~12px on the reader's screen —
 * a caption nobody can read. The steps are therefore used as ratios: scaled by
 * K, which keeps the Design's *steps* (their order, weights, tracking and
 * leadings) while admitting a card is a different surface from a tile.
 *
 * **K is bounded above by the longest caption in the catalogue, and measured.**
 * Geometrically 1200/380 = 3.16 is the factor that would make a card's type
 * land at the same on-screen size as the tile's. But `detail` at 3.16 is 114px,
 * and the longest caption — `Spread Cards Effect ( Color Swatch )`, 36 chars,
 * 290 distinct captions measured — needs five lines at that size in a 520px
 * column. Satori has no line-clamp and `gap` does not stop two siblings from
 * overlapping, so a five-line headline silently collides with the byline
 * beneath it. Rendered and ink-counted: K=3.16 → 5 lines, clipped; K=2.8 → 3
 * lines, 320px of headroom.
 *
 * **K = 2.8** is therefore the chosen factor: the largest at which every
 * caption in the catalogue fits a card's text column in three lines. It is a
 * measured bound rather than a taste call, and the measurement is the part that
 * matters — an estimate would have shipped a clipped card.
 */
export const K = 2.8

export type TypeStep =
  | "detail"
  | "hero"
  | "section"
  | "tile-title"
  | "body-sm"
  | "metric"
  | "label"

/** fontSize/lineHeight/fontWeight/letterSpacing, from tailwind.config.ts. */
export function type_(step: TypeStep) {
  switch (step) {
    case "detail":
      return { fontSize: 36 * K, lineHeight: 1.12, fontWeight: 500, letterSpacing: "-0.025em" }
    case "hero":
      return { fontSize: 29 * K, lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em" }
    case "section":
      return { fontSize: 17 * K, lineHeight: 1.25, fontWeight: 500, letterSpacing: "-0.01em" }
    case "tile-title":
      return { fontSize: 14.5 * K, lineHeight: 1.32, fontWeight: 500, letterSpacing: "-0.01em" }
    case "body-sm":
      return { fontSize: 12 * K, lineHeight: 1.32, fontWeight: 400, letterSpacing: "0" }
    case "metric":
      return { fontSize: 10 * K, lineHeight: 1.2, fontWeight: 400, letterSpacing: "0" }
    case "label":
      return { fontSize: 9 * K, lineHeight: 1.2, fontWeight: 400, letterSpacing: "0.14em" }
  }
}

/** The mono steps name no family inside the tuple; they are drawn with this. */
export const MONO = "JetBrains Mono"
export const SANS = "Space Grotesk"

/** The Design's seven spacing steps, Specimen.dc.html:155-159, in card px. */
export const PAD = 40 * 2 // 80 — the existing card's own padding, kept