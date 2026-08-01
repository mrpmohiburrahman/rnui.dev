# 07 — The tile

Status: ready-for-agent
Blocked by: 01, 02, 03

## Problem

One tile renders 48 times per catalogue page (`components/recording-card-grid.tsx`, `PAGE_SIZE = 48`
at `:15`, and `tests/e2e/home.spec.ts:108` asserts exactly 48), so it is the one component where a
wrong value is wrong forty-eight times and a wasted paint is forty-eight paints. It is also the only
part of the mock that is drawn to completion: `assets/new-ui/Tile.dc.html` models five states in two
modes, and both `Catalogue.dc.html:93` and `Detail.dc.html:83` import it rather than redrawing it —
the catalogue at `w=208`, the detail's `MORE FROM THIS CONTRIBUTOR` strip at `w=140`.

What renders today is two files and neither is close to it.

`components/recording-card.tsx` wraps everything in `MinimalCard`, whose class list is a 24px radius
plus three stacked `shadow-[...]` declarations (`components/cult/minimal-card.tsx:14-19`), tinted on
hover to `hover:bg-pink-100 dark:hover:bg-gray-900` (`recording-card.tsx:233`). The mock has no card:
the media box is the only bounded object on the tile, and the caption, the Category label, the
byline and the controls sit directly on the canvas with `gap:10px` under the media
(`Tile.dc.html:10`). The card also carries a save control absolutely positioned over the media at
`top-4 right-4` in a white circle (`recording-card.tsx:243-254`), a `Badge variant="success"` reading
`New` at `top-4 left-4` (`:257-261`), three contributor profile links (`:328-364`), a `Source` link
(`:369-377`), and a footer row reading `Views: 1426` / `Votes: 3` beside a lucide `Star`
(`:383-401`). The mock puts `NEW` top-right *inside* the media, moves saving into a control row below
it, drops the three profile icons from the tile entirely — they live on the detail instead
(`Detail.dc.html:57-59`, `X ↗`, `GitHub ↗`, `LinkedIn not listed`) — and turns the two raw counts
into a views figure with a proportion bar and a `▲ n` button.

`components/demo-tile.tsx` is closer, because it is the outcome of `ui-ux-overhaul` ticket 09 and
already holds every playback decision this effort keeps. It has no hue, no elevation, no brightness
distinction and no state chip, its failure state reads `This demo failed to load` over
`bg-neutral-900` (`:127-132`), and its cross-fade is `duration-150` (`:166`) where the Specimen says
160ms.

The one thing the tile cannot get from a token file is the hue. `E1 · emission — a playing tile,
tinted by its own recording` (`Specimen.dc.html:152`) is the reason ticket 03 exists, and until a
Recording carries a measured `hue` every glow in the design would have to be the same colour, which
is the one thing the elevation scale says it is not.

## Work

### 1. `components/demo-tile.tsx` — the props, and everything that must not move

Replace the `demoPath` / `posterPath` / `caption` props with the `Recording` itself, keeping `facts`
and adding `onRepoClick`. The tile now needs `hue` for the emission, `isNew` for the chip and
`source` for the failed state's action, and four more scalar props is worse than one object. The
comment at `:52-54` — *"Asset paths in, not `src`/`poster` — ADR-0004 and CONTEXT.md's Asset path
entry"* — stays true and stays: the module still reads `recording.demoPath` and `recording.posterPath`
and still never speaks `src` or `thumbnail`. ADR-0004 governs the spelling, not the arity.

Everything below is `ui-ux-overhaul` ticket 09's, is load-bearing for a recorded reason, and survives
this ticket verbatim. Spec checkpoint 4 exists for exactly this list — read the reason before
touching the line.

- The Poster `<img>` with `loading="lazy"`, `decoding="async"`, `object-cover` (`:144-150`). It
  replaced a CSS `background-image` that fetched all 277 Posters, ~3.9MB, on mount (`:136-142`).
  `tests/e2e/poster-loading.spec.ts:13-29` counts requests, and `:31-58` asserts
  `object-fit: cover`, `object-position: 50% 50%` and that the `<img>` rect equals the tile rect.
- `preload="none"`, `muted`, `loop`, `playsInline`, no `controls`, no `poster`, no `<track>`
  (`:176-184`). `preload="none"` is why a mounted idle `<video>` fetches nothing;
  `tests/e2e/home.spec.ts:97-119` asserts at most five Demos are requested on a 48-tile page.
- `usePrefersReducedMotion` (`:39-50`) and its server snapshot of `true`, so no `<video>` is ever
  server-rendered. `tests/e2e/home.spec.ts:182-207` asserts `page.locator("video")` has count 0 and
  zero `/demo/` requests under `reducedMotion: "reduce"`.
- `registerDemo` as a memoised `useCallback` (`:106-112`). An inline arrow unobserves and
  re-observes the `<video>` on every render, and this ticket adds render-causing state below.
- `demoPlayed(facts, "grid", "autoplay")` once per tile per page behind the `announced` ref
  (`:77`, `:169-174`) and `demoLoadFailed(demoPath, reason, demoUrl)` (`:99`).
- `hasPlayed` never resets. The Poster is the frame two seconds in
  (`scripts/generate-posters.ts:47-48`, `-ss 00:00:02`) while playback starts at 0, so fading back
  would reintroduce the same backwards jump in the other direction (`:163-165`).
- `data-testid="demo"` on the media box and `data-testid="demo-error"` on the failure
  (`:122`, `:126`). Four spec files locate the tile by the first — `home.spec.ts`,
  `poster-loading.spec.ts`, `remembered-set.spec.ts` and `served-html.spec.ts`, the last of which
  counts the literal string in the served HTML (`served-html.spec.ts:54`).

The `bg-black` note at `:114-121` is the one that changes rather than survives, and it changes
because its cause is removed. It records that the card clipped this box to a rounded top corner and
the arc was antialiased against however many dark layers sat under it — with one instead of two, ten
corners came out a few levels lighter, 138 pixels measured. In the mock the radius and the background
are the same element (`Tile.dc.html:11`: `border-radius:16px;overflow:hidden;background:{{ plinth }}`),
so there is one layer by construction and the wrapper's `rounded-t-lg overflow-hidden`
(`recording-card.tsx:266`) goes away with it. Rewrite the comment to say that, naming plinth rather
than black; do not delete it, because the next person to split the box into two layers needs to know
what happened last time.

### 2. The media box

One element, `data-testid="demo"`, `aspect-[9/16]`, `border-radius:16px`, `overflow:hidden`,
`position:relative`, and no width of its own — the detail renders this same tile at 140px
(`Detail.dc.html:83`) and `recording-card.tsx:221-227` records what a hard 221-pixel width did inside
a `minmax(0, 1fr)` track.

Its background colour is the **plinth**: `#05060A` dark, `#080A0E` light (`Tile.dc.html:65-66`). Not
the panel and not the canvas, in either mode — `Specimen.dc.html:32` states the rule: *"The media
plinth stays near-black in both modes — the recording is the light source, so it never sits on
paper."*

Over the plinth, as the box's own `background-image`, goes the **wash**, whose two forms differ by
playback state and not by mode (`Tile.dc.html:80-82`), with `H` the Recording's hue:

```
resting  radial-gradient(72% 48% at 50% 27%, hsla(H,50%,52%,0.20), transparent 74%),
         linear-gradient(180deg, hsla(H,40%,32%,0.14), rgba(0,0,0,0.66))
playing  radial-gradient(72% 48% at 50% 27%, hsla(H,72%,64%,0.46), transparent 74%),
         linear-gradient(180deg, hsla(H,55%,42%,0.24), rgba(0,0,0,0.62))
```

The Poster is `object-cover` and opaque, so the wash is visible only in the window between layout and
the lazy Poster painting. That is what it is for here: it is the placeholder this site has never had,
and it costs no element and no request. It is deliberately not animated — the Specimen's 220ms
applies to *brightness and glow* (`Specimen.dc.html:162`), and gradient interpolation is not
something to depend on across engines.

Three things drawn inside the mock's media box do **not** ship: the diagonal hatch at
`Tile.dc.html:13`, the 3px bar at `top:11px` (`:14`), and the centred `9:16 · STILL FRAME` label
(`:15`). All three are the mock standing in for a screen recording it does not have. A real Poster
occupies that box, and shipping them would draw a fake status bar and a fake caption on top of a real
phone screen.

That label is the decision ticket 03 handed to this one and it is settled here: the tile does not
render a `9:16 · …` centre label in any of its forms (`Tile.dc.html:89-93` draws four). `03`'s
measurement is why — *"the drawn string `9:16` is wrong for every Recording measured above"*
(`03-measure-demos-duration-aspect-hue.md:290-293`); not one of the thirteen sampled is 0.5625 and
three are wider than tall. Recomputing it from the measured `aspect` would print a true ratio the
visitor can already see, and the state the label also carried — `PLAYING · MUTED`, `STILL FRAME`,
`UNAVAILABLE` — is the state chip's in step 5. So the label is dropped rather than corrected, and no
part of this tile prints a ratio.

The mock's media is an `<a aria-label="Open entry">` (`:11`). It does not become one here. This card
already has exactly one keyboard route into the Recording — the caption link, whose reasoning is
written out at `recording-card.tsx:280-303` — and the card body's `onClick` (`:228`) already opens the
Recording from a click anywhere on the media. A second link per card would put 96 tab stops on a
48-tile page and give a crawler 48 links whose accessible name is the same four words.

### 3. Resting, playing, and the elevation

The tile needs a second piece of state beside `hasPlayed`: `playing`, set true on `onPlaying` and
false on `onPause`. They are not the same question and must not share a variable — `hasPlayed` is
*has the fade run*, and never resets; `playing` is *is a slot granted right now*, and the owner
pauses tiles that scroll out of view (`components/playback-owner.tsx:118`). Reusing `hasPlayed` for
the glow would leave every tile the visitor has scrolled past glowing behind them.

This does re-render, and `playback-owner.tsx:11-12` says *"Nothing here is state… on a 48-card page a
re-render per scroll event is the whole INP budget."* That statement is about the owner and stays
true: the owner still holds no state and still re-renders no consumer. What re-renders here is one
`DemoTile` leaf per grant or revoke — at most ten per scroll that rotates all five slots — and every
element the playing state changes (the shadow, the filter, the wash, the chip) is inside that leaf.

The hue reaches CSS as one inline custom property, `--tile-hue`, set from `recording.hue ?? 175` —
the mock's own fallback (`Tile.dc.html:75`: `e.hue == null ? 175 : e.hue`), which is the accent's own
hue (`Specimen.dc.html:114`, `acc #6FE3CC` is `oklch(0.85 0.117 175)`), so an unmeasured Recording
glows in the site's accent rather than in nothing. Everything else is a class, keyed on `.dark` and on
a `data-playing` attribute, because the mode must come from the class `next-themes` puts on `<html>`
and never from a JS theme read: `useTheme()` resolves after mount, and 48 tiles reading it would all
repaint on hydration.

Elevation, per `Tile.dc.html:83-88`:

| | dark | light |
|---|---|---|
| E0 resting | `0 0 0 1px rgba(255,255,255,0.07)` | `0 0 0 1px rgba(16,18,22,0.10), 0 8px 20px -16px rgba(8,10,14,0.5)` |
| E1 playing | `0 0 0 1px hsla(H,60%,60%,0.24), 0 22px 60px -20px hsla(H,70%,55%,0.45)` | `0 0 0 1px rgba(16,18,22,0.10), 0 20px 44px -22px hsla(H,55%,40%,0.55)` |

`Specimen.dc.html:152` draws its E1 sample at `hsla(290,60%,62%,0.26)` and `hsla(290,70%,58%,0.45)`.
The tile's own file is the tile's specification, so the numbers above win; the difference is two
percentage points of lightness and 0.02 of alpha and is not worth a second token.

Brightness, per `Tile.dc.html:99`: a resting tile carries
`filter: brightness(0.78) saturate(0.85)` in dark and `filter: brightness(0.9)` in light; a playing,
failed or loading tile carries `none`. Both `filter` and `box-shadow` transition over
**220ms `cubic-bezier(.2,.8,.2,1)`** (`Specimen.dc.html:162`). No `will-change`: 48 promoted layers
to animate five of them at a time is the trade in the wrong direction, and the constraint at
`spec.md:147-150` names the per-tile glow as one of the two things in this effort most able to undo
the LCP work. What bounds it is `MAX_PLAYING = 5` (`playback-owner.tsx:35`) — at most five 60px-blur
shadows exist at any moment and the other 43 are a 1px hairline with no blur.

**Reduced motion must not leave the tile dim.** `Specimen.dc.html:95` states the rule: *"video
elements are never mounted — posters only, tiles at full brightness, all durations 0ms."* No
`<video>` mounts, so `playing` is never true, so a resting-by-default brightness of 0.78 would hand
the visitors least able to opt out of it a permanently darkened catalogue — the dim exists only to
distinguish resting from playing, and there is nothing to distinguish. The mock's own `still` branch
falls into the dimmed arm at `Tile.dc.html:99` because `still` is not `live`; `Specimen.dc.html:95`
supersedes it, and this is the one place the Tile file loses.

Express it in CSS, not in the hook: the brightness and both transitions sit behind
`@media not (prefers-reduced-motion: reduce)` — Tailwind's `motion-reduce:` variant resetting
`filter` to `none` and `transition` to `none` is the same thing in two classes. CSS rather than the
`reduced` boolean because the boolean's server snapshot is `true` (`demo-tile.tsx:49`), so a JS branch
would serve every tile at full brightness and then dim 48 of them at hydration. The media query is
correct in the served HTML for both kinds of visitor.

### 4. The cross-fade becomes 160ms, linear

`demo-tile.tsx:166` reads `transition-opacity duration-150` and inherits Tailwind's default
`cubic-bezier(0.4,0,0.2,1)`. The Specimen's first motion row is `160ms opacity, linear`
(`Specimen.dc.html:161`), and `.scratch/ui-ux-overhaul/spec.md`'s correction of 2026-08-01 records the
supersession in one line: *"Decision 15's 150ms poster-to-video cross-fade becomes 160ms, per the
Studio Dark specimen. One number."* So `duration-[160ms] ease-linear`. This is the only change this
ticket makes to playback behaviour; the comment above it explaining *why* there is a fade at all
(the Poster is two seconds ahead of frame 0) stays.

### 5. The two chips

Both are `position:absolute`, `font-family:'JetBrains Mono'`, `font-size:8.5px`,
`letter-spacing:0.13em`, `padding:4px 7px`, `border-radius:6px` (`Tile.dc.html:27,30`), and both are
`aria-hidden`: they describe a purely visual state, and 48 of them announced is noise a screen-reader
visitor cannot act on.

The state chip sits at `left:10px;bottom:10px` and is suppressed while loading or failed
(`:102`). Its three forms (`:103-105`):

| state | text | background | colour |
|---|---|---|---|
| playing | `● LIVE` | dark `rgba(111,227,204,0.20)`, light `rgba(6,20,18,0.72)` | `#8FF0DC` in both modes |
| resting | `❙❙ PAUSED` | `rgba(4,6,10,0.62)` | `rgba(255,255,255,0.72)` |
| reduced motion | `❙❙ STILLS ONLY` | `rgba(4,6,10,0.62)` | `rgba(255,255,255,0.72)` |

The third is the mock's `still` state and it maps exactly onto `usePrefersReducedMotion()` returning
true — the chip is what carries that state now that step 3 has taken the brightness away from it.

The NEW chip sits at `right:10px;top:10px`, reads `NEW`, and renders when `recording.isNew`, which
`getRecordingsWithCounts()` already computes as "shares the latest `created_at` date"
(`data/recording.ts:90-96`). Fill `rgba(235,208,138,0.22)` dark / `rgba(255,238,190,0.94)` light,
text `#F3DEA6` dark / `#5C4204` light (`Tile.dc.html:106-107`). `Specimen.dc.html:115,126` records
those two as 13.1:1 on canvas and 8.6:1 on the tag fill. It replaces `Badge variant="success"` at
`recording-card.tsx:257-261`.

### 6. DECODE FAILED

The failure overlay covers the media box: `background:rgba(4,5,8,0.9)`, column, centred, `gap:11px`,
`padding:18px`, `text-align:center` (`Tile.dc.html:20`). Three children (`:21-23`):

- A mono label, `font-size:9px`, `letter-spacing:0.14em`, colour `#F5B3A4`.
- The message, `font-size:12px`, `line-height:1.45`, `rgba(255,255,255,0.86)`, `text-wrap:pretty`,
  reading exactly: `This recording won't play in your browser. The source is still there.` — with the
  typographic apostrophe the mock uses (`won’t`).
- The action, `font-size:11.5px`, `font-weight:500`, colour `#08090C` on `#F1F2F4`,
  `padding:7px 11px`, `border-radius:9px`, reading `Open repo ↗`. It points at `recording.source`
  with `target="_blank" rel="noopener noreferrer"`, and it calls the same handler the `Repo ↗` link
  below the media calls — following the Source link is one of ADR-0007's three view signals and a
  broken tile does not change that.

Keep `role="alert"` and `data-testid="demo-error"` (`demo-tile.tsx:125-126`); `home.spec.ts:172`
asserts the testid. Drop the `{caption} ({reason})` line — the mock has no place for it and
`demoLoadFailed` already reports the reason to PostHog.

The mono label is not one string. `FAILURE_REASONS` (`demo-tile.tsx:24-29`) maps four `MediaError`
codes, and the comment above it says why the distinction is load-bearing: *"'network' means the Asset
is missing, 'decode' means it is the wrong codec — which is how 48 Demos shipped as unplayable HEVC
and stayed that way for months."* Telling the maintainer a missing Asset was a decode failure would
undo that, and `spec.md`'s decision 2 says nothing on screen lies. Leave `FAILURE_REASONS` untouched —
its values are the `reason` property `posthog-expansion` reads — and add a second four-entry map for
the label: `◺ PLAYBACK ABORTED`, `◺ NETWORK FAILED`, `◺ DECODE FAILED` (the mock's own string, for
the code it drew), `◺ FORMAT UNSUPPORTED`, and `◺ PLAYBACK FAILED` for an unknown code.

### 7. `components/recording-card.tsx` — below the media

`MinimalCard` and its three shadows go. The tile is a plain column, `gap:10px` between the media and
the text block and `gap:7px` between the rows inside it (`Tile.dc.html:10,44`). Delete
`components/cult/minimal-card.tsx` and `components/badge.tsx` in the same commit: a grep across
`app/` and `components/` finds exactly one importer of each, and it is this file
(`recording-card.tsx:19-24` and `:18`). Delete the three profile links (`:328-364`) and the `Source`
link (`:369-377`); the mock puts the profiles on the detail (`Detail.dc.html:57-59`), which is ticket
09's, and the comment at `recording-card.tsx:209` already records that one page announces the same
three links up to 124 times.

The rows, in order:

1. **The caption.** `min-height:39px`, `font-size:14.5px`, `font-weight:500`, `line-height:1.32`,
   `letter-spacing:-0.01em`, colour `t1`, `text-wrap:pretty` (`Tile.dc.html:45`). It stays an `<h3>`
   containing the `<Link href={`/recording/${recording.id}`}>` exactly as it is today, with
   `handleHeadlineClick` and `prefetch={false}` — seven spec files locate a card through
   `getByRole("heading", { level: 3 })` (`entry-route`, `filters`, `home`, `keyboard`,
   `remembered-set`, `theme`, `view`), and `recording-card.tsx:280-303` records why the modified-click
   passthrough exists. The `min-height` is not decoration: two lines at 14.5×1.32 is 38.3px, so
   reserving 39 keeps a one-line caption and a two-line caption on the same baseline and stops the
   row below shifting when one wraps.
2. **The Category label.** Mono, `font-size:9px`, `letter-spacing:0.12em`, colour `t3`, upper-cased
   (`Tile.dc.html:46,98`). The Specimen's label row says `mono 9 / +14%` (`:144`); the tile's own
   Category line says `0.12em`, and for this element the tile wins.
3. **The Contributor byline.** `min-height:31px`, `font-size:12px`, `line-height:1.32`,
   `overflow-wrap:anywhere`, colour `t2` (`Tile.dc.html:47`). Plain text, not a link.
   When the previous tile in the grid has the same Contributor the byline is prefixed `↳ ` and drops
   to `t3` (`:108-109`). That is what the mock's `runRepeat` means, and the data proves it: in
   `Catalogue.dc.html:180-191` the flag is set on `Bottom Bar` (after `Onboarding by Thomino`),
   `Bezier Curve Outline` and `Wheel Picker` (both after another Enzo Manuel Mangano tile), and the
   `filtered` variant overrides it to `i === 1` on a two-item list whose second entry shares the
   first's contributor (`:202`). Take it as a prop, `repeatsContributor`, defaulting to `false`; the
   grid computes it in step 9.
4. **The views row.** `gap:8px`, `margin-top:2px`. A 3px track at `flex:1`, `border-radius:2px`,
   `rgba(255,255,255,0.09)` dark / `rgba(16,18,22,0.10)` light, with a fill of
   `rgba(255,255,255,0.34)` dark / `rgba(16,18,22,0.34)` light; then mono `font-size:10px`, colour
   `t3`, `font-variant-numeric:tabular-nums`, `white-space:nowrap`, reading `1,426 views`
   (`Tile.dc.html:48-53,110-111`). Format the number with `toLocaleString("en-US")` and not the
   visitor's locale — an unpinned locale formats differently on the server and in the browser, and
   that is a hydration mismatch on 48 numbers.
5. **The controls row.** `gap:6px`, `margin-top:3px` (`:54`).
   - **Vote**, mono `10.5px`, `padding:6px 9px`, `border-radius:8px`, `border:1px solid line`,
     background `ctrlBg`, colour `t2`; hover `border-color:line2; color:t1`; focus
     `outline:3px solid acc; outline-offset:2px` (`:55`). Content `▲ {votes}` with the glyph
     `aria-hidden`. The mock draws no voted state, so derive it from the mock's own vocabulary for
     "this one is on for you" — the saved treatment at `:114-116`: border `acc`, background
     `accSoft`, colour `acc`. Its accessible name becomes `Vote, 3` / `Unvote, 3`: the count is
     inside the button now, so a bare `aria-label` would silence it.
   - **Save**, `font-size:11px`, `padding:6px 9px`, `border-radius:8px`, Space Grotesk, reading
     `◇ Save` or `◆ Saved` with the glyph `aria-hidden` (`:56,113-116`). Unsaved: border `line`,
     background `ctrlBg`, colour `t2`. Saved: border `acc`, background `accSoft`, colour `acc`. **No
     `aria-label`** — the visible word is now "Save", and an accessible name of "Add Bookmark" over a
     button that says Save is a WCAG 2.5.3 failure. The name is the visible text and the state goes on
     `aria-pressed`. It still fires `bookmarkAdded` / `bookmarkRemoved`: ticket 01's acceptance pins
     twelve of the thirteen event names byte-identical and `posthog-expansion` ticket 09's dashboard
     `1937576` reads them, so renaming the copy is not renaming the event.
   - **Repo**, `margin-left:auto`, `font-size:11.5px`, `font-weight:500`, colour `acc`,
     `text-decoration:underline`, `text-underline-offset:3px`, focus
     `outline:3px solid acc; outline-offset:3px; border-radius:3px` (`:57`). Reads `Repo ↗` with the
     arrow `aria-hidden`, so the name is `Repo`. Keeps `handleSourceClick`, `target="_blank"` and
     `rel="noopener noreferrer"`.

The optimistic count logic at `recording-card.tsx:50-69` is untouched and its comment stays: the
counts used to be snapshotted into state at mount, so a re-render handed a fresh Recording kept
showing the numbers the card mounted with. The bar reads the same `viewCount` the figure does, so a
click cannot move one without the other.

Every colour name above is a token ticket 02 defines. Do not add a fourth set: `Tile.dc.html:65-66`,
`Catalogue.dc.html:175-176` and `Specimen.dc.html:102-103` disagree by hundredths on four values —
light `line` 0.14 / 0.13 / 0.13, light `line2` 0.30 / 0.28 / 0.24, dark `accSoft` 0.14 / 0.13 / 0.13,
light `accSoft` 0.10 / 0.09 / 0.09 — and reconciling them is ticket 02's job, once.

### 8. The bar's denominator

`Tile.dc.html:112` divides by a hard 1426 in every variant, including the `filtered` one whose two
Recordings have 558 and 43 views (`Catalogue.dc.html:186-187`) — so the denominator is not the
largest number on screen. 1426 is `Fluid Carousels` (`Catalogue.dc.html:181`), the catalogue's top
view count, and `Detail.dc.html:68` labels the same bar `39% OF TOP ENTRY` (558 / 1426 = 39.1%).

No client holds that number. `getRecordings(search, category, contributor)` filters server-side
(`app/actions/get-recordings.ts:38-62`) and hands the Catalogue page only what survived, and
`CataloguePage` never fetches (`components/catalogue-page.tsx:7-9`). So export a second action beside
it:

```ts
export const getTopViewCount = cache(async (): Promise<number> =>
  Math.max(0, ...(await readRecordingsWithCounts()).map((r) => r.view_count ?? 0))
)
```

`readRecordingsWithCounts` is already `unstable_cache`d for 300 seconds
(`app/actions/get-recordings.ts:23-29`), so this costs no additional Firestore read. Thread it as
`topViewCount` from `app/page.tsx`, `app/products/page.tsx` and `app/bookmarks/page.tsx` — the last
already awaits `getRecordings()` inside an effect (`app/bookmarks/page.tsx:27-44`) and can await both
— through `CataloguePage` and the grid to the card. The width is
`Math.max(4, Math.round((views / topViewCount) * 100))`% with the mock's 4% floor (`Tile.dc.html:112`),
and `topViewCount <= 0` yields the floor rather than a division by zero.

### 9. The call site

At `components/recording-card-grid.tsx:290-298` the map gains its neighbours and two props:

```tsx
{sortedData?.slice(0, shownCount).map((recording, i, shown) => (
  <RecordingCard
    key={recording.id}
    recording={recording}
    repeatsContributor={i > 0 && shown[i - 1].contributor === recording.contributor}
    topViewCount={topViewCount}
    …
```

The key stays the id alone, for the reason at `:286-289`. The grid's own layout — tracks, gaps,
`Load 48 more` — is ticket 08's and is not touched here.

**Add both new props to the memo comparator.** `RecordingCard` is wrapped in `memo` with a custom
comparator that names five fields explicitly (`recording-card.tsx:412-420`); a prop it does not name
can change without re-rendering the card. `topViewCount` moves when the 300-second cache revalidates
and `repeatsContributor` moves whenever a sort or filter reorders the grid, and either one going
stale is a silent wrong render rather than a crash.

The mock's `loading` skeleton (`Tile.dc.html:33-42`) is **not** built. `find app -name loading.tsx`
returns nothing and the Catalogue page is handed its Recordings rather than fetching them, so no route
can currently render a tile in that state and a skeleton would be markup nothing reaches. Ticket 08
owns the grid and the `RESERVING SPACE FOR 48` result line (`Catalogue.dc.html:215`); if it introduces
a boundary that suspends, the skeleton is its to add, using the `skel` token
(`rgba(255,255,255,0.07)` dark / `rgba(16,18,22,0.07)` light) and the six bars at `Tile.dc.html:35-40`.

### 10. The tests the renamed controls break

The accessible names of two controls change, and Playwright locates cards by one of them. Update in
the same commit:

- `page.getByRole("button", { name: /Bookmark$/ })` is the card counter in
  `tests/e2e/filters.spec.ts:13`, `nav-empty-states-layout.spec.ts:13`, `pagination.spec.ts:15` and
  `search.spec.ts:18`. It becomes `{ name: /^Saved?$/ }`, which still names every card and identifies
  none of them — the property `filters.spec.ts:16` chose it for.
- `tests/e2e/keyboard.spec.ts:83` (the same helper), `:87` `link { name: "Source" }` →
  `{ name: "Repo" }`, `:88` `button { name: "Vote" }` → `{ name: /^Vote/ }`, and `:113`/`:122`
  `"Add Bookmark"` / `"Remove Bookmark"` → `"Save"` / `"Saved"`.
- `tests/e2e/remembered-set.spec.ts:45,59` `"Remove Bookmark"` → `"Saved"`, and `:47` `"Unvote"` →
  `/^Unvote/`.
- `tests/e2e/vote.spec.ts:11` `{ name: "Vote", exact: true }` → `{ name: /^Vote/ }`.

Add one case, in `tests/e2e/home.spec.ts` beside the reduced-motion block at `:182-207`: under
`reducedMotion: "reduce"` the first tile's computed `filter` is `none`. That is the assertion that
would have caught shipping a permanently dimmed catalogue to the visitors who asked for less motion,
and nothing else in the suite would.

## Acceptance

- `components/cult/minimal-card.tsx` and `components/badge.tsx` are deleted, and
  `grep -rn "minimal-card\|components/badge" app components` returns nothing.
- A tile renders exactly one link into the Recording (the `<h3>`'s), one `Repo` link, and two buttons.
  `page.getByRole("heading", { level: 3 })` still finds 48 on `/`, and no tile contains a
  `twitter.com`, `linkedin.com` or `github.com/<user>` profile link.
- The media box carries `data-testid="demo"`, `aspect-[9/16]`, a 16px radius, and a computed
  `background-color` of `rgb(5, 6, 10)` in dark and `rgb(8, 10, 14)` in light.
- A playing tile's computed `box-shadow` contains two shadows and interpolates the Recording's hue;
  a resting tile's contains the hairline only. Two tiles with different `hue` values playing at the
  same time have different computed `box-shadow` strings.
- At most five tiles carry the E1 shadow at any moment on a 48-tile page, which follows from
  `MAX_PLAYING` and is checkable by counting elements whose computed `box-shadow` has a non-zero blur.
- The `<video>`'s computed `transition-duration` is `0.16s` and its `transition-timing-function` is
  `linear`.
- Under `reducedMotion: "reduce"`: `page.locator("video")` has count 0, zero `/demo/` requests are
  made, the first tile's computed `filter` is `none`, and its state chip reads `STILLS ONLY`. The
  first three of those are `home.spec.ts:182-207` unchanged.
- With `reducedMotion: "no-preference"` a resting tile's computed `filter` is
  `brightness(0.78) saturate(0.85)` in dark mode and a playing tile's is `none`.
- Aborting `${CDN}/demo/**` still shows `data-testid="demo-error"` on the tile that broke and leaves
  the rest of the grid rendering (`home.spec.ts:161-180` unchanged), and the overlay reads
  `This recording won't play in your browser. The source is still there.` above an `Open repo` link
  whose href is that Recording's `source`.
- `tests/e2e/poster-loading.spec.ts` passes unmodified: fewer than 60 Posters fetched on load, more
  after scrolling to the last tile, `object-fit: cover`, `object-position: 50% 50%`, and the `<img>`
  rect equal to the tile rect.
- `tests/e2e/home.spec.ts:97-119` passes unmodified: 48 tiles, at most five `/demo/` requests near
  the top, more on the way down.
- The Save button has no `aria-label`, its accessible name is `Save` or `Saved`, and it carries
  `aria-pressed` matching the stored set. The vote button's name starts with `Vote` or `Unvote` and
  contains the count.
- Every one of `▲ ◇ ◆ ↗ ◺ ● ❙❙` is inside an `aria-hidden` element, and both chips are `aria-hidden`
  in full.
- `tests/e2e/keyboard.spec.ts` passes with its updated names: the caption link, the `Repo` link, the
  vote button and the save button each draw a ring on `:focus-visible` and none draws one on click.
- `RecordingCard`'s memo comparator names `topViewCount` and `repeatsContributor`.
- A Recording whose `hue` is undefined renders with `--tile-hue: 175` rather than an invalid
  `hsla(undefined, …)`; `getComputedStyle` on its media box returns a parseable `box-shadow`.
- Two adjacent tiles by the same Contributor render the second byline prefixed `↳` and in `t3`; the
  first is unprefixed and in `t2`.
- `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` and the Playwright suite all pass.

## Depends on

**02** supplies every named colour, the two font families, the radius scale (16 media / 12 panel /
9 chip / 6 badge, `Specimen.dc.html:147-148`) and the `cubic-bezier(.2,.8,.2,1)` easing. This ticket
quotes literal hex and rgba so the values are on record, but it must consume the tokens — it renders
48 times, so it is the surface where a duplicated colour becomes a fork rather than a typo. It is
also the ticket that reconciles the three PAL blocks' disagreement on `line`, `line2` and `accSoft`.

**03** supplies `hue`. Without it there is no E1, and `E1 · emission — a playing tile, tinted by its
own recording` (`Specimen.dc.html:152`) is the only reason the elevation scale has three levels
rather than two. `durationMs` and `aspect` are ticket 03's too and this tile reads neither: the media
box is a fixed 9:16 and the `<video>` is `object-contain`, so an off-ratio Demo letterboxes onto the
plinth without needing to be measured first.

**08 and 09 depend on this**, which is why it is numbered before them. The catalogue grid imports the
tile 48 times (`Catalogue.dc.html:93`) and the detail imports the same component at `w=140` for
`MORE FROM THIS CONTRIBUTOR` (`Detail.dc.html:83`) — a tile that assumes 208px breaks the second one.
Ticket 08 also inherits two things left open here: the `loading` skeleton, and whether the grid's
result line needs a count this ticket does not compute.

One coupling the spec's ticket table does not show: this ticket edits
`app/actions/get-recordings.ts`, `app/page.tsx`, `app/products/page.tsx`, `app/bookmarks/page.tsx`
and `components/catalogue-page.tsx` to thread `topViewCount`, because the bar the mock labels
`39% OF TOP ENTRY` needs a number no client-side module can compute. That is a server-shaped change
inside a ticket the table describes as a component.
