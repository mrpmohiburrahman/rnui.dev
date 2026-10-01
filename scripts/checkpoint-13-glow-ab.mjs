// studio-dark ticket 13 step 11 — the glow A/B.
//
// Two Chrome DevTools traces of the SAME scripted scroll down /products past all
// 48 tiles, at 4x CPU throttle, on the SAME build. The arms differ by exactly one
// thing:
//   arm A — as built (E1: hue-tinted 60px-blur glow on the playing tile)
//   arm B — one injected rule replacing the E1 shadow with the E0 hairline
//
// Records per arm: main-thread paint+composite time, frames over 16ms, longest
// single frame. Stated rule from the ticket: if arm A's count of frames over
// 16ms exceeds arm B's by more than 20%, hand back `ready-for-human`.
//
// Usage: node scripts/checkpoint-13-glow-ab.mjs [repeats]
// with `pnpm start` running on :3000.
//
// playwright is a transitive dep under pnpm (@playwright/test pulls it in), so it
// is not resolvable by bare specifier from a loose script — same reason
// checkpoint-13-probe.mjs pins a path. Resolved from the pnpm store instead.
import { createRequire } from "node:module"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
function loadPlaywright() {
  try {
    return require("playwright")
  } catch {}
  const pinned = path.join(
    repoRoot,
    "node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.js",
  )
  if (existsSync(pinned)) return require(pinned)
  throw new Error("cannot resolve playwright; run `pnpm install`")
}
const { chromium } = loadPlaywright()

const BASE = "http://localhost:3000"
const ROUTE = `${BASE}/products`
const REPEATS = Number(process.argv[2] ?? 3)
const CPU_THROTTLE = 4
const FRAME_BUDGET_US = 16000

// Arm B's single injected override: the E0 hairline in place of the E1 glow.
const ARM_B_CSS = `
.tile-media[data-playing] {
  box-shadow: 0 0 0 1px rgba(255,255,255,0.07) !important;
}
`

const PAINT_EVENTS = new Set([
  "Paint",
  "PaintImage",
  "CompositeLayers",
  "Layerize",
  "UpdateLayerTree",
  "RasterTask",
])

async function runArm({ label, injectCss }) {
  const browser = await chromium.launch({
    args: ["--autoplay-policy=no-user-gesture-required"],
  })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    // Pin dark. The E1 glow is at its heaviest in dark mode — a 60px-blur
    // hue-tinted shadow (`0 22px 60px -20px hsla(H,70%,55%,0.45)`) against
    // light's `0 20px 44px -22px hsla(H,55%,40%,0.55)`. Left to the machine's
    // preference the arms can sample either, and the ticket's question is about
    // the expensive one.
    colorScheme: "dark",
  })
  const page = await ctx.newPage()
  await page.route("**/*posthog.com/**", (r) => r.abort())
  if (injectCss) await page.addInitScript((css) => {
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style")
      s.textContent = css
      document.head.appendChild(s)
    })
  }, ARM_B_CSS)

  await page.goto(ROUTE, { waitUntil: "networkidle" })

  // Confirm the arm is actually what it claims to be before tracing.
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="demo"]').length > 0,
    { timeout: 20000 },
  )
  await page
    .waitForFunction(() => document.querySelector(".tile-media[data-playing]") !== null, {
      timeout: 15000,
    })
    .catch(() => {})
  const sawPlaying = await page.evaluate(
    () => document.querySelector(".tile-media[data-playing]") !== null,
  )
  const shadowSample = await page.evaluate(() => {
    const el = document.querySelector(".tile-media[data-playing]") ??
      document.querySelector(".tile-media")
    return el ? getComputedStyle(el).boxShadow : "(no tile)"
  })

  const client = await ctx.newCDPSession(page)
  await client.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE })

  const events = []
  client.on("Tracing.dataCollected", (d) => events.push(...d.value))
  const done = new Promise((res) => client.once("Tracing.tracingComplete", res))

  await client.send("Tracing.start", {
    transferMode: "ReportEvents",
    traceConfig: {
      recordMode: "recordAsMuchAsPossible",
      includedCategories: [
        "devtools.timeline",
        "disabled-by-default-devtools.timeline",
        "disabled-by-default-devtools.timeline.frame",
      ],
    },
  })

  // The scripted scroll: identical in both arms.
  await page.evaluate(async () => {
    const step = 700
    const pause = () => new Promise((r) => setTimeout(r, 120))
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await pause()
    }
    window.scrollTo(0, 0)
    await pause()
  })

  await client.send("Tracing.end")
  await done

  let paintUs = 0
  const tasks = []
  for (const e of events) {
    if (e.ph !== "X" || typeof e.dur !== "number") continue
    if (PAINT_EVENTS.has(e.name)) paintUs += e.dur
    if (e.name === "RunTask") tasks.push(e.dur)
  }
  const over = tasks.filter((d) => d > FRAME_BUDGET_US)
  const longest = tasks.length ? Math.max(...tasks) : 0

  await browser.close()
  return {
    label,
    sawPlaying,
    shadowSample,
    paintCompositeMs: +(paintUs / 1000).toFixed(1),
    framesOver16ms: over.length,
    longestFrameMs: +(longest / 1000).toFixed(1),
    totalTasks: tasks.length,
  }
}

const results = { A: [], B: [] }
for (let i = 0; i < REPEATS; i++) {
  results.A.push(await runArm({ label: "A (as built)", injectCss: false }))
  results.B.push(await runArm({ label: "B (E0 override)", injectCss: true }))
  console.log(`repeat ${i + 1}/${REPEATS} done`)
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}
const summarise = (rows) => ({
  paintCompositeMs: median(rows.map((r) => r.paintCompositeMs)),
  framesOver16ms: median(rows.map((r) => r.framesOver16ms)),
  longestFrameMs: median(rows.map((r) => r.longestFrameMs)),
  spreadFrames: Math.max(...rows.map((r) => r.framesOver16ms)) -
    Math.min(...rows.map((r) => r.framesOver16ms)),
})

const a = summarise(results.A)
const b = summarise(results.B)
const pct = b.framesOver16ms === 0
  ? (a.framesOver16ms === 0 ? 0 : Infinity)
  : ((a.framesOver16ms - b.framesOver16ms) / b.framesOver16ms) * 100

console.log("\n=== GLOW A/B ===")
console.log("shadow arm A:", results.A[0].shadowSample)
console.log("shadow arm B:", results.B[0].shadowSample)
console.log("\nper-run:", JSON.stringify(results, null, 2))
console.log("\nmedians:")
console.table({ "A (as built)": a, "B (E0 override)": b })
console.log(`\nframes>16ms  A=${a.framesOver16ms}  B=${b.framesOver16ms}  delta=${pct.toFixed(1)}%`)

// The arms are only comparable if arm A actually painted the E1 glow. With an
// unreachable CDN no <video> loads, play() rejects, `data-playing` is never set,
// and both arms render the identical E0 hairline — a 0% delta that measures
// nothing. Fail loudly rather than report a meaningless pass.
const played = results.A.every((r) => r.sawPlaying)
if (!played || results.A[0].shadowSample === results.B[0].shadowSample) {
  console.error(
    "\nVOID: arm A never reached the playing state (no E1 glow painted).\n" +
      "Both arms measured the same shadow, so the comparison is meaningless.\n" +
      "Likely cause: Demo/Poster assets unreachable — check NEXT_PUBLIC_CDN_URL.\n" +
      "See .scratch/studio-dark/checkpoint-13-gate.md, step 11 hand-off.",
  )
  process.exit(1)
}
console.log(pct > 20 ? "VERDICT: EXCEEDS 20% -> ready-for-human" : "VERDICT: within 20% -> passes")
