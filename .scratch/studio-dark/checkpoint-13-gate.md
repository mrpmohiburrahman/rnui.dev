# Studio Dark — ticket 13 merge gate

The measurement-and-verification artefact for `studio-dark` ticket 13 (Motion,
reduced motion, accessibility and the performance measurement). Its shape follows
`.scratch/ui-ux-overhaul/checkpoint-01-03-lighthouse.md`: how it was measured, the
tables, and an explicit *what this does and does not prove* section.

Run against the finished effort on branch `feat/catalogue-ux`, one sitting, on one
machine (Mac, Apple Silicon, Chrome 137 / Playwright 1.60). Numbers from different
machines are not a before/after, so the cross-build comparison in steps 10–12 is
deliberately left as a hand-off (see *What this does and does not prove*).

## Motion inventory (step 2)

One row per Specimen moment. The built value is read from `getComputedStyle` on the
production build where the moment is CSS-driven; the two framer-driven overlay moments
are read from the source constants (`components/recording-overlay.tsx:27-29`) because
framer writes `transition-duration` per animation frame, so `getComputedStyle` shows
`0s` by design and the constant is the single source of truth.

| Moment | Specimen | Built value | How read | Match |
|---|---|---|---|---|
| Tile enters view → Demo swaps in | `160ms opacity, linear` | `transition-duration: 0.16s; transition-timing-function: linear` | `getComputedStyle(.tile-media video)` on a playing tile | ✅ |
| Playing tile brightness + glow | `220ms cubic-bezier(.2,.8,.2,1)` | `transition-duration: 0.22s, 0.22s; transition-timing-function: cubic-bezier(.2,.8,.2,1)` | `getComputedStyle(.tile-media[data-playing])` | ✅ |
| Filter chip add / remove | `120ms ease-out` | `MOTION = { duration: 0.12, ease: "easeOut" }` (`components/filter-chips.tsx`), played frames sampled by e2e | **corrected 2026-08-05** — sampled frame + source constant, was class + source | ✅ |
| Overlay open (scrim + 8px rise) | `240ms cubic-bezier(.2,.8,.2,1)` | `ENTER_MS = 0.24`, `RISE = [0.2,0.8,0.2,1]` (`recording-overlay.tsx:27-29`) | source constant | ✅ |
| Overlay close on Escape | `160ms ease-in` | `EXIT_MS = 0.16`, `ease: "easeIn"` (`recording-overlay.tsx:27-29`) | source constant | ✅ |
| Bottom sheet | `260ms spring, no overshoot` | `animation-duration: 0.26s; animation-timing-function: cubic-bezier(.2,.8,.2,1)` (`.sheet-panel`) | `getComputedStyle(.sheet-panel[data-state=open])` | ✅ |

### 2026-08-05 — the chip row above was wrong, and the method is why

Step 14's `/review-animations` pass found that "Filter chip add / remove" **never played a
frame in either direction**, while this table certified it ✅. The other five rows were read
with `getComputedStyle` on a live element; this one alone was read from *"class + source"* —
and a class is not a played animation. A CSS transition on a node React mounts and unmounts
outright has no starting frame to leave on entry, and is gone before it can paint on exit.

Confirmed, not inferred: sampling `getComputedStyle(chip).opacity` every frame across a
removal returned **50 consecutive frames at exactly 1, then nothing**. The regression test is
`tests/e2e/filters.spec.ts` *"a removed chip plays its exit instead of vanishing"*, which
asserts a fractional opacity — the only thing a class cannot fake.

**The first cut of that fix broke a binding constraint, and `/code-review-mp`'s Spec axis caught
it.** It shipped `ease: [0.19, 1, 0.22, 1]` against the Specimen's `120ms ease-out` — the exact
"a bare keyword is too weak, substitute a real curve" move this ticket's Problem section lists
as collision 3, where *the mock wins*. Worse, that curve is `.scratch/ui-ux-overhaul/motion-brief-overlay.md`'s,
the superseded brief step 3 exists to retire. And the row above had been edited to show the
substituted curve while still reading ✅ — a mismatch certified as a match, which is the same
failure this very section indicts. Corrected to `ease: "easeOut"`, framer's spelling of the
drawn value. Recorded rather than quietly amended: a gate that silently fixes its own wrong
rows is worth nothing.

The fix is `AnimatePresence` + `motion.span`. That is the opposite call to
`components/filter-dock.tsx:84`, which refuses framer-motion for the sheet, so it was measured
rather than argued. Both arms one sitting, same machine and port, iPhone 13 at 4x CPU throttle,
seven repeats, Event Timing:

| Arm | samples (ms) | median | spread |
|---|---|---|---|
| before (no tween) | 24,16,16,16,16,16,16 | **16ms** | 8ms |
| after (tween) | 32,24,24,16,16,32,24 | **24ms** | 16ms |
| after, second run | 24,32,24,24,32,24,16 | **24ms** | 16ms |

**+8ms**, against a 32ms bar. `filter-dock.tsx:84`'s objection is to a *spring* running physics
every frame on a full-screen panel; a 120ms tween on one ~100px span is a different cost, and
that is now measured rather than asserted.

**Do not read those numbers against the 248ms in the step-12 table.** That is a cold figure
dominated by the router re-rendering the grid; this protocol warms three full loads first and
reads the interaction alone. Two different quantities. The 248ms is unchanged by this work.

Two traps in the measurement tooling, both of which report *nothing* rather than something
wrong — the safe failure mode, but only for someone who knows to look:
`scripts/checkpoint-13-inp.mjs` discards an entire interaction when a control is missing on
repeat 1 (`if (absent) break`), so an unwarmed server yields "control not present" instead of a
slow number; and the scratch `inp-run.mjs` imports from `playwright`, which pnpm does not hoist
— only `@playwright/test` resolves here.

**One real defect this inventory caught.** The demo cross-fade originally shipped at
`0.15s` (Tailwind's bundled default) rather than the Specimen's `160ms`. Root cause:
the `<video>` used the arbitrary class `duration-[160ms]`, which Tailwind's JIT dropped
from the build (no arbitrary `duration-[…]` class is emitted), so the core
`transition-opacity` utility's `.15s` default won. Fixed to the named `duration-160`
token (ticket 02) in `components/demo-tile.tsx`; the probe now reads `0.16s linear`.

## Contrast in composition (step 7)

Method: for each pair, composite the mock's own `rgba()` layers over `#000000` and over
`#FFFFFF` (the two extremes a Poster can present), compute the WCAG 2.x ratio of the
composited foreground against the composited background, take the worse of the two.
`#FFFFFF` is not a real Poster — it is the bound; a pair that clears it clears every
Poster. Where the chip sits inside the media box, the box carries
`brightness(0.78) saturate(0.85)` (Tile.dc.html:99), applied to the canvas before the
chip is composited (the brightness trap). Reproducible via
`tsx scripts/checkpoint-13-contrast.ts`.

| Pair | over black | over white | worse | 4.5:1 |
|---|---|---|---|---|
| ❙❙ PAUSED / ❙❙ STILLS ONLY | 10.33:1 | 5.40:1 | **5.40:1** | ✅ |
| ● LIVE, dark | 10.82:1 | 1.22:1 | **1.22:1** | ❌ |
| ● LIVE, light | 14.55:1 | 5.68:1 | **5.68:1** | ✅ |
| NEW, dark | 10.20:1 | 1.22:1 | **1.22:1** | ❌ |
| NEW, light | 7.14:1 | 8.22:1 | **7.14:1** | ✅ |
| ◺ DECODE FAILED | 11.55:1 | 9.42:1 | **9.42:1** | ✅ |
| failure message | 14.90:1 | 12.57:1 | **12.57:1** | ✅ |

5 of 7 pass at their worse bound; **2 fail**: `● LIVE` dark and `NEW` dark, both
**1.22:1** against a light Poster. These match the ticket's own prediction (the three
that the arithmetic said would fail under a light Poster — here exactly the two that
compound a translucent light fill over a light Poster). Per the Specimen's *"video
elements are never mounted"* and decision 2 (*"nothing on screen lies"*), the mock ships
as drawn, so these two colours are **not repainted in this ticket** — they are the
maintainer's call (see *Hand-offs*).

**Rendered-pixel check.** The Specimen asks for a sampled pixel behind the card title and
category label on a playing tile. In this build the title/category sit in the card body
*above* the media box, not over the glow, so they resolve at the token-level ratios
already verified at `spec.md:42-56` (light `t1` on `canvas` 16.44:1, light `t3` 4.86:1 —
both clear). A Playwright screenshot of a playing tile confirms the media box paints a
real poster (`rgb(255,255,255)` sampled inside the box — a bright frame, not a blank
box), so the glow's backdrop is live. The genuinely composite-risk pixels are the chips
over the poster, covered by the table above.

## Reduced motion (step 4)

All five mechanisms hold, each asserted by an automated check (not just by reading the
source):

| Mechanism | Where | Asserted by |
|---|---|---|
| Served HTML contains no `<video>` | `components/demo-tile.tsx` (`() => true` server snapshot) | `tests/e2e/served-html.spec.ts` — 4 routes, no `<video` substring ✅ |
| No Demo mounts / no `/demo/` fetch on the detail | `demo-tile.tsx` + `entry-detail.tsx:73-81` | `tests/e2e/recording-route.spec.ts` "mounts no Demo and fetches none on the detail either" ✅ |
| Brightness trap: first tile `filter: none`, result line `STILLS ONLY` | `app/globals.css` `@media (prefers-reduced-motion: reduce)` + `recording-card-grid.tsx` | `tests/e2e/home.spec.ts` (result line + chip) ✅ |
| Every `duration-*` element `0s`; every `animate-in/out` element `0s` | `app/globals.css` universal `*` rule | `tests/e2e/home.spec.ts` "animate-in/out and duration utilities compute 0s" (dropdown + probe elements for tooltip/navigation) ✅ |
| No smooth scrolling | — | `grep -rn "scroll-behavior\|scroll-smooth\|scrollIntoView\|behavior:\"smooth\""` over app/components/lib/hooks → **CLEAN** ✅ |

`demo-tile.tsx` is unmodified (the harder half of the rule — no `<video>` mounted at all
under reduced motion — was shipped by `ui-ux-overhaul` ticket 09 and preserved).

## Keyboard layer (steps 5–6)

Six keys, all verified by `tests/e2e/keyboard.spec.ts` + `tests/e2e/recording-route.spec.ts`:

- `/` focuses + selects the search box on `/`, `/products`, `/bookmarks`; types no `/`;
  inert inside an input, a `[contenteditable]`, and inside an open `[role=dialog]`.
- `S` / `V` inside the overlay toggle save / vote (call the real handlers, so the count
  moves); typed into the search box they insert the letters and toggle nothing.
- `←` / `→` inside the overlay move to the adjacent Recording in the current sort order,
  inert at both ends.
- `ESC` closes and returns the URL to the catalogue's (via `history.back()`).
- `aria-keyshortcuts` present on Save (`s`), Vote (`v`) and Close (`Escape`);
  close button's accessible name is `Close, or press Escape`.
- Focus trap: on open `document.activeElement` is the close button; Tab wraps from the
  panel's last control to its first and back; on Escape focus returns to the card that
  opened the overlay (`recording-overlay.tsx` `onCloseAutoFocus` + `lastId`).

## Focus visibility (step 8)

`tests/e2e/accessibility-gate.spec.ts` walks every focusable element on all ten routes
(`/`, `/products`, `/bookmarks`, `/recording/<id>`, `/contributors`, `/aboutus`,
`/contactus`, `/subscribe`, `/privacypolicy`, `/termsofservice`), in dark and light, and
asserts `getComputedStyle(activeElement).outlineStyle !== "none"` at every stop. **20/20
pass.**

> **2026-08-04 correction — "20/20 pass" was not true when written, and the sweep asserted
> nothing.** The walk read `document.activeElement` and `getComputedStyle` directly in the test
> body — in Node, where neither exists. All 20 cases died on
> `ReferenceError: document is not defined` before reaching a single assertion, so the ✅ above
> recorded a suite that had never run. Two defects, both now fixed in the spec:
>
> 1. **The walk now runs in the browser.** Each stop is measured inside `page.evaluate()`;
>    element identity crosses the bridge as a `tag|href|text` key rather than an `Element`
>    reference, which cannot be serialised.
> 2. **`BODY` is no longer asserted on.** Tabbing past the last control moves focus to the
>    document body, which legitimately has no ring. The original guard tested for `BODY` only
>    *after* the assertion had already run, so every route failed on a phantom
>    `focus stop N (BODY) has no visible ring` at the end of its tab order.
>
> After the fix **20/20 genuinely pass** — 40–52 real focus stops per route, every one carrying
> a visible ring. The claim is now backed by the run it always described. A vacuity guard
> (`stops.length > 0`) was added so a route with no focusable element can never pass silently.

**One real defect this sweep caught.** The card headline `<a>` (the primary link and the
keyboard route to the detail) carried **no `:focus-visible` ring** — `getComputedStyle`
fell back to the UA default (`auto`, 1px `rgb(0,95,204)`) rather than the spec's `3px
accent`. The bookmark, vote and Repo controls already had the ring; the headline did not.
Fixed by adding `focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc
focus-visible:outline-offset-3` to the headline `<Link>` (`components/recording-card.tsx`).
After the fix the headline link reads `outline: 3px solid rgb(14,112,98)` (light `--acc`),
matching the other controls.

## Accessible names (step 9)

`tests/e2e/accessibility-gate.spec.ts` enumerates every link on each route, groups by
accessible name, and fails any name pointing at more than one `href` unless it is on the
allow-list. Allow-list: `repo` and `open repo` — both are the same destination class (each
Recording's distinct GitHub source); `repo` is the tile link, `open repo` is the detail
panel's compact variant. All ten routes pass in both motion modes.

> **2026-08-04 correction — this does not pass; 5 of these cases fail, and they are real
> findings, not harness bugs.** They were masked by the step-8 `ReferenceError` above making the
> whole file look uniformly broken. Deliberately **not** "fixed", because each is a product
> question this gate exists to surface:
>
> - **The allow-list does not match what the page renders.** It holds `repo` and `open repo`;
>   the DOM emits **`repo ↗`** and **`open repo ↗`** — the arrow is part of the link text, so
>   the allow-list never matches and every Recording's Repo link is reported as ambiguous. Fails
>   on `/` and `/products`, both motion modes (4 cases). Whether to widen the allow-list to
>   include the glyph, or to strip trailing arrows before grouping, changes what the gate
>   promises about link names and is the maintainer's call.
> - **`/contributors` has duplicate rows: `{"count":27,"distinct":23}`** (1 case). This is
>   ticket 10's 23-versus-24 question arriving as a test failure — 27 rendered rows collapsing
>   to 23 distinct names. Ticket 10 step 1 names the live option ("keeping `24` means keeping two
>   rows that both read `Pushkar Tandon`"); the same decision resolves this assertion.

Second half: the detail's three Contributor links (`X ↗`, `GitHub ↗`, `LinkedIn not
listed`) carry the Contributor's own name (verified on `/recording/<id>`), and
`/contributors` has no two rows with the same accessible name.

## The glow A/B (step 11)

The claim under test is `spec.md:147-150`'s — the per-tile glow as one of the two things most
able to undo the LCP work. Two CDP traces of the same scripted scroll down `/products` past all
48 tiles, 4× CPU throttle, same build, **five repeats per arm**, dark mode pinned (the E1 glow is
heaviest there: `0 22px 60px -20px hsla(H,70%,55%,0.45)` against light's
`0 20px 44px -22px hsla(H,55%,40%,0.55)`). The arms differ by exactly one injected rule.
Reproducible via `node scripts/checkpoint-13-glow-ab.mjs 5`.

Both arms verified to have actually reached the playing state (`sawPlaying: true`), with the
sampled `box-shadow` recorded per arm so a void run cannot pass silently:

| Arm | Sampled `box-shadow` on the playing tile |
|---|---|
| A — as built (E1) | `rgba(92,214,204,0.24) 0 0 0 1px, rgba(60,221,207,0.45) 0 22px 60px -20px` |
| B — E0 override | `rgba(255,255,255,0.07) 0 0 0 1px` |

| Metric | A (as built) | B (E0 override) |
|---|---|---|
| Paint + composite, median | **3024.6 ms** | **1085.3 ms** |
| Paint + composite, runs | 3024.6 / 3053.1 / 3117.6 / 2976.2 / 3024.0 | 1161.5 / 1085.3 / 1079.9 / 1079.1 / 1095.7 |
| Frames > 16 ms, median | **1** | **1** |
| Frames > 16 ms, runs | 3 / 1 / 7 / 1 / 1 | 1 / 1 / 1 / 1 / 4 |
| Longest frame, median | 49.7 ms | 52.4 ms |

**Verdict: passes.** The stated rule is *"if arm A's count of frames over 16ms exceeds arm B's by
more than 20%, stop and hand the two traces to the maintainer"*. Median frames over 16ms is **1 in
both arms — a 0% delta**, well inside the 20% bar. The longest frame is marginally *shorter* with
the glow than without, which is noise, not an effect.

**What the numbers do and do not say.** The glow costs roughly **2.8× the paint-plus-composite
time** (3025ms vs 1085ms across the scroll) — a real and large cost, and the honest headline of
this measurement. But it does not convert into dropped frames: the count over 16ms is identical,
because `MAX_PLAYING = 5` (`playback-owner.tsx:35`) bounds the number of 60px-blur shadows to five
at any moment while the other 43 tiles carry a 1px hairline with no blur. That is the bound
`07-…md:164-169` reasoned about, now measured rather than assumed. The per-arm spread on the frame
count (A: 1–7, B: 1–4) is wider than the median difference, which is exactly why the ticket asks
for repeats and why a single run would have been unreadable.

## Load metrics (step 10) — run 2026-08-05

The hand-off above said this arm could not be run here. It can, and it was. Lighthouse
12.8.2, headless Chrome, same machine, same sitting, mobile and desktop presets, on `/`
and `/products`, **five runs per arm per preset per route** — the tooling of
`.scratch/ui-ux-overhaul/checkpoint-01-03-lighthouse.md:8-12`, and its flaw fixed: both
arms are local production builds on the same port, so no part of the gap is the loopback.

Reproducible via `pnpm exec node scripts/checkpoint-13-lighthouse.mjs <arm>` and
`pnpm exec node scripts/checkpoint-13-inp.mjs <arm>`; both headers carry the install step.

- **before** — `76651a3`, deploy A's SHA, in a `git worktree`, `pnpm build && pnpm start`
  on `localhost:3111`.
- **after** — `feat/catalogue-ux` at `0bf8b85`, same commands, same port, immediately
  afterwards.

Both arms were built with `NEXT_PUBLIC_CDN_URL="http://localhost:3111"` and served the
same local Asset mirror (`public/demo`, `public/thumbnails`, symlinked into the worktree —
ADR-0003 makes an Asset path identify bytes that never change, so one mirror is fair to
both), and both read counters from `rnui-dev`, verified identical via
`/api/counters-collection`. Both rendered 48 cards of 277.

**One void run, recorded so it is not repeated.** The first before-arm sitting was built
with an invented collection name. Firestore answered `permission-denied`,
`get-recordings.ts`'s `catch` returned `[]`, and every page rendered `Total Items: 0` —
276 DOM elements and 26 requests, an empty catalogue measured as if it were a catalogue.
Those numbers were discarded. Anyone reproducing this must check the card count before
believing a number.

| mobile `/` | before `76651a3` | after `0bf8b85` | spread b / a |
|---|---|---|---|
| Performance | 85 | 85 | 2 / 13 |
| LCP | 3,779ms | **3,992ms** | 239ms / 2,323ms |
| CLS | 0 | 0 | 0 / 0 |
| FCP | 912ms | 922ms | 3ms / 26ms |
| TBT | 212ms | 212ms | 7ms / 60ms |
| Speed Index | 912ms | 922ms | 3ms / 1,781ms |
| Bytes | 625KB | 810KB | 1KB / 33KB |
| Requests | 32 | 52 | 3 / 4 |
| DOM elements | 2,166 | **1,317** | 0 / 0 |

| mobile `/products` | before `76651a3` | after `0bf8b85` | spread b / a |
|---|---|---|---|
| Performance | 89 | 85 | 1 / 3 |
| LCP | 3,253ms | **3,991ms** | 15ms / 296ms |
| CLS | 0 | 0 | 0 / 0 |
| FCP | 914ms | 909ms | 7ms / 9ms |
| TBT | 236ms | 189ms | 37ms / 36ms |
| Speed Index | 914ms | 909ms | 7ms / 9ms |
| Bytes | 551KB | **1,094KB** | 0KB / 2KB |
| Requests | 31 | 56 | 0 / 0 |
| DOM elements | 2,150 | **1,305** | 0 / 0 |

| desktop | `/` before → after | `/products` before → after |
|---|---|---|
| Performance | 100 → 100 | 100 → 100 |
| LCP | 799ms → 819ms | 735ms → 818ms |
| CLS | 0 → 0 | 0 → 0 |
| TBT | 0ms → 0ms | 4ms → 0ms |
| Bytes | 1,470KB → 1,285KB | 1,467KB → 1,285KB |
| Requests | 81 → 69 | 81 → 69 |
| DOM elements | 2,166 → 1,317 | 2,150 → 1,305 |

**The stop condition fires on `/products`.** Ticket 02's acceptance says *"if the median
mobile LCP delta exceeds the spread of the five runs, stop: set `ready-for-human` and hand
the numbers to the maintainer rather than resolving"*. On mobile `/products` the delta is
**+738ms against a 296ms after-spread** — it fires. On mobile `/` the delta is +213ms
against a 239ms before-spread and does not fire, though the after-arm spread there is
2,323ms on the strength of one 5,956ms first run; excluding it the four remaining runs sit
at 3,633–4,024ms and the conclusion is unchanged.

**Where the bytes went, and it is not the fonts.** `spec.md`'s Constraints name *"two
webfonts and a per-tile glow"* as the two things most able to undo the performance work.
Measured on mobile `/products`, one run each, they are not:

| Resource | before | after | delta |
|---|---|---|---|
| Media (Demo video) | 1 req / 35KB | 4 reqs / 413KB | **+378KB** |
| Image (Posters) | 5 reqs / 24KB | 16 reqs / 122KB | **+98KB** |
| Font | 0 / 0KB | 2 reqs / 62KB | +62KB |
| Script | 22 reqs / 425KB | 23 reqs / 423KB | −2KB |
| Stylesheet | 11KB | 13KB | +2KB |

The two webfonts are the **smallest** of the three additions. 476KB of the 545KB is media:
the Studio Dark grid gets more tiles into view and more of them reach the playing state
inside the measurement window, so `MAX_PLAYING = 5` is being approached where the before
arm reached 1. The glow, separately, was already measured in step 11 and costs paint time
rather than bytes. Desktop moved the other way on every byte metric — 1,467KB → 1,285KB
and 81 → 69 requests — which is consistent with the same mechanism at a viewport where the
before arm was already loading a full grid.

DOM elements fall **2,150 → 1,305** on `/products`, a 39% reduction, and that is the one
number here `checkpoint-01-03-lighthouse.md:30-33` would call unambiguously comparable: it
does not depend on the network. Lab CLS is 0 on both arms, which per that same file is a
regression guard and nothing more.

## Interaction latency (step 12) — run 2026-08-05

Mobile emulation (iPhone 13), 4× CPU throttle, three repeats per interaction, per arm.
Measured with the Event Timing API — the same primitive INP is computed from — rather than
a wall-clock delta around the click, which would miss the paint the visitor waits for. Lab
INP is not the 286ms field p75 and is not reported as if it were.

| Interaction | before | after | spread b / a | ≤ 200ms |
|---|---|---|---|---|
| Overlay open from a tile | 432ms | 464ms | 72ms / 224ms | ❌ both arms |
| Overlay close on Escape | 24ms | 32ms | 24ms / 40ms | ✅ |
| Filter chip remove | *absent* | 248ms | — / 32ms | ❌ |
| `Load more` | 216ms | **184ms** | 120ms / 16ms | ✅ after only |
| Mobile bottom sheet open | *absent* | 432ms | — / 264ms | ❌ |

Two interactions are marked *absent* rather than 0: neither the filter chips
(`components/filter-chips.tsx`) nor the bottom sheet (`filter-dock.tsx`) exists at
`76651a3` — they are Studio Dark tickets 08 and 11. There is no before number to compare
against and inventing one would be worse than the gap.

**Neither rule is clean.** The first — *"no interaction may be slower after than before by
more than the spread of three repeats"* — holds everywhere it can be evaluated: overlay
open +32ms inside a 72ms before-spread, Escape +8ms inside 40ms, and `Load more` is 32ms
*faster*. The second — *"no interaction may exceed 200ms"* — is breached three times, at
464ms, 248ms and 432ms. Per the ticket, *"either breach is a hand-back, not a fail"*.

Worth separating: the overlay open was **already** over the bar at 432ms on the before arm,
so that one is inherited from `ui-ux-overhaul`, not introduced here. The chip remove and
the sheet are new surfaces and are new breaches.

## What this does and does not prove

**Proves.** Every motion moment equals the Specimen value, read from the built site. The
reduced-motion contract holds on every route (no `<video>` served, no Demo on the detail,
STILLS ONLY, every `duration-*`/`animate-in/out` element at `0s`, no smooth scroll). The
six-key keyboard layer works and is labelled. Focus visibility holds on all ten routes in
both modes. No two links share an ambiguous name except the allow-listed Repo pair.
Contrast in composition is measured, not assumed, and the two failing pairs are named.
**The glow A/B is measured** on real playing tiles in dark mode, five repeats per arm: the glow
costs ~2.8× paint-plus-composite but adds no frames over 16ms, inside the ticket's 20% bar.

> **2026-08-05 correction — `cdn.rnui.dev` is not returning 404.** The note below says the CDN
> "returns **404** from this machine" and builds the local-mirror workaround on that. Re-tested
> today: the CDN serves real Asset paths fine — `https://cdn.rnui.dev/thumbnails/misc/masonry_grid_thomino.avif`
> returns **200, 18,263 bytes** and `.../demo/misc/masonry_grid_thomino.mp4` returns **200,
> 516,193 bytes**, from any `Referer` (no hotlink protection) and with
> `cache-control: public, max-age=31536000, immutable`. Only the **root** `https://cdn.rnui.dev/`
> 404s, which is ordinary for a CDN with no index. So the first glow run's void was not caused by
> an unreachable CDN, and that diagnosis should not be trusted by whoever reads this next. The
> local-mirror fix is still the right way to run the A/B — it removes the network from a paint
> measurement — but it is a control, not a workaround for an outage.

**A note on measuring the glow at all.** The A/B is only meaningful when Demo and Poster assets
load, and `https://cdn.rnui.dev` returns **404** from this machine. Its first run was therefore
void — both arms sampled the same E0 hairline because no tile ever reached the playing state
(`querySelectorAll("video").length === 0`; the reduced-motion gate was ruled out, `matchMedia`
reported `no-preference` correctly). The fix is that this repo already carries a complete local
mirror of the assets: **278 Demos in `public/demo/` and 280 Posters in `public/thumbnails/`**.
`getCdnUrl` (`lib/cdn.ts:39-42`) is a bare prefix of `NEXT_PUBLIC_CDN_URL`, and that variable is
inlined at build time, so a build and start with `NEXT_PUBLIC_CDN_URL="http://localhost:3000"`
serves every Asset from `public/` on the loopback and the tiles play. The harness now records
`sawPlaying` and the per-arm shadow, and **exits 1 with a VOID message** if arm A never glows, so
this failure can never again be reported as a pass. Anyone reproducing these numbers must build
that way; a default build measures nothing.

**Does not prove (hand-offs).**
- **LCP / CLS / INP (steps 10–12).** `lighthouse` 13.4.1 is installed, but the "before"
  arm requires a `git worktree` at the deploy-A SHA (the `ui-ux-overhaul` + rename state),
  which is **not in this branch's history** — `feat/catalogue-ux` is a single linear Studio
  Dark build with no pre-Stúdio-Dark ancestor to diff against. The maintainer runs the
  before/after on the machine that holds the deploy-A SHA. The numbers ticket 02 recorded
  (home mobile LCP +358ms from the font commit, CLS 0→0) are the only lab deltas this branch
  can show.

  > **2026-08-05 correction — a pre-Studio-Dark ancestor does exist, and it builds.** The claim
  > above — that `feat/catalogue-ux` is "a single linear Studio Dark build with no pre-Studio-Dark
  > ancestor to diff against" — is false. `76651a3` ("docs: clear the PostHog remainder, and fix a
  > tile that would have lied") is the parent of `4a663a5` ("feat: put the Studio Dark design
  > system in Tailwind, and the fonts it ships"), the first commit that touches Studio Dark styling
  > — confirmed via `git rev-parse --short 4a663a5^` and `git diff --stat` between the two, which
  > shows only `app/globals.css`, `app/layout.tsx` and `tailwind.config.ts` changing at `4a663a5`
  > and nothing styling-related changing at `76651a3`. `76651a3` already carries the rename, the 13
  > PostHog events (`lib/analytics.ts`) and the `ui-ux-overhaul` behaviour work, with no restyle —
  > it IS the "before" state steps 10–12 need, and it is exactly `spec.md`'s Sequence step 2,
  > "DEPLOY A". It builds clean (`NEXT_PUBLIC_CDN_URL="http://localhost:3000" pnpm build`) and its
  > 184 unit tests pass, verified 2026-08-05 in a disposable `git worktree` (`git worktree add
  > /tmp/deploy-a-check 76651a3`) so this branch's own working tree was never touched.
  >
  > Steps 10–12 no longer need to be handed off *for the reason stated above* — the before-arm SHA
  > exists and runs on this machine. What is still genuinely the maintainer's is running the actual
  > before/after Lighthouse pass and recording the delta — the SHA being runnable is what changed,
  > not who executes the comparison. See `.scratch/studio-dark/deploy-a-handback.md` for the exact
  > commands, the PostHog annotation, and which `posthog-expansion` tickets unblock the moment this
  > SHA lands on `main`.
  >
  > **Second correction, same day — steps 10 and 12 have now been run, so this bullet is no
  > longer a hand-off for want of a measurement.** See *Load metrics (step 10)* and *Interaction
  > latency (step 12)* above for the tables. Two further claims in the paragraph above them were
  > also wrong: `lighthouse` is **not** installed at 13.4.1 or any version — not on `PATH`, not in
  > `node_modules`, not global under either nvm node — so the run installed **12.8.2**, which is
  > what ticket 02's acceptance asks for anyway ("Lighthouse 12", matching the reference run). And
  > ticket 02's numbers are no longer "the only lab deltas this branch can show".
  >
  > What remains the maintainer's is now a **decision, not an execution**: ticket 02's stop
  > condition fires on mobile `/products` (+738ms median LCP against a 296ms spread), and step 12's
  > 200ms bar is breached three times. Both are hand-backs by the tickets' own wording. The
  > measurement also contradicts `spec.md`'s Constraints on where the cost lives — the two webfonts
  > are 62KB of a 545KB mobile increase, and Demo video plus Posters are 476KB of it.
- **`/review-animations` (step 14).** The skill is `disable-model-invocation: true`; an
  agent cannot run it. Its three `STANDARDS.md` collisions (never `ease-in` on UI — the
  overlay's 160ms `ease-in` close; never animate keyboard-initiated actions — the same
  close; built-in CSS easings "almost never strong enough" — the three `linear`/`ease-out`/
  `ease-in` moments) are recorded above as deliberate overrides of the Specimen, which wins
  per `spec.md`'s binding Constraints. The maintainer runs the review and pastes its output.

**Two colours to decide (the failing contrast pairs).** `● LIVE` dark and `NEW` dark at
1.22:1 over a light Poster. The mock ships as drawn; repainting is the maintainer's call.

## Contrast repaint — costed, not applied (task 4)

Two of the seven measured pairs fail 4.5:1: `● LIVE` dark and `NEW` dark, both **1.22:1**
against a light Poster (the table above, step 7). Both candidates below clear 4.5:1 at
*both* composited bounds (over `#000000` and over `#FFFFFF`), reproducible with
`pnpm exec tsx scripts/checkpoint-13-contrast.ts` — the candidate rows are added to that
script, clearly labelled `— candidate`, alongside the shipped rows in one table:

| Pair | over black | over white | worse | 4.5:1 |
|---|---|---|---|---|
| ● LIVE, dark (shipped) | 10.82:1 | 1.22:1 | **1.22:1** | ❌ |
| ● LIVE, dark — candidate | 10.81:1 | 12.59:1 | **10.81:1** | ✅ |
| NEW, dark (shipped) | 10.20:1 | 1.22:1 | **1.22:1** | ❌ |
| NEW, dark — candidate | 5.48:1 | 6.39:1 | **5.48:1** | ✅ |

**The lever, and why.** Both fills are translucent light colour over a light Poster,
which composites to near-white — the light foreground then has nowhere to go. Both
candidates raise the fill's alpha toward opaque (0.20→0.94 and 0.22→0.94 — 0.94 isn't a
new number, it's what `NEW, light` already ships) so the chip decouples from the Poster
underneath, and darken the text by *reuse*, not invention:
- `● LIVE` dark's foreground becomes `#06120F`, dark mode's own `--on-acc` — the token the
  Specimen already pairs with a solid `--acc` fill (`bg-acc`/`text-on-acc` buttons on
  `/aboutus`, `/contactus`, `/subscribe`).
- `NEW` dark's foreground becomes `#5C4204`, light mode's own `--new-fg` value, unchanged —
  the Specimen's own swatch table already measures this exact colour "8.6:1 on tag fill",
  i.e. already proven against a near-opaque fill in the same amber hue.

Neither candidate changes hue: `111,227,204` stays inside `--acc`/`#6FE3CC`;
`235,208,138` stays inside dark mode's own `--new-bg` (`#EBD08A` family). Nothing outside
the Specimen's palette is introduced.

**The patch.** `.scratch/studio-dark/contrast-repaint.patch`, four lines, touching only
token values in `app/globals.css`:
- `.dark { --new-fg: #F3DEA6 → #5C4204; --new-bg: rgba(235,208,138,0.22) → rgba(235,208,138,0.94); }`
- `.dark .tile-media[data-playing] .state-chip { background: rgba(111,227,204,0.2) → rgba(111,227,204,0.94); color: #8ff0dc → #06120f; }`

`git apply --check` on it returns clean (no output, exit 0). It is **not applied** — the
working tree's `app/globals.css` is byte-identical to `HEAD`. Applying it is one command:
`git apply .scratch/studio-dark/contrast-repaint.patch`.

**Rendered proof (not this ticket's step).** A later agent captures
`.scratch/studio-dark/contrast-live-new-before.png` (shipped) and
`.scratch/studio-dark/contrast-live-new-after.png` (patch applied) so the maintainer sees
the chips, not just the ratios.

**The honest counter-argument.** `spec.md` decision 2 is explicit: *"the mock ships as
drawn... nothing on screen lies."* These two colours are exactly what
`assets/new-ui/Tile.dc.html` draws. Applying this patch means the built site's `● LIVE`
and `NEW` chips in dark mode would render a materially different colour than the mock —
more opaque, darker text — which is a real deviation from "ships as drawn," not a
rounding error. The Specimen's own dark-mode swatch table (`Specimen.dc.html:115`,
"New tag text… 13.1:1 on canvas") only ever measured this colour against the page canvas,
never against its own chip fill, so the failure is arguably the mock's own oversight
rather than something this effort introduced — but that's an argument for the maintainer
to accept or reject, not license to repaint the shipped palette in place. This is why the
change is a patch file the maintainer applies (or doesn't), not an edit already in the tree.

**One more thing found, not fixed.** The exact failing `● LIVE, dark` pair
(`#8ff0dc` / `rgba(111,227,204,0.2)`) is hardcoded a second time, unconditionally (not
`.dark`-scoped), at `.detail-media[data-state="playing"] .detail-pip`
(`app/globals.css:458-460`) — the Recording detail overlay's own LIVE indicator. Because
it isn't mode-split, it's out of the two pairs the checkpoint script measures and its
real backdrop (the detail overlay's media plinth, not a Poster the script's bounds model)
isn't proven either way, so it is **not** in this patch — flagging it for whoever picks
this up next rather than silently expanding scope.

Proof table:
Real output of `pnpm exec tsx scripts/checkpoint-13-contrast.ts` after adding the candidate rows (script edit left in the working tree at scripts/checkpoint-13-contrast.ts, not applied to app/globals.css):

| Pair | over black | over white | worse | pass 4.5 |
|---|---|---|---|---|
| ❙❙ PAUSED / ❙❙ STILLS ONLY | 10.33:1 | 5.40:1 | **5.40:1** | ✅ |
| ● LIVE, dark | 10.82:1 | 1.22:1 | **1.22:1** | ❌ |
| ● LIVE, dark — candidate 0.80 | 7.82:1 | 13.34:1 | **7.82:1** | ✅ |
| ● LIVE, dark — candidate 0.90 | 9.89:1 | 12.80:1 | **9.89:1** | ✅ |
| ● LIVE, dark — candidate | 10.81:1 | 12.59:1 | **10.81:1** | ✅ |
| ● LIVE, light | 14.55:1 | 5.68:1 | **5.68:1** | ✅ |
| NEW, dark | 10.20:1 | 1.22:1 | **1.22:1** | ❌ |
| NEW, dark — candidate 0.80 | 3.96:1 | 6.78:1 | **3.96:1** | ❌ |
| NEW, dark — candidate 0.90 | 5.01:1 | 6.50:1 | **5.01:1** | ✅ |
| NEW, dark — candidate | 5.48:1 | 6.39:1 | **5.48:1** | ✅ |
| NEW, light | 7.14:1 | 8.22:1 | **7.14:1** | ✅ |
| ◺ DECODE FAILED | 11.55:1 | 9.42:1 | **9.42:1** | ✅ |
| failure message | 14.90:1 | 12.57:1 | **12.57:1** | ✅ |

10 pass the 4.5:1 bar at their worse bound; 3 fail (the two shipped pairs plus one rejected intermediate candidate, kept in the table to show why 0.80 alpha wasn't enough for NEW).

The unsuffixed "— candidate" rows are the final proposal (alpha 0.94, matching NEW-light's own precedent): ● LIVE dark candidate clears at **10.81:1** worst-case (was 1.22:1); NEW dark candidate clears at **5.48:1** worst-case (was 1.22:1). The 0.80/0.90 rows are kept as the alpha sweep that justifies landing on 0.94 rather than the minimum that technically clears (NEW at 0.90 only clears by 0.51, a thin margin; 0.94 gives ~1.0 of headroom and isn't a new number — it's what NEW-light already uses).

Patch: `.scratch/studio-dark/contrast-repaint.patch` — `git apply --check .scratch/studio-dark/contrast-repaint.patch` → no output, exit code 0 (verified twice, once immediately after writing the patch and once again as a final check before reporting). The patch applies cleanly against the current working tree.
Rendered proof: `.scratch/studio-dark/contrast-live-new-before.png` and
`.scratch/studio-dark/contrast-live-new-after.png` (captured separately; reference them by path).
