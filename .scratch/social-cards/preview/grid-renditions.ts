// PROTOTYPE — ticket 04, the default card. Throwaway; nothing ships.
//
//   pnpm tsx .scratch/social-cards/preview/grid-renditions.ts
//
// Builds the JPEGs a *Poster-grid* card needs. Ticket 06 established the shape of
// this: a card composites a **Rendition**, never a Poster, because every Poster
// is AVIF and Satori refuses AVIF silently. For a single-poster card that means a
// 1200×630 or a true-ratio tile. For a grid it means a *cropped square* tile, and
// a crop is exactly what ticket 06 measured at 25% — so the crop's cost is
// measured here rather than assumed.
//
// Selection is greedy on hue distance, because a grid of eight Posters that all
// measure hue 356 is a grid of one colour. Real Recordings, real Posters, read
// off disk — nothing invented.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import sharp from "sharp"

import { allRecordings } from "../../../data/catalogue"

const OUT = new URL("./grid/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

/**
 * Two tile sizes, because the two jobs are different.
 *
 * The **wall** wants 8 big tiles it can read as screenshots. The scatter, orbit
 * and ramp treatments want many small ones, where the tile is texture rather than
 * a picture — and at 1/3 the linear size the same eight tiles cost 1/9 the bytes.
 * Small tiles are also generated from *more* Posters, because eight tiles
 * scattered across a card repeat visibly and twenty do not.
 */
const N = 8
const TILE_W = 200
const TILE_H = 250
const SMALL_W = 92
const SMALL_H = 116
const N_SMALL = 22

type Row = { key: string; caption: string; contributor: string; hue: number; aspect: number; path: string }

/**
 * Eight Recordings, spread by hue.
 *
 * Greedy farthest-point on the hue circle from the first unmeasured hue, then
 * never two from the same Category -- so the wall shows the catalogue's breadth
 * rather than the eight largest Categories. `Misc` is 161 of 298 and would
 * otherwise take every slot.
 */
function pick(n = N, skip = 0): Row[] {
  const have = (allRecordings as any[]).filter((r) => existsSync(`public/${r.posterPath}`))
  const out: Row[] = []
  const usedCats = new Set<string>()
  const chosen = new Set<string>()

  for (let k = 0; k < n; k++) {
    let best: any = null
    let bestScore = -1
    for (const r of have) {
      if (chosen.has(r.posterPath)) continue
      const hue = r.hue ?? 175
      // Circular distance to the nearest hue already on the wall.
      const dist =
        out.length === 0
          ? 180
          : Math.min(...out.map((o) => Math.min(Math.abs(o.hue - hue), 360 - Math.abs(o.hue - hue))))
      // A wall wants variety in shape as well as colour.
      const shape = 1 - Math.min(1, Math.abs(r.aspect - 0.62) / 0.9)
      // Never two from the same Category, discounted rather than banned: Misc is
      // 161 of 298 and a hard ban would starve the wall of tiles entirely.
      const score = dist * (usedCats.has(r.category) ? 0.35 : 1) + shape * 60
      if (score > bestScore) { bestScore = score; best = r }
    }
    if (!best) break
    const row: Row = {
      key: best.posterPath.split("/").pop()!.replace(/\.avif$/, ""),
      caption: best.caption,
      contributor: best.contributor,
      hue: best.hue ?? 175,
      aspect: best.aspect,
      path: `public/${best.posterPath}`,
    }
    // `skip` lets the small set start past the big set, so the wall and the
    // scatter are not the same eight Posters in two sizes.
    if (out.length < skip) { out.push(row); continue }
    chosen.add(best.posterPath)
    usedCats.add(best.category)
    out.push(row)
  }
  return out
}

/**
 * The crop, measured rather than asserted.
 *
 * `fit: cover` into a 200x250 tile. The tile's aspect is 0.8 and a phone Poster's
 * is ~0.46, so the Poster is *narrower* than the tile: sharp matches widths and
 * overflows the height, so the tile keeps
 *
 *     TILE_H * (posterAspect) / TILE_W
 *
 * of the Poster's height -- 250 * 0.4611 / 200 = **58%** -- and throws away the
 * rest from the bottom, where the home indicator and the tab bar live. A
 * landscape Poster is wider than the tile and loses *width* instead.
 *
 * 58% is materially better than the 25% a single-poster card measures, and the
 * reason a wall is defensible where one Poster is not: no tile is being read as
 * a device, the grid reads as texture. The cost is that a cropped grid loses the
 * frame -- and the number below is what shows it.
 */
/** One tile at one size. */
async function tile(r: Row, w: number, h: number, q: number): Promise<Buffer> {
  return sharp(readFileSync(r.path)).resize(w, h, { fit: "cover", position: "top" })
    .jpeg({ quality: q, mozjpeg: true }).toBuffer()
}

/**
 * True-ratio renditions for the *device* set, at the height a card's shelf uses.
 *
 * Ticket 06 established a device frame must follow `Recording.aspect` and never
 * crop, so this set deliberately includes a 1.7778 landscape — which is the case
 * that broke a hard-coded phone shell.
 *
 * These are h900 JPEGs rather than the tile grid's cropped squares, because a
 * device frame shows the whole frame and a tile shows a fragment of it. Emitted
 * here rather than by hand so the set is reproducible: the first attempt listed a
 * device whose rendition had never been generated, and the render failed with a
 * bare ENOENT that named nothing about which of the five was at fault.
 */
const DEVICES: { key: string; aspect: number; posterPath: string }[] = [
  { key: "snake", aspect: 0.477, posterPath: "thumbnails/fullapps/snake_pushkar_tandon.avif" },
  { key: "fluid", aspect: 0.4721, posterPath: "thumbnails/carousels/fluid_carousels_william_candillon.avif" },
  { key: "ripple", aspect: 0.605, posterPath: "thumbnails/misc/ripple_effect_daehyeon_mun.avif" },
  // The catalogue's widest: three Recordings share 1.7778, and this is one of them.
  // A device frame that cannot hold this is a frame that will look broken on them.
  { key: "land", aspect: 1.7778, posterPath: "thumbnails/bottomsheets/reanimated_bottom_sheet_kacper_kapusciak.avif" },
  { key: "morphingLoader", aspect: 0.4633, posterPath: "thumbnails/loaders/morphingLoader.avif" },
]

async function devices() {
  mkdirSync(`${OUT}../renditions/`, { recursive: true })
  const out: any[] = []
  for (const d of DEVICES) {
    const p = `public/${d.posterPath}`
    if (!existsSync(p)) { out.push({ key: d.key, ok: false, error: "no poster on disk" }); continue }
    const buf = await sharp(readFileSync(p))
      .resize({ height: 900, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()
    writeFileSync(`${OUT}../renditions/${d.key}-tall-h900.jpg`, buf)
    const m = await sharp(buf).metadata()
    out.push({ key: d.key, ok: true, out: `${m.width}x${m.height}`, aspect: +(m.width! / m.height!).toFixed(4), claimed: d.aspect, kb: +(buf.length / 1024).toFixed(1) })
  }
  console.log("\n== device renditions (uncropped, true ratio) ==")
  console.table(out)
}

async function main() {
  await devices()

  const small = pick(N_SMALL, N)
  mkdirSync(`${OUT}small/`, { recursive: true })
  writeFileSync(`${OUT}small/index.json`, JSON.stringify(small, null, 1))
  const smallKb: number[] = []
  for (const r of small) {
    const buf = await tile(r, SMALL_W, SMALL_H, 72)
    writeFileSync(`${OUT}small/${r.key}.jpg`, buf)
    smallKb.push(buf.length / 1024)
  }
  console.log(
    `small tiles: ${small.length} at ${SMALL_W}x${SMALL_H}, ` +
      `${(smallKb.reduce((a, b) => a + b, 0)).toFixed(0)} KB total, ` +
      `max ${Math.max(...smallKb).toFixed(1)} KB`
  )

  const rows = pick()
  const report: any[] = []

  for (const r of rows) {
    const src = readFileSync(r.path)
    const meta = await sharp(src).metadata()
    const keptH = Math.min(1, (TILE_H * r.aspect) / TILE_W)
    const keptW = Math.min(1, (TILE_W / TILE_H) * (1 / r.aspect))
    const buf = await tile(r, TILE_W, TILE_H, 78)
    writeFileSync(`${OUT}${r.key}.jpg`, buf)

    // Mean luminance of the *cropped* tile, so the wall's own contrast against
    // --canvas can be judged rather than assumed. 64 of 297 Posters are >90%
    // near-white app chrome (ticket 14), and a wall of white blocks on a near-
    // black canvas reads as broken rather than as a catalogue.
    const { data } = await sharp(buf).greyscale().resize(1, 1).raw().toBuffer({ resolveWithObject: true })
    report.push({
      key: r.key,
      caption: r.caption,
      hue: r.hue,
      aspect: r.aspect,
      poster: `${meta.width}x${meta.height}`,
      keepsH: `${(keptH * 100).toFixed(0)}%`,
      keepsW: `${(keptW * 100).toFixed(0)}%`,
      meanLuma: data[0],
      kb: +(buf.length / 1024).toFixed(1),
    })
  }

  writeFileSync(`${OUT}index.json`, JSON.stringify(rows, null, 1))
  console.table(report)
  const lumas = report.map((r) => r.meanLuma)
  console.log(
    `cropped tiles: ${report.length}, mean luma ${Math.min(...lumas)}–${Math.max(...lumas)}, ` +
      `mean ${(lumas.reduce((a, b) => a + b, 0) / lumas.length).toFixed(0)}, ` +
      `tiles >200 luma (near-white): ${lumas.filter((l) => l > 200).length}`
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
