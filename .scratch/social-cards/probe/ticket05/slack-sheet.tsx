import sharp from "sharp"
import { VARIANTS } from "../../preview/variants-contrib"

const D = new URL("../../preview/out-contrib/", import.meta.url).pathname
const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)
const who = process.argv[2] ?? "Enzo Manuel Mangano (Reactiive)"
const W = 360, GAP = 14

async function main() {
  const keys = VARIANTS.map((v) => v.key)
  const comps = []
  for (const k of keys) {
    const b = await sharp(`${D}${k}--${slug(who)}--light.png`).resize(W).png().toBuffer()
    comps.push({ input: b, left: keys.indexOf(k) * (W + GAP), top: 0 })
  }
  await sharp({ create: { width: keys.length * (W + GAP) - GAP, height: Math.round(W * 630 / 1200), channels: 4, background: { r: 23, g: 24, b: 28, alpha: 1 } } })
    .composite(comps).png().toFile("/tmp/slack.png")
  console.log(`left -> right: ${keys.join(" | ")}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
