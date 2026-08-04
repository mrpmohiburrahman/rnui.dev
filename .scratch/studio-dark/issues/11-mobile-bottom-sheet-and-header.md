# 11 — Mobile: the bottom sheet and the phone header

Status: ready-for-human
Blocked by: 04, 05, 08

## Problem

At phone width the mock replaces the entire filter surface. `assets/new-ui/CatalogueMobile.dc.html`
draws a fixed bar across the bottom of the viewport holding `⚙ Filters` and `↕ Recent` (`:44-47`),
and a bottom sheet above it holding Categories, Contributors, sort and two actions (`:50-80`). What
this repo has instead is a left-side drawer opened from a pill in the top-left corner
(`components/nav/nav-side-bar.tsx:74-148`), which is the same list the desktop rail renders, at the
wrong edge and in the wrong grammar.

### What the mock collapses, and what ticket 04 has already done

Read against `assets/new-ui/Catalogue.dc.html`, the 1440px drawing of the same page:

| | desktop | phone | whose |
|---|---|---|---|
| brand | `rnui.dev` 16px/700 plus `RN UI RECORDINGS` mono 9.5px (`Catalogue:14-16`) | `rnui.dev` 15px/700, tagline gone (`CatalogueMobile:14`) | 04 step 10 |
| counter | `277 recordings · 24 contributors · updated 13h ago`, `min-width:236px` mono 10px (`Catalogue:18`) | `277 · 24 · 13H AGO`, `min-width:104px` mono 9px `letter-spacing:0.1em` (`CatalogueMobile:15`) | 04 step 10 |
| search | in the header row, `flex:1;max-width:400px;height:34px`, with a `/` key chip (`Catalogue:19-23`) | its own row below, `min-height:40px`, no `/` chip (`CatalogueMobile:19-22`) | 04 step 10 |
| sort | three mono pills `RECENT` `MOST VIEWED` `MOST VOTED` in the header (`Catalogue:24-28`) | gone from the header; a dock button `↕ Recent` and a SORT block in the sheet (`CatalogueMobile:46`, `:69-74`) | **this ticket** |
| Saved | `◆ Saved 3` with the word (`Catalogue:30`) | `◆ 3`, `min-height:36px` (`CatalogueMobile:16`) | 04 step 10 |
| mode toggle | `◐ Dark` / `◑ Light` (`Catalogue:31`, `:243`) | the bare glyph `◐` / `◑` (`CatalogueMobile:17`, `:115`) | 04 step 10 |
| rail | 232px `<nav>` with all 18 Categories and 4 Contributors (`Catalogue:36-57`) | absent; the sheet is the only route to a facet | **this ticket** |
| filter chips | inside `<main>`: `3 ACTIVE`, three chips including SEARCH, `Clear all` (`Catalogue:76-82`) | inside the header: two chips, `CAT` / `BY`, no `3 ACTIVE`, no `Clear all` (`CatalogueMobile:24-29`) | **this ticket** |
| heading / result | 17px heading, mono 10px `min-width:180px` (`Catalogue:86-87`) | 15px heading, mono 9.5px `min-width:96px` (`CatalogueMobile:33-36`) | 08, verified here |
| grid | `repeat(5,208px);gap:28px 24px` (`Catalogue:91`) | `repeat(2,163px);gap:20px 16px` (`CatalogueMobile:37`) | 08, verified here |

So ticket 04 lands the phone header's two rows and explicitly hands three things forward: *"The
filter dock, the chips row and the `contentTop` offsets in that file are ticket 11's"*
(`04-shell-header-and-footer.md:231-234`). This ticket is those three plus the sheet.

### The current drawer is at the wrong edge, and it is on all ten routes

`components/nav/nav-side-bar.tsx:89-92` opens a `SheetContent side="left"`. Inside it are a second
copy of `CatalogueNav` (`:101-105`), three links to `/subscribe`, `/bookmarks` and `/`
(`:106-134`), a `Logo` (`:93-95`) and a `ModeToggle` (`:141`). `NavSidebar` is rendered from
`app/layout.tsx:74`, so the trigger is painted on `/aboutus` and `/privacypolicy` too, where there
is nothing to filter.

Two of its defects were fixed for recorded reasons and must not come back.

**It used to scroll away.** `ui-ux-overhaul` ticket 11 step 7
(`.scratch/ui-ux-overhaul/issues/11-filters-compose-and-mobile-drawer.md:148-153`) changed the
wrapper from `position:absolute;top:10` to `fixed top-[10px]`, because no ancestor was positioned,
so the containing block was the document and past ~10px of scroll a phone visitor could not filter
at all. `tests/e2e/filters.spec.ts:147-159` pins it. The mock says the same thing out loud: the
annotation at `CatalogueMobile.dc.html:48` reads `FILTER DOCK IS FIXED — REACHABLE AT ANY SCROLL
POSITION`.

**It used to swallow taps.** Commit 02c3730 found that the wrapper's `px-2 pb-2` made an 80×48px
box where the pill painted 56×40, so a quarter of it was invisible and at `z-30` ate taps on the
card behind — `document.elementFromPoint` 8px to the right of the pill returned the wrapper.
`pointer-events-none` on the wrapper with `pointer-events-auto` on the header made exactly what
paints be what responds, and `tests/e2e/filters.spec.ts:160-177` hit-tests it rather than reading
the class.

### The filter surface cannot say what it is drawn saying

The sheet's primary button reads `Show 2 recordings` (`CatalogueMobile.dc.html:77`), and the mock's
own result line for that state is `2 OF 277` (`:111`). That number is the count of matching
Recordings. `app/layout.tsx` cannot know it — a Next App Router layout is never handed
`searchParams`, only a page is, which is the same structural fact `05-rail-categories-and-
contributors.md` uses to settle what the rail's counts count. `components/catalogue-page.tsx:118`
already holds it as `sortedData.length`.

### Two measured numbers this ticket is judged against

Mobile field LCP p75 is **4,515ms** and mobile INP p75 is **286ms**, the worst INP of any device
(`.scratch/posthog-expansion/spec.md:42-48`; the same table at
`09-redesign-baseline-dashboard.md:109-112` is the frozen deploy-A baseline). Google's good
thresholds are LCP ≤2,500ms and INP ≤200ms, so mobile is already outside both. A spring on the
filter surface, a `backdrop-filter` on a bar that repaints on every scroll frame, and a sheet that
mounts 18 chips plus 24 rows in the same tick are three ways to make that worse.

And commit f0927a3 fixed a horizontal-scroll bug in exactly the band this ticket touches: at 640px
the rail appears while the grid's sort row is still horizontal at 470px min-content against the
440px `main` had, so the document scrolled sideways for the 640-670px band.
`tests/e2e/nav-empty-states-layout.spec.ts:216-237` sweeps eight widths on three routes for
document overflow, and it is the guard.

## Work

Every colour, radius and type size below is quoted so the right token from ticket 02 can be
identified, not so it can be typed into a component. No literal hex belongs in any file this
ticket writes.

1. **`components/filter-dock.tsx` — one new client component holding both the dock and the sheet.**
   They are never used apart: both dock buttons open the same sheet, because the sheet already
   carries a SORT block (`CatalogueMobile.dc.html:69-74`) and two filter surfaces on one screen is
   one more than the mock draws. It takes
   `categories?: Array<{ name: string; count: number }>`,
   `contributors?: Array<{ name: string; count: number }>`,
   `resultCount: number`, `sort: SortType` and `setSort: (next: SortType) => void`.

2. **Render it from `components/catalogue-page.tsx`, not from the layout.** That module is the
   Catalogue page in `CONTEXT.md`'s sense — it is handed the Recordings it renders and never
   fetches — so it is the one place that knows `sortedData.length` for the `Show N recordings`
   button, and it exists only on `/`, `/products` and `/bookmarks`. Rendering the dock from
   `app/layout.tsx` would put a `⚙ Filters` bar on `/aboutus`, which is the wrong-routes half of
   the problem above. Pass `sort` and `setSort` straight through from the `useSortedData` call at
   `catalogue-page.tsx:88`, exactly as `EntryCardGrid` already receives them at `:117-118`.

   The two facet lists come from the route. `app/page.tsx` and `app/products/page.tsx` are server
   components and read ticket 05's `RECORDINGS_PER_CATEGORY` and `contributorsByCount()` from
   `data/recording.ts` directly. `app/bookmarks/page.tsx` is `"use client"` (`:2`) and must not:
   a value import of `@/data/*` from a client component drags `data/catalogue.ts` into a client
   chunk, which is the regression `components/catalogue-search.tsx:54-57` records deliberately
   removing. So `/bookmarks` passes neither list, and on that route the dock renders the sort
   button alone at `flex:1` and the sheet shows only its SORT block. That is honest rather than a
   compromise — `/bookmarks` passes no `searchParams` to `getEntries()` (`app/bookmarks/page.tsx
   :39`) and `CataloguePage` filters it by the Remembered set, so no facet applies there at all.

   The layout already serialises the same two arrays for the rail (`app/layout.tsx:74`), so this
   sends roughly 1kB of RSC payload twice on the three catalogue routes. Accepted, and written
   down here rather than rediscovered: the alternative is a client context that the page writes
   and the layout reads, to carry one integer upwards.

3. **The dock.** `fixed left-0 right-0 bottom-0 z-40 md:hidden`, then the mock's own box:
   `display:flex;align-items:center;gap:9px;padding:12px 14px 16px;background:{{ dockBg }};
   border-top:1px solid {{ line }};backdrop-filter:blur(12px)` (`CatalogueMobile.dc.html:44`).
   `--dock` is `rgba(12,13,17,0.94)` dark / `rgba(239,239,235,0.96)` light and ticket 02 already
   declares it (`02-design-system-tokens-and-type.md`, the five extra tokens table, sourced from
   `CatalogueMobile.dc.html:85-86`).

   `fixed`, not `absolute`. The mock spells `position:absolute` only because the whole file is a
   390×844 phone frame with `position:relative` at `:10`; in a real document `absolute` resolves
   against the initial containing block and scrolls away, which is the defect
   `ui-ux-overhaul` ticket 11 step 7 fixed and `CatalogueMobile.dc.html:48` annotates. Do not ship
   that annotation string — it is a note about the drawing, not copy.

   Bottom padding is `calc(16px + env(safe-area-inset-bottom, 0px))`. The mock draws a flat
   rectangle; a real iPhone puts a home indicator over the last 34px, and the buttons are 46px
   tall. Without `viewport-fit=cover` in the viewport meta — which this repo does not set —
   `env()` resolves to the fallback and the padding stays exactly the drawn 16px.

   The Filters button (`:45`): `display:flex;align-items:center;gap:8px;flex:1;
   justify-content:center;min-height:46px;border-radius:12px;border:1px solid {{ filterBtnBorder }};
   background:{{ filterBtnBg }};color:{{ filterBtnFg }};font-size:13.5px;font-weight:500` in Space
   Grotesk, reading `⚙ Filters` with a count badge in JetBrains Mono at `font-size:11px;
   padding:2px 6px;border-radius:5px;background:{{ badgeBg }};color:{{ badgeFg }}`. The `⚙` is
   `aria-hidden="true"`; it is a picture, and the accessible name is `Filters 2`.

   | | no facet applied | one or more applied, or the sheet open |
   |---|---|---|
   | `filterBtnBg` | `fieldBg` | `acc` — `#6FE3CC` dark / `#0E7062` light |
   | `filterBtnFg` | `t1` — `#F1F2F4` / `#14161A` | `onAcc` — `#06120F` / `#FFFFFF` |
   | `filterBtnBorder` | `line2` | `acc` |
   | `badgeBg` | `accSoft` — `rgba(111,227,204,0.13)` / `rgba(14,112,98,0.09)` | `rgba(0,0,0,0.16)` |
   | `badgeFg` | `t2` — `#B2B8C2` / `#4F545C` | `onAcc` |

   from `:116-122`. The badge counts the two facets and **not** `search`: the mock's `filtered`
   variant has `searchText: 'ticket'` (`:112`) and still draws `2` (`:116`). That is the same rule
   `components/nav/catalogue-nav.tsx:74` already encodes as `FACETS`, and the same number
   `filterApplied` reports as `active_filter_count` (`lib/analytics.ts:129-140`), so compute it the
   same way and the badge and the event cannot disagree.

   The sort button (`:46`): `display:flex;align-items:center;gap:7px;flex:none;min-height:46px;
   padding:0 14px;border-radius:12px;border:1px solid {{ line2 }};background:{{ fieldBg }};
   color:{{ t1 }};font-size:13px`, reading `↕ Recent` / `↕ Viewed` / `↕ Voted` (`:123` draws the
   first two; `Voted` is the same extrapolation ticket 04 step 7 made for `MOST VOTED`, which none
   of the mock's variants selects either). `↕` is `aria-hidden="true"`.

   Focus: `:focus-visible` draws `outline:3px solid {{ acc }};outline-offset:3px` on both buttons.
   That is what `dockRing` is (`:45`, `:122`) — the mock draws it on the Filters button in the
   `sheet` variant because that button is what was just pressed.

4. **The dock's breakpoint, and the rail's, move together to `md`.** The dock and the sheet are
   `md:hidden`, matching the phone header ticket 04 step 10 builds below `md`. The rail is
   `hidden sm:flex` today (`components/nav/nav-side-bar.tsx:35`); change it to `hidden md:flex`,
   and move whichever compensation `main` carries when this lands — ticket 04 step 1 owns that,
   deleting the margin and putting the rail in flow — to
   the same `md`. Without this, the 640-767px band has both the rail and a fixed dock painting over
   the rail's last ~70px, and it has no sort control at all in the header, because ticket 04 step
   10 removes it below `md`. One boundary, one surface at any width.

5. **Whether the sheet is open is the address, not component state.** `useState` cannot work here.
   `hooks/use-sorted-data.ts:12-14` records the measurement: a facet link is *"a real navigation,
   which remounts the tree"*, which is why the sort had to leave `useState` in the first place. A
   sheet drawn with `Clear all` and `Show N recordings` is a surface built to hold several
   decisions, and one that closed on every tap could hold one.

   So: `?filters=open`, read with `useSearchParams`, written with `window.history.replaceState`
   — never `router.replace`, because opening a panel must not buy a server render, which is the
   rule `use-sorted-data.ts:22-27` already states for `sort`. Next reflects native History API
   writes back through `usePathname` and `useSearchParams`, which this repo already depends on for
   the Recording overlay (`components/catalogue-page.tsx:53-57`). `replaceState` rather than
   `pushState` for the same reason the sort uses it: opening filters is a mode, not a step.

   It carries across facet navigations for free — `facetHref` copies the whole query
   (`components/nav/catalogue-nav.tsx:58-67`), so `filters=open` rides along with
   `category` and `contributor` and the sheet is open again on the other side. `app/products/
   page.tsx:16-20` destructures only the params it uses, so an extra one changes no server
   behaviour.

   Two consequences, both accepted rather than engineered around. Tapping a facet from `/` or
   `/bookmarks` lands on `/products` — `facetHref` always targets it (`:66`) — which is a route
   change, so the sheet closes there and re-opens from the URL; on `/products`, where filters are
   actually composed, it stays open across the navigation. And a `?filters=open` URL pasted into a
   desktop browser opens the sheet at desktop width, because the alternative is a JavaScript media
   query and a mount gate on a surface that is otherwise pure CSS.

6. **The sheet, built from Radix Dialog directly.** Import `* as Dialog from "@radix-ui/react-
   dialog"`, the pattern `components/entry-overlay.tsx:18` already uses and gives the reason for at
   `:3-8` — portal, focus trap, Escape and scroll lock, with the JS already in the bundle.
   `components/ui/sheet.tsx`'s `SheetContent` is not reusable here: it renders its own
   `<SheetOverlay />` with no props (`:61`), so the `bg-black/80` scrim at `:24` cannot be
   repointed at `--scrim` from the outside.

   Scrim (`CatalogueMobile.dc.html:51`): `fixed inset-0` in `--scrim`, no `backdrop-filter`. The
   mock draws a blur on the *desktop* overlay's scrim (`Catalogue.dc.html:167`,
   `backdrop-filter:blur(3px)`) and none on this one; a full-viewport blur on a phone GPU is one of
   the cheapest ways to lose frames, and the drawing already says not to. Use `--scrim` as ticket
   02 binds it (`rgba(4,5,8,0.74)` / `rgba(24,26,30,0.52)`); this file draws `0.7` / `0.5` at
   `:85-86`, which is the same third-decimal disagreement between mocks that ticket 02's table
   exists to settle, and this ticket spells neither.

   Panel (`:52`): `fixed left-0 right-0 bottom-0`, `background:{{ panel }}` — `#101216` dark /
   `#FFFFFF` light — `border-top:1px solid {{ line2 }};border-radius:20px 20px 0 0;
   padding:14px 16px 18px;box-shadow:0 -30px 70px -20px rgba(0,0,0,0.6)`. The 20px radius is not on
   the Specimen's scale of 16 / 12 / 9 / 6 (`Specimen.dc.html:147-148`); ship it as drawn, the way
   tickets 04 and 05 shipped the 4px key chip and the 7px rail row.

   Height: `max-height:85svh`, with the panel a flex column — title row fixed, body
   `flex-1 min-h-0 overflow-y-auto overscroll-contain`, action row fixed — and
   `padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px))`. `svh`, not `vh`: the mock draws
   twelve Categories and two Contributors and fits; eighteen Categories and twenty-four
   Contributors is roughly 1,400px of content, and `100vh` on iOS is the *large* viewport measured
   with the URL bar hidden, which is the trap `ui-ux-overhaul` ticket 11 step 10 measured at
   390×844 and concluded was only absorbed by a 320px reserve this panel does not have.
   `overscroll-contain` so a flick at the end of the Contributor list does not chain to the
   document behind it.

   Grabber (`:53`): `width:38px;height:4px;border-radius:3px;background:{{ line2 }};margin:0 auto
   14px`, `aria-hidden="true"`, not draggable. It is 38×4px of decoration; drag-to-dismiss is not
   drawn and the sheet has three real dismissals — the `✕`, the scrim and Escape.
   `lib/posthog-provider.tsx:33` turns on `capture_dead_clicks`, so if visitors do try to drag it,
   the deploy-B readout (`posthog-expansion` ticket 11) will say so, and the upgrade is `vaul`,
   already in `package.json` at `^1.1.2` and depending on the `@radix-ui/react-dialog` this sheet
   is built on — 77kB of unminified ESM that is currently in the lockfile and imported by nothing.

   Title row (`:54-56`): `display:flex;align-items:center;gap:10px;padding-bottom:12px`, holding
   `Filter & sort` at `font-size:15px;font-weight:500` as the `Dialog.Title` — Radix requires one
   — and a close button at `margin-left:auto;min-height:36px;min-width:36px;border-radius:9px;
   border:1px solid {{ acc }};background:{{ accSoft }};color:{{ t1 }};font-size:12px` reading `✕`
   with `aria-label="Close filters"`. Its drawn `outline:3px solid {{ acc }};outline-offset:3px` is
   the focus ring, so bind it to `:focus-visible` — Radix focuses it on open, which is the state
   the mock is drawing.

7. **The sheet's four blocks.** Section labels are JetBrains Mono `font-size:8.5px;
   letter-spacing:0.14em;color:{{ t3 }};padding-bottom:8px` (`:58`, `:64`, `:69`), reading
   `CATEGORY · ${categories.length}`, `CONTRIBUTOR · ${contributors.length}` and `SORT`. Note this
   is the Specimen's `mono 9 / +14% · labels` letter-spacing (`Specimen.dc.html:144`) rather than
   the rail's `0.16em`; the two surfaces are drawn differently and both ship as drawn.

   **Categories** (`:59-62`): `display:flex;flex-wrap:wrap;gap:7px;padding-bottom:14px`, each row
   `display:flex;align-items:center;gap:6px;min-height:34px;padding:0 10px;border-radius:9px;
   border:1px solid {{ c.border }};background:{{ c.bg }};color:{{ c.fg }};font-size:12px` with the
   count in mono `9.5px` in `{{ c.num }}`. Applied is `bg: accSoft, border: acc, fg: t1, num: acc`;
   at rest `bg: transparent, border: line, fg: t2, num: t3` (`:124-127`). All 18, alphabetical, the
   order `getUniqueCategories()` already returns.

   **Contributors** (`:65-68`): `display:flex;flex-direction:column;gap:6px;padding-bottom:14px`,
   each row `display:flex;align-items:center;gap:8px;min-height:38px;padding:0 11px;
   border-radius:9px;font-size:12.5px`, the name with
   `overflow:hidden;text-overflow:ellipsis;white-space:nowrap` and the count at `margin-left:auto`
   in mono `10px`. Applied: `border:1px solid {{ acc }}`, `background:{{ accSoft }}`, count in
   `acc`. At rest: `border:1px solid {{ line }}`, text `t2`, count `t3`.

   Every Contributor, in ticket 05's `contributorsByCount()` order — not the rail's `slice(0, 4)`.
   The label above them reads `CONTRIBUTOR · ${contributors.length}`, and four rows under a label
   counting the whole list is the kind of thing spec decision 2 forbids: nothing on screen lies.
   The number is `contributors.length` rather than a literal, because ticket 10 trims
   `"Pushkar Tandon "` (`data/fullapps.ts:23`) and the derived total moves.
   The rail slices because it has 232px of column;
   this panel scrolls.

   Every Category chip and Contributor row is a `<Link>` whose href is `facetHref(searchParams,
   "category" | "contributor", name)` and whose `onClick` calls `reportFacetClick`. **Export both
   from `components/nav/catalogue-nav.tsx` rather than copying them.** They already encode three
   decisions — keep every param you did not set, so filters compose; clicking the applied facet
   clears it; drop `page`, because a different filter is a different result set — and
   `reportFacetClick` decides `filter_applied` versus `filter_cleared` off the *same* test
   `facetHref` navigates on, deliberately, so that a clear is never logged as an apply
   (`catalogue-nav.tsx:76-93`). A second spelling of that rule is how the hrefs stopped composing
   the first time.

   **Sort** (`:70-74`): `display:flex;gap:7px;padding-bottom:16px`, three items at
   `flex:1;text-align:center;min-height:38px;line-height:38px;border-radius:9px;font-size:12px`,
   selected as `border:1px solid {{ acc }};background:{{ accSoft }};color:{{ t1 }}` and unselected
   as `border:1px solid {{ line }};color:{{ t2 }}`. Labels `Recent`, `Most viewed`, `Most voted` —
   sentence case here, where the desktop header draws mono uppercase. They call the `setSort` prop,
   which is `useSortedData`'s: `recent` deletes the param, the other two write `sort=top-viewed`
   and `sort=top-voted`, and `sortChanged` fires from inside the hook already
   (`hooks/use-sorted-data.ts:29`). No new analytics event anywhere in this ticket — the thirteen
   in `lib/analytics.ts` are what deploy A's annotation is drawn against, and a fourteenth arriving
   with deploy B blurs exactly the attribution the two annotations exist to protect.

   **Actions** (`:75-78`): `display:flex;gap:9px`. `Clear all` is `flex:none;min-height:46px;
   padding:0 16px;border-radius:12px;border:1px solid {{ line2 }};background:none;color:{{ t1 }};
   font-size:13px`; it deletes `category`, `contributor`, `search` and `page`, keeps `sort` and
   `filters`, and is `disabled` when there is nothing to clear — a control that answers nothing is
   a `$dead_click`, and the mock only ever draws it with filters applied. `Show ${resultCount}
   recordings` is `flex:1;min-height:46px;border-radius:12px;border:none;background:{{ acc }};
   color:{{ onAcc }};font-size:13.5px;font-weight:500`; it closes the sheet and nothing else — the
   filters are already applied — and it reads `Show 1 recording` at one, because a plural that is
   wrong is the same lie as a count that is wrong.

8. **Motion: 260ms, and CSS.** The Specimen gives one line for this surface — *"Bottom sheet
   (mobile) · 260ms spring, no overshoot"* (`Specimen.dc.html:166`). Animate `transform:
   translateY(100%) → 0` on the panel and `opacity` on the scrim, both directions, 260ms, easing
   `cubic-bezier(.2,.8,.2,1)` — the mock's own decelerate curve, already required at 220ms and
   240ms elsewhere (`:162`, `:164`). A critically damped spring and a decelerate cubic-bezier are
   the same shape; "no overshoot" is what makes them interchangeable.

   Not `framer-motion`, even though it is installed and used in three files. INP measures from the
   tap to the *next paint*, so a 260ms animation is not itself an INP failure — main-thread work
   before that paint is, and a JS spring runs its first frames on the main thread in exactly that
   window, on the device already at 286ms p75. A CSS transition on `transform` and `opacity` is
   composited and costs the main thread nothing after the class flips. If the maintainer wants a
   literal spring later, the upgrade stays in CSS: a `linear()` easing sampled from a zero-bounce
   spring, one string, same properties.

   `tailwindcss-animate` is the plugin already dressing `components/ui/sheet.tsx:34`, and it
   redefines `duration-*` and `ease-*` to write `animation-duration` and `animation-timing-function`
   rather than the transition properties Tailwind core gives those names
   (`node_modules/tailwindcss-animate/index.js`, the `duration` and `ease` `matchUtilities` blocks).
   Whichever mechanism is used, spell the 260ms once.

   Reduced motion: `motion-reduce:animate-none` on the panel and the scrim, so the sheet appears
   with no transition. The Specimen states the rule — *"all durations 0ms"* (`:95`) — and
   `ui-ux-overhaul` ticket 09 already ships the zero-duration path; ticket 13 owns the global
   audit, and this is the local declaration it will check.

9. **The chips row, in the header.** `CatalogueMobile.dc.html:24-29` sits *inside* the header block
   opened at `:12`, where the desktop filter bar at `Catalogue.dc.html:76-82` sits inside `<main>`
   opened at `:59`. Different parent, and four more differences: no `3 ACTIVE` label, no SEARCH
   chip, no `Clear all`, `CAT` / `BY` at mono 8.5px against `CATEGORY` / `BY` / `SEARCH` at 9px, and
   a 20×20px remove button at radius 6 against 16×16 at radius 5. That is a second component, not a
   breakpoint on ticket 08's.

   Row: `display:flex;gap:7px;padding:0 14px 10px`, rendered only when a facet is applied. Each
   chip: `display:flex;align-items:center;gap:7px;flex:none;min-height:34px;padding:0 8px 0 10px;
   border-radius:9px;background:{{ accSoft }};border:1px solid {{ acc }};font-size:11.5px`, with
   the kind in mono 8.5px in `acc`, and the Contributor chip capped at `max-width:186px` with
   `overflow:hidden;text-overflow:ellipsis;white-space:nowrap` — the mock's `Enzo Manuel Mangano
   (Reac…` is CSS truncation, not `truncateString`. The remove button is
   `border:none;background:{{ xBg }};color:{{ t1 }};width:20px;height:20px;border-radius:6px;
   font-size:10px` with `aria-label="Remove category filter"` / `"Remove contributor filter"` —
   the mock's own `aria-label="Remove"` (`:26`) is ambiguous between two chips, and the desktop bar
   spells the long form (`Catalogue.dc.html:78-79`). Each removes its facet through the same
   `facetHref` / `reportFacetClick` pair.

   The mock's `overflow:hidden` (`:25`) becomes `overflow-x:auto` with the scrollbar hidden: two
   chips at up to 186px plus 14px gutters fit at 390px, but `overflow:hidden` at 320px would make
   the second chip's remove button unreachable, and this is an *element* scrolling, not the
   document — the sweep in step 12 measures `document.documentElement`.

10. **Content clearance, and the numbers ticket 08's grid must hit below `md`.** The mock's content
    block is `padding:14px 14px 96px` (`:32`), and the 96px is the dock's clearance: the dock is
    fixed, so without it the last row of the grid sits under it forever. Set that bottom padding on
    the Catalogue page's own container, as `calc(96px + env(safe-area-inset-bottom, 0px))`, below
    `md` only.

    The `contentTop:104` / `148` offsets at `:32` and `:109` do **not** port. They exist because the
    mock's header is `position:absolute` inside a phone frame; ticket 04 step 1 makes the real
    header `sticky`, which occupies its own space — the same arithmetic-deleting reason it gives,
    and the one `app/layout.tsx:68-72` records getting wrong once already. Nothing offsets the
    content, and the header growing from one row to two when a chip appears must push the content
    rather than overlap it.

    These are ticket 08's grid, verified here rather than re-set if 08 has already spelled them:
    two columns with `gap:20px 16px` (`:37`), a 15px/500 heading and a mono 9.5px `letter-spacing:
    0.1em` result line at `min-width:96px;text-align:right` (`:33-36`). Take the columns as
    `repeat(2, minmax(0, 1fr))`, not the drawn `repeat(2,163px)`: 163px twice plus the 16px gap
    plus two 14px gutters is 370px, so a fixed track overflows below a 370px viewport and the
    overflow sweep starts at 320.

11. **Delete the left drawer, and re-home what was in it.** `components/nav/nav-side-bar.tsx:74-148`
    goes entirely, and with it the `useState` at `:26`, `handleLinkClick` at `:28-30`, the `Sheet`
    import at `:10` and the `Logo` import at `:13`. The `pointer-events-none` / `pointer-events-auto`
    pair goes with it — not because commit 02c3730 was wrong, but because the padded wrapper it
    compensated for stops existing. What remains of the file is the `<aside>` from step 4.

    Nothing in it is orphaned, and each replacement is drawn: `Subscribe` (`:107-115`) → the
    footer's `NOTIFY` column and its `/subscribe` link (ticket 04 step 11); `Bookmarks`
    (`:116-124`) → the phone header's `◆ 3` chip (`CatalogueMobile.dc.html:16`, ticket 04 step 10);
    `Home` (`:125-133`) → the wordmark, which links to `/` (ticket 04 step 3); the `ModeToggle`
    (`:141`) → the phone header's `◐` / `◑` glyph (`:17`). Deleting a nav link without a
    replacement is the orphaning `ui-ux-overhaul` decision 13 exists about, so check each one is on
    screen at 390px before deleting the drawer, not after.

    `components/logo.tsx` then has no importer left once ticket 04 step 3 has taken it out of the
    header — `grep -rn "from \"../logo\"\|@/components/logo"` should return nothing. Delete it.
    Same for `components/ui/sheet.tsx`: `nav-side-bar.tsx:10` is its only importer today, so run
    the grep and delete it if it is still the only one. Then correct `components/entry-overlay.tsx
    :6-8`, which justifies Radix Dialog by *"its JS is already in the bundle through
    components/ui/sheet.tsx"* — after this it is in the bundle because that file and this one
    import it directly, and a comment that names a deleted file is worse than none.

12. **`components/entry-card-grid.tsx` — the phone sort dropdown.** `:178-246` is a hand-rolled
    disclosure driven by `isSortDropdownOpen` at `:70`, rendering the same three sorts the sheet now
    holds. Delete the block and the state. If ticket 08 has already removed the whole sort row, this
    is a no-op; if it removed only the desktop pills at `:149-176`, this is the other half. Do not
    disturb the `flex-wrap` and `gap-y-4` on the row wrapper at `:143` while it still has children:
    commit f0927a3 put them there to stop the 640px sideways scroll, and `gap-y` replaced `space-y`
    because `space-y` puts a margin on the first item of a wrapped line.

13. **Tests.** `tests/e2e/filters.spec.ts`'s `on a phone` block (`:140-202`) is written entirely
    against the deleted drawer — the `Toggle Menu` trigger, `drawer.getByText("Authors")`, and
    `a[href*="author="]`. Rewrite it, keeping every behaviour it pins:

    - the dock is in the viewport after `window.scrollTo(0, 2_000)` on `/products` — the fix at
      `ui-ux-overhaul` ticket 11 step 7, restated for the new element;
    - the hit-test from `:160-177`, re-aimed: `document.elementFromPoint` 8px above the dock's top
      edge returns something inside the grid, not the dock — the tap-swallowing guard from commit
      02c3730, which must survive the element being replaced;
    - opening the sheet from `/products` shows all 18 Category chips and one row per Contributor,
      and the last Contributor row can be scrolled to and clicked — the `svh` half of step 6;
    - tapping `Misc`, then a Contributor, composes: the URL carries `category=Misc&contributor=…`,
      the sheet is **still open** across the second tap, both are in the applied treatment, and the
      dock badge reads `2` — this is what step 5 exists for, and if the subtree remounts it fails
      here rather than in front of a visitor;
    - `Clear all` from that state leaves the URL with neither facet and with `sort` intact, and is
      `disabled` when nothing is applied;
    - Escape closes the sheet and focus returns to the Filters button.

    Add `767` and `768` to the width list in `tests/e2e/nav-empty-states-layout.spec.ts:224` — that
    is the new boundary, where 640 was the old one, and the band either side of a boundary is where
    f0927a3's bug lived.

14. **The measurement, in the same commit.** At 390×844 with `Emulation.setCPUThrottlingRate` at 4,
    on `/products`, install a `PerformanceObserver` for `event` entries with
    `durationThreshold: 16`, tap `Filters`, then tap a Category chip, and record the longest entry
    duration for each. Record both numbers, plus the `pnpm build` First Load JS for `/products`
    before and after, under `## Comments`. Take a lab LCP for `/products` at the same throttle
    before and after as well. These are numbers this ticket owns; ticket 13 is the merge gate that
    reads the field figures against deploy A.

## Acceptance

- At 390×844 on `/products`, a fixed bar at the bottom of the viewport holds `⚙ Filters` with a
  count badge and `↕ Recent`, and both are still in the viewport after scrolling 2,000px.
- `document.elementFromPoint` 8px above the dock's top edge, and 8px to the left of the Filters
  button's left edge, both return an element inside the grid rather than the dock or its wrapper.
- Tapping `Filters` opens a panel anchored to the bottom of the viewport with a 20px top radius, a
  grabber, `Filter & sort`, `CATEGORY · 18` over 18 chips, a `CONTRIBUTOR ·` label whose number is
  `contributors.length` over that many rows, `SORT` over three, and a `Clear all` /
  `Show N recordings` row.
- From `/products`, tapping `Misc` and then `Enzo Manuel Mangano ( Reactiive )` leaves the URL
  carrying both `category=` and `contributor=`, the sheet still open, both rows in the accent
  treatment, and the dock badge reading `2`. Tapping `Misc` again removes `category=` and leaves
  `contributor=`.
- With a search term and one facet applied, the dock badge reads `1`, not `2`.
- `Show N recordings` closes the sheet and issues no document request; `N` matches the first number
  in the result line, and reads `Show 1 recording` when that number is 1.
- `Clear all` is `disabled` with no facet applied; with two applied it clears both and leaves any
  `sort=` param untouched.
- Escape, the `✕` and a tap on the scrim each close the sheet, and focus returns to the Filters
  button.
- `?filters=open` on a cold load of `/products` at 390px renders the sheet open; closing it removes
  the param with no entry added to session history — `history.length` is unchanged across an open
  and a close.
- At the full Contributor list the last row of the sheet can be scrolled to and clicked with the panel's
  bottom edge at the bottom of the viewport, in a browser rendering a URL bar.
- `grep -rn "Toggle Menu" components/ tests/` returns nothing, and `grep -rn "components/ui/sheet\|from \"../logo\""
  components/ app/` returns nothing.
- Every one of Subscribe, Bookmarks, Home and the mode toggle is reachable at 390px after the drawer
  is deleted: `/subscribe` from the footer, `/bookmarks` from the header's `◆` chip, `/` from the
  wordmark, and the toggle from the header glyph.
- `tests/e2e/nav-empty-states-layout.spec.ts`'s "the page never scrolls sideways" passes at every
  width in its list plus 767 and 768, on all three routes, with the sheet closed and with it open.
- `grep -nE '#[0-9A-Fa-f]{3,8}\b' components/filter-dock.tsx` returns nothing.
- With `prefers-reduced-motion: reduce` emulated, the sheet appears and disappears with no
  intermediate frame: a `requestAnimationFrame` recorder started before the tap sees at most one
  distinct `transform` value on the panel.
- The longest `event` entry for the sheet-open tap, and for a Category-chip tap, are both ≤200ms at
  390×844 under 4× CPU throttling, and both numbers are written into `## Comments`. 200ms is
  Google's good threshold (`.scratch/posthog-expansion/spec.md:48`) and mobile p75 is already 286ms.
- First Load JS for `/products` does not grow by more than 3kB against the same build before this
  ticket, and the lab LCP number for `/products` at 390px under 4× throttling is recorded in
  `## Comments` beside the pre-change figure.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and the Playwright suite all pass.

## Depends on

**Ticket 04**, because it builds the phone header this ticket finishes and explicitly hands three
things forward at `04-shell-header-and-footer.md:231-234` — the dock, the chips row and the
`contentTop` offsets. The chips row is a second row inside that header, so it cannot be positioned
before the header exists; the dock's `md:hidden` boundary is the boundary step 10 of that ticket
chose for the header, and the two must be the same number or the 640-767px band loses its sort
control.

**Ticket 08**, because the sheet's `Show N recordings` is the same count 08 renders in the result
line, and because 08 owns the grid whose bottom row the fixed dock would otherwise cover. It also
owns the desktop filter bar that this ticket's chips row is the phone counterpart of, and the
`entry-card-grid.tsx` sort row that step 12 finishes clearing out.

**Ticket 05.** Step 7 renders `RECORDINGS_PER_CATEGORY` and `contributorsByCount()`, which ticket 05
steps 1 and 2 add, and steps 7 and 9 export `facetHref` and `reportFacetClick` from
`components/nav/catalogue-nav.tsx` — a file ticket 05 rewrites. Both count helpers are 05's to
write: two tickets spelling them is two spellings that can disagree, which is the same reason step 7
exports `facetHref` rather than copying it. 05 is blocked only by 01 and 02, so this is a wait, not
a chain.

**Two things the spec's ticket table does not carry.** It lists this ticket as needing 04 and 08,
which is short of the 05 above, and the coupling to **02** is as hard as any of the three:
`--dock`, `--scrim`, `--panel`,
`--acc-soft`, `--on-acc`, `--line2` and the mono family are every colour and every label in the dock
and the sheet, and ticket 02's table is what settles the disagreements between the mocks —
`--scrim` at `0.74`/`0.52` in `Catalogue.dc.html:175-176` against `0.7`/`0.5` in
`CatalogueMobile.dc.html:85-86`, and `--field` at `0.045` against `0.05` in the same pair. That
reaches this ticket through 04, which is already blocked by 02, so no new line is needed on
`Blocked by:` — but an agent taking this one with 02 unlanded has nothing to build against.

And the rail's breakpoint (step 4) is a change to `components/nav/nav-side-bar.tsx:35`, which
tickets 04 and 05 both edit. Ticket 04 step 1 owns `main`'s margin — it puts the rail in flow and
deletes the margin outright — and ticket 05 no longer sets one. This ticket only requires that
whatever 04 settles on switches at `md` rather than `sm`. The aside's duplicate `ModeToggle` at
`nav-side-bar.tsx:44-47`, left behind when ticket 04 step 9 moves the toggle into the header, is
deleted by ticket 05 step 13 — not by this one.

## Comments

### What landed

All fourteen steps. `components/filter-dock.tsx` is new and holds both the dock and the sheet;
`components/catalogue-page.tsx` renders it and is the one module that knows the count for
`Show N recordings`; `app/page.tsx` and `app/products/page.tsx` pass the two facet lists and
`/bookmarks` passes neither. The left drawer, `components/ui/sheet.tsx` and `components/logo.tsx`
are deleted, the rail and the dock both switch at `md`, the phone chips row is in the header, and
the grid carries the `calc(96px + safe-area)` clearance below `md`.

`pnpm check-types`, `pnpm lint` (0 errors, the same 4 pre-existing warnings), `pnpm test`
(245 passing) and Playwright (187 passing) are all green.

One thing the drawer did that the mock does not draw, now gated rather than ported: the chips row
lives in the header, and the header is rendered from `app/layout.tsx`, so it drew a `CAT` chip on
`/aboutus?category=Buttons` and on `/bookmarks`, where the saved set is what filters and the chip's
own remove link points at another route. It renders on `/` and `/products` only, which is where the
desktop bar's `!bookmarkedOnly` gate already puts it.

### Four defects fixed in the half-built state this ticket was picked up in

1. **The 260ms never ran, in either direction.** The panel was a `transition` on `transform` with
   `duration-[260ms]`, and both halves of that are wrong here. `tailwindcss-animate` rebinds
   `duration-*` to `animation-duration`, so the transition had no duration at all; and Radix
   portals the panel in already carrying `data-state="open"`, so a transition has no starting
   frame to leave, while Radix's Presence holds a *closing* node mounted by watching
   `animationend` and unmounts a transitioned exit before it paints. The sheet appeared and
   vanished. Two further attempts to fix it with plugin utilities also failed silently:
   `[data-state=open].animate-in` outranks a bare `duration-*` by one attribute selector, and
   `duration-260` is owned by two plugins at once — Tailwind core writes `transition-duration`
   under that name and `tailwindcss-animate` writes `animation-duration`. The motion is now four
   keyframes in `app/globals.css` under `.sheet-scrim` / `.sheet-panel`, reading ticket 02's
   `transitionDuration.260` and `transitionTimingFunction.rise` through `theme()`, so the
   Specimen's figure is still written exactly once. A test asserts the computed
   `animation-duration` is `0.26s` and the curve is the rise — three wrong builds all looked
   identical from outside, so the assertion is on the property, not on a frame count.
2. **The count badge was `aria-hidden`,** making the accessible name `Filters` where step 3 says
   `Filters 2`. A control whose count exists only in pixels tells a screen reader nothing about
   how much is filtered.
3. **`/bookmarks` drew a `⚙ Filters` button** that opened a sheet with nothing in it but SORT.
   Step 2 says the sort button alone at `flex:1` on that route, and it now is.
4. **Focus restoration was an effect on `open`,** which fires while the dock is still inside the
   subtree Radix marks inert — an inert element cannot take focus. It is `onCloseAutoFocus` on
   `Dialog.Content` now, which also covers the cold `?filters=open` load where the
   previously-focused element is `body`.

Also added `aria-describedby={undefined}` to `Dialog.Content`, as `recording-overlay.tsx:183`
already does.

### Tests

Step 13's six are all present. Four were written with the half-built state and needed one fix: the
compose test located chips by `a[href*="category="]`, which stops matching the moment a facet is
applied, because an applied facet's href is the one that *clears* it. They locate by accessible
name now. Added, because they are acceptance bullets nothing pinned: the badge counting facets and
not the search term, `Clear all` disabled and sort-preserving, Escape closing with focus returned,
`?filters=open` on a cold load with `history.length` unchanged across an open and a close,
`Show 1 recording` at one, the 260ms above, and the `/bookmarks` dock. The sideways-scroll sweep in
`nav-empty-states-layout.spec.ts` now measures each width with the sheet open as well as closed.

### The two-axis review, and what it changed

Run before the commit. Both axes found real things; everything below is applied.

**Standards.** The aria-labels on the phone chips row were a second spelling of
`filter-chips.tsx`'s `CHIPS`, which is now exported and read from both — the rule
`catalogue-nav.tsx:76-78` states about `facetHref`, applied to the labels. `clearFacetHref` spelled
`["category","contributor","search"]` a fourth time and now takes `FILTER_KEYS`. `data-role="dock"`
became `data-testid`, the repo's convention. The facet-list computation was copy-pasted into
`app/page.tsx` and `app/products/page.tsx` and already sat in `app/layout.tsx`; all three now call
`categoriesWithCounts()` in `data/recording.ts`, a peer of `contributorsByCount()`. The page-capped
count was computed twice, once here and once in the grid, with a comment admitting it — both call
`shownCount(page, total)` now, which is the acceptance's "N matches the first number in the result
line" made structural. Inside `filter-dock.tsx`: the focus ring was inlined eight times and is one
`FOCUS_RING`, `badge` became `activeFacetCount`, and `SORT_ITEMS` plus `SORT_LABEL` — two tables
keyed on the same type — became one `SORTS` with a `sheet` and a `dock` label. The 286 lines of
`lastmod` churn in `public/sitemap-0.xml` are reverted; no URL in it changed.

One Standards finding was **wrong, and the test caught it**: the reduced-motion block in
`globals.css` was called a redundant repeat of the `*` rule at `:168-176`. It is not.
`animation-duration: 0s` still applies a keyframe for one frame, and on the close that frame is
`translateY(100%)` — the panel paints once slid off the bottom. Removing the block turned the
reduced-motion test red immediately. It is back, with that written down where it read as redundant.

**Spec.** Step 13 says *"Add `767` and `768` to the width list"* and the sweep had **replaced** it,
dropping 640, 660 and 700 — the band where a fixed dock now paints over a page with no rail. All
three are back, and the 800 and 820 that were added beyond the two the step named are gone. Two
acceptance clauses were unasserted and now are: *"and both are still in the viewport"* checked only
the Filters button and not `↕ Recent`, and *"both rows in the accent treatment"* was not checked at
all.

The last Spec finding is the one below.

### One thing the ticket asks for twice, differently

Step 2 says `CataloguePage` *"is the one place that knows `sortedData.length` for the
`Show N recordings` button"*. The acceptance says *"`N` matches the first number in the result
line"*. On the mock's own state those are the same number — it draws `Show 2 recordings` over
`2 OF 277` — but the result line's first number is page-capped, so on unfiltered `/products` the
two readings are 48 and 277.

Shipped as the acceptance says: **48**, the count actually on screen. A button that says
`Show 277 recordings` and reveals 48 with a Load more under it is the kind of thing decision 2
forbids, and `## Acceptance` is the definition of done. But it is a real disagreement inside the
ticket rather than a detail, so it is named here rather than absorbed: **flipping it to
`sortedData.length` is one argument to `shownCount` and the maintainer's call.**

### The measurement, step 14

`/products` at 390×844, `Emulation.setCPUThrottlingRate` at 4, production build over `pnpm start`.
Before is `HEAD` at 4176153 with this ticket's working tree stashed.

| | before | after |
|---|---|---|
| First Load JS `/products` | 1112.5 kB raw / 350.2 kB gzip | **1095.8 kB / 344.4 kB** |
| lab LCP `/products` (median of 3 / 5) | 768 ms | **520 ms** |
| longest `event` — open the sheet | — | **208 / 216 / 232 / 248 / 272 ms** |
| longest `event` — a Category chip | — | **40 ms, all five runs** |

First Load JS *fell* by 16.1 kB raw and 5.9 kB gzip, against an allowance of +3 kB: the drawer,
`components/ui/sheet.tsx`, `components/logo.tsx` with its `next/image`, and four lucide icons all
left the client graph, and the dock costs less than they did. The figure is computed from the
scripts the served document itself pulls in, summed on disk — this Next version's build table
prints no Size column, and bytes-transferred-in-N-seconds moves with prefetch timing and is not
comparable between builds.

Device pixel ratio was checked at 1 and at 3; the numbers were the same either way, so it is not
raster area.

### What is left, and whose it is

**The sheet-open tap does not clear 200ms.** Five runs: 208, 216, 232, 248, 272. The Category tap
clears it comfortably at 40ms. The phase split is the useful part — the tap spends **~0ms in
script** and 195-250ms in presentation delay, so it is not the handler and not React: a Category
tap re-renders the same 44 links plus 48 tiles in 26-28ms of paint. It is the browser's pipeline
for mounting a modal dialog. Two levers were measured and neither is an agent's call:

- **Radix's modal semantics.** `modal={false}` takes the open tap to 128-168ms — worth ~70ms, all
  of it the scroll lock's document-wide style invalidation. It also drops the focus trap and the
  scroll lock, which are two of the four things step 6 chose Radix *for*, and `overscroll-contain`
  stops meaning anything without it.
- **The panel's shadow.** Removing `box-shadow: 0 -30px 70px -20px rgba(0,0,0,0.6)` takes it to
  176-208ms — worth ~50ms. It is drawn at `CatalogueMobile.dc.html:52` and decision 2 says the mock
  ships as drawn.

Together they would land around 110-130ms. `startTransition` around the history write was tried on
the theory that the router's re-render was blocking the paint, and made no difference at all; it
was reverted rather than shipped with a claim attached.

So: **the maintainer's to decide** whether to spend one of those two, or to accept 200-260ms on a
surface whose measured baseline is already 286ms p75 and take the win elsewhere — note the same
deploy takes lab LCP from 768ms to 436ms and First Load JS down 5.9 kB gzip. Ticket 13 is the merge
gate that reads the field figures, and this is the number it will be reading against.

**One acceptance bullet is unsatisfiable as written.** *"`document.elementFromPoint` … 8px to the
left of the Filters button's left edge … returns an element inside the grid rather than the dock or
its wrapper."* At 390px the button starts at x=14 and the dock starts at x=0, so that point is
x=6 — inside the dock's own 14px gutter, and it returns the dock. That is the correct outcome, not
a regression: the bullet describes the geometry of the old floating pill, whose sin was an
*invisible* padded wrapper that ate taps on the card behind it (commit 02c3730). The dock is a
full-width opaque bar; what paints is what responds, which is what that fix was actually about. The
guard is kept as the seam that can still go wrong — 8px above the dock's top edge, which returns
the grid, asserted at both the bar's centre and its left gutter.
