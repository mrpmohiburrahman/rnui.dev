/**
 * Ticket 14 measurement: what does a Poster actually cost inside a card render?
 *
 * The map left "the per-request cost of transcoding an AVIF Poster" unmeasured.
 * This measures three things against real catalogue Posters, so the option
 * comparison in the ticket rests on numbers rather than adjectives:
 *
 *   1. the AVIF -> JPEG transcode on its own
 *   2. a bare ImageResponse render (no image)
 *   3. the same render with the converted Poster composited in
 *
 * (3) - (2) is the transcode's marginal cost *inside* the render, which is the
 * number that decides whether per-request conversion is affordable.
 */
import { createRequire } from "node:module"
import { readFile, readdir } from "node:fs/promises"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

const require_ = createRequire(import.meta.url)
const sharp = require_("sharp")

async function walk(d: string): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else if (e.name.endsWith(".avif")) out.push(p)
  }
  return out
}

function font(name: string, weight: number) {
  const d = readFileSync(new URL(`./fonts/${name}-${weight}.ttf`, import.meta.url))
  return { name, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: weight as 100 }
}
const fonts = [300, 400, 500, 700].map((w) => font("SpaceGrotesk", w))

const D = { canvas: "#0A0B0D", t1: "#F1F2F4", t2: "#B2B8C2", acc: "#6FE3CC" }

async function ms(fn: () => Promise<unknown>, n: number) {
  await fn()
  const t0 = process.hrtime.bigint()
  for (let i = 0; i < n; i++) await fn()
  return Number(process.hrtime.bigint() - t0) / 1e6 / n
}

async function main() {
  const files = await walk(new URL("../../../public/thumbnails", import.meta.url).pathname)
  const avifs = await Promise.all(files.slice(0, 12).map((f) => readFile(f)))

  // 1. transcode alone
  const transcode = await ms(() => sharp(avifs[0]).jpeg({ quality: 82 }).toBuffer(), 12)
  console.log(`1. AVIF -> JPEG q82, no resize:        ${transcode.toFixed(1)} ms`)

  const bare = h(
    "div",
    {
      style: {
        background: D.canvas, width: "100%", height: "100%", display: "flex",
        flexDirection: "column", justifyContent: "center", padding: "80px", gap: "24px",
      },
    },
    h("div", { style: { display: "flex", fontSize: 24, color: D.acc, fontWeight: 500, letterSpacing: "0.14em" } }, "BUTTONS"),
    h("div", { style: { display: "flex", fontSize: 56, color: D.t1, fontWeight: 700, lineHeight: 1.15 } }, "Split Button"),
    h("div", { style: { display: "flex", fontSize: 28, color: D.t2, fontWeight: 400 } }, "a buttons demo by hewad mubariz")
  )
  const bareMs = await ms(async () => {
    const r = new ImageResponse(bare, { width: 1200, height: 630, fonts })
    await r.arrayBuffer()
  }, 6)
  console.log(`2. ImageResponse render, no image:      ${bareMs.toFixed(1)} ms`)

  const jpegs = await Promise.all(
    avifs.map((b) => sharp(b).resize(1200, 630, { fit: "cover", position: "top" }).jpeg({ quality: 82 }).toBuffer())
  )
  const withImage = h(
    "div",
    { style: { background: D.canvas, width: "100%", height: "100%", display: "flex" } },
    h("div", {
      style: {
        width: 420, height: "100%", display: "flex",
        backgroundImage: `url(data:image/jpeg;base64,${jpegs[0].toString("base64")})`,
        backgroundSize: "cover", backgroundPosition: "center",
      },
    }),
    h("div", { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", gap: "24px" } },
      h("div", { style: { display: "flex", fontSize: 24, color: D.acc, fontWeight: 500, letterSpacing: "0.14em" } }, "BUTTONS"),
      h("div", { style: { display: "flex", fontSize: 56, color: D.t1, fontWeight: 700, lineHeight: 1.15 } }, "Split Button"),
      h("div", { style: { display: "flex", fontSize: 28, color: D.t2, fontWeight: 400 } }, "a buttons demo by hewad mubariz")
    )
  )
  const withMs = await ms(async () => {
    const r = new ImageResponse(withImage, { width: 1200, height: 630, fonts })
    await r.arrayBuffer()
  }, 6)
  console.log(`3. same render + converted Poster:       ${withMs.toFixed(1)} ms`)
  console.log(`   marginal cost of the image:           ${(withMs - bareMs).toFixed(1)} ms`)
  console.log(`   transcode share of that:              ${((transcode / (withMs - bareMs)) * 100).toFixed(0)}%`)
  console.log(`   so full card with Poster:             ${(withMs + transcode).toFixed(0)} ms vs ${bareMs.toFixed(0)} ms without`)

  // Sanity: the AVIF bytes as a data URI, which is what a naive card would do.
  const avifUri = h("div", {
    style: {
      background: D.canvas, width: "100%", height: "100%", display: "flex",
      backgroundImage: `url(data:image/avif;base64,${avifs[0].toString("base64")})`,
      backgroundSize: "cover",
    },
  })
  const avifBytes = await new ImageResponse(avifUri, { width: 1200, height: 630, fonts }).arrayBuffer()
  const colours = new Set<number>()
  const raw = await sharp(Buffer.from(avifBytes)).raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < raw.data.length; i += 4) colours.add((raw.data[i] << 16) | (raw.data[i + 1] << 8) | raw.data[i + 2])
  console.log(`4. AVIF as a data URI: ${colours.size} distinct colours (1 = silently blank)`)
}
main()
