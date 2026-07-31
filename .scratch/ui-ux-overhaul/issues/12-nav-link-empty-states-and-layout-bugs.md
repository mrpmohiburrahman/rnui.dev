# 12 — Add the missing nav link, the missing empty states, and fix two layout bugs

Status: resolved
Blocked by: 02

Decision 13 (`spec.md:32`) and the two sanctioned layout bugs (`spec.md:98`). Four small,
independent changes in four files.

Three of the four move pixels, which decision 1 otherwise forbids. Each is authorised
separately: the nav link by decision 13, the two layout fixes by `spec.md:98`, and the empty
states only in a state that renders nothing at all today.

## Problem

### Corrections to the brief

- **"Nothing in the nav links to `/products`" is true only of the *unfiltered* page.**
  `grep -rn 'href="/products"'` over `app/` and `components/` returns nothing, but
  `catalogue-nav.tsx:48` links to `/products?category=…` and `:77` to `/products?author=…`,
  and `middleware.ts:23-43` redirects 18 legacy paths there (`data/categories.ts:68-70`
  builds each destination as `/products?category=…`). So the busiest page is reachable only
  with a filter already applied. The whole catalogue has no link.
- **The 19px overlap is not on "every page" at every width.** `TopNavBar` is wrapped in
  `hidden md:block` (`app/layout.tsx:50-52`), so it renders at ≥768px only. Below that the
  same `pt-16` clears the absolutely-positioned mobile menu trigger
  (`nav-side-bar.tsx:83-90`, `top: 10` plus `h-10`), which is why the fix below is a `md:`
  variant and not a replacement.
- **The "~202px track" figure does not reproduce and no number is asserted here.** Working
  the class chain by hand at a 640px viewport gives 184px, and the answer turns on whether
  `<main>` (`app/layout.tsx:59`, `w-full` plus a 168px `sm:ml-[10.5rem]`) shrinks to fit its
  own margin or is floored by its `min-width: auto`, which I did not measure in a browser.
  The mechanism below is verified from the CSS; the arithmetic is not. Step 6 measures it.
- **The two pageview figures in the repo disagree by one** — `spec.md:108` records
  3,554/1,826, `issues/05-delete-dead-weight.md:74` records 3,555/1,825. It is a rolling
  90-day window, so both are snapshots. The load-bearing fact is the ratio, roughly 2:1.

### (a) The full catalogue is unreachable from the nav

`top-nav-bar.tsx:30-46` offers Bookmarks and Subscribe, `:50-62` an external GitHub link.
The mobile sheet adds Subscribe, Bookmarks and Home (`nav-side-bar.tsx:135-161`) and renders
only under a trigger that is `sm:hidden` (`:100`). Between 640px and 767px there is no top
nav and no sheet trigger, so the desktop aside (`nav-side-bar.tsx:42-80`) is the only nav —
and it renders `CatalogueNav`, which is filter links only.

### (b) Nothing is rendered when there is nothing to render

`grep -rniE "no results|nothing (here|yet)|no entries|no matches"` over `app/` and
`components/` returns nothing. Both empty paths land on the same grid:

- Zero matches — `get-entries.ts:52-71` filters the catalogue down to `[]`, which reaches
  `entry-card-grid.tsx:199` and maps to no cards. The only thing on screen is
  `Total Items: 0` (`:183`).
- `/bookmarks` with nothing saved — `app/bookmarks/page.tsx:35` returns before fetching, so
  `entries` stays `[]`, `catalogue-page.tsx:53-59` filters `[]`, and the same empty grid
  renders under the `Bookmarks` heading (`app/bookmarks/page.tsx:50`).

`CataloguePage` is the only caller of `EntryCardGrid`, so one branch in the grid covers `/`,
`/products`, every filter and `/bookmarks`.

### (c) A fixed-width card inside a fractional track

`entry-card.tsx:135` sets `w-full sm:w-[221px]`. From `sm` up the card is 221px no matter
what, while `entry-card-grid.tsx:198` lays it out in `grid-cols-1 sm:grid-cols-2
md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6` — Tailwind's `repeat(n, minmax(0, 1fr))`,
i.e. equal tracks that are narrower than 221px at the low end of every band. Where the track
is narrower, each card overlaps its right-hand neighbour and the last one in the row runs
past the grid container, where `overflow-hidden` on the root (`entry-card-grid.tsx:51`)
clips it. 221px is correct at exactly one viewport width per breakpoint and wrong either
side of it.

`break-inside-avoid` on the same line is inert: `grep -rn "columns-"` over `app/` and
`components/` returns nothing, so no ancestor establishes a multi-column context.

### (d) An 83px nav against a 64px offset

`top-nav-bar.tsx:18` is `h-[83px] fixed top-0`. `app/layout.tsx:53` offsets the content with
`pt-16`, which is 64px. At ≥768px the top 19px of every page is painted over by the header's
opaque `bg-background`.

## Work

**A — the nav link**

1. `components/nav/catalogue-nav.tsx` — insert one `<Link href="/products">` as the first
   child inside the `ScrollArea` (`:36`), above the Categories block at `:38-43`. Give it
   `prefetch={false}` and `onClick={handleLinkClick}` like every other link in the file, and
   the class string the category links already use (`:50-54`) **without** the active-state
   ternary at `:55-57`. Label it `All Entries`. Add no icon, no heading, no wrapper `<ul>`.
2. Do not touch `top-nav-bar.tsx`. `CatalogueNav` renders in both the desktop aside
   (`nav-side-bar.tsx:59`) and the mobile sheet (`:127`), so one insert covers every
   viewport; `TopNavBar` is invisible below 768px.

**B — the empty states**

3. `components/entry-card-grid.tsx` — add `emptyMessage: string` to `EntryCardGridProps`
   (`:22-33`) and destructure it. At `:196-211`, when `sortedData.length === 0`, render
   `<p className="text-sm text-neutral-700 dark:text-neutral-300">{emptyMessage}</p>` in
   place of the grid `<div>`. Reuse that class string exactly — it is already in use at
   `entry-card.tsx:191`; introduce no colour, size or spacing value that is not already in
   the file. Leave the `Total Items` button at `:177-184` untouched.
4. `components/catalogue-page.tsx:72-82` — pass the copy, which is the only place that knows
   which page this is:
   - `bookmarkedOnly` → `No bookmarked Entries yet. Bookmarks are kept in this browser on
     this device — there are no accounts, so they do not follow you to another browser or
     another device.`
   - otherwise → `No Entries match the current search or filters.`

   One string per case, no per-route logic beyond this ternary. The bookmarks copy is
   required to be plain about local-only storage (`spec.md:117-118`); do not soften it into
   "sign in to sync" or anything else that implies an account exists.

**C — the card width**

5. `components/entry-card.tsx:135` — delete `sm:w-[221px]` and `break-inside-avoid`, leaving
   `className="group relative w-full cursor-pointer"`. Change nothing else on that element.
   If ticket 02 has already landed, the element is a plain `<div>` with the same string;
   edit whichever is present.
6. Before and after, at 640, 768, 1024, 1280 and 1440px on `/` and `/products`, record for
   the first row of cards: the computed track width, each card's `getBoundingClientRect()`
   width, and `scrollWidth` vs `clientWidth` on `entry-card-grid.tsx:198`. Put the before
   and after tables in the PR. This is the ticket's only evidence that the clipping was real
   and is gone; do not skip it and do not substitute the arithmetic above for it.

**D — the nav offset**

7. `app/layout.tsx:53` — `pt-16` → `pt-16 md:pt-[83px]`, with a one-line comment naming
   `components/nav/top-nav-bar.tsx:18` as the height this mirrors. Leave the base `pt-16`:
   below `md` no header renders and that padding clears the mobile trigger.

**Finally**

8. `pnpm check-types && pnpm lint && pnpm test`, plus the Playwright suite.

## Acceptance

- `grep -rn 'href="/products"' app components` returns exactly one hit, in
  `components/nav/catalogue-nav.tsx`. Clicking it from a 390px viewport (sheet) and a 700px
  viewport (aside) lands on `/products` with no query string and the full Entry count.
- The link's `class` attribute is byte-identical to a non-active category link's.
- `/products?search=zzzzz` renders the sentence `No Entries match the current search or
  filters.` and no card. Same for `/?search=zzzzz` and `/products?category=Buttons&author=x`.
- `/bookmarks` in a browser profile with an empty `bookmarks` key renders the bookmarks
  sentence under the `Bookmarks` heading, and that sentence contains the words
  "this browser", "this device" and "no accounts".
- `grep -rniE "sign in|log ?in|account|sync" ` over the two new strings returns only the
  word "accounts" inside the negation.
- After bookmarking one Entry, `/bookmarks` shows one card and no sentence.
- At 640, 768, 1024, 1280 and 1440px, on `/` and `/products`: every card's measured width
  equals its grid track's width to within 1px, no card's right edge exceeds its grid
  container's content box, and `scrollWidth === clientWidth` on the grid element.
- `rg "221px|break-inside" components/` returns nothing.
- At 768px and 1440px, `document.querySelector("main").getBoundingClientRect().top` is
  ≥ 83, and the first heading on `/`, `/products` and `/bookmarks` is fully visible with the
  header's background not overlapping it. At 390px that value is unchanged from before this
  ticket.
- Screenshot diff at 390px, 768px and 1440px on `/`, `/products` and `/bookmarks`, light and
  dark, shows changes in exactly three places: the new sidebar link, the 19px shift at
  ≥768px, and the card widths. Nothing else moves.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and the Playwright suite pass.

## Open questions

1. **The label `All Entries`.** It follows CONTEXT.md's vocabulary, but every other string
   the visitor sees in that sidebar is a Category name, and the page heading on `/products`
   is the active filter. If the maintainer prefers `All`, `Browse all` or `Everything`, it is
   a one-word edit — do not agonise, ship `All Entries` and change it if asked.
2. **Where the link sits.** Placed first inside the `ScrollArea`, so it scrolls away with the
   Categories list and pushes that list down by one row. Placing it above the `ScrollArea`
   would pin it, at the cost of `h-[calc(100vh-320px)]` at `catalogue-nav.tsx:36` no longer
   matching its container. Not decided here because either choice changes the sidebar's
   appearance and only the maintainer can weigh which.
3. **Whether `Total Items: 0` should stay beside the empty sentence.** Left alone, because
   hiding it is a second decision about a counter that is correct. Raise it if it reads badly
   once the sentence is there.
4. **Horizontal overflow at narrow widths.** While deriving (c) I could not rule out that
   `<main>` is floored by the min-content width of the sort-controls row
   (`entry-card-grid.tsx:63-186`) and overflows the viewport at ≤768px. Step 6's measurements
   will show it. If `document.documentElement.scrollWidth > clientWidth` at 390px or 640px,
   that is a third layout bug — report it, do not fix it here.

## Depends on

Nothing, but three files are contested:

- `components/entry-card.tsx:135` — ticket 02 step 1 replaces this element's tag. Whichever
  lands second edits the tag that is there; the `className` edit is the same either way.
- `components/nav/catalogue-nav.tsx` — ticket 05 step 8 deletes the Tags and Labels blocks
  (`:96-156`). Different region, but expect a rebase.
- `components/entry-card-grid.tsx` — ticket 02 also edits `:198-201`. Land 02 first if both
  are open.

## Comments

All four changes landed. `pnpm check-types`, `pnpm lint`, `pnpm test` (166) and the Playwright
suite (86, including 26 new in `tests/e2e/nav-empty-states-layout.spec.ts`) pass.

**A — the nav link.** `components/nav/catalogue-nav.tsx`: one `<Link href="/products">All
Entries</Link>`, first child of the `ScrollArea`. `grep -rn 'href="/products"' app components`
returns exactly one hit, this one. The chip class string was extracted to `CHIP_CLASS` (and the
active highlight to `ACTIVE_CHIP_CLASS`) rather than spelled a third time, which is what makes
the new link's `class` attribute byte-identical to an inactive Category link's — asserted in a
test rather than eyeballed. Open question 1 shipped as `All Entries`; open question 2 shipped
first-inside-the-`ScrollArea` as written.

**B — the empty states.** `emptyMessage` on `EntryCardGridProps`, rendered in place of the grid
when the list is empty; copy chosen in `catalogue-page.tsx`. Open question 3: `Total Items: 0`
left beside the sentence, and it reads fine — see the bookmarks screenshot.

**C — the card width.** `sm:w-[221px]` and `break-inside-avoid` gone.
`grep -rnE '221px|break-inside' components/` returns nothing.

**D — the nav offset.** `pt-16` → `pt-16 md:pt-[83px]` in `app/layout.tsx` (the ticket says
`:53`; the line is `:50` on this branch).

### Step 6 — the measurements

Chromium, dev server, first row of cards. "track" is the computed first `grid-template-columns`
track on `entry-card-grid.tsx`'s grid; "card" is `getBoundingClientRect().width`.

Before:

| path | width | track | card | scrollW/clientW | clipped |
|---|---|---|---|---|---|
| `/` | 640 | 206.9 | 221 | 452/438 | yes |
| `/` | 768 | 146.7 | 221 | 562/488 | yes |
| `/` | 1024 | 168 | 221 | 797/744 | yes |
| `/` | 1280 | 180.8 | 221 | 1040/1000 | yes |
| `/` | 1440 | 212.8 | 221 | 1168/1160 | yes |
| `/products` | 640 | 206.9 | 221 | 452/438 | yes |
| `/products` | 768 | 141.3 | 221 | 552/472 | yes |
| `/products` | 1024 | 164 | 221 | 785/728 | yes |
| `/products` | 1280 | 177.6 | 221 | 1027/984 | yes |
| `/products` | 1440 | 209.6 | 221 | 1155/1144 | yes |

After:

| path | width | track | card | scrollW/clientW | clipped |
|---|---|---|---|---|---|
| `/` | 640 | 206.9 | 206.9 | 438/438 | no |
| `/` | 768 | 146.7 | 146.7 | 488/488 | no |
| `/` | 1024 | 168 | 168 | 744/744 | no |
| `/` | 1280 | 180.8 | 180.8 | 1000/1000 | no |
| `/` | 1440 | 212.8 | 212.8 | 1160/1160 | no |
| `/products` | 640 | 206.9 | 206.9 | 438/438 | no |
| `/products` | 768 | 141.3 | 141.3 | 472/472 | no |
| `/products` | 1024 | 164 | 164 | 728/728 | no |
| `/products` | 1280 | 177.6 | 177.6 | 984/984 | no |
| `/products` | 1440 | 209.6 | 209.6 | 1144/1144 | no |

The clipping was real at every one of the ten measurements, not at "the low end of every band" —
221px never once matched a track. `main.getBoundingClientRect().top` went 64 → 83 at 768 and
1440 on `/`, `/products` and `/bookmarks`, and stayed 64 at 390.

### Three things for the maintainer

1. **One edit beyond step 5, which said "change nothing else on that element".** Removing the
   fixed width exposed a second overflow *inside* the card: the footer row is three social
   icons (a fixed 20px each) and the word "Source", a 129px min-content width against a 93px
   card content box at the narrower tracks. Step 5 alone therefore could not satisfy its own
   acceptance line — `scrollWidth === clientWidth` still failed at 768px, with "Source" running
   off the card. `flex-wrap gap-y-2` on that row (`entry-card.tsx:290`) is the fix; it is inert
   at every width where the row already fitted, and where it engages the card grows one line
   taller. That is a fourth thing moving against "Nothing else moves", so it is flagged rather
   than buried. Reverting it means shipping visible overflow.
2. **Open question 4 is a real third bug, not fixed here as instructed.**
   `document.documentElement.scrollWidth > clientWidth` at 640px on both `/` and `/products` —
   before this ticket and after it, unchanged. Not caused by the card width and not cured by
   fixing it. 390px is clean. Needs its own ticket.
   **Resolved in the follow-up commit**, at the maintainer's instruction to fix rather than
   file. The cause: at 640px the sidebar appears and `main` picks up its 168px left margin,
   leaving 440px of content box, while the sort controls turn horizontal at the same breakpoint
   with a 470px min-content — three sort pills at 278px and two status pills at 191px, neither
   able to shrink. A flex item cannot go below its min-content, so `main` was floored at 502px
   and the document scrolled sideways for the 640–670px band. That row now wraps, and
   `gap-y-4` replaces `space-y-4 sm:space-y-0` because `space-y` puts a margin on the first item
   of a wrapped line. Swept every width from 320 to 1600 in 10px steps on `/products`: no
   document overflow and no grid overflow at any of them.
3. **`tests/e2e/entry-route.spec.ts` "the panel fades and never scales" is flaky.** It failed
   once in a full run and passed on every re-run, alone and in suite. It samples overlay opacity
   across frames and gets one distinct value when the fade completes before the first sample.
   Nothing in this ticket touches the overlay. Ticket 08's file.
   **Resolved in the follow-up commit.** The sampler was 25 round-trips of `page.evaluate` with
   an 8ms wait between them, which is not a frame clock — a CDP round-trip costs more than a
   frame on a loaded machine, so a whole exit animation could finish inside two polls. It now
   installs a `requestAnimationFrame` recorder in the page and reads the whole recording out in
   one call at the end, so it samples every frame the browser paints. The full suite has since
   run clean three times consecutively.

### From the review

`/code-review-mp` caught a defect worth recording: on `/bookmarks`, `emptyMessage` keyed on the
*rendered* list told a visitor who does have bookmarks that they have none, for the length of
the `getEntries()` round trip that route fires from an effect. The rendered list is empty during
that window; the stored set is not. `emptyMessage` is now `string | null`, null meaning "not
known yet", and the bookmarks copy is keyed on `bookmarks?.length === 0` — the stored set, which
is the thing that actually answers the question. Regression test: "a held fetch never claims the
visitor has no bookmarks", verified red against the old predicate before being made green.
