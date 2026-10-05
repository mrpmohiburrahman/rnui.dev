import { readFileSync } from "node:fs"

const load = (a) =>
  JSON.parse(
    readFileSync(`.scratch/studio-dark/lighthouse-${a}.json`, "utf8")
  ).summary
const A = load("arm-A-1206-2622")
const B = load("arm-B-9x16")

for (const a of A) {
  const b = B.find((x) => x.preset === a.preset && x.route === a.route)
  console.log(`\n=== ${a.preset} ${a.route}`)
  for (const m of ["lcp", "tbt", "cls", "bytes", "requests", "dom"]) {
    const ma = a[m].median
    const mb = b[m].median
    const delta = ma - mb
    // The spread of the wider arm's own min..max. A delta smaller than the
    // spread is inside the noise of five runs and cannot be called a change.
    const spread = Math.max(a[m].max - b[m].min, b[m].max - a[m].min)
    const inside = m === "bytes" || m === "requests" || m === "dom" || m === "cls"
      ? delta === 0
      : Math.abs(delta) <= spread
    console.log(
      `  ${m.padEnd(9)} new ${String(Math.round(ma)).padStart(9)}` +
        `  old ${String(Math.round(mb)).padStart(9)}` +
        `  delta ${String(Math.round(delta)).padStart(7)}` +
        `  spread ${String(Math.round(spread)).padStart(7)}` +
        `  ${inside ? "INSIDE spread" : "OUTSIDE spread"}`
    )
  }
}