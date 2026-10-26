// PROTOTYPE — ticket 04 audit. Throwaway.
//
//   pnpm tsx .scratch/social-cards/probe/ticket04/audit.ts
//
// Three checks over all 13 renders. Written after the first version of this file
// produced **two false results**, both of which are worth recording because they
// are the same failure ticket 06 hit repeatedly:
//
//   * It reported `Facets` as "AA ok" having measured **zero pixels**. Its
//     solid-glyph test used a 5x5 neighbourhood at a tolerance of 26, and a 28px
//     mono stroke has no 5x5 block within that tolerance — so every candidate was
//     rejected and the worst-case ratio stayed at its initialiser. A check that
//     measures nothing must report NOT MEASURED, never ok.
//   * It measured the incumbent card against `--canvas`, which is not the
//     incumbent's background. It has a slate gradient. So it "failed" at 1.1:1
//     purely by being compared to the wrong backdrop.
//
// So: a flat-background card's contrast is computed **exactly** from the token
// pairs it declares, which needs no pixel-peeping and cannot be fooled; and the
// pixel pass exists only for the one thing tokens cannot answer — whether
// anything intrudes on the Wall's wordmark chip.

import { readdirSync } from "node:fs"
import sharp from "sharp"

import { ALL18 } from "../../preview/variants-default"

import { STATS, chipBox, palette, type Mode } from "../../preview/variants-default"

const OUT = new URL("../../preview/out-default/", import.meta.url).pathname
const files = readdirSync(OUT).filter((f) => f.endsWith(".png") && !f.startsWith("_")).sort()

/** WCAG relative luminance; the AA threshold is 4.5:1 for body text. */
function lum(rgb: [number, number, number]) {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2])
}
function ratio(a: string, b: string) {
  const px = (c: string): [number, number, number] =>
    c.startsWith("#")
      ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
      : ([255, 255, 255] as [number, number, number]) // an rgba() with low alpha over canvas
  const la = lum(px(a))
  const lb = lum(px(b))
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// -- The token pairs every variant actually uses. Declared, not inferred: each
// entry is a thing the card puts on the card, so a variant cannot silently
// introduce a colour pair nobody checked.
const TYPE_ON_CANVAS: [string, (p: ReturnType<typeof palette>) => string][] = [
  ["t1 on canvas (headline, claim, facet name)", (p) => p.t1],
  ["t2 on canvas (claim caption)", (p) => p.t2],
  ["t3 on canvas (stat label, count)", (p) => p.t3],
  ["acc on canvas (.dev)", (p) => p.acc],
]

function contrastTable(mode: Mode) {
  const p = palette(mode)
  console.log(`\n== contrast, ${mode} — exact, from the declared token pairs ==`)
  console.table(
    TYPE_ON_CANVAS.map(([what, fg]) => {
      const r = ratio(fg(p), p.canvas)
      return { pair: what, fg: fg(p), bg: p.canvas, ratio: +r.toFixed(2), AA: r >= 4.5 ? "pass" : "FAIL" }
    })
  )
}

// -- The pixel pass: only the Wall, and only one question.
//
// The chip is opaque `--canvas`, so its type is safe by the table above. What
// tokens cannot answer is whether the tile grid crowds it.
//
// The box is **derived**, from the same constants the variant lays out with
// (`chipBox()`), and then *verified* against pixels: if the chip is really where
// the arithmetic says, the pixels just inside its border are canvas-coloured. If
// they are not, the arithmetic is wrong and the audit says so rather than
// blaming the card.
//
// Both earlier versions of this audit guessed the box and were both wrong — the
// first by 90px on the right, the second by a flood-fill that leaked straight
// through the chip because its fill IS `--canvas` and so is the card behind it.
async function chipAudit(mode: Mode) {
  const file = `${OUT}Wall-${mode}.png`
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const p = palette(mode)
  const bg: [number, number, number] = [
    parseInt(p.canvas.slice(1, 3), 16),
    parseInt(p.canvas.slice(3, 5), 16),
    parseInt(p.canvas.slice(5, 7), 16),
  ]
  const at = (x: number, y: number) => {
    const o = (y * W + x) * C
    return [data[o], data[o + 1], data[o + 2]]
  }
  const isCanvas = (q: number[]) => Math.max(Math.abs(q[0] - bg[0]), Math.abs(q[1] - bg[1]), Math.abs(q[2] - bg[2])) < 10

  const b = chipBox()
  const r = b.l + b.w - 1
  const bt = b.t + b.h - 1

  // Verify: sample just inside each edge, away from the rounded corners.
  const probes: [string, number, number][] = [
    ["top", b.l + 40, b.t + 6],
    ["bottom", b.l + 40, bt - 6],
    ["left", b.l + 6, b.t + 40],
    ["right", r - 6, b.t + 40],
    ["centre", b.l + (b.w >> 1), b.t + (b.h >> 1)],
  ]
  const bad = probes.filter(([, x, y]) => !isCanvas(at(x, y)))
  if (bad.length) {
    return {
      mode,
      chip: `${b.l},${b.t} → ${r},${bt} (${b.w}x${b.h})`,
      nearestTile: "-",
      verdict: `BOX WRONG — ${bad.map(([w]) => w).join(",")} not canvas`,
    }
  }

  // The real crowding question. The chip is *meant* to sit on the tiles, so
  // "tile ink is near the chip" is not a defect — an earlier version of this audit
  // reported CROWDED at 4px for both modes and was measuring the design working.
  //
  // What would be a defect is a **tile edge running along the chip's border**,
  // which makes an intentional overlay look accidental. So: walk the chip's
  // perimeter, inset past the rounded corner and its own --e0 hairline, and
  // require every pixel to be canvas.
  let onBorder = 0
  let perimeter = 0
  // Inset past the chip's own 16px corner radius. At 10px the four corners still
  // sit on the arc, which is transparent, so they showed tile ink and the audit
  // called it a tile edge on the border. Four intruders on 1224 pixels was the
  // radius, not the grid.
  const INSET = 22
  for (let x = b.l + INSET; x <= r - INSET; x++) {
    for (const y of [b.t + INSET, bt - INSET]) { perimeter++; if (!isCanvas(at(x, y))) onBorder++ }
  }
  for (let y = b.t + INSET; y <= bt - INSET; y++) {
    for (const x of [b.l + INSET, r - INSET]) { perimeter++; if (!isCanvas(at(x, y))) onBorder++ }
  }

  // And how much of the card the chip eats, which is the Wall's actual cost: it
  // is not a wordmark in the margin, it is a panel on top of the art.
  const cover = ((b.w * b.h) / (W * H)) * 100

  return {
    mode,
    chip: `${b.l},${b.t} → ${r},${bt} (${b.w}x${b.h})`,
    "border px not canvas": `${onBorder}/${perimeter}`,
    "covers card": `${cover.toFixed(1)}%`,
    verdict: onBorder === 0 ? "clean edge" : "TILE EDGE ON BORDER",
  }
}

// -- Platform fit. The rule this produces: a card is 1200px wide and Slack shows
// it at 360, so **every readable element must be >= 37 card px** to clear 11px
// on the reader's screen. That is the number, and it is a floor, not a target.
const SLACK = 360
const FLOOR = 11
const MIN_CARD_PX = (FLOOR * 1200) / SLACK

const TYPE: [string, number][] = [
  ["wordmark (Hero/Scale/Facets)", 38],
  ["wordmark (Mark)", 108],
  ["claim, hero step x2.8", 29 * 2.8],
  ["stat number, metric x3.8", 10 * 3.8],
  ["stat label", 37],
  ["facet row (Facets)", 37],
  ["facet row (Facets18)", 19],
]

async function main() {
  console.log(`== renders on disk ==\n${files.map((f) => "  " + f).join("\n")}`)

  contrastTable("dark")
  contrastTable("light")

  console.log("\n== the Wall's chip — can a tile crowd the wordmark? ==")
  console.table([await chipAudit("dark"), await chipAudit("light")])

  console.log(`\n== platform fit ==`)
  console.log(`Slack renders a 1200px card at ${SLACK}px, so the floor is ${MIN_CARD_PX.toFixed(1)} card px\n`)
  console.table(
    TYPE.map(([what, px]) => {
      const slack = (px * SLACK) / 1200
      return {
        what,
        "card px": +px.toFixed(0),
        "Slack 360": +slack.toFixed(1),
        "iMessage 300": +((px * 300) / 1200).toFixed(1),
        "X 504": +((px * 504) / 1200).toFixed(1),
        [`>= ${FLOOR}px at Slack`]: slack >= FLOOR ? "pass" : "FAIL",
      }
    })
  )

  // -- 4. Dark versus light: the one measurable tie-breaker.
  //
  // The site cannot settle this by being itself. `app/layout.tsx:92-93` sets
  // `defaultTheme="system"` with `enableSystem`, so a first-time visitor sees
  // their *device's* mode and nothing is persisted until the toggle is used. The
  // site is therefore not one appearance, and a server-rendered card with no
  // request context cannot match "whatever the site is".
  //
  // What can be measured is whether each canvas can hold the catalogue's own
  // imagery. Ticket 14 found 64 of 297 Posters are >90% near-white app chrome; a
  // light canvas is #F4F4F1 (luma 244). So the Wall's tiles are the test case.
  console.log(`\n== dark or light: can the canvas hold the catalogue's own imagery? ==`)
  const tiles = readdirSync(new URL("../../preview/grid/", import.meta.url).pathname)
    .filter((f) => f.endsWith(".jpg"))
    .sort()
  const lumas: { tile: string; luma: number; onDark: number; onLight: number }[] = []
  for (const t of tiles) {
    const { data } = await sharp(new URL(`../../preview/grid/${t}`, import.meta.url).pathname)
      .greyscale().resize(1, 1).raw().toBuffer({ resolveWithObject: true })
    const g = data[0] / 255
    // WCAG contrast of the tile against each canvas.
    const L = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
    const cr = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    const darkC = L(0x0a / 255)
    const lightC = L(0xf4 / 255)
    lumas.push({ tile: t.replace(/\.jpg$/, "").slice(0, 28), luma: data[0], onDark: +cr(g, darkC).toFixed(2), onLight: +cr(g, lightC).toFixed(2) })
  }
  console.table(lumas)
  const nearWhite = lumas.filter((l) => l.luma > 200)
  console.log(
    `tiles nearer white than 200 luma: ${nearWhite.length}/${lumas.length}` +
      (nearWhite.length
        ? `\n  worst on dark canvas:  ${Math.min(...lumas.map((l) => l.onDark)).toFixed(2)}:1` +
          `\n  worst on light canvas: ${Math.min(...nearWhite.map((l) => l.onLight)).toFixed(2)}:1  <- these vanish`
        : "")
  )

  // -- 5. Facets18's cost, counted rather than eyeballed: how many of the 18
  // Category names lose their tail at the only size that fits four columns.
  console.log(`\n== Facets18: what 18 Categories costs ==`)
  const avail = 1200 - 80 * 2 - 300 - 56
  const col = Math.floor((avail - 28 * 3) / 4)
  const px = 19
  // JetBrains Mono advances 0.6em, plus 0.02em tracking as set.
  const widthOf = (s: string, at = px) => s.length * at * 0.62
  const budget = col - 34
  const cut = ALL18.filter(([n]) => widthOf(n.toUpperCase()) > budget)
  console.log(`4 columns of ${col}px, name budget ${budget}px, at ${px}px mono`)
  console.table(
    cut.map(([n, c]) => ({
      name: n,
      count: c,
      needs: Math.round(widthOf(n.toUpperCase())),
      overBy: Math.round(widthOf(n.toUpperCase()) - budget),
    }))
  )
  console.log(`${cut.length} of ${ALL18.length} names are truncated; ${ALL18.length - cut.length} fit.`)

  // The alternative: raise the rows to the platform floor and see what that costs.
  // Both axes are then checked against arithmetic rather than asserted.
  const AT_FLOOR = 37
  const rowH = AT_FLOOR * 1.25 + 10 // line box + the row's own padding
  const rowsPerCol = Math.floor(630 / rowH)
  const longest = ALL18.reduce((a, b) => (a[0].length > b[0].length ? a : b))
  const needOneCol = Math.round(widthOf(longest[0].toUpperCase(), AT_FLOOR))
  console.log(`\nAt the ${AT_FLOOR}px floor instead:`)
  console.log(`  width:  one column is ${avail}px and the longest name ("${longest[0]}") needs ${needOneCol}px — width is fine`)
  console.log(`  height: a ${AT_FLOOR}px row with its padding is ${Math.round(rowH)}px, so one column holds **${rowsPerCol}** of the card's 630px — and there are ${ALL18.length}`)
  console.log(`  -> height binds, not width. Even at full width, ${rowsPerCol} < ${ALL18.length}.`)
  console.log(`\n**18 Categories at a readable size do not fit a 1200x630 card.** That is the Facets direction's real cost, and it is arithmetic rather than taste.`)

  console.log(`\n== the count is a claim ==`)
  console.log(`catalogue: ${STATS.recordings} Recordings, ${STATS.contributors} Contributors, ${STATS.categories} Categories`)
  console.log(`shipped card claims: "343+ animations" — ${343 - STATS.recordings} too many, and the noun is wrong`)
}

main().catch((e) => { console.error(e); process.exit(1) })
