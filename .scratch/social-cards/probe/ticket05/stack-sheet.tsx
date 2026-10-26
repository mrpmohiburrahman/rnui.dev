import { readFileSync } from "node:fs"
import sharp from "sharp"
import { VARIANTS } from "../../preview/variants-contrib"

const D = new URL("../../preview/out-contrib/", import.meta.url).pathname
const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)
const who = process.argv[2] ?? "Daehyeon Mun (문대현)"
const W = 1200, GAP = 16

async function main() {
  const keys = VARIANTS.map((v) => v.key)
  const comps = []
  for (const k of keys) {
    const b = await sharp(`${D}${k}--${slug(who)}--light.png`).png().toBuffer()
    comps.push({ input: b, left: 0, top: keys.indexOf(k) * (630 + GAP) })
  }
  await sharp({ create: { width: W, height: (630 + GAP) * keys.length, channels: 4, background: { r: 23, g: 24, b: 28, alpha: 1 } } })
    .composite(comps).png().toFile("/tmp/stack.png")
  console.log(`${who}: top -> bottom = ${keys.join(" | ")}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
