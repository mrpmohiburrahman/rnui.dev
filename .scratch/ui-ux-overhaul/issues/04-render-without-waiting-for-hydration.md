# 04 — Stop serving an invisible page

Status: resolved

## Problem

Three causes, all verified by reading the files.

**1. The blank guard.** `components/catalogue-page.tsx:66-68` returns `<div />` while either
Remembered set is `null`. `hooks/use-remembered-set.ts:72` starts each set at `null` and fills it
only from an effect (`hooks/use-remembered-set.ts:75-102`), which never runs on the server, so the
guard is always taken during SSR. The heading is handed to the Catalogue page as `children`
(`app/page.tsx:18-31`, `app/products/page.tsx:36-64`, `app/bookmarks/page.tsx:49-51`) and rendered
inside the grid (`components/entry-card-grid.tsx:61`), so the guard drops that too. The served HTML
of `/`, `/products` and `/bookmarks` therefore has no `<h1>` (`components/hero.tsx:14`), no sort
controls and no Entries.

**2. `FadeIn` server-renders `opacity: 0`.** Confirmed, not assumed: rendering the exact prop set
from `components/cult/fade-in.tsx:15-28` through `react-dom/server` against this repo's
framer-motion 11.15 emits `<div style="opacity:0;transform:translateY(24px)">`. It wraps the whole
page on `/` (`app/page.tsx:16-33`) and `/products` (`app/products/page.tsx:34-66`).

**3. Every card server-renders `opacity: 0` as well.** `components/entry-card.tsx:133-134`; the
same SSR check emits `<div class="group relative …" style="opacity:0;transform:translateY(10px)">`.
Fixing 1 and 2 alone would put markup into the HTML that is still invisible, so this ticket is not
verifiable without it.

`components/modal.tsx:40` also sets `opacity: 0`, but `Modal` renders nothing while closed
(`components/modal.tsx:26`), so it is absent from the served HTML. Nothing else in `components/`
or `app/` server-renders a zero opacity.

### Corrections to the brief

- **No skeleton is needed, and none is added.** The brief asks to "reserve the exact space the
  saved-state controls will occupy". Nothing they occupy varies. The Bookmark control is
  `absolute top-4 right-4` (`components/entry-card.tsx:150`) — out of flow, zero layout
  contribution — and both of its icon branches are `h-5 w-5`
  (`components/entry-card.tsx:158,160`); only colour and opacity differ
  (`components/entry-card.tsx:151-153`). Both Star branches are `h-5 w-5`
  (`components/entry-card.tsx:269,271`). The counts beside them come from the Entry, not from a
  Remembered set (`components/entry-card.tsx:52-53`). On `/` and `/products` the Entries rendered
  do not depend on a Remembered set at all — `bookmarkedOnly` is false there, so `visible` is
  `entries` (`components/catalogue-page.tsx:53-59`). A skeleton would be reserving space that is
  already reserved.
- **The one place content does depend on a Remembered set is `/bookmarks`, and a skeleton there
  would be a guess.** That route fetches client-side and starts at `entries: []`
  (`app/bookmarks/page.tsx:25`), so the server has nothing to draw placeholders for and no count
  to draw them from.
- **Removing the guard exposes a latent bug.** `components/catalogue-page.tsx:55` reads
  `bookmarkedOnly && bookmarks ? filter : entries`. That `bookmarks` null-check is unreachable
  today because the guard returns first. Once the guard goes, a null set on `/bookmarks` falls
  through to `entries` — the whole catalogue. Step 3 fixes it.

## Work

1. `components/entry-card.tsx` — delete `initial={{ opacity: 0, y: 10 }}` and
   `animate={{ opacity: 1, y: 0 }}` (`:133-134`). Leave `layout` on `:132` alone; that removal and
   the sort-reorder reasoning belong to decision 16's own ticket. This is the first half of
   decision 16, taken here because acceptance below cannot otherwise be checked.
2. `components/catalogue-page.tsx` — delete the guard and its comment (`:62-68`). Pass
   `bookmarks ?? []` and `votedEntryIds ?? []` to `EntryCardGrid` (`:76`, `:78`).
3. Same file, the `visible` memo (`:53-59`) — make a null set mean "none remembered yet", not
   "everything":
   ```ts
   bookmarkedOnly
     ? entries.filter((entry) => bookmarks?.includes(entry.id) ?? false)
     : entries
   ```
4. Delete `components/cult/fade-in.tsx`, both `<FadeIn>` wrappers and both imports:
   `app/page.tsx:4,16,33` and `app/products/page.tsx:7,34,66`. Grep confirms no other consumer.
   The wrapper is a bare `<div>` with no className, so unwrapping it is layout-neutral. Removing
   it also drops the scroll-triggered fade, which the spec lists under Motion → Removed.
5. Where the deleted comment was, leave one line recording why `[]` is safe: server render and
   first client render both see an empty set, so there is no hydration mismatch, and the effect
   fills it on the next render.

## Acceptance

- View-source of `/` contains `Awesome React Native UI` inside an `<h1>`, all three sort buttons,
  and one card per Entry.
- View-source of `/bookmarks` contains `<h1 …>Bookmarks</h1>`.
- `style="opacity:0"` appears nowhere in the served HTML of `/`, `/products` or `/bookmarks`.
- `/` loaded with JavaScript disabled shows the catalogue, readable, not blank.
- `grep -rn "cult/fade-in" app components` returns nothing, and `components/cult/fade-in.tsx`
  does not exist.
- With bookmarks in `localStorage`, `/bookmarks` shows at most the bookmarked count at every
  frame of load — the full catalogue never appears.
- No React hydration-mismatch warning in the console on any of the three routes.
- A screenshot of `/` once settled is pixel-identical before and after this change.

## Open questions

- A visitor who has bookmarked or voted sees those icons change one render after hydration:
  the Bookmark goes `opacity-10` → `opacity-100` and the Star fills
  (`components/entry-card.tsx:151-153,268-272`). No layout moves, but it is a visible pop on a
  card that was already painted. Accept it, or hold both controls hidden until the sets are read?
  That is a visual call, so it is not decided here.
- Step 1 overlaps decision 16's ticket. If that ticket lands first, step 1 is already done; if it
  lands second, it should find only `layout` left to remove.

## Depends on

nothing

## Comments

Steps 1 to 5 landed as written. `components/cult/fade-in.tsx` is gone, both wrappers with it;
`entry-card.tsx` keeps only `layout`; the guard is deleted and the memo now reads a null set as
"nothing remembered yet". Verified by a new `tests/e2e/served-html.spec.ts`, which asserts against
`request.get` rather than `page.goto` so no JavaScript ever runs. 19/19 e2e, 159 unit,
`pnpm check-types` and `pnpm build` all pass. `pnpm lint` still reports its two pre-existing errors,
both in `assets/new-ui/support.js` — the kept Studio Dark mock, untouched here.

**The Problem section is wrong on one point, and the acceptance could not be met without noticing.**
"Nothing else in `components/` or `app/` server-renders a zero opacity" — the rotating search
placeholder does, `components/ui/placeholders-and-vanish-input.tsx`, serving
`style="opacity:0;transform:translateY(5px)"` on the caption of the search box on `/`. Fixed with
`initial={false}` on its `AnimatePresence`, which suppresses both the mount animation and the
serialised style, and only for children present on the first render — every later swap still fades.
This is the SSR half only. The 3-second cycle itself is still there, still unowned; ticket 03 notes
that and asks for a follow-up ticket to take it along with the dead `vanishAndSubmit` machinery.

**A fourth cause the ticket does not list.** `entry-card-grid.tsx` wrapped the grid in
`<Suspense fallback={<div>Loading...</div>}>`. Nothing inside is async, but React still emitted the
fallback and streamed all 277 cards into `<div hidden id="S:1">` for an inline script to swap in — so
the cards were in the served bytes and invisible to anyone without JavaScript, which is exactly the
defect this ticket is named for. Removed. Confirmed by rebuilding with and without it: with the
boundary, one `Loading...` and two hidden divs; without, the grid renders inline.

**Acceptance bullet 8, measured rather than argued.** 1440x1200, `networkidle` plus 3s, ImageMagick
`compare -metric AE`. Two captures of the *same* build differ by 4px, so that is the floor. HEAD vs
this change came out at 227px — all of it two live Firestore counters that this repo's own
`vote.spec.ts` and `view.spec.ts` had incremented between the captures, at identical string widths,
in one 634x74 band. Masking that band: **0 differing pixels**. Decision 1 holds. Not committed as a
test — pinning a screenshot against counters that move on every e2e run is a permanently flaky test.

**Both Open questions.** The first is shipped as "accept it": a visitor with saved state sees the
Bookmark and Star flip one render after hydration. No layout moves. Reverting it means holding both
controls hidden until the sets are read, which is the guard again, in miniature. The second is
answered — step 1 is done here, so decision 16's ticket will find only `layout` left to remove.

**Left open, and outside this ticket's letter.** `app/layout.tsx:55` wraps `NavSidebar` in a Suspense
that genuinely suspends, on `useSearchParams` in `components/nav/nav-side-bar.tsx`. The sidebar still
ships inside `<div hidden id="S:0">` and stays invisible without JavaScript. Acceptance bullet 4 names
the catalogue and passes, but the page is not whole without scripts. Nav belongs to ticket 12.

> **Retracted — see ticket 14, which fixes it.** Two things above are wrong. The defect is worse
> than "stays invisible": the fallback string `Loading sidebar...` is *painted*, on all eleven
> prerendered routes, and stays there. And deferring it to ticket 12 was justified by the claim that
> ticket 11 would reintroduce `useSearchParams` during render anyway — it does not; ticket 11
> consumes the `searchParams` **prop** that `catalogue-nav.tsx:19` already declares. Ticket 14 moves
> the hook down to the one component that needs it and deletes the layout boundary.

**Two notes for whoever works here next.** Turbopack's incremental cache served stale output twice
during this ticket — a change to a `motion` prop compiled in 3.8s and did not reach the HTML.
`rm -rf .next` before believing a negative result. And `pnpm build` rewrites `public/sitemap-0.xml`
with a fresh `lastmod`; that is build noise, not work, and does not belong in the commit.
