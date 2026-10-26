/**
 * How wide does the byline actually need to be? Every one of the 23Contributor
 * names, at the card's body-sm step, rendered and measured rather than guessed.
 */
import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import sharp from "sharp"
import { ImageResponse } from "next/og"
import { getUniqueContributors } from "@/data/recording"
import { type_ } from "../../preview/tokens"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)), F("JetBrainsMono", 400), F("JetBrainsMono", 700)]

async function main() {
  const names = getUniqueContributors().sort((a, b) => b.length - a.length)
  const t = type_("body-sm")
  const rows: any[] = []
  for (const n of names) {
    const buf = Buffer.from(await new ImageResponse(
      h("div", { style: { background: "#0A0B0D", width: 2000, height: 200, display: "flex", alignItems: "center", padding: 20 } },
        h("div", { style: { ...t, fontFamily: "Space Grotesk", color: "#F1F2F4", whiteSpace: "nowrap" } }, n)),
      { width: 2000, height: 200, fonts }
    ).arrayBuffer())
    const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true })
    let maxX = 0
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++)
      if (data[y * info.width + x] > 60 && x > maxX) maxX = x
    rows.push({ name: n, chars: n.length, w: maxX - 20 })
  }
  rows.sort((a, b) => b.w - a.w)
  console.log("widest 8 contributor names at body-sm (K=2.8):")
  for (const r of rows.slice(0, 8)) console.log(`  ${String(r.w).padStart(5)}px  ${r.chars} chars  ${r.name}`)
  console.log(`\nwidest overall: ${rows[0].w}px  ("${rows[0].name}")`)
  console.log(`p90: ${rows[Math.floor(rows.length * 0.1)].w}px   median: ${rows[Math.floor(rows.length / 2)].w}px`)
}
main().catch((e) => { console.error(e); process.exit(1) })
