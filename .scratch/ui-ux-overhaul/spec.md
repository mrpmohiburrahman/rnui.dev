# UI/UX overhaul — decision record

Decisions taken with the maintainer, 2026-07-30. Nothing here is implemented yet.

## The shape of the work

A full visual redesign was explored and **rejected**. Five art directions were briefed;
one (Studio Dark) was generated and audited. The maintainer prefers the existing design.

The generated material is kept for reference, not for building:
`assets/new-ui/` (the Studio Dark mock) and `.scratch/design-overhaul/`
(the briefs for all five directions).

**The site keeps looking exactly as it renders today.** Effort goes into behaviour and speed.

## Decisions

| # | Decision | Consequence |
|---|---|---|
| 1 | The look is frozen as it renders in the browser today | No restyling. Colour, spacing, type, card treatment untouched |
| 2 | Haskoy is deleted, not fixed | The font never loads today (`@font-face` emits `fontSans`, Tailwind asks `"Haskoy"`, `tailwind.config.ts:25`). The site renders in system-ui and will keep doing so. 172KB removed |
| 3 | Playback: poster first, muted autoplay once in view, ≤5 concurrent | Replaces click-to-play. Reduced-motion falls back to stills |
| 4 | The card headline is the component name; the contributor becomes a byline | Only which string is bold changes. Also removes the 30-character truncation that cuts `Enzo Manuel Mangano ( Reactiive )` short at 33 |
| 5 | An entry gets a real URL, opening as an overlay from the grid and as a page cold | 277 shareable, indexable entries. Back button works |
| 6 | 48 entries, then "Load more", URL-synced | Not infinite scroll. Replaces rendering all 277 |
| 7 | A view counts autoplay, guarded: ≈2s played, once per entry per browser session | Plus opening an entry and clicking through to the repo. Votes remain the interest signal; views become reach |
| 8 | Existing view counts carry forward; the definition change gets an ADR | No reset. Rankings drift rather than snap |
| 9 | First visit follows the device's light/dark setting | Both modes already exist; this only picks the starting one. **Correction:** described earlier as fixing a "light flash" for dark-device visitors. There is no flash — next-themes only consults `matchMedia` when the resolved name is literally `"system"`, and `app/layout.tsx:45` sets `defaultTheme="light"` (with `"system"` commented out at `:44`), so a dark-device visitor gets light as a steady state. Worse than a flash, not better |
| 10 | Mobile filters: fix the drawer that already exists | Its trigger stops scrolling away, contributors are added, all 18 categories become reachable |
| 11 | Delete: the dead admin nav, the fake tag/label filters, `/feedback` | Evidence for `/feedback`: zero pageviews in 90 days |
| 12 | Session replay stays on, and PostHog use expands | Separate effort — see `.scratch/posthog-expansion/` |
| 13 | `/` and `/products` both stay; the nav gains a link to the full catalogue | `/products` carries twice the traffic and is the redirect target for 18 legacy category URLs. Merging would route the busiest page through a redirect for no user gain. Today nothing in the nav points at it |
| 14 | Motion is in scope; static appearance is not | A frozen screenshot is identical before and after. How things move can be repaired and retimed. No motion is added for its own sake |
| 15 | The poster-to-video swap cross-fades over ~150ms | Posters are the frame **2 seconds in** (`scripts/generate-posters.ts:47-48`) while playback starts at 0, so every autoplaying tile jumps backwards. The fade hides a defect rather than decorating. Reduced motion holds the still and never plays |
| 16 | Cards appended by "Load more" do not animate, and the existing per-card mount animation is removed | Today every card slides up 10px on mount, firing for all 277 at once. **Correction:** this was recorded as feeding the 0.549 desktop CLS. It almost certainly does not — the animation moves cards with `y`, a transform, and CLS excludes transform-driven movement. Removing it is still right (277 mounting animations at once), but an unchanged CLS is not a failure |
| 17 | The Source link gets a different colour in each mode | It fails 4.5:1 on all 277 cards today. The arithmetic is closed: no single colour clears the threshold against both `#fafafa` and `#262626`, so any fix is a per-mode split. A visible change, accepted because the defect is the most widespread on the site |
| 18 | Empty states are written for no-results and for empty Saved | Adds UI where there is currently none rather than altering approved pixels. Copy must say saved Entries live in this browser on this device |
| 19 | The save control is visible at rest | Today `opacity-10` and `pointer-events-none` until hover, so it is inert on touch and invisible-but-activatable by keyboard. Changes all 277 cards at rest; accepted as a broken control rather than a restyle |
| 20 | Clicking an active filter clears it | New behaviour, no pixels changed. Today clicking the active Category does nothing |
| 21 | Profile links get real accessible names | Zero visual change. Today all three are labelled generically, so one page announces "GitHub Profile" up to 124 times with no way to tell whose |

## Motion

Scope set by decision 14: a still screenshot is unchanged; how things move may be repaired.

**Removed**

- The per-card mount slide (decision 16).
- `motion.div` `layout` on every card — a layout-projection pass over 277 animated elements on every
  sort toggle, for a reorder that is rare. **Correction:** this lives at `components/entry-card.tsx:131-137`,
  not in `entry-card-grid.tsx`, which imports no motion at all.
- The `<FadeIn>` server-rendered `opacity: 0` (`components/cult/fade-in.tsx`) — the page currently
  arrives invisible and only appears after hydration.
- The 3-second placeholder cycle in the search input, which runs unconditionally.

**Kept and repaired**

- The poster-to-video cross-fade (decision 15) — the only new motion in the whole effort, and it
  exists to hide a defect.
- The overlay open and close.

**Reduced motion**

Honoured in exactly one component today (`components/cult/fade-in.tsx:11`), with no
`prefers-reduced-motion` block in `app/globals.css`. Every surviving animation must respect it,
and under it no video is ever mounted — tiles hold their still frame.

**Deferred to a motion brief**

The overlay's open and close — duration, easing, transform-origin, whether it grows from the card
that opened it, and what happens when it is interrupted mid-flight. Rather than settle this by
guesswork, run `/motion-brief` on it once the animations.dev skills are installed; that skill is
built to ask exactly these questions and returns a written brief.

**Skills in use** (from animations.dev, installed by the maintainer)

`motion-brief` before building each animated moment · `animation-accessibility` for the
reduced-motion and autoplaying-video rules · `animation-performance` against the 286ms mobile INP ·
`review-animations` as a merge gate · `css-animations` where framer-motion is doing work CSS could
do more cheaply.

Out of scope by decision 14, since no motion is being added: `find-animation-opportunities`,
`prototype`, `animate`.

**Licensing** — these skills are paid course material and this repo is public. They must not be
committed. Install globally, or install into the project and add the path to `.gitignore` first.

## Treated as fixes, not decisions

Not put to the maintainer because there is no defensible alternative:

- Filters compose instead of replacing each other. The server action already intersects
  category, author and search (`app/actions/get-entries.ts:60-72`); only the links discard
  existing params (`components/nav/catalogue-nav.tsx:48`).
- Search gets an accessible name, a debounce, and reflects the URL. Today every keystroke is
  a `router.replace` → server render → whole-collection Firestore read → 277-card re-render.
- Sort moves into the URL. It is component state today, so changing a filter silently resets it.
- Cards become keyboard-reachable, focus states become visible, the overlay gets a focus trap
  and Escape.
- Posters load lazily. The gate exists but is dead code — `isInView` is destructured at
  `components/interactive-video.tsx:46` and never read.
- Late-arriving text reserves its width, and the blank-until-hydration guard
  (`components/catalogue-page.tsx:66-68`) is removed.
- The two layout bugs are fixed: cards clipping at `sm`, and the 19px nav overlap.

## Measured baseline

Lab, Lighthouse 12 against production: performance 52 mobile / 55 desktop, LCP 7.7s mobile,
CLS 0.511 desktop, 4.5MB, 11,349 DOM elements, 232 posters fetched before first paint.

Field, PostHog, 90 days, p75, corroborating the lab: desktop LCP 4,212ms / CLS 0.549;
mobile LCP 4,515ms / INP 286ms / FCP 5,904ms. Every device is in Google's "poor" LCP band.

`/products` is the most-visited page — 3,554 views to `/`'s 1,826.

## Corrections to this document

Found by the ticket authors reading the real code. The claims above are corrected in place;
these are the ones worth knowing about because they change what the work is:

- **Offscreen Poster waste is ~3.9MB, not 582KB.** All 277 measured from `cdn.rnui.dev`:
  3,959,347 bytes, 14.0KB mean — most of the recorded 4.5MB page weight.
- **Posters are not fetched before first paint.** The blank guard at `catalogue-page.tsx:66-68`
  means the served HTML has no cards, so the requests fire at FCP after hydration. Lighthouse's
  count of 232 could not be reproduced; the code path yields 277.
- **The counts are not uncached.** `app/actions/get-entries.ts:12` wraps `getEntries` in React
  `cache()` — per-render dedupe, nothing survives the request. And caching will not make `/` or
  `/products` prerender: the cause is `searchParams`, not the Firestore read. `/bookmarks` renders
  a Catalogue page and is already prerendered.
- **The whole-collection `getDocs` is in `lib/counters-firestore.ts:40`,** not `data/entry.ts`.
- **`admin-nav.tsx` does have an importer** — `nav-side-bar.tsx:16`, rendered at `:56` and `:123`.
  Still dead, but deleting it also means four conditionals in `nav-side-bar.tsx`.
- **`/feedback` is byte-identical to `/contactus`.** `diff` reports no difference.
- **Radix Dialog is already in use** at `components/ui/sheet.tsx:4`, so ticket 08 adds no bundle weight.
- **8 captions are duplicated, not 7** — 9 if a slug lowercases (`Add to cart` / `Add To Cart`).
- **The author truncation cuts two names, not one:** `Enzo Manuel Mangano ( Reactiive )` (33 chars,
  124 Entries) and `Arnaud Dellinger ( evening kid )` (32 chars, 2).
- **The Poster frame is set at `scripts/generate-posters.ts:47-48`,** not `:45`.
- **The rage-click clustering was overstated.** 14 events across 7 people on `search=` URLs against
  60 across the rest — 2.9× the rate, but a small absolute number.
- Minor: the server intersects filters at `get-entries.ts:54-72`; sort state is `use-sorted-data.ts:8`.

## Checkpoints

Points where an implementing session stops and hands back, rather than taking the next ticket.
Everywhere else, keep going.

- **After 01, 02 and 03 are all `resolved`** — re-run Lighthouse against a production build and
  compare to the measured baseline above. These three carry most of the expected win; if the
  numbers have not moved, the rest of the plan is built on a wrong diagnosis and should be
  re-examined before more of it lands.
- **After 08 is `resolved`** — the overlay needs looking at on a 1440px viewport before 07 and 09
  build on it. The motion brief flags one open risk: `scale(0.98)` on a `max-w-3xl` panel is about
  15px of growth, which may read as too much. The fix if so is `0.99`, or dropping the scale.
- **Before any of this deploys** — `.scratch/posthog-expansion/issues/09` steps 2 to 4. The
  pre-change baseline is already frozen in that file, but the dashboard and the agreed success
  criteria have to exist before the boundary, not after it.

## Open

- Ticket 09's Poster-lazying overlaps ticket 01's. Being resolved so 09 builds on 01 rather than
  redoing it.
- `spec.md` and `05-delete-dead-weight.md` disagree by one on the pageview figures (3,554/1,826 vs
  3,555/1,825) — a rolling window. The load-bearing fact is the ~2:1 ratio.

## Not doing

- No accounts. Bookmarks and votes stay in the visitor's own browser, and no copy will imply
  otherwise.
- No proxying of PostHog. `lib/posthog-provider.tsx:18` records why: a previous `/ingest`
  reverse proxy got rnui.dev categorised as Malware.
