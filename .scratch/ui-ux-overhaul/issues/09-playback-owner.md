# 09 — One owner for playback: autoplay in view, five at a time

Status: resolved
Blocked by: 01, 08

Decisions 3 and 15 (`.scratch/ui-ux-overhaul/spec.md:22`, `:34`) and
`docs/adr/0007-a-view-is-a-recording-watched-not-a-button-pressed.md`.

## Problem

### Corrections to the brief

- **`scripts/generate-posters.ts:45` is the wrong line.** `-ss` is at `:47` and `00:00:02` at
  `:48`. The claim itself holds — the Poster is the frame two seconds in — and `spec.md:34`
  repeats the same wrong number. Fix it there too while you are in the file.
- **The lazy gate is not weak, it is disconnected.** `freezeOnceVisible: true`
  (`components/interactive-video.tsx:48`) does mean the observer can never report a tile leaving:
  `hooks/use-intersection-observer.ts:37-39` unobserves on first intersect and `:28` then refuses
  to re-observe. But `isInView` is destructured at `interactive-video.tsx:46` and read nowhere in
  the file, so the gate decides nothing at all today. The Poster is a CSS `background-image` on
  the play button (`:167-171`), so every Poster in the collection is fetched on first paint
  regardless of the observer. `01-lazy-posters.md` fixes both halves of that before this ticket
  starts — see step 3 and step 7.
- **The "Play video" label survives in one place.** `components/card-modal.tsx:38` renders the
  same `InteractiveVideo`, and this ticket does not touch that path, so `tests/e2e/view.spec.ts:27`
  can still find the label. That test breaks for a different reason (below).
- **Not in the brief, and load-bearing: `tests/e2e/vote.spec.ts` breaks too.**
  `tests/e2e/server-actions.ts:29-35` records *every* server action fired on the page and waits for
  a 2-second quiet period. Once five tiles bill an autoplay view at t≈2s, `expectOneEntryTargeted`
  and `expect(fired).toHaveLength(2)` (`vote.spec.ts:26`) both fail. Step 8 handles it.

### Verified as stated

- The `<video>` does not exist until clicked: `interactive-video.tsx:139-162` renders it only when
  `isPlaying`, flipped by `handlePlayClick` at `:72-76`.
- It mounts with `controls` (`:144`, default `true` at `:35`, passed at `entry-card.tsx:179`),
  unmuted (no `muted` attribute anywhere in the repo) and `preload="auto"` (`:159`).
- `playsInline` appears nowhere in the repo. On iOS this forces fullscreen the moment playback
  starts — in the overlay as well as the grid.
- The error state is `:128-138`, `data-testid="demo-error"`, asserted at `home.spec.ts:54`.
- `prefers-reduced-motion` is honoured in exactly one file, `components/cult/fade-in.tsx:11`.
  `app/globals.css` contains no motion query.
- The grid is `grid grid-cols-1 sm:grid-cols-2 …` at `entry-card-grid.tsx:198` with no `order` and
  no `dense`, so **document order is visual order** — which is what makes step 1's ordering legal.

### The one deliberate pixel change

Removing click-to-play removes the play glyph over the Poster (`interactive-video.tsx:175-178`).
That is authorised by decision 3 and by ADR-0007's rejected option ("it puts a play button on top
of a video that is already playing"), not an accident. Nothing else about the tile moves.

## Work

1. **`components/playback-owner.tsx` (new).** One provider, one `IntersectionObserver`, no state
   on the hot path — it commands `<video>` elements through refs it holds, so granting a slot
   re-renders nothing.

   ```tsx
   const MAX_PLAYING = 5
   // played: one createPlayedWatcher() per tile, imported from lib/view-signal.ts (ticket 10) —
   // see step 2. It is not a timer, and this file owns no threshold of its own.
   type Tile = {
     entryId: string
     visible: boolean
     played: ReturnType<typeof createPlayedWatcher>
   }

   // ponytail: threshold 0 — any pixel on screen makes a tile a candidate and the
   // five-slot cap in document order does the rest. Raise to 0.1 if tiles start on
   // a sliver. Not higher: a 9/16 tile in a phone's landscape viewport cannot reach
   // an intersectionRatio of 0.25 at all, and would then never play.
   ```

   - `tiles: Map<HTMLVideoElement, Tile>` and `granted: Set<HTMLVideoElement>` in refs.
   - `register(el, entryId)` returns its own cleanup, so a tile wires it as
     `ref={(el) => el && owner.register(el, entryId)}` (React 19 ref cleanups — `react` 19 in
     `package.json`). Cleanup unobserves, removes the `timeupdate` listener step 2 attaches
     and drops the element from both collections.
   - `grant()` — the whole policy:

     ```ts
     const next = suspendedRef.current
       ? []
       : [...tiles.keys()]
           .filter((el) => tiles.get(el)!.visible)
           .sort((a, b) =>
             a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
           )
           .slice(0, MAX_PLAYING)
     ```

     Then pause everything in `granted` that is not in `next`, and
     `el.play().catch(() => {})` everything in `next` that is not in `granted`. The `catch` is not
     optional: pausing a tile whose `play()` has not resolved rejects that promise.
     `compareDocumentPosition` rather than `getBoundingClientRect`, because it reads the DOM tree
     and forces no layout.
   - The observer callback sets `visible` from `entry.isIntersecting` for each entry, then calls
     `grant()` once. `{ threshold: 0, rootMargin: "0px" }` — not the old `200px`, which would play
     a tile a screen away.
   - `suspended` is a prop. An effect writes `suspendedRef` and calls `grant()`, so opening the
     overlay pauses all five and closing re-grants whatever is still in view.
   - Context value is built once (`useMemo(…, [])`) over the refs, so no consumer ever re-renders
     because of this provider. `usePlaybackOwner()` throws if there is no provider above it.

2. **View counting, in the same file — the threshold is not.** ADR-0007:22 puts the counting here
   and nowhere else, because this is where the five slots are granted and the cap is what bounds
   the metric. But *when* a Demo counts as watched is `10-view-metric.md`'s, and it lives in
   `lib/view-signal.ts`. This file owns the slots and the playback lifecycle; it calls into that
   module and reimplements none of it.

   The seam is two imports from `lib/view-signal.ts` (`10-view-metric.md`, step 1) against one
   export of this file.

   - This module becomes the only one in the tree that imports
     `@/app/actions/increment-view-count`, and it exports `countView(entryId)` — fire the action,
     return nothing (`10-view-metric.md`, step 2). The open and Source-link paths call that, not
     the action.
   - `register()` builds the tile's `played` watcher with `createPlayedWatcher()` and attaches one
     `timeupdate` listener that feeds it the element's `currentTime`. On the first `true` back,
     `countedThisSession(entryId)` says whether this browser session has already been billed for
     the Entry, and only if it has not does `countView(entryId)` fire. No further gate: a paused
     element fires no `timeupdate`, and only tiles holding one of the five slots are playing, so
     "while on screen" falls out of the cap this file already enforces.

   **No `setTimeout` and no wall clock anywhere on this path.** A tile can hold a slot for two
   seconds while its Demo stalls, buffers or fails to decode, and billing that a view contradicts
   the ADR's own first line — a view is a recording watched. Accumulated positive `currentTime`
   deltas are what measure playback, and they are also what survives the `loop` wrap
   (`entry-card.tsx:180`) that would make a raw subtraction go negative.

   `VIEW_THRESHOLD_SECONDS`, the once-per-Entry-per-session cap and its `sessionStorage` key all
   live in `lib/view-signal.ts`. Do not spell any of them here, or the two-second rule has two
   homes and ADR-0007:19 has nothing to point at.

   After these two tickets land nothing else in the tree calls `incrementViewCount`. That
   includes the vote path (`entry-card.tsx:112`) and the three profile links (`:207`, `:220`,
   `:232`), which stop counting views — ADR-0007:7, votes already measure interest, and measuring
   it twice is what the ADR rejects. `10-view-metric.md` steps 5 and 6 own that removal; this
   ticket neither performs it nor assumes it has happened.

3. **`components/demo-tile.tsx` (new).** Replaces `InteractiveVideo` in the grid. Same box, same
   pixels:

   - Root `<div className={`relative ${className}`} data-testid="demo">`.
   - The Poster is the `<img>` that `01-lazy-posters.md` step 1 has already landed in
     `interactive-video.tsx`. Lift it verbatim — `src={posterImage}`, `alt=""`, `loading="lazy"`,
     `decoding="async"`, `className="absolute inset-0 w-full h-full object-cover"`, the
     `@next/next/no-img-element` disable comment above it and the `bg-black` on the box behind it
     — and keep the `/logo.png` fallback from `:52-53` unchanged. Ticket 01 established that those
     pixels equal today's `background-image` (`interactive-video.tsx:167-171`) and that lazy
     loading is what the dead observer was for; this ticket copies a decision already made and
     re-derives none of it. What does not come across is the `<button>` around it, its
     `aria-label="Play video"` and the play glyph inside it — those are the one deliberate pixel
     change above.
   - The `<video>` is absolutely positioned over the Poster, always mounted (unless step 4 says
     otherwise), and carries `muted loop playsInline preload="none"` and **no** `controls`, **no**
     `poster` and **no** `<track>` — it is silent, so a captions track with no `src` was never
     doing anything. `preload="none"` is why the element can be mounted idle: it fetches nothing
     until the owner calls `play()`.
   - Cross-fade (decision 15): the video starts `opacity-0 transition-opacity duration-150`, and
     `onPlaying` flips one `useState` to `opacity-100`. That is the whole 150ms fade — CSS, not
     framer-motion. It does **not** fade back out when the owner pauses the tile; the last frame
     stays. Fading back to a Poster that is two seconds ahead would reintroduce the jump this
     fade exists to hide, in the other direction.
   - Keep the failure path verbatim from `interactive-video.tsx:82-97` and `:128-138`, including
     `FAILURE_REASONS`, the `if (!error) return` guard, the `demo_load_failed` PostHog capture and
     `data-testid="demo-error"`. This is the only part of the old component that survives intact.
   - `ref={(el) => el && owner.register(el, entryId)}` on the `<video>`.

4. **Reduced motion, in `demo-tile.tsx`.** Render the `<video>` only when the query is false, so
   under `prefers-reduced-motion: reduce` no video is ever mounted — not mounted-and-idle:

   ```ts
   const query = "(prefers-reduced-motion: reduce)"
   const usePrefersReducedMotion = () =>
     useSyncExternalStore(
       (cb) => { const mq = matchMedia(query); mq.addEventListener("change", cb)
                 return () => mq.removeEventListener("change", cb) },
       () => matchMedia(query).matches,
       () => true // server: assume reduced, so the HTML never ships a <video> to hydrate away
     )
   ```

   React's own hook, no dependency. Do not use framer-motion's `useReducedMotion` here: it reports
   `false` on the server, which mounts a `<video>` for one frame in exactly the case the decision
   says must never mount one.

5. **`components/entry-card.tsx`.** Swap `InteractiveVideo` (`:174-182`) for `<DemoTile
   entryId={entry.id} src={entry.demoPath} poster={entry.posterPath} caption={entry.caption}
   className="w-full h-full object-contain" />`. Drop the `incrementViewCount` prop — the owner
   counts a watched Demo now — and update the import at `:22`. Leave `incrementViewCountLocal`
   (`:66-73`) and its two callers (`:110-119`, `:124-128`) untouched; whether they survive is
   `10-view-metric.md`'s call (its steps 5 and 6 delete the vote's increment and the three profile
   links'), and this ticket must not read as ruling that they stay.

   Two comments become false the moment the swap lands: `:93-96` ("Playing the Demo is [a view],
   and that fires from the InteractiveVideo below") and `:171-172` ("Playing it is the one
   interaction on this card that counts as a view"). Strike the clause about where the view fires
   from — it fires from the owner, and the card no longer sees it. Leave the rest of the wording
   alone: `10-view-metric.md` step 8 rewrites both comments against the ADR, and two tickets
   should not draft the same sentence twice.

   The displayed `Views:` number (`:257`) therefore stops moving on playback and picks up what the
   owner counted on the next server render. What, if anything, still bumps it optimistically is
   ticket 10's to decide.

6. **`components/catalogue-page.tsx`.** Wrap `<EntryCardGrid>` (`:72-84`) in
   `<PlaybackOwner suspended={openEntry !== null}>`.

   `isModalOpen` is **not** in scope by the time this lands. It comes from `useModal()` at `:51`,
   and `08-entry-route-and-overlay.md` step 4 deletes that call, its import at `:16` and
   `hooks/use-modal.ts` with them, deriving the open Entry from the address instead:

   ```tsx
   const pathname = usePathname()
   const openEntry =
     (pathname.startsWith("/entry/") &&
       entries.find((e) => e.id === pathname.slice("/entry/".length))) || null
   ```

   Read that existing `openEntry` binding. Do not call `usePathname()` a second time and do not
   keep a boolean of your own beside it — ticket 08's closing note
   (`08-entry-route-and-overlay.md:178-179`) assigns this pause to this ticket and says in as many
   words not to add a second mechanism.

   This one file covers every route: `app/page.tsx:17`, `app/products/page.tsx:35` and
   `app/bookmarks/page.tsx:48` all render `CataloguePage`.

7. **`components/interactive-video.tsx` — one edit, then leave it.** It now serves only the overlay
   path: the render at `card-modal.tsx:38` today, `components/entry-detail.tsx` after ticket 08
   renames that file. Add `playsInline` to the `<video>` at `:140-162`; the same iOS fullscreen bug
   lives there.

   Nothing else. The dead observer — the import at `:7`, the call at `:46-49` and
   `ref={containerRef}` at `:123` — and the file `hooks/use-intersection-observer.ts` are all
   deleted by `01-lazy-posters.md` steps 2 and 3, and its Acceptance already asserts the grep. Do
   not delete any of it a second time here. Whichever ticket rebuilds the overlay may delete this
   component outright; this one does not pre-empt it.

8. **Tests.** Four files.
   - `tests/e2e/server-actions.ts` — a Demo that cannot load cannot bill a view, which is what
     makes every server-action test deterministic again. Add
     `await page.route("**/demo/**", (r) => r.abort())` beside the PostHog abort at `:23`, behind a
     fourth parameter `{ playDemos = false } = {}` so the one test that needs playback can opt in.
     `vote.spec.ts` then needs no edit at all.
   - `tests/e2e/home.spec.ts:28-40` — delete the click at `:30`. The assertion becomes: load `/`,
     poll `page.locator("video").first()` for `currentTime > 0`, then assert
     `page.locator("video").evaluateAll(v => v.filter(x => !x.paused).length)` is `> 0` and `<= 5`.
   - `tests/e2e/home.spec.ts:45-62` — delete both clicks (`:52`, and the `playButtons` locator at
     `:51`); `demo-error` now appears without any interaction. Swap the isolation assertions at
     `:60-61` to `page.getByTestId("demo")`.
   - `tests/e2e/remembered-set.spec.ts:37,55` — `getByRole("button", { name: "Play video" })` →
     `getByTestId("demo")`. Nothing else in that file changes.
   - `tests/e2e/view.spec.ts` — rewrite. Its premise ("playing the Demo in the modal is the one
     view") is no longer the definition. Replace with the claim this ticket owns, using
     `recordServerActions(browser, "/", interact, { playDemos: true })`: wait 3s, `page.reload()`,
     wait 3s. Assert at most 5 actions fired, that their bodies are all distinct (one per Entry),
     and that the reload added none — that is the two-second threshold and the
     once-per-Entry-per-session cap, both named load-bearing at ADR-0007:19.
   - Add nothing for reduced motion beyond one assertion in `home.spec.ts`: with
     `test.use({ reducedMotion: "reduce" })`, `page.locator("video")` has count 0 and no request
     to `**/demo/**` is made.

## Acceptance

- `grep -rn "Play video" components/entry-card.tsx components/demo-tile.tsx` returns nothing.
- On `/`, no request to `**/demo/**` fires until a tile is on screen; scrolling to the bottom of
  the first page produces one request per Demo, never more than five in flight.
- At any scroll position, `document.querySelectorAll("video")` filtered to `!paused` has length
  between 1 and 5, and the playing ones are the first in-view tiles in document order.
- Every grid `<video>` has `muted`, `loop`, `playsInline` and `preload="none"` set, and neither
  `controls` nor a `poster` attribute.
- Scrolling a playing tile off screen leaves it `paused`; scrolling it back restarts it, subject
  to the cap.
- Opening the overlay leaves zero grid `<video>` elements with `paused === false`; closing it
  returns the count to the in-view five.
- With `prefers-reduced-motion: reduce`, `page.locator("video")` has count 0 on `/` and no
  `**/demo/**` request is made. The tiles show Posters.
- A tile whose Demo actually advances two seconds fires exactly one view action for its Entry, and
  reloading in the same tab fires none for it. A tile that holds a slot for two seconds without its
  Demo advancing fires nothing. The threshold, the cap and its storage key are asserted by
  `10-view-metric.md`; what this ticket owns is that the owner is the only thing that calls them.
- Aborting `**/demo/**` shows `data-testid="demo-error"` on `/` with no click, and the other tiles
  still render.
- `components/playback-owner.tsx` is the only file this ticket adds that imports
  `@/app/actions/increment-view-count`, and it holds no copy of the rule:
  `rg "setTimeout|sessionStorage" components/playback-owner.tsx components/demo-tile.tsx` returns
  nothing, and the threshold reaches it only through `@/lib/view-signal`.
- `pnpm build`, `pnpm test` and `pnpm exec playwright test` pass.
- A screenshot of `/` before and after differs only by the absence of the play glyph over each
  Poster, and — on tiles that have played — by a frame of the Demo where the Poster was. No
  colour, spacing, type or card treatment changes.

## Open questions

- A Poster that 404s used to show the black button and the play glyph. Ticket 01 settled the rest
  of it: with `alt=""` over a `bg-black` box, a missing Poster paints the same black rectangle it
  paints today, so the only difference left in that failure state is the absent play glyph — which
  is the authorised pixel change, not a new one.
- Five concurrent decodes on a low-end phone against a 286ms INP (`spec.md:106`) is a number
  nobody has measured on hardware. `MAX_PLAYING` is one constant in one file; if the mobile INP
  gets worse, lower it there.

## Depends on

Three tickets, all of them hard:

- **01 — Load Posters lazily.** Step 3 lifts the Poster `<img>` that ticket lands in
  `interactive-video.tsx`, and step 7 relies on it having already removed the dead observer and
  deleted `hooks/use-intersection-observer.ts`. Land 01 first and copy its markup; do not write
  either piece a second time here.
- **08 — Give every Entry its own address.** Step 6's `suspended` prop reads `openEntry`, which 08
  introduces in `catalogue-page.tsx` when it deletes `useModal` and the `isModalOpen` this ticket
  used to name. 08 also owns `card-modal.tsx` and `modal.tsx`, and its step 4 note
  (`08-entry-route-and-overlay.md:178-179`) hands the pause to this ticket on the condition that it
  reads the same route state. The motion brief
  (`.scratch/ui-ux-overhaul/motion-brief-overlay.md:61-64`) requires the pause; it is implemented
  here so the overlay ticket only has to have an open Entry.
- **10 — Count a view the way ADR 0007 defines it**, for `lib/view-signal.ts` only. Step 2 imports
  `createPlayedWatcher` and `countedThisSession` from it and implements neither. That module is
  pure — no React, no Firebase — and ticket 10's own "Depends on" says its step 1 can land before
  this ticket, so the two are not circular even though 10's steps 2-4 wait on this one.

  **The `Blocked by:` line deliberately omits 10, to keep the frontier scan from deadlocking.**
  If `lib/view-signal.ts` does not exist when this ticket starts, write it here from ticket 10
  step 1 and say so in this file's `## Comments`. Ticket 10 then skips its step 1.

One ordering to know about:

- **02** edits the same block of `entry-card.tsx` (it replaces the `motion.div` wrapper at
  `:131-137`; this ticket replaces the child at `:174-182`). Different lines, but land one before
  the other rather than in parallel. 02 also makes this cheaper — 48 registered tiles instead of
  277 — and its `key={entry.id}` fix stops a sort toggle from remounting and re-registering every
  tile. Neither is required for this to work.

## Comments

**Resolved 2026-07-31.** All eight steps done. `pnpm check-types` and eslint clean,
`pnpm test` 166 (was 159 — `tests/view-signal.test.ts` adds 7), `pnpm build` prerenders as
before, `pnpm exec playwright test` 49/49.

### `lib/view-signal.ts` was written here

It did not exist, so per this ticket's own "Depends on" note it was written from
`10-view-metric.md` step 1, verbatim to that step's description: `VIEW_THRESHOLD_SECONDS = 2`,
`createPlayedWatcher()` accumulating only positive deltas, `countedThisSession()` over a
module-level `Set` seeded once from `sessionStorage` and reusing `parseRememberedIds` /
`serialiseRememberedIds`. **Ticket 10 skips its step 1**, and the vitest half of its step 9 is
also done (`tests/view-signal.test.ts`, 7 cases). Everything else in ticket 10 is untouched:
`incrementViewCountLocal` and its two callers still stand in `entry-card.tsx`, the overlay path
still calls the action directly, and `lib/counters.ts:78-84` is unchanged.

`countedThisSession` is a test-and-set — it answers "already billed?" and records the Entry if
not — rather than a query plus a separate write. One call site, so the question and the record
cannot drift apart.

### Measured, not read

| Claim | Measurement |
|---|---|
| A screenshot of `/` differs only by the play glyph | **7,008 differing pixels of 1,296,000** at 1440×900 under `prefers-reduced-motion`, in 11 regions: five 40×40 boxes at y=534 — one play glyph per visible card, 6,574px — and six in the `Updated: N minutes ago` pill, which read 33 and 32 minutes in the two runs. Nothing else on the page moved |
| Every grid `<video>` | `muted`, `loop`, `playsInline` true, `preload="none"`, `controls` false, no `poster` attribute, zero `<track>` children — sampled live off `/` |
| The cap holds | 48 `<video>` mounted, exactly 5 with `paused === false` |

### One line the ticket did not call for: `bg-black` on the tile root

Step 3 says to keep "the `bg-black` on the box behind it", read as the card's own
`aspect-[9/16] w-full bg-black` wrapper. That is one layer where the old play button was two —
the wrapper *and* the button's own `bg-black`. The card clips that box to a rounded top corner,
and the arc is antialiased against however many dark layers sit under it: with one instead of
two, the ten visible top corners came out a few levels lighter (174,174,174 → 207,207,207 on the
arc). 138 pixels, and the only thing between this ticket and "differs by the play glyph and
nothing else". `bg-black` is back on the tile root and the corners are now identical.

### The e2e suite was billing views, and now mostly does not

Step 8 aborts `**/demo/**` inside `recordServerActions` so the vote and view specs stay
deterministic. That fixes those two files, but every *other* spec loads a Catalogue page too,
and after this ticket each of those loads plays five Demos past two seconds — against the real
Firestore counters, on every local run. Roughly 40 tests × up to 5 phantom views per run, into
the metric ADR-0007 exists to define.

The same one-line abort is now in the `beforeEach` of `search`, `keyboard`, `entry-route` and
`served-html`, and beside the two own-context blocks in `served-html` and `remembered-set`. It
is deliberately **not** in `home`, `pagination`, `poster-loading` or `view`: those four assert on
playback or on Posters, and a Demo that cannot load takes the Poster down with it (the failure
state replaces the whole tile). Those four still bill, which is the honest cost of testing
playback against a live CDN.

### Five more specs referenced the deleted play control than the ticket listed

Step 8 names four files. `rg 'Play video'` found nine call sites across seven:
`pagination.spec.ts:77`, `keyboard.spec.ts:83`, `poster-loading.spec.ts:19,28,41` and
`served-html.spec.ts:47,52,88,144,156` as well. All now locate the tile by
`data-testid="demo"`, and two claims had to be restated rather than relocated:

- **`served-html.spec.ts:47`** counted cards in the served HTML by `aria-label="Play video"`.
  It counts `data-testid="demo"` now — with the closing quote in the regex, because
  `data-testid="demo-error"` is one per failed tile and a prefix match would count both.
- **`pagination.spec.ts:68`** ("toggling the sort reorders the cards without restarting a Demo")
  used to click play, then assert `page.locator("video")` had count 1. Every tile has a `<video>`
  now, and a sort is a reorder, so `.first()` after the toggle is a different Entry than before
  it. It identifies the playing Demos by `video.src` instead — the Entry's own Demo, which
  follows the element wherever it lands — and reads them straight after the click with no poll: a
  remount hands back a fresh element at `currentTime` 0, and a poll would wait for the owner to
  start it again, which is the failure rather than the fix.

`keyboard.spec.ts` simply drops the play button from its focus-ring list; nothing focusable
replaces it, which is the point.

### Smaller notes

- **`spec.md:34` needed no fix.** This ticket's first correction says `spec.md` repeats the wrong
  `scripts/generate-posters.ts:45`. It does not — it already reads `:47-48`, as does `spec.md:138`.
  Corrected by an earlier ticket, or never wrong there.
- **The observer is built on first use, not in an effect.** React runs ref callbacks before
  effects, so the first tile registers before an effect could have made one.
- **`register` is wrapped in `useCallback` at the tile**, not passed inline as the ticket's
  `ref={(el) => el && owner.register(el, entryId)}` sketch has it. An inline arrow is a new
  function identity every render, and React 19 detaches and re-attaches a ref whose identity
  changed — unobserving and re-observing the tile on every render.
- **`home.spec.ts` gained the two acceptance claims the ticket's step 8 did not spell out**: that
  scrolling a tile away pauses it and scrolling back restarts it, and that opening the overlay
  leaves zero grid `<video>` unpaused while closing returns them. The five-at-a-time assertion
  also checks the *identity* of the five, not just the count — they are the first five on screen
  in document order, not a scattered five.
- **Open question 2 stands.** Five concurrent decodes on a low-end phone is still unmeasured on
  hardware. `MAX_PLAYING` is one constant in `components/playback-owner.tsx`.

### Two-axis review, and what it changed

**Standards.** Three findings acted on:

- **ADR-0004, hard.** `demo-tile.tsx` was a new module written in the vocabulary the ADR
  renamed away from — `src`, `poster`, `videoSource`, `handleVideoError`. CONTEXT.md lists `src`
  and `url` under *Asset path — Avoid* and `video` under *Demo — Avoid*, and ADR-0004's whole
  argument is that modules written after the rename should speak the new names once. The props
  are now `demoPath` / `posterPath`, the derived values `demoUrl` / `posterUrl`, and the handlers
  `handleDemoError` / `registerDemo`. Identifier-only; no pixel and no behaviour moved.
  `interactive-video.tsx` keeps the old names — it is the file being retired.
- **A false claim in a comment.** `playback-owner.tsx` called itself "the only module in the
  tree that records a view". Not yet: `entry-card.tsx:18` and `entry-detail.tsx:17` still import
  the action, and `10-view-metric.md` step 6 is what deletes them. The header and `countView`'s
  doc now say so and point at the ticket.
- **Dead field and a misnamed function.** `Tile.entryId` was written and never read (the
  `onTimeUpdate` closure already captures it), and `observe()` observed nothing — it lazily built
  and returned the observer. Now `getObserver()`.

Declined, with reasons:

- **`countedThisSession` reads as a query but is a test-and-set.** True, and the JSDoc says so.
  It is the name both `09` step 2 and `10` step 1 give the seam; renaming it here would leave
  ticket 10 looking for a function that no longer exists.
- **`countView` has no external importer yet.** By design — step 2 exports it *for* ticket 10's
  open and Source-link paths. It is called internally, so it is not dead.
- **`DemoTile`'s four props are an Entry with fields stripped.** They are, and step 5 spells them
  out. A tile that takes the whole Entry can reach `view_count`, `source` and the Remembered-set
  ids it has no business reading.
- **The demo abort is copy-pasted into six spec files.** So is `page.route("**/*posthog.com/**")`,
  in every spec in the directory. Extracting one and not the other is the worse of the two
  consistencies.
- **`lib/view-signal.ts` says "no React" and imports a `"use client"` hook file.** Reworded rather
  than restructured: `10-view-metric.md` step 1 names `hooks/use-remembered-set.ts:35,61` as the
  source of the two parsers, and moving them to `lib/` is a change to a file this ticket does not
  otherwise touch.

**Spec.** Steps 1-7 came back implemented as written. Three findings acted on:

- **A latent bug in `grant()`, and the real one of the eight.** A tile whose `play()` rejected
  stayed in `granted` — which is exactly what stops `play()` being called twice on the same
  element — so it held a slot while paused and was never retried until it left the viewport and
  came back. Acceptance bullet 3 ("between 1 and 5 playing") could have read 0 on a browser that
  refused the first autoplay. The rejection now gives the slot back, so the next `grant()` tries
  again. Ceiling named in the comment: nothing retries a tile whose viewport never moves again.
- **Acceptance bullet 2 was true by construction and pinned by nothing.** `preload="none"` plus
  play-on-grant means a Demo below the fold costs nothing, and the only demo-request assertion in
  the suite was the reduced-motion one. `home.spec.ts` now counts: 48 tiles rendered, at most 5
  Demos requested, and more arriving on the way down.
- **"Never more than five in flight" is not what the network shows.** Measured on `/`: 5 requests
  at rest with 5 concurrent, but scrolling the first page top to bottom started 28 of the 48 and
  peaked at **7 concurrent**. Pausing a `<video>` does not close its connection, so a paused
  tile's socket overlaps the newly granted tile's. Five *playing* holds throughout, which is the
  claim the cap actually makes; the acceptance line reads as though the two were the same. The
  new test asserts the count, not the concurrency.

Three findings declined, and one worth arguing with:

- **`tests/view-signal.test.ts` is ticket 10's step 9, not this ticket's.** It is. The
  authorisation here was for `lib/view-signal.ts` "only". Shipping a new module that owns two
  rules ADR-0007 calls load-bearing with no test at all, in a ticket whose Acceptance ends
  "`pnpm test` passes", was the worse of the two readings. Ticket 10's step 9 now says which
  three claims are already pinned.
- **`recordServerActions` gained `interact(page, fired)`, beyond step 8's fourth parameter.**
  Step 8 also asks the rewritten `view.spec.ts` to assert "that the reload added none". Nothing
  in the recording is visible until it returns, so a reading has to be taken at reload time; the
  alternative is asserting distinct bodies and calling that the same claim, which it is not.
- **The demo abort landed in five files step 8 does not list**, and `remembered-set.spec.ts` is
  one where step 8 says "Nothing else in that file changes". Named here rather than buried: the
  conflict is real, and the reason is that step 8 was written before anyone worked out that
  autoplay bills a view from *every* spec that loads a Catalogue page, not just the two it
  centralises the abort for. Reverting that one line puts ~5 phantom views per run back into the
  metric ADR-0007 exists to define.
- **`entry-card.tsx`'s Video comment lost "is the one interaction on this card"** as well as the
  locality clause step 5 asked to strike. Playing is no longer an interaction on that card at
  all — there is nothing to press — so the surviving half would have been false. Step 8 of ticket
  10 rewrites the sentence against the ADR regardless.
