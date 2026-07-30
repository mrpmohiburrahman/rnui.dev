# 02 — Render 48 Entries, then Load more; strip the grid motion

Status: ready-for-agent

Decisions 6 and 16.

## Problem

Every Entry the Catalogue page is handed is rendered at once. `entry-card-grid.tsx:199-209`
maps the whole of `sortedData` into `<EntryCard>`, and `getEntries()` returns the unfiltered
catalogue when no search param is present (`app/actions/get-entries.ts:12-29`,
`app/page.tsx:12`). The catalogue is 277 Entries — summing `id:` across `data/*.ts` gives 277,
and `tests/data-integrity.test.ts:26-31` enforces that they are 277 distinct ids.

Each card carries a framer-motion node with `layout` and a mount slide. It is **not** in the
grid file, as the brief and `spec.md:44` both say — it is `components/entry-card.tsx:131-137`:

```tsx
<motion.div
  layout
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
```

`entry-card-grid.tsx` imports no motion at all (`entry-card-grid.tsx:1-10`). The `199-209`
citation is stale; the work is the same, the file is different.

Three further things found while reading, all in scope:

- `entry-card-grid.tsx:201` keys cards `` `${index}-${entry.id}` ``. Every key changes when the
  list reorders, so a sort toggle unmounts and remounts all 277 cards and restarts every Demo.
  Removing `layout` without fixing this leaves the expensive half of the sort cost in place.
- `components/catalogue-search.tsx:25` already calls `params.delete("page")`. Nothing anywhere
  reads a `page` param — grepping `app`, `components`, `hooks`, `lib` returns that one line.
  Name the param `page` and the "searching resets pagination" behaviour is already written.
- `entry-card-grid.tsx:183` renders `Total Items: {sortedData?.length}`. That must keep counting
  the whole set, not the rendered slice.

**Two claims I could not confirm.**

1. *"Desktop CLS p75 is 0.549 in the field; the mount animation contributes."* The 0.549 is
   recorded at `spec.md:105` and I have not re-measured it. But the mount animation moves cards
   with `y` — a transform — and CLS by definition excludes transform-driven movement. The same
   applies to `FadeIn` (`components/cult/fade-in.tsx:16-22`). Removing this animation is very
   unlikely to move CLS. It is still worth removing for the reasons in decision 16 and for the
   286ms mobile INP (`spec.md:106`); do not expect a CLS number to change, and do not treat an
   unchanged CLS as this ticket failing.
2. *"11,349 DOM elements and a 34,526px page."* 11,349 is a lab figure at `spec.md:103`; I did
   not reproduce it. The 34,526px page height appears in no file in the repo and I did not
   reproduce it either.

## Work

1. `components/entry-card.tsx` — delete the motion node. Replace the `<motion.div …>` opening tag
   at `131-137` with a plain `<div>` carrying the same `className` and `onClick`, close it as
   `</div>` at `278`, and delete the `framer-motion` import at line 7. Nothing else in the file
   uses motion. This is the whole of decision 16: with no mount animation, appended Entries
   cannot animate, so no extra guard is needed.

2. `components/entry-card-grid.tsx:201` — change the key to `key={entry.id}`. Ids are unique and
   a test enforces it.

3. `components/entry-card-grid.tsx` — paginate, inside this file. The grid already receives the
   full sorted set and already renders the footer area, so no new prop and no change to
   `catalogue-page.tsx` is needed.
   - `const PAGE_SIZE = 48` at module scope.
   - Read `useSearchParams()` from `next/navigation`; `const page = Math.max(1, Number(searchParams.get("page")) || 1)`.
   - Map over `sortedData?.slice(0, page * PAGE_SIZE)` at `199`.
   - Leave `183` reading `sortedData?.length`.

4. Load more control — render it directly below the grid `<div>` that closes at
   `entry-card-grid.tsx:210`, only when `sortedData.length > page * PAGE_SIZE`. Reuse the pill
   `className` string already present verbatim at `entry-card-grid.tsx:172` so no new colour,
   radius or shadow value enters the codebase. Label: `Load more`. On click:

   ```tsx
   const params = new URLSearchParams(window.location.search)
   params.set("page", String(page + 1))
   window.history.pushState(null, "", `?${params}`)
   ```

   Native `pushState` rather than `router.push`: App Router picks it up through
   `useSearchParams`, it costs no server render and no Firestore read, it does not scroll, and
   Back pops to the previous count. `router.push` would re-run the server component and refetch
   the whole catalogue on every click.

5. `app/bookmarks/page.tsx` is a statically rendered `"use client"` page, so adding
   `useSearchParams` beneath it may fail the production build with the missing-suspense-boundary
   error. If `pnpm build` reports it, wrap `<CataloguePage>` at `app/bookmarks/page.tsx:48` in a
   `<Suspense>` exactly as `app/layout.tsx:56-58` already does for `NavSidebar`. The home and
   `/products` routes await `searchParams` and are already dynamic, so they are unaffected.

6. Add `tests/e2e/pagination.spec.ts` — one Playwright file, following the shape of
   `tests/e2e/home.spec.ts` including its PostHog `route` abort. Assert: `/` renders 48 cards;
   clicking `Load more` gives 96 and the URL carries `?page=2`; going Back gives 48 again;
   cold-loading `/?page=2` renders 96.

## Acceptance

- `grep -n framer-motion components/entry-card.tsx` returns nothing.
- `grep -rn "layout$\|initial={{" components/entry-card.tsx` returns nothing.
- `/` renders exactly 48 cards on first paint; `/?page=2` cold-renders 96; `/?page=99` renders
  277 and shows no Load more control.
- Clicking `Load more` changes the URL to `?page=2` with no document request in the network
  panel, and does not move the scroll position.
- Browser Back after one Load more returns the grid to 48 cards.
- `/` still displays `Total Items: 277` with one page rendered.
- Starting a Demo, then toggling the sort control, leaves that `<video>` element's `currentTime`
  greater than 0 — the cards were reordered, not remounted.
- `pnpm build`, `pnpm test` and `pnpm exec playwright test` all pass.
- A screenshot of `/` before and after differs only by the Load more control and by the absence
  of the cards past the 48th. No colour, spacing, type or card treatment changes.

## Open questions

- The Load more control is new pixels on a frozen page. Decision 6 requires it, so it cannot be
  avoided; step 4 keeps it to the existing pill treatment. Its placement (centred vs left) and
  whether it should state the remaining count are not decided here — take the plainest option
  and raise it with the maintainer if it reads badly.
- Whether `page` should survive a sort change. Currently sort is component state
  (`hooks/use-sorted-data.ts:8`) and does not touch the URL; the sort-into-the-URL fix listed at
  `spec.md:92` is a different ticket. Until that lands, changing sort keeps the current `page`,
  which is the do-nothing behaviour.

## Depends on

nothing
