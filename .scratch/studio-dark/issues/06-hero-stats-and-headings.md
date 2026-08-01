# 06 — The hero, the stats row and the headings

Status: ready-for-agent
Blocked by: 01, 02, 04

Decision 6 and decision 10 (`.scratch/studio-dark/spec.md:117,121`). The surface is
`assets/new-ui/Catalogue.dc.html:61-88` — the `showHero` block and the heading row directly
under it.

Every path and line number below is the tree as it stands today. Ticket 01 renames these
modules and their identifiers; the edits land on whatever it leaves in their place, and this
ticket is written in the vocabulary that rename produces — Recording, Contributor,
`?contributor=`.

## Problem

### The hero on `/` belongs to a different site

`components/hero.tsx:1-19` is a centred column with a required `title` prop. Two routes pass
two unrelated strings into it: `app/page.tsx:19` passes `"Awesome React Native UI"` and
`app/bookmarks/page.tsx:48` passes `"Bookmarks"`. It is a title holder, not a hero — it says
nothing about what the site is, and the `title` prop's own comment
(`components/hero.tsx:6-9`) records that its previous default read `"360 car seats review"`,
which is how long it went unexamined.

Nothing on `/` states the size of the catalogue. The only number on the page is
`Total Items: 277`, inside a pill in the sort row at `components/entry-card-grid.tsx:254-256`.
There is no statement anywhere of how many Contributors or how many Categories there are; the
rail lists both without counting either.

Counted over `data/*.ts` just now: **277** Recordings, **24** distinct Contributors, **18**
distinct Categories. Those are exactly the three numbers the mock draws
(`assets/new-ui/Catalogue.dc.html:68-70`), so the stats row needs no new data source and no
Firestore read — it does not touch what ADR-0007 calls a view, and `lib/counters-firestore.ts`
keeps owning the counts it owns.

**The mock's other numbers are illustrative and must not be quoted.** `Catalogue.dc.html:178`
draws `['Buttons',14]` against 20 Recordings in `data/buttons.ts`, and `:179` draws
`['Thomino',19]` against 7. Only `['Misc',148]` and the three totals survive contact with the
data. Every figure this ticket renders is derived; none is written down.

### `/products` has no `h1`, and its heading lies when two filters are on

`app/products/page.tsx:48-50` renders the active filter through `GradientHeading size="xxl"`,
which defaults to an `h3` (`components/cult/gradient-heading.tsx:55`) styled
`text-5xl sm:text-6xl lg:text-[6rem]` (`:27`) — 96px of text in the wrong element, on a page
with no `h1` and no `h2` above it.

The eyebrow above it is worse. `app/products/page.tsx:44-46` is
`{search && "search"}{category && "category"}{author && "Author"}` — three concatenated
literals, so `/products?category=Buttons&contributor=Thomino` renders the eyebrow
`categoryAuthor` and, from `:49`'s `{search || category || author}`, the heading `Buttons`.
The Contributor filter is applied by `app/actions/get-entries.ts:58-62` and is invisible on
screen. The three icons at `:36-42` carry `fill-yellow-300/30 stroke-yellow-500`, a colour
pair that exists nowhere in either palette.

### There is no result line

`Catalogue.dc.html:85-88` pairs every heading with a right-aligned mono count. Today the only
count is that `Total Items: 277` pill, which reports the whole filtered set and never how many
tiles are rendered. `PAGE_SIZE` is 48 (`components/entry-card-grid.tsx:15`), so on a first
visit the page shows 48 tiles under a label saying 277 and says nothing about the other 229.

### The flag decision 10 asks for does not exist

`CataloguePage` takes a `children` slot (`components/catalogue-page.tsx:38-39`) and each route
puts whatever it likes in it — `/` a hero and a newsletter panel in a six-column grid
(`app/page.tsx:16-29`), `/products` the eyebrow block (`:32-52`), `/bookmarks` a hero
(`:46-50`). Three routes, three layouts, nothing shared.

Note that decision 10 says "the two catalogue routes", but `CONTEXT.md:27-34` names **three**
routes that render a Catalogue page, and `app/bookmarks/page.tsx:48` uses the same `Hero`
component `/` does. The flag therefore splits three routes: `/` gets the hero, `/products` and
`/bookmarks` do not.

### The counts cannot be computed in the client

`components/catalogue-search.tsx:54-57` records that the last value import of `@/data/*` from
any client component was deleted, so `data/catalogue.ts` is no longer pulled into a client
chunk. `CataloguePage` is `"use client"` (`components/catalogue-page.tsx:11`), so re-importing
`allRecordings` there to count it would undo that — against the constraint at
`spec.md:147-150` that the performance work is not spent. The three numbers arrive as props
from a server component, exactly as `app/layout.tsx:23-24,74` already hands
`getUniqueCategories()` and `getUniqueContributors()` into the client sidebar.

## Work

1. **`lib/catalogue-heading.ts`** — new, no React import, two pure functions. It lives in
   `lib/` for the reason `app/actions/get-entries.ts:41-44` gives for `matchesSearchTerm`:
   a rule inside a `"use server"` action or a client component is a rule nothing can test.

   `catalogueHeading({ category, contributor, total })` returns the section head:

   | condition | string | source |
   |---|---|---|
   | `total === 0` | `No matches` | mock, `Catalogue.dc.html:210` |
   | Category and Contributor both set | `` `${category}, by one contributor` `` | mock, `:210` (`Misc, by one contributor`) |
   | Category only | the Category display name, e.g. `Buttons` | derived |
   | Contributor only | the Contributor's name verbatim | derived |
   | neither | `Recent` | mock, `:210` |

   A search term never enters the heading. The mock's `filtered` variant has a search chip on
   (`:80`) and its heading is still `Misc, by one contributor`; the term lives in the chip and
   in the filter count.

   `catalogueResultLine({ shown, catalogueTotal, filterCount, sort, savedView, loading,
   reducedMotion })` returns the mono line:

   - `loading` → `` `RESERVING SPACE FOR ${shown}` `` — mock `RESERVING SPACE FOR 48`
     (`:215`). This branch wins over every other: nothing has been counted yet, so `shown` here
     is the number of skeleton tiles the grid reserves, `PAGE_SIZE` on a first visit. The
     skeleton those words describe is ticket 08's; only the string is this ticket's.
   - `savedView` → `` `${shown} SAVED · THIS BROWSER` `` — mock `3 SAVED · THIS BROWSER` and
     `0 SAVED · THIS BROWSER` (`:215`).
   - `filterCount > 0` → `` `${shown} OF ${catalogueTotal} · ${filterCount} FILTER${s}` `` —
     mock `2 OF 277 · 3 FILTERS` and `0 OF 277 · 3 FILTERS` (`:214`). The singular `1 FILTER`
     is derived; the mock only ever draws three at once.
   - `reducedMotion` → `` `${shown} OF ${catalogueTotal} · STILLS ONLY` `` — mock
     `48 OF 277 · STILLS ONLY` (`:216`). It replaces the sort tail below and nothing else: the
     saved and filtered forms keep their own tails, and the mock draws its reduced variant
     unfiltered. Ticket 13 owns the media query that sources the flag; the string is here,
     beside the other forms, because one function owns this line.
   - otherwise → `` `${shown} OF ${catalogueTotal} · SORTED ${label}` `` where `label` is
     `RECENT`, `MOST VIEWED` or `MOST VOTED`, the three strings the mock's own sort control
     uses (`:25-27`). Mock draws `48 OF 277 · SORTED RECENT` and `277 OF 277 · SORTED RECENT`.

   `shown` is the number of tiles actually rendered and `catalogueTotal` is always 277, the
   whole catalogue — not the filtered set. That one rule reproduces all four values the mock
   draws: page 1 unfiltered `min(48, 277) = 48`, the last page `min(288, 277) = 277`, the
   filtered variant `min(48, 2) = 2`, the zero variant `0`.

2. **`components/hero.tsx`** — rewrite in place. Drop `title` and `children`; the copy is
   fixed. Props are the three counts. Markup transcribed from `Catalogue.dc.html:62-72`:

   - Row: `display:flex; align-items:flex-end; justify-content:space-between; gap:24px;
     padding-bottom:20px`. Left column `max-width:640px`.
   - `<h1>`: `font-size:29px; font-weight:500; line-height:1.15; letter-spacing:-0.02em;
     color:{t1}; text-wrap:pretty; margin:0`, reading
     `A dark room full of React&nbsp;Native interfaces, playing quietly.` Keep the `&nbsp;` —
     the mock puts it between React and Native so the product name never breaks across lines.
     `t1` is `#F1F2F4` dark / `#14161A` light. The Specimen names this row of the type scale
     `29 / 500 / -2% · hero` (`assets/new-ui/Specimen.dc.html:139`).
   - `<p>`: `margin:9px 0 0; font-size:13px; line-height:1.5; color:{t2}; max-width:520px`,
     reading `Every entry is a silent screen recording of a real phone, and a link to the repo
     that made it.` `t2` is `#B2B8C2` dark / `#4F545C` light. Ship the string as drawn — see
     Open questions.
   - Stats row: `display:flex; gap:22px; font-family:'JetBrains Mono'; font-size:10px;
     color:{t3}; text-align:right`, `t3` `#8E949F` dark / `#666B74` light. Each of the three
     is a number `font-size:19px; color:{t1}; font-variant-numeric:tabular-nums` over a label.
     The labels are `RECORDINGS`, `CONTRIBUTORS`, `CATEGORIES`, in that order. **No
     letter-spacing on this block** — the mock declares none here, unlike its 9px labels which
     carry `0.14em` — so do not reach for the label tracking out of habit.

   Both palettes come from ticket 02's tokens. Do not spell a hex in this file.

   Decision 6: there is no light variant of this copy. The Specimen calls light mode
   `LIGHT — THE SAME ROOM, LIGHTS ON` (`Specimen.dc.html:135`), so the room metaphor survives
   the lights and only the token values change.

3. **`components/entry-card-grid.tsx`** — four new props and the heading row.

   Add `hero?: ReactNode`, `heading: string`, `catalogueTotal?: number` and
   `bookmarkedOnly: boolean` to `RecordingCardGridProps` (`:35-56`). Render `hero` as the first
   child of the root div at `:117`, **above** the `treatment` wrapper at `:121-130`, so it
   never lands inside the framed panel — the mock draws no panel around the hero.

   Render the heading row immediately above the grid panel at `:259`, from
   `Catalogue.dc.html:85-88`: a flex row `align-items:baseline;
   justify-content:space-between; gap:16px; padding-bottom:14px`, holding the heading at
   `font-size:17px; font-weight:500; letter-spacing:-0.01em; color:{t1}; margin:0`
   (`headSize: 17`, `Catalogue.dc.html:251`; the Specimen calls it
   `17 / 500 · section head`, `Specimen.dc.html:140`) and the result line at
   `font-family:'JetBrains Mono'; font-size:10px; letter-spacing:0.1em; color:{t3};
   min-width:180px; text-align:right; font-variant-numeric:tabular-nums`.

   `min-width:180px` and `tabular-nums` are not decoration and must not be dropped. The
   composite states the reason at `assets/new-ui/rnui Studio Dark.dc.html:26`: "the result
   count already occupy their exact reserved widths as tabular monospace, so nothing reflows
   when the real numbers land." CLS is acceptance at checkpoint 5 (`spec.md:168-169`).

   The heading element is an `h1` when `hero` is absent and an `h2` when it is present, so
   every route has exactly one `h1` and `/products` stops having none. The mock draws `h2`
   because it draws one page; this is decision 2's "gains whatever features make it work".

   Build the result line from what this component already holds — `page` and `shownCount`
   (`:77-79`), `total` (`:78`), `currentSort` — plus `catalogueTotal` and `bookmarkedOnly`.
   `shown` is `Math.min(shownCount, total)`. `filterCount` is the number of `category`,
   `contributor` and `search` params that are set, read from the same `useSearchParams()`
   already in hand at `:76`; no new prop.

4. **`components/catalogue-page.tsx`** — add `showHero?: boolean` and
   `stats?: { recordings: number; contributors: number; categories: number }`, and a required
   `heading: string`. Render `<Hero {...stats} />` into the grid's `hero` prop when
   `showHero && stats`, pass `heading` and `bookmarkedOnly` straight through, and pass
   `stats.recordings` as `catalogueTotal`. `stats` stays optional because `/bookmarks` cannot
   supply it — see step 7. Keep the existing `children` slot untouched; it still carries what
   ticket 04 has not yet moved.

5. **`app/page.tsx`** — delete the `grid grid-cols-1 md:grid-cols-6` wrapper at `:16-29`; the
   hero is full-width with the stats right-aligned inside it. Compute the three counts here,
   in the server component, the way `app/layout.tsx:23-24` does, and pass them as `stats`.
   `showHero={!params.search}` — the mock's own logic is
   `showHero: v === 'home' || v === 'loading' || v === 'reduced' || v === 'failed'`
   (`Catalogue.dc.html:245`) and its `filtered` variant, which has only a search term beyond
   the facets, is not in that list. `heading` comes from `catalogueHeading()` with no Category
   and no Contributor, so it is `Recent` or, when the search matches nothing, `No matches`.

   **Expect `<CatalogueSearch />` and `<NewsletterForm />` to be gone already.** 04 blocks this
   ticket, and it has moved the search box into the header (`Catalogue.dc.html:19-23`) and the
   newsletter into a fourth footer column called `NOTIFY` (decision 9), deleting both lines
   from `app/page.tsx`. If either is still rendered, leave it as a plain sibling below the hero
   rather than deleting it here — it is 04's line to move, and `/` with no search box at all is
   the one outcome this ordering exists to prevent.

6. **`app/products/page.tsx`** — delete `:32-52` entirely, and the `GradientHeading` import at
   `:7` and the three `lucide-react` icons at `:4`. Pass `showHero={false}`, the same `stats`,
   and `heading={catalogueHeading({ category, contributor, total: data.length })}`. The
   `search` param still filters and still shows in the result line's filter count; it just no
   longer decides a heading.

7. **`app/bookmarks/page.tsx`** — replace the `hero` element at `:46-50` with
   `heading="Saved on this device"` (mock, `Catalogue.dc.html:210`, which uses that same
   string for both the populated and the empty saved view) and `showHero={false}`. The
   `Suspense` fallback at `:61` currently renders that hero and must render the heading row
   alone instead. Pass no `stats`: this route is `"use client"` (`:2`) and importing
   `data/catalogue.ts` to count it would put the whole catalogue in a client chunk, which is
   exactly what `components/catalogue-search.tsx:54-57` says was removed. It needs no
   denominator — `bookmarkedOnly` selects the `N SAVED · THIS BROWSER` form, which has none.

8. **Delete `components/cult/gradient-heading.tsx`.** After step 6 nothing imports it:
   `grep -rn "GradientHeading\|headingVariants" app components lib data tests scripts` returns
   only that file. Both of its dependencies stay — `class-variance-authority` is still used by
   `components/ui/{sheet,label,navigation-menu,badge,button}.tsx` and `@radix-ui/react-slot`
   by the same set — so remove no package.

9. **Tests.** `tests/e2e/home.spec.ts:47-49` asserts an `h1` named
   `"Awesome React Native UI"` and will fail; retarget it to the new copy. Add unit tests for
   the two functions in step 1 — one per row of each table above and one per result-line form,
   including the `1 FILTER` singular, the `0 → No matches` case, `RESERVING SPACE FOR 48` and
   `48 OF 277 · STILLS ONLY`. Add an e2e assertion that `/` has exactly one `h1`
   and `/products?category=Buttons` has exactly one `h1`.

   Do **not** touch the four specs that assert `Total Items:` — `filters.spec.ts:134-135`,
   `nav-empty-states-layout.spec.ts:34-35,73-74` and `pagination.spec.ts:25-26`. That pill and
   the `LastUpdated` pill beside it (`components/entry-card-grid.tsx:249-257`) are replaced by
   the header counter line (`Catalogue.dc.html:18`) and the footer stamp (`:161`), both of
   which are ticket 04's. `/` showing both the new result line and the old pill is an interim
   that never ships on its own — deploy B carries all thirteen tickets.

10. `pnpm check-types && pnpm lint && pnpm test`, plus the Playwright suite.

## Acceptance

- `grep -rn "Awesome React Native UI" app components` returns nothing.
- `/` has exactly one `h1`, and its text is
  `A dark room full of React Native interfaces, playing quietly.` Its computed style is
  `font-size: 29px`, `font-weight: 500`, `letter-spacing: -0.58px`.
- The paragraph under it reads `Every entry is a silent screen recording of a real phone, and
  a link to the repo that made it.` at `font-size: 13px`.
- The stats row on `/` reads `277 RECORDINGS`, then the Contributor count, then
  `18 CATEGORIES`, in that order. The middle number is whatever
  `getUniqueContributors().length` returns and is never asserted as a literal: ticket 10 trims
  the trailing space off `"Pushkar Tandon "` (`data/fullapps.ts:23`), which makes the derived
  total 23 rather than 24. Each number is at `font-size: 19px` with
  `font-variant-numeric: tabular-nums`, each label mono at `font-size: 10px` with
  `letter-spacing: normal`.
- `grep -rn "\b277\b\|\b24 CONTRIBUTORS\b\|\b18 CATEGORIES\b" app components lib` returns
  nothing: a test asserts the three rendered numbers equal `allRecordings.length`,
  `getUniqueContributors().length` and `getUniqueCategories().length`, so adding a nineteenth
  Category moves the page without an edit.
- `/products`, `/products?category=Buttons` and `/bookmarks` render no `h1` reading
  `A dark room…` and no stats row; `document.querySelectorAll("h1").length === 1` on each.
- `/products?category=Buttons` heading is `Buttons` and its result line is
  `20 OF 277 · 1 FILTER` — 20 being what `data/buttons.ts` actually holds, not the mock's 14.
- `/products?category=Misc&contributor=<any>` heading is `Misc, by one contributor` and the
  eyebrow words `categoryAuthor` are gone: `grep -rn '"Author"' app components` returns
  nothing.
- `/products?search=zzzzz` heading is `No matches` and its result line is `0 OF 277 · 1
  FILTER`.
- `/` heading is `Recent` and its result line is `48 OF 277 · SORTED RECENT`; after clicking
  Load more once it is `96 OF 277 · SORTED RECENT`, and on the last page `277 OF 277 · SORTED
  RECENT`.
- Switching the sort to Top Viewed changes the tail to `· SORTED MOST VIEWED`.
- `/bookmarks` heading is `Saved on this device` in both states; with three saved its result
  line is `3 SAVED · THIS BROWSER`, with none `0 SAVED · THIS BROWSER`.
- The result line element has `min-width: 180px` and `font-variant-numeric: tabular-nums` on
  every route, and the heading row's layout is byte-identical between page 1 and the last page
  apart from the digits.
- In light mode the hero copy is character-for-character identical to dark mode; only the
  computed colours differ. A screenshot diff of `/` light against `/` dark shows no text
  difference.
- `grep -rn "gradient-heading" app components` returns nothing and the file is deleted;
  `pnpm check-types` is clean.
- No hex literal is added to `components/hero.tsx` or `components/entry-card-grid.tsx`: every
  colour is a ticket 02 token.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and the Playwright suite pass, with the only
  edited spec being `tests/e2e/home.spec.ts` plus new files.

## Open questions

1. **"Every entry" in the sub-line.** Decision 3 renames Entry to Recording "in code as well
   as copy", and this string is copy. Decision 2 says the mock ships as drawn. The step above
   ships the mock's string; if the maintainer wants the vocabulary applied it is a one-word
   edit to `Every recording is a silent screen recording…`, which repeats the word, so the
   sentence would need rewriting rather than substituting. The same word appears in the mock's
   footer line `Every entry belongs to its contributor` (`Catalogue.dc.html:149`), which is
   ticket 04's — decide both at once.
2. **The Contributor-only heading.** The mock draws one filtered variant, with a Category and
   a Contributor together. Contributor alone is derived as the Contributor's name, which for
   `Enzo Manuel Mangano ( Reactiive )` is 33 characters at 17px. If that reads badly, `By one
   contributor` is the alternative that matches the drawn phrasing.
3. **`SORTED MOST VIEWED` and `SORTED MOST VOTED`.** Only `SORTED RECENT` is drawn. The two
   labels come from the mock's own sort control (`:26-27`), so they are its vocabulary, but
   nobody has seen them in this slot.

## Depends on

- **01**, hard. The stats label is `CONTRIBUTORS`, the heading rule reads `?contributor=`, and
  `app/products/page.tsx:26` still calls the third filter `author` until 01 lands. Writing
  this against the pre-rename names would mean editing all seven files again.
- **02**, hard. Every number in this ticket is a token — 29/500/-0.02em, 17/500/-0.01em,
  mono 10/0.1em, `t1`/`t2`/`t3` — and without 02 they would be spelled as raw hexes and
  pixel values across three files, in both modes, which is the duplication 02 exists to
  prevent.
- **04**, hard. It owns the header search box, the header counter line and the footer `NOTIFY`
  column, and it deletes the two status pills at `components/entry-card-grid.tsx:249-257`
  together with the four specs that assert `Total Items:`. The search box on `/` lives inside
  the block this ticket rewrites, so landing this one first would leave that route with no
  search box for however long 04 takes. `spec.md:180` leaves this ticket's dependency column
  blank; it should read *needs 01, 02, 04*.

Not blocking, but contended:

- **08** owns the grid, the `treatment` prop and the zero-result panel. Its
  `0 OF 277 MATCH` eyebrow (`Catalogue.dc.html:100`) is the same numerator and denominator
  this ticket's `catalogueResultLine` derives — it should call that function, not recompute
  it. Both tickets edit `components/entry-card-grid.tsx`; expect a rebase.
- **11** owns mobile, and the mobile mock draws **no hero at all** — `CatalogueMobile.dc.html`
  has no `showHero` block, puts `277 · 24 · 13H AGO` in the header instead (`:15`), and drops
  the section head to 15px (`:34`). So the hero and the stats row are desktop-only, and 11 is
  where that gets enforced.
- **13** owns reduced motion — the media query, the flag it sets and the stills the tiles show.
  The mock's `48 OF 277 · STILLS ONLY` result line (`Catalogue.dc.html:216`) is a branch of
  this ticket's `catalogueResultLine` (step 1), because one function owns that line on every
  route; 13 passes the flag in and asserts the string.
