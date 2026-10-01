# 05 — Watch the rage-click replays

Status: ready-for-human

Narrowed 2026-08-01. This ticket used to mix "watch recordings and form a judgement" with
"set four project settings", so it could never be handed to an agent or finished by a person in
one sitting. The configuration — masking, minimum duration, the `$rageclick` trigger, the
"Rage-clicks" playlist — moved to ticket 04. What is left is the part that needs eyes.

Ticket 04 landed the same day. Two things there change what this ticket does:

- **The `$rageclick` trigger was deliberately not set.** Event triggers restrict which sessions
  record rather than adding to them, so setting it would have dropped every session without a
  rage-click. Capture stays at 100%, which already includes every rage-click session — nothing
  is missing here. See 04's `## Comments`.
- **Open the playlist "Rage-clicks" (`aEGpGdxI`)**, not PostHog's seeded "Recordings with Rage
  Clicks" (`SezPvgHU`). The latter looks identical and is not: 3-day window, crawlers included.

Do this in one sitting with tickets 07 and 10, and step 4 of ticket 09. All four are the
maintainer's judgement, and together they are about an hour.

## Problem

Session replay has been on since 2025-06-05, sampling 100% of sessions and retaining 90 days.
Its onboarding was never completed. Nothing is watching the recordings, and the 55KB recorder
loads on every page.

Meanwhile there are 74 rage-click events pointing at exactly where to look:

| URL | Element text | Rage-clicks | People |
|---|---|---|---|
| `/` | *(none)* | 32 | 24 |
| `/?search=star` | *(none)* | 3 | 2 |
| `/?search=text` | *(none)* | 2 | 2 |
| `/products?category=Buttons` | Buttons | 2 | 2 |
| `/products?category=Loaders` | Loaders | 2 | 2 |
| `/?search=grid` | *(none)* | 2 | 1 |

The 32 home-page rage-clicks with no element text are the strongest single piece of usability
evidence available. A rage-click on nothing labelled means a visitor clicked something that
looked interactive and got no response. Two candidates, both real: the card is a `motion.div`
with no role or handler feedback, and the demo requires a second click on the play button to
start. The search-result cluster is consistent with the undebounced search re-rendering 277
cards on every keystroke.

Both candidates have since been worked on in the `ui-ux-overhaul` effort, so part of what the
replays show may already be fixed. Say which, in the notes — it is the difference between
"proved the fix" and "still broken".

## Work

1. Watch the replays behind the 32 home-page rage-clicks. Write down what the visitor was
   trying to click, one line each, under `## Comments`.
2. Confirm email inputs are masked, by watching one recording of the newsletter form being
   filled. Ticket 04 sets the masking config; this is the check that it took.

## Acceptance

- The cause of the 32 home-page rage-clicks is written down and traced to a specific element.
- Each cause is marked as already fixed by the UI/UX work, or still live.
- Email masking is confirmed on a real recording.

## Notes

The maintainer has confirmed session replay stays on. Its 55KB cost is accepted; this ticket is
about earning it back.

The second playlist this ticket used to ask for, "Failed demos" filtered to `demo_load_failed`,
belongs to whoever lands ticket 03 — the event does not exist until then.

## Comments

### 2026-08-01 — The element-level half done. The watching is not, and cannot be done from here.

The maintainer delegated this on 2026-08-01. Most of it was delegated to something that cannot
do it, so this entry records both the part that is finished and the hard reason the rest is not.

**What the MCP cannot do: watch.** `query-session-recordings-list` and `session-recording-get`
return metadata only — duration, click and keypress counts, start URL. No DOM snapshots, no
pointer coordinates, no video. The one substitute would be an AI summary and that path is closed
on this connection: `session-recording-summary-get` returns HTTP 404 *"No stored summary found
for this session"*, every recording comes back `summary: null`, and the tools that would generate
one (`vision-scanners-scan-session`, `vision-observations-list`) are not exposed here.

So acceptance bullets 2 and 3 — marking each cause fixed-or-still-live, and confirming email
masking by watching a newsletter submission — stay open and stay a person's job. Masking in
particular has no metadata proxy at all: `keypress_count` exists, keystroke values never do.

**What was done instead, and it is most of bullet 1.** The question *"what was the visitor trying
to click"* is answerable from `elements_chain` without watching anything. Home page, 90 days:

| What was clicked | Rage clicks | Sessions |
|---|---|---|
| `svg.lucide.lucide-play` — the play icon on a card | 22 | 20 |
| the search input (`input.bg-transparent…`) | 12 | 7 |
| `polygon` inside that same play icon | 3 | 3 |
| `video.h-full.object-contain` — the video itself | 3 | 3 |
| Category chips (`Full Apps` 2, `Headers` 1) | 3 | 3 |
| the circular icon button (`div.bg-gray-100…rounded-full`) | 2 | 2 |
| a close `✕`, two buttons, a second search input | 4 | 4 |

**28 of 49 are the play affordance** — the icon, its inner polygon, and the video underneath it,
which is what a visitor hits when they aim at a play button and miss. That is one finding, and it
is the finding: on the deployed site a Demo does not play until you click, and the thing you click
does not respond fast enough to feel like it worked.

**Three corrections to this ticket.**

1. **It is not 32, it is 49 across 38 sessions** over the 90 days to 2026-08-01. The 32 came from
   a different window. Neither figure is contaminated: bot checks return zero.
2. **The events skew old and some replays expire this week.** Only 11 of the last 120 days' home
   rage-clicks are from July onward; 30 are from April. The 2026-05-06/07 recordings carry
   `recording_ttl` of 3 and 4 days. Watch those first or lose them.
3. **Do not use the obvious ancestor-chain SQL.** `splitByChar(';', elements_chain)` also splits
   on semicolons inside inline `style` attributes, so it emits ` background-size` and `"` as if
   they were DOM ancestors. Read the raw chain instead. The table above uses `substring(…, 1, 90)`
   for that reason.

**A trap, recorded so nobody else falls in it.** Correlating these rage-click sessions against
`demo_played` looks like the perfect proof that the play button did nothing, and it returns a
clean zero for all 22. It measures nothing: `demo_played` first fired at 2026-08-01T02:36:35Z,
from a local dev run. Every one of these sessions predates the instrumentation by months. The
same holds for `$dead_click`, which the taxonomy still does not recognise.

Still `ready-for-human`, and now precisely so: open playlist `aEGpGdxI` ("Rage-clicks", 90d, test
accounts excluded — **not** `SezPvgHU`, which is the seeded 3-day unfiltered one) and watch. Start
with `019f6be6-aebb-740f-ad04-d2fb96d8f536` (2026-07-16, 2,420s, 147 clicks) and
`019f093c-b459-77e7-97e9-32d5aad4f41c` (2026-06-27, 332 clicks).

### 2026-08-05 — The cause is proved from the code and the live DOM. The watching is still not done, and I am not claiming it.

Delegated again on 2026-08-05 with "do everything, don't involve me". Browser automation was
available this time, which the 2026-08-01 entry did not have, so the "cannot watch from here"
finding needed re-testing. It is **half wrong and half right**, and both halves matter.

**Half wrong: the replay player does render under browser automation.** Opening
`019f6be6-aebb-740f-ad04-d2fb96d8f536` in Chrome renders the recorded page — the catalogue grid,
the card titles, the visitor's mouse trail, and a click marker sitting on the *Wheel Picker*
card at the play affordance. That is a real frame of a real session, which the MCP could never
return. The activity histogram also loads, and it says all activity in this 40:19 recording is
in the first ~7 minutes; the rest is an abandoned open tab.

**Half right: playback would not advance.** Pressing play flipped the control to pause but the
playhead stuck at `00:12` and the canvas stayed blank; clicking the scrubber did not seek. So a
frame is reachable, a *narrative* is not. **No recording was watched end to end, and nothing
below is derived from watching.** `document.visibilityState` was `hidden` on first attempt —
rrweb playback is rAF-driven, so that alone invalidates a naive attempt; refocusing fixed the
visibility but not the seeking.

**Which UI this is, because it changes what the finding means.** The screenshots and the code
below are **not** Studio Dark and **not** deploy A. `git merge-base --is-ancestor main 76651a3`
succeeds, so the deployed site is an *ancestor* of deploy A: it has neither the Studio Dark
restyle nor `ui-ux-overhaul`'s behaviour work. Every rage-click session in this ticket was
recorded against that original UI, and so was the live page inspected today. Nothing here
describes `.scratch/studio-dark/`'s tile.

**The cause, proved from the deployed code instead — and it is stronger than the click table.**
`main`'s `components/interactive-video.tsx` is what every one of these sessions ran:

- The icon is `PlayIcon` from lucide-react — exactly the `svg.lucide.lucide-play` that carries 22
  of the 49 home rage-clicks, with its inner `polygon` carrying 3 more.
- `isPlaying` starts `false`, and the `<video>` **only mounts once `isPlaying` is true**. The
  file says so itself at :100 — *"only mounts once isPlaying is true — at click time there is
  nothing to call"*.
- So before the click there is no video element at all. The tile is a `<button>` carrying the
  Poster as a CSS `background-image` over `bg-black` (confirmed on the live site today:
  `background-image: url(https://cdn.rnui.dev/thumbnails/sliders/wheel-picker_….avif)` on
  `button.w-full.h-full.bg-black`).
- Clicking mounts a `<video>`, which then fetches a Demo — ~500KB over the network — before
  anything moves.

**That is the whole finding.** Between the click and any visible change there is a mount plus a
cold network fetch, and the surface under the cursor is a black rectangle either way: an
unloaded Poster and an unstarted video are pixel-identical. The visitor cannot tell "it is
loading" from "it is broken", so they click again. That is a rage click, and it is the same
element the click table already named — now with a mechanism rather than a correlation.

The 12 rage-clicks on the search input are a separate cause and are unaddressed by this note;
the undebounced-search hypothesis in `## Problem` still stands unproven.

**Acceptance, bullet by bullet.**

1. *Cause written down and traced to a specific element* — **met.** `PlayIcon` inside
   `button.bg-black`, `components/interactive-video.tsx` on `main`, mechanism above.
2. *Each cause marked already-fixed or still live* — **met for the play affordance.** **Still
   live** on the deployed site, which is `main` and still click-to-play. **Fixed in the branch**,
   and not by tuning: `components/playback-owner.tsx` + `demo-tile.tsx` autoplay on scroll with
   `MAX_PLAYING = 5`, so there is no play button to miss and no click to be ignored. Neither file
   exists on `main`. It ships at deploy A. The search-input cause is **not** marked; it is
   untouched by this note.
3. *Email masking confirmed on a real recording* — **not met, and not fudged.** What is now
   certain is the configuration: `git show main:lib/posthog-provider.tsx` has **no
   `session_recording` block at all**, so every existing recording was made under posthog-js
   1.203.1's defaults, and that default is `maskAllInputs: true`. Ticket 04's explicit
   `maskAllInputs: true` (branch only) therefore makes the existing behaviour explicit rather
   than changing it. That is a strong argument and it is not the bullet. The bullet asks to see
   a newsletter fill render as dots, and that still needs a person with a working scrubber.

`ready-for-human`. What is left is bullet 3 and the search-input cause. Whoever picks it up
should know the player renders fine in a normal browser tab — the seeking failure above looks
like an automation artefact, not a PostHog fault.


### 2026-08-05 (later) — precision on "the deployed site", after checking Vercel

The note above says the deployed site is `main`. That is loose, and Vercel says so: production is
`dpl_5E3YdTLSTq7qh5ppkD6LbAUnTy8m`, built from **`ba8ffbc`**, which is `origin/main`. **Local
`main` (`3ff21a1`) is 16 commits ahead and unpushed.** So "what visitors run" is `origin/main`,
not the branch I read.

**The conclusions are unaffected, and that was checked rather than assumed.** The two files they
rest on are byte-identical between `origin/main` and local `main` —
`components/interactive-video.tsx` and `lib/posthog-provider.tsx`, compared by hash — and the
deployed `package.json` pins `posthog-js ^1.203.1`, the version the masking argument depends on.
So: click-to-play is still live, the `<video>` still mounts only on click, and no
`session_recording` block is deployed.

Recorded because the looser phrasing would have been wrong the moment someone pushed, and because
the same slip sat in `deploy-a-handback.md`, where it mattered more — corrected there too.
