/**
 * Why D as built was wrong, in numbers.
 *
 * A card is 1200px wide but is DISPLAYED at a fraction of that, and the fraction
 * differs per platform. D as built in round 1 used one scale (K=2.8) for every
 * step, which put the byline and the Category label under 11px on screen at the
 * three platforms where a share is most common.
 *
 * Round 2's fix: the caption keeps K=2.8 (bounded above by the longest caption
 * needing three lines) and every step BELOW it gets its own larger scale, because
 * a card is not a web page -- nothing on it needs to read as body text.
 *
 * Run: pnpm tsx .scratch/social-cards/probe/ticket06/platform-fit.ts
 */
const CARD_W = 1200

/** On-screen px per step, at each platform's display width. */
const PLATFORMS: [string, number][] = [
  ["iMessage", 300], ["WhatsApp", 340], ["Slack sidebar", 360],
  ["Discord", 400], ["X / Twitter", 504], ["LinkedIn", 552],
]

const FLOOR = 11 // the usual floor for text a reader is expected to read

function table(title: string, steps: Record<string, number>) {
  console.log(`\n${title}`)
  console.log("  " + "step".padEnd(10) + PLATFORMS.map(([n]) => n.padEnd(15)).join(""))
  const fails: string[] = []
  for (const [label, px] of Object.entries(steps)) {
    const cells = PLATFORMS.map(([, w]) => {
      const on = px * w / CARD_W
      const bad = on < FLOOR
      if (bad) fails.push(`${label} @ ${w}px`)
      return `${on.toFixed(1)}${bad ? "!" : ""}`.padEnd(15)
    })
    console.log("  " + label.padEnd(10) + cells.join(""))
  }
  return fails
}

const f1 = table("Round 1 — D as built, one scale (K=2.8) for every step", {
  caption: 81, byline: 34, category: 25, initials: 21,
})

const f2 = table("Round 2 — caption held at 2.8, smaller steps promoted", {
  caption: 81, byline: 44, category: 44, initials: 20,
})

console.log("\n  (the initials disc is decorative and may sit under the floor -- the")
console.log("   Contributor's NAME beside it is what must be readable, and it is at")
console.log("   11.0px+. Only the Category label needed raising, from 4.0 to 4.9.)")

console.log(`\n(! = under ${FLOOR}px on the reader's screen)`)
console.log(`round 1 below the floor on ${f1.length} step/platform pairs: ${f1.join(", ")}`)
const meaningful = f2.filter(x => !x.startsWith("initials"))
console.log(`round 2 below the floor on ${meaningful.length} MEANINGFUL pairs (excluding the decorative disc)`)
if (meaningful.length) console.log("  still under: " + meaningful.join(", "))

/** The crop budget, which is a separate constraint from the type budget. */
console.log("\ncrop budget — what a platform removes from a 1.905:1 card:")
for (const [name, tw, th] of [["Slack 1.8:1", 1080, 600], ["Discord 2:1", 1200, 600], ["LinkedIn 1.8:1", 1080, 600]] as [string, number, number][]) {
  const s = Math.max(tw / CARD_W, th / 630)
  console.log(`  ${name.padEnd(14)} loses ${(CARD_W - tw / s).toFixed(0)}px of width, ${(630 - th / s).toFixed(0)}px of height`)
}
console.log("  => a 60px inset on the text column survives all three. The Poster")
console.log("     bleeds off the right edge on purpose and is not inset.")
