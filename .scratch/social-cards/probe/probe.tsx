/**
 * Ticket 02 probe — can ImageResponse render this Design?
 *
 * Throwaway. Renders the Design's real tokens at 1200x630 and asserts, per
 * device, whether Satori honoured it or silently dropped it. Nothing here is
 * production code and nothing here should be copied into app/.
 *
 * Run:  pnpm tsx .scratch/social-cards/probe/probe.tsx
 */
import { createRequire } from "node:module"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

const require_ = createRequire(import.meta.url)

const OUT = new URL("./out/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

// The Design's tokens, lifted from app/globals.css:203-268 (.dark) and
// tailwind.config.ts. Nothing invented.
const D = {
  canvas: "#0A0B0D",
  panel: "#101216",
  t1: "#F1F2F4",
  t2: "#B2B8C2",
  t3: "#8E949F",
  acc: "#6FE3CC",
  accDeep: "#0E7062",
  // --e0 / --e1 / --media-glow, verbatim
  e0: "0 0 0 1px rgba(16,18,22,0.10)",
  e1: "0 0 0 1px rgba(16,18,22,0.10), 0 20px 44px -22px hsla(175,55%,40%,0.55)",
  mediaGlow:
    "0 0 0 1px rgba(16,18,22,0.10), 0 34px 80px -32px hsla(175,55%,40%,0.55)",
  tile: "16px",
  panel_: "12px",
  chip: "9px",
  badge: "6px",
}

function font(name: string, weight: number) {
  const data = readFileSync(new URL(`./fonts/${name}-${weight}.ttf`, import.meta.url))
  return {
    name,
    data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    weight: weight as 100,
  }
}

async function render(label: string, element: any, fonts?: any[]) {
  const res = new ImageResponse(element, { width: 1200, height: 630, fonts })
  const buf = Buffer.from(await res.arrayBuffer())
  const file = `${OUT}${label}.png`
  writeFileSync(file, buf)
  return { label, file, bytes: buf.length }
}

/**
 * Measures whether a region is actually painted. Satori never throws on an
 * unsupported property — it drops it — so the only honest test is to render
 * two cards that differ ONLY in the device under test, and compare the
 * decoded pixels. Identical pixels means the device was dropped.
 *
 * Byte length alone is not evidence: the PNG encoder is deterministic for
 * identical input but a differing length says nothing about *what* changed,
 * so this decodes with sharp and diffs the raw RGBA.
 */
async function delta(label: string, a: any, b: any, fonts?: any[]) {
  const one = await render(`${label}-a`, a, fonts)
  const two = await render(`${label}-b`, b, fonts)
  const sharp = require_("sharp")
  const [ra, rb] = await Promise.all([
    sharp(one.file).raw().toBuffer({ resolveWithObject: true }),
    sharp(two.file).raw().toBuffer({ resolveWithObject: true }),
  ])
  let changed = 0
  let maxDelta = 0
  for (let i = 0; i < ra.data.length; i++) {
    const d = Math.abs(ra.data[i] - rb.data[i])
    if (d > 0) {
      changed++
      if (d > maxDelta) maxDelta = d
    }
  }
  const total = ra.data.length
  return {
    label,
    rendered: !changed && one.bytes === two.bytes,
    pixelsChanged: changed,
    pctPixelsChanged: +((changed / total) * 100).toFixed(3),
    maxChannelDelta: maxDelta,
  }
}

async function main() {
  const results: any[] = []

  const grotesk = [300, 400, 500, 700].map((w) => font("SpaceGrotesk", w))
  const mono = [400, 700].map((w) => font("JetBrainsMono", w))
  const fonts = [...grotesk, ...mono]

  const base = {
    width: 1200,
    height: 630,
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: D.canvas,
    color: D.t1,
  }

  // --- 1. the token probe the ticket asked for --------------------------
  await render(
    "00-tokens",
    h(
      "div",
      {
        style: {
          ...base,
          padding: "72px",
          justifyContent: "space-between",
          fontFamily: "SpaceGrotesk",
        },
      },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "18px" } },
        h(
          "div",
          {
            style: {
              fontFamily: "JetBrainsMono",
              fontSize: "9px",
              letterSpacing: "0.14em",
              color: D.acc,
            },
          },
          "RECORDING · 1 OF 1"
        ),
        h(
          "div",
          {
            style: {
              fontSize: "29px",
              lineHeight: 1.15,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: D.t1,
              maxWidth: "820px",
            },
          },
          "rnui.dev"
        ),
        h(
          "div",
          { style: { fontSize: "12px", lineHeight: 1.32, color: D.t3, maxWidth: "720px" } },
          "Curated React Native UI and animation, contributed by the people who build it."
        )
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            gap: "16px",
            borderTop: `1px solid ${D.accDeep}`,
            paddingTop: "20px",
          },
        },
        h("div", { style: { width: 40, height: 40, borderRadius: D.tile, backgroundColor: D.acc } }),
        h("div", { style: { width: 30, height: 30, borderRadius: D.chip, backgroundColor: D.t3 } }),
        h("div", { style: { width: 18, height: 18, borderRadius: D.badge, backgroundColor: D.acc } })
      )
    ),
    fonts
  )

  // --- 2. linear-gradient: flat, or real? ------------------------------
  results.push(
    await delta(
      "10-linear-gradient",
      h("div", { style: { ...base, backgroundColor: "#0f172a" } }),
      h("div", {
        style: {
          ...base,
          backgroundImage:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        },
      })
    )
  )

  // --- 3. box-shadow ----------------------------------------------------
  for (const [name, shadow] of [
    ["e0", D.e0],
    ["e1", D.e1],
    ["media-glow", D.mediaGlow],
  ] as const) {
    results.push(
      await delta(
        `11-box-shadow-${name}`,
        h("div", { style: { ...base, padding: 90 } }, h("div", {
          style: { width: 400, height: 200, backgroundColor: D.panel, borderRadius: D.tile },
        })),
        h("div", { style: { ...base, padding: 90 } }, h("div", {
          style: {
            width: 400,
            height: 200,
            backgroundColor: D.panel,
            borderRadius: D.tile,
            boxShadow: shadow,
          },
        }))
      )
    )
  }

  // The Design's shadows use a negative blur-spread term (-22px). Satori's
  // shadow parser takes offsetX/offsetY/blur/color. Probe whether a 4-term
  // shadow parses at all, or throws.
  try {
    results.push(
      await delta(
        "11-box-shadow-4term",
        h("div", { style: { ...base, padding: 90 } }, h("div", {
          style: { width: 400, height: 200, backgroundColor: D.panel },
        })),
        h("div", { style: { ...base, padding: 90 } }, h("div", {
          style: {
            width: 400,
            height: 200,
            backgroundColor: D.panel,
            boxShadow: "0 20px 44px -22px hsla(175,55%,40%,0.55)",
          },
        }))
      )
    )
  } catch (e: any) {
    results.push({ label: "11-box-shadow-4term", threw: e.message })
  }

  // --- 4. border-radius --------------------------------------------------
  results.push(
    await delta(
      "12-border-radius",
      h("div", { style: { ...base, padding: 90 } }, h("div", {
        style: { width: 300, height: 200, backgroundColor: D.panel },
      })),
      h("div", { style: { ...base, padding: 90 } }, h("div", {
        style: { width: 300, height: 200, backgroundColor: D.panel, borderRadius: D.tile },
      }))
    )
  )

  // --- 5. background-image: url() ---------------------------------------
  results.push(
    await delta(
      "13-background-image-url",
      h("div", { style: { ...base } }),
      h("div", {
        style: {
          ...base,
          backgroundImage: `url(https://placehold.co/600x400/png)`,
          backgroundSize: "cover",
        },
      })
    )
  )

  // --- 6. filter / mix-blend-mode --------------------------------------
  results.push(
    await delta(
      "14-filter-blur",
      h("div", { style: { ...base, padding: 60 } }, h("div", {
        style: { width: 300, height: 200, backgroundColor: D.acc },
      })),
      h("div", { style: { ...base, padding: 60 } }, h("div", {
        style: { width: 300, height: 200, backgroundColor: D.acc, filter: "blur(12px)" },
      }))
    )
  )
  results.push(
    await delta(
      "15-mix-blend-mode",
      h("div", { style: { ...base, padding: 60, display: "flex" } }, h("div", {
        style: { width: 300, height: 200, backgroundColor: D.acc },
      })),
      h("div", { style: { ...base, padding: 60, display: "flex" } }, h("div", {
        style: {
          width: 300,
          height: 200,
          backgroundColor: D.acc,
          mixBlendMode: "screen",
        },
      }))
    )
  )

  // --- 7. text-decoration / letterSpacing sanity ------------------------
  results.push(
    await delta(
      "16-letter-spacing",
      h("div", { style: { ...base, padding: 60, fontFamily: "JetBrainsMono", fontSize: 9, letterSpacing: 0 } }, "CONTRIBUTORS · 24"),
      h("div", { style: { ...base, padding: 60, fontFamily: "JetBrainsMono", fontSize: 9, letterSpacing: "0.14em" } }, "CONTRIBUTORS · 24"),
      fonts
    )
  )

  console.log(JSON.stringify(results, null, 2))
}

main().catch((e) => {
  console.error("PROBE FAILED:", e)
  process.exit(1)
})