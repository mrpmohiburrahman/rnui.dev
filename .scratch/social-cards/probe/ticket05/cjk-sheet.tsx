import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"
import sharp from "sharp"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [300, 400, 500, 700].map((w) => F("SpaceGrotesk", w))

const SETTINGS: Record<string, Record<string, string>> = {
  "1-default": {},
  "2-keep-all": { wordBreak: "keep-all" },
  "3-line-break-strict": { lineBreak: "strict" },
  "4-keep-all+strict": { wordBreak: "keep-all", lineBreak: "strict" },
}

const NAME = "Daehyeon Mun (문대현)"
const SIZE = 56

async function main() {
  mkdirSync(new URL("./out-cjk/", import.meta.url).pathname, { recursive: true })
  const keys = Object.keys(SETTINGS)
  const comps = []
  for (const k of keys) {
    const node = h(
      "div",
      { style: { width: 600, height: 190, display: "flex", background: "#F4F4F1", paddingLeft: 20, alignItems: "center" } },
      h(
        "div",
        { style: { width: 560, fontFamily: "Space Grotesk", fontSize: SIZE, fontWeight: 500, letterSpacing: "-0.024em", lineHeight: 1.04, color: "#14161A", ...SETTINGS[k] } },
        NAME
      )
    )
    const buf = Buffer.from(await new ImageResponse(node as any, { width: 600, height: 190, fonts }).arrayBuffer())
    writeFileSync(new URL(`./out-cjk/${k}.png`, import.meta.url).pathname, buf)
    comps.push({ input: await sharp(buf).png().toBuffer(), left: 0, top: keys.indexOf(k) * 190 })
  }
  await sharp({ create: { width: 600, height: 190 * keys.length, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite(comps).png().toFile(new URL("./out-cjk/sheet.png", import.meta.url).pathname)
  console.log("top -> bottom:", keys.join("  |  "))
  console.log(`\n"${NAME}" at ${SIZE}px in a 560px column\n`)
}
main().catch((e) => { console.error(e); process.exit(1) })
