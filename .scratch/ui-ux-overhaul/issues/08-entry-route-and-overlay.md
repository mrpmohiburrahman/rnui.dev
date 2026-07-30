# 08 — Give every Entry its own address

Status: ready-for-agent

Decision 5. The animation is settled by `.scratch/ui-ux-overhaul/motion-brief-overlay.md`;
implement it exactly and do not re-decide any of it.

## Problem

277 Entries share one URL. The detail view is `useState` in `hooks/use-modal.ts:6-7`, opened
from the card's `onClick` (`entry-card.tsx:97-99`, wired at `entry-card.tsx:136`) and rendered
by the Catalogue page at `catalogue-page.tsx:86-90`. Nothing about which Entry is open reaches
the address bar, so nothing is shareable, crawlable, or dismissable with Back.

`components/modal.tsx` is 73 lines and has no portal, no focus trap, no Escape handler and no
scroll lock — the whole file is `AnimatePresence` plus three `motion.div`s. It does declare
`role="dialog" aria-modal="true"` at `modal.tsx:48-50`, so it tells assistive technology it is
modal while behaving as though it is not: focus stays reachable in the 277 cards behind it.

The motion defects the brief names are all present:

- Double backdrop fade. The wrapper fades `0 → 1` via `backdropVariants` (`modal.tsx:14-17`,
  applied at `31-34`) and the inner backdrop fades `0 → 0.5` inline (`modal.tsx:40-43`). The two
  opacities multiply.
- `y: -50` at `modal.tsx:20`.

### Corrections to the brief

- **"7 captions are duplicated" is wrong — it is 8, and 9 if a slug lowercases.** Eight caption
  strings appear on two Entries each (16 Entries): `iOS shutdown slider`, `Transitions`,
  `Split Button`, `Snake`, `Parallax Effect`, `Grid Magnification`, `Flash Cards`,
  `Circular Carousel`. A ninth pair collides only after case-folding — `Add to cart` and
  `Add To Cart`. The conclusion is unchanged and stronger: the route key is the `id`.
- **"`@radix-ui/react-dialog` … currently unused here" (motion brief line 54) is false.**
  `components/ui/sheet.tsx:4` already imports it as `SheetPrimitive`, and the Sheet renders on
  every page through `nav-side-bar.tsx`. Good news, not bad: Radix Dialog's JS is already in the
  bundle, so this ticket adds no weight.
- `id` as the Firestore document key is confirmed: `counters-firestore.ts:51` and `:67` pass
  `entryId` straight to `doc(db, COLLECTION_NAME, entryId)`. All 277 ids are 26-character ULIDs,
  URL-safe as they stand, and `tests/data-integrity.test.ts:26-31` enforces uniqueness. They must
  not change and need no encoding.
- **ADR 0007 and the code disagree about whether opening an Entry is a view.** The ADR's third
  line counts "when a visitor opens an Entry"; `entry-card.tsx:93-99` carries a comment
  deliberately deciding the opposite. **Do not resolve it here.** This ticket moves the detail
  view and changes nothing about counting: `entry-detail` keeps passing `incrementViewCount` to
  `InteractiveVideo` exactly as `card-modal.tsx:21-29` does today. The contradiction belongs to
  the view-counting ticket (decisions 3 and 7).

## Work

The URL changes with the native History API, not `router.push`. Next documents `pushState` as
syncing `usePathname`, it costs no server render and no Firestore read, and it is already the
pattern ticket 02 uses for `?page=`. `router.push` would re-run the server component and refetch
the whole catalogue on every open, which at 10–30 opens per session is the worst thing that could
sit in front of the site's most repeated action.

1. **`components/entry-detail.tsx`** — `git mv components/card-modal.tsx components/entry-detail.tsx`.
   Keep the JSX at `card-modal.tsx:33-83` byte-for-byte, including every `className`. Change only:
   props become `{ entry }: { entry: Entry }`, drop the `<Modal>` wrapper and the
   `{selectedEntry && …}` guard, rename `selectedEntry` to `entry` throughout, export as
   `EntryDetail`. The `<h2>` at `card-modal.tsx:58-60` stays exactly as it is; the dialog's
   accessible name is handled in step 2, so this file knows nothing about Radix and both the
   overlay and the standalone page can render it.

2. **`components/entry-overlay.tsx`** — new, replaces `components/modal.tsx` (delete that file).
   Radix supplies portal, focus trap, Escape and scroll lock; framer supplies the two fades.

   ```tsx
   const EASE = [0.19, 1, 0.22, 1] as const

   export function EntryOverlay({ entry, onClose }: { entry: Entry | null; onClose: () => void }) {
     const reduce = useReducedMotion()
     const enter = reduce ? 0.12 : 0.18
     return (
       <Dialog.Root open={!!entry} onOpenChange={(open) => { if (!open) onClose() }}>
         <AnimatePresence>
           {entry && (
             <Dialog.Portal forceMount>
               <Dialog.Overlay asChild forceMount>
                 <motion.div
                   className="fixed inset-0 z-50 bg-black"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 0.5, transition: { duration: enter, ease: EASE } }}
                   exit={{ opacity: 0, transition: { duration: reduce ? 0.1 : 0.14, ease: EASE } }}
                 />
               </Dialog.Overlay>
               <Dialog.Content asChild forceMount aria-label="Entry details" aria-describedby={undefined}>
                 <motion.div
                   className="fixed left-1/2 top-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-[calc(100%-2rem)] p-6"
                   initial={{ opacity: 0, scale: 0.98, x: "-50%", y: "-50%" }}
                   animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%", transition: { duration: enter, ease: EASE } }}
                   exit={{ opacity: 0, scale: 0.98, x: "-50%", y: "-50%", transition: { duration: reduce ? 0.1 : 0.1, ease: EASE } }}
                 >
                   {/* close button: the exact markup at modal.tsx:56-62, wrapped in <Dialog.Close asChild> */}
                   <EntryDetail entry={entry} />
                 </motion.div>
               </Dialog.Content>
             </Dialog.Portal>
           )}
         </AnimatePresence>
       </Dialog.Root>
     )
   }
   ```

   Notes that are not optional:
   - `AnimatePresence` stays in its default mode. Not `mode="wait"` (brief, line 43).
   - The overlay is one node fading `0 → 0.5 → 0`. That is the double fade deleted, and `y: -50`
     is gone with the file.
   - The panel's width: today it is `max-w-3xl w-full mx-4` inside a `fixed inset-0` flex
     centring wrapper (`modal.tsx:29`, `:51`) — i.e. `min(100vw − 2rem, 48rem)`.
     `max-w-3xl w-[calc(100%-2rem)]` on a fixed, body-portalled element renders identically.
     Confirm with a screenshot, not by reading.
   - `x`/`y` at `-50%` must be repeated in `initial`, `animate` **and** `exit`: framer writes
     `transform` wholesale, so a Tailwind `-translate-x-1/2` would be overwritten by the `scale`.
   - Radix logs a dev warning without a `Dialog.Title`. `aria-label` on `Dialog.Content` gives the
     dialog the same accessible name it has today (`modal.tsx:50`); `aria-describedby={undefined}`
     silences the description warning. If the warning still fires, wrap the `<h2>` in
     `EntryDetail` with `<Dialog.Title asChild>` rather than adding hidden text.

3. **`app/providers.tsx`** — wrap the tree in `<MotionConfig reducedMotion="user">` from
   `framer-motion`, inside `NextThemesProvider`. This is the brief's global reduced-motion
   decision (line 48-50) and it is what drops the `scale`; the `reduce` durations in step 2 are
   the part `MotionConfig` cannot express. Blast radius is small: `useReducedMotion` is honoured
   in exactly one other file today (`cult/fade-in.tsx:11`), and tickets 02 and 04 remove the other
   two motion users.

4. **`components/catalogue-page.tsx`** — delete the `useModal` import and call (line 16, 51) and
   delete `hooks/use-modal.ts`. Derive the open Entry from the address:

   ```tsx
   const pathname = usePathname()
   const openEntry =
     (pathname.startsWith("/entry/") &&
       entries.find((e) => e.id === pathname.slice("/entry/".length))) || null
   ```

   Search `entries`, not `visible` or `sortedData`: un-bookmarking the open Entry from inside the
   panel must not make the panel vanish mid-interaction. Render
   `<EntryOverlay entry={openEntry} onClose={() => window.history.back()} />` where `<CardModal>`
   is today (`catalogue-page.tsx:86-90`).

   `history.back()` is the whole close path — Escape, the close button, the backdrop and the Back
   button then do one identical thing. It is safe because the overlay can only be open on a
   `/entry/…` pathname that this page pushed itself; a cold `/entry/…` renders step 6's page
   instead, which has no overlay.

5. **`components/entry-card.tsx` and `components/entry-card-grid.tsx`** — the card owns its own
   address. `entry-card.tsx:97-99` becomes:

   ```tsx
   const handleClick = useCallback(() => {
     window.history.pushState(null, "", `/entry/${entry.id}`)
   }, [entry.id])
   ```

   Then delete the `onClick` prop from `EntryCardProps` (`entry-card.tsx:26`), the `openModal`
   prop from `EntryCardGridProps` (`entry-card-grid.tsx:26`) and its destructure and pass-through
   (`:39`, `:203`), and the `openModal={openModal}` line in `catalogue-page.tsx:75`. Three fewer
   props threaded through two components.

6. **`app/entry/[id]/page.tsx`** — new, static, no Firestore. `generateStaticParams()` returns
   `allEntries.map(({ id }) => ({ id }))` from `@/data/catalogue`; the page finds the Entry by
   `id`, calls `notFound()` if absent, and renders `<EntryDetail entry={entry} />` inside the same
   wrapper `app/page.tsx:15` uses (`<div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">`).
   Add `generateMetadata` — title `${entry.caption} — ${entry.author}`, a description naming the
   caption, author and `entry.category`, and `openGraph.images: [getCdnUrl(entry.posterPath)]`
   (`getCdnUrl` from `@/lib/cdn`, as `interactive-video.tsx:6` imports it). The metadata is the
   point of decision 5: without it a shared link previews as the site's generic card.
   `params` is a `Promise` in this Next version — `await` it, as `app/page.tsx:11` does.

7. **`tests/e2e/entry-route.spec.ts`** — one Playwright file, following `tests/e2e/home.spec.ts`
   including its PostHog `route` abort. Assert: clicking a card puts `/entry/<id>` in the URL and
   shows the panel; Escape closes it and the URL returns to `/`; Back closes it too; a cold
   `goto("/entry/<a known id>")` renders the caption with no dialog present; `/entry/nope` is a
   404.

Pausing the grid's Demos while the overlay is open is **ticket 09**, not this one. It can read
the same `usePathname()`; do not add a second mechanism here.

## Acceptance

- `grep -rn "use-modal\|card-modal\|components/modal" app components hooks lib tests` returns
  nothing, and `components/modal.tsx`, `components/card-modal.tsx` and `hooks/use-modal.ts` are
  all gone from the tree.
- Clicking a card puts `/entry/<26-char id>` in the address bar with **no** document or RSC
  request in the network panel, and the grid is still in the DOM behind the panel.
- Escape, the close button, a click on the tint, and browser Back each restore the exact previous
  URL including its `?search=` / `?page=` params, and each takes the same visible path out.
- `curl -s localhost:3000/entry/<a known id>` contains that Entry's caption and its author.
  `curl -so /dev/null -w '%{http_code}' localhost:3000/entry/nope` prints `404`.
- `pnpm build` prerenders 277 `/entry/…` routes, and the generated `sitemap` lists them.
- With the overlay open: `Tab` cycles only within the panel and never reaches a grid card, and
  `document.body` cannot be scrolled by wheel or keyboard.
- Under `prefers-reduced-motion: reduce`, the panel's computed `transform` contains no `scale`
  at any point during open or close, and both nodes still fade.
- A screenshot of `/` is pixel-identical to today. A screenshot of the open overlay at 1440px is
  pixel-identical to today's modal — same panel width, corner radius, padding, and a tint that
  settles at black 50%.
- `pnpm build`, `pnpm test` and `pnpm exec playwright test` all pass.

## Open questions

- **Cards are still `div`s with an `onClick`.** So `/entry/…` has no inbound link a crawler can
  follow, and cmd-click / middle-click cannot open an Entry in a new tab. Wrapping the whole card
  in an `<a>` is not possible — it already contains four links and two buttons. Making only the
  caption an anchor changes what the card is, and `spec.md:93` books card keyboard-reachability
  and focus styling as a separate fix. The sitemap covers indexing; raise the new-tab gap with the
  maintainer before adding an anchor. The motion brief's "Enter or Space" trigger arrives with
  that ticket, not this one.
- **The 2% scale on a `max-w-3xl` panel is ~15px of growth** (brief, "Open risk"). Check it first
  at 1440px. If it draws the eye, drop to `0.99` or remove the scale — do not retune the
  durations at the same time.
- **Forward-button behaviour is not fully in our hands.** Back out of an Entry, then press
  Forward, and the router has no cached tree for `/entry/<id>`; expect a real navigation to the
  standalone page from step 6 rather than the overlay reopening. That is defensible — the URL
  means that Entry either way — but it is an observed consequence of `pushState`, not a design
  choice. Note it if it looks wrong in use.

## Depends on

Nothing. Ticket 06 rewrites the same panel body (`card-modal.tsx:58-68`); whichever lands second
applies its change to `components/entry-detail.tsx`. Ticket 09 (pause the grid's Demos) depends
on this one.
