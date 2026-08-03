# 08 — The grid, the filter chips, Load more and the empty states

Status: ready-for-human
Blocked by: 06, 07

The surface is everything inside `<main>` below the heading row: the filter bar
(`assets/new-ui/Catalogue.dc.html:75-83`), the grid (`:90-96`), the zero-result panel
(`:98-109`), the empty-saved panel (`:111-122`), the Load more block (`:124-129`) and the
end-of-catalogue rule (`:131-142`). Six of the mock's eight variants turn on which of those
five blocks is drawn; `Catalogue.dc.html:245-252` is the switch that decides.

Every repo path and line number below is the tree as it stands today. Ticket 01 renames these
modules — `components/entry-card-grid.tsx` becomes `components/recording-card-grid.tsx`,
`data/catalogue.ts`'s `allEntries` becomes `allRecordings`, `?author=` becomes `?contributor=`
— and the edits land on whatever it leaves in their place. This ticket is written in the
vocabulary that rename produces.

This is the largest ticket in the effort because the two empty states are not decoration. The
zero-result panel diagnoses itself, and a panel that diagnoses has to compute rather than
render a string.

## Problem

### The grid is on the wrong gap and the wrong track

`components/entry-card-grid.tsx:285` lays the cards out as
`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6` —
Tailwind's `repeat(n, minmax(0, 1fr))` at five breakpoints, and one 24px gap on both axes.

The mock is `display:grid;grid-template-columns:repeat(5,208px);gap:28px 24px`
(`Catalogue.dc.html:91`): a fixed 208px track, 28px between rows and 24px between columns. Those
two numbers are not incidental to that one drawing — the Specimen's spacing scale names them
outright, `24 · grid column gap` and `28 · grid row gap` (`assets/new-ui/Specimen.dc.html:157`).
The row gap is therefore 4px short today, and the tracks are fractional where the design says
they are fixed.

Fixed tracks are the part that needs care, because `ui-ux-overhaul` ticket 12 removed a fixed
card width for a recorded reason and spec checkpoint 4 says read the correction first. The
correction is in that ticket's own measurement table
(`.scratch/ui-ux-overhaul/issues/12-nav-link-empty-states-and-layout-bugs.md:220-249`): the card
was `sm:w-[221px]` inside a `1fr` track, and 221px never once matched the track at any of ten
measured widths, so every card overlapped its neighbour and `scrollWidth` exceeded `clientWidth`
at all ten. The defect was **card width ≠ track width**, not fixed tracks. A fixed track with a
`w-full` card satisfies that acceptance by construction, which is the opposite failure mode.

### An applied filter has no removal control on the page

Filters compose — `ui-ux-overhaul` ticket 11 made every rail link keep the params it did not set
(`components/nav/catalogue-nav.tsx:58-67`), and its decision 20 made clicking an applied facet
clear it. So the only way to drop one filter is to find the same link in the rail and click it
again, and the only clue about which link that is, is the yellow
`bg-yellow-400 text-black dark:text-black` at `components/nav/catalogue-nav.tsx:40`. A search
term has no removal control at all beyond emptying the box.

The mock draws the missing control as a bar above the heading row: a mono `3 ACTIVE` count
(`Catalogue.dc.html:77`), one removable chip per active facet (`:78-80`) and a `Clear all`
pushed right (`:81`). It is the only place on the page where all three filters are visible at
once — the rail cannot show the search term, and the heading row deliberately does not
(ticket 06 step 1: a search term never enters the heading).

### Load more understates itself, and the end of the catalogue is silent

`components/entry-card-grid.tsx:304-312` renders a pill labelled `Load more` when
`hasMore`, and nothing else. `ui-ux-overhaul` ticket 02 chose that deliberately and left it open:
*"No remaining count in the label — the plainest option, and the `Total Items` pill next to the
sort controls already states the whole set. Worth a look."*
(`.scratch/ui-ux-overhaul/issues/02-paginate-and-strip-grid-motion.md:145-147`). Ticket 06
deletes that pill, so the reason the label could stay bare is going away with it.

The mock takes the look. It draws `Load 48 more` with `48 OF 277 SHOWN · NO INFINITE SCROLL`
beneath it (`Catalogue.dc.html:126-127`), and when the set is exhausted a rule reading
`END OF CATALOGUE · 277 OF 277` between two hairlines, with `Back to top ↑` and
`Add your own recording on GitHub ↗` under it (`:131-142`). Today `hasMore` going false simply
removes the button (`entry-card-grid.tsx:304`); the visitor is not told they reached the end.

### The two empty states are one sentence each

`components/entry-card-grid.tsx:279-282` renders `emptyMessage` as a bare
`<p className="text-sm text-neutral-700 dark:text-neutral-300">`, and
`components/catalogue-page.tsx:92-96` picks which of two strings it is. That was
`ui-ux-overhaul` ticket 12's whole B section, and it shipped against a state that rendered
nothing at all — so it is an improvement being replaced, not a mistake.

Two things from it must survive verbatim, because both were bought with a defect:

1. **`emptyMessage: string | null`, with `null` meaning "not known yet"**
   (`components/entry-card-grid.tsx:38-48`). That ticket's review found that keying the bookmarks
   copy on the *rendered* list told a visitor who does have saves that they have none, for the
   length of the `getRecordings()` round trip `app/bookmarks/page.tsx:27-44` fires from an effect
   (`12-nav-link-empty-states-and-layout-bugs.md:291-297`). The predicate is
   `bookmarks?.length === 0` — the stored set, not the list. `tests/e2e/nav-empty-states-layout.spec.ts:116-151`
   is the regression test, and it holds a server action open to reproduce the window.
2. **The copy must not imply an account exists.** Same spec, asserted at
   `tests/e2e/nav-empty-states-layout.spec.ts:105-108`:
   `toContain("no accounts")` and `not.toMatch(/sign in|log ?in|sync/i)`.

The mock's replacement copy is plainer, but it fails that assertion as written — it says
`there is no account and nothing is synced` (`Catalogue.dc.html:119`), singular `account` and the
word `synced` inside a negation. The test is checking the right property with the wrong regexp,
and step 10 fixes the test rather than bending the copy.

### The mock's zero-result diagnosis is false against this catalogue

`Catalogue.dc.html:102` reads *"Wheel Picker is by this contributor, but it lives in Pickers —
not Misc."* In this repo `Wheel Picker` is `data/sliders.ts:229-238`, whose `category` field on
`:238` reads `"Sliders"`. `data/pickers.ts` holds exactly one Recording, `Flash Cards` by
Konstantinos Efkarpidis. So the sentence names the wrong Category.

It is also incomplete. `matchesSearchTerm` tests caption, contributor and Category
(`lib/entry-search.ts:29,41-47`), and two Recordings answer to `wheel`: `Wheel Picker`
(Sliders, Enzo Manuel Mangano) and `Spin Wheel` (`data/misc.ts:233-243`, Misc, Konstantinos
Efkarpidis). For the mock's own query — Category `Misc`, that Contributor, term `wheel` — **all
three** single drops yield a non-empty result: dropping the Category gives `Wheel Picker`,
dropping the Contributor gives `Spin Wheel`, dropping the search gives the 64 Misc Recordings by
that Contributor. The mock draws the one-helpful-drop case and the algorithm has to handle
several, and none.

This is the same lesson ticket 06 recorded about `['Buttons',14]` and `['Thomino',19]`
(`.scratch/studio-dark/issues/06-hero-stats-and-headings.md:37-40`): the mock's illustrative
figures do not survive contact with the data. Every word of this panel is derived. None is
written down.

### The Contributor's name in the data is not the name in the mock

The mock spells it `Enzo Manuel Mangano (Reactiive)` (`Catalogue.dc.html:79,179`). The data
spells it `Enzo Manuel Mangano ( Reactiive )`, with a space inside each parenthesis —
`grep -c 'author: "Enzo Manuel Mangano ( Reactiive )"' data/*.ts` returns hits in eleven files
summing to 124, for instance `data/sliders.ts:233`. That stored string is the value of
`?contributor=` after ticket 01, and `app/actions/get-entries.ts:58-62` matches on it, so the
chip renders the stored value and never the mock's tidied one.

### Where the counts have to come from

`components/catalogue-page.tsx:11` is `"use client"`, and
`components/catalogue-search.tsx:54-57` records that the last value import of `@/data/*` from any
client component was deleted so `data/catalogue.ts` is no longer pulled into a client chunk.
The zero-result diagnosis needs the whole catalogue to answer "what would I see if I dropped
this one filter", so it is computed in a server component and handed down as a small plain
object, exactly as ticket 06 hands `stats` down. `spec.md:147-150` is the constraint: the
performance work is not spent.

## Work

1. **`lib/catalogue-filters.ts`** — new, no React import, pure. It lives in `lib/` for the
   reason `app/actions/get-entries.ts:41-44` gives for `matchesSearchTerm`: a rule inside a
   `"use server"` action or a client component is a rule nothing can test. It exports the three
   active facets as a type and one function.

   ```ts
   export type ActiveFilters = {
     category?: string
     contributor?: string
     search?: string
   }
   /** In the order the diagnosis prefers to drop them. */
   export const FILTER_KEYS = ["category", "contributor", "search"] as const
   ```

   `catalogueDiagnosis(recordings: Recording[], active: ActiveFilters)` returns a plain
   serialisable object and never a `Recording`, so nothing it returns can drag `data/catalogue.ts`
   into a client chunk. The algorithm, in full:

   - `keys` is the members of `FILTER_KEYS` whose value in `active` is set and non-empty. If
     `keys` is empty the function returns `null` — an unfiltered catalogue is never zero and the
     panel would have nothing to say.
   - `matches(subset)` applies the same three rules the server applies, in the same order and by
     the same predicates: `matchesSearchTerm` from `lib/recording-search.ts` for `search`, and
     case-insensitive equality on `recording.category` and `recording.contributor` for the other
     two. Read those off `app/actions/get-recordings.ts:44-62` rather than re-deriving them — a
     diagnosis computed by a second, differently-spelled filter would eventually name an example
     the grid does not show.
   - `helpful` is `keys.filter(k => matches(keys without k).length > 0)`, **evaluated in
     `FILTER_KEYS` order**.
   - `dropped` is `helpful[0]`. Category first, Contributor second, search last, and the order is
     the whole rule — no arithmetic, no largest-set tie-break. It exists because the term is the
     visitor's own words and the two facets are navigation: a visitor who typed `wheel` meant
     `wheel`, so the panel proposes giving up a click before it proposes giving up the typing.
     It also reproduces the mock's own choice — the mock diagnoses the Category on a query where
     all three drops are non-empty.
   - `example` is the first member of `matches(keys without dropped)` in `allRecordings` order,
     reduced to `{ caption, category, contributor }`.
   - `alternatives` is `helpful` minus `dropped`, and `searchAll` is true when `search` is in
     `keys`, `keys.length > 1`, and `matches(["search"])` is non-empty.
   - When `helpful` is empty the function still returns an object, with `dropped: null`,
     `example: null` and `alternatives: []`. The panel then says so and offers Clear all alone.
     `Clear all` is always offered when `keys.length > 1` because the unfiltered catalogue is
     never empty; it is never offered when `keys.length === 1`, where it would be the same button
     twice.

   `catalogueSentences(active, diagnosis, catalogueTotal)` in the same module builds the two
   strings, so the panel component holds no copy. The headline, from `Catalogue.dc.html:101`
   (`Nothing in Misc by Enzo Manuel Mangano (Reactiive) matches “wheel”.`) generalised over the
   seven reachable subsets:

   | active | string |
   |---|---|
   | category + contributor + search | `` `Nothing in ${category} by ${contributor} matches “${search}”.` `` |
   | category + search | `` `Nothing in ${category} matches “${search}”.` `` |
   | contributor + search | `` `Nothing by ${contributor} matches “${search}”.` `` |
   | category + contributor | `` `Nothing in ${category} is by ${contributor}.` `` |
   | search only | `` `Nothing in the catalogue matches “${search}”.` `` |
   | category only, or contributor only | `Nothing matches these filters.` |

   The last row is unreachable from the UI — `getUniqueCategories()` and
   `getUniqueContributors()` derive from the Recordings present, and `data/entry.ts:8-12` records
   that this is deliberate so an empty Category never reaches the rail — but `?category=Nope` is
   typeable, so it has a string rather than a crash.

   The typographic quotes are U+201C and U+201D, exactly as the mock draws them at `:101`; do not
   substitute `"`.

   The second sentence, from `Catalogue.dc.html:102`, is `Loosen one of the ${word}.` where
   `word` is `two` or `three` from `keys.length` and the whole sentence is omitted when
   `keys.length === 1`, followed by the example:

   - `dropped === "category"` → `` `${caption} is ${qualifier}, but it lives in ${example.category} — not ${active.category}.` ``
   - `dropped === "contributor"` → `` `${caption} is ${qualifier}, but it is by ${example.contributor} — not ${active.contributor}.` ``
   - `dropped === "search"` → `` `${caption} is ${qualifier}, but nothing there matches “${search}”.` ``

   `qualifier` names the strongest facet still applied, in the order Contributor, search,
   Category: `by this contributor`, else `` a match for “${search}” ``, else
   `` in ${active.category} ``. On the mock's own query this renders
   `Loosen one of the three. Wheel Picker is by this contributor, but it lives in Sliders — not
   Misc.` — the mock's sentence word for word, with the one Category the mock got wrong replaced
   by the one the data holds.

   When `dropped` is null the second sentence is
   `No single filter explains it — nothing matches any two of the ${word}.`, which is true by
   construction because that is exactly what `helpful` being empty tested.

2. **`lib/catalogue-heading.ts`** — ticket 06 creates this file; add one more function beside its
   two. `catalogueMatchLine({ shown, catalogueTotal })` returns
   `` `${shown} OF ${catalogueTotal} MATCH` `` — the eyebrow at `Catalogue.dc.html:100`
   (`0 OF 277 MATCH`). It goes here rather than in the panel so the numerator and denominator
   obey ticket 06's one rule (`shown` is tiles rendered, `catalogueTotal` is always the whole
   catalogue), and so both mono lines on the page cannot drift apart. It is a third function
   rather than a flag on `catalogueResultLine` because the strings genuinely differ:
   `0 OF 277 · 3 FILTERS` in the heading row and `0 OF 277 MATCH` in the panel, both drawn, both
   on screen at once in the `zero` variant.

3. **`components/filter-chips.tsx`** — new client component, the bar at
   `Catalogue.dc.html:76-82`. It takes no data props; it reads `useSearchParams()`, which
   `components/entry-card-grid.tsx:76` already calls in the same tree.

   The container is `display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:12px 14px;
   margin-bottom:20px; border-radius:12px; border:1px solid {line}; background:{filterBarBg}`.
   `12px` is the Specimen's `12 — panel, sheet row` radius (`Specimen.dc.html:147`).

   The count is `` `${n} ACTIVE` `` at `font-family:'JetBrains Mono'; font-size:9px;
   letter-spacing:0.14em; color:{t3}` — the Specimen's `mono 9 / +14% · labels` row
   (`Specimen.dc.html:144`).

   Each chip is `display:flex; align-items:center; gap:8px; padding:6px 8px 6px 10px;
   border-radius:8px; background:{accSoft}; border:1px solid {acc}; font-size:12px; color:{t1}`,
   holding a mono `font-size:9px; color:{acc}` prefix, the value, and a `✕` button
   `width:16px; height:16px; border-radius:5px; background:{xBg}; color:{t1}; font-size:10px;
   line-height:1`. Three chips, in `FILTER_KEYS` order:

   | facet | prefix | value | aria-label |
   |---|---|---|---|
   | category | `CATEGORY` | the Category display name | `Remove category filter` |
   | contributor | `BY` | the stored Contributor string | `Remove contributor filter` |
   | search | `SEARCH` | `` `“${term}”` `` | `Clear search` |

   The three `aria-label` strings are the mock's own (`:78,79,80`) and are what the Playwright
   cases in step 10 target. The Contributor chip carries `max-width:330px` and its value
   `overflow-wrap:anywhere` (`:79`) — the stored name is 33 characters and must wrap rather than
   push `Clear all` off the row.

   `Clear all` is `margin-left:auto; font-size:12px; color:{t2}; background:none;
   border:1px solid {line}; padding:6px 11px; border-radius:8px` (`:81`).

   Every control in the bar carries the mock's focus ring, `outline:3px solid {acc};
   outline-offset:2px` (`:78-81`) — `ui-ux-overhaul` ticket 07 is what put visible focus on this
   site and checkpoint 5 makes keyboard verification acceptance, so it is not optional trim.

   **Hrefs, and why nothing new is written.** The Category and Contributor chips are `<Link>`s
   whose target is `facetHref(searchParams, key, currentValue)` — the function already at
   `components/nav/catalogue-nav.tsx:58-67`, which deletes a key when the value passed equals the
   one applied and drops `page` because a different filter is a different result set. Export it
   from that module and import it here; do not write a second one.
   `ui-ux-overhaul` ticket 11 laid out four spellings of "copy the query, change one key" and
   concluded that a helper spanning all four *"is a rename of `new URLSearchParams(...)` wearing
   a config object"* (`11-filters-compose-and-mobile-drawer.md:285-300`). This is not that: it is
   the same policy with the same output, so it is the same function.

   The search chip cannot use it, because `facetHref` always returns `/products?…` and the search
   box works on whatever route it is on. Add `export function searchHref(pathname: string,
   current: URLSearchParams, term: string)` to `components/catalogue-search.tsx` holding the four
   lines already at `:24-32`, call it from `handleSearch`, and call it from the chip with
   `term === ""` followed by `router.replace`. Two callers, one policy, one spelling.

   **Motion.** The chip's appearance and disappearance is `120ms ease-out`
   (`Specimen.dc.html:163`), on `opacity` and `transform` only — `Catalogue.dc.html` draws no
   layout animation and `.scratch/ui-ux-overhaul/issues/02-paginate-and-strip-grid-motion.md:55-59`
   deleted the last `framer-motion` node from this tree. Write it as a CSS transition that a
   `prefers-reduced-motion: reduce` block can zero; the global mechanism is ticket 13's, the
   Specimen's rule is *"all durations 0ms"* (`Specimen.dc.html:95`).

   **Analytics: no new event.** Each Category or Contributor chip's ✕ fires
   `filterCleared(facet, value)` (`lib/analytics.ts:142-144`), which is precisely what it is —
   `reportFacetClick` at `components/nav/catalogue-nav.tsx:81-93` already fires it for the same
   act from the rail. `Clear all` fires one `filterCleared` per active **Facet**, because two
   facets really were removed. The search chip fires nothing: `Facet` is
   `"category" | "contributor"` and `lib/analytics.ts:28-29,73` records that `search` is
   deliberately not one. Adding a fourteenth event name is out — `tests/analytics.test.ts` exists
   to pin the set, and ticket 01's acceptance is that exactly one of thirteen names changed.
   The term is rendered on screen and never captured; `lib/analytics.ts:19-20` is the rule.

4. **`components/recording-card-grid.tsx` — the grid tracks.** Replace the class string at
   `:285` with
   `grid grid-cols-[repeat(auto-fill,163px)] sm:grid-cols-[repeat(auto-fill,208px)] gap-x-4 gap-y-5 sm:gap-x-6 sm:gap-y-7`.
   208px is the mock's tile width (`Catalogue.dc.html:91,93`) and 163px the phone's
   (`assets/new-ui/CatalogueMobile.dc.html:37`); 16/20 and 24/28 are those two files' column and
   row gaps, which are `gap-x-4 gap-y-5` and `gap-x-6 gap-y-7` exactly.

   `auto-fill` rather than the mock's literal `repeat(5, 208px)` because the container width is
   not this ticket's: ticket 04 rebuilds the shell and ticket 05 the 232px rail, and a hard five
   would overflow the moment either lands at a different width. `auto-fill` with a fixed track
   fits as many as the box holds and can never exceed it, so
   `scrollWidth === clientWidth` — the criterion at
   `12-nav-link-empty-states-and-layout-bugs.md:148-150` — holds at every width by construction
   rather than by measurement. Leave the card `w-full` (`components/entry-card.tsx:135` after
   ticket 12, `components/recording-card.tsx` after 01): card width equals track width is the
   other half of that criterion, and it is what ticket 12 bought.

   Ticket 11 owns the phone and confirms the 163px arm against the mobile mock. Do not add a
   third breakpoint here — the mock draws two.

5. **`components/recording-card-grid.tsx` — Load more and the end rule.** Replace `:304-312`.

   When `hasMore`, a column `display:flex; flex-direction:column; align-items:center; gap:11px;
   padding:42px 0 6px` (`Catalogue.dc.html:125`) holding:

   - a button `font-size:13.5px; font-weight:500; padding:12px 26px; border-radius:11px;
     border:1px solid {line2}; background:{fieldBg}; color:{t1}` (`:126`), labelled
     `` `Load ${Math.min(PAGE_SIZE, total - shown)} more` ``. The mock draws `Load 48 more`, but
     the last page is short — 277 less five pages of 48 is 37 — and decision 2 is that nothing on
     screen lies, so the number is derived. `PAGE_SIZE` is 48 at `:15` and does not change.
   - a mono line `font-size:10px; letter-spacing:0.1em; color:{t3}` reading
     `` `${shown} OF ${total} SHOWN · NO INFINITE SCROLL` `` (`:127`). `total` here is the
     **filtered** count `sortedData?.length` (`:78`), not ticket 06's `catalogueTotal`. The two
     denominators differ on purpose: the heading row answers "how much of the catalogue is this",
     the Load more line answers "how much of this result set is on screen", and printing 277
     under a 60-result search would be false. Unfiltered they coincide, which is the mock's
     `48 OF 277 SHOWN`. The separator is `·`, U+00B7.

   When `!hasMore` and `total > 0` — every card in a non-empty result set is on screen, whether
   that took five pages or none — a rule from `:132-136`: a flex row `align-items:center;
   gap:16px; padding:34px 0 4px` with a `flex:1; height:1px; background:{line}` either side of a
   mono `font-size:10px; letter-spacing:0.14em; color:{t3}` label, then a centred row
   `gap:10px; padding:18px 0 0` (`:137-141`) holding two `{acc}` links with
   `text-decoration:underline; text-underline-offset:3px` separated by a `{t3}` `·`.

   The label is `` `${END_NOUN} · ${total} OF ${total}` ``, where `END_NOUN` is
   `END OF CATALOGUE` when no filter and no saved view is in force and `END OF RESULTS`
   otherwise. The mock draws only the first, on its unfiltered `end` variant (`:134`), and
   `END OF CATALOGUE · 60 OF 60` under a Category filter would be false. One derived word; see
   Open questions.

   Both links are drawn, so per decision 2 both work. `Back to top ↑` scrolls the document to 0
   — plain `window.scrollTo(0, 0)`, no smooth behaviour, because smooth scrolling is one of the
   things `prefers-reduced-motion` exists to suppress and ticket 13 should not have to come back
   for it. `Add your own recording on GitHub ↗` points at
   `https://github.com/mrpmohiburrahman/awesome-react-native-ui`, the URL already on the page at
   `components/nav/top-nav-bar.tsx:70`; give it `target="_blank" rel="noopener noreferrer"` to
   match. Do not fire `repoClicked` on it — that event is about following a Recording's Source
   link (`lib/analytics.ts:109-113`) and this link belongs to no Recording.

   Leave `loadMore` at `:86-94` alone. Its `pushState`, its `page` param and its
   `loadMoreClicked(page + 1, Math.min((page + 1) * PAGE_SIZE, total))` are `ui-ux-overhaul`
   ticket 02's and ticket 01 renames the property; this step changes the label above it and the
   line below it, nothing about what a click does.

6. **`components/catalogue-empty.tsx`** — new, both panels, no copy of its own beyond what step 1
   returns. They share a shell from `Catalogue.dc.html:99` and `:112`:
   `display:flex; flex-direction:column; align-items:flex-start; padding:52px 40px;
   border-radius:14px; border:1px dashed {line2}; background:{emptyBg}; max-width:720px`, with
   `gap:16px` for the zero panel and `gap:15px` for the saved one.

   **The zero panel** (`:98-109`), in order: the mono eyebrow from step 2 at
   `font-size:9.5px; letter-spacing:0.14em; color:{t3}`; the headline at
   `font-size:22px; font-weight:500; letter-spacing:-0.01em; color:{t1}; text-wrap:pretty`; the
   second sentence as a `<p>` at `margin:0; font-size:13px; line-height:1.55; color:{t2};
   max-width:520px`; then a `display:flex; gap:9px; flex-wrap:wrap; padding-top:4px` row of
   actions.

   The actions are built from step 1's return, never from a fixed list of three. In order:

   1. When `dropped` is set, `` `Drop the ${label} filter` `` for it — the mock's
      `Drop the category filter` (`:104`) — except `search`, whose button reads
      `Clear the search`. This one is primary: `background:{acc}; color:{onAcc}; border:none`.
   2. One secondary button per member of `alternatives`, same labels, styled
      `border:1px solid {line2}; background:none; color:{t1}`.
   3. When `searchAll`, `` `Search all ${catalogueTotal} for “${search}”` `` — the mock's
      `Search all 277 for “wheel”` (`:105`) — targeting the current pathname with only `search`
      kept.
   4. When `keys.length > 1`, `` `Clear all ${word}` `` — the mock's `Clear all three` (`:106`) —
      targeting `/products` with nothing, or `/` when only `search` was set.

   All buttons are `font-size:12.5px; padding:9px 13px; border-radius:9px` with
   `outline:3px solid {acc}; outline-offset:3px` on focus (`:104-106`); the primary adds
   `font-weight:500`. Each is a `<Link>`, not a button, so the browser's own middle-click and
   Back work and so the served HTML carries the escape route even before hydration — the same
   reasoning `components/nav/catalogue-nav.tsx:95-110` gives for keeping its hrefs in render.

   **The empty-saved panel** (`:111-122`): three placeholder rectangles first, a
   `display:flex; gap:7px` row of `width:34px; height:60px; border-radius:7px;
   border:1px dashed {line2}` divs, `aria-hidden` — they carry no information the copy does not.
   Then the headline `You haven’t saved anything yet.` at the same 22px/500/-0.01em, with the
   apostrophe as U+2019 exactly as `:118` draws it. Then the paragraph at 13px/1.55/`{t2}`,
   `max-width:520px`:

   > Tap ◇ Save on any recording to keep it here. Saves stay in **this browser on this device
   > only** — there is no account and nothing is synced. Clearing site data clears them.

   The bold run is a `<strong style="font-weight:500;color:{t1}">` around
   `this browser on this device only` and nothing else (`:119`). The dash is an em dash, U+2014.
   `◇ Save` must be the glyph and word the tile actually draws — `assets/new-ui/Tile.dc.html:113`
   is `saveLabel: this.props.saved ? '◆ Saved' : '◇ Save'`, and ticket 07 builds it. If 07 ships
   a different control this sentence is a lie, which decision 2 forbids; check it rather than
   assuming.

   Then one primary button, `Browse the catalogue` (`:120`), linking to `/`.

7. **`components/recording-card-grid.tsx` — wire the branch.** At `:279-282`, replace the `<p>`
   with `<CatalogueEmpty>`. Keep the `emptyMessage` prop's *shape* — `string | null`, null meaning
   not known yet — and keep it deciding whether anything renders at all, because that null is the
   held-fetch defect from `12-nav-link-empty-states-and-layout-bugs.md:291-297` and
   `tests/e2e/nav-empty-states-layout.spec.ts:116-151` will catch its removal. Widen it from a
   string to a discriminated value:

   ```ts
   emptyState: { kind: "saved" } | { kind: "zero"; diagnosis: CatalogueDiagnosis | null } | null
   ```

   Null still means "the caller cannot yet tell", `"saved"` renders the saved panel, `"zero"`
   renders the zero panel. Update the prop's doc comment at `:38-48`, which explains the null and
   is still the reason the prop is required rather than defaulted.

   The mock hides the grid entirely in both empty variants —
   `showGrid: v !== 'zero' && v !== 'empty-saved'` (`:247`) — and raises `main`'s min-height from
   400 to 620 (`:252`). Render the panel in place of the grid, and give the empty branch
   `min-height:620px` at `sm` and above so the footer does not ride up. The Load more block and
   the end rule render only when the grid does.

8. **`components/catalogue-page.tsx`** — build `emptyState` where `emptyMessage` is built today
   (`:92-96`), keeping the same predicate: `bookmarkedOnly` and `bookmarks?.length === 0` →
   `{ kind: "saved" }`; `bookmarkedOnly` and `bookmarks` still null → `null`; otherwise
   `{ kind: "zero", diagnosis }`. Add a `diagnosis?: CatalogueDiagnosis | null` prop and pass it
   straight through — this module is `"use client"` and must not compute it.

   `app/products/page.tsx` computes it, in the server component that already knows all three
   facets (`:25`): when `data.length === 0`, call
   `catalogueDiagnosis(allRecordings, { category, contributor, search })` against
   `allRecordings` from `data/catalogue.ts`. Not against `getRecordings()` — the diagnosis reads
   caption, Category and Contributor only, none of which come from Firestore, so the plain array
   is both correct and free. `app/page.tsx` does the same with `search` alone. `/bookmarks` passes
   nothing: it is `"use client"` (`app/bookmarks/page.tsx:2`), it can never show the zero panel,
   and importing the catalogue there is exactly what `components/catalogue-search.tsx:54-57` says
   was removed.

9. **`components/nav/catalogue-nav.tsx`** — export `facetHref` and change nothing else in the
   file. The rail's own active highlight stays: the chips say which filters are on, the rail says
   which link would clear one, and ticket 05 owns whether the rail's yellow becomes `{accSoft}`
   plus `1px solid {acc}` (`Catalogue.dc.html:223`).

10. **Tests.**

    Unit, new file, against `lib/catalogue-filters.ts` — this is where the algorithm is pinned,
    because none of its branches is visible from a screenshot:

    - the mock's own query (`Misc`, `Enzo Manuel Mangano ( Reactiive )`, `wheel`) diagnoses
      `category`, names `Wheel Picker`, reports `Sliders` as its Category, and lists both other
      drops as alternatives — the several-helpful case;
    - a query where exactly one drop helps produces one alternative-free panel;
    - a query where no single drop helps returns `dropped: null` and the
      `No single filter explains it` sentence;
    - one active filter returns no `Loosen one of the…` sentence and no `Clear all`;
    - no active filter returns `null`;
    - all six headline rows of step 1's table, including the unreachable
      `Nothing matches these filters.`;
    - `searchAll` is false when the term matches nothing anywhere, so the panel never offers a
      search that also returns zero.

    Build the fixtures from literal `Recording` objects rather than from `allRecordings`, so a
    submission cannot turn a passing case red — except one case that asserts against the real
    data that `Wheel Picker`'s Category is whatever `data/sliders.ts` says, not the mock's
    `Pickers`. That one is the guard against the diagnosis being hard-coded again.

    Unit, `lib/catalogue-heading.ts`: `catalogueMatchLine` for `0 OF 277 MATCH`.

    Playwright, extending `tests/e2e/filters.spec.ts`: from
    `/products?category=Misc&contributor=…`, the bar shows `2 ACTIVE` and two chips; clicking
    `Remove category filter` leaves `contributor=` and drops `category=` from the URL; `Clear all`
    lands on `/products` with no query; from `/?search=slider` the search chip's
    `Clear search` leaves the visitor on `/` and not on `/products`.

    Playwright, extending `tests/e2e/pagination.spec.ts`: `/` shows `Load 48 more` and
    `48 OF 277 SHOWN · NO INFINITE SCROLL`; `/?page=5` shows `Load 37 more`; `/?page=99` shows no
    button and an `END OF CATALOGUE · 277 OF 277` rule; `/products?category=Buttons&page=99` shows
    `END OF RESULTS · 20 OF 20`.

    `tests/e2e/nav-empty-states-layout.spec.ts` needs four edits and one must not be softened.
    `NO_MATCHES` at `:15` becomes the derived headline. The `/^No bookmarked Entries yet\./`
    matchers at `:99,144,148,165` become `/^You haven’t saved anything yet\./`. The copy
    assertions at `:105-108` become `toContain("this browser on this device only")`,
    `toContain("no account")` and `not.toMatch(/sign in|log ?in/i)` — the `sync` clause goes
    because the new copy says `nothing is synced`, which is the same promise stated positively.
    **Do not touch the held-fetch test at `:116-151`.** It is the regression test for the defect
    the review found, it targets the same predicate this ticket keeps, and it only needs its
    matcher string updated.

    The four `Total Items:` assertions at `filters.spec.ts:134-135`,
    `nav-empty-states-layout.spec.ts:34-35,73-74` and `pagination.spec.ts:25-26` are ticket 04's,
    which deletes the pill. Leave them.

11. `pnpm check-types && pnpm lint && pnpm test`, plus the Playwright suite.

## Acceptance

- On `/` at 1440px the grid's computed `grid-template-columns` is five tracks of `208px`, its
  `row-gap` is `28px` and its `column-gap` is `24px`, and every card's
  `getBoundingClientRect().width` equals its track's to within 1px.
- `scrollWidth === clientWidth` on the grid element and
  `document.documentElement.scrollWidth === clientWidth` at 390, 640, 768, 1024, 1280 and 1440px
  on `/`, `/products` and `/bookmarks` — the ten-row table at
  `12-nav-link-empty-states-and-layout-bugs.md:236-249` re-run and still clean.
- `/products?category=Misc&contributor=Enzo%20Manuel%20Mangano%20(%20Reactiive%20)` renders a
  bar reading `2 ACTIVE`, a `CATEGORY Misc` chip and a `BY Enzo Manuel Mangano ( Reactiive )`
  chip — the stored spelling with the inner spaces, not the mock's.
- Clicking the chip labelled `Remove category filter` produces a URL with `contributor=` and no
  `category=` and no `page=`, and fires exactly one `filter_cleared` with
  `{ facet: "category", value: "Misc" }`.
- `Clear all` from that URL lands on `/products` with no query string and fires two
  `filter_cleared` events, one per Facet.
- On `/?search=wheel`, the `SEARCH “wheel”` chip's `Clear search` returns the visitor to `/`
  with no query string, and fires no PostHog event at all. No captured event anywhere in the
  session carries the string `wheel`.
- `/` renders a button reading `Load 48 more` and, beneath it,
  `48 OF 277 SHOWN · NO INFINITE SCROLL`. `/?page=5` renders `Load 37 more`.
- `/?page=99` renders no Load more control and a rule reading `END OF CATALOGUE · 277 OF 277`
  between two 1px lines, with `Back to top ↑` and `Add your own recording on GitHub ↗` under it.
  The second points at `https://github.com/mrpmohiburrahman/awesome-react-native-ui`.
- `/products?category=Buttons&page=99` renders `END OF RESULTS · 20 OF 20` — 20 being what
  `data/buttons.ts` holds, not the mock's 14.
- `/products?category=Misc&contributor=Enzo%20Manuel%20Mangano%20(%20Reactiive%20)&search=wheel`
  renders no grid, the eyebrow `0 OF 277 MATCH`, the headline
  `Nothing in Misc by Enzo Manuel Mangano ( Reactiive ) matches “wheel”.`, and the sentence
  `Loosen one of the three. Wheel Picker is by this contributor, but it lives in Sliders — not
  Misc.` The word `Pickers` does not appear.
- That panel offers five actions in order: `Drop the category filter` (primary),
  `Drop the contributor filter`, `Clear the search`, `Search all 277 for “wheel”`, and
  `Clear all three`. Each one, followed, lands on a page with at least one card.
- `grep -rn "Pickers\|Wheel Picker\|Spin Wheel\|Enzo" app components lib` returns nothing: every
  word of that panel is derived, and a test asserts the example Recording's Category equals what
  `data/sliders.ts` holds rather than a literal.
- `/products?search=zzzzz` — one filter — renders the headline
  `Nothing in the catalogue matches “zzzzz”.`, no `Loosen one of the…` sentence, exactly one
  action, and no `Clear all`.
- A query where no single drop helps renders
  `No single filter explains it — nothing matches any two of the three.` and exactly one action.
- `/bookmarks` in a profile with an empty `bookmarkedItems` key renders the dashed panel with
  three placeholder rectangles, the headline `You haven’t saved anything yet.`, the paragraph
  containing `this browser on this device only` in a `<strong>`, and a `Browse the catalogue`
  button that lands on `/` showing 48 cards.
- That paragraph matches `/no account/` and does not match `/sign in|log ?in/i`.
- `tests/e2e/nav-empty-states-layout.spec.ts`'s held-fetch case still passes unmodified except
  for its matcher string: with one id in `bookmarkedItems` and the server action held open,
  `/bookmarks` shows neither a card nor the empty panel, and shows one card when released.
- Every control in the filter bar and both panels shows a visible focus ring on Tab, and the
  whole zero panel is reachable and operable from the keyboard with no pointer.
- Under `prefers-reduced-motion: reduce`, adding or removing a chip has a computed
  `transition-duration` of `0s`, and `Back to top ↑` jumps rather than scrolls.
- No hex literal is added to any file this ticket touches: every colour is a ticket 02 token,
  including `filterBarBg`, `emptyBg`, `xBg` and `onAcc`.
- `lib/catalogue-filters.ts` imports nothing from `react`, `next` or `data/`, and
  `pnpm build` shows no client chunk containing `data/catalogue.ts`.
- `grep -rn "posthog.capture" components lib | wc -l` is unchanged, and `tests/analytics.test.ts`
  passes untouched: this ticket adds no event name and no property.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and the Playwright suite pass.

## Open questions

1. **`END OF RESULTS`.** The mock draws only `END OF CATALOGUE`, on an unfiltered page. Printing
   it under a Category filter would be false, so step 5 derives one word. If the maintainer would
   rather the rule simply not render when a filter is on, that is a smaller change and equally
   honest — it just leaves a filtered last page with no terminator.
2. **Which Recording the diagnosis names.** Step 1 takes the first in `allRecordings` order,
   which is Category-file order (`data/catalogue.ts:35-54`) rather than recency — deterministic
   and requiring no Firestore read, but arbitrary from the visitor's side. The alternative is the
   newest, which needs `created_at` and therefore the sorted set from
   `getRecordingsWithCounts()`. Cheap to change later; not worth a Firestore read now.
3. **The panel radius is off the scale.** Both panels are drawn at `border-radius:14px`
   (`Catalogue.dc.html:99,112`) and the Specimen's radius scale is 16 / 12 / 9 / 6
   (`Specimen.dc.html:146-149`). Shipped as drawn per decision 2; flagging it because ticket 02
   may want a token and there is no row for 14.
4. **`line2` disagrees between the two mock files.** `Specimen.dc.html:102-103` has dark
   `rgba(255,255,255,0.22)` / light `rgba(16,18,22,0.24)`; `Catalogue.dc.html:175-176` has dark
   `rgba(255,255,255,0.24)` / light `rgba(16,18,22,0.28)`. Both panels' dashed borders and every
   secondary button in them use it. Ticket 02 owns the token and has to pick one; this ticket
   assumes the Catalogue file, since that is the surface being built.
5. **`Search all 277 for “…”` on `/`.** From `/` only `search` can be active, so the action never
   appears there — it needs two filters. Nothing to decide unless the maintainer wants the
   Category rail reachable from `/`, which is ticket 05's.

## Depends on

- **06**, hard, and the spec's ticket table does not record it (`spec.md:182` lists only 07).
  Ticket 06 creates `lib/catalogue-heading.ts`, which step 2 adds a third function to; it adds
  the `catalogueTotal` and `bookmarkedOnly` props this ticket's Load more line and end rule read;
  and it puts the heading row directly above the block this ticket replaces. Its own Depends-on
  already anticipates the collision — *"08 owns the grid, the `treatment` prop and the zero-result
  panel… Both tickets edit `components/entry-card-grid.tsx`; expect a rebase."*
  (`06-hero-stats-and-headings.md:317-320`). Started first, this ticket would have to invent that
  module and both props and then hand them back.
- **07**, hard. The grid's track is the tile's width — 208px desktop, 163px phone — so step 4's
  `repeat(auto-fill, 208px)` is only correct if the tile is 208px, and a `1fr` tile inside a
  208px track is ticket 12's clipping defect returning. The empty-saved copy also names the
  tile's own Save control by its glyph, `◇ Save`, which 07 draws.

  07 hands this ticket the mock's `loading` variant — the tile skeleton at `Tile.dc.html:33-42`
  and the `RESERVING SPACE FOR 48` result line at `Catalogue.dc.html:215` — on the condition
  *"if it introduces a boundary that suspends"*. **This ticket
  introduces none, so the skeleton is deliberately not built.** Its two grid callers
  are server components that already hold their Recordings when they render
  (`app/products/page.tsx:25`, `app/page.tsx`), `find app -name loading.tsx` returns nothing,
  and the one asynchronous case — `/bookmarks` reading its saves from an effect — is already
  answered by step 7's `emptyState: null`, which renders neither cards nor a panel for exactly
  that window. A skeleton would be markup no route reaches, and the eighth of the mock's eight
  variants is the one the code has no state for. Ticket 06 still defines the `loading` form of
  `catalogueResultLine` — a pure function returning a string costs nothing and is unit-tested
  beside its four siblings — so the string exists and no route yet asks for it. When a route
  does suspend — a streamed
  grid, or a Firestore read moving server-side — the skeleton is the six bars at
  `Tile.dc.html:35-40` on the `skel` token and the line is `Catalogue.dc.html:215`; both are
  drawn, and this note is where to start rather than the mock.
- **01 and 02**, transitively through both of the above, and directly: every string here says
  Recording or Contributor, every href reads `?contributor=`, and every colour is a token.

Not blocking, but contended:

- **04** deletes the two status pills at `components/entry-card-grid.tsx:249-257` and the four
  specs that assert `Total Items:`. Step 10 leaves those specs alone for that reason.
- **05** owns the rail, including whether its active highlight becomes `{accSoft}` plus
  `1px solid {acc}`. Step 9 exports one function from `components/nav/catalogue-nav.tsx` and
  changes nothing else in it.
- **11** owns the phone. The mobile mock draws a two-chip row with no `N ACTIVE` count and no
  `Clear all` (`CatalogueMobile.dc.html:24-29`), truncates the Contributor with an ellipsis
  rather than wrapping, and puts the filter count on a fixed bottom dock instead (`:45`). It also
  draws no Load more block at all. So step 3's bar is the desktop arm, and 11 decides what
  replaces it below `sm`.
- **13** owns reduced motion and the `48 OF 277 · STILLS ONLY` result line
  (`Catalogue.dc.html:216`), and owns the global mechanism that zeroes step 3's 120ms transition.
  This ticket adds no `prefers-reduced-motion` branch of its own beyond writing the transition so
  one can reach it.

## Comments

### 2026-08-03 — Built. Every acceptance bullet met except three clauses about PostHog events, which cannot be verified in this harness. `ready-for-human`.

Work steps 1-11 are all done. `pnpm check-types`, `pnpm lint` (0 errors, 4 pre-existing
warnings in `placeholders-and-vanish-input.tsx`, `input.tsx` and an `aboutus` page — none in a
file this ticket touches), `pnpm test` **241/241** and the Playwright suite **151/151** all pass,
against a production build.

**What the commit is.** `lib/catalogue-filters.ts` (the diagnosis, the two sentences, the action
list and `clearAllHref`), `components/filter-chips.tsx`, `components/catalogue-empty.tsx`,
`catalogueMatchLine` in `lib/catalogue-heading.ts`, the grid's fixed tracks and its Load more /
end-of-set block, `emptyState` replacing `emptyMessage`, `facetHref` exported and `searchHref`
extracted, and the diagnosis computed in both server routes.

**The mock's own zero-result query, resolved against the data.** `Misc` + that Contributor +
`wheel` diagnoses the Category, names `Wheel Picker`, and reports its Category as whatever
`data/sliders.ts` holds — `Sliders`, not the mock's `Pickers`. All three single drops are
non-empty on that query, so the panel offers five actions where the mock draws three.
`grep -rn "Pickers\|Wheel Picker\|Spin Wheel\|Enzo" app components lib` returns nothing.

**One thing the ticket did not anticipate: the framed panel had to go.** The first acceptance
bullet — five 208px tracks at 1440px — is arithmetically impossible with it. `main` is 1208px
inside the 232px rail and its own 26px gutters leave 1156px; five tracks plus four 24px gaps need
1136px. The `treatment="framed"` panel's `p-4`, the grid wrapper's `md:mx-4` and `/`'s `px-2
md:pl-4` together spent 80px, leaving 1076px and four tracks. Ticket 06's Depends-on says
outright *"08 owns the grid, the `treatment` prop and the zero-result panel"*, and the mock draws
no panel around the grid at all, so `GridTreatment`, both `bg-white dark:bg-[#1E1E1E]
rounded-[2rem]` wrappers and the doubled route gutters are deleted. Checkpoint 4 was read first:
the panel is the pre-redesign look, superseded by this effort rather than by a decision of its
own. It took the file from eight hex literals to five — the five left are the phone sort
dropdown's, which ticket 11 owns. Both catalogue routes now render at the mock's own 1156px.

**Three acceptance clauses could not be verified, and one of them cannot be true as written.**

- *"fires exactly one `filter_cleared` with `{ facet: "category", value: "Misc" }"*,
  *"fires two `filter_cleared` events, one per Facet"* and *"fires no PostHog event at all"* —
  **posthog-js emits no capture request at all under Playwright in this repo.** Verified at
  length: `posthog.init` runs (the token reaches `/array/<token>/config.js`, `localStorage`
  carries a `distinct_id` and an `$initialization_time`), the recorder, surveys and web-vitals
  extensions load, and yet no POST to `/i/v0/e/` ever happens — not for a click, not for a
  `$pageview`, not on unload, and nothing is left queued. Spoofing `navigator.webdriver`, the
  headless user-agent, and both together changed nothing. A recorder that decoded the gzip
  payload was written and then deleted, because there was no payload to decode. The code does
  what the three bullets require and the Spec review confirmed it by reading:
  `filterCleared` → `posthog.capture("filter_cleared", {facet, value})`; the facet ✕ is a `<Link>`
  whose `onClick` calls it once; `Clear all` loops the active facets with `if (key !== "search")`;
  the search ✕ is a plain button that only calls `router.replace`. **A maintainer's judgement is
  what is left here** — either accept that, or land a harness that can see captures. Ticket 15
  owns PostHog at deploy B and is the right home for the harness.
- *"No captured event anywhere in the session carries the string `wheel`."* **This one cannot
  hold, and not because of anything in this ticket.** `?search=wheel` is a shareable address
  (`ui-ux-overhaul` ticket 10), so PostHog's own `$`-prefixed events — `$pageview`, `$autocapture`,
  the dead-click stream — carry it inside `$current_url` by construction. What
  `lib/analytics.ts:19-20` promises is narrower and is met: no event *this site defines* carries
  a visitor's own words. **Also for the maintainer**, and also ticket 15's, since that ticket
  already owns what autocapture does at deploy B.

**Everything else, bullet by bullet.** Five 208px tracks with 28px/24px gaps and card width equal
to track width, asserted at 1440px and measured at 390/640/768/1024/1280/1440 on all three routes
with `scrollWidth === clientWidth`. The bar's `2 ACTIVE`, its `CATEGORY Misc` chip and its
`BY Enzo Manuel Mangano ( Reactiive )` chip in the **stored** spelling with the inner spaces. Chip
removal dropping `page`, `Clear all` landing on bare `/products`, the search chip returning to `/`
with no query string. `Load 48 more` with `48 OF 277 SHOWN · NO INFINITE SCROLL`, `Load 37 more`
on the short last page, `END OF CATALOGUE · 277 OF 277` with both links working and the GitHub one
pointing where `top-nav-bar.tsx` points, and `END OF RESULTS · 20 OF 20` under a Buttons filter.
All six headline forms, the qualifier order, the one-filter and no-single-drop cases, the empty
saved panel's copy and its `Browse the catalogue` landing on `/` with 48 cards, the held-fetch
regression test passing with only its matcher string changed, focus rings on Tab for every control
in the bar and every action in the panel reached by keyboard alone, and a chip's
`transition-duration` computing `0s` under `prefers-reduced-motion`. No hex literal added, no
`posthog.capture` added (15 before and after), `tests/analytics.test.ts` untouched, and no client
chunk names `data/catalogue.ts`.

**Two-axis review, and what it changed.** Both axes ran and both found something real.

- *Spec, one defect, fixed.* `catalogueActions` gated `Search all N` on `searchAll` alone. Those
  two conditions are independent — three filters can leave every pair empty while the term alone
  still matches, which
  `/products?category=Accordions&contributor=…&search=wheel`-shaped queries do — so the
  "exactly one action" case offered two. Now gated on `dropped` as well, with a unit test that
  pins `dropped: null` and `searchAll: true` together.
- *Standards, one real duplication, fixed.* `Clear all` was spelled twice and the two already
  disagreed: the bar preserved `sort`, the panel discarded it. Both now call one exported
  `clearAllHref`, which is unit-tested — the same argument `facetHref` carries in its own comment.
- Also from Standards: `numberWord` no longer says "three" for any count above two, and one
  comment said "entry" in the sense ADR-0008 retired.
- Declined, with reasons: `facetHref`'s `key: string` stays, because step 9 says export it and
  change nothing else in that file; `searchHref` stays in `components/catalogue-search.tsx`,
  because step 3 names that file; `catalogueSentences` takes two parameters rather than the
  spec's three, because the sentences do not use `catalogueTotal` and an unused parameter is
  worse than a moved one — the total goes to `catalogueActions`, which does use it.
- One edge the Standards axis caught and this ticket now handles: an empty list with **no** filter
  on it, which is what `get-recordings.ts` returns when the Firestore read throws. The zero panel
  diagnoses filters and there are none, so it drew a blank 620px box.
  `components/catalogue-page.tsx` now hands `null` there, which already means "say nothing".

**Open questions, as shipped.**

1. **`END OF RESULTS`.** Shipped as step 5 derives it — one word, `END OF CATALOGUE` unfiltered
   and `END OF RESULTS` otherwise. The alternative in the ticket (render no rule at all when a
   filter is on) is still open and is a smaller change if preferred.
2. **Which Recording the diagnosis names.** First in `allRecordings` order, as step 1 says.
   Deterministic, no Firestore read.
3. **14px and 8px are off the Specimen's radius scale.** Both shipped as drawn, per decision 2 —
   the panels at 14px and the chips at 8px. Ticket 02 may want tokens; there is no row for either.
4. **`line2`.** Took `Catalogue.dc.html`'s value via the ticket-02 token, which is what
   `app/globals.css` already holds.

**Not built, deliberately.** The `loading` variant's tile skeleton and its
`RESERVING SPACE FOR 48` line. This ticket introduces no boundary that suspends — both grid
callers are server components holding their Recordings, `find app -name loading.tsx` returns
nothing, and `/bookmarks` reading its saves from an effect is already answered by
`emptyState: null`. The Depends-on section records where to start when a route does suspend.
