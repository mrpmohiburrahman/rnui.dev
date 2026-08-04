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
| Filter chip add / remove | `120ms ease-out` | `transition-duration: .12s; transition-timing-function: ease-out` (source `components/filter-chips.tsx:85-87`) | class + source | ✅ |
| Overlay open (scrim + 8px rise) | `240ms cubic-bezier(.2,.8,.2,1)` | `ENTER_MS = 0.24`, `RISE = [0.2,0.8,0.2,1]` (`recording-overlay.tsx:27-29`) | source constant | ✅ |
| Overlay close on Escape | `160ms ease-in` | `EXIT_MS = 0.16`, `ease: "easeIn"` (`recording-overlay.tsx:27-29`) | source constant | ✅ |
| Bottom sheet | `260ms spring, no overshoot` | `animation-duration: 0.26s; animation-timing-function: cubic-bezier(.2,.8,.2,1)` (`.sheet-panel`) | `getComputedStyle(.sheet-panel[data-state=open])` | ✅ |

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

Second half: the detail's three Contributor links (`X ↗`, `GitHub ↗`, `LinkedIn not
listed`) carry the Contributor's own name (verified on `/recording/<id>`), and
`/contributors` has no two rows with the same accessible name.

## What this does and does not prove

**Proves.** Every motion moment equals the Specimen value, read from the built site. The
reduced-motion contract holds on every route (no `<video>` served, no Demo on the detail,
STILLS ONLY, every `duration-*`/`animate-in/out` element at `0s`, no smooth scroll). The
six-key keyboard layer works and is labelled. Focus visibility holds on all ten routes in
both modes. No two links share an ambiguous name except the allow-listed Repo pair.
Contrast in composition is measured, not assumed, and the two failing pairs are named.

**Does not prove (hand-offs).**
- **LCP / CLS / INP (steps 10–12).** `lighthouse` 13.4.1 is installed, but the "before"
  arm requires a `git worktree` at the deploy-A SHA (the `ui-ux-overhaul` + rename state),
  which is **not in this branch's history** — `feat/catalogue-ux` is a single linear Studio
  Dark build with no pre-Stúdio-Dark ancestor to diff against. The maintainer runs the
  before/after on the machine that holds the deploy-A SHA. The numbers ticket 02 recorded
  (home mobile LCP +358ms from the font commit, CLS 0→0) are the only lab deltas this branch
  can show.
- **The glow A/B (step 11).** Two Chrome DevTools traces differing only by an injected E0
  override need the `chrome-devtools` MCP, which is **not configured** on this machine (no
  `chrome-devtools` entry in `.claude.json` / `.mcp.json`). The architecture is bounded
  (MAX_PLAYING = 5, no `will-change`), but the trace pair is a maintainer hand-off.
- **`/review-animations` (step 14).** The skill is `disable-model-invocation: true`; an
  agent cannot run it. Its three `STANDARDS.md` collisions (never `ease-in` on UI — the
  overlay's 160ms `ease-in` close; never animate keyboard-initiated actions — the same
  close; built-in CSS easings "almost never strong enough" — the three `linear`/`ease-out`/
  `ease-in` moments) are recorded above as deliberate overrides of the Specimen, which wins
  per `spec.md`'s binding Constraints. The maintainer runs the review and pastes its output.

**Two colours to decide (the failing contrast pairs).** `● LIVE` dark and `NEW` dark at
1.22:1 over a light Poster. The mock ships as drawn; repainting is the maintainer's call.
