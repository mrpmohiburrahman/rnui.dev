// PROTOTYPE — ticket 04, round 4. Throwaway; nothing ships.
//
// Rounds 1–3 are subtraction. This round is the first one with a **point of view**,
// and it exists because impeccable's `bolder.md` says what rounds 1–3 were doing:
//
//   > "The reflex answer, reaching for more effects, is the opposite of bold; reject
//      it first."
//   > "Commit, then clarify. Half-measures read as noise. Make the one decisive move
//      completely, then quiet everything around it so the move is legible."
//   > "Strip the copy out of your planned section and study the bare structure. Does
//      the skeleton still say what this section is and why it matters, through
//      hierarchy and the system's devices alone?"
//   > "A placeholder for an image or artifact names a job, an anchor and a piece of
//      evidence, not a cue to drop in a decorative photo; fill that job with whatever
//      the subject actually has."
//
// ## The skeleton test, applied to what I already shipped
//
// Rounds 1–3 were **one skeleton six times**: wordmark top-left, a claim, a counts
// strip, some Posters on the right. Strip the copy and the six are indistinguishable.
// That is the definition `bolder.md` gives of a design that is not bold — and it is
// why "add assets, make it less plain" kept producing cards that were plainer, not
// bolder. Round 3 removed the glow and the washes and got *quieter*, which is the
// other half of the same failure: I had nothing louder to commit to.
//
// ## What the tiles were actually doing
//
// They were **decoration**, and `bolder.md` names that failure: an image must carry
// *a job, an anchor, and a piece of evidence*. The job here is specific and it is not
// "texture":
//
//   **This is a catalogue of real, running, community-made interfaces, and you can
//   see them working right now.**
//
// At 92px a Poster is a postage stamp and proves nothing — you cannot read a single
// control. Meanwhile the system already owns the decisive move and I had been
// spending it on thumbnails: **the site shows Demos full-bleed**, and a Poster is a
// frame of a Demo. So round 4 puts Posters at the size where they are *evidence*,
// and gives each variant a different skeleton so the test passes.
//
// ## The six, and each one's single decisive move
//
//   | | Skeleton | The one decisive move |
//   |---|---|---|
//   | 1 | **Vitrine** | **scale** — one Poster at 700px tall, uncropped, big enough to read the actual UI |
//   | 2 | **Contact** | **subordination** — the wordmark is typeset *inside* the grid, occupying one cell of twenty |
//   | 3 | **Specimen** | **the crop** — one Poster blown to a 1200px band and cropped to 3:1, the one card that crops on purpose |
//   | 4 | **Foreshorten** | **depth** — five Posters receding like a feed, each smaller and fainter |
//   | 5 | **Set** | **type as image** — no grid at all; the claim at 152px carries the card, one Poster as a stamp |
//   | 6 | **Field** | **completeness** — the ramp, committed: tiles at 180px edge to edge with no gaps, a solid field rather than confetti |
//
// ## What carries over, and it is all measured
//
//   * K = 2.8 and the 37px platform floor (round 1)
//   * the wordmark at the header's treatment, `wordmark.tsx` (ticket 06)
//   * a shadow is **not** contained by `overflow: hidden` — 0px flat, 20px blurred,
//     **43px on a rotated child** (round 3). Anything separating type from imagery
//     needs that margin.
//   * Satori requires explicit `display: flex` on a div with >1 child.
//   * every string width is measured: JetBrains Mono advances 0.6em, Space Grotesk
//     ~0.52em at these sizes, and both figures are checked before a box is sized.

import { readFileSync } from "node:fs"
import { createElement as h, type ReactNode } from "react"

export type Mode = "dark" | "light"

const C = {
  dark: {
    canvas: "#0A0B0D", panel: "#101216", rail: "#0C0D11",
    t1: "#F1F2F4", t2: "#B2B8C2", t3: "#8E949F",
    acc: "#6FE3CC", line: "rgba(255,255,255,0.11)", line2: "rgba(255,255,255,0.22)",
  },
  light: {
    canvas: "#F4F4F1", panel: "#FFFFFF", rail: "#EFEFEB",
    t1: "#14161A", t2: "#4F545C", t3: "#666B74",
    acc: "#0E7062", line: "rgba(16,18,22,0.13)", line2: "rgba(16,18,22,0.24)",
  },
} as const

export type Pal = (typeof C)[Mode] & { line2: string }

export const STATS = { recordings: 298, contributors: 24, categories: 18 }
export const CLAIM = "A community-made catalogue of React Native interfaces."
/** The claim's verb, for `Set` — one word carries the accent. */
export const CLAIM_ACCENT = "community-made"

const b64 = (p: string) =>
  `data:image/jpeg;base64,${readFileSync(new URL(p, import.meta.url).pathname).toString("base64")}`

type Tile = { key: string; hue: number; caption: string; contributor: string; aspect: number }
const TILES: Tile[] = JSON.parse(readFileSync(new URL("./grid/small/index.json", import.meta.url).pathname, "utf8"))
const DEVICES: { key: string; hue: number; aspect: number } = [
  { key: "snake", hue: 356, aspect: 0.477 },
  { key: "fluid", hue: 167, aspect: 0.4721 },
  { key: "ripple", hue: 25, aspect: 0.6056 },
  { key: "land", hue: 210, aspect: 1.7778 },
  { key: "morphingLoader", hue: 163, aspect: 0.4633 },
]
const small = (k: string) => b64(`./grid/small/${k}.jpg`)
const poster = (k: string) => b64(`./renditions/${k}-tall-h900.jpg`)

const SANS = "Space Grotesk"
const MONO = "JetBrains Mono"

/** `--media-glow` at a Recording's own hue — the tile's own treatment, used once. */
const glow = (hue: number) =>
  `0 0 0 1px hsla(${hue},60%,62%,0.30), 0 30px 70px -26px hsla(${hue},70%,58%,0.55)`

function Mark({ size, pal, weight = 700, tracking = -0.022 }: { size: number; pal: Pal; weight?: number; tracking?: number }) {
  return h(
    "div",
    { style: { display: "flex", fontFamily: SANS, fontSize: size, fontWeight: weight, letterSpacing: `${tracking}em`, lineHeight: 1 } },
    h("span", { style: { color: pal.t1 } }, "rnui"),
    h("span", { style: { color: pal.acc } }, ".dev")
  )
}

/**
 * The claim, as **one wrapping sentence** in `--t1`.
 *
 * The accent-run version used three spans inside a `flexWrap: wrap` container, and
 * each span became its own flex item: `"A "` fitted on line 1, `community-made` was
 * too wide to follow it so wrapped to line 2, and the rest was clipped by the box.
 * Set rendered as the two words `A` and `community-`. An inline accent inside a
 * wrapped sentence needs the sentence to be one text node — which this renderer
 * cannot do, so `Set` sets the claim as **explicit lines** instead, with the accent
 * owning a whole line. That is a better answer anyway: a decisive card should not
 * tint one word in the middle of a paragraph.
 */
function Claim({ pal, size, weight = 300, width, lines }: { pal: Pal; size: number; weight?: number; width: number; lines: string[] }) {
  return h(
    "div",
    {
      style: {
        display: "flex", flexDirection: "column",
        fontFamily: SANS, fontSize: size, lineHeight: 1.1, fontWeight: weight,
        letterSpacing: "-0.018em", width,
        // **One spare line of height, deliberately.** Space Grotesk measures 0.515em
        // per glyph at weight 300 (`tmp/measure.ts`, rendered and ink-counted, not
        // guessed) but the real break depends on the box it is given, and a box one
        // line too short does not clip cleanly in Satori — the third line drew *on top
        // of* the counts beneath it. A spare line turns that class of error into a
        // clipped line, which is survivable.
        height: Math.round(size * 1.1 * (lines.length + 1)), overflow: "hidden",
      },
    },
    // `whiteSpace: nowrap` on every set line. A line that has been measured to fit
    // should never wrap: if it somehow does, an overflow is visible and fixable,
    // where a silent re-wrap draws a fourth line on top of the counts.
    ...lines.map((l, i) =>
      h("div", { key: i, style: { color: l === CLAIM_ACCENT ? pal.acc : pal.t1, whiteSpace: "nowrap" } }, l)
    )
  )
}

/** Wrapping the claim for a given width, at a given size. */
function claimLines(size: number, width: number): string[] {
  // 0.515em, measured by rendering the claim at 34px/weight 300 and ink-counting the
  // run (`tmp/measure.ts`). Rounded *down* to whole characters, and the box carries a
  // spare line, so the estimate erring slightly low costs nothing.
  const perLine = Math.max(1, Math.floor(width / (size * 0.515)))
  const words = CLAIM.split(" ")
  const out: string[] = []
  let cur = ""
  for (const w of words) {
    if (cur === "") cur = w
    else if (`${cur} ${w}`.length <= perLine) cur = `${cur} ${w}`
    else { out.push(cur); cur = w }
  }
  if (cur) out.push(cur)
  return out
}

/**
 * The counts on **two lines**, because one line does not fit.
 *
 * "298 RECORDINGS · 24 CONTRIBUTORS · 18 CATEGORIES" is 49 glyphs and JetBrains Mono
 * advances 0.6em, so at 21px it measures **617px** — wider than every text column on
 * this card, and in Foreshorten it ran 117px under the nearest Poster. This is the
 * same measurement that caught it in round 3; it is written on the component this
 * time so the next person does not re-derive it.
 *
 * The separators are `padding`-carried rather than spaces inside the text. A span
 * whose content is `"  ·  "` rendered as **nothing at all** — Satori trims it — so
 * the first pass produced `298 RECORDINGS24 CONTRIBUTORS18 CATEGORIES` on all twelve
 * renders. Whitespace inside a flex item is not whitespace you can rely on.
 */
function Counts({ pal, size = 21 }: { pal: Pal; size?: number }) {
  const line = (a: string, b: string, key: string) =>
    h(
      "div",
      { key, style: { display: "flex", alignItems: "center" } },
      h("span", { style: { color: pal.t1 } }, a),
      h("span", { style: { color: pal.acc, opacity: 0.55, padding: "0 12px" } }, "\u00b7"),
      h("span", { style: { color: pal.t3 } }, b)
    )
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 7 } },
    line("298 RECORDINGS", "24 CONTRIBUTORS", "a"),
    line("18 CATEGORIES", "290 DISTINCT NAMES", "b")
  )
}

// -- 1. Vitrine ---------------------------------------------------------------
// **The decisive move: scale.** One Poster at 700px tall — 74% of the card's height —
// at true ratio and **uncropped**, so the actual interface is legible: you can read
// the nav, the counter, the chart axis. Every previous card used a Poster at 92px,
// where nothing is readable and therefore nothing is evidence.
//
// The wordmark is deliberately **not** the hero here. It is 46px, top-left, quiet.
// The Poster is the hero because the Poster is the argument.

function Vitrine({ pal }: { pal: Pal }) {
  const d = DEVICES[0]
  const H = 700
  const W = Math.round(H * d.aspect)
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    // The plinth: the Design's own `--plinth` idea, a surface the object sits on
    // rather than floating in a void.
    h("div", { style: { position: "absolute", left: 0, right: 0, bottom: 0, height: 96, background: pal.rail } }),
    h(
      "div",
      { style: { position: "absolute", left: 72, top: 62, display: "flex", flexDirection: "column", gap: 30 } },
      h(Mark, { size: 46, pal }),
      h("div", {
        style: { fontFamily: MONO, fontSize: 21, letterSpacing: "0.13em", color: pal.t3 },
      }, "A CATALOGUE OF REACT NATIVE INTERFACES")
    ),
    h(
      "div",
      // Column and claim share **one** width. They were 500 and 520, and Satori wraps
      // a child at its *parent's* width, so the claim broke at 500 and stranded "of"
      // alone on line 2 while the box it was handed said 520 and claimed room.
      // Measured at 34px/weight 300 (`tmp/measure2.ts`, rendered and ink-counted per
      // line rather than averaged over the whole claim): "A community-made catalogue"
      // is **480px**, "of React Native interfaces." is **422px**. 540 holds both.
      { style: { position: "absolute", left: 74, bottom: 132, display: "flex", flexDirection: "column", gap: 20, width: 540 } },
      h(Claim, { pal, size: 34, width: 540, lines: ["A community-made catalogue", "of React Native interfaces."] }),
      h(Counts, { pal, size: 21 })
    ),
    // The subject. Bleeding off the top and bottom on purpose: at 700px it is a
    // screen you are looking *into*, not an icon you are looking at.
    h("img", {
      src: poster(d.key),
      style: {
        position: "absolute", right: 92, top: -35, width: W, height: H,
        objectFit: "cover", borderRadius: 18, boxShadow: glow(d.hue),
      },
    }),
    // A caption for the subject, so it reads as one named Demo rather than decor.
    h("div", {
      style: { position: "absolute", right: 92, bottom: 116, width: W, display: "flex", justifyContent: "flex-end" },
    },
      h("div", { style: { fontFamily: MONO, fontSize: 19, letterSpacing: "0.08em", color: pal.t3 } }, "SNAKE · PUSHKAR TANDON")
    )
  )
}

// -- 2. Contact ---------------------------------------------------------------
// **The decisive move: subordination.** A 5x4 contact sheet, edge to edge with no
// gap — a film contact sheet, twenty frames of the same roll. The wordmark is
// typeset **inside** the sheet, sitting in one cell's worth of space with a solid
// `--canvas` behind it, so the site's own name is *one of the twenty things in the
// catalogue* rather than a label floating above them.
//
// Round 3's `Stack` had a grid too, but the grid was decoration beside the type. Here
// the type is *inside* the artefact, which is the whole difference.

function Contact({ pal }: { pal: Pal }) {
  const COLS = 5
  const ROWS = 4
  const CW = 240
  const CH = 158
  const cell = (i: number) => {
    const t = TILES[i % TILES.length]
    return h("img", {
      key: i, src: small(t.key),
      style: { width: CW, height: CH, objectFit: "cover", display: "flex" },
    })
  }
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => (i === 6 ? wordmarkCell(pal) : cell(i)))
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      "div",
      {
        style: {
          position: "absolute", left: 0, top: 0,
          width: COLS * CW + (COLS - 1) * 4, height: ROWS * CH + (ROWS - 1) * 4,
          display: "flex", flexWrap: "wrap", gap: 4,
        },
      },
      ...cells
    ),
    // The sheet runs off the right and bottom; the caption names what it is.
    h("div", {
      style: { position: "absolute", right: 0, bottom: 0, width: 470, height: 66, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 26, background: pal.canvas },
    },
      h("div", { style: { fontFamily: MONO, fontSize: 19, letterSpacing: "0.11em", color: pal.t3 } }, "298 RECORDINGS · 18 CATEGORIES")
    )
  )

  function wordmarkCell(p: Pal) {
    return h(
      "div",
      { key: 6, style: { width: CW, height: CH, background: p.canvas, display: "flex", alignItems: "center", justifyContent: "center" } },
      h(Mark, { size: 40, pal: p })
    )
  }
}

// -- 3. Specimen --------------------------------------------------------------
// **The decisive move: the crop** — the one card in this map that crops a Poster on
// purpose. Ticket 06 established a Poster must never be cropped *to fit a device
// frame*, and measured that `cover` keeps 25% of a portrait Poster. Here the crop is
// the composition: one Poster blown to the full 1200px width and cut to a 3:1 band,
// so a stranger sees a *fragment* — one button, a slice of a chart — at a scale where
// the pixels are the subject. It reads as a specimen under glass, not as a phone.
//
// The wordmark sits in the fragment's own dark area, reversed out, which is the one
// place on this card that type and image touch.

function Specimen({ pal }: { pal: Pal }) {
  const d = DEVICES[2]
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", background: pal.canvas, position: "relative", overflow: "hidden" } },
    // The band: full-bleed, 1200 x 372 — a 3.23:1 crop. `cover`, and that is the point.
    h(
      "div",
      { style: { position: "absolute", left: 0, top: 0, width: 1200, height: 372, display: "flex" } },
      h("img", { src: poster(d.key), style: { width: 1200, height: 372, objectFit: "cover", display: "flex" } })
    ),
    h(
      "div",
      { style: { position: "absolute", left: 0, top: 372, width: 1200, height: 258, background: pal.canvas, display: "flex", alignItems: "center", padding: "0 68px", gap: 44 } },
      h(Mark, { size: 64, pal }),
      h("div", { style: { width: 1, height: 58, background: pal.line2, flexShrink: 0 } }),
      // One column, and everything that needs a measured width lives in it. The credit
      // used to be a `flexGrow` sibling competing with a 620px claim for what was
      // left of 1200 - 136 padding - 64 wordmark - 88 gaps - 1 rule, received ~150px,
      // and clipped "DAEHYEON MUN (문대현)" — measured at **255px** — to the letter D.
      // `flexGrow` hands out *remaining* space, so a fixed-width sibling silently
      // starves whatever follows it. Nothing flexible goes after a fixed column.
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 15, width: 640 } },
        h(Claim, { pal, size: 30, width: 640, lines: ["A community-made catalogue of", "React Native interfaces."] }),
        h("div", { style: { display: "flex", gap: 14, fontFamily: MONO, fontSize: 19, letterSpacing: "0.1em", color: pal.t3 } },
          "RIPPLE EFFECT",
          h("span", { style: { color: pal.acc, opacity: 0.55, padding: "0 10px" } }, "\u00b7"),
          "DAEHYEON MUN (\ubb38\ub300\ud604)"
        ),
        h(Counts, { pal, size: 20 })
      ),
      h("div", { style: { flexGrow: 1, display: "flex" } })
    )
  )
}

// -- 4. Foreshorten -----------------------------------------------------------
// **The decisive move: depth.** Five Posters receding like a phone's feed pushed
// away from the viewer — each smaller, each fainter, each offset along a diagonal.
// Round 2's `Echo` repeated one Poster at falling scale and `Ramp` scattered many;
// this stacks **different** ones, so the recession reads as *more catalogue* rather
// than as one image echoed.

function Foreshorten({ pal }: { pal: Pal }) {
  const n = 6
  const hero = DEVICES[3]
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    h(
      "div",
      { style: { position: "absolute", left: 596, top: 0, bottom: 0, width: 604, display: "flex" } },
      // Back to front: the recursion is drawn last-on-top by painting in reverse.
      ...Array.from({ length: n }, (_, k) => {
        const i = n - 1 - k // 5 (farthest) .. 0 (nearest)
        const t = i / (n - 1)
        const H = Math.round(560 - t * 300)
        const d = DEVICES[i % DEVICES.length]
        return h(
          "img",
          {
            key: i, src: poster(d.key),
            style: {
              position: "absolute", left: 30 + t * 168, top: Math.round((630 - H) / 2 + t * 26),
              width: Math.round(H * d.aspect), height: H, objectFit: "cover",
              borderRadius: 14, opacity: 0.3 + (1 - t) * 0.7,
              boxShadow: i === 0 ? glow(d.hue) : "0 0 0 1px rgba(255,255,255,0.07)",
            },
          }
        )
      })
    ),
    h(
      "div",
      { style: { position: "absolute", left: 72, top: 0, bottom: 0, width: 500, display: "flex", flexDirection: "column", justifyContent: "center" } },
      h(Mark, { size: 88, pal }),
      h("div", { style: { height: 34 } }),
      h(Claim, { pal, size: 44, width: 470, lines: claimLines(44, 470) }),
      h("div", { style: { height: 30 } }),
      h(Counts, { pal, size: 21 }),
      h("div", { style: { height: 26 } }),
      h("div", { style: { fontFamily: MONO, fontSize: 20, color: pal.t3, letterSpacing: "0.06em" } }, "Snake · Fluid Carousels · Toast")
    )
  )
}

// -- 5. Set -------------------------------------------------------------------
// **The decisive move: type as image.** No grid, no field, no scatter — one Poster
// at 220px as a *stamp* in the corner, and the claim at **152px** filling half the
// card. `typeset.md` is explicit that this surface is Persuade, where "display type
// may carry the voice", and "combine size, weight, space and tone" rather than
// letting size do all the work: so the accent sits on one word inside the sentence,
// the weight is 300 against the wordmark's 700, and the counts drop to a whisper.

function Set({ pal }: { pal: Pal }) {
  const d = DEVICES[4]
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: pal.canvas, position: "relative", overflow: "hidden", padding: "0 76px" } },
      h(Mark, { size: 40, pal }),
      h("div", { style: { height: 44 } }),
      // Three deliberate lines at 118px, with the accent owning the middle one.
      // At 132px the sentence needed four lines and the box held two.
      h(Claim, { pal, size: 88, width: 1040, lines: ["A", CLAIM_ACCENT, "catalogue of React", "Native interfaces."] }),
      h("div", { style: { height: 44 } }),
      h(
        "div",
        { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between" } },
        h(Counts, { pal, size: 21 }),
        // The stamp: 300px was clipped by the card's bottom edge, because the column
        // is `justifyContent: center` and the row is bottom-aligned inside it.
        h("img", {
          src: poster(d.key),
          style: { width: 150, height: 256, objectFit: "cover", borderRadius: 14, boxShadow: glow(d.hue) },
        })
      )
    )
}

// -- 6. Field -----------------------------------------------------------------
// **The decisive move: completeness.** The ramp the maintainer chose, committed to
// rather than suggested: tiles at **180px, edge to edge, no gaps**, filling the right
// 58% of the card as a solid field. Round 3's cleaned Ramp had 10px gaps between rows
// and floated tiles at 132px, which read as *scattered*. Removing the gaps and
// enlarging the tiles turns the same diagonal into a wall of demos — which is what a
// catalogue of 298 actually looks like when you stop being polite about it.

function Field({ pal }: { pal: Pal }) {
  const T = 180
  const CH = Math.round((T * 116) / 92)
  const COLS = 4
  const ROWS = 4
  return h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: pal.canvas, position: "relative", overflow: "hidden" } },
    // The field, sheared into a diagonal and bled off two edges.
    h(
      "div",
      { style: { position: "absolute", left: 604, top: -110, display: "flex", flexDirection: "column", transform: "skewY(-9deg)" } },
      ...Array.from({ length: ROWS }, (_, r) =>
        h(
          "div",
          { key: r, style: { display: "flex", marginLeft: r * 92 } },
          ...Array.from({ length: COLS }, (_, c) => {
            const i = r * COLS + c
            const t = TILES[i % TILES.length]
            return h("img", {
              key: i, src: small(t.key),
              style: {
                width: T, height: CH, objectFit: "cover", display: "flex",
                boxShadow: i === 5 ? glow(t.hue) : "0 0 0 1px rgba(255,255,255,0.06)",
              },
            })
          })
        )
      )
    ),
    h(
      "div",
      { style: { position: "absolute", left: 72, top: 0, bottom: 0, width: 500, display: "flex", flexDirection: "column", justifyContent: "center" } },
      h(Mark, { size: 96, pal }),
      h("div", { style: { height: 40 } }),
      h(Claim, { pal, size: 48, width: 480, lines: claimLines(48, 480) }),
      h("div", { style: { height: 34 } }),
      h(Counts, { pal, size: 21 })
    )
  )
}

export const VARIANTS = [
  { key: "Vitrine", name: "Vitrine", bet: "SCALE — one Poster at 700px, uncropped, big enough to actually read the UI", fn: (p: Pal) => Vitrine({ pal: p }) },
  { key: "Contact", name: "Contact", bet: "SUBORDINATION — a 20-frame contact sheet with rnui.dev typeset inside it as one cell", fn: (p: Pal) => Contact({ pal: p }) },
  { key: "Specimen", name: "Specimen", bet: "THE CROP — one Poster blown to 1200px and cut to a 3:1 band, on purpose", fn: (p: Pal) => Specimen({ pal: p }) },
  { key: "Foreshorten", name: "Foreshorten", bet: "DEPTH — six different Posters receding like a feed", fn: (p: Pal) => Foreshorten({ pal: p }) },
  { key: "Set", name: "Set", bet: "TYPE AS IMAGE — no grid at all; the claim at 132px carries the card", fn: (p: Pal) => Set({ pal: p }) },
  { key: "Field", name: "Field", bet: "COMPLETENESS — the ramp committed: 180px tiles edge to edge, no gaps", fn: (p: Pal) => Field({ pal: p }) },
] as const

export type VariantKey = (typeof VARIANTS)[number]["key"]

export function render(variant: VariantKey, mode: Mode) {
  return VARIANTS.find((v) => v.key === variant)!.fn(C[mode])
}
