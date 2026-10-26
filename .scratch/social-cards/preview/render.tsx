// PROTOTYPE — ticket 06 render harness.
//
//   pnpm tsx .scratch/social-cards/preview/render.tsx
//
// Renders every variant against every subject to .scratch/social-cards/preview/out/,
// and writes the gallery the maintainer flips through. The gallery shows the
// PNGs, so what is compared is the renderer's output and not a browser's.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { ImageResponse } from "next/og"

import { VARIANTS, render, rendition, type Subject } from "./variants"

const F = (n: string, w: number) => {
  const d = readFileSync(new URL(`../probe/fonts/${n}-${w}.ttf`, import.meta.url))
  return { name: n, data: d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), weight: w as 100 }
}
// Six pinned static TTFs — variable fonts hard-throw (ticket 02).
const fonts = [
  ...[300, 400, 500, 700].map((w) => F("SpaceGrotesk", w)),
  F("JetBrainsMono", 400),
  F("JetBrainsMono", 700),
]

const OUT = new URL("./out/", import.meta.url).pathname

/**
 * Four real Recordings, chosen to be a range and not a flattering one:
 *   snake   caption  5 chars, hue 356 (red)    — the shortest caption there is
 *   fluid   caption 15 chars, hue 167 (green)  — the median caption
 *   ripple  caption 36 chars, hue  25 (orange) — the longest caption there is
 *   noster  no measured hue at all             — the fallback, which must be
 *                                                a designed state (ticket 14)
 */
const SUBJECTS: Subject[] = [
  {
    key: "snake", caption: "Snake", contributor: "Pushkar Tandon", category: "Full Apps",
    hue: 356, poster: rendition("snake", "tall"), aspect: 0.477,
  },
  {
    key: "fluid", caption: "Fluid Carousels", contributor: "William Candillon", category: "Carousels",
    hue: 167, poster: rendition("fluid", "tall"), aspect: 0.4721,
  },
  {
    key: "ripple", caption: "Ripple Effect With React Native Skia", contributor: "Daehyeon Mun (문대현)",
    category: "Misc", hue: 25, poster: rendition("ripple", "tall"), aspect: 0.605,
  },
  {
    key: "noster", caption: "Toast", contributor: "Enzo Manuel Mangano (Reactiive)", category: "Misc",
    hue: undefined, poster: null,
  },
  // The catalogue's LONGEST caption (36 chars), against the LONGEST name. Every
  // card must hold this pair at once.
  {
    key: "worst", caption: "Spread Cards Effect ( Color Swatch )", contributor: "Enzo Manuel Mangano (Reactiive)",
    category: "Misc", hue: 273, poster: rendition("ripple", "tall"), aspect: 0.605,
  },
  // A LANDSCAPE Poster. 77 of 297 Posters are wider than 0.8 (up to 1.7778), so
  // the device-frame layouts are drawing a phone shape around a wide image --
  // the assumption that "every Recording card has a vertical image" is false.
  {
    key: "land", caption: "Reanimated Bottom Sheet", contributor: "Kacper Kapuściak", category: "Bottom Sheets",
    hue: 210, poster: rendition("land", "tall"), aspect: 1.7778,
  },
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
  writeFileSync(`${OUT}subjects.json`, JSON.stringify(SUBJECTS.map(({ poster, ...r }) => r), null, 1))
  writeFileSync(new URL("./gallery.html", import.meta.url).pathname, galleryHTML())
  console.log(`\n${Object.values(results).filter((r: any) => r.ok).length} renders -> ${OUT}`)
}

function galleryHTML() {
  const cards = VARIANTS.flatMap((v) =>
    SUBJECTS.map(
      (s) => `<figure data-v="${v.key}">
  <img src="./out/${v.key}-${s.key}.png" width="1200" height="630" alt="${v.key} ${s.key}">
  <figcaption><b>${v.key} · ${v.name}</b> — ${s.caption} <span class="m">(${s.contributor})</span></figcaption>
</figure>`
    )
  ).join("\n")

  return `<!doctype html>
<meta charset="utf-8">
<title>Ticket 06 — Recording card, five ways</title>
<!-- PROTOTYPE. Throwaway. The images are real ImageResponse output. -->
<style>
  body { margin:0; background:#17181c; color:#e9eaee;
         font:14px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif; padding:0 0 96px }
  header { padding:20px 28px; border-bottom:1px solid #2a2c33; display:flex; gap:20px; align-items:baseline; flex-wrap:wrap }
  h1 { font-size:16px; margin:0; font-weight:600 }
  .sub { color:#9aa0aa; font-size:13px }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:20px; padding:24px 28px }
  figure { margin:0; background:#0A0B0D; border:1px solid #2a2c33; border-radius:12px; overflow:hidden }
  figure img { display:block; width:100%; height:auto }
  figcaption { padding:9px 12px; font-size:12px; color:#9aa0aa; border-top:1px solid #2a2c33 }
  figcaption b { color:#6FE3CC; font-weight:600 }
  .m { color:#6b7078 }
  /* the switcher */
  .bar { position:fixed; left:50%; bottom:20px; transform:translateX(-50%);
         display:flex; align-items:center; gap:14px; background:#0A0B0D; color:#F1F2F4;
         border:1px solid #3a3d45; border-radius:999px; padding:9px 15px; z-index:9;
         box-shadow:0 18px 40px -12px rgba(0,0,0,.8) }
  .bar button { background:#23252b; color:#F1F2F4; border:1px solid #3a3d45; border-radius:999px;
                width:30px; height:30px; cursor:pointer; font-size:14px; line-height:1 }
  .bar button:hover { background:#2e3138 }
  .bar .now { min-width:210px; text-align:center; font-size:13px }
  .bar .now i { color:#6FE3CC; font-style:normal; font-weight:600 }
  .bar .sub2 { color:#8E949F; font-size:12px }
  a.row { color:#6FE3CC }
</style>
<header>
  <h1>Ticket 06 — the Recording card, five ways</h1>
  <span class="sub">Real <code>ImageResponse</code> output at 1200×630 — what Satori emits, not a browser. Nothing here ships.</span>
  <span class="sub">← → flip variants · six Recordings per variant</span>
  <span class="sub"><b>Dark</b>, type scale K=2.8 (bounded by the longest caption), worst measured contrast 8.33:1</span>
</header>
<div class="grid">
${cards}
</div>
<div class="bar" id="bar">
  <button onclick="go(-1)" title="previous (←)">‹</button>
  <span class="now" id="now"></span>
  <button onclick="go(1)" title="next (→)">›</button>
</div>
<script>
  const KEYS = ${JSON.stringify(VARIANTS.map((v) => ({ key: v.key, name: v.name, bet: v.bet })))};
  let i = Math.max(0, KEYS.findIndex(k => k.key === new URLSearchParams(location.search).get('variant')));
  function go(d){ i = (i + d + KEYS.length) % KEYS.length; set(); }
  function set(){
    const k = KEYS[i];
    const u = new URL(location.href); u.searchParams.set('variant', k.key);
    history.replaceState(null,'',u);
    document.querySelectorAll('figure').forEach(f => {
      f.style.display = f.dataset.v === k.key ? '' : 'none';
    });
    document.getElementById('now').innerHTML = '<i>'+k.key+' · '+k.name+'</i><br><span class="sub2">'+k.bet+'</span>';
  }
  addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  set();
</script>
`
}

main().catch((e) => {
  console.error("FAILED", e)
  process.exit(1)
})