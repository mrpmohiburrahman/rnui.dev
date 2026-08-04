// studio-dark ticket 13 — live motion + focus-ring probe.
// Reads getComputedStyle on a running production build for the four CSS-driven
// motion moments and the focus ring, to fill / re-fill
// .scratch/studio-dark/checkpoint-13-gate.md (step 2). Usage:
//   node scripts/checkpoint-13-probe.mjs <recordingId>
// with `pnpm start` running on :3000.
import pkg from "/Users/mrp/Documents/1-Projects/OpenSource/awesome-react-native-ui/rnui.dev/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.js"
const { chromium } = pkg

const BASE = "http://localhost:3000"
const RID = process.argv[2]
if (!RID) {
  console.error("usage: node scripts/checkpoint-13-probe.mjs <recordingId>")
  process.exit(2)
}

const browser = await chromium.launch()

async function probe(route, label) {
  const ctx = await browser.newContext({ reducedMotion: "no-preference" })
  const page = await ctx.newPage()
  await page.route("**/*posthog.com/**", (r) => r.abort())
  await page.goto(route, { waitUntil: "networkidle" })

  const out = {}
  out.demoFade = await page.evaluate(() => {
    const v = document.querySelector(".tile-media video")
    if (!v) return "no video element"
    const cs = getComputedStyle(v)
    return { transitionDuration: cs.transitionDuration, transitionTimingFunction: cs.transitionTimingFunction }
  })
  const played = await page
    .waitForFunction(() => document.querySelector(".tile-media[data-playing]") !== null, { timeout: 12000 })
    .then(() => true)
    .catch(() => false)
  out.tileGlow = played
    ? await page.evaluate(() => {
        const el = document.querySelector(".tile-media[data-playing]")
        const cs = getComputedStyle(el)
        return { transitionDuration: cs.transitionDuration, transitionTimingFunction: cs.transitionTimingFunction }
      })
    : "NO PLAYING TILE"
  out.focusRing = await page.evaluate(() => {
    const headline = document.querySelector('a[href^="/recording/"]')
    const sample = (el) => {
      if (!el) return null
      el.focus()
      const cs = getComputedStyle(el)
      return { tag: el.tagName, outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor }
    }
    return { headlineLink: sample(headline) }
  })
  console.log(`\n=== ${label} (${route}) ===`)
  console.log(JSON.stringify(out, null, 2))
  await ctx.close()
}

await probe(`${BASE}/`, "home")
await probe(`${BASE}/products?category=Buttons`, "products-filtered")

// Sheet (mobile) open.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } })
  const page = await ctx.newPage()
  await page.route("**/*posthog.com/**", (r) => r.abort())
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  const filterBtn = page.getByRole("button", { name: /filter/i }).first()
  if (await filterBtn.count()) {
    await filterBtn.click()
    const panel = page.locator('[role="dialog"]')
    await panel.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
    const sheet = await page.evaluate(() => {
      const p = document.querySelector(".sheet-panel")
      if (!p) return "no .sheet-panel"
      const cs = getComputedStyle(p)
      return { animationName: cs.animationName, animationDuration: cs.animationDuration, animationTimingFunction: cs.animationTimingFunction }
    })
    console.log("\n=== sheet (mobile dock) ===")
    console.log(JSON.stringify(sheet, null, 2))
  }
  await ctx.close()
}

await browser.close()
console.log("\nDONE")
