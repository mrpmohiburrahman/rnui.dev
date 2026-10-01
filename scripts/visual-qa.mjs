// Visual QA sweep — one screenshot per (surface, theme), written to
// .scratch/studio-dark/visual-qa/ with an index.html contact sheet.
//
// Not a test: it asserts nothing. It exists so a human can look at every state
// the two efforts claim to have built, in one page, instead of clicking ten
// routes twice. The e2e suites are what assert; this is what you look at.
//
//   node scripts/visual-qa.mjs            # needs a server on :3000
//
// The build under it must carry NEXT_PUBLIC_CDN_URL="http://localhost:3000",
// or every tile is a blank box (checkpoint-13-gate.md records that trap).
import { chromium, devices } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const OUT = path.resolve(".scratch/studio-dark/visual-qa")
const DESKTOP = { width: 1440, height: 900 }
const PHONE = devices["iPhone 13"].viewport

// The three stored keys keep their exact strings (spec.md Constraints).
const BOOKMARKS_KEY = "bookmarkedItems"
const VOTES_KEY = "votedItems"

const shots = []

// Two errors fire on every route of a local run and mean nothing:
//   - the posthog.com request this script aborts on purpose, which the page
//     reports as ERR_FAILED;
//   - `/_vercel/insights/script.js`, which only exists once Vercel serves the
//     site, so localhost 404s it.
// Left in, they painted all 40 captures red and no real error could have been
// seen among them.
const LOCAL_ONLY_NOISE = [/ERR_FAILED/, /_vercel\/insights/]
const isNoise = (text) => LOCAL_ONLY_NOISE.some((pattern) => pattern.test(text))

/** One capture. `prep` runs after the goto, before the shot. */
async function shot(ctxOpts, { id, title, note, url, prep, full = false }) {
  const context = await browser.newContext({
    viewport: ctxOpts.viewport,
    reducedMotion: ctxOpts.reducedMotion,
    colorScheme: ctxOpts.colorScheme,
    ...(ctxOpts.extra ?? {}),
  })
  // Never bill the production project for a screenshot run.
  await context.route("**/*posthog.com/**", (route) => route.abort())
  if (ctxOpts.init) await context.addInitScript(ctxOpts.init.fn, ctxOpts.init.arg)
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  page.on("console", (m) => {
    if (m.type() !== "error") return
    // The message text for a failed resource is generic ("Failed to load
    // resource: … 404"), so the URL it happened at is what identifies it.
    const where = m.location()?.url ?? ""
    if (isNoise(where) || isNoise(m.text())) return
    errors.push(m.text())
  })
  try {
    await page.goto(BASE + url, { waitUntil: "domcontentloaded" })
    if (prep) await prep(page)
    await page.waitForTimeout(ctxOpts.settle ?? 1200)
    const file = `${id}.png`
    await page.screenshot({ path: path.join(OUT, file), fullPage: full })
    shots.push({ id, title, note, url, file, errors: [...new Set(errors)] })
    process.stdout.write(`  ✓ ${id}\n`)
  } catch (e) {
    shots.push({ id, title, note, url, file: null, errors: [String(e)] })
    process.stdout.write(`  ✗ ${id} — ${e.message}\n`)
  } finally {
    await context.close()
  }
}

const seedSaved = {
  fn: ([bk, vk, ids]) => {
    localStorage.setItem(bk, JSON.stringify(ids))
    localStorage.setItem(vk, JSON.stringify(ids.slice(0, 2)))
  },
  arg: null, // filled in below once ids are known
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
})

// Recording ids come from the served catalogue, not from data/, so the sweep
// cannot drift from what the build actually prerendered.
const probe = await browser.newContext({ viewport: DESKTOP })
const probePage = await probe.newPage()
await probePage.route("**/*posthog.com/**", (r) => r.abort())
await probePage.goto(BASE + "/products", { waitUntil: "domcontentloaded" })
const ids = await probePage.evaluate(() =>
  [...document.querySelectorAll('a[href^="/recording/"]')]
    .map((a) => a.getAttribute("href").split("/").pop())
    .filter((v, i, all) => all.indexOf(v) === i)
    .slice(0, 6)
)
await probe.close()
if (!ids.length) throw new Error("no recordings on /products — is the server the right build?")
seedSaved.arg = [BOOKMARKS_KEY, VOTES_KEY, ids]

const openOverlay = async (page) => {
  await page.locator("h3 a").first().click()
  await page.waitForSelector('[role="dialog"]', { timeout: 10_000 })
}

const ROUTES = [
  ["home", "/", "Catalogue.dc.html home — hero, stats row, rail, grid"],
  ["products", "/products", "Same grid, showHero=false (decision 10)"],
  ["bookmarks", "/bookmarks", "saved variant, nothing saved → empty state"],
  ["contributors", "/contributors", "ticket 10 — 23 Contributors, not 24"],
  ["aboutus", "/aboutus", "ticket 12 — undrawn route"],
  ["contactus", "/contactus", "ticket 12 — undrawn route"],
  ["subscribe", "/subscribe", "ticket 12 — undrawn, standalone NOTIFY page"],
  ["privacypolicy", "/privacypolicy", "ticket 12 — undrawn route"],
  ["termsofservice", "/termsofservice", "ticket 12 — undrawn route"],
]

for (const theme of ["dark", "light"]) {
  console.log(`\n== ${theme}, desktop ==`)
  for (const [id, url, note] of ROUTES) {
    await shot(
      { viewport: DESKTOP, colorScheme: theme },
      { id: `${theme}-${id}`, title: url, note, url, full: true }
    )
  }
  await shot(
    { viewport: DESKTOP, colorScheme: theme },
    {
      id: `${theme}-detail-shared`,
      title: `/recording/${ids[0]}`,
      note: "ticket 09 — shared-link arrival (not the overlay)",
      url: `/recording/${ids[0]}`,
      full: true,
    }
  )
  await shot(
    { viewport: DESKTOP, colorScheme: theme },
    {
      id: `${theme}-detail-overlay`,
      title: "/products → overlay",
      note: "ticket 09 — overlay over the grid, 240ms rise",
      url: "/products",
      prep: openOverlay,
    }
  )
  await shot(
    { viewport: DESKTOP, colorScheme: theme },
    {
      id: `${theme}-filtered`,
      title: "/products?category=buttons",
      note: "Catalogue.dc.html filtered variant — chips present",
      url: "/products?category=buttons",
      full: true,
    }
  )
  await shot(
    { viewport: DESKTOP, colorScheme: theme, init: seedSaved },
    {
      id: `${theme}-saved`,
      title: "/bookmarks (seeded)",
      note: "saved variant — 6 bookmarked, 2 voted",
      url: "/bookmarks",
      full: true,
    }
  )
  await shot(
    { viewport: DESKTOP, colorScheme: theme },
    {
      id: `${theme}-zero`,
      title: "/products?search=zzzznothing",
      // `?q=` is not a parameter this site reads (app/products/page.tsx takes
      // `search`, `category`, `contributor`), so the capture that claimed to be
      // the zero variant was an unfiltered grid of 48 with a caption saying
      // otherwise — the one kind of error a contact sheet cannot survive.
      note: "zero variant — empty state copy + reset",
      url: "/products?search=zzzznothing",
      full: true,
    }
  )
  await shot(
    { viewport: DESKTOP, colorScheme: theme, reducedMotion: "reduce" },
    {
      id: `${theme}-reduced`,
      title: "/ under prefers-reduced-motion",
      note: "no <video> mounted, tiles full brightness, STILLS ONLY",
      url: "/",
    }
  )
  await shot(
    {
      viewport: DESKTOP,
      colorScheme: theme,
      extra: {},
    },
    {
      id: `${theme}-failed`,
      title: "/products with every Demo blocked",
      note: "Tile.dc.html DECODE FAILED state",
      url: "/products",
      prep: async (page) => {
        await page.waitForTimeout(2500)
      },
    }
  )
  await shot(
    { viewport: DESKTOP, colorScheme: theme },
    {
      id: `${theme}-end`,
      title: "/products, Load more exhausted",
      note: "end variant — the grid's last page",
      url: "/products",
      prep: async (page) => {
        for (let i = 0; i < 8; i++) {
          const more = page.getByRole("button", { name: /load more/i })
          if (!(await more.count())) break
          await more.first().click()
          await page.waitForTimeout(400)
        }
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      },
    }
  )

  console.log(`\n== ${theme}, phone ==`)
  await shot(
    { viewport: PHONE, colorScheme: theme },
    {
      id: `${theme}-m-home`,
      title: "/ at 390px",
      note: "CatalogueMobile.dc.html — phone header + dock",
      url: "/",
      full: true,
    }
  )
  await shot(
    { viewport: PHONE, colorScheme: theme },
    {
      id: `${theme}-m-sheet`,
      title: "/ → bottom sheet",
      note: "ticket 11 — 260ms spring, no overshoot",
      url: "/",
      prep: async (page) => {
        await page.getByRole("button", { name: /filters/i }).first().click()
        await page.waitForTimeout(600)
      },
    }
  )
  await shot(
    { viewport: PHONE, colorScheme: theme },
    {
      id: `${theme}-m-detail`,
      title: `/recording/${ids[0]} at 390px`,
      note: "ticket 09 + 11 — detail on a phone",
      url: `/recording/${ids[0]}`,
      full: true,
    }
  )
}

await browser.close()

const rows = shots
  .map(
    (s) => `
  <figure id="${s.id}">
    <figcaption>
      <b>${s.title}</b>
      <span>${s.note}</span>
      ${s.errors.length ? `<em class=err>${s.errors.length} console/page error(s): ${s.errors.slice(0, 3).map((e) => e.replace(/</g, "&lt;")).join(" · ")}</em>` : ""}
    </figcaption>
    ${s.file ? `<a href="${s.file}"><img src="${s.file}" loading="lazy"></a>` : `<p class=err>capture failed</p>`}
  </figure>`
  )
  .join("")

await writeFile(
  path.join(OUT, "index.html"),
  `<!doctype html><meta charset=utf-8><title>Studio Dark — visual QA</title>
<style>
  :root { color-scheme: dark }
  body { background:#0A0B0D; color:#E9ECF1; font:14px/1.5 ui-monospace,monospace; margin:0; padding:24px }
  h1 { font-size:18px; letter-spacing:.08em; text-transform:uppercase }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(460px,1fr)); gap:22px }
  figure { margin:0; border:1px solid #23262D; border-radius:10px; overflow:hidden; background:#101216 }
  figcaption { padding:10px 12px; border-bottom:1px solid #23262D; display:flex; flex-direction:column; gap:3px }
  figcaption b { color:#6FE3CC; font-weight:600 }
  figcaption span { color:#8E949F; font-size:12px }
  .err { color:#FF8A7A; font-size:11px; font-style:normal }
  img { display:block; width:100%; height:auto }
</style>
<h1>Studio Dark — visual QA · ${shots.length} captures</h1>
<div class=grid>${rows}</div>`
)

const failed = shots.filter((s) => !s.file)
const noisy = shots.filter((s) => s.errors.length)
console.log(`\n${shots.length} captures → ${path.join(OUT, "index.html")}`)
if (failed.length) console.log(`FAILED: ${failed.map((s) => s.id).join(", ")}`)
if (noisy.length) console.log(`CONSOLE ERRORS: ${noisy.map((s) => s.id).join(", ")}`)
