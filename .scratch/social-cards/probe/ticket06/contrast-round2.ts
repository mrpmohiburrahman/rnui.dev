/** Contrast for the round-2 variants. Same method as round 1. */
import { readFileSync } from "node:fs"
import sharp from "sharp"
import { ImageResponse } from "next/og"
import { VARIANTS, render, rendition, type Subject } from "../../preview/variants-d2"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)), F("JetBrainsMono", 400), F("JetBrainsMono", 700)]
const lum = (r: number, g: number, b: number) => {
  const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: number, b: number) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05) }
const INKS: number[][] = [[0xf1,0xf2,0xf4],[0xb2,0xb8,0xc2],[0x8e,0x94,0x9f],[0x6f,0xe3,0xcc]]
const near = (p: number[], ink: number[], tol = 30) =>
  Math.abs(p[0]-ink[0])<=tol && Math.abs(p[1]-ink[1])<=tol && Math.abs(p[2]-ink[2])<=tol

async function main() {
  const subs: Subject[] = [
    { key: "snake", caption: "Snake", contributor: "Pushkar Tandon", category: "Full Apps", hue: 356, poster: rendition("snake"), aspect: 0.477 },
    { key: "worst", caption: "Spread Cards Effect ( Color Swatch )", contributor: "Enzo Manuel Mangano (Reactiive)", category: "Misc", hue: 273, poster: rendition("ripple"), aspect: 0.605 },
    { key: "noster", caption: "Toast", contributor: "Enzo Manuel Mangano (Reactiive)", category: "Misc", hue: undefined, poster: null },
    { key: "hangul", caption: "Ripple Effect With React Native Skia", contributor: "Daehyeon Mun (문대현)", category: "Misc", hue: 25, poster: rendition("ripple"), aspect: 0.605 },
  ]
  let overall = Infinity
  for (const v of VARIANTS) {
    for (const s of subs) {
      const a = await sharp(Buffer.from(await new ImageResponse(render(v.key as any, s) as any, { width: 1200, height: 630, fonts }).arrayBuffer())).raw().toBuffer({ resolveWithObject: true })
      const b = await sharp(Buffer.from(await new ImageResponse(render(v.key as any, { ...s, caption: "" }) as any, { width: 1200, height: 630, fonts }).arrayBuffer())).raw().toBuffer({ resolveWithObject: true })
      const { width: W, height: H, channels: ch } = a.info
      const px = (buf: Buffer, x: number, y: number) => { const i = (y*W+x)*ch; return [buf[i],buf[i+1],buf[i+2]] }
      const R = 2
      let worst = Infinity, n = 0
      for (let y = R; y < H-R; y++) for (let x = R; x < 800-R; x++) {
        const p = px(a.data,x,y), q = px(b.data,x,y)
        if (Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]) < 40) continue
        const ink = INKS.find(c => near(p,c)); if (!ink) continue
        let solid = true
        for (let dy=-R; dy<=R && solid; dy++) for (let dx=-R; dx<=R; dx++)
          if (!near(px(a.data,x+dx,y+dy), ink)) { solid = false; break }
        if (!solid) continue
        n++
        const r = ratio(lum(p[0],p[1],p[2]), lum(q[0],q[1],q[2]))
        if (r < worst) worst = r
      }
      overall = Math.min(overall, worst)
      console.log(`${v.key} ${s.key.padEnd(7)} worst ${worst.toFixed(2)}  (${n} solid px)${worst < 4.5 ? "  <-- under 4.5" : ""}`)
    }
  }
  console.log(`\nworst across all round-2 renders: ${overall.toFixed(2)}`)
}
main().catch(e => { console.error(e); process.exit(1) })
