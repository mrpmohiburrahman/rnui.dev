# 05 — The rail: Categories and Contributors with counts

Status: resolved
Blocked by: 01, 02

Every line number below was read before ticket 01 ran. The rename moves `data/entry.ts` to
`data/recording.ts` and rewrites `author` throughout `components/nav/catalogue-nav.tsx`, so expect
a line-number rebase in those two files — the same rebase `14-sidebar-without-javascript.md`
anticipated for this ticket in its own `## Depends on`.

## Problem

The rail is `components/nav/catalogue-nav.tsx`, rendered twice from
`components/nav/nav-side-bar.tsx` — once into the desktop `<aside>` (`:40`) and once into the
mobile drawer (`:101-105`). It already does the hard part: `facetHref` (`:58-67`) copies the
current query so filters compose, deletes the key it is about to set when that key already holds
the same value so a second click clears it, and drops `page` because a different filter is a
different result set. `reportFacetClick` (`:81-93`) reports `filter_applied` or `filter_cleared`
off the *same* test, deliberately, so a clear is never logged as an apply. None of that changes
here. What changes is everything the visitor sees.

### (a) There are no counts, and the mock draws one on every row

`Catalogue.dc.html:43` puts `{{ c.n }}` at the end of every Category row and `:52` does the same
for every Contributor. Nothing in this repo computes either number. They are free: `allEntries`
(`data/catalogue.ts:35-54`) is one array of 277 Recordings and a count per facet is a group-by
over it, in the same file that already derives the facet lists themselves
(`data/entry.ts:13-22`).

The real numbers, counted over `allEntries`: 277 Recordings, 18 Categories, 24 Contributors.
Per Category, alphabetically — Accordions 2, Arc Sliders 2, Bottom Sheets 6, Buttons 20,
Carousels 10, Charts 9, Circular Progress Bars 3, Drop Down 1, Full Apps 5, Headers 3, List 17,
Loaders 4, Misc 148, Onboarding 6, Parallaxes 4, Pickers 1, Sliders 17, Tab bars 19. The four
Contributors with the most: `Enzo Manuel Mangano ( Reactiive )` 124, `Hewad Mubariz` 31,
`Daniel Friyia` 19, `Arunabh Verma` 16.

The mock's own `CATS` table (`Catalogue.dc.html:178`) is illustrative except for Misc 148 and the
total: its eighteen numbers sum to exactly 277, but only Misc matches the data. Take the shape
from the mock and the numbers from `allEntries`. The same applies to the names — the mock spells
`Enzo Manuel Mangano (Reactiive)`, the data spells `Enzo Manuel Mangano ( Reactiive )` with inner
spaces, and the data wins, because that string is the filter key the href carries and the key the
server matches on (`app/actions/get-entries.ts:58-62`).

### (b) What the count counts: the whole catalogue, not the other active filters

The mock settles this and the codebase confirms it.

`Catalogue.dc.html:221-224` builds `cats` from the module-level constant on every variant. In the
`filtered` variant the Category filter is Misc (`:199`), a Contributor filter is on (`:226`) and
the search box holds `ticket` (`:230`); the result line reads `2 OF 277 · 3 FILTERS` (`:214`) —
and the rail still draws `Misc 148`. Three filters are in force and not one rail number moved.

Two further pieces agree. The eighteen numbers sum to 277, which is the size of the unfiltered
catalogue and of no filtered subset. And the zero-state copy at `:102` — *"Wheel Picker is by this
contributor, but it lives in Pickers — not Misc."* — is advice to go to Pickers while the Misc
filter is still applied. Under other-filter-aware counting Pickers would read `0` at that moment,
and the number beside the row would contradict the sentence pointing at it.

The structural argument is the stronger one. The rail is rendered from `app/layout.tsx:74`, and a
Next App Router layout is never handed `searchParams` — only a page is. `CatalogueNav` gets at the
query through `useSearchParams()` on the client (`:123`), inside a Suspense boundary that exists
solely so that read does not opt the whole tree out of prerendering; the comment at `:96-110`
records what it cost the last time it leaked upward, and `14-sidebar-without-javascript.md` is the
whole ticket about it. Filter-aware counts need the filtered result set, which is produced by
`getEntries` in the page's server render (`app/actions/get-entries.ts:31-70`), so making them
filter-aware means moving the rail out of the layout into all three catalogue routes and paying
ticket 14's bill again. Whole-catalogue counts are a group-by over a module-scope array, computed
once per process, identical on every route and in the Suspense fallback.

**Decision: the counts are of the whole catalogue and never change with the query.** They read as
"how much is behind this door", which is also what makes them useful while a filter is already on.

### (c) The rail has no width, and the width `main` clears is a different number

`nav-side-bar.tsx:35` sets `w-42` on the `<aside>`. Tailwind 3.4.17's default spacing scale has no
`42` step and `tailwind.config.ts` extends no `spacing` key, so no such rule is generated —
confirmed against the build output, where `.w-36{width:9rem}` is present and `.w-42` does not
appear at all. The rail's width today is therefore its content: `w-36` (144px) on the two `<ul>`s
at `catalogue-nav.tsx:161` and `:188`, plus padding. Meanwhile `main` clears a hardcoded
`sm:ml-[10.5rem]` — 168px — at `app/layout.tsx:76`. The two numbers have never had to agree
because one of them was never real. The mock's rail is `width:232px;flex:none`
(`Catalogue.dc.html:36`).

`justify-center` on the same `<aside>` vertically centres the list in the viewport. The mock's rail
starts at the top under the header.

### (d) The chip treatment, the truncation and the icons all have to go

`CHIP_CLASS` (`:28-33`) is a four-line inset box-shadow stack copied from `PILL_CLASS` in
`components/entry-card-grid.tsx`, and `ACTIVE_CHIP_CLASS` (`:40`) is `bg-yellow-400 text-black`.
The mock's row is flat: a 7px-radius rectangle that is transparent at rest and takes a soft accent
fill and a 1px accent ring when applied.

`truncateString(category, 12)` at `:176` and `truncateString(author, 12)` at `:203` cut every label
at twelve characters, so the rail currently reads `Circular Pro...`, `Bottom Sheet...` and
`Enzo Manuel...`. The mock does not truncate in JavaScript: a Category name gets CSS ellipsis
(`overflow:hidden;text-overflow:ellipsis;white-space:nowrap`, `:42`) and a Contributor name is
allowed to wrap (`overflow-wrap:anywhere`, `:51`, on a row whose items are baseline-aligned with
`line-height:1.3`). Two Contributors in the data — `Enzo Manuel Mangano ( Reactiive )` and
`Konstantinos Efkarpidis` — are unreadable at twelve characters and legible when wrapped.

`:155-160` and `:182-187` draw a `BoxIcon` and a `User` in `stroke-pink-400` with a `md:hidden`
text label beside them, so a desktop visitor sees an unlabelled pink icon and a phone visitor sees
the words. The mock has no icons and one label per section, always visible, in mono.

### (e) All 24 Contributors are listed; the mock lists four and links to the rest

`:189` maps the whole array. The mock's `PEOPLE` holds exactly four rows
(`Catalogue.dc.html:179`, `hint-placeholder-count="4"` at `:49`) under a heading that says
`CONTRIBUTORS · 24`, followed by `All 24 contributors →` (`:56`). Four of twenty-four is not a
placeholder, it is the design: 24 rows of variable-length names is the taller half of the rail.

The mock only ever draws the easy case — its `filtered` variant highlights `people` index 0
(`:226`), a Contributor inside the drawn four. Twenty of the twenty-four are not, including
`William Candillon` (10) and `Kacper Kapuściak` (8), and filtering by one of those would leave the
rail with no row showing the filter and no row to click to clear it.

### (f) The `ScrollArea` ceiling is now removable

`:140` wraps both lists in a Radix `ScrollArea` at `h-[calc(100vh-320px)] md:h-[calc(100vh-200px)]`.
`14-sidebar-without-javascript.md`'s open questions record the defect and why it was left: the
viewport needs JavaScript to scroll, so a visitor without it sees the Categories and can never
reach the facets below them — and fixing it changes the scrollbar's appearance, which
`ui-ux-overhaul` decision 1 froze. `spec.md:15-19` supersedes decision 1. The reason the ceiling
existed is gone, so it comes out here rather than becoming permanent.

### What must survive

The composed hrefs, the clear-on-second-click behaviour and the two analytics calls at those same
links are `ui-ux-overhaul` ticket 11's shipped work and are asserted by
`tests/e2e/filters.spec.ts`. Two of that file's assertions are coupled to what this ticket
changes and will fail unless they are changed with it: the `facet()` locator at `:37-40` finds a
link by `truncateString(name, 12)`, and `:65-66` asserts the active facet has class
`bg-yellow-400`.

## Work

1. **`data/recording.ts` — two count maps.** Beside `getUniqueCategories()` and
   `getUniqueContributors()`, add `RECORDINGS_PER_CATEGORY` and `RECORDINGS_PER_CONTRIBUTOR`, each
   a `Record<string, number>` built by one pass over `allRecordings` at module scope. Constants
   rather than functions: the answer is the same for the life of the process, 277 iterations, and this
   module is in the client graph (`app/actions/get-entries.ts:18-22` records why), so it must gain
   no import to do this.

2. **`data/recording.ts` — the Contributor order.** Add
   `contributorsByCount(): Array<{ name: string; count: number }>`, sorting the map's entries by
   count descending and breaking ties with `localeCompare` on the name, so the list is stable when
   the data changes. Categories keep the alphabetical order `getUniqueCategories()` already
   produces — the mock's `CATS` is alphabetical and all 18 are drawn, so nothing about them needs
   reordering. Only Contributors are ranked, and only because the rail shows four of them and "the
   four with the most Recordings" is the only defensible four.

3. **`app/layout.tsx:23-24, 74` — pass counts, not bare names.** `NavSidebar` and `CatalogueNav`
   take `categories: Array<{ name: string; count: number }>` (all 18, alphabetical) and
   `contributors: Array<{ name: string; count: number }>` (all 24, count descending). Pass all 24,
   not four: the rail slices, and `contributors.length` is the `24` in both the section label and
   the link, so no separate total prop can drift from the list.

4. **`components/nav/catalogue-nav.tsx` — the top four, with the active one pinned.** Inside
   `CatalogueNavList`, render `contributors.slice(0, 4)`, and if `searchParams.get("contributor")`
   names a Contributor that is not among them, append that one as a fifth row. Without the pin, a
   filter on any of the other twenty draws a rail that shows no filter at all, which decision 2
   forbids. The pin depends on the query, so it lives here rather than in the layout, and the
   Suspense fallback — which has no params (`:133`) — shows the plain four. That is the same
   fallback-differs-from-resolved shape ticket 14 already accepted for the active highlight.

5. **`components/nav/nav-side-bar.tsx:34-41` — the rail container.** The `<aside>` becomes
   `w-[232px]` (`Catalogue.dc.html:36`), loses `justify-center` so the list starts at the top,
   loses `bg-[#FAFAFA] dark:bg-background` in favour of the token ticket 02 binds to `railBg`
   (`#0C0D11` dark / `#EFEFEB` light), and gains a right border in `line`
   (`rgba(255,255,255,0.11)` dark / `rgba(16,18,22,0.13)` light). Inner padding `20px 16px 30px`.
   Ticket 04 owns both `app/layout.tsx:73` and `:76` — it puts the rail in flow and deletes
   `<main>`'s left margin — so this ticket sets no offset outside the `<aside>` itself, and the
   header's height is set from one place only.

6. **Section labels.** Replace the icon-plus-`md:hidden`-text pairs at `:155-160` and `:182-187`
   with one label each, in the mono family ticket 02 registers: `font-size:9px`,
   `letter-spacing:0.16em`, colour `t3` (`#8E949F` dark / `#666B74` light), padding `0 8px 9px`
   for `CATEGORIES` and `22px 8px 9px` for `CONTRIBUTORS · ${contributors.length}` — the extra
   22px above is the only gap between the two lists (`Catalogue.dc.html:37,47`). Delete the
   `BoxIcon` and `User` imports at `:8`. Note the label's `0.16em` differs from the Specimen's
   `mono 9 / +14% · labels` (`Specimen.dc.html:144`); the Catalogue draws `0.16em` on this
   element and the mock ships as drawn.

7. **The Category row.** Each row is
   `display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:7px;font-size:12.5px`,
   with `outline-offset:1px`, in a column with `gap:1px` (`Catalogue.dc.html:38-44`). The 7px
   radius sits between the Specimen's `9 — chip, control` and `6 — badge, tag`
   (`Specimen.dc.html:148`); the Catalogue draws 7 and it ships as drawn. Three children in order:
   a `5×5px` dot with `border-radius:3px` and `flex:none` (`:41`); the name with
   `overflow:hidden;text-overflow:ellipsis;white-space:nowrap` (`:42`); the count with
   `margin-left:auto`, mono `10px`, `font-variant-numeric:tabular-nums` (`:43`). States, from
   `:223`:

   | | rest | applied |
   |---|---|---|
   | background | `transparent` | `accSoft` — `rgba(111,227,204,0.13)` dark / `rgba(14,112,98,0.09)` light |
   | name | `t2` — `#B2B8C2` / `#4F545C` | `t1` — `#F1F2F4` / `#14161A` |
   | count | `t3` — `#8E949F` / `#666B74` | `acc` — `#6FE3CC` / `#0E7062` |
   | dot | `rgba(255,255,255,0.16)` dark / `rgba(16,18,22,0.16)` light | `acc` |
   | outline | `none` | `1px solid acc` |

   The dot is one flat neutral in the rest state, not a per-Category colour. It is not the hue
   ticket 03 measures — that is per Recording and lives on the tile.

8. **The Contributor row.** Same padding, radius and outline offset, but
   `align-items:baseline`, `font-size:12px`, `line-height:1.3`, the name with
   `overflow-wrap:anywhere` so long names wrap instead of truncating, the count with
   `margin-left:auto;flex:none` and **no** `tabular-nums` (`Catalogue.dc.html:50-53`). No dot. The
   same four state values as the table above, minus the dot row (`:227`).

9. **The link.** Below the list, `padding:10px 8px 0`, `font-size:11.5px`, colour `acc`,
   `text-decoration:underline`, `text-underline-offset:3px`, reading
   `All ${contributors.length} contributors →` (`Catalogue.dc.html:56`). Point it at
   `/contributors`. That route does not exist until ticket 10 builds it; the string is fixed here
   so ticket 10 does not have to come back and edit the rail, and ticket 10 must land before
   deploy B or decision 2 is broken by the one link the mock draws to it.

10. **Keep an unfiltered row, restyled.** `:146-153` renders an `All Entries` link, put there by
    `ui-ux-overhaul` decision 13 because nothing on the site linked to the unfiltered `/products`
    — every route in, the facets and the 18 legacy redirects (`data/categories.ts:67-70`), arrived
    with a filter already applied. The mock does not draw it, and `spec.md:165-167` checkpoint 4
    says to read the reason before overriding a decision. The reason still holds until ticket 08's
    `Clear all` ships, and even then it only appears when a filter is on. So it stays, as a row in
    the same grammar: `All recordings` on the left, the total on the right, above the `CATEGORIES`
    label, with no dot and no applied state. If the maintainer wants the rail exactly as drawn,
    this is the one row to delete, and not before 08.

11. **Hover, focus and motion.** The mock is static and draws neither, so both are derived from
    tokens it already uses. Hover: background to `fieldBg` (`rgba(255,255,255,0.045)` dark /
    `#FFFFFF` light) and name to `t1` — a lift that cannot be confused with the applied state,
    which is tinted accent rather than neutral. Transition `120ms ease-out` on `background-color`
    and `color`, the Specimen's own figure for *"Filter chip add / remove"*
    (`Specimen.dc.html:163`), and a rail row is that control. Focus: `:focus-visible` draws
    `outline: 3px solid acc; outline-offset: 2px` (`Catalogue.dc.html:78`). It **replaces** the
    applied state's `1px solid acc` rather than stacking, because an element has one outline; the
    accent fill still marks which row is on. `:focus-visible`, not `:focus`, so a mouse click
    draws nothing — `07-keyboard-focus-and-contrast.md` is the ticket that established that rule
    here. Reduced motion needs no new rule: ticket 13 owns the global durations and
    `ui-ux-overhaul` ticket 09 already ships the zero-duration path.

12. **Drop the `ScrollArea`.** Replace `:140` with the nav element scrolling natively
    (`overflow-y-auto`, `min-height:0`), and delete the import at `:12`. This closes the open
    question in `14-sidebar-without-javascript.md`: the Radix viewport needs JavaScript, so
    without it the Contributors below the Categories were unreachable. It also removes a Radix
    dependency from a list of links, and cutting the Contributor rows from 24 to four cuts what
    there is to scroll — the served HTML carries this list twice, once as the fallback and once
    inside the hidden div, which is the other cost ticket 14 recorded.

13. **Delete what is now unused.** `CHIP_CLASS` (`:28-33`), `ACTIVE_CHIP_CLASS` (`:40`), the
    `truncateString` import (`:11`), the `BoxIcon`/`User` imports (`:8`), the `ScrollArea` import
    (`:12`), and the `children` prop (`:18`, `:139`) — neither call site in `nav-side-bar.tsx`
    passes children. Leave `truncateString` in `lib/utils.ts`; check its callers first. Also delete
    the desktop `<aside>`'s own bottom-controls block, `nav-side-bar.tsx:44-47`, which renders a
    second `ModeToggle`: ticket 04 step 9 moves the toggle into the header, and two in one viewport
    is one too many. The drawer's copy at `:137-141` stays — it is the only toggle a phone
    has until ticket 11 rebuilds that sheet — so the `ModeToggle` import at `:11` stays too.

14. **`tests/e2e/filters.spec.ts`.** The `facet()` locator at `:37-40` must match the full name and
    drop the `truncateString` import at `:4`; without this every filter test fails on a locator,
    not on the behaviour. `:65-66`'s `toHaveClass(/bg-yellow-400/)` must become an assertion on
    the new applied treatment. Add one test that asserts the counts do not move: load
    `/products?category=Misc&contributor=Hewad+Mubariz&search=ticket` and assert the Misc row still
    reads 148 — that is the decision in (b), and it is the kind of thing a later "improvement"
    quietly reverses.

15. **Write the decision down.** A comment above the count maps in `data/recording.ts` saying the
    counts are of the whole catalogue and why — the layout has no `searchParams`, and making them
    query-aware moves the rail into every catalogue route.

## Acceptance

- `grep -n "truncateString\|bg-yellow-400\|CHIP_CLASS\|ScrollArea\|BoxIcon" components/nav/catalogue-nav.tsx`
  returns nothing.
- On `/products` at 1440px, the rail measures 232px wide and `main` starts at x=232 with no gap or
  overlap.
- The `CATEGORIES` list has 18 rows and their numbers read 2, 2, 6, 20, 10, 9, 3, 1, 5, 3, 17, 4,
  148, 6, 4, 1, 17, 19 from top to bottom, summing to 277.
- The second label reads `CONTRIBUTORS · ${contributors.length}` — `24` on today's data, `23` once
  ticket 10 deletes the trailing space in `data/fullapps.ts:23` — and the link below reads
  `All ${contributors.length} contributors →` with the same number in it, never a literal, and its
  `href` is `/contributors`. Four Contributor rows follow, in the order
  `Enzo Manuel Mangano ( Reactiive )` 124, `Hewad Mubariz` 31, `Daniel Friyia` 19,
  `Arunabh Verma` 16 — an order that does not move when the total does.
- No Category or Contributor label is rendered with a trailing `...`; `Circular Progress Bars`
  renders in full or ellipsised by CSS at the row's own width, and
  `Enzo Manuel Mangano ( Reactiive )` wraps to two lines rather than being cut.
- On `/products?category=Misc&contributor=Hewad+Mubariz&search=ticket` the Misc row still reads
  148 and the Hewad Mubariz row still reads 31 — no rail number differs from the unfiltered page.
- On `/products?contributor=Kacper+Kapu%C5%9Bciak` the rail shows five Contributor rows, the fifth
  being Kacper Kapuściak, marked applied.
- An applied row has the accent-tinted fill, a 1px accent ring at 1px offset, its name in `t1` and
  its number in `acc`; a Category's dot is `acc` when applied and the flat 16% neutral otherwise.
- Clicking an applied Category row removes `category=` from the URL and leaves `contributor=` and
  `search=` intact; `pnpm test:e2e tests/e2e/filters.spec.ts` passes.
- Clicking an unapplied row fires `filter_applied` with `facet: "category"` or
  `facet: "contributor"` and the right `active_filter_count`; clicking an applied one fires
  `filter_cleared`. Verified in the PostHog debug view or a network capture, not by reading the
  code.
- Tab reaches every row in the rail in document order and each draws a 3px accent ring at 2px
  offset; clicking the same rows with a mouse draws no ring.
- With JavaScript disabled at 1440×800, the served HTML of `/aboutus` contains a real `<aside>`
  with one `<a href="/products?category=…">` per Category plus the Contributor rows, and the list
  can be scrolled to its last row. `grep -c "Loading sidebar"` on `/`, `/products`, `/bookmarks`
  and `/aboutus` still returns 0.
- Contrast, measured against `railBg` in each mode: `t2` name 9.74 dark / 6.61 light, `t3` count
  6.37 dark / 4.65 light; on an applied row composited over `railBg`, `t1` name 13.48 / 13.95 and
  `acc` count 9.73 / 4.60. All clear 4.5:1. The two tight ones are both in light mode, so `accSoft`
  and `t3` may not be lightened without re-measuring.
- `pnpm build`'s route table is unchanged — every route that is `○` today is still `○`.

## Depends on

**01**, because the rename is the vocabulary this file is written in. Ticket 05 renders a
`CONTRIBUTORS` heading, links carrying `?contributor=`, a `Facet` union whose second member is
`"contributor"`, and imports from `data/recording.ts`. Writing it before 01 means writing `author`
in every one of those places and rewriting it days later, against `spec.md:94-100`, which puts the
rename first precisely because `?contributor=` is not yet deployed and is free to change today.

**02**, because the rail is the first surface in the effort that needs `railBg`, `accSoft` and the
mono face, and none of them exist yet — `app/globals.css` defines a neutral shadcn palette and
`tailwind.config.ts` has no `fontFamily` override at all. Building the rail first means
hard-coding `#0C0D11` and `rgba(111,227,204,0.13)` into a component and giving the site two
sources of truth for its palette, which is the mistake ADR-0004 exists to prevent in the
vocabulary and the same mistake in colour. `spec.md:179` leaves this ticket's dependency column
blank; it should read *needs 02*.

**Couplings that are not blockers.** Ticket 04 also edits `app/layout.tsx` and owns the header's
height, so the two will conflict textually; this ticket touches only `:23-24` and `:74`, and sets
neither the header's height nor `<main>`'s left offset. Ticket 08 owns the filter chip bar whose `Clear all` is the other route
to the unfiltered catalogue, which is what would make step 10's row deletable. Ticket 10 owns
`/contributors`, the destination of the link in step 9 — the rail is the only place in the whole
mock that links to it, so 10 cannot slip past deploy B. Ticket 11 owns the mobile bottom sheet;
until it lands, the drawer at `nav-side-bar.tsx:101-105` inherits this restyled rail, which is not
what `CatalogueMobile.dc.html:58-68` draws for a phone. That is a known interim appearance, not a
regression, and `tests/e2e/filters.spec.ts:179-201` must still pass in the meantime.

## Comments

### 2026-08-03 — Rail rebuilt and verified. Committed with the ticket.

All fifteen steps done. The rail is now the mock's flat 7px-radius rows without icons, chips or
truncation, with whole-catalogue counts (`RECORDINGS_PER_CATEGORY` / `RECORDINGS_PER_CONTRIBUTOR`
in `data/recording.ts`), a `232px` wide `<aside>` on token `railBg`, the ledger-style labels
(`CATEGORIES`, `CONTRIBUTORS · 24`, `All 24 contributors →` → `/contributors`), and the top-four
Contributors by count with the active one pinned as a fifth row when it is outside the four. The
Radix `ScrollArea` is gone — the list scrolls natively.

Verified, not read: `tsc --noEmit` clean; all 201 unit tests pass (including the new
`tests/recording-counts.test.ts` pinning every count and the contributor order); the full
Playwright suite passes 124/124, including three new rail tests (counts don't move with filters,
the pin, and the 232px geometry); `pnpm build`'s route table is unchanged; `pnpm format:check`
clean; eslint 0 errors. `truncateString` stays in `lib/utils.ts` with no callers, per step 13.

**Review-driven corrections (also part of this ticket).** `/code-review-mp` caught two things, both
fixed before commit. The Category dot's two rest colours were swapped — white at rest on the light
`railBg`, near-black on dark, i.e. invisible in both modes; now `rgba(16,18,22,.16)` light /
`rgba(255,255,255,.16)` dark per step 7, both legible against their own `railBg`. And the rail had
been built `w-[168px] lg:w-[232px]`; the mock and step 5 both draw a flat 232px, and a flat
`w-[232px]` was verified against every `sm`+ no-sideways-scroll width in
`nav-empty-states-layout.spec.ts` (all 52 green) — so the intermediate 168px was dropped as
unneeded scope. The reviewer's lone standards note, extracting the Category/Contributor rows into
a shared `FacetRow`, was deliberately left unmade: the two rows differ in five respects (dot, a
baseline vs center, two font sizes, `tabular-nums` presence, truncate-vs-wrap) and collapsing them
beneath variant flags is the over-abstraction the smell is the guard against.
