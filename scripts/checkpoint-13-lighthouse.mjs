// studio-dark ticket 13, step 10 — load metrics, five runs per arm per preset per route.
//
// Both arms are local production builds on the same port (3111), per the ticket:
// checkpoint-01-03-lighthouse.md's own "Not comparable" section says the loopback
// accounted for part of its LCP gap, so one-local-one-live is not a comparison.
//
// Lighthouse 12 is not a dependency of this repo and is not added as one — it is
// needed twice a year, not per build. Install it once, anywhere:
//
//   mkdir -p /tmp/lh-tools && cd /tmp/lh-tools
//   printf '{"name":"lh-tools","private":true}\n' > package.json && pnpm add lighthouse@12
//
// Then, with the arm under test served on :3111:
//
//   pnpm exec node scripts/checkpoint-13-lighthouse.mjs before   # worktree at 76651a3
//   pnpm exec node scripts/checkpoint-13-lighthouse.mjs after    # this branch
//
// Writes .scratch/studio-dark/lighthouse-<armName>.json (gitignored — the raw
// reports are reproducible, so checkpoint-01-03-lighthouse.md's rule holds here too).
//
// Check the card count on the served page before believing any number. A Firestore
// permission error makes get-recordings.ts return [], which renders an empty
// catalogue that Lighthouse will happily score as a fast one.
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const ARM = process.argv[2]
if (!ARM) throw new Error("usage: node scripts/checkpoint-13-lighthouse.mjs <armName>")

// The lighthouse bin's `#!/usr/bin/env node` shebang cannot resolve here — nvm
// leaves `node` as a shell function, not a binary — so spawn the real one directly.
const NODE = process.execPath
const LH = "/tmp/lh-tools/node_modules/lighthouse/cli/index.js"
const BASE = "http://localhost:3111"
const ROUTES = ["/", "/products"]
const PRESETS = ["mobile", "desktop"]
const RUNS = 5

const scratch = mkdtempSync(path.join(tmpdir(), "lh-"))

// The metrics the ticket names, plus the four checkpoint-01-03 called the only
// network-independent ones (DOM, requests, bytes) — those are the comparable column.
function extract(report) {
  const a = report.audits
  const num = (id) => a[id]?.numericValue ?? null
  return {
    performance: Math.round((report.categories.performance.score ?? 0) * 100),
    lcp: num("largest-contentful-paint"),
    cls: num("cumulative-layout-shift"),
    fcp: num("first-contentful-paint"),
    tbt: num("total-blocking-time"),
    speedIndex: num("speed-index"),
    bytes: num("total-byte-weight"),
    requests: a["network-requests"]?.details?.items?.length ?? null,
    dom: num("dom-size"),
  }
}

const results = []
for (const preset of PRESETS) {
  for (const route of ROUTES) {
    for (let run = 1; run <= RUNS; run++) {
      const out = path.join(scratch, `${preset}-${route.replace(/\W/g, "_")}-${run}.json`)
      const args = [
        `${BASE}${route}`,
        "--only-categories=performance",
        "--output=json",
        `--output-path=${out}`,
        "--quiet",
        `--chrome-flags=--headless=new --no-sandbox --disable-gpu`,
      ]
      if (preset === "desktop") args.push("--preset=desktop")
      execFileSync(NODE, [LH, ...args], { stdio: ["ignore", "ignore", "pipe"] })
      const metrics = extract(JSON.parse(readFileSync(out, "utf8")))
      results.push({ preset, route, run, ...metrics })
      process.stderr.write(
        `${ARM} ${preset} ${route} run ${run}: LCP ${Math.round(metrics.lcp)}ms TBT ${Math.round(metrics.tbt)}ms perf ${metrics.performance}\n`
      )
    }
  }
}

// Median and spread, because a single run cannot tell a regression from noise —
// ticket 02's own stop condition is stated in terms of the spread.
const median = (xs) => {
  const s = [...xs].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const summary = []
for (const preset of PRESETS) {
  for (const route of ROUTES) {
    const rows = results.filter((r) => r.preset === preset && r.route === route)
    const agg = { preset, route, runs: rows.length }
    for (const key of ["performance", "lcp", "cls", "fcp", "tbt", "speedIndex", "bytes", "requests", "dom"]) {
      const vals = rows.map((r) => r[key]).filter((v) => v !== null)
      agg[key] = { median: median(vals), min: Math.min(...vals), max: Math.max(...vals) }
    }
    summary.push(agg)
  }
}

writeFileSync(
  `.scratch/studio-dark/lighthouse-${ARM}.json`,
  JSON.stringify({ arm: ARM, results, summary }, null, 2)
)
console.log(`wrote ${ARM}.json — ${results.length} runs`)
