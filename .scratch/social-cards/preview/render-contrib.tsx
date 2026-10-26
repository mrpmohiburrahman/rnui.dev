// PROTOTYPE — ticket 05, the text-size study on the **Plain, no-disc** layout.
// Renders 6 text scales x 5 real Contributors in light mode.
//
//   pnpm tsx .scratch/social-cards/preview/render-contrib.tsx
//
// Light only: the maintainer chose the Plain, no-disc card **in light mode**, and dark was
// never in question. The other seven layouts are deleted — see `variants-contrib.tsx`.
//
// The cast is chosen to span every axis rather than to flatter: the 138-Recording
// contributor who owns 46% of the catalogue and has the widest name, the
// 31-Recording contributor with the broadest Category spread, the Hangul name, the
// shortest name in the set, and the one-Recording minimum.
//
// Nothing but the type differs between the five, so every difference in the gallery is
// a difference in reading size — which is the whole point of the study.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

import { VARIANTS, CAST, SCALES, render, type Mode, SAFE_W, NAME_MAX } from "./variants-contrib"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [
  ...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)),
  F("JetBrainsMono", 400),
  F("JetBrainsMono", 700),
]

const OUT = new URL("./out-contrib/", import.meta.url).pathname
const MODES: Mode[] = ["light"]

/** Filenames must survive `|`, Hangul and parentheses. */
const slug = (s: string) =>
  s.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const results: any = {}
  for (const v of VARIANTS) {
    for (const who of CAST) {
      for (const m of MODES) {
        const label = `${v.key}--${slug(who.name)}--${m}`
        try {
          const res = new ImageResponse(render(v.key, m, who) as any, { width: 1200, height: 630, fonts })
          const buf = Buffer.from(await res.arrayBuffer())
          writeFileSync(`${OUT}${label}.png`, buf)
          results[label] = { ok: true, kb: +(buf.length / 1024).toFixed(1) }
        } catch (e) {
          results[label] = { ok: false, error: (e as Error).message.slice(0, 90) }
          console.error("FAILED", label, (e as Error).message.slice(0, 140))
        }
      }
    }
  }
  writeFileSync(new URL("./gallery-contrib.html", import.meta.url).pathname, galleryHTML())
  const ok = Object.values(results).filter((r: any) => r.ok).length
  console.log(JSON.stringify(Object.fromEntries(Object.entries(results).filter(([, r]: any) => !r.ok)), null, 1))
  console.log(`${ok}/${Object.keys(results).length} renders -> ${OUT}`)
  if (ok !== Object.keys(results).length) process.exit(1)
}

function galleryHTML() {
  const cards = VARIANTS.flatMap((v) =>
    CAST.flatMap((who) =>
      MODES.map(
        (m) => `<figure data-v="${v.key}">
  <img src="./out-contrib/${v.key}--${slug(who.name)}--${m}.png" width="1200" height="630" alt="">
  <figcaption><b>${v.key} · ${m}</b> — ${who.name} · <b>${who.count}</b> Recordings · ${who.categories} Categories</figcaption>
</figure>`
      )
    )
  ).join("\n")

  const strips = VARIANTS.map((v) => {
    const s = SCALES.find((x) => x.key === v.key)!
    const one = (w: number, label: string) =>
      CAST.map(
        (who) =>
          `<div class="cell"><img src="./out-contrib/${v.key}--${slug(who.name)}--light.png" style="width:${w}px" alt=""><span>${label} · ${w}px · ${who.name.split(" ")[0]}</span></div>`
      ).join("")
    return `<section data-v="${v.key}"><h2>${v.key} · ${v.name}</h2><p class="bet">${v.bet}</p>
      <p class="nums">mark <b>${s.mark}</b> · name <b>${s.name_}</b>${s.nowrap ? " (one line)" : " (wraps)"} → <b>${(s.name_ * 0.3).toFixed(1)}px</b> on screen · count <b>${s.num}</b> → <b>${(s.num * 0.3).toFixed(1)}px</b> · words <b>${s.words}</b>${s.stack ? " · stacked to 2 lines" : " · one line"} · column <b>${s.col ?? 560}px</b></p>
      <div class="strip">${one(360, "Slack")}${one(300, "iMessage")}</div></section>`
  }).join("\n")

  return `<!doctype html>
<meta charset="utf-8">
<title>Ticket 05 — Plain, no disc: one layout at five text sizes</title>
<!-- PROTOTYPE. Throwaway. Real ImageResponse output. -->
<style>
  body { margin:0; background:#17181c; color:#e9eaee; font:14px/1.5 ui-sans-serif,system-ui,sans-serif; padding:0 0 40px }
  header { padding:20px 28px; border-bottom:1px solid #2a2c33 }
  h1 { font-size:16px; margin:0 0 4px; font-weight:600 }
  .sub { color:#9aa0aa; font-size:13px; max-width:940px }
  b.n { color:#6FE3CC }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:20px; padding:24px 28px }
  figure { margin:0; background:#F4F4F1; border:1px solid #2a2c33; border-radius:12px; overflow:hidden }
  figure img { display:block; width:100%; height:auto }
  figcaption { padding:9px 12px; font-size:12px; color:#9aa0aa; border-top:1px solid #2a2c33 }
  figcaption b { color:#6FE3CC }
  section { padding:24px 28px; border-top:1px solid #2a2c33 }
  h2 { font-size:15px; margin:0 0 2px; color:#6FE3CC }
  .bet { color:#9aa0aa; font-size:13px; margin:0 0 6px }
  .nums { color:#8E949F; font-size:12px; margin:0 0 14px; font-family:ui-monospace,monospace }
  .nums b { color:#e9eaee }
  .strip { display:flex; gap:18px; align-items:flex-start; flex-wrap:wrap }
  .cell { display:flex; flex-direction:column; gap:6px }
  .cell img { display:block; border-radius:6px; border:1px solid #2a2c33 }
  .cell span { color:#8E949F; font-size:11px }
  .bar { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); display:flex; align-items:center; gap:14px;
         background:#0A0B0D; border:1px solid #3a3d45; border-radius:999px; padding:9px 15px; z-index:9 }
  .bar button { background:#23252b; color:#F1F2F4; border:1px solid #3a3d45; border-radius:999px; width:30px; height:30px; cursor:pointer }
  .bar .now { min-width:340px; text-align:center; font-size:13px }
  .bar .now i { color:#6FE3CC; font-style:normal; font-weight:600 }
</style>
<header>
  <h1>Ticket 05 — Plain, no disc, light: one layout at five text sizes</h1>
  <div class="sub"><b>The 560px column is the constraint, not Slack&rsquo;s 1068px.</b> Every line of type on this layout lives in that column. Measured by rendering and ink-counting (<code>probe/ticket05/plain-ramp.ts</code>): the name fits on one line only up to <b>36px</b> (556px of 560 &mdash; 4px of margin), the count only up to <b>30px</b>, and the mark has no ceiling at all.</div>
  <div class="sub"><b>So the current card puts its name at 10.8px and its count at 7.8px on a 360px Slack card.</b> The shelf layout measured 20.4px for the same name &mdash; that <b>1.9&times; gap is the whole difference between the two layouts</b>, and it is why this card reads as small while looking correct at full size.</div>
  <div class="sub"><b>Wrapping buys the size back, and it is only the type.</b> A name that wraps takes <b>56px</b> in the same 560px column against 36px on one line, because above 36px the limit is the break point rather than the total. At <b>60px it takes three lines</b>, so 56 is the ceiling. The count takes two lines by construction from 38px up. Nothing is re-laid-out: same column, same 3&times;2 grid of 152px tiles, same margins &mdash; except <b>Wide</b>, which drops the grid to 2&times;2 to buy the name one line and is the price of that, shown.</div>
  <div class="sub"><b>Two break bugs, both found by rendering rather than reasoning.</b> CSS breaks CJK between any two characters, so at 56px <code>Daehyeon Mun (문대현)</code> came out as <code>(문대</code> / <code>현)</code> &mdash; and <code>lib/contributor-match.ts:27-31</code> exists because every slugifier here has already destroyed that name. <code>word-break: keep-all</code> fixes it and Satori honours it. But Satori&rsquo;s break point is <b>not monotonic in the size</b>: 44px breaks <code>Enzo Manuel Mangano (</code> / <code>Reactiive)</code> cleanly and <b>52px orphans the parenthesis again</b>. Binding the parenthetical to its word with a non-breaking space removes the decision. <code>Current</code> keeps the shipped behaviour, defects included, because a control with the bugs fixed is not a control.</div>
  <div class="sub">Five real Contributors, chosen to span every axis: <b>138</b> Recordings / 11 Categories / the widest name · <b>31</b> / 12 Categories / the broadest spread · <b>문대현</b> · the shortest name · <b>1</b> Recording, the minimum.</div>
  <div class="sub">← → flip · widths from <code>probe/ticket05/type-ramp.ts</code>, this layout&rsquo;s ceilings from <code>probe/ticket05/plain-ramp.ts</code></div>
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
    document.getElementById('now').innerHTML = '<i>'+k.key+' · '+k.name+'</i><br>'+k.bet;
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