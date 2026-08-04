/**
 * studio-dark ticket 13, step 7 — contrast in composition.
 *
 * The spec's method, word for word: for each pair, composite the mock's own
 * rgba() layers over #000000 and over #FFFFFF (the two extremes a Poster can
 * present), compute the WCAG 2.x ratio of the composited foreground against the
 * composited background, and take the worse of the two. #FFFFFF is not a real
 * Poster; it is the bound — a pair that clears it clears every Poster.
 *
 * Where the chip sits inside the media box, the box carries
 * `brightness(0.78) saturate(0.85)` (Tile.dc.html:99). That filters the
 * background the chip sits on, so we composite the chip over the already-filtered
 * media box (canvas-tinted), because the chip's own fill is inside the box.
 *
 * Run: tsx scripts/checkpoint-13-contrast.ts
 * Output: the table for .scratch/studio-dark/checkpoint-13-gate.md.
 */

type RGBA = [number, number, number, number]

// Parse "rgb(r, g, b)" / "rgba(r, g, b, a)" — with or without spaces.
function parse(rgba: string): RGBA {
  const m = rgba.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/)
  if (!m) throw new Error(`cannot parse ${rgba}`)
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
}

// Composite a foreground layer over an already-composited background (premultiplied alpha).
function composite(bg: RGBA, fg: RGBA): RGBA {
  const a = fg[3]
  return [
    fg[0] * a + bg[0] * (1 - a),
    fg[1] * a + bg[1] * (1 - a),
    fg[2] * a + bg[2] * (1 - a),
    1, // the result is opaque once flattened
  ]
}

// Apply CSS brightness()/saturate() to an RGB triple (alpha irrelevant — operates on colour).
function applyBrightness(c: [number, number, number], brightness: number, saturate: number): [number, number, number] {
  // saturate by luma
  const luma = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  const sat = [
    luma + (c[0] - luma) * saturate,
    luma + (c[1] - luma) * saturate,
    luma + (c[2] - luma) * saturate,
  ]
  return [sat[0] * brightness, sat[1] * brightness, sat[2] * brightness]
}

function luminance([r, g, b]: RGBA): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function ratio(a: RGBA, b: RGBA): number {
  const la = luminance(a)
  const lb = luminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

const BLACK: RGBA = [0, 0, 0, 1]
const WHITE: RGBA = [255, 255, 255, 1]
// The media box background the chips sit on — canvas, dark (0A0B0D) / light (F4F4F1).
const CANVAS_DARK: RGBA = parse("rgb(10,11,13)")
const CANVAS_LIGHT: RGBA = parse("rgb(244,244,241)")

interface Pair {
  name: string
  fg: string
  bg: string
  // bright = the bg is the media box under brightness(0.78) saturate(0.85)
  brightnessTrap?: boolean
}

const pairs: Pair[] = [
  {
    name: "❙❙ PAUSED / ❙❙ STILLS ONLY",
    fg: "rgba(255,255,255,0.72)",
    bg: "rgba(4,6,10,0.62)",
    brightnessTrap: true,
  },
  { name: "● LIVE, dark", fg: "#8FF0DC", bg: "rgba(111,227,204,0.20)" },
  { name: "● LIVE, light", fg: "#8FF0DC", bg: "rgba(6,20,18,0.72)" },
  { name: "NEW, dark", fg: "#F3DEA6", bg: "rgba(235,208,138,0.22)" },
  { name: "NEW, light", fg: "#5C4204", bg: "rgba(255,238,190,0.94)" },
  { name: "◺ DECODE FAILED", fg: "#F5B3A4", bg: "rgba(4,5,8,0.9)" },
  { name: "failure message", fg: "rgba(255,255,255,0.86)", bg: "rgba(4,5,8,0.9)" },
]

function evalPair(p: Pair): { black: number; white: number; worse: number } {
  const fg = p.fg.startsWith("#") ? ((): RGBA => {
    const h = p.fg.slice(1)
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]
  })() : parse(p.fg)

  let bgDark = parse(p.bg)
  let bgLight = parse(p.bg)

  if (p.brightnessTrap) {
    // The chip sits inside the media box, which is the canvas at brightness 0.78
    // saturate 0.85. Composite the translucent fill over the (filtered) canvas first,
    // then put the chip on top.
    const filteredDark = applyBrightness([CANVAS_DARK[0], CANVAS_DARK[1], CANVAS_DARK[2]], 0.78, 0.85)
    const filteredLight = applyBrightness([CANVAS_LIGHT[0], CANVAS_LIGHT[1], CANVAS_LIGHT[2]], 0.78, 0.85)
    const boxDark = composite(CANVAS_DARK, [filteredDark[0], filteredDark[1], filteredDark[2], 1])
    const boxLight = composite(CANVAS_LIGHT, [filteredLight[0], filteredLight[1], filteredLight[2], 1])
    bgDark = composite(boxDark, bgDark)
    bgLight = composite(boxLight, bgLight)
  }

  const darkComposite = composite(BLACK, bgDark)
  const whiteComposite = composite(WHITE, bgLight)

  const onBlack = ratio(composite(darkComposite, fg), darkComposite)
  const onWhite = ratio(composite(whiteComposite, fg), whiteComposite)
  return { black: onBlack, white: onWhite, worse: Math.min(onBlack, onWhite) }
}

console.log("| Pair | over black | over white | worse | pass 4.5 |")
console.log("|---|---|---|---|---|")
let failing = 0
let passing = 0
for (const p of pairs) {
  const r = evalPair(p)
  const pass = r.worse >= 4.5
  if (pass) passing++
  else failing++
  console.log(
    `| ${p.name} | ${r.black.toFixed(2)}:1 | ${r.white.toFixed(2)}:1 | **${r.worse.toFixed(2)}:1** | ${pass ? "✅" : "❌"} |`
  )
}
console.log(`\n${passing} pass the 4.5:1 bar at their worse bound; ${failing} fail.`)
console.log("Per spec step 7, every failing pair is recorded in the checkpoint file and handed")
console.log("to the maintainer as ready-for-human — the mock ships as drawn, so a failing colour")
console.log("is the maintainer's call to repaint, not this ticket's.")
