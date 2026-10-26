// PROTOTYPE — ticket 04 round 3. Renders the six Ramp-family variants.
//
// Round 3 follows the maintainer's choice of ramp-dark, and applies impeccable's
// 61-rule catalogue by hand (its CLI cannot read a Satori card — see the header of
// variants-ramp.tsx for which of round 2's devices were genuine hits).
//
//   pnpm tsx .scratch/social-cards/preview/render-mark.tsx
//
// Needs the tiles first:
//   pnpm tsx .scratch/social-cards/preview/grid-renditions.ts

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

import { VARIANTS, render, type Mode } from "./variants-ramp"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [
  ...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)),
  F("JetBrainsMono", 400),
  F("JetBrainsMono", 700),
]

const OUT = new URL("./out-ramp/", import.meta.url).pathname
const MODES: Mode[] = ["dark", "light"]

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const results: any = {}
  for (const v of VARIANTS) {
    for (const m of MODES) {
      const label = `${v.key}-${m}`
      try {
        const res = new ImageResponse(render(v.key as any, m) as any, { width: 1200, height: 630, fonts })
        const buf = Buffer.from(await res.arrayBuffer())
        writeFileSync(`${OUT}${label}.png`, buf)
        results[label] = { ok: true, kb: +(buf.length / 1024).toFixed(1) }
      } catch (e) {
        results[label] = { ok: false, error: (e as Error).message.slice(0, 120) }
        console.error("FAILED", label, (e as Error).message)
      }
    }
  }
  writeFileSync(new URL("./gallery-ramp.html", import.meta.url).pathname, galleryHTML())
  console.log(JSON.stringify(results, null, 1))
  console.log(`\n${Object.values(results).filter((r: any) => r.ok).length} renders -> ${OUT}`)
}

function galleryHTML() {
  const cards = VARIANTS.flatMap((v) =>
    MODES.map(
      (m) => `<figure data-v="${v.key}-${m}">
  <img src="./out-ramp/${v.key}-${m}.png" width="1200" height="630" alt="">
  <figcaption><b>${v.key} · ${m}</b> — ${v.bet}</figcaption>
</figure>`
    )
  ).join("\n")

  const strips = VARIANTS.map((v) => {
    const one = (w: number, label: string) =>
      h(`<div class="cell"><img src="./out-ramp/${v.key}-dark.png" style="width:${w}px" alt=""><span>${label} · ${w}px</span></div>`)
    return `<section data-v="${v.key}"><h2>${v.key} · ${v.name}</h2><p class="bet">${v.bet}</p>
      <div class="strip">${one(360, "Slack")}${one(300, "iMessage")}${one(504, "X")}</div></section>`
  }).join("\n")

  return `<!doctype html>
<meta charset="utf-8">
<title>Ticket 04 round 3 — the ramp, made beautiful</title>
<!-- PROTOTYPE. Throwaway. Real ImageResponse output. -->
<style>
  body { margin:0; background:#17181c; color:#e9eaee; font:14px/1.5 ui-sans-serif,system-ui,sans-serif; padding:0 0 40px }
  header { padding:20px 28px; border-bottom:1px solid #2a2c33 }
  h1 { font-size:16px; margin:0 0 4px; font-weight:600 }
  .sub { color:#9aa0aa; font-size:13px; max-width:920px }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:20px; padding:24px 28px }
  figure { margin:0; background:#0A0B0D; border:1px solid #2a2c33; border-radius:12px; overflow:hidden }
  figure img { display:block; width:100%; height:auto }
  figcaption { padding:9px 12px; font-size:12px; color:#9aa0aa; border-top:1px solid #2a2c33 }
  figcaption b { color:#6FE3CC }
  section { padding:24px 28px; border-top:1px solid #2a2c33 }
  h2 { font-size:15px; margin:0 0 2px; color:#6FE3CC }
  .bet { color:#9aa0aa; font-size:13px; margin:0 0 14px }
  .strip { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap }
  .cell { display:flex; flex-direction:column; gap:6px }
  .cell img { display:block; border-radius:6px; border:1px solid #2a2c33 }
  .cell span { color:#8E949F; font-size:11px }
  .bar { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); display:flex; align-items:center; gap:14px;
         background:#0A0B0D; border:1px solid #3a3d45; border-radius:999px; padding:9px 15px; z-index:9 }
  .bar button { background:#23252b; color:#F1F2F4; border:1px solid #3a3d45; border-radius:999px; width:30px; height:30px; cursor:pointer }
  .bar .now { min-width:280px; text-align:center; font-size:13px }
  .bar .now i { color:#6FE3CC; font-style:normal; font-weight:600 }
</style>
<header>
  <h1>The ramp, made beautiful</h1>
  <div class="sub">You chose <b>ramp-dark</b>. These are six ramps, and they differ from round 2 by applying <b>impeccable.style</b>'s rule catalogue — which is severe about what round 2 did.</div>
  <div class="sub"><b>Removed:</b> the radial-gradient halos (<i>"a familiar AI background effect… remove the glow when it has no role"</i>), the neon on every tile (<i>"a wall of neon"</i>), the hairline <i>and</i> wide shadow together, and the hero-metric stat triple (<i>"a familiar landing-page template"</i>).</div>
  <div class="sub"><b>Kept:</b> <code>--media-glow</code> — but on <b>three tiles per card</b>, not twenty-two. The rule asks for restraint, and restraint is available without touching a token. The Design's accent is <i>also</i> on its overused-palette list; that is the Design's, and the map binds us to it.</div>
  <div class="sub">Every Poster is real, from <code>data/catalogue.ts</code>. Every caption is a real Recording caption. The claim is the homepage's own h1.</div>
  <div class="sub">← → flip</div>
</header>
<div class="grid">${cards}</div>
${strips}
<div class="bar"><button onclick="go(-1)">‹</button><span class="now" id="now"></span><button onclick="go(1)">›</button></div>
<script>
  const KEYS = ${JSON.stringify(VARIANTS.flatMap((v) => MODES.map((m) => ({ key: v.key + "-" + m, name: v.name, bet: v.bet }))))};
  let i = Math.max(0, KEYS.findIndex(k => k.key === new URLSearchParams(location.search).get('variant')));
  function go(d){ i = (i + d + KEYS.length) % KEYS.length; set(); }
  function set(){
    const k = KEYS[i];
    const u = new URL(location.href); u.searchParams.set('variant', k.key);
    history.replaceState(null,'',u);
    document.querySelectorAll('[data-v]').forEach(f => { f.style.display = (f.dataset.v === k.key || f.dataset.v === k.key.split('-')[0]) ? '' : 'none'; });
    document.getElementById('now').innerHTML = '<i>'+k.key+'</i><br>'+k.bet;
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
