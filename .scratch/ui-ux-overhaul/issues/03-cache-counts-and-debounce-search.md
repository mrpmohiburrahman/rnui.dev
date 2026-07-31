# 03 — Cache the counts, debounce the search, server-render the timestamp

Status: resolved
Blocked by: 04

## Problem

Three costs on the same critical path. Two of the three claims handed to this ticket
needed correcting; the corrections are below, marked.

**(a) One whole-collection Firestore read per request, uncached.**
`data/entry.ts:64` calls `counters.readCounts()` → `lib/counters.ts:97` → `lib/counters-firestore.ts:40`,
which is `getDocs(collection(db, COLLECTION_NAME))` — every document, no limit, no cache.
`app/actions/get-entries.ts:48` calls it on every render of `/` and `/products`.

- *Correction*: the `getDocs` is not in `data/entry.ts`. It moved to `lib/counters-firestore.ts:40`.
  The claim holds; the file does not.
- *Correction*: "no caching" is not quite right. `app/actions/get-entries.ts:12` wraps `getEntries`
  in React `cache()`. That dedupes within one render pass and nothing survives the request.
- *Correction*: "so neither route can be prerendered" is false as stated. Both routes are indeed
  not prerendered — `.next/prerender-manifest.json` lists `/aboutus`, `/bookmarks`, `/feedback`,
  `/subscribe`… and neither `/` nor `/products`. But the cause is `searchParams`
  (`app/page.tsx:9`, `app/products/page.tsx:27`), a dynamic API. `/bookmarks` also renders a
  Catalogue page and *is* prerendered. Caching the counts removes a Firestore round trip from
  every request; it will not make either route prerender.

**(b) One server render per keystroke.**
`components/catalogue-search.tsx:31-33` calls `handleSearch` straight from `onChange`, and
`handleSearch` calls `router.replace` (line 27). Typing `buttons` is 7 navigations, 7 whole-collection
reads and 7 re-renders of all 277 Entries.

- *The PostHog claim, measured rather than repeated.* 90 days: URLs carrying `search=` took 414
  pageviews and 14 rage-clicks (33.8 per 1,000); every other URL took 5,116 pageviews and 60
  rage-clicks (11.7 per 1,000). The rate is 2.9× — real, but n=14 across 7 people. "Rage-clicks
  cluster on search-result URLs" overstates the volume. The rate difference is the finding.

**(c) A placeholder string wider than the value that replaces it.**
`components/last-updated.tsx:42` renders the literal `Loading last updated date...` until an effect
(lines 10-24) swaps in `Updated: <strong>4 hours ago</strong>`. The slot is a fixed-padding button,
`components/entry-card-grid.tsx:169-176`, in a flex row — nothing reserves the width.

- *Correction to the diagnosis, not the defect.* This never reaches a first paint from the server.
  `components/catalogue-page.tsx:66-68` returns `<div />` until both Remembered sets load from
  localStorage, so the whole grid — `LastUpdated` included — appears client-side, then shifts one
  render later. Reserving width is therefore not the fix, and adding a `min-width` would be a
  visual change (constraint 1). Deleting the placeholder is the fix.

**(d) The input never reads the URL.** Verified against the file: `components/catalogue-search.tsx:4`
imports `usePathname` and `useRouter` and nothing else from `next/navigation` — the repo's only two
`useSearchParams` callers are `components/nav/nav-side-bar.tsx:33` and `lib/posthog-page-view.tsx:10`.
The text lives entirely inside the child, which cannot be told what it should be:
`components/ui/placeholders-and-vanish-input.tsx:49` starts at `useState("")`, line 203 renders
`value={value}`, and the props (lines 8-16) accept no incoming value. Writes go one way only,
keystroke → URL.

Two routes reach the same broken state — a filtered grid above an empty box:

- A shared or bookmarked `/?search=slider`. `/` prints the term nowhere else (`app/page.tsx:12` passes
  it to `getEntries` and stops), so the visitor cannot see what filtered the grid and cannot clear it
  either — clearing means deleting text that is not there.
- Enter, with no link involved. `handleKeyDown:153-157` and the form's implicit submission both reach
  `vanishAndSubmit:159-171`; the particle loop ends at `:145` with `setValue("")`. The text is erased,
  `onSubmit` is `() => {}` (`catalogue-search.tsx:40`), and the URL keeps `search=slider`.

`spec.md:90` lists this under "Treated as fixes, not decisions" — "Search gets an accessible name, a
debounce, and reflects the URL". The name is ticket 07 step 4, the debounce is step 3 below, and the
third half had no ticket at all. It becomes step 6.

## Work

1. **Cache the counts.** In `app/actions/get-entries.ts`, add a module-level, *non-exported* wrapper:

   ```ts
   import { unstable_cache } from "next/cache"

   const readCatalogue = unstable_cache(getEntriesWithCounts, ["entries-with-counts"], {
     revalidate: 300,
   })
   ```

   Replace `await getEntriesWithCounts()` at line 48 with `await readCatalogue()`. Keep the
   `cache()` at line 12. Non-exported is required: a `"use server"` file may export only async
   functions — the rule `app/actions/increment-view-count.ts:6-8` already records.

2. **Do not put the wrapper in `data/entry.ts`.** That module is in the client graph:
   `components/catalogue-search.tsx:5` imports `getUniqueCategories` from it at module scope, and
   `data/catalogue.ts` ships in a client chunk as a result (`.next/static/chunks/606cd420d9066b44.js`,
   130KB, contains the literal `Arc Sliders`). Importing `next/cache` there would break the bundle.

3. **Debounce.** In `components/catalogue-search.tsx`, leave `handleSearch` alone; make
   `handleInputChange` schedule it. A `useRef` timer, `clearTimeout` on each keystroke, 300ms, and a
   cleanup effect that clears on unmount. No new dependency — this is six lines.

4. **Replace `components/last-updated.tsx` entirely.** Delete the state, the effect, the try/catch
   and the `renderLastUpdatedMessage` branch. What is left is the render:
   `<p suppressHydrationWarning>Updated: <strong>{format(new Date(data.lastCommitDate))}</strong></p>`.
   Keep the default export (`components/entry-card-grid.tsx:10` imports it). `suppressHydrationWarning`
   covers the one case where the server and the client land either side of a `timeago` bucket
   boundary. Do not add a width to the slot.

5. **Not threading the two values, and why.**
   - *Maximum view count*: no consumer. `view_count` is read at `components/entry-card.tsx:52` and
     `hooks/use-sorted-data.ts:18` and nowhere else; `spec.md` and ADR-0007 never mention a maximum.
     Adding it now would be a value with no reader. Raise it again with the ticket that needs it.
   - *Total Entry count*: already correct. `components/entry-card-grid.tsx:183` renders
     `sortedData?.length`, which is the total until something slices it. Record the constraint on the
     "Load more" ticket (decision 6) — that ticket must pass the pre-slice length — and change
     nothing here.

6. **Reflect the URL in the input.** Three small edits, no new state and no new dependency.

   - `components/ui/placeholders-and-vanish-input.tsx`: add `defaultValue?: string` to the props
     (lines 8-16) and seed from it — line 49 becomes `useState(defaultValue ?? "")`. The child keeps
     owning the text, so step 3's debounce and the existing callers are untouched.
   - `components/catalogue-search.tsx`: add `useSearchParams` to the line 4 import and pass
     `defaultValue={searchParams.get("search") ?? ""}` at line 38. No `Suspense` wrapper: `app/page.tsx:22`
     is this component's only render, and `/` is already dynamic (`app/page.tsx:10-11` awaits
     `searchParams`; `/` is absent from `.next/prerender-manifest.json`, which lists `/aboutus`,
     `/bookmarks`, `/contactus`…), so there is no static render to deopt.
     `lib/posthog-page-view.tsx:28-36` needs its boundary because it sits in the root layout
     (`lib/posthog-provider.tsx:28`, `app/layout.tsx:40`) and so reaches those prerendered routes.
   - Stop Enter erasing the query: drop the `vanishAndSubmit()` call from `handleKeyDown:153-157` and
     from `handleSubmit:173-177`, keeping `e.preventDefault()` and `onSubmit(e)`. Leave `onSubmit` the
     no-op it is at `catalogue-search.tsx:40` — the debounce has already pushed the term or fires
     300ms later, so Enter has nothing left to do. Removing motion that deletes the visitor's own
     input is a repair under decision 14, and the still frame is unchanged: the canvas is `opacity-0`
     whenever `animating` is false (`:189`).

   **Back to a previous search.** Nothing further is needed today, and the reason is worth reading
   before anyone adds an effect: line 27 is `router.replace`, so the box's own edits create no history
   entries. The only way Back reaches an earlier search is a navigation away and back, which unmounts
   `CatalogueSearch` with the page and remounts it, re-running the `useState` initialiser against the
   restored URL. Add a resync when — and only when — that stops holding: line 27 becomes
   `router.push`, or a same-route link starts changing `search` while the box stays mounted (ticket
   02's `page` push does not). Its shape, for whoever gets there: a `useRef` holding the last term this
   component pushed, and when `searchParams.get("search")` differs from it, remount the child with an
   incrementing `key`. Not a bare `useEffect(() => setValue(url))` inside the child — across the 300ms
   debounce plus the RSC round trip the visitor is still typing, and a late URL echo overwrites the
   newer characters. And the key must be a counter, not the term: under `push`, typing `abc` and then
   going back to no search leaves both the old key and the new one `""` while the child still shows
   `abc`.

## Acceptance

- `grep -n getEntriesWithCounts app/actions/get-entries.ts` returns exactly one line, inside the
  `unstable_cache` call.
- Temporarily add `console.count("readAll")` to `lib/counters-firestore.ts:39`, run `next dev`, request
  `/products?search=a`, `?search=ab`, `?search=abc` in sequence. The count reaches 1, not 3. Remove
  the instrument.
- A Playwright spec in `tests/e2e/` types `buttons` into the search with ≤50ms between keystrokes and
  records exactly one request whose URL contains `_rsc=`. Use the request-recording pattern in
  `tests/e2e/server-actions.ts`.
- `grep -c "Loading last updated date" components/last-updated.tsx` returns 0, and the file is ≤ 12 lines.
- `getBoundingClientRect().width` of the `Updated: …` button is the same at first paint and 2s later.
- Screenshots of `/` and `/products` at rest, at 1440×900 and 390×844, are identical before and after.
  That bullet covers both pages with no params; `/?search=…` deliberately differs, because a box that
  was blank now carries text.
- `/?search=slider` cold: the box reads `slider`. Select all, Delete — the URL loses `search` and the
  full grid returns.
- Type `slider`, wait for the debounce, press Enter: the box still reads `slider` and the URL still
  carries `search=slider`. Today the box empties and the URL does not.
- From `/`, type a term, click a Category in the sidebar, then Back: the box matches whatever
  `?search=` the URL bar shows, empty included.
- `grep -n useSearchParams components/catalogue-search.tsx` returns exactly one line.
- `pnpm test` and `pnpm check-types` pass.

## Open questions

- `revalidate: 300` is chosen, not agreed. Counts are already optimistic client-side
  (`components/entry-card.tsx:63`), so a voter never sees their own click go stale. The maintainer
  should confirm the window.
- 130KB of catalogue reaches the browser so that `components/catalogue-search.tsx:9` can derive 18
  Category names. Out of scope here; it wants its own ticket.
- Dropping `vanishAndSubmit` in step 6 leaves the particle machinery with no caller — `newDataRef`,
  `draw`, `animate`, the `animating` flag and the `<canvas>` (`:46-47`, `:50`, `:52-151`, `:186-192`),
  roughly 110 lines. Deleting it is tidy-up, not behaviour, and no ticket owns it — nor the 3-second
  placeholder cycle in the same file (`:20-24`, `:34-44`) that `spec.md:48` marks for removal. One
  follow-up ticket should take both. Step 6 does not need either deletion to land.
- **`/products` still has no search box, and fixing that is not this ticket.** Verified today:
  `app/products/page.tsx:27-29` reads `search` and passes it to `getEntries`, and `app/page.tsx:22` is
  the only render of `CatalogueSearch` anywhere. `/products` is not silent about the filter — `:36-63`
  draws a `Search` icon, the word `search` (`:54`) and the term as a `GradientHeading` (`:60-62`) — but
  that is read-only, so the visitor sees the filter and cannot change or clear it. Adding the box puts
  a new visible control on the most-visited page (`spec.md:108`, 3,554 views), which decision 1
  freezes; that makes it a maintainer decision rather than a fix, so it belongs to its own ticket, not
  here. Ticket 11 raises the stakes: once its facet links carry `search` through, `/` → Category lands
  on `/products?category=…&search=…` with no way to edit the term.

## Depends on

Nothing. Note that step 4's *server-render* half is blocked by `components/catalogue-page.tsx:66-68`
(the blank-until-hydration guard, `spec.md:96-97`, a separate ticket) — until that guard goes, the
grid produces no server HTML at all. The placeholder deletion lands regardless.

Ticket 07 step 4 edits `components/ui/placeholders-and-vanish-input.tsx:193`; step 6 above edits lines
8-16, 49, 153-157 and 173-177 of the same file. No overlap — either order lands.

## Comments

Implemented as written, with three departures, all recorded below.

**What landed**

1. `app/actions/get-entries.ts` — `readEntriesWithCounts`, a module-level non-exported
   `unstable_cache(getEntriesWithCounts, ["entries-with-counts"], { revalidate: 300 })`.
   The React `cache()` stays. Named for what it returns rather than the ticket's
   `readCatalogue`: CONTEXT.md reserves "Catalogue page" for the client module and gives
   no "Catalogue" noun for a set of Entries (ADR-0004).
2. `components/catalogue-search.tsx` — a `useRef` timer, cleared on each keystroke and on
   unmount, 300ms. `handleSearch` untouched, including its read of `window.location.search`
   rather than the new `useSearchParams` value: it runs 300ms late, so the live URL is the
   correct source. Commented at the read site.
3. `components/last-updated.tsx` — state, effect, try/catch and the branch deleted.
4. `components/ui/placeholders-and-vanish-input.tsx` — `defaultValue` prop seeding
   `useState`; `vanishAndSubmit` gone from Enter and submit.
5. `components/catalogue-search.tsx` — `defaultValue={searchParams.get("search") ?? ""}`,
   no `Suspense` wrapper, and `/` still builds as `ƒ`.

**Departure 1 — the particle machinery is deleted now, not in a follow-up.** The Open
question above sized it at ~110 dead lines and deferred it. Deferring was wrong: `draw()`
was wired to `useEffect(..., [value, draw])`, so every keystroke resized an 800×800 canvas,
read it back with `getImageData` and walked 640,000 pixels — for a canvas that, with
`animating` never set, could no longer become visible. That is the per-keystroke cost
problem (b) exists to remove, so it went with the rest. `canvasRef`, `newDataRef`,
`inputRef`, `animating`, `draw` and `animate` are gone; the 3-second placeholder cycle
(`spec.md:48`) is untouched and still wants its own ticket.

**Departure 2 — `suppressHydrationWarning` sits on the `<strong>`, not the `<p>`.** React
applies it one level deep and the text that can cross a `timeago` bucket boundary is the
`<strong>`'s own child, so the ticket's markup would not have suppressed the case it was
added for. The file is 16 lines rather than the ≤12 the acceptance asks for; the extra
lines are that fix.

**Departure 3 — no automated guard for the pill width.** Every shape tried (a `commit`
navigation, held-back `_next/static/chunks`) still measured after the swap and so passed
against the unfixed tree. A test that cannot fail is worse than none. Verified manually
instead — see below. `tests/e2e/last-updated.spec.ts` asserts the served HTML instead,
which does fail on `827955c`.

**Acceptance, checked**

- `grep -n getEntriesWithCounts app/actions/get-entries.ts` returns **2** lines, not 1: the
  import and the `unstable_cache` call. One call site, which is what the bullet means; the
  import cannot be spelled away without an `import * as`. Amend the bullet, not the code.
  Same for `grep -n useSearchParams components/catalogue-search.tsx` — the import and the
  hook call.
- `console.count("readAll")` in `lib/counters-firestore.ts`, `next dev`, three sequential
  requests for `/products?search=a|ab|abc` → `readAll: 1`. Instrument removed.
- `tests/e2e/search.spec.ts` types `buttons` 10ms apart and counts RSC navigations carrying
  `search=`. Verified in both directions: 1 with the debounce, **7** without it. It waits
  for a quiet period rather than a fixed delay, per `tests/e2e/server-actions.ts:38-43`.
  It counts `_rsc=` **and** `search=`, narrower than the bullet's `_rsc=`, because the
  router prefetches sidebar links on its own schedule.
- `grep -c "Loading last updated date" components/last-updated.tsx` → 0.
- Appearance: `/` and `/products` at 1440×900 and 390×844, screenshotted from a production
  build before and after and compared pixel by pixel. The only differing region on any of
  the four is the Updated pill, and the cause is the clock — "30 minutes ago" against "31
  minutes ago" between the two runs. Both desktop pairs matched exactly on a later run.
  Deleting the `<canvas>` changed nothing: it was `absolute`, `pointer-events-none` and
  `opacity-0` unless `animating`.
- `/?search=slider` cold shows `slider`; select-all + Delete drops the param and returns
  48 cards. Enter leaves box and URL alone. Back after a Category click restores the term.
  All four are `tests/e2e/search.spec.ts`, and all four fail on `827955c`.
- `pnpm test` 159 pass, `pnpm check-types` clean, `pnpm build` clean, 33 Playwright specs
  pass — including the pre-existing "hydrates without React disagreeing with the server".

**Still open, unchanged:** `revalidate: 300` wants the maintainer's confirmation; the 130KB
of catalogue in the client bundle wants its own ticket; the 3-second placeholder cycle
wants one too; `/products` still has no search box.
