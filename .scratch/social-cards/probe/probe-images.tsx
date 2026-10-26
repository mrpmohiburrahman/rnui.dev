/**
 * Ticket 02 probe, part 2 — the three questions that actually decide the
 * mechanism: AVIF, remote fetch failure, and variable fonts.
 *
 * Run: pnpm tsx .scratch/social-cards/probe/probe-images.tsx
 */
import { createRequire } from "node:module"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

const require_ = createRequire(import.meta.url)
const sharp = require_("sharp")

const OUT = new URL("./out/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

function font(name: string, weight: number) {
  const d = readFileSync(new URL(`./fonts/${name}-${weight}.ttf`, import.meta.url))
  return {
    name,
    data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength),
    weight: weight as 100,
  }
}
const fonts = [300, 400, 500, 700].map((w) => font("SpaceGrotesk", w))

const D = { canvas: "#0A0B0D", acc: "#6FE3CC", tile: "16px" }

async function render(label: string, element: any, f?: any[]) {
  const res = new ImageResponse(element, { width: 1200, height: 630, fonts: f ?? fonts })
  const buf = Buffer.from(await res.arrayBuffer())
  const file = `${OUT}${label}.png`
  writeFileSync(file, buf)
  return file
}

async function main() {
  // Build a real AVIF of a recognisable shape so a successful render is
  // visibly distinguishable from a dropped image.
  const poster = await sharp({
    create: { width: 600, height: 400, channels: 3, background: "#6FE3CC" },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="600" height="400"><rect x="40" y="40" width="520" height="320" fill="none" stroke="#0A0B0D" stroke-width="24"/></svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .avif({ quality: 70 })
    .toBuffer()

  mkdirSync(`${OUT}fixtures`, { recursive: true })
  writeFileSync(`${OUT}fixtures/poster.avif`, poster)
  writeFileSync(
    `${OUT}fixtures/poster.png`,
    await sharp(poster).png().toBuffer()
  )

  const avifDataUri = `data:image/avif;base64,${poster.toString("base64")}`
  const pngDataUri = `data:image/png;base64,${(await sharp(poster).png().toBuffer()).toString("base64")}`

  const results: any[] = {}

  // --- A. AVIF as a <img src> -------------------------------------------
  try {
    await render(
      "20-img-avif-datap uri".replace(" ", ""),
      h(
        "div",
        { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
        // @ts-expect-error satori accepts an <img>
        h("img", { src: avifDataUri, width: 600, height: 400, style: { borderRadius: D.tile } })
      )
    )
    results.avifDataUri = "rendered"
  } catch (e: any) {
    results.avifDataUri = `THREW: ${e.message}`
  }

  // --- B. PNG control ---------------------------------------------------
  try {
    await render(
      "21-img-png-datap-uri",
      h(
        "div",
        { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
        // @ts-expect-error satori accepts an <img>
        h("img", { src: pngDataUri, width: 600, height: 400, style: { borderRadius: D.tile } })
      )
    )
    results.pngDataUri = "rendered"
  } catch (e: any) {
    results.pngDataUri = `THREW: ${e.message}`
  }

  // --- C. remote cross-origin AVIF over HTTPS (a real CDN fetch) --------
  // Serves the AVIF from a local HTTPS-less server; satori requires an
  // absolute URL, http:// counts.
  const http = await import("node:http")
  const server = http.createServer((req, res) => {
    if (req.url?.startsWith("/poster.avif")) {
      res.writeHead(200, { "content-type": "image/avif" })
      res.end(poster)
    } else if (req.url?.startsWith("/missing.avif")) {
      res.writeHead(404)
      res.end()
    } else {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise<void>((r) => server.listen(0, r))
  const port = (server.address() as any).port

  try {
    await render(
      "22-img-remote-avif",
      h(
        "div",
        { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
        // @ts-expect-error satori accepts an <img>
        h("img", { src: `http://127.0.0.1:${port}/poster.avif`, width: 600, height: 400 })
      )
    )
    results.remoteAvifHttp = "rendered"
  } catch (e: any) {
    results.remoteAvifHttp = `THREW: ${e.message}`
  }

  // --- D. the failure mode that matters: a 404 on a shared link ---------
  try {
    await render(
      "23-img-remote-404",
      h(
        "div",
        { style: { width: 1200, height: 630, display: "flex", flexDirection: "column", backgroundColor: D.canvas, padding: 60 } },
        h("div", { style: { fontSize: 29, fontWeight: 500, color: "#F1F2F4" } }, "A Recording"),
        // @ts-expect-error satori accepts an <img>
        h("img", { src: `http://127.0.0.1:${port}/missing.avif`, width: 600, height: 400 })
      )
    )
    results.remote404 = "rendered (did NOT throw)"
  } catch (e: any) {
    results.remote404 = `THREW: ${e.message}`
  }

  // --- E. remote PNG (content-type avif but really png, and vice versa) --
  try {
    await render(
      "24-img-remote-png-as-avif-ct",
      h(
        "div",
        { style: { width: 1200, height: 630, display: "flex", backgroundColor: D.canvas } },
        // @ts-expect-error satori accepts an <img>
        h("img", { src: `http://127.0.0.1:${port}/poster.png`, width: 600, height: 400 })
      )
    )
    results.remotePngWrongCT = "rendered"
  } catch (e: any) {
    results.remotePngWrongCT = `THREW: ${e.message}`
  }

  server.close()

  // --- F. variable font: does declaring a weight on ONE variable file work?
  const varData = readFileSync(new URL("./fonts/SpaceGrotesk-var.ttf", import.meta.url))
  const varBuf = varData.buffer.slice(varData.byteOffset, varData.byteOffset + varData.byteLength)

  for (const weight of [300, 500, 700]) {
    try {
      const file = await render(
        `30-varfont-${weight}`,
        h(
          "div",
          { style: { width: 1200, height: 300, display: "flex", backgroundColor: D.canvas, padding: 60 } },
          h(
            "div",
            { style: { fontFamily: "VarGrotesk", fontSize: 56, fontWeight: weight, color: "#F1F2F4" } },
            "Handgloves rnui.dev"
          )
        ),
        [{ name: "VarGrotesk", data: varBuf, weight: weight as 100 }]
      )
      results[`variableFont-${weight}`] = { ok: true, file }
    } catch (e: any) {
      results[`variableFont-${weight}`] = { ok: false, error: e.message }
    }
  }

  // Does a weight that was NOT declared fall back to the nearest declared one?
  try {
    const file = await render(
      "31-varfont-undeclared-450",
      h(
        "div",
        { style: { width: 1200, height: 300, display: "flex", backgroundColor: D.canvas, padding: 60 } },
        h(
          "div",
          { style: { fontFamily: "VarGrotesk", fontSize: 56, fontWeight: 450, color: "#F1F2F4" } },
          "Handgloves rnui.dev"
        )
      ),
      [{ name: "VarGrotesk", data: varBuf, weight: 400 as 100 }]
    )
    results["variableFont-undeclared-450"] = { ok: true, file }
  } catch (e: any) {
    results["variableFont-undeclared-450"] = { ok: false, error: e.message }
  }

  // --- G. woff2 rejected? ------------------------------------------------
  try {
    const f = await render(
      "32-woff2",
      h(
        "div",
        { style: { width: 1200, height: 300, display: "flex", backgroundColor: D.canvas, padding: 60 } },
        h("div", { style: { fontFamily: "Woff", fontSize: 56, color: "#F1F2F4" } }, "Handgloves")
      ),
      [{ name: "Woff", data: require_("fs").readFileSync(new URL("./fonts/SpaceGrotesk-var.woff2", import.meta.url)) as any, weight: 400 as 100 }]
    )
    results.woff2 = { ok: true, file: f }
  } catch (e: any) {
    results.woff2 = { ok: false, error: e.message }
  }

  console.log(JSON.stringify(results, null, 2))
}

main().catch((e) => {
  console.error("PROBE-2 FAILED:", e)
  process.exit(1)
})