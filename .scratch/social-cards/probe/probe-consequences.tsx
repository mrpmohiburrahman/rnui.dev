/**
 * Ticket 02 probe, part 3 — the consequences. What must the mechanism do?
 *
 *   * AVIF is the catalogue's only Poster format and Satori refuses it. What
 *     are the options, and does converting to PNG/JPEG work?
 *   * A failed remote fetch logs and returns [] — what does the card look like?
 *   * Which layout properties the cards need actually work (absolute
 *     positioning, gap, text-overflow, objectFit)?
 *
 * Run: pnpm tsx .scratch/social-cards/probe/probe-consequences.tsx
 */
import { createRequire } from "node:module"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

const require_ = createRequire(import.meta.url)
const sharp = require_("sharp")

const OUT = new URL("./out/", import.meta.url).pathname
mkdirSync(`${OUT}fixtures`, { recursive: true })

function font(name: string, weight: number) {
  const d = readFileSync(new URL(`./fonts/${name}-${weight}.ttf`, import.meta.url))
  return {
    name,
    data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength),
    weight: weight as 100,
  }
}
const fonts = [
  ...[300, 400, 500, 700].map((w) => font("SpaceGrotesk", w)),
  font("JetBrainsMono", 400),
  font("JetBrainsMono", 700),
]
const D = { canvas: "#0A0B0D", panel: "#101216", t1: "#F1F2F4", t3: "#8E949F", acc: "#6FE3CC", tile: "16px" }

async function render(label: string, element: any, f: any[] = fonts) {
  const res = new ImageResponse(element, { width: 1200, height: 630, fonts: f })
  const buf = Buffer.from(await res.arrayBuffer())
  const file = `${OUT}${label}.png`
  writeFileSync(file, buf)
  return file
}

async function main() {
  const results: any = {}

  const avif = readFileSync(`${OUT}fixtures/poster.avif`)

  // --- 1. Does converting the AVIF to PNG/JPEG make it acceptable? -------
  const png = await sharp(avif).png().toBuffer()
  const jpeg = await sharp(avif).jpeg({ quality: 82 }).toBuffer()
  const webp = await sharp(avif).webp({ quality: 82 }).toBuffer()
  mkdirSync(`${OUT}fixtures`, { recursive: true })
  writeFileSync(`${OUT}fixtures/poster-converted.png`, png)
  writeFileSync(`${OUT}fixtures/poster-converted.jpg`, jpeg)
  writeFileSync(`${OUT}fixtures/poster-converted.webp`, webp)

  const html = await import("node:http")
  const server = html.createServer((req, res) => {
    const routes: Record<string, [string, Buffer]> = {
      "/poster.avif": ["image/avif", avif],
      "/poster.png": ["image/png", png],
      "/poster.jpg": ["image/jpeg", jpeg],
      "/poster.webp": ["image/webp", webp],
    }
    const hit = req.url ? routes[req.url] : undefined
    if (hit) {
      res.writeHead(200, { "content-type": hit[0] })
      res.end(hit[1])
    } else {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise<void>((r) => server.listen(0, r))
  const port = (server.address() as any).port

  for (const [route, key] of [
    ["/poster.avif", "avif"],
    ["/poster.png", "png"],
    ["/poster.jpg", "jpeg"],
    ["/poster.webp", "webp"],
  ] as const) {
    try {
      await render(
        `40-remote-${key}`,
        h(
          "div",
          { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
          // @ts-expect-error satori accepts an <img>
          h("img", { src: `http://127.0.0.1:${port}${route}`, width: 600, height: 400 })
        )
      )
      results[`remote-${key}`] = "rendered"
    } catch (e: any) {
      results[`remote-${key}`] = `THREW: ${e.message}`
    }
  }

  // --- 2. the visible result of a failed fetch ---------------------------
  // The card a shared link gets when R2 404s or the Poster is unreadable.
  await render(
    "41-fetch-failure-looks-like",
    h(
      "div",
      {
        style: {
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          backgroundColor: D.canvas,
          padding: "72px",
          fontFamily: "SpaceGrotesk",
        },
      },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "16px" } },
        h(
          "div",
          { style: { fontFamily: "JetBrainsMono", fontSize: 9, letterSpacing: "0.14em", color: D.acc } },
          "RECORDING · BUTTONS"
        ),
        h(
          "div",
          { style: { fontSize: 29, fontWeight: 500, lineHeight: 1.15, color: D.t1 } },
          "Split Button"
        )
      ),
      h("div", {
        style: {
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
          borderRadius: D.tile,
          border: `1px solid ${D.panel}`,
        },
      })
    )
  )

  // --- 3. the layout primitives the designs will want --------------------
  const checks: [string, any, any][] = [
    [
      "50-position-absolute",
      h("div", { style: { width: 1200, height: 630, display: "flex", position: "relative", backgroundColor: D.canvas } }),
      h("div", { style: { width: 1200, height: 630, display: "flex", position: "relative", backgroundColor: D.canvas } },
        h("div", { style: { position: "absolute", top: 40, left: 40, width: 120, height: 60, backgroundColor: D.acc } })
      ),
    ],
    [
      "51-gap",
      h("div", { style: { width: 1200, height: 630, display: "flex", gap: 24, padding: 60, backgroundColor: D.canvas } },
        h("div", { style: { width: 100, height: 100, backgroundColor: D.acc } }),
        h("div", { style: { width: 100, height: 100, backgroundColor: D.t3 } })),
      h("div", { style: { width: 1200, height: 630, display: "flex", gap: 120, padding: 60, backgroundColor: D.canvas } },
        h("div", { style: { width: 100, height: 100, backgroundColor: D.acc } }),
        h("div", { style: { width: 100, height: 100, backgroundColor: D.t3 } })),
    ],
    [
      "52-margin-auto-push",
      h("div", { style: { width: 1200, height: 630, display: "flex", flexDirection: "column", backgroundColor: D.canvas } },
        h("div", { style: { fontSize: 29, fontWeight: 500, color: D.t1, padding: 40 } }, "Top")),
      h("div", { style: { width: 1200, height: 630, display: "flex", flexDirection: "column", backgroundColor: D.canvas } },
        h("div", { style: { fontSize: 29, fontWeight: 500, color: D.t1, padding: 40 } }, "Top"),
        h("div", { style: { marginTop: "auto", height: 200, backgroundColor: D.panel, borderRadius: D.tile, margin: 40 } })),
    ],
    [
      "53-objectfit-cover",
      h("div", { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
        h("img", { src: `data:image/png;base64,${png.toString("base64")}`, style: { width: 600, height: 300, objectFit: "fill" } })),
      h("div", { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
        h("img", { src: `data:image/png;base64,${png.toString("base64")}`, style: { width: 600, height: 300, objectFit: "cover" } })),
    ],
    [
      "53b-objectfit-contain",
      h("div", { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
        h("img", { src: `data:image/png;base64,${png.toString("base64")}`, style: { width: 600, height: 300, objectFit: "fill" } })),
      h("div", { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
        h("img", { src: `data:image/png;base64,${png.toString("base64")}`, style: { width: 600, height: 300, objectFit: "contain" } })),
    ],
    [
      "54-overflow-hidden",
      h("div", { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas, padding: 60 } },
        h("div", { style: { fontSize: 29, fontWeight: 500, color: D.t1, width: 400, maxHeight: 200 } },
          "A Recording title long enough to need clamping in a narrow column")),
      h("div", { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas, padding: 60 } },
        h("div", { style: { fontSize: 29, fontWeight: 500, color: D.t1, width: 400, maxHeight: 200, overflow: "hidden" } },
          "A Recording title long enough to need clamping in a narrow column")),
    ],
  ]

  for (const [label, a, b] of checks) {
    try {
      await render(`${label}-a`, a)
      await render(`${label}-b`, b)
      const [ra, rb] = await Promise.all([
        sharp(`${OUT}${label}-a.png`).raw().toBuffer(),
        sharp(`${OUT}${label}-b.png`).raw().toBuffer(),
      ])
      let changed = 0
      for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) changed++
      results[label] = { rendered: changed > 0, pctPixelsChanged: +((changed / ra.length) * 100).toFixed(3) }
    } catch (e: any) {
      results[label] = `THREW: ${e.message}`
    }
  }

  // --- 4. ::before / ::after --------------------------------------------
  results.pseudoElements = "not expressible in Satori's JSX — no selector surface at all; a design that needs one must be built with a sibling element"

  server.close()
  console.log(JSON.stringify(results, null, 2))
}

main().catch((e) => {
  console.error("PROBE-3 FAILED:", e)
  process.exit(1)
})