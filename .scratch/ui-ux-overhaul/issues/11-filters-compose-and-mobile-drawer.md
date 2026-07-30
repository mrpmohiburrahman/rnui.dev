# 11 — Make filters compose, put sort in the URL, fix the mobile drawer

Status: ready-for-agent

Decision 10, plus the two fixes at `spec.md:86-91`.

## Problem

### Corrections to the brief

- **The redirect evidence is not `middleware.ts:7-17`.** `middleware.ts:10` looks a path up in
  `LEGACY_REDIRECTS`; that table is generated in `data/categories.ts:68-70` from each row's
  display name (`/products?category=${encodeURIComponent(name)}`), and the 18 legacy paths are
  the matcher at `middleware.ts:23-43`. The claim holds — display names are the filter key *and*
  the redirect target — but the file cited does not carry it.
- **"the panel does not scroll" is not supported by the code.** `catalogue-nav.tsx:36` wraps
  every facet list in a `ScrollArea`, whose viewport is a real overflow-scroll box
  (`components/ui/scroll-area.tsx:17-19`). The desktop sidebar already depends on it: 18
  Categories plus 24 authors is ~1,400px of rows inside `calc(100vh-200px)`. What is actually
  wrong with that height is narrower, and may not be observable — see (d).
- **24 authors, not ~100** (`05-delete-dead-weight.md:154` says ~100).
  `cat data/*.ts | grep -o 'author: "[^"]*"' | sort -u | wc -l` → 24, over 277 Entries.
- Minor: the server intersects at `get-entries.ts:54-72`, not `:60-72` — the search filter is
  `:54-58`. The sort state is `hooks/use-sorted-data.ts:8`; `:7` is the hook signature.

### (a) Every facet link is written from scratch

`catalogue-nav.tsx:48` emits `` `/products?category=${encodeURIComponent(category)}` `` and `:77`
emits the same shape for `author`. A whole href, so every param the visitor already had is
dropped: Category → author discards the Category, and both discard `search`.

The server has always intersected them — `app/actions/get-entries.ts:54-58` (search), `:61-65`
(category), `:68-72` (author), applied in sequence over one array. Nothing but the links stops
a visitor reaching it. `components/catalogue-search.tsx:22-27` already builds its URL the right
way (copy the current query, set or delete one key); the sidebar is the odd one out.

### (b) Sort is component state

`hooks/use-sorted-data.ts:8` holds it in `useState`. It reaches the buttons through
`catalogue-page.tsx:60` and `:80-81` and is written by six handlers
(`entry-card-grid.tsx:73, 83, 92, 138, 148, 158`). Nothing touches the URL, so every facet link —
a real navigation — remounts the tree and the sort silently returns to Recent. It is also
unshareable: no URL describes "Top Voted".

`02-paginate-and-strip-grid-motion.md` defers "whether `page` should survive a sort change" to
this ticket.

### (c) The mobile trigger scrolls away, and mobile has no author facet

`nav-side-bar.tsx:83-91` is a wrapper `div` with inline `position: "absolute", top: 10`. No
ancestor is positioned: `app/layout.tsx:29-58` is `html` → `body` → `div.flex.flex-1.pt-16`, and
`ThemeProvider`, `PostHogProvider` and `TooltipProvider` render no element of their own
(`app/providers.tsx:19-21`, `lib/posthog-provider.tsx:27-32`). Its containing block is therefore
the initial containing block, which is anchored to the document — so it scrolls away at 10px.

The `sticky top-0 z-30` header at `:92-96` cannot compensate. Its containing block is that same
wrapper, whose height is the header's own, so the sticky range is zero. It is inert.

On `<sm` the trigger inside it (`:100`, `sm:hidden`) is the only route to Categories:
`TopNavBar` is `hidden md:block` (`app/layout.tsx:52`) and the aside is `hidden sm:flex`
(`nav-side-bar.tsx:47`). Past ~10px of scroll a phone visitor cannot filter at all.

Separately, `:127-133` renders `CatalogueNav` without `authors`, while the desktop call at
`:59-65` passes it. The author facet is desktop-only.

### (d) The drawer's scroll height is measured against the wrong box

`catalogue-nav.tsx:36` is `h-[calc(100vh-320px)] md:h-[calc(100vh-200px)]`. Inside the drawer
that has nothing to do with the drawer: `SheetContent` is `inset-y-0 h-full` (`ui/sheet.tsx:41`)
and `100vh` on iOS is the *large* viewport, measured with the URL bar hidden. So the ScrollArea
can be taller than the visible panel, and rows past the visible bottom sit in a box that
believes it fits — it never scrolls to them — while the drawer itself is `position: fixed` with
body scroll locked by Radix. The 320px reserve absorbs most of the URL-bar height, so this may
not be reproducible today. Adding 24 authors is what makes it matter. Step 6 measures before it
changes anything.

## Work

**1 — `components/nav/catalogue-nav.tsx`: one href builder.** At module scope:

```tsx
// Every facet link keeps the params it did not set, so filters compose — the
// server has always intersected them (app/actions/get-entries.ts:54-72).
// Clicking the facet that is already on removes it: without that there is no
// way out of an intersection short of leaving the page.
function facetHref(current: URLSearchParams, key: string, value: string) {
  // useSearchParams() returns a ReadonlyURLSearchParams whose set/delete throw.
  const params = new URLSearchParams(current)
  if (params.get(key) === value) params.delete(key)
  else params.set(key, value)
  params.delete("page")
  const query = params.toString()
  return query ? `/products?${query}` : "/products"
}
```

2. Replace `:48` with `href={facetHref(searchParams, "category", category)}` and `:77` with
   `href={facetHref(searchParams, "author", author)}`. Drop the `encodeURIComponent` calls —
   `URLSearchParams.toString()` encodes. It spells a space `+` where `data/categories.ts:69`
   spells it `%20`; both decode to the same string, so `?category=Arc+Sliders` and the
   `searchParams.get("category") === category` active test at `:55` keep working. Do not
   lowercase, slugify or otherwise touch the display name — it is the key the 18 legacy
   redirects land on.
3. If the Tags and Labels blocks (`:96-124`, `:126-156`) are still present when you land this,
   route them through the same helper rather than leaving two spellings in the file. Ticket 05
   deletes both.

**4 — `hooks/use-sorted-data.ts`: read the sort from the URL.** Keep the returned shape
`{ sortedData, sort, setSort }` exactly, so `catalogue-page.tsx` and `entry-card-grid.tsx` are
untouched. Replace the `useState` at `:8` with:

```tsx
const searchParams = useSearchParams()
const param = searchParams.get("sort")
const sort: SortType =
  param === "top-voted" || param === "top-viewed" ? param : "recent"

const setSort = (next: SortType) => {
  const params = new URLSearchParams(window.location.search)
  if (next === "recent") params.delete("sort")
  else params.set("sort", next)
  // `page` survives: sorting changes the order of the visible cards, not which
  // Entries match, and dropping it would collapse a loaded grid back to 48.
  const query = params.toString()
  window.history.replaceState(
    null,
    "",
    query ? `?${query}` : window.location.pathname
  )
}
```

`replaceState`, not `router.replace`: the sort is applied client-side, so a navigation would
buy a server render and a Firestore read for nothing. This is the pattern ticket 02 already
chose for `page`. `replaceState` rather than `pushState` because a sort is a mode, not a step —
Back should leave the page, not undo three toggles. Any unknown `sort=` value falls back to
Recent rather than rendering nothing.

5. `useSearchParams` under `app/bookmarks/page.tsx` — that route is a statically rendered client
   page, so `pnpm build` may report the missing-suspense-boundary error. If it does, wrap
   `<CataloguePage>` at `bookmarks/page.tsx:48` in `<Suspense>`, exactly as `app/layout.tsx:56-58`
   already does for `NavSidebar`. Ticket 02 hits the same wall from `entry-card-grid.tsx`; one
   boundary covers both.

**6 — `components/nav/nav-side-bar.tsx`: the trigger, and the authors.**

7. `:83-91` — delete the inline `style` object entirely and make the wrapper
   `className="fixed top-[10px] z-30 flex flex-col gap-4 pb-2 px-2"`. The `borderColor: "black"`
   in that object paints nothing (its `borderWidth` is commented out at `:86`). With `left`
   unset, `fixed` resolves it to the same static position `absolute` did, so at scroll 0 the
   trigger paints exactly where it does today; from then on it stays. This is the pixel decision
   10 asks for — the button stops leaving the screen — and it is the only one in this ticket.
8. `:92-96` — delete `sticky top-0 z-30` and the `sm:static` that only existed to undo it. `z-30`
   moves to the wrapper in step 7, so paint order is unchanged. Keep every other class.
9. `:127-133` — add `authors={authors}` to the mobile `CatalogueNav`, matching `:59-65`. This
   adds an Authors section to the drawer, which decision 10 asks for.

**10 — (d), measured before it is changed.** With the drawer open at 390×844 in a browser that
shows a URL bar, scroll the facet list to its end and click the last author. If it is reachable,
change nothing and record that here. If it is not, change the mobile arm only:
`h-[calc(100vh-320px)]` → `h-[calc(100svh-320px)]` at `catalogue-nav.tsx:36`, leaving
`md:h-[calc(100vh-200px)]` untouched so no desktop pixel moves.

**11 — `tests/e2e/filters.spec.ts`**, following `tests/e2e/home.spec.ts` including its PostHog
`route` abort:

- from `/products?category=Buttons`, clicking an author link gives a URL carrying both params,
  and a card count lower than either filter alone;
- clicking the Category that is already active removes `category=` and leaves `author=`;
- from `/products?sort=top-voted`, clicking a Category link keeps `sort=top-voted` in the URL;
- with `test.use({ viewport: { width: 390, height: 844 } })`: scroll the page 2,000px, click
  `Toggle Menu`, and assert an author link inside the drawer is visible and clickable.

12. `pnpm check-types && pnpm lint && pnpm test && pnpm exec playwright test`.

## Acceptance

- `grep -n "products?category=\|products?author=" components/nav/catalogue-nav.tsx` returns
  nothing.
- `/products?category=Buttons&author=Hewad+Mubariz` renders the intersection, and both chips are
  highlighted; the same URL reached by two clicks from `/products` produces the identical count.
- `/?search=slider` → click a Category → the URL still carries `search=slider`.
- Selecting Top Voted puts `sort=top-voted` in the address bar with no document request in the
  network panel; selecting Recent removes the param rather than setting `sort=recent`.
- Selecting Top Voted, then clicking a Category link, leaves Top Voted selected. Reloading that
  URL cold renders the same order.
- `/products?sort=banana` renders Recent order and 277 Entries, not an empty grid.
- At 390×844, scrolled 2,000px down `/products`, the Toggle Menu button is on screen; opening it
  shows Categories and Authors, and the last row of each can be reached and clicked.
- Screenshots of `/`, `/products` and `/bookmarks` **at scroll 0**, at 390px, 768px and 1440px,
  light and dark, are identical before and after.
- `curl -sI <deploy>/buttons` still redirects to `/products?category=Buttons`, and the other 17
  legacy paths still redirect; `pnpm test` (which includes `tests/data-integrity.test.ts`) passes.

## Open questions

1. **Clicking an active facet clears it.** New behaviour, not in the 16 decisions, and it costs
   no pixels — the yellow active state at `catalogue-nav.tsx:55` already marks which link would
   clear. It is included because once filters compose there is otherwise no way to drop one
   filter and keep the other. Confirm with the maintainer; if rejected, an explicit clear
   control is new pixels and needs its own decision.
2. **The trigger is fixed while scrolling.** At rest nothing changes, but from 10px down it now
   floats over the grid on mobile where before it was gone. Decision 10 requires it; what it
   overlaps is worth one look at 390px before merge.

## Depends on

Nothing. Two interactions to be aware of: ticket 05 rewrites both files touched here (it deletes
the admin branches from `nav-side-bar.tsx` and the Tags/Labels blocks from `catalogue-nav.tsx`),
so whichever lands second should anchor on the code quoted above rather than the line numbers.
Ticket 02 introduces the `page` param that step 1 clears and step 4 preserves; both are no-ops
until it lands.
