// studio-dark ticket 13, step 12 — interaction latency for the five interactions
// this effort adds or changes, under mobile emulation and 4x CPU throttle.
//
// Lab INP is not the 286ms field p75 and is not reported as if it were. What a
// trace gives is per-interaction latency, comparable between the two arms of step 10.
//
//   pnpm exec node scripts/checkpoint-13-inp.mjs before   # worktree at 76651a3
//   pnpm exec node scripts/checkpoint-13-inp.mjs after    # this branch
//
// An interaction that does not exist on this arm is recorded as absent, not as 0.
import { chromium, devices } from "@playwright/test"
import { writeFileSync } from "node:fs"

const ARM = process.argv[2]
if (!ARM) throw new Error("usage: node scripts/checkpoint-13-inp.mjs <armName>")

const BASE = "http://localhost:3111"
const REPEATS = 3
const PHONE = devices["iPhone 13"]

// Event Timing is what INP is computed from, so it is what a lab per-interaction
// latency should read too — not a wall-clock delta around the click, which misses
// the paint the visitor is actually waiting for.
const OBSERVER = () => {
  window.__inp = []
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__inp.push({ name: e.name, duration: e.duration })
  }).observe({ type: "event", buffered: true, durationThreshold: 0 })
}

async function latencyOf(page, act) {
  await page.evaluate(() => {
    window.__inp.length = 0
  })
  await act()
  await page.waitForTimeout(1200) // let the paint land and the entry flush
  const entries = await page.evaluate(() => window.__inp)
  if (!entries.length) return null
  return Math.max(...entries.map((e) => e.duration))
}

/** Each returns a latency in ms, or throws/returns null when the control is absent. */
const INTERACTIONS = {
  "overlay open": async (page) => {
    await page.goto(`${BASE}/products`)
    await page.addInitScript(OBSERVER)
    await page.evaluate(OBSERVER)
    const card = page.getByRole("heading", { level: 3 }).first()
    if (!(await card.count())) return null
    return latencyOf(page, () => card.click())
  },
  "overlay close (Escape)": async (page) => {
    await page.goto(`${BASE}/products`)
    await page.evaluate(OBSERVER)
    const card = page.getByRole("heading", { level: 3 }).first()
    if (!(await card.count())) return null
    await card.click()
    const dialog = page.getByRole("dialog")
    if (!(await dialog.count())) return null
    await dialog.first().waitFor({ state: "visible", timeout: 5_000 }).catch(() => {})
    return latencyOf(page, () => page.keyboard.press("Escape"))
  },
  "filter chip remove": async (page) => {
    await page.goto(`${BASE}/products?category=Misc`)
    await page.evaluate(OBSERVER)
    const x = page.getByLabel("Remove category filter").filter({ visible: true })
    if (!(await x.count())) return null
    return latencyOf(page, () => x.first().click())
  },
  "Load more": async (page) => {
    await page.goto(`${BASE}/`)
    await page.evaluate(OBSERVER)
    const more = page.getByRole("button", { name: /Load \d+ more|Load more/ })
    if (!(await more.count())) return null
    await more.first().scrollIntoViewIfNeeded()
    return latencyOf(page, () => more.first().click())
  },
  "bottom sheet open": async (page) => {
    await page.goto(`${BASE}/products`)
    await page.evaluate(OBSERVER)
    const filters = page.getByRole("button", { name: /Filters/ })
    if (!(await filters.count())) return null
    return latencyOf(page, () => filters.first().click())
  },
}

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] })
const out = {}

for (const [name, run] of Object.entries(INTERACTIONS)) {
  const samples = []
  let absent = false
  for (let i = 0; i < REPEATS; i++) {
    const context = await browser.newContext({ ...PHONE })
    const page = await context.newPage()
    // A CI run is not a site visit — and a Demo that plays two seconds bills a view.
    await page.route("**/*posthog.com/**", (r) => r.abort())
    await page.route("**/demo/**", (r) => r.abort())
    const session = await context.newCDPSession(page)
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 })
    try {
      const ms = await run(page)
      if (ms === null) {
        absent = true
      } else {
        samples.push(ms)
      }
    } catch (error) {
      out[name] = { error: String(error).slice(0, 200) }
      absent = true
    }
    await context.close()
    if (absent) break
  }
  if (absent && !samples.length) {
    out[name] = out[name] ?? { absent: true, note: "control not present on this arm" }
  } else {
    const sorted = [...samples].sort((a, b) => a - b)
    out[name] = {
      samples: samples.map((s) => Math.round(s)),
      median: Math.round(sorted[Math.floor(sorted.length / 2)]),
      spread: Math.round(Math.max(...samples) - Math.min(...samples)),
    }
  }
  console.log(name, JSON.stringify(out[name]))
}

await browser.close()
writeFileSync(`.scratch/studio-dark/inp-${ARM}.json`, JSON.stringify({ arm: ARM, out }, null, 2))
console.log(`wrote inp-${ARM}.json`)
