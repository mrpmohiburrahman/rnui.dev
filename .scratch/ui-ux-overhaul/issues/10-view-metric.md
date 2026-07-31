# 10 — Count a view the way ADR 0007 defines it

Status: resolved
Blocked by: 09

Decision 7 (`.scratch/ui-ux-overhaul/spec.md:26`) and
`docs/adr/0007-a-view-is-a-recording-watched-not-a-button-pressed.md`.

## Problem

A view is a button press today. Four call sites reach
`app/actions/increment-view-count.ts`, not the three the brief lists — `rg incrementViewCount`
over the tree returns:

1. `components/interactive-video.tsx:75` — pressing the play control, on a grid card
   (`components/entry-card.tsx:181`).
2. `components/entry-card.tsx:112` — the vote click.
3. `components/entry-card.tsx:126` — `handleLinkClick`, wired to **four** links, not one:
   the Twitter, LinkedIn and GitHub *profile* links (`:207`, `:220`, `:232`) and the Entry's
   Source link (`:246`).
4. **`components/card-modal.tsx:21-29`**, passed to the overlay's `InteractiveVideo` at
   `:39` — pressing play inside the overlay. The brief misses this one.

Opening an Entry counts nothing: `components/entry-card.tsx:93-99` is a bare
`onClick(entry)`, and the comment above it records that as deliberate. ADR 0007 reverses it.
The overlay's own Source link (`components/card-modal.tsx:71-79`) fires nothing either.

Three further things the brief does not say, verified here:

- **Voting stops counting a view.** ADR 0007:3 lists three signals and voting is not among
  them; ADR 0007:7 is the argument for why (votes already measure interest). Removing the
  view from the vote path makes `lib/counters.ts:81-84` reachable — its `whenMissing` payload
  seeds `view_count: 1` and the comment at `:78-80` says it is unreachable *because* a vote
  records a view first. Left as is, a first-ever vote on an uncounted Entry bills a phantom
  view. `tests/counters.test.ts:82-89` pins the old payload.
- **The code comment at `components/entry-card.tsx:121-123` names "ticket 10" and is not
  about this ticket.** It refers to `10-the-entry-card-tells-the-truth.md` from the
  architecture effort, whose whole directory was deleted in `3ff21a1`; read it with
  `git show 3ff21a1^:.scratch/architecture/issues/10-the-entry-card-tells-the-truth.md`.
  The comment must be rewritten or it reads as if this ticket ruled the opposite way.
- **Ticket 09 owns the playback owner.** Every reference below to "the playback owner" is to
  `components/playback-owner.tsx`, which `09-playback-owner.md` creates.

ADR 0007 also reads two ways: `:3` counts opening an Entry and following its source link,
while `:22` says counting lives in the playback owner and *nothing else* may increment.
Taken here as: the playback owner exports the one counting function, and the open and
source-link paths call it rather than the server action. That is also the only way the
once-per-session cap has a single home.

The in-view half of the metric has no hook to inherit. `hooks/use-intersection-observer.ts`
was deleted by ticket 01 — its `isInView` was destructured and never read, and the Poster gate
it was meant to serve is now the browser's own `loading="lazy"`. It would not have fitted
anyway: `freezeOnceVisible: true` latches permanently, while this metric needs bidirectional
in-view state owned by the playback owner (ticket 09), where the five concurrent slots live.

## Work

1. **`lib/view-signal.ts` — already done. Skip this step.** Ticket 09 landed it on
   2026-07-31 under the arrangement in its own "Depends on" section, together with the
   `tests/view-signal.test.ts` half of step 9 (7 cases). Read the file before writing
   anything against it; the description below is what it was built to and still holds.
   One thing to know that this step did not say: `countedThisSession` is a test-and-set —
   it answers "already billed?" *and* records the Entry if not — so there is no separate
   write to call. New, pure, no React and no Firebase, mirroring the split
   `lib/counters.ts:8-10` explains:
   - `export const VIEW_THRESHOLD_SECONDS = 2`.
   - `createPlayedWatcher()` → a closure over `last` and `played` that takes a
     `currentTime` and returns whether the total has crossed the threshold. Accumulate only
     **positive** deltas: Demos loop (`components/entry-card.tsx:180`), so `currentTime`
     wraps to 0 and a raw subtraction goes negative. The wrap costs one tick, ~250ms.
   - `countedThisSession(entryId)` → the cap. A module-level `Set`, seeded once from
     `sessionStorage` and written through on every add. Reuse `parseRememberedIds` and
     `serialiseRememberedIds` (`hooks/use-remembered-set.ts:35,61`) — pure exports, already
     handling absent, empty and malformed values. New key, and it is deliberately **not** a
     Remembered set (CONTEXT.md): those are localStorage and survive the tab. Wrap the
     write in `try`/`catch`; storage can be unavailable and a throw here would stop playback.
2. **The playback owner (ticket 09)** becomes the only module in the tree that imports
   `@/app/actions/increment-view-count`. Give it one exported call — `countView(entryId)` —
   which fires the action and returns nothing. `counters.recordView` never rejects by
   contract (`lib/counters.ts:60-63`), so fire and forget.
3. **The played signal.** Wherever ticket 09 mounts the `<video>`, attach one `timeupdate`
   handler feeding `createPlayedWatcher()`; on the first `true`, if `countedThisSession` says
   no, count. Only in-view tiles hold a slot, so "while on screen" is satisfied by the cap
   ticket 09 already enforces — if it grants slots to off-screen tiles, gate the handler on
   `isInView` instead. No wall-clock timer: a stalled or buffering Demo would bill a view it
   never played.
4. **The open signal.** `components/catalogue-page.tsx:51` is the single funnel — every card
   is handed the same `openModal` (`components/entry-card-grid.tsx:203`). Call `countView`
   there, uncapped. If the overlay ticket lands first, move the call to whatever opens the
   overlay; the cold-loaded Entry route from decision 5 counts its own open and is that
   ticket's, not this one's.
5. **The source-link signal.** `components/entry-card.tsx:124-128` keeps counting for the
   Source link at `:246` and stops for the three profile links at `:207`, `:220`, `:232` —
   ADR 0007:3 says "its source link", and `data/entry.ts:30` is the one field that is it.
   Add the same call to the overlay's Source link (`components/card-modal.tsx:71-79`).
   Route both through the owner's `countView`, not through the action.
6. **Delete the rest.** The increment out of `handleVoteClick`
   (`components/entry-card.tsx:112`), the `incrementViewCount` prop and its call
   (`components/interactive-video.tsx:16,37,75`), `incrementViewCountLocal` in
   `components/card-modal.tsx:21-29` and its prop at `:39`. Keep
   `components/entry-card.tsx:66-73` only as long as something on the card still needs the
   optimistic `setViewsClicked`; the counts shown on the card must not change appearance.
7. **`lib/counters.ts:78-84`** — the cast `whenMissing` payload becomes
   `{ vote_count: 1, view_count: 0 }` and the comment is replaced with why: a vote is no
   longer a view, so this path is reachable and must not invent one. Update
   `tests/counters.test.ts:82-89` to expect `{ view_count: 0, vote_count: 1 }`.
8. **Rewrite the comments that state the old rule**: `components/entry-card.tsx:93-96`,
   `:106-109`, `:121-123`, `:171-172` and the header of `tests/e2e/view.spec.ts`.
9. **Tests.** `tests/view-signal.test.ts` is **already written** — ticket 09 landed it with
   step 1, covering all three claims below. `tests/e2e/view.spec.ts` was also rewritten
   there, against the autoplay rule rather than this ticket's open and source-link signals;
   extend it rather than replacing it. What is left here: a second call for the same Entry
   id is refused and a different id is not; the watcher crosses only after two seconds of
   positive deltas and survives a loop wrap — all three now pinned.
   `tests/e2e/vote.spec.ts:26` becomes `toHaveLength(1)`. Note that
   `expectNoActionRepeated` (`tests/e2e/server-actions.ts:63`) forbids a repeated action id
   within one recording, so a spec that opens two Entries cannot use it.
   `tests/e2e/home.spec.ts:30,51` locate `button[name="Play video"]`, which ticket 09 deletes
   — leave them to ticket 09.

No pixel moves. No new dependency.

## Acceptance

- `rg -l "increment-view-count" app components lib hooks` returns exactly two paths:
  `app/actions/increment-view-count.ts` and the playback owner module.
- `rg "incrementViewCount" components/` returns nothing.
- Loading a Catalogue page and scrolling top to bottom without stopping fires zero view
  server actions.
- Letting one Demo play three seconds, then scrolling it away and back and letting it play
  three more, fires exactly one view action carrying that Entry's id. Reloading the page and
  repeating fires none.
- Opening an Entry, watching its Demo past two seconds and clicking Source fires two view
  actions for that Entry — the open and the source link — and not three.
- A vote click fires exactly one server action.
- `pnpm test` green, including `tests/view-signal.test.ts` and the amended
  `tests/counters.test.ts:82-89`.
- `git diff` for this ticket changes no `className` value and adds or removes no JSX element
  except the deleted `incrementViewCount` props.
- No Entry's `view_count` in Firestore is written by anything other than
  `counters.recordView`, and no count is reset — ADR 0007:5.

## Open questions

1. **Reduced motion earns fewer views.** Under `prefers-reduced-motion` no Demo is ever
   mounted (`spec.md:60`, `motion-brief-overlay.md:52`), so those visitors can only count
   opens and source clicks. Consistent with the ADR but not stated in it; worth the
   maintainer knowing before the numbers are compared.
2. **The three profile links.** Step 5 stops them counting. Reversible in one line if the
   maintainer reads "source links" (CONTEXT.md:10, plural) as covering them.

## Depends on

09 — the playback owner, now `resolved`. It landed step 1, step 3 (the `timeupdate` handler
and the played signal), the `lib/view-signal.ts` half of step 9, and the `countView` export
of step 2 — but **not** step 2's other half: `components/entry-card.tsx:18` and
`components/entry-detail.tsx:17` still import the action directly, and step 6 is what makes
the playback owner the only importer. **What is left for this ticket is steps 2 (the
deletion half), 4, 5, 6, 7, 8 and the e2e half of 9.**

## Comments

Done 2026-07-31. Steps 2 (deletion half), 4, 5, 6, 7, 8 and the e2e half of 9.
`components/playback-owner.tsx` is now the only module that imports the action.

**Where the four old call sites went.** The `incrementViewCount` prop is gone from
`components/interactive-video.tsx` entirely — pressing play in the panel bills nothing, which
is the reversal ADR-0007 turns on. `entry-detail.tsx` lost `incrementViewCountLocal` with it
and gained a `countView` on its Source link. On the card, the vote path no longer counts and
the three profile links no longer count; both now share a `stopPropagation` handler, which
they still need or a click on a byline would open the panel behind the departing tab.

**Two things the ticket did not anticipate, because 08 landed first.**

- The open funnel is not `catalogue-page.tsx:51` any more. Ticket 08 replaced `openModal`
  with a `pushState` in `entry-card.tsx`'s `handleClick`, and the overlay opens off the
  pathname. The count went there, which is still one funnel: the card body and the headline
  both route through it.
- The `card-modal.tsx` of step 5 is `entry-detail.tsx`, and its Source link is the one
  labelled "GitHub Repository".

**Acceptance bullet 2 is unsatisfiable as written** and was not met. `rg "incrementViewCount"
components/` returns two matches, both in `components/playback-owner.tsx` — which bullet 1 and
step 2 both require to hold that import. The bullet dates from a draft where the owner was not
in `components/`. Bullet 1, the one that carries the meaning, passes exactly:
`grep -rl "increment-view-count" app components lib hooks` returns the action and the owner and
nothing else. That grep is also why one prose mention of the path in
`app/actions/get-entries.ts` was reworded — no import changed there.

**Acceptance bullet 5 is pinned in two tests rather than one.** `tests/e2e/view.spec.ts` gets
"opening an Entry and following its Source link bill one view each" (Demos aborted, so autoplay
cannot land in the middle of the claim) and "pressing play in the panel bills nothing at all"
(the standalone `/entry/<id>` page, which has no grid and so no playback owner — the press is
the only thing that could have counted). One test doing both would have had to let autoplay run
and then guess which of the actions it saw was whose.

**Still uncounted, and nobody owns it: the cold `/entry/<id>` open.** Step 4 assigns it to
ticket 08 — "the cold-loaded Entry route from decision 5 counts its own open and is that
ticket's, not this one's" — and 08 resolved without it. Two paths reach that route: a shared
link, and a cmd/ctrl/shift/alt-click on a card headline, which `entry-card.tsx` deliberately
returns from before counting so the new tab is not billed twice once the route does count.
ADR-0007:3 says an open counts, so this is a real gap in the metric, left where the ticket put
it rather than taken in passing.

Both **Open questions** above are unchanged and still the maintainer's: reduced-motion visitors
can only ever produce opens and Source clicks, and the three profile links now count nothing.

Verified: `pnpm check-types` clean, `pnpm test` 166/166, `npx playwright test` 52/52 against a
production build. No `className` changed; the only JSX removed is the `incrementViewCount`
prop.
