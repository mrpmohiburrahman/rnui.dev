// PROTOTYPE — ticket 04, the default card. Renders 6 variants x 2 modes, plus
// the card being replaced, so the comparison is against the thing that ships
// today rather than against nothing.
//
//   pnpm tsx .scratch/social-cards/preview/render-default.tsx
//
// 13 renders. The mode split is the point: the ticket asks whether a card should
// be dark or light, and a prototype that only renders one of them answers the
// question by assertion.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createElement as h } from "react"
import { ImageResponse } from "next/og"

import { VARIANTS, render, type Mode } from "./variants-default"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
const fonts = [
  ...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)),
  F("JetBrainsMono", 400),
  F("JetBrainsMono", 700),
]

const OUT = new URL("./out-default/", import.meta.url).pathname
const MODES: Mode[] = ["dark", "light"]

/**
 * The card being replaced, re-rendered here so it is judged beside the five
 * candidates rather than from memory. Verbatim from
 * `app/opengraph-image.tsx`: slate palette, system-ui, and "343+ animations".
 * Nothing ships from this map, so this is a *copy* in the prototype, not an edit.
 */
function incumbent() {
  return h(
    "div",
    {
      style: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "80px",
        fontFamily: "system-ui, sans-serif",
      },
    },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "16px" } },
      h("div", { style: { color: "#38bdf8", fontSize: "28px", fontWeight: 600, letterSpacing: "0.05em" } }, "rnui.dev"),
      h(
        "div",
        { style: { color: "#f1f5f9", fontSize: "56px", fontWeight: 800, lineHeight: 1.15, maxWidth: "800px" } },
        "Curated React Native UI & Animation Catalog"
      ),
      h(
        "div",
        { style: { color: "#94a3b8", fontSize: "28px", fontWeight: 400, maxWidth: "700px", lineHeight: 1.5 } },
        "343+ animations across Reanimated, Skia, Moti, Gesture Handler, and Lottie."
      )
    ),
    h(
      "div",
      { style: { display: "flex", gap: "32px", alignItems: "center" } },
      h("div", { style: { color: "#475569", fontSize: "20px" } }, "github.com/mrpmohiburrahman/rnui.dev")
    )
  )
}

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const results: any = {}

  const jobs: { label: string; node: any }[] = [{ label: "0-incumbent", node: incumbent() }]
  for (const v of VARIANTS) for (const m of MODES) jobs.push({ label: `${v.key}-${m}`, node: render(v.key as any, m) })

  for (const j of jobs) {
    try {
      const res = new ImageResponse(j.node, { width: 1200, height: 630, fonts })
      const buf = Buffer.from(await res.arrayBuffer())
      writeFileSync(`${OUT}${j.label}.png`, buf)
      results[j.label] = { ok: true, kb: +(buf.length / 1024).toFixed(1) }
    } catch (e) {
      results[j.label] = { ok: false, error: (e as Error).message }
      console.error("FAILED", j.label, (e as Error).message)
    }
  }

  writeFileSync(new URL("./gallery-default.html", import.meta.url).pathname, galleryHTML())
  const ok = Object.values(results).filter((r: any) => r.ok).length
  console.log(JSON.stringify(results, null, 1))
  console.log(`\n${ok} renders -> ${OUT}`)
}

function galleryHTML() {
  const cards = VARIANTS.flatMap((v) =>
    MODES.map(
      (m) => `<figure data-v="${v.key}-${m}">
  <img src="./out-default/${v.key}-${m}.png" width="1200" height="630" alt="">
  <figcaption><b>${v.key} · ${m}</b> — ${v.bet}</figcaption>
</figure>`
    )
  ).join("\n")

  return `<!doctype html>
<meta charset="utf-8">
<title>Ticket 04 — the default card, six ways, both modes</title>
<!-- PROTOTYPE. Throwaway. Real ImageResponse output. -->
<style>
  body { margin:0; background:#17181c; color:#e9eaee; font:14px/1.5 ui-sans-serif,system-ui,sans-serif; padding:0 0 40px }
  header { padding:20px 28px; border-bottom:1px solid #2a2c33 }
  h1 { font-size:16px; margin:0 0 4px; font-weight:600 }
  .sub { color:#9aa0aa; font-size:13px; max-width:900px }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:20px; padding:24px 28px }
  figure { margin:0; background:#0A0B0D; border:1px solid #2a2c33; border-radius:12px; overflow:hidden }
  figure img { display:block; width:100%; height:auto }
  figcaption { padding:9px 12px; font-size:12px; color:#9aa0aa; border-top:1px solid #2a2c33 }
  figcaption b { color:#6FE3CC }
  .inc { padding:0 28px 4px }
  .bar { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); display:flex; align-items:center; gap:14px;
         background:#0A0B0D; border:1px solid #3a3d45; border-radius:999px; padding:9px 15px; z-index:9 }
  .bar button { background:#23252b; color:#F1F2F4; border:1px solid #3a3d45; border-radius:999px; width:30px; height:30px; cursor:pointer }
  .bar .now { min-width:260px; text-align:center; font-size:13px }
  .bar .now i { color:#6FE3CC; font-style:normal; font-weight:600 }
</style>
<header>
  <h1>Ticket 04 — the default card</h1>
  <div class="sub">Six structurally different answers, each rendered in <b>both</b> modes. The counts are real: <b>298 Recordings, 24 Contributors, 18 Categories</b> — the shipped card claims "343+ animations", which is 45 too many and the wrong noun.</div>
  <div class="sub">The claim is the homepage's own h1, verbatim (<code>components/hero.tsx:23</code>). The wordmark is set as <code>components/site-header.tsx</code> sets it.</div>
  <div class="sub">← → flip</div>
</header>
<div class="inc"><figure><img src="./out-default/0-incumbent.png" width="1200" height="630" alt=""><figcaption><b>0 · Incumbent</b> — what ships today: slate gradient, system-ui, "343+ animations"</figcaption></figure></div>
<div class="grid">${cards}</div>
<div class="bar"><button onclick="go(-1)">‹</button><span class="now" id="now"></span><button onclick="go(1)">›</button></div>
<script>
  const KEYS = ${JSON.stringify(
    VARIANTS.flatMap((v) => MODES.map((m) => ({ key: v.key + "-" + m, name: v.name, mode: m, bet: v.bet })))
  )};
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
