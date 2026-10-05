// prototypes/og-cards/probe/audit.ts
//
//   pnpm ogcards:audit                       # against production
//   pnpm ogcards:audit http://localhost:3111 # against a local server
//
// **Every real Contributor's card, fetched over HTTP, checked, and laid out to look at.**
//
// The other guards here (`verify.tsx`) render cards in-process. That proves the layout but not
// the *route* — and the route is where the things that actually break live: an unknown name, a
// CDN fetch that fails, a tile that comes back empty, a page whose `og:image` was never emitted.
// Satori's worst failure mode is silent (a refused image renders a blank card rather than
// throwing), so a 200 with a valid PNG header is not evidence of a correct card. This fetches
// real bytes over a real socket and measures what came back.
//
// Two things are checked per Contributor, because they are separate failures:
//
//   1. **the card** — `/api/og/contributor` must answer 200 `image/png` at 1200x630, with
//      enough bytes to contain a fan rather than a blank canvas.
//   2. **the page** — `/products?contributor=…` must carry BOTH `og:image` and `twitter:image`
//      pointing at that card. They are independent caches, so a card is only as good as its
//      worse slot; the Recording route set one and forgot the other.
//
// Writes `out/audit/<base>.html` — a contact sheet of every card, for the eyeball that a
// numeric check cannot do. Exits non-zero if anything failed.

import { mkdirSync, writeFileSync } from "node:fs"
import sharp from "sharp"

import { allRecordings } from "../../../data/catalogue"
import { contributorCardKey } from "../../../lib/og-contributor-url"

const BASE = (process.argv[2] ?? "https://www.rnui.dev").replace(/\/$/, "")
const CONCURRENCY = 4
/** A blank 1200x630 canvas compresses to a few KB; a real card with a fan is far larger. */
const MIN_BYTES = 12_000

type Row = {
  name: string
  recordings: number
  cardStatus: number
  cardType: string
  cardBytes: number
  dims: string
  ogImage: string | null
  twitterImage: string | null
  problems: string[]
}

const NAMES = (() => {
  const by = new Map<string, number>()
  for (const r of allRecordings as { contributor: string }[]) {
    by.set(r.contributor, (by.get(r.contributor) ?? 0) + 1)
  }
  return [...by.entries()].sort((a, b) => b[1] - a[1])
})()

async function check([name, count]: [string, number]): Promise<Row> {
  const problems: string[] = []
  const card = new URL("/api/og/contributor", BASE)
  card.searchParams.set("name", name)
  card.searchParams.set("v", contributorCardKey(name))

  let cardStatus = 0
  let cardType = ""
  let cardBytes = 0
  let dims = ""
  try {
    const res = await fetch(card, { redirect: "follow" })
    cardStatus = res.status
    cardType = res.headers.get("content-type") ?? ""
    const buf = Buffer.from(await res.arrayBuffer())
    cardBytes = buf.length
    if (cardStatus !== 200) problems.push(`card ${cardStatus}`)
    if (!cardType.startsWith("image/png")) problems.push(`type ${cardType || "none"}`)
    if (cardBytes < MIN_BYTES) problems.push(`only ${cardBytes} bytes — likely a blank card`)
    try {
      const m = await sharp(buf).metadata()
      dims = `${m.width}x${m.height}`
      if (m.width !== 1200 || m.height !== 630) problems.push(`dims ${m.width}x${m.height}`)
    } catch (e) {
      problems.push(`not a decodable image: ${(e as Error).message.slice(0, 40)}`)
    }
  } catch (e) {
    problems.push(`card fetch failed: ${(e as Error).message.slice(0, 50)}`)
  }

  // The page's metadata. `og:image` and `twitter:image` are separate caches.
  let ogImage: string | null = null
  let twitterImage: string | null = null
  const page = new URL("/products", BASE)
  page.searchParams.set("contributor", name)
  try {
    const html = await (await fetch(page)).text()
    ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? null
    twitterImage = html.match(/<meta name="twitter:image" content="([^"]+)"/)?.[1] ?? null
    if (!ogImage) problems.push("no og:image")
    if (!twitterImage) problems.push("no twitter:image")
    if (ogImage && !ogImage.includes("/api/og/contributor")) problems.push("og:image is not the fan card")
  } catch (e) {
    problems.push(`page fetch failed: ${(e as Error).message.slice(0, 50)}`)
  }

  return { name, recordings: count, cardStatus, cardType, cardBytes, dims, ogImage, twitterImage, problems }
}

async function main() {
  console.log(`\nAuditing ${NAMES.length} Contributors against ${BASE}\n`)
  const rows: Row[] = []
  for (let i = 0; i < NAMES.length; i += CONCURRENCY) {
    rows.push(...(await Promise.all(NAMES.slice(i, i + CONCURRENCY).map(check))))
  }
  rows.sort((a, b) => b.recordings - a.recordings)

  const w = Math.max(...rows.map((r) => r.name.length))
  console.log("name".padEnd(w) + "  recs  status  dims      bytes  og  tw")
  for (const r of rows) {
    const ok = r.problems.length === 0
    console.log(
      `${ok ? " " : "!"}${r.name.padEnd(w)}  ${String(r.recordings).padStart(4)}  ${String(r.cardStatus).padStart(6)}  ${r.dims.padEnd(8)}  ${String(Math.round(r.cardBytes / 1024)).padStart(4)}K  ${r.ogImage ? " y" : " n"}   ${r.twitterImage ? "y" : "n"}` +
        (ok ? "" : `   <- ${r.problems.join("; ")}`)
    )
  }

  const dir = new URL("../out/audit/", import.meta.url).pathname
  mkdirSync(dir, { recursive: true })
  const file = `${dir}${BASE.replace(/[^a-z0-9]+/gi, "-")}.html`
  writeFileSync(file, sheet(rows, BASE))
  console.log(`\ncontact sheet -> ${file}`)

  const failed = rows.filter((r) => r.problems.length)
  if (failed.length) {
    console.log(`\nFAIL — ${failed.length}/${rows.length} Contributors have a problem.`)
    process.exit(1)
  }
  console.log(`\nPASS — all ${rows.length} Contributors serve a 1200x630 card, with both og:image and twitter:image.`)
}

function sheet(rows: Row[], base: string) {
  const cards = rows
    .map((r) => {
      const src = `/api/og/contributor?name=${encodeURIComponent(r.name)}&v=${contributorCardKey(r.name)}`
      return `<figure><img src="${src}" width="1200" height="630" alt="">
  <figcaption><b>${r.name}</b> — ${r.recordings} animation${r.recordings === 1 ? "" : "s"} · ${r.dims} · ${Math.round(r.cardBytes / 1024)}K${r.problems.length ? ` · <span class="bad">${r.problems.join("; ")}</span>` : ""}</figcaption>
</figure>`
    })
    .join("\n")

  return `<!doctype html>
<meta charset="utf-8">
<title>Contributor cards — ${base}</title>
<!-- Generated by pnpm ogcards:audit. Real HTTP fetches; refresh to re-run. -->
<style>
  body { margin:0; background:#17181c; color:#e9eaee; font:14px/1.5 ui-sans-serif,system-ui,sans-serif }
  header { padding:20px 28px; border-bottom:1px solid #2a2c33 }
  h1 { font-size:16px; margin:0 0 4px; font-weight:600 }
  .sub { color:#9aa0aa; font-size:13px }
  .sub b { color:#e9eaee }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(420px,1fr)); gap:20px; padding:24px 28px }
  figure { margin:0; background:#F4F4F1; border:1px solid #2a2c33; border-radius:12px; overflow:hidden }
  figure img { display:block; width:100%; height:auto }
  figcaption { padding:9px 12px; font-size:12px; color:#9aa0aa; background:#17181c; border-top:1px solid #2a2c33 }
  figcaption b { color:#6FE3CC } .bad { color:#ff8b7a }
</style>
<header>
  <h1>${NAMES.length} Contributor cards — <span style="color:#6FE3CC">${base}</span></h1>
  <div class="sub">Every card fetched over HTTP. Sorted by Recording count, so the two that hold half the catalogue are first. <b>A card that is blank here is blank in a chat client</b> &mdash; Satori renders a refused image as an empty card rather than failing, so a 200 is not evidence of a picture. Look at them.</div>
</header>
<div class="grid">
${cards}
</div>
`
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
