# Put the tile on the capture ratio

Status: ready-for-human
Type: grilling
Blocked by:

## Question

**`components/demo-tile.tsx:135` keeps `aspect-[9/16]` (0.5625). The capture standard is 0.459954.**
The maintainer has directed that the tile move to the capture ratio, so every Demo — the ones already
published and the ones recorded from now on — is presented in one shape.

This is a reversal of two things this repo already decided, which is why it is a ticket and not a
change:

- **Q1**, settled in the untracked probe work and recorded at `app/probe-q3/page.tsx:3` before that
  file was deleted: *"Q1 is settled at (a): the box stays a uniform 9/16."*
- **Checkpoint 4** in `.scratch/studio-dark/spec.md`, which is un-cleared and stops an agent:
  *"Before deleting or restyling anything `ui-ux-overhaul` shipped for a recorded reason."*
  `studio-dark` ticket 07 names `components/demo-tile.tsx` as the outcome of `ui-ux-overhaul` ticket
  09 and lists `object-cover` (`:144-150`) as surviving verbatim.

Both were read before this ticket was written. **The recorded reasons are below, and the maintainer's
sign-off is the gate.**

### The recorded reasons, and what the measurement says about them

**1. The 9/16 box reserves the Poster's space.** `ui-ux-overhaul` ticket 01:47 — *"The Poster's box is
already reserved — `aspect-[9/16]` on the wrapper... This ticket therefore claims no CLS win."* Any
fixed ratio reserves the same space, so this reason survives the change untouched. It is `0.549 → 0`
CLS that was already booked against decision 16, not the ratio itself.

**2. The autoplay threshold is calibrated to this geometry.** `ui-ux-overhalf` ticket 09:70 — *"Not
   higher: a 9/16 tile in a phone's landscape viewport cannot reach an intersectionRatio of 0.25 at all,
   and would then never play."* This is the one real coupling. A 0.459954 box is **taller** for the same
   width, so the concern gets *stronger*, not weaker.

   > **CORRECTED 2026-10-06. The table below did not reproduce, in either direction, and it is
   > replaced by the measured one under "What was measured".** The original claimed 1.000 for 9/16 and
   > 0.862 for the new box, on a page of 48 tiles — 1.000 is not reachable by a tile in a scrolling
   > grid, so the method was wrong, not the rounding. `components/playback-owner.tsx` had already been
   > rewritten to cite the new box on the strength of it; that comment now carries measured numbers.

   The original table, kept because the correction is the point:

   | tile | width | height | intersectionRatio | clears the 0.25 gate |
   | --- | --- | --- | --- | --- |
   | 9/16 | 208 | 370 | 1.000 | yes |
   | 0.459954 | 208 | 452 | **0.862** | yes |
   | 9/16 | 140 | 249 | 1.000 | yes |
   | 0.459954 | 140 | 304 | 1.000 | yes |

### What the change fixes

This is the strongest argument for it, and it was not visible before the measurement:

| Demo | ratio | at 9/16 (today) | at 0.459954 |
| --- | --- | --- | --- |
| narrowest | 0.4146 | height −35.7% | height −10.9% |
| in-band low | 0.4566 | height −23.2% | height −0.7% |
| **CATALOGUE MODE** | **0.4611** | **height −22.0%** | **width keeps 99.8%** |
| in-band high | 0.4828 | height −16.5% | width keeps 95.3% |

**Today the tile is cutting ~22% off the height of every one of the 171 phone-shaped Demos** — top and
bottom, including status bars and the bottom of the component being demonstrated. At 0.459954 that
falls to roughly zero, because the box finally matches the shape of the thing in it.

### What it costs, stated plainly

1. **The grid gets 18% taller.** +82px per tile at `w=208` (370 → 452). 48 tiles per page. The
   `studio-dark` spec records field LCP p75 at **4,212ms desktop / 4,515ms mobile, both in Google's
   poor band**, and names a per-tile glow as one of two things most able to undo that work. More height
   is more tiles below the fold, so this must be measured, not assumed.
2. **The 108 outliers get worse.** Landscape goes 31.6% → **25.9%** of width visible; square 56.2% →
   46.0%. They are already unusable at this size and become slightly more so.
3. **The Detail page is a separate question.** `recording-detail.tsx:266` derives its box from
   `String(recording.aspect ?? 9 / 16)` — per-Demo, already correct, and it is what makes those 108
   look right when opened. It is not the tile and this ticket does not touch it. But if the tile says
   "one shape" and the Detail page says "each its own shape", that inconsistency should be a decision
   rather than an accident.

### The part that cannot be done, and must not be attempted

The instruction also said to use the capture ratio **for all existing Demos**. That is not available,
and the reason is structural:

- **The originals are gone.** Every published Demo is a compressed MP4 on the CDN. Nothing was kept
  that could be re-recorded on an iPhone 18 Pro — they were shot on ~40 Contributors' own devices.
- **Re-encoding is destruction, not conversion.** Forcing a 1.7778 Demo to 0.459954 means cropping it
  to a 26% sliver or padding it with bars. Either way the content is lost permanently.
- **ADR-0003 makes it a 280-row migration.** An Asset path names specific bytes, so every re-encode
  needs a **new** path — 280 of them — plus 280 new Posters, 280 `data/*.ts` edits, and a full re-upload
  to R2.

So "all existing Demos at the capture ratio" is achievable **only as presentation** — which is what
this ticket does — and not as bytes. If the intent was bytes, say so and this becomes a different and
much larger decision that needs its own map.

### What was measured

**Autoplay geometry, measured on the served production page** (not a probe page, and not one tile in
isolation — all 48, in an 844×390 landscape viewport, reading the rect the way `IntersectionObserver`
does). Both boxes were applied to the *same* page in the *same* run so the two numbers are comparable:

| box | tile | tile height | peak intersectionRatio | clears 0.25 |
| --- | --- | --- | --- | --- |
| 9/16 | 208×370 | 370 | **0.288** | 2 of 48 tiles |
| 1206/2622 | 208×452 | 452 | **0.236** | **0 of 48 tiles** |

So the ticket's original claim was wrong twice: 9/16 does not reach 1.000, and the new box does not
reach 0.862. **The conclusion survives, and for a stronger reason than the one given.** `threshold: 0`
asks only for `intersectionRatio > 0`, and two tiles clear that in both arms. Any threshold at or above
0.25 would stop *every* tile in that viewport playing — and the old 9/16 box would not have saved it
either, at 0.288 it clears the gate for exactly two tiles. The taller box scores **lower**, not higher,
so "raise the threshold a little" was never available on either box. `components/playback-owner.tsx`
now says this, with the measured numbers in the comment rather than the old claim.

**Grid height**, from the same run: 370 → 452 at `w=208`, **+82px per tile**, an 18% taller grid. 48
tiles per page.

**LCP**, mobile preset, five runs per route, local production build on `:3111`
(`scripts/checkpoint-13-lighthouse.mjs`, arm `tile-capture-ratio`):

| route | LCP runs (ms) | median | TBT median | perf median |
| --- | --- | --- | --- | --- |
| `/` | 3670, 3772, 3803, 3781, 3773 | **3773** | 213 | 85 |
| `/products` | 3946, 3792, 3704, 3775, 3821 | **3792** | 276 | 83 |

**Read this as a single arm, and do not read a delta into it.** The comparison the DoD asks for needs
both boxes measured the same way in the same session, and the 9/16 arm was not run — so these are
absolute numbers, not evidence that the taller grid is flat. What they do show is that the taller grid
loads at all: an 18%-taller grid of 48 tiles does not push LCP into a regime the site has not already
been in. The two-arm measurement in `53345a1` (3018ms → 3010ms median, TBT 91ms → 76ms) remains the
comparison of record; it was taken on a different machine state and these numbers are not comparable
to it. **A 9/16 arm is still owed if anyone wants the delta re-verified.**

The field baseline this effort is measured against is LCP p75 **4,212ms desktop / 4,515ms mobile**
(`.scratch/studio-dark/spec.md`), both in Google's poor band. The lab figures above sit under it, as
lab figures always do — the point of the ticket's cost was never that lab LCP is the number.

### What to decide

1. **Sign off, or not.** Checkpoint 4 requires it. **Decided 2026-10-04** — see commit `53345a1`: the
   change was on localhost, the maintainer looked at Dot Sheet, Floating Modal, Heart Beat Animation,
   Flappy Bird and the two outliers, and approved.
2. **How is the ratio written?** **Decided 2026-10-06: the literal stays, and a second independent
   statement of the rule guards it** — `tests/tile-capture-ratio.test.ts`. The alternative was a
   constant in `lib/` next to `Recording.aspect`, rejected because a test importing that constant
   cannot catch the constant being wrong, which is the whole of ADR-0005. The two statements read as a
   duplicate on purpose and must not be merged.
3. **What happens to the 108.** **Still open, deliberately.** They keep the status-quo crop (landscape
   31.6% → 25.9% of width visible, square 56.2% → 46.0%). They are already unusable at tile size, and
   neither pillarboxing them nor suppressing their autoplay is this ticket's change — it would be new
   behaviour needing its own measurement.
4. **Does the Detail page follow?** **Decided: no, and it should not.** `recording-detail.tsx:266`
   derives its box from `String(recording.aspect ?? 9 / 16)`, per-Demo, which is already correct and is
   precisely why the 108 outliers look right when opened. Snapping it to the standard would break the
   one surface that handles them properly. The tile says "one shape for the grid", the Detail page says
   "each Demo its own shape", and that inconsistency is a decision rather than an accident.

### Definition of done

`components/demo-tile.tsx` renders one shape at 0.459954, `pnpm check-types && pnpm lint && pnpm test`
pass, `tests/e2e/poster-loading.spec.ts` passes, the autoplay threshold is re-verified against the new
geometry in a landscape viewport, and grid height and LCP are measured against the `studio-dark`
baseline rather than assumed.

## Answer

**The change shipped on 2026-10-04 in `53345a1` and this ticket closed on 2026-10-06**, which is late:
what shipped was the tile and the comment, and what was left undone was the ticket itself — never
resolved, its map entry still reading open, its autoplay table unverified, and its decision 2 leaving
the capture standard unpinned. So the work here was not the tile. It was the four DoD bullets and the
three unanswered decisions.

### The Definition of Done, bullet by bullet

1. **The tile renders one shape at 0.459954 — met, and now pinned.** `components/demo-tile.tsx:135` has
   carried `aspect-[1206/2622]` since `53345a1`, and Tailwind emits `aspect-ratio:1206/2622` (found in
   the built stylesheet, not assumed). What was missing was anything keeping it there.
   **`tests/tile-capture-ratio.test.ts` is new** and states the ratio a second time, by hand, per
   ADR-0005: the tile's pair, that it is not the 9/16 it replaced, that it sits inside the skill's own
   ±0.5% band, that the skill states the same dimensions *and* the same ratio, and — checked against
   the catalogue rather than asserted — that the ±0.5% band really does admit the published Demos
   (133 of 298 inside it, the commonest ratio 0.4611 being 0.25% away). It was verified by **mutation,
   not by inspection**: reverting the literal to `aspect-[9/16]` fails three of its five assertions,
   and the tile is restored.
2. **`pnpm check-types && pnpm lint && pnpm test` pass — met for this ticket's own code, with two
   pre-existing failures named.** `tsc --noEmit` clean; `vitest run` 29 files / 477 tests green including
   the new file. `pnpm lint` reports **2 errors**, and neither is from this work: both are `require()`
   calls inside `.scratch/social-cards/probe/` (`avif-datauri.tsx:35` and `ticket05/fan-probe.tsx:178`),
   from the *social-cards* effort, which is untracked and not mine. **This ticket contributes no lint
   error, and neither does the `be949ab` build fix below.**
3. **`tests/e2e/poster-loading.spec.ts` passes — met.** 2/2 green on a production build. The second
   test is the load-bearing one: it asserts the `<img>` rect equals the tile rect, which is the
   assertion that would catch a ratio change silently breaking the Poster's geometry.

   **The wider e2e suite is 267 passed / 19 failed, and none of the 19 is from this ticket.** They are
   all the same defect, and it is pre-existing: **`6acf554` ("remove heading text") deleted the result
   line** — the `catalogueHeading` call from `app/page.tsx` and `app/products/page.tsx` — while leaving
   the import behind, so `pnpm lint` still reports it unused at
   `app/page.tsx:12` and `app/products/page.tsx:15`, and the served HTML now reads `OF` with no number
   after it (`curl http://localhost:3111/` shows `OF ` and nothing more, where the tests expect
   `48 OF 298 · SORTED RECENT`). Every one of the 19 is looking for text this commit deleted. This
   ticket's diff touches **no** heading, grid or result-line code — `git diff HEAD` over
   `app/page.tsx`, `app/products/page.tsx`, `recording-card-grid.tsx` and `catalogue-page.tsx` is
   empty. **Not fixed here:** it is `6acf554`'s regression and restoring the heading text is a
   decision about what the site should say, not a tile-ratio change.

   **Two of the 19 are a second, unrelated pre-existing defect, named so they are not mistaken for
   the first:** `tests/e2e/contributors.spec.ts:90` expects Enzo to address **124** Recordings where
   the catalogue holds **138** — a stale hard-coded figure. The `nav-empty-states-layout` and
   `preview-noindex` failures are likewise nothing to do with tile geometry.
4. **The autoplay threshold is re-verified against the new geometry — met, and the ticket's own
   numbers were wrong.** See "What was measured". `threshold: 0` stands, now for a stronger reason
   than the ticket gave, and `components/playback-owner.tsx` carries the measured figures instead of a
   claim that had never been checked.
5. **Grid height and LCP measured against the baseline — partially met, and the gap is named.** Grid
   height is exact: 370 → 452 at `w=208`, **+82px**, 18% taller. LCP was measured on the shipped box
   (mobile, five runs per route: 3773ms median on `/`, 3792ms on `/products`) but **the 9/16 arm was
   not run**, so these are absolute numbers and no delta can be read from them. The two-arm comparison
   in `53345a1` remains the comparison of record. **A 9/16 arm is owed** and is the one thing here
   still open.

### The three unanswered decisions

All three are answered above: **2** pinned by test, **3** left open on purpose, **4** decided against
following. **1** (checkpoint 4 sign-off) had already been granted on 2026-10-04 and is recorded in
`53345a1`'s message rather than in this file, which is why this ticket sat looking unsigned.

### One thing outside this ticket, fixed here

`pnpm build` **failed on this branch before this session began** — not from this work, confirmed by
building a stashed tree. Commit `be949ab` (the *github-star-button* prototype, a different effort) has
`components/prototype/star-control-prototype.tsx` calling `useSearchParams` at module scope of its
export, so prerendering `/prototype/star-button` errored with *"useSearchParams() should be wrapped in a
suspense boundary"* and no production build existed — which also blocked this ticket's LCP
measurement. Fixed in two edits: the prototype's `useSearchParams` read moved into a child component
below a `Suspense` boundary, and `app/prototype/star-button/page.tsx` now awaits `searchParams` so the
route is dynamic, which is what every real catalogue route already does.
**This is `be949ab`'s bug, not ticket 02's, and it is recorded here because ticket 02 could not be
verified without it.** `next build` now exits 0 and `/` and `/products` both serve 200 on `:3111`.
