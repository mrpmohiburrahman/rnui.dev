/**
 * A refinement of ticket 02's blank-card finding: is a *remote* AVIF the only
 * thing that blanks, or does an inlined AVIF data URI fail differently?
 * The two paths differ in @vercel/og (a fetch is wrapped in .catch, a data URI
 * is not), so the failure mode may not be the same.
 */
import { readFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

function font(name: string, weight: number) {
  const d = readFileSync(new URL(`./fonts/${name}-${weight}.ttf`, import.meta.url))
  return { name, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: weight as 100 }
}
const fonts = [300, 400].map((w) => font("SpaceGrotesk", w))

async function tryOne(label: string, bytes: Buffer, mime: string) {
  const el = h("div", {
    style: {
      background: "#0A0B0D", width: "100%", height: "100%", display: "flex",
      backgroundImage: `url(data:${mime};base64,${bytes.toString("base64")})`,
      backgroundSize: "cover", backgroundPosition: "top",
    },
  })
  try {
    const r = new ImageResponse(el, { width: 1200, height: 630, fonts })
    const buf = Buffer.from(await r.arrayBuffer())
    console.log(`${label}: rendered, ${buf.length} bytes PNG`)
  } catch (e) {
    console.log(`${label}: THREW ${(e as Error).constructor.name}: ${(e as Error).message}`)
  }
}

async function main() {
  const sharp = require("sharp")
  const avif = readFileSync(new URL("../../../public/thumbnails/accordions/accordion_william_candillon.avif", import.meta.url).pathname)
  await tryOne("AVIF as data URI", avif, "image/avif")
  await tryOne("JPEG as data URI", await sharp(avif).jpeg({ quality: 82 }).toBuffer(), "image/jpeg")
  // And the remote path, which is what a card would really do.
  const url = "https://cdn.rnui.dev/thumbnails/accordions/accordion_william_candillon.avif"
  const el = h("div", {
    style: { background: "#0A0B0D", width: "100%", height: "100%", display: "flex", backgroundImage: `url(${url})`, backgroundSize: "cover" },
  })
  try {
    const r = new ImageResponse(el, { width: 1200, height: 630, fonts })
    const buf = Buffer.from(await r.arrayBuffer())
    console.log(`remote AVIF over the real CDN: rendered, ${buf.length} bytes PNG (ticket 02 says blank)`)
  } catch (e) {
    console.log(`remote AVIF over the real CDN: THREW ${(e as Error).message}`)
  }
}
main()
