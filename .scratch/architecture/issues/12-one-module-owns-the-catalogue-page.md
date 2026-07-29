# 12 — One module owns the catalogue page

**What to build:** The home page, the Category listing and the bookmarks page render
from one module instead of three near-identical ones.

Each of the three repeats the same four-hook preamble in the same order, the same
hydration guard returning an empty element while stored state loads, the same grid
call, and the same modal tail. The only real differences are a heading, an
animation, and where the Entries come from.

By the time this lands the three have no behavioural difference left at all. Ticket
09 removed the vote wrappers that were the only divergence in what they did; ticket
10 removed the dead props and the address sniffing that were the only divergence in
what they passed. So this is a move rather than a merge, and it can be reviewed as
one: if the diff contains a behaviour change, an earlier ticket was incomplete and
this one should stop.

The module needs a name, and the glossary does not have one. `CONTEXT.md` defines
eight terms — Entry, Category, Demo, Poster, Asset, Asset path, Staging copy,
Published Asset — and none of them names the thing that renders a catalogue for
three routes. ADR-0004 says names are invented in the glossary and then adopted by
the code, never the other way round, so adding the term is part of this ticket
rather than a decision made in a filename. The one module in the tree still carrying
a name for a concept the glossary does not have retires with it.

**Blocked by:** 09 and 10. Both edit the same three page modules and the card
surface this one freezes; landing this first means touching all three files twice.

**Status:** resolved

- [x] One client module renders the catalogue for all three routes
- [x] The term for it is added to `CONTEXT.md` with its own _Avoid_ list before the module is named, and the name comes from that term
- [x] The bookmarks route keeps its own fetch, since unlike the other two it has no server component above it
- [x] All three routes keep their current addresses, and every legacy Category redirect still lands exactly where it did
- [x] The hydration placeholder is written once
- [x] The last component name in the tree that names a concept the glossary does not have is retired
- [x] Type check, build and end-to-end tests all pass

No new abstraction is invented. Where the three differ in shape, the module takes
whichever of the three already had it. Any behaviour change at all means stopping
and finishing the earlier ticket instead.

## Comments

**Implemented 2026-07-30.**

### The term, first

`CONTEXT.md` gains a third section, **The site**, holding one term:

> **Catalogue page**: The client module that renders a set of Entries: the sort
> controls, the grid of cards, and whichever Entry the visitor has opened. Three
> routes render one — the home page, a Category listing and the bookmarks page —
> and they differ only in their heading and where their Entries come from. It never
> fetches; it is handed the Entries it renders.
> _Avoid_: directory, listing, index, feed, results

A new section rather than a line under *The catalogue*, because the eight existing
terms are all about data and this one is about rendering. Ticket 13 has a second
term to add if its module needs one, and it belongs in the same section.

The module is `components/catalogue-page.tsx`, `CataloguePage`, from that term.
`DirectoryPageClient` and `EntriesPageClient` are deleted.

### The off-glossary name was in two files, not one

The ticket expected one. `DirectorySearch` carried "Directory" too, and retiring
only `DirectoryPageClient` would have left it as the last one. It is
`CatalogueSearch` in `components/catalogue-search.tsx` now, which matches
`CatalogueNav` next to it.

"Directory" survives in two lines of `components/hero.tsx`, both inside
commented-out template blocks from whatever starter this began as — "Next.js
Supabase Directory". Not a name and not rendered. Those blocks are also why the
linter reports seven unused imports in that file. Deleting them belongs to a
sweep, not to this diff, which has to stay readable as a move.

### The move is smaller than the module count suggests

The part all three shared is exactly `<EntryCardGrid>{children}</EntryCardGrid>`
followed by `<CardModal />`, so `CataloguePage` returns a fragment and each route
keeps its own wrappers — the outer `div`, and `FadeIn` where it had one. Written
any other way, one of the three would have gained or lost a wrapper.

The home page loses one `<div>` with no className, which was
`DirectoryPageClient`'s root. `app/globals.css` has no child, `:first-child` or
`:last-child` selectors, so nothing could have depended on it.

The heading block for `/products` — the five filter icons and the
`GradientHeading` — moved up into `app/products/page.tsx` as children. It needs no
client boundary: `GradientHeading` has no hooks and lucide icons render fine on the
server. With it went the five props (`search`, `category`, `label`, `tag`,
`author`) that existed only to render it.

`sortedData` is `entries` on the new module. It was the *unsorted* list being
handed to `useSortedData`; the old name described what came back out, not what went
in.

### One real regression, avoided

The bookmarks route called `useBookmarks` and passed both the set and the toggle
down. Collapsing naively — the route keeps its hook for the fetch, the module calls
its own — makes two independent instances of a hook whose state comes from
localStorage. Un-bookmarking from a card would update the module's copy and write
localStorage, and the route's copy would never hear about it, so the card would stay
in the list until a reload.

So the route no longer reads the set at all. It fetches the whole catalogue and
passes `bookmarkedOnly`, and the filter runs inside `CataloguePage` against the same
set the toggle writes. Removing a bookmark drops the card immediately, as it did
before.

The cost, named: a visitor with no bookmarks now triggers one catalogue fetch that
the old code skipped, because the route no longer knows whether the set is empty
before it fetches. One `getEntries()` call — already `cache`d, and the same call the
home page makes on every visit. The alternative was two copies of a set that lives
in the visitor's browser, which is the class of bug ticket 13 exists to end.

### Verified

| Check | Result |
| --- | --- |
| `pnpm check-types` | clean |
| `pnpm lint` | 0 errors, 31 warnings |
| `pnpm test` | 74 passed |
| `pnpm build` | clean |
| `pnpm exec playwright test` | 6 passed |
| `/`, `/products`, `/products?category=Buttons`, `/bookmarks` | 200 |
| 8 legacy Category paths | 307 to the same `/products?category=…` — `/buttons`, `/circular-progress-bars`, `/miscellaneous`, `/bottomsheets`, `/fullapps`, `/dropdowns`, `/tabbars`, `/arcsliders` |

`middleware.ts` is byte-unchanged, so the redirects could not have moved; they were
checked against a running server anyway, the way ticket 02 checked them.
