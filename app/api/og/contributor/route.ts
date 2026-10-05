// app/api/og/contributor/route.ts
//
// The Contributor Open Graph card, at /api/og/contributor?name=<exact name>&v=<key>.
//
// ## Why this is a route and not an `opengraph-image.tsx`
//
// An `opengraph-image` file convention **cannot see a search param**. Next's own docs give
// `app/shop/opengraph-image.js` a `params` of `undefined`, and it carries route params only —
// never `searchParams`. The Contributor's identity on this site lives *in* a search param
// (`/products?contributor=<exact name>`), so the card cannot be a file convention. It is a
// route, and `app/products/page.tsx`'s `generateMetadata` points `openGraph.images` here.
//
// ## Why the URL carries `v`
//
// A card is mutable: when a Contributor's next Recording lands, the fan changes and the count
// goes up, but the name does not. Ticket 03 measured that **an existing LinkedIn share is
// permanent** — a refresh reaches new posts only — and RFC 9111 §4 makes a *different target
// URI* a different cache entry. So the key carries the newest Recording's id: when the fan
// changes, the URL changes, and every old share keeps the fan it was made with instead of
// silently disagreeing with the page it points at.
//
// The key is a hash of the folded name plus that id. It is **not a slug**: ADR-0009 gives a
// Contributor no slug and no id, and the page address stays `/products?contributor=<exact
// name>`. Only this opaque cache key is derived, and it never appears in a link a person sees.
//
// ## Why the Posters are fetched and converted here
//
// **Every Poster is AVIF and Satori refuses AVIF** — and it refuses it *silently*, rendering a
// blank card rather than throwing, which in production is invisible. So each tile is fetched
// from the CDN and converted to PNG with sharp before Satori sees it.
//
// That is a per-request cost, deliberately. The alternative — pre-converted Rendition files —
// is what CONTEXT.md and ADR-0012 describe, and it is the better shape for a card that is
// requested often. It is not built yet because `public/thumbnails/` is gitignored and the
// Posters live on R2, so a rendition pipeline means a publish step against the bucket, which
// is a credentialed operation and not this route's business. The cost here is bounded and
// paid rarely: scrapers cache an OG image hard (Slack ~30 minutes, LinkedIn permanently), and
// tiles are memoised per process, so a cold render is the only one that pays full price.

import { NextResponse } from "next/server"
import sharp from "sharp"

import { allRecordings } from "@/data/catalogue"
import { getCdnUrl } from "@/lib/cdn"
import { existingContributor } from "@/lib/contributor-match"
import { AR, DECK, renderContributorCard, solveFan } from "@/lib/og-contributor-card"

/**
 * sharp is a Node library, so this cannot be an edge function. Not a preference — `edge`
 * has no `node:fs` and no native modules, and this route reads font files and decodes AVIF.
 */
export const runtime = "nodejs"

/**
 * **Never statically optimised.** Next's docs: generated images are "statically optimized
 * (generated at build time and cached) unless they use Request-time APIs or uncached data."
 * A card that forgets to opt out freezes its count at build time and silently undoes the
 * decision that these cards render live. `force-dynamic` is that opt-out, and it is load
 * bearing rather than decorative.
 */
export const dynamic = "force-dynamic"

/** Every spelling the catalogue holds, for the matcher. */
const NAMES = [...new Set((allRecordings as { contributor: string }[]).map((r) => r.contributor))]

/** The five newest Recordings for a Contributor, by the catalogue's own order. */
function recordingsFor(contributor: string) {
  return (allRecordings as { id: string; contributor: string; posterPath: string; created_at?: string }[])
    .filter((r) => r.contributor === contributor)
    // Newest first, with a missing `created_at` sorted last rather than first — an undated
    // Recording is not the newest thing anyone has made.
    .sort((a, b) => ((a.created_at ?? "") < (b.created_at ?? "") ? 1 : -1))
}

/**
 * Tiles are memoised per process, keyed by Poster path.
 *
 * The key includes the pixel size, because a fan of one tile and a fan of eight solve to
 * different widths and the same Poster may legitimately appear at either.
 */
const tileCache = new Map<string, string>()

async function tileFor(posterPath: string, w: number): Promise<string | null> {
  const hh = Math.round(w * AR)
  const key = `${posterPath}@${w}x${hh}`
  const hit = tileCache.get(key)
  if (hit) return hit

  try {
    const res = await fetch(getCdnUrl(posterPath))
    if (!res.ok) return null
    const src = Buffer.from(await res.arrayBuffer())

    // **2x, capped at the source.** A 287px tile on a 1200px card is legible at 1x but soft
    // on a retina preview; `withoutEnlargement` stops it upscaling the 332px Posters, which
    // are the smallest in the catalogue.
    //
    // **JPEG, not PNG.** This was PNG at `compressionLevel: 9`, which measured 27ms and 4KB a
    // tile here and blew the function budget on a cold lambda with eight of them. JPEG at
    // q82 is 19ms and about half the payload, and it is what the approved prototype renders
    // used (`probe/tiles.ts`, `jpeg({ quality: 76, mozjpeg: true })`), so this also matches
    // what was signed off. Satori takes a JPEG data URI exactly as it takes a PNG one — the
    // whole reason these tiles are converted at all is that Satori refuses **AVIF**, not that
    // it refuses JPEG.
    const jpg = await sharp(src)
      .resize(w * 2, hh * 2, { fit: "cover", position: "top", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()

    const uri = `data:image/jpeg;base64,${jpg.toString("base64")}`
    tileCache.set(key, uri)
    return uri
  } catch {
    // A tile that cannot be fetched is left out rather than failing the card: the name, the
    // wordmark and the count are the card's actual content, and a missing Poster must not
    // cost a reader all three.
    return null
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const rawName = url.searchParams.get("name") ?? ""

  // **A match against the catalogue, or nothing.** An unknown name renders no card rather than
  // a card with an empty fan, because a share of a Contributor who does not exist should not be
  // a 200 with a stranger's name on it.
  //
  // Resolved with `lib/contributor-match.ts` — ADR-0009's own rule, already implemented and
  // tested there. This route had its own fold first, which is the third copy of that rule in
  // this feature and the reason a mis-cased name could reach it.
  const match = existingContributor(rawName, NAMES)

  if (!match) {
    return new NextResponse("Unknown contributor", { status: 404 })
  }

  const theirs = recordingsFor(match)
  const cap = Math.max(1, Math.min(DECK.n, theirs.length || 1))
  const { w } = solveFan(cap)

  // Newest first, capped at the fan's tile count. `data/recording.ts` sorts `created_at`
  // descending for `/`, so this is the order the site itself serves — not an invention.
  const tiles = (
    await Promise.all(theirs.slice(0, cap).map((r) => tileFor(r.posterPath, w)))
  ).filter((t): t is string => typeof t === "string")

  const png = await renderContributorCard({ name: match, count: theirs.length, tiles: tiles.map((src) => ({ src })) })

  // **`immutable`, and this is a correction rather than a flourish.**
  //
  // The first version sent `public, max-age=0, must-revalidate` — what the settled cards send,
  // and what ticket 03 concluded was the tightest thing RFC 9111 permits. That is right for a
  // card whose URL is stable, and **wrong for this one**, because this URL is not stable: it
  // carries `v`, a hash of the folded name and the newest Recording's id. When the fan or the
  // count changes, `v` changes, so the address changes, so the response at any one address
  // never changes. That is a content-addressed URL and the correct header for it is immutable.
  //
  // It matters because of what the first version did in production: **every contributor with 5
  // or more Recordings returned 504.** A cold lambda re-fetches and re-converts up to eight
  // tiles from the CDN on every single request, because the tile memo is per-process and dies
  // with the lambda — so four concurrent scrapes meant four cold renders, and the fan was the
  // most expensive one on the site. With `immutable` the edge serves it after the first hit and
  // the cost is paid once per Contributor-version instead of once per request.
  //
  // No ETag and no Last-Modified still: a validator would invite a 304 re-running the render,
  // which is the one thing this route cannot afford.
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
