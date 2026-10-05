// PROTOTYPE — ticket 05. Throwaway.
//
//   pnpm tsx prototypes/og-cards/probe/tiles.ts
//
// Tiles for five real Contributors, chosen to span every axis the card has to
// survive rather than to flatter it:
//
//   | Contributor | Recordings | why this one |
//   |---|---|---|
//   | Enzo Manuel Mangano (Reactiive) | 138 | 46% of the catalogue, 11 Categories, and the **widest name** at 930px/60px |
//   | Hewad Mubariz | 31 | 12 Categories — the broadest spread of anyone |
//   | Daehyeon Mun (문대현) | 4 | **Hangul**, and the name every slugifier here has destroyed |
//   | Aswin C | 5 | the **shortest name** at 211px/60px — the other end of the 4.4x spread |
//   | Hubert Ryan | 1 | the **minimum**: a Contributor with exactly one Recording |
//
// Order is the site's own: `data/recording.ts:122` sorts `created_at` descending.
// Not an invention — it is the order `/` already serves.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import sharp from "sharp"
import { allRecordings } from "../../../data/catalogue"

const OUT = new URL("../tiles/contrib/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const CAST = ["Enzo Manuel Mangano (Reactiive)", "Hewad Mubariz", "Daehyeon Mun (문대현)", "Aswin C", "Hubert Ryan"]
const W = 168
const H = Math.round((W * 116) / 92)

const all = allRecordings as any[]
const byName = new Map<string, any[]>()
for (const r of all) {
  if (!byName.has(r.contributor)) byName.set(r.contributor, [])
  byName.get(r.contributor)!.push(r)
}
// The site's own order, newest first.
const newestFirst = (rs: any[]) =>
  [...rs].sort((a, b) => {
    if (!a.created_at && !b.created_at) return 0
    if (!a.created_at) return 1
    if (!b.created_at) return -1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

async function main() {
  const index: any[] = []
  for (const name of CAST) {
    const rs = newestFirst(byName.get(name) ?? [])
    // Up to 12 tiles: enough for a dense field, and it keeps the PNG small.
    const use = rs.slice(0, 12)
    const files: string[] = []
    for (const r of use) {
      const p = `public/${r.posterPath}`
      const key = `${name.split(" ")[0]}-${r.id.slice(-6)}`
      const buf = await sharp(readFileSync(p)).resize(W, H, { fit: "cover", position: "top" }).jpeg({ quality: 76, mozjpeg: true }).toBuffer()
      writeFileSync(`${OUT}${key}.jpg`, buf)
      files.push(key)
    }
    index.push({
      name,
      count: rs.length,
      categories: new Set(rs.map((r) => r.category)).size,
      tiles: files,
      newest: use[0] ? { caption: use[0].caption, at: use[0].created_at?.slice(0, 10) } : null,
      oldest: rs.length ? { caption: rs[rs.length - 1].caption, at: rs[rs.length - 1].created_at?.slice(0, 10) } : null,
    })
  }
  writeFileSync(`${OUT}index.json`, JSON.stringify(index, null, 1))
  console.table(
    index.map((i) => ({
      name: i.name,
      recordings: i.count,
      categories: i.categories,
      tiles: i.tiles.length,
      newest: `${i.newest?.caption?.slice(0, 22)} (${i.newest?.at})`,
      oldest: `${i.oldest?.caption?.slice(0, 22)} (${i.oldest?.at})`,
    }))
  )
  const kb = index.flatMap((i) => i.tiles).length
  console.log(`${kb} tiles at ${W}x${H}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
