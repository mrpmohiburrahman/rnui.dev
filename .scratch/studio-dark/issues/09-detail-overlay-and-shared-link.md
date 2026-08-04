# 09 — The detail: overlay and shared-link arrival

Status: ready-for-human
Blocked by: 07

The surface is `assets/new-ui/Detail.dc.html` in all three of its forms — `page` (1440px, the
cold arrival), `overlay` (1080px over the catalogue) and `mobile` (390px) — plus the two
paragraphs the composite writes about it at
`assets/new-ui/rnui Studio Dark.dc.html:81` and `:93`.

Every path and line number below is the tree as it stands today. Ticket 01 renames these
modules and their identifiers, and the edits land on whatever it leaves in their place:
`components/recording-detail.tsx`, `components/recording-overlay.tsx`,
`app/recording/[id]/page.tsx`, `data/recording.ts`, `Recording`, `contributor`,
`recordingFacts`, `recordingOpened` with its `opened_from` property
(`.scratch/studio-dark/issues/01-rename-to-recording-and-contributor.md:77-88,115-131`). This
ticket is written in that vocabulary throughout.

## Problem

### The body renders eight things and the mock draws thirty

`components/entry-detail.tsx:67-124` is the whole detail today: a media column, the caption in
a `Title`, `@twitterId` as plain grey text (`:96-98`), the contributor's name (`:101`), and one
blue `GitHub Repository` link (`:107-118`). That is it. The mock draws, and this ticket owes,
all of the following that do not exist anywhere in the file: the media chrome
(`9:16 · PLAYING · MUTED · LOOPING`, the `● LIVE` pip, `NO AUDIO TRACK`,
`CAPTURED ON DEVICE · 4S LOOP · SILENT` — `Detail.dc.html:35-39`), the Category link and
`NEW BATCH` tag (`:45-46`), the Contributor block with its initials avatar and three profile
links (`:51-63`), the view bar and `39% OF TOP ENTRY` (`:66-70`), a vote button, a save button,
the local-only sentence (`:71-77`), and `MORE FROM THIS CONTRIBUTOR` (`:79-86`).

The `@twitterId` line at `:97` is the only use of the three profile ids on this surface, and it
renders a bare handle rather than a link. `data/entry.ts:31-33` carries all three —
`twitterId?`, `linkedInId?`, `githubId?`, all optional — and `components/entry-card.tsx:328-364`
already builds the three URLs from them (`https://twitter.com/…`,
`https://linkedin.com/in/…`, `https://github.com/…`). The mock's third state, `LinkedIn not
listed` (`Detail.dc.html:59`), has no counterpart at all: today a missing id renders nothing,
and the composite (`:81`) is explicit that the design wants the absence stated —
*"with LinkedIn explicitly marked as not listed rather than rendered dead"*.

### The keyboard legend is drawn UI and the repo has one key handler

`Detail.dc.html:24` draws `← → PREV / NEXT | S SAVE | V VOTE` and `:25` draws the `ESC ✕`
button. Spec decision 2 (`spec.md:113`) makes those keys real: *"The keyboard legend is drawn
UI, so the keys work."*

`grep -rn "onKeyDown\|onKeyUp\|e\.key\|keydown" app components lib hooks` returns three lines
in total: `components/ui/input.tsx:30`, which declares an `onKeyDown` prop that neither of the
two `<Input>` call sites (`app/subscribe/page.tsx:64`, `components/newsletter-form.tsx:79`)
passes, and `components/interactive-video.tsx:184-185`, one handler matching `Enter` and `" "`.
Escape already works, but only because Radix supplies it
(`components/entry-overlay.tsx:6-8`). Nothing in the tree moves between Recordings, and nothing
listens for `S` or `V`.

### The cold arrival cannot render a single number

`app/entry/[id]/page.tsx:9,21-27` prerenders all 277 addresses from `data/catalogue.ts` with
`dynamicParams = false`, and its header comment states the consequence outright: *"no Firestore,
no searchParams, so nothing here is dynamic"* (`:3-4`). The Recordings it hands to `EntryDetail`
come from `allEntries`, which carries no `view_count` and no `vote_count` — those are merged in
by `getEntriesWithCounts()` (`data/entry.ts:61-71`), which this route never calls. So on the
`page` form the mock's `558 views`, `39% OF TOP ENTRY` and `▲ Vote 3` have nothing behind them.

### Nothing computes the maximum view count

`Tile.dc.html:112` computes its bar as
`Math.max(4, Math.round(((e.v || 0) / 1426) * 100)) + '%'`, and the Detail draws `558 views`
against `39% OF TOP ENTRY` — 558 / 1426 = 39.1%. The denominator is the largest `view_count` in
the whole catalogue, it is the same number the tile's bar uses, and no code in this repo derives
it. `lib/counters-firestore.ts` owns the counts and `lib/counters.ts:98-100` exposes only
`readCounts()`, the whole map.

### The two Remembered sets have exactly one owner and it is not this component

`components/catalogue-page.tsx:48-51` holds both sets, and `hooks/use-remembered-set.ts:104-116`
writes to `localStorage` from an effect on every change. A second `useRememberedSet(BOOKMARKS_KEY)`
mounted inside the detail would hold its own React state over the same key, so saving from the
panel would not move the tile behind it, and the two writers would race. The detail therefore
takes the flags and the toggles as props; it does not call the hook.

### Focus does not come back, and the panel is in the wrong place

`components/entry-overlay.tsx` sets no `onCloseAutoFocus`, and there is no Radix trigger to
restore to — the overlay opens because `usePathname()` changed
(`components/catalogue-page.tsx:61-65`), not because anything was pressed. The card body is a
plain `div` with an `onClick` and no `tabIndex` (`components/entry-card.tsx:220-228`), so a
mouse open leaves `document.activeElement` on `<body>`, and Escape drops focus to the top of the
document. `tests/e2e/entry-route.spec.ts:153-172` asserts the trap and the scroll lock and says
nothing about the return.

The panel is centred — `fixed left-1/2 top-1/2` with `x/y: "-50%"`
(`components/entry-overlay.tsx:81-96`) — and the mock is top-aligned:
`align-items:flex-start; justify-content:center; padding-top:64px` (`Catalogue.dc.html:167`).
That same line adds `backdrop-filter:blur(3px)` and a `scrim` token, against today's
`bg-black` at `opacity: 0.5` (`:59-63`).

### The mock's own numbers do not survive contact with the data

`Detail.dc.html:61` reads `148 of the 277 recordings here are theirs. See all 148 →` for Enzo
Manuel Mangano. Counted over `data/*.ts` just now, Enzo has **124**; 148 is the number of
Recordings in `data/misc.ts`, which is what `MISC · 148 ENTRIES` (`:16`) correctly reports. 277
is right. This is the same class of error ticket 06 found at `Catalogue.dc.html:178-179`: every
figure on this surface is derived, and none is written down.

## Work

1. **`components/recording-detail.tsx` — the props, and who owns what.** Keep the file's two
   load-bearing decisions exactly as they are. `countsOwnOpen` stays an explicit prop rather
   than something the component infers, for the reason at `components/entry-detail.tsx:30-33` —
   the overlay renders this same body after the card has already counted, so a component that
   decided for itself would double-bill every open from the grid. The `counted` ref stays keyed
   on the Recording id rather than a boolean (`:59`), because a client navigation between two
   Recordings must still count the second.

   Add, all required: `topViewCount: number`, `catalogueTotal: number`,
   `contributorTotal: number`, `more: Recording[]`, `saved: boolean`, `voted: boolean`,
   `onToggleSave: () => void`, `onToggleVote: () => void`. Nothing here reads
   `hooks/use-remembered-set.ts` and nothing here imports `@/data/catalogue` — this file is
   `"use client"` (`:12`), and `components/catalogue-search.tsx:53-56` records that the last
   value import of `@/data/*` from a client component was deleted so that `data/catalogue.ts`
   is no longer pulled into a client chunk. Keep it that way.

   `components/catalogue-page.tsx` gains one optional prop,
   `catalogueFacts?: { total: number; perContributor: Record<string, number> }`,
   and derives both from the Recordings it holds when the prop is absent. `/` and
   `/products` pass it from their server components; `/bookmarks` omits it, and deriving there
   is exact because that route fetches the whole catalogue and filters in `CataloguePage`
   (`app/bookmarks/page.tsx:21-24,38`). `/products` **must** pass it: it is handed a filtered
   set (`app/products/page.tsx:26`), so a derived `total` there would be the size of the filter.

   The maximum view count is **not** in this prop. Ticket 07 already threads `topViewCount`
   into `CataloguePage` from all three routes
   (`.scratch/studio-dark/issues/07-the-tile.md:352-354`); read that prop and pass it down,
   rather than adding a second copy of the same number beside it.

2. **The media column.** `Detail.dc.html:30-39`. A fixed-width column — `mW` 414 on the `page`
   form, 380 in the overlay, 358 on mobile (`:132`) — with the media box at
   `border-radius:20px` desktop / `16px` mobile (`:134`), `overflow:hidden`, and
   `background: plinth` (`--plinth`, `#05060A` dark / `#080A0E` light). The height is
   **declared, never measured**: `mH` is 736 / 676 / 636 (`:133`), which is `mW × 16 / 9` in
   each case, and the composite states why at `rnui Studio Dark.dc.html:27` — *"height is width
   × 16 / 9, declared, never measured … The layout is final before any pixel of media exists."*
   Use ticket 03's measured `aspect` for the ratio so a Recording that is not 9:16 gets a box
   that fits it, and keep the height a declaration in the style attribute, not a
   post-load correction. CLS is acceptance at checkpoint 5 (`spec.md:168-169`).

   Do **not** reproduce the three layers at `:32-34` — the radial-plus-linear wash, the
   `repeating-linear-gradient(135deg, …)` hatch, and the 3px bar at `top:14px`. Those are the
   mock standing in for a video frame it cannot play. The real Poster and the real Demo go
   there. Everything else in that box is chrome and is built.

   The glow is `box-shadow`, always on, with no state branch — `mediaGlow` at `:135-137` has
   none:

   | mode | value |
   |---|---|
   | dark | `0 0 0 1px hsla(H,60%,62%,0.26), 0 40px 120px -30px hsla(H,70%,58%,0.5)` |
   | light | `0 0 0 1px rgba(16,18,22,0.10), 0 34px 80px -32px hsla(H,55%,40%,0.55)` |

   `H` is `var(--tile-hue)`, which ticket 07 sets per Recording from the `hue` field ticket 03
   writes; the mock's literal `290` is the same illustration ticket 02 identified at
   `.scratch/studio-dark/issues/02-design-system-tokens-and-type.md:198-200`. This is E1 at
   detail scale and it is not E1 — the numbers differ from `--e1` in every term — so declare
   `--media-glow` in both blocks of `app/globals.css` beside `--e1` and expose it as
   `shadow-media`, following the convention ticket 02 set when it declared `--well`,
   `--bar-track` and `--bar-fill` rather than leave this ticket to invent names
   (`02-design-system-tokens-and-type.md:167-174`).

3. **The four media states, three of which the mock does not draw.** The chrome must never
   claim `PLAYING` when nothing is playing. The centre label is mono 10px,
   `letter-spacing:0.16em`, `color:rgba(255,255,255,0.5)`, centred by
   `translate(-50%,-50%)` (`Detail.dc.html:35`). The pip is bottom-left, mono 9px,
   `letter-spacing:0.13em`, `padding:5px 8px`, `border-radius:7px` (`:36`).

   | state | centre label | pip | pip colours |
   |---|---|---|---|
   | playing | `9:16 · PLAYING · MUTED · LOOPING` | `● LIVE` | `background:rgba(111,227,204,0.2)`, `color:#8FF0DC` (`:36`) |
   | at rest | `9:16 · STILL FRAME` | `❙❙ PAUSED` | `background:rgba(4,6,10,0.62)`, `color:rgba(255,255,255,0.72)` (`Tile.dc.html:103-105`) |
   | failed | `9:16 · UNAVAILABLE` | none | `showStateChip: !isLoading && !isFailed` (`Tile.dc.html:102`) |
   | reduced motion | `9:16 · STILLS ONLY` | `❙❙ STILLS ONLY` | as at rest |

   The three undrawn strings are not invented: `9:16 · STILL FRAME`, `9:16 · UNAVAILABLE`,
   `❙❙ PAUSED` and `❙❙ STILLS ONLY` are all `Tile.dc.html:89-93,103`, which is ticket 07's
   component and the only other place this vocabulary exists. `9:16` is ticket 03's measured
   `aspect` in every row.

   `NO AUDIO TRACK` (bottom-right, mono 9px, `padding:5px 8px`, `border-radius:7px`,
   `background:rgba(4,6,10,0.6)`, `color:rgba(255,255,255,0.7)` — `:37`) is unconditional; every
   Demo is silent. The strip under the box is mono 9px, `letter-spacing:0.11em`, `color: t3`,
   `padding-top:10px`, reading `CAPTURED ON DEVICE · ${seconds}S LOOP · SILENT` where `seconds`
   is `Math.round(durationMs / 1000)` from ticket 03. It survives the failed state — ADR-0003
   makes a measurement keyed on an Asset path permanently valid, so a Demo that will not decode
   in this browser still has a known length.

   **At rest is the default, and it stays that way.** The detail's Demo is click-to-play
   (`components/interactive-video.tsx:112-115,141-147`), and
   `tests/e2e/home.spec.ts:152-153` depends on it: *"The panel's own `<video>` is click-to-play,
   so it adds none"* is what makes the assertion that zero Demos play behind the tint true.
   Making it start itself would also make `demoPlayed(facts, "detail", "click")`
   (`interactive-video.tsx:81`) a lie, and ADR-0007:22 leaves the increment to the playback
   owner, which does not run on this surface. The mock draws the playing state; it does not say
   the Recording starts itself.

   Under `prefers-reduced-motion` no `<video>` is mounted, which is already true at rest and
   stays true — `interactive-video.tsx:169` only mounts one once `isPlaying`. A press is a
   request rather than autoplay, so the play control remains reachable; what changes is the
   label and the pip.

   The failed state replaces the developer text at `interactive-video.tsx:158-168`, which
   currently shows a visitor `{caption} ({failureReason})`. Draw `◺ DECODE FAILED` in mono 9px,
   `letter-spacing:0.14em`, `#F5B3A4`, over `rgba(4,5,8,0.9)`, with the sentence
   `This recording won't play in your browser. The source is still there.` at 12px,
   `line-height:1.45`, `rgba(255,255,255,0.86)` — all from `Tile.dc.html:20-22`. Omit the tile's
   inner `Open repo ↗` button (`:23`): the composite's reason for it is that *"the outbound
   click survives the broken video"* (`rnui Studio Dark.dc.html:140`), and on this surface the
   full-width repo link in step 5 already does that a few hundred pixels below. Keep
   `role="alert"` and `data-testid="demo-error"` (`interactive-video.tsx:159-161`) —
   `tests/e2e/home.spec.ts:172` reads the second. Keep `demoLoadFailed(src, reason, videoSource)`
   at `:129`: the reason belongs in PostHog, not on screen.

4. **The Category line and the title.** `Detail.dc.html:44-48`. The Category is a link, mono
   9.5px, `letter-spacing:0.12em`, `color: acc`, underlined at `text-underline-offset:3px`,
   text `MISC` — the display name uppercased. Its href is
   `` `/products?${new URLSearchParams({ category }).toString()}` ``. Do not export and reuse
   `facetHref` from `components/nav/catalogue-nav.tsx:58-67`: it toggles, so from a Recording
   whose Category is already the active filter it would produce a link that clears it. Its
   comment at `:53-56` still applies — the display name goes in unaltered because it is the key
   the 18 legacy redirects land on (`data/categories.ts:68-70`).

   `NEW BATCH` (`:46`) is mono 9px, `letter-spacing:0.12em`, `padding:4px 7px`,
   `border-radius:6px`, `bg-new-bg` / `text-new-fg`, rendered only when `recording.isNew` —
   which `data/entry.ts:91-96` already computes as "shares the newest `created_at` date".

   The title is an `h1` on the `page` form and Radix's `Dialog.Title` in the overlay, exactly as
   `components/entry-detail.tsx:22-29` already arranges and for the reason recorded there:
   `DialogTitle` throws outside a `Dialog`, so it is passed in rather than imported. Type is
   `text-detail` (36 / 500 / `-0.025em`, ticket 02) at `line-height:1.12` with
   `text-wrap:pretty`, stepping to 30px in the overlay and 24px on mobile
   (`Detail.dc.html:138`).

5. **The Contributor block.** `Detail.dc.html:51-63`. Container: `padding:14px`,
   `rounded-panel` (12px), `border-line`, `bg-well`.

   The avatar is 38×38, `border-radius:10px`, `bg-acc-soft`, `border-line`, mono 11px,
   `text-acc`, holding initials — `EM` for `Enzo Manuel Mangano ( Reactiive )`. Derive them as
   the uppercased first characters of the first two whitespace-separated words that begin with a
   letter, so `Thomino` gives `T`, `Daehyeon Mun (文…)` gives `DM`, and `Epicode | 0xV` gives
   `E` rather than `E|`. Mark it `aria-hidden`: the name is the next line down.

   `CONTRIBUTED BY` is mono 8.5px, `letter-spacing:0.14em`, `text-t3`, `padding-bottom:3px`. The
   name is 14px, `line-height:1.3`, `text-t1`, `overflow-wrap:anywhere` — the longest in the
   data is 33 characters and the overlay column is narrow.

   The three links are 12px, `text-acc`, underlined at offset 3px, with a
   `outline:3px solid var(--acc); outline-offset:3px; border-radius:3px` focus ring, labelled
   `X ↗`, `GitHub ↗`, `LinkedIn ↗`, wrapping at `gap:10px`. Build the URLs the way
   `components/entry-card.tsx:330,343,355` already does and keep `twitter.com` as the host — the
   label changes, the URL does not. When an id is absent, render a `<span>` at 12px `text-t3`
   reading `X not listed` / `GitHub not listed` / `LinkedIn not listed` (`:59`) rather than
   nothing, which is the composite's stated intent at `rnui Studio Dark.dc.html:81`.

   The attribution line is 11.5px, `line-height:1.45`, `text-t2`, `padding-top:8px`:
   `` `${n} of the ${catalogueTotal} recordings here ${n === 1 ? "is" : "are"} theirs.` `` For
   `n > 1` append `` `See all ${n} →` `` as an `text-acc` underlined link to
   `` `/products?${new URLSearchParams({ contributor: name }).toString()}` ``. For `n === 1`
   omit the link entirely: its destination would be the Recording already on screen. `n` is
   `contributorTotal`, never the mock's 148.

6. **The view bar.** `Detail.dc.html:66-70`. A flex row at `gap:10px`: the count in mono 11px,
   `text-t2`, `font-variant-numeric:tabular-nums`, `min-width:96px`, reading
   `` `${view_count.toLocaleString()} views` ``; then a `flex:1` track at `height:3px`,
   `border-radius:2px`, `bg-bar-track`, holding a fill at the same height and radius on
   `bg-bar-fill`; then mono 9px, `letter-spacing:0.1em`, `text-t3`, `white-space:nowrap`,
   reading `` `${pct}% OF TOP ENTRY` ``.

   `pct` is `Math.round((view_count / topViewCount) * 100)`. The **fill width** is
   `Math.max(4, pct)`, the 4% floor `Tile.dc.html:112` applies so a Recording with no views
   still shows a sliver; the **label prints `pct`**, unfloored, because a Recording on zero
   views reading `4% OF TOP ENTRY` would be the one thing on this screen that lies.
   `min-width:96px` and `tabular-nums` are not decoration: the composite's reason for reserved
   widths on every count is at `rnui Studio Dark.dc.html:26-27`.

   **Where the maximum comes from.** Ticket 07 defines it and this ticket imports it:
   `getTopViewCount` in `app/actions/get-recordings.ts`, returning
   `Math.max(0, ...(await readRecordingsWithCounts()).map((r) => r.view_count ?? 0))`
   (`.scratch/studio-dark/issues/07-the-tile.md:344-347`). Do not reduce over the array a second
   time — the tile's bar needs the identical number (`Tile.dc.html:49-52`), and two derivations
   are two chances for the two surfaces to disagree. Its input is always the **whole** catalogue
   with counts, never a filtered list, and `readRecordingsWithCounts` is already
   `unstable_cache`d for 300 seconds (`app/actions/get-recordings.ts:23-29`), so it refreshes on
   exactly the clock every other count on the site uses and costs no extra Firestore read.

   The floor is **0**, not 1, so the division is guarded here rather than in the reducer:
   `topViewCount <= 0` prints `0% OF TOP ENTRY` and draws the 4% fill, which is exact, because
   the maximum is only 0 when every count is.

   Nothing here changes what a view is. ADR-0007 stands, `lib/counters-firestore.ts` still owns
   the counts, and rendering a number is not counting one (`spec.md:133-135`).

7. **The three controls and the sentence under them.** `Detail.dc.html:71-77`, a flex row at
   `gap:8px` with `flex-wrap:wrap`.

   Vote: 13px / 500, `padding:10px 14px`, `rounded-[10px]`, `border-line2`, `bg-ctrl`,
   `text-t1`, focus `outline:3px solid var(--acc); outline-offset:3px`, reading `▲ Vote ` with
   the count in mono 11px `text-t2`. The mock draws only the un-voted state; the voted state
   takes the save button's treatment — `border-acc`, `bg-acc-soft`, `text-acc` — which is the
   pairing `Tile.dc.html:113-116` already defines for its own two-state control.

   Save: `border-acc`, `bg-acc-soft`, `text-acc`, label `◆ Saved`. The un-saved label is
   `◇ Save` on `bg-ctrl` with `border-line`, from `Tile.dc.html:113-116`; the Detail mock draws
   only the saved half.

   Repo: an `<a>` with `flex:1; min-width:200px`, centred, 13.5px / 500, `padding:12px 16px`,
   `rounded-[10px]`, `bg-acc`, `text-on-acc` (`#06120F` dark / `#FFFFFF` light), no underline,
   same focus ring, reading `Open source repo on GitHub ↗`. The composite calls it *"the largest
   control on the page"* (`rnui Studio Dark.dc.html:81`), which is what `flex:1` buys. It keeps
   both of today's side effects from `components/entry-detail.tsx:112-115` — `countView(entry.id)`
   and `repoClicked(facts, "detail")` — and keeps routing through the playback owner's
   `countView` rather than importing the action again, for the reason at `:104-106`: ADR-0007:22
   leaves the increment exactly one importer.

   The vote count follows the Recording with this visitor's clicks added on top, the pattern
   `components/entry-card.tsx:46-69` works out in full, including the reset when a fresh
   Recording arrives with counts that already include the click. Ticket 07 rewrites the tile's
   copy of that; whichever lands first extracts it, the other imports it. Do not invent a third
   arrangement.

   The note is `<p>` at 11.5px, `line-height:1.5`, `text-t2`, `margin:0`, reading exactly:
   `Your vote and your save stay in this browser on this device. No account exists — clearing
   site data clears them.` The em dash is the mock's (`:76`). It is the same truth
   `CONTEXT.md:35-39` states about a Remembered set and the same one `spec.md:136` makes a
   non-goal.

8. **`MORE FROM THIS CONTRIBUTOR`.** `Detail.dc.html:79-86`. Label mono 9px,
   `letter-spacing:0.14em`, `text-t3`, `padding-bottom:11px`; then a flex row at `gap:14px`
   holding two of ticket 07's tiles at `w=140` (150 on mobile, `:140`), `state="paused"` and
   `run-repeat={false}`. That last one matters: `Tile.dc.html:108-109` prefixes the byline with
   `↳ ` and dims it to `t3` when `runRepeat` is set, and this strip is by definition all one
   Contributor, so the marker would fire on every row and say nothing. The Detail passes
   `false` (`:83`) deliberately.

   `more` is the same Contributor's other Recordings, the open one excluded, first two in the
   order the page was handed them. It is derived from the Recordings in hand rather than the
   whole catalogue — on `/products?category=Buttons` that yields their other Buttons, which is
   narrower than the heading suggests but never untrue, and the alternative is putting
   `data/catalogue.ts` back into a client chunk. When there are none, omit the whole block,
   which is the same condition that drops the `See all` link in step 5.

9. **`components/recording-overlay.tsx` — the chrome, the scrim and the geometry.**

   The bar above the body (`Detail.dc.html:22-26`): `padding:14px 18px`, `border-b border-line`,
   `bg-rail` (`#0C0D11` dark / `#EFEFEB` light — the Detail's `headerBg` is byte-identical to
   ticket 02's `--rail`), `gap:14px`. It holds, left to right: the context strip in mono 9.5px,
   `letter-spacing:0.13em`, `text-t3`, reading `` `${CATEGORY} · ${i} OF ${n}` ``; then, pushed
   right by `margin-left:auto`, the legend in mono 9px, `letter-spacing:0.1em`, `text-t3`,
   reading `←&nbsp;→ PREV / NEXT` `|` `S SAVE` `|` `V VOTE` with each pipe in `text-line2`; then
   the close button in mono 10px, `padding:7px 10px`, `rounded-[8px]`, `border-acc`,
   `bg-acc-soft`, `text-t1`, labelled `ESC ✕` with `aria-label="Close, or press Escape"`.

   The `outline:3px solid {{ acc }}; outline-offset:3px` written inline on that button at `:25`
   is its **focused** state being drawn, not a permanent ring — `rnui Studio Dark.dc.html:93`
   says so: *"Focus moves to the ESC ✕ button on open (shown with its ring)"*. Ship it as
   `:focus-visible`.

   The panel: `width:1080px`, `border-radius:18px`, `border-line2`, `bg-panel`, `shadow-e2`,
   `overflow:hidden`, `padding:26px 28px 28px`, body columns `flex-direction:row` at `gap:40px`
   (`:124-131`). It is **top-aligned**, not centred: the scrim is
   `align-items:flex-start; justify-content:center; padding-top:64px` (`Catalogue.dc.html:167`),
   so the `top-1/2` and `y: "-50%"` at `components/entry-overlay.tsx:81-96` go. Keep `x: "-50%"`
   repeated across all three motion states for the reason recorded at `:77-79` — framer writes
   `transform` wholesale, so a Tailwind `-translate-x-1/2` is overwritten the moment anything
   else animates.

   The scrim becomes `bg-scrim` (`rgba(4,5,8,0.74)` dark / `rgba(24,26,30,0.52)` light, ticket
   02) with `backdrop-filter: blur(3px)`, animating opacity 0 → 1 only. The token carries its
   own alpha, so the 0.5 at `:62` goes with the `bg-black`. Note for ticket 13: a full-viewport
   backdrop blur is the one thing added here with a real cost on a low-end phone, and INP is
   already 286ms (`components/playback-owner.tsx:31-33`).

   The `FOCUS ENTERS HERE →` bar at `Detail.dc.html:90-94` is **not built.** It is a
   specification addressed to whoever implements this — "the card that opened it" describes the
   grid and means nothing to a visitor — unlike the keyboard legend, which tells a visitor which
   keys work. Step 10 and step 11 implement its three sentences instead.

10. **The keys.** One `keydown` listener on `window`, added by an effect in
    `components/recording-overlay.tsx` while a Recording is open, removed when it closes. Escape
    is not in it: Radix already owns Escape through `onOpenChange`
    (`components/entry-overlay.tsx:45-49`), and `components/catalogue-page.tsx:126-131` routes
    every close — Escape, the button, the scrim, browser Back — through the single
    `window.history.back()`.

    - `ArrowLeft` / `ArrowRight` move within the Category sequence, clamped at both ends rather
      than wrapping.
    - `s` and `S` call `onToggleSave`; `v` and `V` call `onToggleVote`. Read `e.key.toLowerCase()`.
    - Return early on `e.metaKey || e.ctrlKey || e.altKey`. On macOS `⌘←` is browser Back, and
      swallowing it would break the one close path the overlay has.

    The sequence is the Recordings the page was handed, filtered to the open Recording's
    Category, in the order they arrived — not `sortedData`. `components/catalogue-page.tsx:58-60`
    gives the precedent and the reason: the open Recording is searched against `entries` and not
    the filtered list, because un-saving it from inside the panel must not make the panel vanish.
    A sequence built from `sortedData` would have the same defect, and it would also reorder
    under the sort control while the panel was open. The consequence, stated so nobody reads it
    as a bug: with Top Viewed active, the arrows still walk the Category in catalogue order.

    `n` in the context strip is that sequence's length, so the number always counts the steps the
    arrows will actually take. On `/` and `/bookmarks` the page holds all 277 and it is the true
    Category size — 148 for Misc, which is what `data/misc.ts` holds and what the mock draws.

    Moving is `window.history.replaceState`, not `pushState`. `hooks/use-sorted-data.ts:22-26`
    gives the rule: replace rather than push because a step within a mode is not a step out of
    it, and pushing would make Escape — which is `history.back()` — walk back through every
    Recording visited instead of returning to the grid. Carry the query string across exactly as
    `components/entry-card.tsx:120-125` describes, or the grid behind the panel collapses from 96
    cards to 48.

    Arriving at a Recording by arrow is an open, so it calls `countView(id)` and
    `recordingOpened(facts, "keyboard")` — a third value beside `card` and `url`. It is ADR-0007:3
    reach, not interest: the visitor asked for that Recording. Flag it in `## Comments` when the
    ticket is resolved, because `opened_from` will have been collecting two values since deploy A
    and dashboard `1937576` exists to attribute exactly this kind of change
    (`spec.md:102-106`).

11. **Focus.** Two behaviours, both from `rnui Studio Dark.dc.html:93`.

    *In:* the close button already receives focus on open, because Radix focuses the first
    focusable descendant of the content and the close button is first in the DOM
    (`components/entry-overlay.tsx:98-105`). Keep it first. This is a constraint on the markup
    order in step 9, not new code, and it is asserted rather than assumed — see Acceptance.

    *Out:* set `onCloseAutoFocus` on `Dialog.Content`, `preventDefault()`, and focus the tile of
    the Recording that is open at the moment of closing — which after an arrow step is not the
    tile that opened it, and should not be. Ticket 07's tile root carries `data-recording-id`;
    if it does not, add it there rather than here. Radix's own restore is not enough: there is
    no trigger, and `components/entry-card.tsx:220-228` is a `div` with an `onClick` and no
    `tabIndex`, so a mouse open leaves focus on `<body>`.

12. **The motion, and where the Specimen replaces the brief.**
    `.scratch/ui-ux-overhaul/motion-brief-overlay.md` settled this surface once; the Specimen
    (`Specimen.dc.html:164-165`) settles it again, and the spec puts the Specimen's table in its
    own body (`spec.md:58-67`). Read the brief before overriding it — checkpoint 4
    (`spec.md:166-167`).

    What survives unchanged: two animated nodes, both compositor-only (brief `:56-58`);
    `AnimatePresence` in its default mode and never `mode="wait"`, because a close-then-reopen
    would queue behind the exit on the most repeated action on the site (brief `:42-45`, and
    `components/entry-overlay.tsx:51-53`); the origin stays centred and never a `layoutId` morph
    from the tile (brief `:30-34`); the grid's players stay paused while the panel is open
    (brief `:61-64`, `components/catalogue-page.tsx:104`, and the composite's *"never five loops
    behind a sixth"*); and under reduced motion opacity survives while transforms do not, gated
    in this component and not only by `MotionConfig`, for the reason at
    `components/entry-overlay.tsx:34-39`.

    What the Specimen replaces:

    | | brief | Specimen |
    |---|---|---|
    | enter duration | 180ms (`:39`) | **240ms** (`Specimen.dc.html:164`) |
    | exit duration | 100ms panel / 140ms scrim (`:39`) | **160ms**, both (`:165`) |
    | enter easing | `cubic-bezier(0.19,1,0.22,1)` (`:36`) | **`cubic-bezier(.2,.8,.2,1)`** — `ease-rise` |
    | exit easing | the same curve, *"Never `ease-in` on UI"* (`:36`) | **`ease-in`** |
    | panel transform | `scale 0.98 → 1` (`:24`) | **an 8px rise**, `translateY(8px) → 0` |

    The transform change is the brief's own open risk being closed: `:71-76` records that 2% on
    a `max-w-3xl` panel is roughly 15px of growth, *"more visible than 'felt, not seen' implies"*,
    and suggests dropping the scale. An 8px translate at a 1080px panel is 8px whatever the
    width. The `ease-in` on exit is a direct contradiction of a line in the brief, and it is
    recorded here as a supersession rather than quietly resolved: the Specimen is the spec's
    motion source, and a surface accelerating away as it leaves is the standard exception to the
    rule the brief states. Use ticket 02's `duration-240`, `duration-160` and `ease-rise` keys —
    do not type these numbers inline.

13. **`app/recording/[id]/page.tsx` — the cold arrival.** Add `export const revalidate = 300`
    and read the Recording from `getRecordingsWithCounts()` rather than `allRecordings`, so the
    `page` form has the counts steps 6 and 7 need. 300 is not a new number: it is the window
    `app/actions/get-entries.ts:23-29` already caches the same whole-collection read behind, so
    the page's counts refresh on the same clock as the grid's and add no Firestore read of their
    own. `generateStaticParams` and `dynamicParams = false` stay; the header comment at `:3-6`
    that says *"no Firestore, no searchParams, so nothing here is dynamic"* is now half wrong and
    is rewritten to say what changed and why. `generateMetadata` (`:29-42`) needs no counts and
    keeps reading `allRecordings`.

    Await ticket 07's `getTopViewCount()` here and compute `catalogueTotal` and
    `contributorTotal` in the same server
    component, and render `RecordingDetail` with `countsOwnOpen`, which is what already counts
    this arrival (`:52-56`). No overlay chrome: `Detail.dc.html:21-27,90-94` gate the context
    bar, the legend and the focus note on `isOverlay`, so the arrows and the `S`/`V` keys are
    overlay-only. Nothing on this route listens for a key.

    Above the body, a `<nav>` row at `height:62px`, `padding:0 26px`, `border-b border-line`,
    `bg-rail`, holding `← All recordings` — 12.5px, `text-acc`, underlined at offset 3px, href
    `/` — then the Category context in mono 10px, `letter-spacing:0.1em`, `text-t3`, reading
    `` `${CATEGORY} · ${n} ENTRIES` `` where `n` is the Category's true size, then, pushed right,
    `OPENED FROM A SHARED LINK` in mono 9.5px, `letter-spacing:0.12em`, `text-t3`
    (`Detail.dc.html:13-18`). The wordmark at `:14` is **not** rebuilt here: the composite calls
    this a *"real header"* (`rnui Studio Dark.dc.html:81`) and ticket 04 owns it, so this row
    continues it rather than duplicating it.

14. **Mobile.** `Detail.dc.html:96-102` and the `isMobile` branch of `:129-140`. Below the `md`
    breakpoint the columns stack (`flex-direction:column`, `gap:20px`), padding becomes
    `16px 16px 20px`, the media is 358px wide at `border-radius:16px`, the title drops to 24px
    and the info gap to 18px. The three controls move into a bar pinned under the body:
    `padding:11px 16px 16px`, `border-t border-line`, `bg-rail`, `gap:9px`, holding a
    `▲ ${votes}` button and a `◆` save button both at `min-height:44px` with
    `padding:12px 13px`, `rounded-[11px]`, and a `flex:1` repo link at `min-height:46px` reading
    `Open repo ↗`. The 44px floor is the composite's rule for the whole phone layout —
    *"every control is at least 44px tall"* (`rnui Studio Dark.dc.html:52`) — and is not
    negotiable. Both icon buttons carry `aria-label="Vote"` and `aria-label="Saved"` (`:98-99`),
    because their labels are glyphs.

15. **Tests.** `tests/e2e/entry-route.spec.ts` becomes `tests/e2e/recording-route.spec.ts` under
    ticket 01 and three of its selectors break here: `.fixed.inset-0.bg-black` at `:52` and
    `:136` (the scrim is `bg-scrim` now), `getByRole("button", { name: "Close Modal" })` at
    `:132` (the accessible name is `Close, or press Escape`), and the reduced-motion assertion at
    `:223-228` that every sampled `scale` is exactly `1` — still the right assertion, but the
    transform under test is now a translate, so it needs a matcher for `matrix(1, 0, 0, 1, tx,
    ty)` with `ty` constant. `tests/e2e/home.spec.ts:145-158` needs nothing beyond what ticket 01
    does to it; keep its claim that the panel adds no playing Demo.

    Add: a unit test for the initials rule covering `Thomino`, `Enzo Manuel Mangano ( Reactiive )` and
    `Epicode | 0xV`; and e2e coverage for the arrows, `S`, `V`, the `⌘←` pass-through, the close
    button holding focus on open, and focus landing on the tile after Escape.

16. `pnpm check-types && pnpm lint && pnpm test`, plus the Playwright suite.

## Acceptance

- `components/recording-detail.tsx` and `components/recording-overlay.tsx` contain no hex
  literal and no `rgba(`: every colour is a ticket 02 token. `grep -n "#[0-9A-Fa-f]\{6\}" ` over
  both returns nothing.
- Neither file imports `@/data/catalogue`, and a production build's client chunks still do not
  contain the string `demo/misc/` — the catalogue is not back in the browser bundle.
- On `/recording/<id>` for a Recording with `twitterId` and `githubId` set and `linkedInId`
  unset, the page shows links named `X ↗` and `GitHub ↗` and a non-link reading
  `LinkedIn not listed`.
- The Contributor line on a Recording by Enzo Manuel Mangano reads
  `124 of the 277 recordings here are theirs.` followed by a link `See all 124 →` pointing at
  `/products?contributor=Enzo+Manuel+Mangano+%28+Reactiive+%29`. On a Contributor with one
  Recording it reads `1 of the 277 recordings here is theirs.` with no link.
- `grep -rn "\b148\b\|\b1426\b" components/recording-detail.tsx` returns nothing, and a test
  asserts the rendered Contributor total equals `RECORDINGS_PER_CONTRIBUTOR[name]`.
- The media box's centre label reads `9:16 · STILL FRAME` and its pip `❙❙ PAUSED` before any
  click; after pressing play they read `9:16 · PLAYING · MUTED · LOOPING` and `● LIVE`; with the
  Demo request aborted they read `9:16 · UNAVAILABLE` with no pip and the alert reads
  `This recording won't play in your browser. The source is still there.`; and under
  `reducedMotion: "reduce"` they read `9:16 · STILLS ONLY` and `❙❙ STILLS ONLY` with
  `document.querySelectorAll("video").length === 0` on the route.
- The strip under the media reads `CAPTURED ON DEVICE · 4S LOOP · SILENT` for a Recording whose
  measured `durationMs` rounds to 4, and still reads it when the Demo has failed to decode.
- The media box's computed `height` equals `round(width / recording.aspect)` on first paint,
  using ticket 03's measured `aspect` and not the mock's 9:16 — not one of the thirteen
  Recordings measured is 0.5625 (`.scratch/studio-dark/issues/03-measure-demos-duration-aspect-hue.md:66-68`) — before any
  network response for the Demo or the Poster, and does not change after them. Cumulative layout
  shift for `/recording/<id>` is 0 in a Lighthouse run.
- On a Recording with 558 views against a catalogue maximum of 1426, the row reads `558 views`
  and `39% OF TOP ENTRY` and the fill's computed width is 39% of the track. On a Recording with
  0 views the label reads `0% OF TOP ENTRY` and the fill is 4% wide.
- `/recording/<id>` renders a view count greater than zero for a Recording that has one in
  Firestore — the number the same Recording's tile shows on `/`.
- Opening the overlay from a card leaves `document.activeElement` on the button whose accessible
  name is `Close, or press Escape`. Ten Tab presses keep focus inside `[role="dialog"]`. Escape
  leaves `document.activeElement` inside the element carrying
  `data-recording-id="<the open id>"`.
- With the overlay open on a Misc Recording, the context strip matches
  `/^MISC · \d+ OF 148$/` on `/`; `ArrowRight` then `ArrowLeft` returns to the starting id;
  `ArrowLeft` on the first of the Category and `ArrowRight` on the last change nothing; the URL
  after five arrow presses is a `/recording/<id>` address and `history.length` is unchanged from
  before them.
- With the overlay open, `S` toggles the save state of the tile behind the scrim as well as the
  button in the panel, and `V` moves the vote count in both. `⌘←` closes the overlay rather than
  stepping to the previous Recording.
- `/recording/<id>` shows no context bar, no keyboard legend, and no `ESC ✕` button, and
  `ArrowRight` there does nothing.
- The overlay's panel computes `border-radius: 18px`, `width: 1080px` at a 1440px viewport, and
  its top edge sits 64px below the viewport top. The scrim computes
  `backdrop-filter: blur(3px)`.
- Sampled per animation frame across an open and an Escape, the panel's transform matrix has a
  constant scale of exactly 1 in both directions, a `ty` that changes on open, and a `ty` that is
  constant under `reducedMotion: "reduce"` while both opacities still change. Open takes ~240ms
  and close ~160ms.
- No Demo in the grid is playing while the overlay is open, and at least one is playing again
  after it closes — `tests/e2e/home.spec.ts:145-158` still passes unmodified beyond ticket 01's
  rename.
- `MORE FROM THIS CONTRIBUTOR` renders exactly two tiles at 140px, neither of them the open
  Recording, neither showing the `↳` run marker, and the whole block is absent for a Contributor
  with one Recording.
- At a 390px viewport every control in the bottom bar has a computed height of at least 44px,
  and the two glyph buttons expose the accessible names `Vote` and `Saved`.
- Both modes: a screenshot of `/recording/<id>` in light and dark differs in colour only, and
  every text and link colour on the surface clears 4.5:1 against what it sits on.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and the Playwright suite pass.

## Open questions

1. **`ENTRIES` and `TOP ENTRY` in the copy.** `MISC · 148 ENTRIES` (`Detail.dc.html:16`) and
   `39% OF TOP ENTRY` (`:69`) are the mock's own words, while its header link four lines above
   says `← All recordings`. Decision 3 renames Entry to Recording *"in code as well as copy"*.
   Ticket 06 raised the identical question about `Every entry is a silent screen recording…` and
   the footer's `Every entry belongs to its contributor`. Four strings, one decision — the steps
   above ship the mock's spelling until it is made.
2. **`OPENED FROM A SHARED LINK`.** It is shipped as drawn, but the route is also reached by a
   cmd-clicked headline, a crawler and a reload, none of which is a shared link. If "nothing on
   screen lies" (decision 2) bites here, `OPENED AT ITS OWN ADDRESS` is the same length and is
   true of all four.
3. **Whether the detail's Demo should start itself.** Step 3 keeps click-to-play and gives the
   reasons. The mock draws the playing state, and an autoplaying detail would match it more
   literally — at the cost of a `trigger: "click"` that lies, an existing test's premise, and a
   playback owner on a surface that has none.

## Depends on

- **07**, hard and in three ways. `MORE FROM THIS CONTRIBUTOR` renders 07's tile component and
  needs it to take a width (`Detail.dc.html:83` passes `w=140` against the tile's own 208
  default at `Tile.dc.html:73`). The media glow reads `--tile-hue`, which 07 sets per Recording.
  And the four media-state strings, the failed-state copy and the two-state save control are all
  07's vocabulary, borrowed here so the two surfaces cannot drift.
- **The `Blocked by` line understates this ticket, and the spec's table does too.** `spec.md:183`
  records 09 as needing 07 alone, and 07 as needing 02 and 03 — so 03's `aspect`, `durationMs`
  and `hue` arrive transitively and 02's tokens do as well. **01 does not.** Nothing in 07's
  declared chain includes the rename, yet every step above writes `Recording`, `contributor`,
  `?contributor=`, `recordingOpened(facts, "keyboard")` and `opened_from`, and step 15 renames a
  spec file 01 moves. Started before 01, this ticket edits six files in the old vocabulary and
  then edits all six again. Treat 01 as blocking in fact.
- **05**, softly, for `RECORDINGS_PER_CONTRIBUTOR` — the Contributor's true total across the
  whole catalogue, which no client component can derive without importing the catalogue. If 05
  has not landed, the three server components compute the same map inline. Note that 05's own
  justification for that constant, *"this module is in the client graph"*
  (`05-rail-categories-and-contributors.md:141-143`), is stale: it cites
  `app/actions/get-entries.ts:18-22`, and `components/catalogue-search.tsx:53-56` records that
  the import it describes was deleted. Do not read it as permission to import `data/recording.ts`
  from a client component.

Not blocking, but contended:

- **04** owns the header, and step 13's `<nav>` row is the three items the mock draws *inside*
  it (`Detail.dc.html:13-18`). If 04 gives the shell a per-route slot, this row moves into it and
  stops being a second 62px bar under the first.
- **08** owns the grid and the tiles behind the scrim, and its zero-state and filter work touch
  `components/entry-card-grid.tsx` while this ticket touches `components/catalogue-page.tsx`
  above it. The `catalogueFacts` prop in step 1 and ticket 06's `stats` prop carry overlapping
  numbers; whichever lands second folds one into the other rather than adding a sibling.
- **10** owns Contributor routes. If it introduces `/contributor/<slug>`, the `See all N →` link
  and the profile block point there instead of at `?contributor=`.
- **11** owns mobile. Step 14 builds the Detail's own phone form because it is the same
  component and the same file; the bottom sheet and the phone header remain 11's.
- **13** is the merge gate and owns the verification this ticket's Acceptance sets up: the
  contrast pass in both modes, the keyboard walk, the reduced-motion sampling, and the LCP/CLS/INP
  measurement — including whatever the scrim's `backdrop-filter: blur(3px)` costs on a phone.

## Comments

Built 2026-08-03 — code, tests, build all green (`check-types`, `lint`, 245 unit, 160 e2e).
**Status is `ready-for-human`, not `resolved`** — three acceptance bullets need data or
judgement this commit cannot supply; they are named at the end of this section. (The word
"Resolved" opened this note originally and contradicted both the `Status:` line above and this
section's own closing paragraph; corrected in place, since `resolved` is terminal and claiming
it early is how the remainder gets lost.)
Everything below the line this ticket drew stays as the spec froze it: `api_host`
`https://us.i.posthog.com`, Firebase owns view and vote counts, `/products`, `?category=`,
`view_count` and `vote_count` keep their public spelling, and the three stored keys keep their
exact strings.

- **The overlay was rewritten, not patched** (`components/recording-overlay.tsx`). The committed
  version predated the Specimen: it still used the brief's 180/100/140 durations, the scale
  `0.98 → 1`, `bg-black` + an inline 0.5, `EASE = [0.19,1,0.22,1]`, and a centred panel. The
  rewrite ships the Specimen's table (`spec.md:58-67`): enter 240ms / exit 160ms both nodes,
  `cubic-bezier(.2,.8,.2,1)` on open and `easeIn` on close, an 8px rise (`translateY(8px) → 0`)
  instead of scale, `bg-scrim` with `backdrop-filter: blur(3px)`, and a top-aligned panel
  (`align-items:flex-start; justify-content:center; padding-top:64px`). The durations live as
  `ENTER_MS`/`EXIT_MS`/`RISE` constants rather than ticket 02's Tailwind keys because framer
  takes numbers, not class names.
- **Two open risks were closed.** The old overlay travelled 50px on open (brief's own note);
  the 8px translate at a 1080px panel is 8px whatever the width. And under reduced motion the
  transform is gated **in the component** (`rise = reduce ? 0 : 8`), not only by
  `<MotionConfig reducedMotion="user">`, so no panel ever paints one frame risen.
- **One keydown listener, added while open** (step 10): ArrowLeft/Right walk the Category
  sequence clamped at both ends, `s`/`S` and `v`/`V` toggle save and vote, and a modified arrow
  returns early so `⌘←` keeps its browser Back (the one close path). Escape is Radix's, routed
  through `onOpenChange` → the single `window.history.back()`.
- **`opened_from: "keyboard"`** (step 10): arriving by arrow is ADR-0007:3 reach, so the
  overlay calls `countView` + `recordingOpened(facts, "keyboard")`. `opened_from` has been
  collecting `card` and `url` since deploy A; the third value is live as of this commit. Flagged
  here as the ticket asks because dashboard `1937576` exists to attribute exactly this
  (`spec.md:102-106`).
- **Focus in/out** (step 11): the close button is first in the DOM so Radix focuses it on open;
  `onCloseAutoFocus` returns to the tile that was open at the moment of closing via
  `data-recording-id` — which after an arrow step is not the tile that opened it. The card root
  now carries `data-recording-id` and `tabIndex={-1}` (`components/recording-card.tsx`), since a
  div needs a tabIndex for `.focus()` to work at all.
- **The standalone route** (`app/recording/[id]/page.tsx`) now has `revalidate = 300`, reads
  the Recording from `getRecordingsWithCounts()`, computes `catalogueTotal`, `contributorTotal`
  (`RECORDINGS_PER_CONTRIBUTOR`), `more`, `topViewCount` and the Category size server-side, and
  draws the shared-link `<nav>` row (`Detail.dc.html:13-18`). Its client half lives in
  `app/recording/[id]/recording-body.tsx`, which owns the two Remembered sets through
  `useRememberedSet` so saved/vote on the route are the same state the tile shows on `/`.
- **Threading**: `components/catalogue-page.tsx` derives `more`, `sequence`, `contributorTotal`
  and `catalogueTotal` from the Recordings in hand — never by importing `data/catalogue` into a
  client chunk (step 8's reason). On `/` and `/bookmarks` the whole catalogue is in hand, so the
  counts are the true ones.
- **Tests added**: `tests/recording-detail.test.ts` (initials rule + `formatAspect`); the
  design-tokens test now pins `--media-glow` and `boxShadow.media`
  (`tests/design-tokens.test.ts:128-140`); `tests/e2e/recording-route.spec.ts` gained the
  arrows/`history.length` walk, `S`/`V`, the focus-on-open and focus-on-Escape claims, the
  modified-arrow pass-through, the reduced-motion `ty` sampling, the media label, the
  no-overlay-chrome route, the 44px phone bar, and the Contributor-total claims (Enzo `124 of
  the 277`, solo contributor `1 of the 277`, link href). Three selectors step 15 flagged broke
  and were fixed in-place: `.fixed.inset-0.bg-black` → `.bg-scrim`, `Close Modal` →
  `Close, or press Escape`, and the scale matcher → a `ty` matcher.
- **Open question 1 stands**: `ENTRIES`/`TOP ENTRY` still ship the mock's spelling per the
  ticket; the `S SAVE`/`V VOTE` legend does not use `ENTRIES`.

**Review, 2026-08-03, after ticket 10 landed.** A `/code-review-mp` pass over this commit found
two defects the claims above do not cover. Both were confirmed by reading the source, not just
reported. The Comments above overclaim on both counts and are left standing so the correction
is dated rather than hidden.

1. **The panel has no positioning at all** (`components/recording-overlay.tsx:169`). Step 9's
   `align-items:flex-start; justify-content:center; padding-top:64px` was put on
   `Dialog.Overlay`, but Radix renders `Dialog.Content` as a **sibling** of the Overlay inside
   the Portal, not as its child — so the flex container centres nothing, and the Content
   `motion.div` carries no `fixed`, no `absolute` and no offset of its own. It lays out as a
   static block at the end of `<body>`, below the locked page. The acceptance bullet *"its top
   edge sits 64px below the viewport top"* fails and no test asserts it.
2. **`S` and `V` bypass the detail's handlers** (`:113-117`). They call `onToggleSave` /
   `onToggleVote`, which are the Remembered-set toggles, rather than `handleSave` / `handleVote`
   in `components/recording-detail.tsx`. So a keyboard vote flips `aria-pressed` but never
   reaches `incrementVoteCount`, never fires `vote_cast` or `bookmark_added`, and never moves
   the printed count — the acceptance bullet is *"`V` moves the vote count in both"*. It is also
   exactly the narrowing `spec.md:107-115` warns of, where the keyboard layer skips the click
   handlers and an event silently comes to mean mouse-only. Worse, the two paths now disagree
   about state: press `V` and then click Vote and `decrementVoteCount` runs for a vote that was
   never counted.

Both are this ticket's to fix, not ticket 10's or 13's, and they are why this ticket must not go
to `resolved` on the strength of the Comments above.

**Fixed, same day, at the maintainer's direction.** Every claim below was verified against this
ticket and the source before anything was edited; three of the ten reported turned out to be
wrong or already handled and are recorded as such. `pnpm check-types` clean, `pnpm lint` 0
errors, `pnpm test` 245/245, `pnpm build` compiled, Playwright **174/174 with no flake**.

- **The panel positions itself** (`components/recording-overlay.tsx`). `fixed left-1/2 top-16`
  with `x: "-50%"` repeated across all three motion states, which is step 9 as written — the
  `x` is there for step 9's own reason, that framer writes `transform` wholesale and would wipe
  a Tailwind `-translate-x-1/2` the moment `y` animates. The dead flex came off the scrim, and
  the panel gained `max-h-[calc(100vh-64px)]` with `overflow-y-auto min-h-0` on the body so a
  tall Recording scrolls inside its own corners. Measured: the panel's top edge is **64px**,
  width 1080px at 1440px, centred on 720. It was **6396px** — a static block below the locked
  page. There is now a test for the acceptance bullet, which never had one.
- **`S` and `V` call the handlers the buttons call.** They moved into
  `components/recording-detail.tsx` behind a `keyboardControls` prop, because that is where
  `handleSave`/`handleVote` and the optimistic count already live; lifting them into the overlay
  would have moved that state too and duplicated it again for the standalone route. This is the
  one place the fix departs from step 10, which put every key on one window listener: there are
  now two while the overlay is open, arrows in the overlay and S/V in the body. The new test
  compares the server actions a keyboard vote fires against the ones the button fires and
  requires the same set — the old test asserted `aria-pressed` alone, which is exactly what a
  keyboard path that wrote nothing could satisfy.
- **`perContributor` is threaded, so step 1's `catalogueFacts` finally exists** in the form the
  step asked for, folded in beside `stats` rather than as a second facts object. `/` and
  `/products` both pass `RECORDINGS_PER_CONTRIBUTOR`; `/bookmarks` omits it and deriving there
  is exact. On `/products?category=Charts` the line read *"3 of the 277 recordings here are
  theirs"* with a `See all 3 →` that landed on 124. `more` stays derived from the set in hand,
  per step 8 — so on a filtered route the link can name a bigger number than the strip shows,
  which is the honest pair, because the link goes where it says it goes.
- **The standalone route stopped adding a Firestore read.** It now awaits the cached
  `getRecordings()` and `getTopViewCount()` together instead of calling `getRecordingsWithCounts()`
  and reducing `Math.max` over the array itself — step 6's "do not reduce over the array a second
  time" and step 13's "await ticket 07's `getTopViewCount()` here". `catalogueTotal` and
  `contributorTotal` now come from `allRecordings` and `RECORDINGS_PER_CONTRIBUTOR`, so a
  Firestore outage — which `getRecordings()` answers with `[]` rather than a throw — cannot make
  the page print *"0 of the 0 recordings here"*, and the two surfaces cannot give one Recording
  two different Contributor totals.
- **An absent social id states the absence for all three networks**, not LinkedIn only. The
  guard moved into `profileLink`, where all three pass through it, and `profileUrlFor` now
  matches on the network name rather than on the rendered copy — it read `label.startsWith("X")`
  against the display string, so renaming a link would have silently repointed it. 17 Recordings
  have a `githubId` and no `twitterId`; all of them showed a gap where the mock draws a sentence.
- **The page form's title is an `h1`** (step 4). The route shipped no `h1` at all, and the
  existing test pinned the defect by asserting level 2.
- **The desktop vote button reads `▲ Vote`** (step 7). Only the accessible name carried the word.
- **The reduced-motion matcher reads `ty`.** It matched group 2 of
  `matrix\(([-\d.]+), 0, 0, ([-\d.]+),` — that is `d`, the y-scale — and never matched
  `matrix3d(` at all. It passed only because the panel had no horizontal centring to write, so
  every frame was `transform: none`; adding `x: "-50%"` made the matrix branch live and it had
  to be right. It now parses the list and indexes `ty` per form, and asserts the scale the
  acceptance names, which the old matcher only enforced by accident.

Three reported problems were **not** defects and nothing was changed for them:

- **The empty `MORE FROM THIS CONTRIBUTOR` strip is already handled** — named at step 8, asserted
  in the acceptance, and implemented. Ticket 10 step 7 asked that it be named here; it was.
- **`ENTRIES` / `TOP ENTRY` is Open question 1, not an oversight.** The strings are mandated by
  this ticket in normative steps *and* in the acceptance, so the code is not off-spec. But the
  conflict is real and unexempted: ADR-0008 renames the domain "in code and in copy", `CONTEXT.md`
  lists **entry** under Recording's *Avoid*, and ticket 04 already broke this tie against the mock
  once — `components/site-footer.tsx` ships "Every recording belongs to its contributor." Of the
  four strings, one now says recording, one still says entry (`components/hero.tsx`, ticket 06's
  own open question) and these two are here. **This is the maintainer's call and it should be made
  in one pass over all four**; patching two of them would leave the site disagreeing with itself.
- **The strip does not reuse ticket 07's tile at `state="paused"`** (step 8). Left as it is,
  deliberately: reuse means making the playback owner optional in
  `components/playback-owner.tsx` and `components/demo-tile.tsx`, which are what every tile in
  the grid depends on, to change something no acceptance bullet measures — the bullet asks for
  two tiles at 140px, neither the open Recording, no `↳` marker, absent for a Contributor with
  one Recording, and the hand-rolled block satisfies all four. Named here rather than done, so
  the choice is visible.

Set `ready-for-human`, not `resolved`: three acceptance bullets need data or judgement this
commit cannot supply — the Firestore-backed view-count bullet (a Recording with one in
Firestore renders it; needs deploy A's counts), the Lighthouse CLS=0 run, and the light/dark
screenshot + 4.5:1 contrast pass, which checkpoint 5 (`spec.md:207-208`) assigns to deploy B /
ticket 13. Everything else on the Acceptance list is covered by the suite above.
