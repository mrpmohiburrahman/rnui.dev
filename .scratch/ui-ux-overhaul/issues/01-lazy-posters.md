# 01 — Load Posters lazily

Status: resolved

## Problem

Every Poster in the catalogue is fetched the moment the grid mounts, on every route that
renders a Catalogue page.

The gate meant to prevent that is dead. `components/interactive-video.tsx:46` destructures
`isInView` and never reads it — the identifier occurs exactly once in the file. The Poster is
applied unconditionally as a CSS `background-image` at `components/interactive-video.tsx:168`,
so every card asks for its Asset as soon as it renders.

The hook is not at fault. `hooks/use-intersection-observer.ts` latches correctly: `unobserve`
at :37-39 plus the early return at :28 make `freezeOnceVisible: true` do what it says.
`components/interactive-video.tsx` is its only consumer in the repo.

ESLint has always known, and has never failed a build over it — `no-unused-vars` is `warn`
(`eslint.config.mjs:34`), so `pnpm lint` exits 0:

```
components/interactive-video.tsx
  40:10  warning  'isHovered' is assigned a value but never used
  46:24  warning  'isInView' is assigned a value but never used
```

`isHovered` is the same defect a second time: `setIsHovered` fires from `onMouseEnter` /
`onMouseLeave` (:125-126) and nothing reads the value, so hovering a card re-renders it for
nothing.

**Four claims from the audit did not survive checking.** Corrections, all re-derived here:

- **277 Posters, not 278.** 277 unique `posterPath` values across `data/*.ts`, all `.avif`.
  (The 279 raw occurrences include the field declaration at `data/entry.ts:28` and the
  reference at `data/catalogue.ts:64`.)
- **~3.9 MB of offscreen waste, not 582 KB.** I fetched all 277 Poster URLs from
  `https://cdn.rnui.dev`: 277 × HTTP 200, **3,959,347 bytes total, 14.0 KB mean**. About ten
  cards are on screen at first paint, so almost all of it is offscreen. That is most of the
  4.5 MB page weight recorded in `spec.md:103`.
- **Not "before first paint".** `components/catalogue-page.tsx:66-68` returns `<div />` until
  both Remembered sets have been read from `localStorage` in an effect, so the server HTML
  contains no cards and no Posters at all. The requests are issued when the grid mounts after
  hydration — *at* first contentful paint, competing with LCP, not ahead of it. Lighthouse's
  232 (`spec.md:103`) stands as recorded; I could not reproduce it and the code path yields 277.
- **Intrinsic size is not the problem here.** The Poster's box is already reserved —
  `aspect-[9/16]` on the wrapper at `components/entry-card.tsx:173`, `h-full` in the modal at
  `components/card-modal.tsx:35-37`. This ticket therefore claims **no** CLS win; the 0.549
  belongs to decision 16.

## Work

Stop hand-rolling the gate and let the browser do it. That also deletes a file.

1. In `components/interactive-video.tsx`, replace the poster button's inline `backgroundImage`
   (:167-171) with a lazily-loaded `<img>`. `object-cover` plus its default
   `object-position: 50% 50%` reproduces `backgroundSize: "cover"` + `backgroundPosition:
   "center"` exactly, so the painted pixels are unchanged:

   ```tsx
   <button
     type="button"
     className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer focus:outline-none"
     onClick={handlePlayClick}
     aria-label="Play video"
   >
     {/* Posters are already AVIF at crf 30 (scripts/generate-posters.ts:57-60); next/image
         would re-encode optimal bytes through an extra hop. */}
     {/* eslint-disable-next-line @next/next/no-img-element */}
     <img
       src={posterImage}
       alt=""
       loading="lazy"
       decoding="async"
       className="absolute inset-0 w-full h-full object-cover"
     />
     <div className="relative bg-opacity-50 p-2 rounded-full bg-gray-100 dark:bg-gray-300">
       <PlayIcon aria-hidden="true" />
       <span className="sr-only">Play</span>
     </div>
   </button>
   ```

   `relative` on the icon wrapper is load-bearing — without it the absolutely-positioned
   `<img>` paints over the play icon. `alt=""` is correct: the button already carries the
   accessible name. Keep `bg-black`, so a Poster that ever 404s leaves the same black box it
   leaves today. `@next/next/no-img-element` is warn-level here (verified against a probe
   file), so the disable comment is for the reader, not for the exit code.

2. Delete the `useIntersectionObserver` import and call (`components/interactive-video.tsx:7`,
   :45-49), then delete `hooks/use-intersection-observer.ts`. It has no other consumer.

3. Delete `isHovered` / `setIsHovered` and the `onMouseEnter` / `onMouseLeave` handlers
   (:40, :125-126).

4. Add the Playwright test in Acceptance as `tests/e2e/poster-loading.spec.ts`, following the
   PostHog-abort `beforeEach` in `tests/e2e/home.spec.ts:7-9`.

Note for whoever takes decision 3 (autoplay once in view): deleting the hook does not leave
that ticket short. `freezeOnceVisible: true` latches permanently, and autoplay needs
bidirectional in-view state owned by the thing that grants the five concurrent slots
(ADR-0007, "Consequences", last bullet) — a different shape, written where the slots live.

## Acceptance

- `pnpm lint` reports zero warnings for `components/interactive-video.tsx`. It reports two today.
- `hooks/use-intersection-observer.ts` no longer exists, and grepping `useIntersectionObserver`
  across the repo returns nothing.
- This test passes:

  ```ts
  test("only Posters near the viewport are fetched", async ({ page }) => {
    const posters = new Set<string>()
    page.on("request", (r) => {
      if (r.url().includes("/thumbnails/")) posters.add(r.url())
    })
    await page.goto("/")
    await page.getByRole("button", { name: "Play video" }).first().waitFor()
    await page.waitForLoadState("networkidle")

    expect(posters.size).toBeGreaterThan(0) // Posters still load
    expect(posters.size).toBeLessThan(60) // 277 today

    // …and the rest arrive on demand rather than never.
    const nearTop = posters.size
    await page.getByRole("button", { name: "Play video" }).last().scrollIntoViewIfNeeded()
    await expect.poll(() => posters.size).toBeGreaterThan(nearTop)
  })
  ```

- On a 1280×720 Desktop Chrome run, the first card's Poster `<img>` reports computed
  `object-fit: cover` and `object-position: 50% 50%`, and a bounding box equal to its parent
  button's — the same rect the background painted into.
- `pnpm test` and `pnpm build` pass.

## Open question

Below the fold, a card that has not reached Chrome's lazy threshold paints as the black box
`bg-black` already gives it, where today it paints the Poster. A viewport screenshot is
therefore identical before and after, but a **full-page** screenshot is not. Flagged rather
than decided: if the maintainer reads the frozen-appearance rule as covering full-page
captures, this ticket cannot be done at all, since not fetching an image is the entire change.

## Depends on

Nothing.

## Comments

**Resolved 2026-07-30.**

Done as written. The poster button's inline `backgroundImage` became a lazily-loaded `<img>`
with `object-cover`; `hooks/use-intersection-observer.ts` is deleted along with its import and
call; `isHovered` / `setIsHovered` and the two mouse handlers are gone, and with them the
container ref, which had no other reader.

Acceptance, each item:

- `npx eslint components/interactive-video.tsx` → "No issues found". It reported two warnings
  before.
- The hook file is gone. `useIntersectionObserver` survives in no `.ts`/`.tsx` file — the only
  remaining hits are ticket prose in this directory. Ticket 09 already describes the hook as
  deleted; **ticket 10:50 did not, and was corrected as part of this ticket** — it told a future
  session the hook was there to inherit.
- Both Playwright tests pass, added as `tests/e2e/poster-loading.spec.ts`.
- `pnpm check-types`, `pnpm test` (159), `pnpm build`, and the full e2e suite (9/9) all pass.

**One deviation from the acceptance snippet.** The rect assertion reads both boxes inside a
single `evaluate` rather than through two `boundingBox()` calls. Two separate calls straddle the
per-card mount animation that decision 16 removes, and disagreed on `y` by 4.5px — a fact about
that animation, not about whether the `<img>` covers its button. Same claim, measured in one
frame.

**The Open question is answered: shipped.** Decision 1 freezes the look "as it renders in the
browser today", read here as the viewport. A full-page capture below the lazy threshold now
paints the `bg-black` box instead of the Poster. The reading is forced — not fetching the image
*is* the change, so the alternative reading makes the ticket impossible, and it was written
`ready-for-agent` regardless. Flagging rather than burying it: if the maintainer wants the other
reading, this ticket reverts and the ~3.9MB stays.

**Risk left open for the checkpoint after 01, 02 and 03.** `loading="lazy"` is on every Poster
including whichever one is the LCP candidate, and lazy is the documented wrong attribute for an
LCP image. Acceptance counts requests and never measures LCP, so it cannot catch this. The fix,
if the Lighthouse re-run shows LCP flat or worse, is `loading="eager"` plus
`fetchpriority="high"` on the first row — which needs a card index plumbed from the grid through
`entry-card`, so it was not built on speculation. Ticket 02 caps the first render at 48 entries
and changes this picture anyway; measure after both, not now.

Not fixed, noted: an `<img>` is drag-and-droppable and long-press-saveable where a
background-image was inert. Inherent to the approach the ticket prescribes.
