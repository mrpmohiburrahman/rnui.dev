# 14 — Stop painting "Loading sidebar..." at every visitor without JavaScript

Status: resolved

## Problem

Ticket 04 removed three server-rendered `opacity: 0` sources and a pointless Suspense boundary
around the Entry grid, and its acceptance named the catalogue. It left the sidebar, recording the
gap in its Comments. That record understated the defect.

`components/nav/nav-side-bar.tsx:33` calls `useSearchParams()`. The hook opts every ancestor out of
prerendering, so `app/layout.tsx:55`'s `<Suspense fallback={<div>Loading sidebar...</div>}>` is the
boundary that catches it. The real sidebar streams into `<div hidden id="S:0">` and an inline script
swaps it in. Without JavaScript there is no swap, so **the literal string "Loading sidebar..." stays
painted, on every route**. Measured: the string appears twice in the served HTML of `/`, `/aboutus`
and `/bookmarks`, and a JS-disabled capture at 1440x900 paints it top-left where the sidebar belongs.

This is not "the sidebar is missing". It is a stuck loading message on eleven prerendered routes,
and it is the same defect ticket 04 is named for.

What the hook is actually for: one thing. Four copies of an active-filter highlight in
`components/nav/catalogue-nav.tsx` — `:55` category, `:84` author, `:114` tag, `:144` label, each
`searchParams.get(…) === value ? "bg-yellow-400 …" : ""`. `catalogue-nav.tsx:19` already takes
`searchParams` as a **prop**; the hook is called once, upstream, and passed down at
`nav-side-bar.tsx:64` (desktop) and `:132` (mobile sheet).

### The approach that was rejected, and why it matters

The obvious fix is to stop reading the params during render and fill the highlight in after mount —
the shape ticket 04 used for the Remembered sets. It works: it builds, keeps all eleven static
routes static, kills the string, and passes the existing suite.

It also **makes ticket 11's headline acceptance impossible**. Built and measured on
`/products?category=Buttons&author=Aashu%20Dubey` with ticket 11 steps 1-2 applied verbatim:

| | composed hrefs in served HTML | highlighted chips |
|---|---|---|
| params read after mount | 0 | 0 |
| params read during render (below) | 40 | 2 |

Ticket 11 exists to make filters compose, and `facetHref(current, …)` needs the real params at render
time or every link in the served document drops the other filter. So the read has to stay during
render; only its *position* can move.

## Work

Move the read down to the smallest thing that needs it, and put the boundary around that.

1. `app/layout.tsx` — delete the `Suspense` import, the wrapper and its comment (`:3`, `:54-57`).
   `<NavSidebar>` renders directly.
2. `components/nav/nav-side-bar.tsx` — drop `useSearchParams` from the import (`:7`), the call
   (`:33`), and both `searchParams={searchParams}` prop passes (`:64`, `:132`). Nothing else moves.
3. `components/nav/catalogue-nav.tsx` — split into three, header only; the JSX body is untouched.
   - `CatalogueNavList` — the current component, renamed, with `searchParams` now optional and
     defaulting to `new URLSearchParams()`. The four `.get()` tests then return `null`, which is
     exactly "nothing highlighted".
   - `ActiveCatalogueNav` — calls `useSearchParams()` and renders `CatalogueNavList` with it.
   - `CatalogueNav` — `<Suspense fallback={<CatalogueNavList {...props} />}>` around it.

   The three-component shape is the floor React allows: calling the hook inside `CatalogueNav`
   itself puts it outside the boundary and the bail-out returns, and a conditional hook is illegal.

   The fallback is the same list with nothing highlighted, so the served document carries every
   filter link and a visitor without JavaScript can use them.

## Acceptance

- `grep -c "Loading sidebar"` on the served HTML of `/`, `/products`, `/bookmarks` and `/aboutus`
  returns 0. It returns 2 on each today.
- The served HTML of `/aboutus` contains a real `<aside>` with one `<a href="/products?category=…">`
  per Category, outside any `<div hidden>`.
- `pnpm build`'s route table is unchanged — every route that is `○` today is still `○`.
- `/` with JavaScript disabled shows a usable sidebar, not a loading string.
- A settled screenshot is unchanged at 390, 768 and 1440, in both themes.
- No hydration complaint on `/`, `/products`, `/bookmarks`, `/aboutus` or
  `/products?category=Buttons`.
- Navigating between two query-only URLs still moves the highlight.

## Open questions

- The Categories list sits in a Radix `ScrollArea` (`catalogue-nav.tsx:36`), which needs JavaScript
  to scroll. Without it a visitor sees the Categories and cannot reach the Authors below them.
  Fixing that means `type="always"` or dropping `ScrollArea`, and both change the scrollbar's
  appearance, which decision 1 freezes. Left as a known ceiling.
- The unhighlighted list is served twice — once as the fallback, once inside the hidden div. Two
  copies of 18 Categories and 24 Authors. Accepted against a stuck loading string.

## Depends on

Nothing. These three files are uncontested right now: the frontier is 02 then 03, and neither
touches nav. Tickets 05, 11 and 12 all edit them later and all need a line-number rebase, which
their own `Depends on` sections already anticipate. Nothing any of them prescribe has to be undone.

## Comments

Landed as written. Every acceptance bullet measured:

- `Loading sidebar` count on the served HTML of `/`, `/products`, `/bookmarks` and `/aboutus`:
  **2, 2, 2, 2 → 0, 0, 0, 0**.
- `<aside>` now opens at byte ~9.2K on every route, ahead of any `<div hidden id="S:">`. On the
  prerendered routes there is no hidden div at all — the boundary never suspends there, so the
  static HTML carries the sidebar outright. On `/` and `/products` the list is served twice, the
  unhighlighted fallback and the highlighted copy, as the Open questions accept.
- Route table byte-identical: every `○` before is still `○`.
- `/products?category=Buttons` carries `bg-yellow-400` **in the served HTML**, so the render-time
  read survives and ticket 11's `facetHref` will have real params to compose from.
- Query-only client navigation: `?category=Buttons` → click Carousels → `?category=Carousels` moves
  the highlight, Back restores it. Exactly one highlighted link at each step, so the live DOM holds
  one sidebar, not two.
- Settled frame at 1440x1200 vs the ticket 04 commit: **0 differing pixels** once two chips that
  drift on their own are masked — the view/vote counters that this repo's own e2e suite increments,
  and `LastUpdated`, which moved from "11 hours ago" to "1 hour ago" because `pnpm build` reruns
  `scripts/updateLastCommitDate.js` and ticket 04 had just been committed. Unmasked it reads 2080px,
  all of it inside those two chips.
- 24/24 e2e, 159 unit, `pnpm check-types` and `pnpm build` clean. `pnpm lint` unchanged at its two
  pre-existing errors in `assets/new-ui/support.js`.

**How the approach was chosen, because the obvious one is wrong.** Three were designed and judged.
Two of three judges picked reading the params after mount — smaller, removes the hook outright. An
adversarial pass built both and applied ticket 11 steps 1-2 verbatim on top of each, then curled
`/products?category=Buttons&author=Aashu%20Dubey`: the after-mount version served **0** composed
hrefs and **0** highlights, this one served **40** and **2**. Ticket 11's acceptance asks for both
chips highlighted on exactly that URL. The smaller fix would have silently made a later ticket
unachievable, and only building it against that ticket showed it.

**One claim in ticket 04's Comments was wrong and is retracted here.** It said this fix should wait
because "ticket 11 reintroduces `useSearchParams` during render". It does not.
`catalogue-nav.tsx:19` already took `searchParams` as a *prop*; ticket 11's `facetHref(current, …)`
consumes that prop and never touches `nav-side-bar.tsx:33`, `:64` or `:132`. The
`const searchParams = useSearchParams()` line cited from ticket 11 belongs to a different file.

**Known ceiling, not fixed.** The Categories sit in a Radix `ScrollArea` (`catalogue-nav.tsx:36`)
that needs JavaScript to scroll, so a JS-off visitor sees the Categories and cannot reach the
Authors below them. `type="always"` or dropping `ScrollArea` fixes it and changes the scrollbar's
appearance, which decision 1 freezes. It needs maintainer sign-off, not an implementer's judgement.
