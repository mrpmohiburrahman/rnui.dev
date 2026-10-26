// PROTOTYPE — ticket 06 round 2. Renders the four improved D variants.
//
//   pnpm tsx .scratch/social-cards/preview/render-d2.tsx
//
// Same subjects as round 1: the shortest caption, the median, the longest in the
// catalogue against the longest name, a no-hue Recording, and a landscape Poster.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { ImageResponse } from "next/og"

import { VARIANTS, render, rendition, type Subject } from "./variants-d2"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [
  ...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)),
  F("JetBrainsMono", 400),
  F("JetBrainsMono", 700),
]

const OUT = new URL("./out-d2/", import.meta.url).pathname

const SUBJECTS: Subject[] = [
  { key: "snake", caption: "Snake", contributor: "Pushkar Tandon", category: "Full Apps",
    hue: 356, poster: rendition("snake"), aspect: 0.477 },
  { key: "fluid", caption: "Fluid Carousels", contributor: "William Candillon", category: "Carousels",
    hue: 167, poster: rendition("fluid"), aspect: 0.4721 },
  { key: "worst", caption: "Spread Cards Effect ( Color Swatch )", contributor: "Enzo Manuel Mangano (Reactiive)",
    category: "Misc", hue: 273, poster: rendition("ripple"), aspect: 0.605 },
  { key: "noster", caption: "Toast", contributor: "Enzo Manuel Mangano (Reactiive)", category: "Misc",
    hue: undefined, poster: null },
  { key: "land", caption: "Reanimated Bottom Sheet", contributor: "Kacper Kapuściak", category: "Bottom Sheets",
    hue: 210, poster: rendition("land"), aspect: 1.7778 },
  { key: "hangul", caption: "Ripple Effect With React Native Skia", contributor: "Daehyeon Mun (문대현)",
    category: "Misc", hue: 25, poster: rendition("ripple"), aspect: 0.605 },
]

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const results: any = {}
  for (const v of VARIANTS) {
    for (const s of SUBJECTS) {
      const label = `${v.key}-${s.key}`
      try {
        const res = new ImageResponse(render(v.key as any, s) as any, { width: 1200, height: 630, fonts })
        const buf = Buffer.from(await res.arrayBuffer())
        writeFileSync(`${OUT}${label}.png`, buf)
        results[label] = { ok: true, kb: +(buf.length / 1024).toFixed(1) }
      } catch (e) {
        results[label] = { ok: false, error: (e as Error).message }
        console.error("FAILED", label, (e as Error).message)
      }
    }
  }
  console.log(JSON.stringify(results, null, 1))
  writeFileSync(new URL("./gallery-d2.html", import.meta.url).pathname, galleryHTML())
  console.log(`\n${Object.values(results).filter((r: any) => r.ok).length} renders -> ${OUT}`)
}

/**
 * The gallery, with one addition round 1 lacked: a **real-size strip** per
 * variant. The whole objection to D was that its small text is unreadable at
 * platform widths, and a gallery that only ever shows 1200px cannot show that.
 * So each variant also appears at 360px (Slack) and 300px (iMessage), which is
 * the size the reader actually gets.
 */
function galleryHTML() {
  const cards = VARIANTS.flatMap((v) =>
    SUBJECTS.map(
      (s) => `<figure data-v="${v.key}">
  <img src="./out-d2/${v.key}-${s.key}.png" width="1200" height="630" alt="${v.key} ${s.key}">
  <figcaption><b>${v.key} · ${v.name}</b> — ${s.caption} <span class="m">(${s.contributor})</span></figcaption>
</figure>`
    )
  ).join("\n")

  const strips = VARIANTS.map((v) => {
    const one = (w: number, label: string) =>
      SUBJECTS.filter((s) => ["snake", "worst"].includes(s.key))
        .map((s) => `<div class="cell"><img src="./out-d2/${v.key}-${s.key}.png" style="width:${w}px" alt=""><span>${label} · ${w}px</span></div>`)
        .join("")
    return `<section data-v="${v.key}">
  <h2>${v.key} · ${v.name}</h2>
  <p class="bet">${v.bet}</p>
  <div class="strip">${one(360, "Slack")}${one(300, "iMessage")}${one(504, "X")}</div>
</section>`
  }).join("\n")

  return `<!doctype html>
<meta charset="utf-8">
<title>Ticket 06 round 2 — D improved</title>
<!-- PROTOTYPE. Throwaway. Real ImageResponse output. -->
<style>
  body { margin:0; background:#17181c; color:#e9eaee; font:14px/1.5 ui-sans-serif,system-ui,sans-serif; padding:0 0 96px }
  header { padding:20px 28px; border-bottom:1px solid #2a2c33 }
  h1 { font-size:16px; margin:0 0 4px; font-weight:600 }
  .sub { color:#9aa0aa; font-size:13px }
  h2 { font-size:15px; margin:0 0 2px; color:#6FE3CC }
  .bet { color:#9aa0aa; font-size:13px; margin:0 0 14px }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:20px; padding:24px 28px }
  figure { margin:0; background:#0A0B0D; border:1px solid #2a2c33; border-radius:12px; overflow:hidden }
  figure img { display:block; width:100%; height:auto }
  figcaption { padding:9px 12px; font-size:12px; color:#9aa0aa; border-top:1px solid #2a2c33 }
  figcaption b { color:#6FE3CC }
  .m { color:#6b7078 }
  section { padding:24px 28px; border-top:1px solid #2a2c33 }
  .strip { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap }
  .cell { display:flex; flex-direction:column; gap:6px }
  .cell img { display:block; border-radius:6px; border:1px solid #2a2c33 }
  .cell span { color:#8E949F; font-size:11px }
  .bar { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); display:flex; align-items:center; gap:14px;
         background:#0A0B0D; border:1px solid #3a3d45; border-radius:999px; padding:9px 15px; z-index:9 }
  .bar button { background:#23252b; color:#F1F2F4; border:1px solid #3a3d45; border-radius:999px; width:30px; height:30px; cursor:pointer }
  .bar .now { min-width:230px; text-align:center; font-size:13px }
  .bar .now i { color:#6FE3CC; font-style:normal; font-weight:600 }
  .bar .s2 { color:#8E949F; font-size:12px }
</style>
<header>
  <h1>Ticket 06, round 2 — D (Split) improved</h1>
  <div class="sub">Four improved versions. Below each: the same cards at <b>360px (Slack)</b>, <b>300px (iMessage)</b> and <b>504px (X)</b> — the sizes a reader actually gets.</div>
  <div class="sub">← → flip variants</div>
</header>
<div class="grid">${cards}</div>
${strips}
<div class="bar"><button onclick="go(-1)">‹</button><span class="now" id="now"></span><button onclick="go(1)">›</button></div>
<script>
  const KEYS = ${JSON.stringify(VARIANTS.map((v) => ({ key: v.key, name: v.name, bet: v.bet })))};
  let i = Math.max(0, KEYS.findIndex(k => k.key === new URLSearchParams(location.search).get('variant')));
  function go(d){ i = (i + d + KEYS.length) % KEYS.length; set(); }
  function set(){
    const k = KEYS[i];
    const u = new URL(location.href); u.searchParams.set('variant', k.key);
    history.replaceState(null,'',u);
    document.querySelectorAll('[data-v]').forEach(f => { f.style.display = f.dataset.v === k.key ? '' : 'none'; });
    document.getElementById('now').innerHTML = '<i>'+k.key+' · '+k.name+'</i><br><span class="s2">'+k.bet+'</span>';
  }
  addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1);
  });
  set();
</script>
`
}

main().catch((e) => {
  console.error("FAILED", e)
  process.exit(1)
})
