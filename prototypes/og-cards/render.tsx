// PROTOTYPE — ticket 05, the **Fan** card. Throwaway; nothing ships.
//
//   pnpm tsx prototypes/og-cards/render-fan.tsx
//
// Needs `pnpm tsx prototypes/og-cards/probe/tiles.ts` first.
//
// Renders 5 fan geometries x 5 real Contributors at 1200x630, as real `ImageResponse`
// output — no browser, no SVG, nothing the shipping card could not do.
//
// Light only: the maintainer chose the settled card in light mode and the fan is not being
// offered a mode change, only a new arrangement of the same content.
//
// The cast is the same five as the settled card's, chosen to span every axis rather than to
// flatter: **138** Recordings / 11 Categories / the widest name · **31** / 12 Categories /
// the broadest spread · **Daehyeon Mun (문대현)** · the shortest name · **Hubert Ryan**,
// the one-Recording minimum. The last two matter most here, because `Drum`'s tile count is a
// function of the count and a one-card fan is the layout's worst case.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

import { probeFonts } from "./probe/fonts"

import { VARIANTS, CAST, render, columnFor, ceilingFor, nameSizeFor, assertCeilings, unmeasuredColumns } from "./contributor-variants"

const fonts = probeFonts()

const OUT = new URL("./out/cards/", import.meta.url).pathname

/** Filenames must survive Hangul and parentheses. */
const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)

async function main() {
  // A hand-set type size that no longer matches its column is the failure this guards: the
  // renderer would not complain, it would just ship a clipped name on one Contributor.
  const stale = [...unmeasuredColumns(), ...assertCeilings()]
  if (stale.length) { console.error("UNMEASURED TYPE:\n  " + stale.join("\n  ")); process.exit(1) }

  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const results: Record<string, { ok: boolean; kb?: number; error?: string }> = {}

  for (const v of VARIANTS) {
    for (const who of CAST) {
      const label = `${v.key}--${slug(who.name)}`
      try {
        const res = new ImageResponse(render(v.key, who) as any, { width: 1200, height: 630, fonts })
        const buf = Buffer.from(await res.arrayBuffer())
        writeFileSync(`${OUT}${label}.png`, buf)
        results[label] = { ok: true, kb: +(buf.length / 1024).toFixed(1) }
      } catch (e) {
        results[label] = { ok: false, error: (e as Error).message.slice(0, 120) }
        console.error("FAILED", label, (e as Error).message.slice(0, 160))
      }
    }
  }

  writeFileSync(new URL("./out/gallery.html", import.meta.url).pathname, galleryHTML())
  const bad = Object.entries(results).filter(([, r]) => !r.ok)
  if (bad.length) console.log(JSON.stringify(Object.fromEntries(bad), null, 1))
  const ok = Object.values(results).filter((r) => r.ok).length
  console.log(`${ok}/${Object.keys(results).length} renders -> ${OUT}`)
  if (ok !== Object.keys(results).length) process.exit(1)
}

function galleryHTML() {
  const cards = VARIANTS.flatMap((v) =>
    CAST.map(
      (who) => `<figure data-v="${v.key}">
  <img src="./out/cards/${v.key}--${slug(who.name)}.png" width="1200" height="630" alt="">
  <figcaption><b>${v.key}</b> — ${who.name} · <b>${who.count}</b> Recording${who.count === 1 ? "" : "s"}</figcaption>
</figure>`
    )
  ).join("\n")

  const strips = VARIANTS.map((v) => {
    const col = columnFor(v)
    const one = (w: number, label: string) =>
      CAST.map(
        (who) =>
          `<div class="cell"><img src="./out/cards/${v.key}--${slug(who.name)}.png" style="width:${w}px" alt=""><span>${label} · ${w}px · ${who.name.split(" ")[0]}</span></div>`
      ).join("")
    return `<section data-v="${v.key}">
  <h2>${v.label}</h2>
  <p class="bet"><b>Bet:</b> ${v.bet} &nbsp;·&nbsp; <b>Costs:</b> ${v.cost}</p>
  <p class="nums">mark <b>${v.mark}</b>px · name <b>${nameSizeFor(v)}</b>px → <b>${(nameSizeFor(v) * 0.3).toFixed(1)}px</b> on a 360px card · count <b>${v.num}</b>px → <b>${(v.num * 0.3).toFixed(1)}px</b> · words <b>${v.words}</b> · ${v.stackCount ? "stacked to 2 lines" : "one line"} · right column <b>${col}px</b> (ceiling <b>${ceilingFor(col)}px</b>)</p>
  <div class="strip">${one(360, "Slack")}${one(300, "iMessage")}</div>
</section>`
  }).join("\n")

  return `<!doctype html>
<meta charset="utf-8">
<title>Ticket 05 — the Fan card: five geometries, one layout</title>
<!-- PROTOTYPE. Throwaway. Real ImageResponse output. -->
<style>
  body { margin:0; background:#17181c; color:#e9eaee; font:14px/1.5 ui-sans-serif,system-ui,sans-serif; padding:0 0 40px }
  header { padding:20px 28px; border-bottom:1px solid #2a2c33 }
  h1 { font-size:16px; margin:0 0 4px; font-weight:600 }
  .sub { color:#9aa0aa; font-size:13px; max-width:1000px; margin:0 0 8px }
  .sub b { color:#e9eaee }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:20px; padding:24px 28px }
  figure { margin:0; background:#F4F4F1; border:1px solid #2a2c33; border-radius:12px; overflow:hidden }
  figure img { display:block; width:100%; height:auto }
  figcaption { padding:9px 12px; font-size:12px; color:#9aa0aa; border-top:1px solid #2a2c33; background:#17181c }
  figcaption b { color:#6FE3CC }
  section { padding:24px 28px; border-top:1px solid #2a2c33 }
  h2 { font-size:15px; margin:0 0 2px; color:#6FE3CC }
  .bet { color:#9aa0aa; font-size:13px; margin:0 0 6px }
  .bet b { color:#e9eaee }
  .nums { color:#8E949F; font-size:12px; margin:0 0 14px; font-family:ui-monospace,monospace }
  .nums b { color:#e9eaee }
  .strip { display:flex; gap:18px; align-items:flex-start; flex-wrap:wrap }
  .cell { display:flex; flex-direction:column; gap:6px }
  .cell img { display:block; border-radius:6px; border:1px solid #2a2c33 }
  .cell span { color:#8E949F; font-size:11px }
  .bar { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); display:flex; align-items:center; gap:14px;
         background:#0A0B0D; border:1px solid #3a3d45; border-radius:999px; padding:9px 15px; z-index:9 }
  .bar button { background:#23252b; color:#F1F2F4; border:1px solid #3a3d45; border-radius:999px; width:30px; height:30px; cursor:pointer }
  .bar .now { min-width:420px; text-align:center; font-size:13px }
  .bar .now i { color:#6FE3CC; font-style:normal; font-weight:600 }
</style>
<header>
  <h1>Ticket 05 — the Fan card: <span style="color:#6FE3CC">five geometries</span>, one held layout</h1>
  <div class="sub"><b>Scroll straight past this.</b> The cards are below the notes, then a per-size strip at 360px (Slack) and 300px (iMessage). Use &larr; &rarr; or the buttons to flip between the five &mdash; the table of measured numbers is at the very bottom.</div>
  <div class="sub"><b>Held, because the maintainer asked for it twice:</b> the fan is always on the <b>left</b>, and the right column always carries exactly three things in this order — <code>rnui.dev</code> at the homepage's treatment, the <b>name as the largest thing on the card</b>, then the count smaller. What changes between the five is only <b>how the cards are arranged and how big the type is</b>.</div>
  <div class="sub"><b>The reference&rsquo;s beige is not copied.</b> Its background is a warm cream, and <code>impeccable.style</code> names "cream / beige palette" as a default to be suspicious of. The canvas here is the Design&rsquo;s own <code>--canvas</code> <b>#F4F4F1</b>, and the wordmark is copied from <code>components/site-header.tsx:98-102</code>: <code>rnui</code> in <code>--t1</code>, <code>.dev</code> in <code>--acc</code>, weight <b>700</b>, tracking <code>-0.02em</code>.</div>
  <div class="sub"><b>One thing is decided by the card, not by CSS: the card owns the name&rsquo;s break.</b> A trailing parenthetical here is always an <i>alias</i> &mdash; <code>(Reactiive)</code>, <code>(evening kid)</code>, <code>(문대현)</code> &mdash; so it goes on its own line as a second block and Satori is never asked to choose. That is not a preference: with <code>keep-all</code> plus a non-breaking space, both inherited from the settled card, the widest name still came out as <code>Enzo Manuel Mangano (</code> / <code>Reactiive)</code> &mdash; the bracket orphaned. <b>Neither CSS setting fixes both breaks alone</b>, which is the wall the settled card hit. Owning the break makes an orphan <i>impossible</i> and makes <code>(문대현)</code> unsplittable for free.</div>
  <div class="sub"><b>That is where most of the size comes from &mdash; not from the fan.</b> All <b>24</b> real names, measured by <code>probe/ticket05/fan-ceiling.tsx</code>: a 560px column that capped the settled card at <b>36px</b> reaches <b>48px</b> here. Every one of those ceilings is set by <b>the same name</b>, <code>Konstantinos Efkarpidis</code> &mdash; 23 characters and the only long name with <i>no</i> parenthetical, so it is measured whole and cannot be given a second line. He is not in the cast below and he decides the size on all five.</div>
  <div class="sub"><b>The trade the five fan widths make explicit.</b> A wider fan shows more of each Poster and costs type; a tighter fan buys type and turns the Posters into texture. <code>Deck</code> is the tightest (18% of each card shows) and takes the biggest name at <b>64px</b>; <code>Slab</code> is the widest and takes the smallest at <b>52px</b>. That is the argument, as numbers rather than adjectives.</div>
  <div class="sub"><b>A shortfall is never padded.</b> Hubert Ryan has one Recording, and an earlier version drew him as one small card inside four pale slots &mdash; which reads as four images that failed to load. The fan&rsquo;s footprint is now fixed and the cards inside it grow to fill it, so he gets <b>one Poster shown properly</b>.</div>
  <div class="sub"><b>Two slop rules land on this design.</b> <b>Hero metric layout</b> &mdash; a huge number over a small label &mdash; is dodged for free, because the name is the largest thing and the count is smaller; that is also why no variant promotes the count, including <code>Deck</code> where 138 is at its most tempting. <b>Hairline border with wide shadow</b> &mdash; the fan tiles take a <b>shadow and no ring</b>, the one place this departs from the site&rsquo;s own <code>--e1</code>: eight overlapping tiles each drawing an outline over eight shadows is unreadable.</div>
  <div class="sub"><b>Three things a renderer had to be told.</b> <code>zIndex</code> <b>does not exist</b> &mdash; a probe ordering three overlapping cards by <code>zIndex</code> rendered byte-identically to DOM order &mdash; so the fan is emitted back-to-front. <code>transform-origin</code> <b>does</b> work: <code>bottom center</code> and <code>50% 100%</code> gave byte-identical ink, so the pivot is one line of CSS. And <b>a rotated card&rsquo;s corner swings a full height, not half</b> &mdash; the first overhang math halved it and put the fan&rsquo;s leftmost ink at <b>x=12</b>, 54px inside the 66px Slack crop, so the outer card was cut off on every share until <code>verify-fan.tsx</code> caught it.</div>
  <div class="sub"><b>Five real Contributors, spanning every axis:</b> <b>138</b> Recordings / 11 Categories / the widest name · <b>31</b> / 12 Categories / the broadest spread · <b>문대현</b> · the shortest name · <b>1</b> Recording, the minimum. The last is <code>Drum</code>'s worst case, since its tile count follows the count.</div>
  <div class="sub">← → flip · sizes measured in <code>probe/ticket05/fan-ramp.ts</code>, capabilities in <code>probe/ticket05/fan-probe.tsx</code> and <code>fan-origin.tsx</code></div>
</header>
${strips}
<div class="grid" id="cards">${cards}</div>
<div class="bar"><button onclick="go(-1)">‹</button><span class="now" id="now"></span><button onclick="go(1)">›</button></div>
<script>
  const KEYS = ${JSON.stringify(VARIANTS.map((v) => ({ key: v.key, label: v.label, bet: v.bet })))};
  let i = Math.max(0, KEYS.findIndex(k => k.key === new URLSearchParams(location.search).get('variant')));
  function go(d){ i = (i + d + KEYS.length) % KEYS.length; set(); }
  function set(){
    const k = KEYS[i];
    const u = new URL(location.href); u.searchParams.set('variant', k.key);
    history.replaceState(null,'',u);
    document.querySelectorAll('[data-v]').forEach(f => { f.style.display = f.dataset.v === k.key ? '' : 'none'; });
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
