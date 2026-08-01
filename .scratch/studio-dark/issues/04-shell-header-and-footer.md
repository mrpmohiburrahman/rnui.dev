# 04 — The shell: header and footer

Status: ready-for-agent
Blocked by: 01, 02

## Problem

Every route in the app inherits `app/layout.tsx`, so the header and the footer are the two
components a visitor sees on all ten of them. Neither is the one the mock draws, and the gap is
not a restyling — controls the mock puts in the header do not live there today, and the footer
is a different document altogether.

**The header is the wrong shape and carries the wrong things.** `components/nav/top-nav-bar.tsx:37`
is `h-[83px] fixed top-0 left-0 right-0 z-50` holding a 56px circular PNG logo
(`components/logo.tsx:9,17`) and three Radix navigation links — Bookmarks, Subscribe and "Star us
on GitHub" (`top-nav-bar.tsx:50,62,70`). It renders only at `md` and up: `app/layout.tsx:65` wraps
it in `hidden md:block`, and `app/layout.tsx:73` pays for the `fixed` with a
`pt-16 md:pt-[83px]` spacer whose comment records that the two numbers disagreeing painted the
header over the top 19px of every page. The mock's header is 62px, in flow, and holds six things
this one does not have at all: the wordmark, the counter line, the search field, the sort control,
the Saved chip and the mode toggle (`assets/new-ui/Catalogue.dc.html:13-33`).

**Two of those six exist, in the wrong place.** Search is rendered inside the home hero and
nowhere else — `app/page.tsx:20` puts `<CatalogueSearch />` inside `<Hero>`, so `/products`,
`/bookmarks` and every other route have no search box. Sort is rendered inside the grid, three
times over: `components/entry-card-grid.tsx:149-176` for desktop and `:213-246` for the phone
dropdown, with the same 340-character shadow string pasted into each of the six buttons.

**The footer is stale and off-vocabulary.** `components/site-footer.tsx:15` is a
`text-3xl md:text-5xl` heading reading "Awesome React Native UI", `:20-54` are four
lucide-iconed links to `/aboutus`, `/contactus`, `/termsofservice` and `/privacypolicy`, and
`:67` reads `&copy; 2024` — two years stale as of today. The mock's footer is four columns of
mono labels and 11.5px body text with a right-aligned two-line stamp
(`Catalogue.dc.html:146-164`). Nothing in the current file survives.

**The newsletter is on exactly one route and drags Firebase into the browser with it.**
`app/page.tsx:27` renders `<NewsletterForm />`, and `components/newsletter-form.tsx:5-7` imports
`firebase/firestore` and `@/lib/firebase` at module scope in a `"use client"` file. Spec decision
9 moves that form into the footer, which is in the root layout — so as written, the move puts the
Firestore client SDK into the shared chunk on all ten routes. That is a direct hit on the spec's
binding constraint that "the performance work is not spent" (`spec.md:147-150`).

**The `/` key hint is drawn as visible UI and nothing in the repo could answer it.**
`Catalogue.dc.html:22` draws a `/` chip inside the search field. `grep -rn "addEventListener"`
over `app/`, `components/`, `lib/`, `hooks/` and `scripts/` returns two hits, neither a keyboard
one: `components/playback-owner.tsx:179` (`timeupdate`) and `components/demo-tile.tsx:35`
(a matchMedia `change`). The only hand-written key handler in the app is
`components/interactive-video.tsx:184-185`, an Enter/Space activation on one element. There is no
document-level key listener anywhere, so this ticket introduces the first one. Spec decision 2
is what forces it: the legend is drawn, so the key works.

## Work

Colours, radii, type sizes and the two webfonts all come from the tokens ticket 02 lands. The
hex codes below are quoted so the right token can be identified, **not so they can be typed into
these files** — no literal hex belongs in either component.

1. **`app/layout.tsx` — the shell geometry.** Replace the `TopNavBar` / `NavSidebar` / `main`
   arrangement at `:64-78` with the mock's: the header first, then a
   `<div style="display:flex;align-items:stretch">` holding the rail and `<main>`, then the
   footer (`Catalogue.dc.html:13`, `:35`, `:59`, `:146`). Delete the `hidden md:block` wrapper at
   `:65`, the `pt-16 md:pt-[83px]` spacer at `:73` and the `sm:ml-[10.5rem]` on `<main>` at `:76`
   — all three exist only to compensate for a `fixed` header and a `fixed` rail. In the same pass
   change `components/nav/nav-side-bar.tsx:35` from `fixed inset-y-0 left-0 z-10` to an in-flow
   `flex-none` column so the rail sits *below* the header as drawn; everything inside that aside
   is ticket 05's and is not touched here. `<main>` takes the mock's
   `flex:1;padding:22px 26px 34px` (`Catalogue.dc.html:59`). The header and footer share the same
   26px horizontal gutter (`:13`, `:146`).

   The header is `sticky top-0 z-50` with `backdrop-filter: blur(10px)`, not `fixed` and not
   static. Sticky because `headerBg` is translucent in both modes — `rgba(10,11,13,0.92)` dark,
   `rgba(244,244,241,0.94)` light — and an alpha channel on an opaque page means nothing unless
   content passes under it; the blur value is the one the phone header states outright
   (`CatalogueMobile.dc.html:12`, `backdrop-filter:blur(10px)`). Sticky rather than `fixed`
   because a sticky element occupies its own space, which deletes the spacer arithmetic that
   `app/layout.tsx:68-72` records getting wrong once already.

   `app/layout.tsx` is a server component and already calls `getUniqueCategories()` and
   `getUniqueAuthors()` (`:23-24`, `getUniqueContributors()` after ticket 01). Compute the three
   counts here — `allRecordings.length`, `contributors.length`, `categories.length` — and pass them
   to the header as props. **Do not import `@/data/*` from the header.**
   `components/catalogue-search.tsx:54-57` records that the last value import of `@/data/*` from
   a client component was deliberately removed so `data/catalogue.ts` stops being pulled into a
   client chunk; a count re-imported in the header undoes exactly that. Measured today: 277
   Recordings, 24 Contributors, 18 Categories — the same three numbers the mock draws at
   `Catalogue.dc.html:68-70`.

2. **`components/site-header.tsx` — new client component, with the Suspense split the rail
   already uses.** It needs `useSearchParams` (sort, search seed), `usePathname` (the Saved
   chip's active state) and `useRememberedSet`, so it is `"use client"`. `useSearchParams` opts
   every ancestor out of prerendering, and its nearest boundary here is the *root layout* — the
   precise mistake `components/nav/catalogue-nav.tsx:100-110` documents, where eleven prerendered
   routes served `<div>Loading sidebar...</div>` instead of a sidebar. Copy that file's three-
   component shape verbatim (`catalogue-nav.tsx:111-125`): an outer component holding
   `<Suspense>`, an inner one that calls the hook, and a presentational one that takes
   `searchParams` with a `new URLSearchParams()` default. The fallback renders the same header
   with nothing highlighted, so the served HTML carries the whole control set. The comment at
   `:119-121` explains why this cannot be collapsed to two components; it still cannot.

   Header container: `display:flex;align-items:center;gap:18px;height:62px;padding:0 26px;
   border-bottom:1px solid {{ line }};background:{{ headerBg }}` (`Catalogue.dc.html:13`).
   `line` is `rgba(255,255,255,0.11)` dark / `rgba(16,18,22,0.13)` light.

3. **The brand.** `display:flex;align-items:baseline;gap:9px` holding two spans
   (`Catalogue.dc.html:14-16`). First: `rnui` at `font-size:16px;font-weight:700;
   letter-spacing:-0.02em` in `t1` (`#F1F2F4` dark / `#14161A` light), with `.dev` nested in
   `acc` (`#6FE3CC` dark / `#0E7062` light). Second: `RN UI RECORDINGS` in JetBrains Mono at
   `font-size:9.5px;letter-spacing:0.12em` in `t3` (`#8E949F` dark / `#666B74` light). The whole
   thing links to `/`. `components/logo.tsx` stops being imported here but stays on disk —
   `components/nav/nav-side-bar.tsx:94` still renders it inside the mobile sheet, which is
   ticket 11's to replace.

4. **The counter line.** `min-width:236px;font-size:10px;line-height:1.1;color:{{ t3 }};
   font-variant-numeric:tabular-nums;white-space:nowrap` in JetBrains Mono
   (`Catalogue.dc.html:18`), reading `277 recordings · 24 contributors · updated 13h ago`
   (`:229`) — separator is `·`, not a hyphen. The `min-width` is a reservation, not a measurement:
   it stops the row reflowing when the relative time crosses a bucket, the same failure class
   `entry-card-grid.tsx:131-143` records for the wrapped status row.

   The counts come from step 1's props, and neither is a literal in the string: `277` is
   `allRecordings.length` and `24` is `contributors.length`. The second one moves — it is 23, not
   24, as soon as the trailing space in `data/fullapps.ts:23`'s `author: "Pushkar Tandon "` stops
   that one name counting twice — so a typed `24` dates the header the day the data is tidied.
   The relative time comes from
   `scripts/lastCommitDate.json`, whose only reader today is `components/last-updated.tsx:1`.
   Extend that module rather than adding a second reader, so the header string and the footer
   string cannot disagree: export the existing `Updated: 13 hours ago` form unchanged plus a
   compact `13h ago` form. Whatever renders the compact form needs
   `suppressHydrationWarning` on the element owning the text, for the reason
   `last-updated.tsx:4-7` already states — server and client can land either side of a bucket
   boundary. Step 15 deletes the grid's Last-updated pill, which leaves the footer's stamp as the
   only `Updated:` in `/`'s served HTML — the reason this module is extended rather than replaced.
   `tests/e2e/last-updated.spec.ts:21` asserts that exact string and still finds it.

5. **The search field.** `flex:1;display:flex;align-items:center;gap:9px;max-width:400px;
   height:34px;padding:0 11px;border-radius:10px;border:1px solid {{ searchBorder }};
   background:{{ fieldBg }};box-shadow:{{ searchGlow }}` (`Catalogue.dc.html:19`). `fieldBg` is
   `rgba(255,255,255,0.045)` dark / `#FFFFFF` light. Inside: a `⌕` glyph at 12px in `t3`
   (`:20`), the value or placeholder at 12.5px (`:21`), and the key chip (`:22`).

   Empty is `searchColor = t3` and `searchBorder = line`; a term present is `searchColor = t1`,
   `searchBorder = acc` and `searchGlow = 0 0 0 3px {{ accSoft }}` — `rgba(111,227,204,0.13)`
   dark / `rgba(14,112,98,0.09)` light (`:230-233`). Note this is a *value present* state, not a
   focus state; the mock never draws focus on this field, so give it the standard focus ring the
   mock uses elsewhere — `outline:3px solid {{ acc }};outline-offset:2px` (`:78`).

   Reuse `components/catalogue-search.tsx` unchanged in behaviour: it owns the 300ms debounce
   (`:9,43`), the URL write (`:23-34`) and the half of `search_performed` that
   `entry-card-grid.tsx:96-114` depends on. Restyle its child,
   `components/ui/placeholders-and-vanish-input.tsx`, from `h-12 rounded-full` (`:47`) to the
   34px / 10px field above, and change `SEARCH_LABEL` at `:14` from `Search the catalogue` to the
   mock's `Search 277 recordings` (`Catalogue.dc.html:230`) with the count arriving as a prop
   from step 1. That constant is used twice on purpose, as `placeholder` and as `aria-label`
   (`:7-13`, WCAG 2.5.3), so both move together or neither does.

6. **The `/` key chip and the shortcut behind it.** The chip:
   `margin-left:auto;font-size:9px;color:{{ t3 }};border:1px solid {{ line }};border-radius:4px;
   padding:2px 5px` in JetBrains Mono (`Catalogue.dc.html:22`), `aria-hidden="true"` because it
   is a picture of a key, and hidden below `md` — the phone header draws no chip
   (`CatalogueMobile.dc.html:20-22`). 4px is below the Specimen's smallest radius, 6
   (`Specimen.dc.html:148`); take it as drawn and let ticket 02 decide whether the scale grows a
   step.

   The shortcut is one `useEffect` in the header with a `keydown` listener on `document`. There
   is exactly one consumer, so it does not become a hook of its own. It must return early on
   anything but a bare `/` (no `metaKey`, `ctrlKey` or `altKey`), on a target inside
   `input, textarea, select, [contenteditable]`, and on a target inside `[role="dialog"]` — the
   Recording overlay is a Radix Dialog with a real focus trap
   (`components/entry-overlay.tsx:3-8`), and yanking focus out of a trapped dialog is worse than
   not answering the key. Otherwise `preventDefault()` (so `/` is not typed into the field it
   just focused), then focus and select the input. Add `aria-keyshortcuts="/"` to the input.

7. **The sort segmented control.** Wrapper: `display:flex;align-items:center;gap:2px;padding:3px;
   border-radius:9px;border:1px solid {{ line }};background:{{ fieldBg }}`
   (`Catalogue.dc.html:24`). Each item: JetBrains Mono `font-size:9.5px;letter-spacing:0.08em;
   padding:5px 9px;border-radius:6px` (`:25-27`), active as `background:{{ accSoft }};
   color:{{ t1 }}`, inactive as `color:{{ t3 }}` on no background. Labels `RECENT`,
   `MOST VIEWED`, `MOST VOTED`.

   No state is lifted and no prop is threaded. The sort already lives in the URL:
   `hooks/use-sorted-data.ts` reads `?sort` and accepts `top-voted` and `top-viewed`, with
   `recent` spelled as the absence of the param. So `RECENT` → delete `sort`,
   `MOST VIEWED` → `sort=top-viewed`, `MOST VOTED` → `sort=top-voted`, written with the same
   `history.replaceState` the hook uses, and reporting through `sortChanged` from
   `lib/analytics.ts:159` so the event keeps firing. Preserve every other param, including
   `page` — the hook's comment records why `page` survives a sort and dies on a filter.

   The mock never draws `MOST VOTED` active: `sortA` and `sortB` are the only two variables
   (`:235-238`) and none of the eight variants sorts by votes. That is a gap in the variant list,
   not a design decision — give the third item the same active treatment as the other two.

8. **The Saved chip.** `display:flex;align-items:center;gap:6px;font-size:12.5px;
   color:{{ savedFg }};padding:6px 10px;border-radius:9px;border:1px solid {{ savedBorder }};
   background:{{ savedBg }}` reading `◆ Saved` with the count in JetBrains Mono at
   `font-size:10px;color:{{ t3 }}` (`Catalogue.dc.html:30`). On `/bookmarks` it is
   `savedBg = accSoft`, `savedBorder = acc`, `savedFg = t1`; elsewhere `transparent`, `line`,
   `t2` (`:239-242`). It links to `/bookmarks`, which is what replaces the deleted header nav
   link at `top-nav-bar.tsx:50`.

   The count is `useRememberedSet(BOOKMARKS_KEY).ids?.length ?? 0`
   (`hooks/use-remembered-set.ts:16`). `ids` is `null` until an effect has read localStorage
   (`:70`), so the server and the first client render both show `0` and the real number arrives
   a render later. Give the count span `font-variant-numeric:tabular-nums` and a `min-w-[2ch]`
   reservation so `0 → 3` cannot shove the mode toggle sideways — the same reservation failure
   `tests/e2e/last-updated.spec.ts:3-8` was written against.

9. **The mode toggle.** `font-size:12.5px;color:{{ t2 }};padding:6px 9px;border-radius:9px;
   border:1px solid {{ line }}` reading `◐ Dark` in dark mode and `◑ Light` in light
   (`Catalogue.dc.html:31`, `:243`). `t2` is `#B2B8C2` dark / `#4F545C` light.

   Restyle the *trigger* of the existing `ModeToggle` in `app/providers.tsx:32-57` and keep the
   dropdown behind it. Spec checkpoint 4 is the reason: `ui-ux-overhaul` ticket 13's Work section
   says in as many words "Do not touch `app/providers.tsx`. The toggle already offers Light, Dark
   and System … this ticket only changes what the absence of a choice means." Collapsing it to a
   two-state switch deletes the System option that decision 5 keeps as the default, and there
   would then be no way back to it. The mock draws a chip; it does not draw what happens on
   click.

   Render both labels and let CSS pick — `hidden dark:inline` on `◐ Dark`, `inline dark:hidden`
   on `◑ Light`. next-themes writes `class="dark"` or `class="light"` onto `<html>` from a
   blocking inline script before first paint (the mechanism `ui-ux-overhaul` ticket 13's Problem
   section quotes from `next-themes/dist/index.js`), so this is correct in the served document,
   needs no mount gate, and cannot mismatch on hydration. Reading `resolvedTheme` instead would
   need one and would cost a layout shift, because the two labels are not the same width. Mark
   the `◐`/`◑` glyphs `aria-hidden="true"`, keep the `sr-only` "Toggle theme" span at `:41`, and
   drop the Sun/Moon lucide icons at `:39-40` along with their `transition-all`.

10. **The phone header.** Below `md`, collapse to `CatalogueMobile.dc.html:12-23`: brand at 15px
    weight 700 letter-spacing -0.02em (`:14`); the counter line replaced by
    the compact `277 · 24 · 13H AGO` — step 4's two props again, `allRecordings.length` and
    `contributors.length`, not a second pair of typed numbers — in JetBrains Mono at
    `font-size:9px;letter-spacing:0.1em;min-width:104px`
    (`:15`); the Saved chip as `◆ 3` at `min-height:36px;padding:0 11px;border-radius:9px` (`:16`);
    the mode toggle as the bare glyph `◐` / `◑` at the same 36px (`:17`, `:115`); and the search
    field on its own row below at `min-height:40px;padding:0 11px;border-radius:10px` (`:20`),
    with no `/` chip and no sort control. The phone gutter is 14px (`:13`, `:19`). The filter
    dock, the chips row and the `contentTop` offsets in that file are ticket 11's — build the
    header only, so the site is not broken on a phone in the gap between this ticket and that
    one.

11. **`components/site-footer.tsx` — replace the file.** Container:
    `display:flex;align-items:flex-start;gap:40px;padding:24px 26px 30px;
    border-top:1px solid {{ line }};background:{{ footerBg }}` (`Catalogue.dc.html:146`).
    `footerBg` is `#0C0D11` dark / `#EFEFEB` light. It stays a server component: it reads no URL
    and no stored set, and the one interactive thing in it is the form in step 12.

    - Column 1, `max-width:300px`: the brand at `font-size:13px;font-weight:700;
      letter-spacing:-0.02em` with `.dev` in `acc` (`:148`), then
      `margin:6px 0 0;font-size:11.5px;line-height:1.5;color:{{ t2 }}` reading
      **"An open catalogue of React Native UI recordings. Every entry belongs to its
      contributor."** (`:149`) — ship it with `entry` changed to `recording`, because spec
      decision 3 puts the rename in copy as well as code and the mock predates it.
    - Column 2, `display:flex;flex-direction:column;gap:5px`: the label `CONTRIBUTE` in
      JetBrains Mono at `font-size:9px;letter-spacing:0.14em;color:{{ t3 }};padding-bottom:2px`
      (`:152`), then two links at `font-size:11.5px;color:{{ acc }};text-decoration:underline;
      text-underline-offset:3px` (`:153-154`) — `Submit a recording ↗` and `Repository ↗`. The
      second one carries the
      `https://github.com/mrpmohiburrahman/awesome-react-native-ui` href being deleted from
      `top-nav-bar.tsx:70`.
    - Column 3: label `THIS DEVICE`, then `font-size:11.5px;line-height:1.5;color:{{ t2 }};
      max-width:300px` reading **"Your saves and votes are stored in this browser only. No
      account, no sign-in, nothing synced between devices."** (`:158`).
    - Column 4: `NOTIFY`. Not drawn anywhere — `grep -rn "NOTIFY" assets/new-ui/*.html` returns
      nothing — so it is derived from decision 9. It reuses only values already in the mock: the
      column label treatment above, one sentence of 11.5px/1.5 `t2` body, the search field's own
      metrics for the email input (34px, radius 10px, `fieldBg`, 1px `line`), and the primary
      button from `Catalogue.dc.html:104` — `font-size:12.5px;font-weight:500;padding:9px 13px;
      border-radius:9px;border:none;background:{{ acc }};color:{{ onAcc }}` with
      `outline:3px solid {{ acc }};outline-offset:3px` on focus. `onAcc` is `#06120F` dark /
      `#FFFFFF` light. It also carries a link to `/subscribe` at the CONTRIBUTE column's link
      treatment, because decision 9 keeps that route and this footer is otherwise the only thing
      that could orphan it — `top-nav-bar.tsx:62` is the link being deleted.
    - Right block, `margin-left:auto`: JetBrains Mono `font-size:9.5px;line-height:1.6;
      color:{{ t3 }};text-align:right`, two lines (`:160-163`). Line one is
      `UPDATED 13 HOURS AGO` — the existing `format()` output from step 4, uppercased with CSS
      rather than a second string. Line two is `STUDIO DARK · #0A0B0D` in dark and
      `STUDIO LIGHT · #F4F4F1` in light (`:244`), rendered with the same
      `hidden dark:inline` pair as the mode toggle in step 9 rather than by reading the theme.
    - A last row under the four columns for `/aboutus`, `/contactus`, `/termsofservice` and
      `/privacypolicy`. The mock's footer has no column for them, and deleting
      `site-footer.tsx:20-54` without a replacement makes four live routes unreachable from
      anywhere on the site — the same orphaning `ui-ux-overhaul` decision 13 was written about
      for `/products`. Copy the pattern the mock already uses for a row of links, at
      `Catalogue.dc.html:137-141`: `acc` links, underlined, `text-underline-offset:3px`,
      separated by a `·` in `t3`. This introduces no value the mock does not already contain.
      Drop the lucide icons and the `&copy; 2024` line at `:67` entirely.

12. **`app/actions/subscribe-email.ts` — a new server action, so the footer does not ship
    Firestore to every route.** `"use server"`, one exported async function taking the address
    and doing the `addDoc(collection(db, COLLECTION_NAME), { email, createdAt: Timestamp.now() })`
    that `components/newsletter-form.tsx:43-49` does today. This is the delegate pattern
    `app/actions/increment-view-count.ts` already uses and states the reason for: a `"use server"`
    file is the boundary, the Firebase-shaped module stays server-side, and the client import
    graph does not change. Then strip both Firebase imports from `newsletter-form.tsx:5-7` and
    call the action instead. The component stays `"use client"` for the
    `localStorage.getItem("newsletterSubscribed")` check at `:25` and the pending state — a
    server action is a reference, not a bundle.

    While it is open: re-dress it to step 11's NOTIFY column, delete the `h2` at `:69-71`
    ("Get notified when new animation is being added", which the column label now replaces),
    and give the input an `aria-label`. It has `id="email"` at `:80` but the only
    `<Label htmlFor="email">` is at `:73`, inside the *other* branch of the ternary — so today
    the field's sole accessible name is its placeholder, and it loses that as soon as anyone
    types. Leave `app/subscribe/page.tsx` alone; its duplicate copy of the same write is ticket
    12's, and the new action is what it should call.

13. **`app/page.tsx` — delete the two renders this ticket re-homes.** `<CatalogueSearch />` at
    `:20`: the header is now the only search field, and two boxes on one page would not agree
    with each other — `catalogue-search.tsx:62` seeds `defaultValue` once at mount and then
    writes one-way, so typing in either leaves the other stale. `<NewsletterForm />` at `:27`,
    together with the wrapper `div` at `:26` that exists only to hold it: step 11 puts that form
    in the footer, which is in the root layout, so leaving this one renders the newsletter twice
    on `/` — and decision 9 is that it is present on every route, not two deep on one. Both
    imports, `:3` and `:5`, go with them.

14. **Three e2e assertions this ticket invalidates in `theme.spec.ts` and `home.spec.ts`.** All
    three cover recorded regressions; update them, do not delete them. Step 15 carries the rest.
    - `tests/e2e/theme.spec.ts:122` and `:147` drive the toggle as
      `getByRole("button", { name: "Toggle theme" })`, an exact match. The trigger now has
      visible text, so the accessible name becomes "Dark Toggle theme". Change the two selectors
      to the regex form `{ name: /Toggle theme/ }`. Keep the dropdown assertions at `:123` and
      `:148` — step 9 keeps the menu.
    - `tests/e2e/theme.spec.ts:168-180`, "the header still carries the GitHub link,
      server-rendered", exists because of the bug `top-nav-bar.tsx:1-18` documents at length: a
      Flight payload past a size threshold outlines an element into its own row, and Radix's
      `asChild` Slot drops it, so the third nav item was served empty. Re-point the test at the
      footer's `Repository ↗` link. The regression class does not follow it there — the footer's
      links are plain anchors with no `asChild` and no Radix in the path — and the test is worth
      keeping as a served-HTML assertion regardless.
    - `tests/e2e/home.spec.ts:46` carries the comment "By role, because the footer repeats the
      name twice." The new footer repeats nothing; the assertion itself still holds, so correct
      the comment rather than the code.

15. **`components/entry-card-grid.tsx` — delete the controls this ticket re-homed.** Two blocks:
    the desktop sort pills at `:149-176`, three buttons each carrying the same 340-character
    shadow string, and the status row at `:249-257`, the `LastUpdated` pill and the
    `Total Items:` pill. Step 7 is now the only sort control and step 4 the only counter, and two
    sort controls writing one `?sort` param is the same disagreement step 13 refuses for two
    search boxes. Leave the phone dropdown at `:213-246`, which is `flex sm:hidden` (`:181`):
    below `md` the header draws no sort control at all (step 10), so on a phone that dropdown is
    the only one there is. `PILL_CLASS` at `:22` keeps a caller either way — the Load more button
    at `:307`.

    Two sets of assertions read those pills.
    - `tests/e2e/served-html.spec.ts:42-43` asserts `Recent`, `Top Viewed` and `Top Voted` are in
      `/`'s served HTML. Re-point it at the header's `RECENT`, `MOST VIEWED` and `MOST VOTED`.
      The regression it guards — a Flight payload past a size threshold outlining an element out
      of the served document — reaches the header's control exactly as it reached the grid's, and
      the header is the more valuable of the two to hold in the first byte.
    - The four `Total Items:` assertions at `filters.spec.ts:134-135`,
      `nav-empty-states-layout.spec.ts:34-35` and `:73-74`, and `pagination.spec.ts:25-26` lose
      their subject; delete the four assertions and leave the tests around them, whose subjects
      are a sort, a facet link and a page size and all still hold. They do not move to the header
      counter: the pill reported the *filtered* total (`sortedData?.length`), and the header's
      `277` is the whole catalogue on every route.

## Acceptance

- On `/`, `/products` and `/bookmarks`, in both modes, the header renders the wordmark, the
  counter line, the search field, the three-item sort control, the Saved chip and the mode
  toggle, and the footer renders four column headings — `CONTRIBUTE`, `THIS DEVICE`, `NOTIFY` —
  plus the brand blurb, the `UPDATED …` line and the mode stamp.
- `grep -nE '#[0-9A-Fa-f]{3,8}\b' components/site-header.tsx components/site-footer.tsx` returns
  no matches: every colour comes from a ticket-02 token.
- `curl -s localhost:3000/products` contains `RECENT`, `MOST VIEWED` and `MOST VOTED`, the
  counter line's `recordings ·` fragment, and `Search 277 recordings` — i.e. the header is in
  the served HTML and not added after hydration. `Loading` appears nowhere in it.
- Pressing `/` anywhere on `/products` focuses the search field and does not insert a `/` into
  it. Pressing `/` while the cursor is already in that field types a `/`. Pressing `/` with a
  Recording overlay open leaves focus inside the dialog.
- `?sort=top-viewed` renders `MOST VIEWED` in the active treatment on a cold load; clicking
  `MOST VOTED` changes the URL to `?sort=top-voted` without a full navigation, preserves any
  `category`, `contributor`, `search` and `page` params already present, and emits one
  `sort_changed` event with `sort: "top-voted"`.
- With two Recordings bookmarked, the Saved chip reads `2`, and it is in the accent treatment on
  `/bookmarks` and the plain treatment on `/`. With none bookmarked it reads `0` and the mode
  toggle beside it does not move when the stored set is read.
- The mode toggle reads `◐ Dark` when `<html>` has class `dark` and `◑ Light` when it has class
  `light`, in the *served* HTML for both, with no mount gate; the footer stamp reads
  `STUDIO DARK · #0A0B0D` and `STUDIO LIGHT · #F4F4F1` on the same basis.
- `pnpm test` and the Playwright suite both pass, including the specs edited in steps 14 and 15
  and `tests/e2e/served-html.spec.ts`'s hydration check at `:175-190` (no React hydration
  complaint on any of the three routes, under both colour-scheme emulations).
- On `/products` at 1440px exactly one sort control is visible: `getByRole("button",
  { name: "Top Viewed" })` matches nothing visible, `Total Items:` appears nowhere in the
  document, and `grep -rn "Total Items" tests/` returns nothing. The newsletter form appears
  once on `/`, in the footer.
- The client bundle for `/products` contains no `firebase` module. Check the build output before
  and after: the shared layout chunk must not have grown by the Firestore SDK.
- At 390px the header matches `CatalogueMobile.dc.html:12-23` — two rows, 36px controls, the
  compact `277 · 24 · 13H AGO` counter, no sort control, no `/` chip — and nothing in the page
  is painted over by it at any scroll position. Both counters, desktop and phone, print
  `contributors.length`: `grep -n '24' components/site-header.tsx` finds no count.
- `/aboutus`, `/contactus`, `/termsofservice`, `/privacypolicy` and `/subscribe` are each
  reachable by a link in the footer.
- Every interactive thing in the header and the footer is reachable by Tab and shows a visible
  focus ring; the `/` chip and the `◐`/`◑` glyphs are `aria-hidden`.

## Depends on

**Ticket 01**, for vocabulary. The footer blurb says "recording", the mock's own `entry` notwith-
standing; the Saved chip and the sort control must preserve a `?contributor=` param they did not
set, which is `?author=` until 01 lands (`components/nav/catalogue-nav.tsx:192`); and the modules
this ticket imports from — `data/entry.ts`, `components/entry-card-grid.tsx`,
`components/entry-overlay.tsx` — are renamed by it. Writing this against the old names means
rewriting it.

**Ticket 02**, for every value in it. This header is almost entirely mono labels — the counter
line, the sort items, the `/` chip, the brand's `RN UI RECORDINGS`, all four footer column
headings and the stamp — so without JetBrains Mono self-hosted and the token table landed, there
is nothing to build against. The spec's ticket table lists no dependency for 04; that is the one
thing in it this ticket contradicts.

**Two dependencies the table has pointing the wrong way.** Ticket 08 is listed as needing 07
only, and ticket 06 as needing nothing — but step 15 strips the grid 08 rewrites of its sort
pills and its status row (`entry-card-grid.tsx:149-176`, `:249-257`) and 06 rewrites the hero
that currently holds the only search box (`app/page.tsx:20`). This ticket is what re-homes both. If either lands first the
site has no sort control or no search field at all, on any route. **06 and 08 both need 04.**

One conflict to settle, not to guess at: `line2` is drawn three different ways —
`rgba(255,255,255,0.24)` in `Catalogue.dc.html:175`, `rgba(255,255,255,0.22)` in
`Specimen.dc.html:102`, and light-mode `0.28` / `0.26` / `0.24` across the same three files. So is
`fieldBg`: `rgba(255,255,255,0.045)` desktop (`Catalogue.dc.html:175`) against
`rgba(255,255,255,0.05)` on the phone (`CatalogueMobile.dc.html:85`). Ticket 02's token table is
the single answer; this ticket consumes it and spells neither value itself.
