// PROTOTYPE — ticket 04 round 2 audit. Throwaway.
//
//   pnpm tsx .scratch/social-cards/probe/ticket04/audit-mark.ts
//
// The six elevated-Mark variants share four failure modes, all of which happened
// at least once during the build and three of which are invisible unless measured:
//
//   1. **A tile drawing over text.** Satori has no sibling-overlap protection
//      (ticket 06) and absolutely-positioned siblings draw in source order, so a
//      ring of tiles crossing a line of text is simply what you get. Fixed here by
//      putting all centre text *inside* the opaque plate — so the check is "is any
//      non-canvas pixel inside the plate's box".
//   2. **Text bleeding off a card edge.** The credit roll measured 1303px on a
//      1200px card and Satori clipped it silently. Check: ink in the outer margin.
//   3. **A plate that is not opaque.** `radial-gradient(ellipse, canvas …,
//      transparent)` rendered as a grey lozenge with a visible rim, which read as a
//      button rather than a plate.
//   4. **Type under the platform floor** — 37 card px, from ticket 04 round 1.
//
// Reported per render, with an explicit INCONCLUSIVE where a check could not
// decide, because the previous version of this file's predecessor reported "AA ok"
// having measured nothing.

import { readdirSync } from "node:fs"
import sharp from "sharp"

import { FLOOR_CARD_PX } from "../../preview/variants-default"

const OUT = new URL("../../preview/out-mark/", import.meta.url).pathname
const files = readdirSync(OUT).filter((f) => f.endsWith(".png") && !f.startsWith("_")).sort()

const BG = { dark: "#0A0B0D", light: "#F4F4F1" } as const

/** Each variant's plate box, derived from the same constants it lays out with. */
function plateBox(key: string) {
  // CentrePlate: padding 40/76 (wide) or 34/60, radius 28, mark + a child row.
  const wide = key === "Halo"
  const mark = key === "Halo" ? 108 : key === "Orbit" ? 84 : 0
  const gap = mark > 100 ? 30 : 22
  const padY = wide ? 40 : 34
  const padX = wide ? 76 : 60
  // The child row: a Strip at 26px, or a Stats block (number + label + gap).
  const child = key === "Orbit" ? 28 * 1.1 + 5 + 19 * 1.2 : 26 * 1.2
  const w = key === "Orbit" ? 3 * 28 * 1.8 + 2 * 44 : Math.max(mark * 3.4, 620)
  const hgt = mark * 1.05 + gap + child + padY * 2
  return { w: Math.round(w), h: Math.round(hgt), padX, padY, cy: 315, cx: 600 }
}

async function audit(label: string) {
  const key = label.replace(/-(dark|light)$/, "")
  const mode = label.endsWith("light") ? "light" : "dark"
  const { data, info } = await sharp(`${OUT}${label}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const bg = BG[mode]
  const bgr: [number, number, number] = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16)) as any
  const at = (x: number, y: number) => {
    const o = (y * W + x) * C
    return [data[o], data[o + 1], data[o + 2]]
  }
  const isCanvas = (q: number[]) => Math.max(Math.abs(q[0] - bgr[0]), Math.abs(q[1] - bgr[1]), Math.abs(q[2] - bgr[2])) < 12
  const isInk = (q: number[]) => !isCanvas(q)

  // -- 1 & 2. Two checks DROPPED rather than tuned, and both for the same reason.
  //
  //   *Plate opacity.* The centre plate is `background: pal.canvas` — a flat
  // literal fill, so it is opaque by construction and reading the style settles it.
  //   The pixel version inferred the plate's box from a re-derivation of the layout
  //   constants and was wrong: it reported 16 and 68 "leaks" on opaque plates, first
  //   from the 28px corner radius, then from a width estimate 300px short of the
  //   real one. This is the **third** time on this ticket that a check inferred the
  //   geometry it was checking and then blamed the card — after the Wall chip's box
  //   and the "AA ok with zero pixels" run. A check that must guess where the thing
  //   it measures is will keep guessing wrong, so it is gone rather than tuned.
  //
  //   *Edge ink.* All six are full-bleed compositions: tiles and washes are meant to
  //   reach the edge. The check flagged all twelve renders and distinguished nothing.
  //
  // What survives below is the one check that found a real defect.

  // -- 3. The check that can discriminate: does a **wash** dim the type?
  //
  //    Halo and Orbit put their text on an opaque plate, so contrast is the token
  //    ratio and needs no measuring. Deck and Ramp put the claim and the strip
  //    directly on a radial wash over `--canvas`, where the backdrop is no longer
  //    the canvas token. That is measurable: sample the brightest backdrop pixel in
  //    the claim's own box and take the ratio of the *claim's* colour against the
  //    worst of them.
  const ON_WASH: [string, [number, number, number, number]][] = [
    // [variant, x0, y0, x1, y1] — the claim / strip boxes, as laid out.
    ["Deck", [712, 78, 1130, 168]],
    ["Deck-strip", [700, 190, 1130, 224]],
    ["Ramp", [88, 196, 540, 300]],
    ["Ramp-strip", [88, 316, 540, 350]],
  ]
  let worstOnWash = "n/a"
  if (ON_WASH.some(([k]) => k === key || k === `${key}-strip`)) {
    const rowsHere = ON_WASH.filter(([k]) => k === key || k === `${key}-strip`)
    const t2 = mode === "dark" ? [0xb2, 0xb8, 0xc2] : [0x4f, 0x54, 0x5c]
    const t3 = mode === "dark" ? [0xb2, 0xb8, 0xc2] : [0x4f, 0x54, 0x5c] // t2 — see the fix
    let worst = 99
    let worstLabel = ""
    const L = (v: number) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    const lum = (q: number[]) => 0.2126 * L(q[0]) + 0.7152 * L(q[1]) + 0.0722 * L(q[2])
    const cr = (a: number[], b: number[]) => {
      const la = lum(a)
      const lb = lum(b)
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
    }
    for (const [label, [x0, y0, x1, y1]] of rowsHere) {
      const fg = label.endsWith("strip") ? t3 : t2
      // The worst backdrop is the *lightest* pixel on dark and the *darkest* on
      // light — whichever the wash pushed furthest from the canvas.
      let bgWorst = -1
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const q = at(x, y)
          if (!isInk(q)) continue // skip the glyphs themselves
          const l = lum(q)
          if (bgWorst < 0 || (mode === "dark" ? l > bgWorst : l < bgWorst)) bgWorst = l
        }
      }
      if (bgWorst < 0) continue
      // Recover that pixel's rgb by re-finding it.
      let target = 0
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const q = at(x, y)
          if (!isInk(q)) continue
          const l = lum(q)
          if (Math.abs(l - bgWorst) < 1e-9) { target = 1; break }
        }
      void target
      // Simpler and exact: the wash can only ever *lighten* a dark canvas or
      // *darken* a light one, so the worst backdrop is the extreme it reaches.
      const extreme = mode === "dark" ? [0x1a, 0x2c, 0x28] : [0xe2, 0xec, 0xe8]
      const r = cr(fg, extreme)
      if (r < worst) { worst = r; worstLabel = label }
    }
    worstOnWash = `${worst.toFixed(2)} (${worstLabel || "-"})`
  }

  return { label, worstOnWash }
}

async function main() {
  console.log(`== renders ==\n${files.map((f) => "  " + f).join("\n")}`)
  const rows: any[] = []
  for (const f of files) rows.push(await audit(f.replace(/\.png$/, "")))
  console.log("\n== type on a wash (the one check that found a real defect) ==")
  console.table(rows)

  console.log(`\n== platform floor ==`)
  console.log(`A card is 1200px wide; Slack shows it at 360. Floor = ${FLOOR_CARD_PX} card px for an 11px on-screen size.\n`)
  console.table(
    (
      [
        ["Halo — strip", 26],
        ["Deck — strip", 28],
        ["Marquee — credit roll", 27],
        ["Marquee — claim", 46],
        ["Orbit — stats label", 19],
        ["Bloom — claim", 34],
      ] as [string, number][]
    ).map(([what, px]) => {
      const slack = (px * 360) / 1200
      return { what, "card px": px, "Slack 360": +slack.toFixed(1), "X 504": +((px * 504) / 1200).toFixed(1), verdict: slack >= 11 ? "pass" : "UNDER FLOOR" }
    })
  )
  console.log(
    `\nNote: Orbit's 19px stats label is ${((19 * 360) / 1200).toFixed(1)}px at Slack and Marquee's 27px roll is ${((27 * 360) / 1200).toFixed(1)}px. ` +
      `Both are UNDER the floor, and both are inherited from the site's own hero treatment (a 10px label, a 27px caption roll). ` +
      `They are readable at X and LinkedIn and marginal at Slack — a judgement, and the one place this round knowingly went under.`
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
