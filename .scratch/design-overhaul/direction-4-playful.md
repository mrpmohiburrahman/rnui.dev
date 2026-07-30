You are designing a complete visual and structural overhaul of rnui.dev, a catalogue of
React Native UI components where every component is shown as a short screen recording of
a real phone. Do not ask me questions. Make every decision yourself, commit to it, and
produce the full set of deliverables in one pass.

## ACTIVE DIRECTION

Direction 4 — Playful.

## THE PRODUCT IN SIX LINES

- 277 short screen recordings of React Native UI components, contributed by 24 developers.
- Every recording is a portrait phone capture, 9:16, silent, 2–6 seconds, loops cleanly.
- Visitors are React Native developers looking for "how do I build a slider like that".
- Every entry links out to the contributor's GitHub repo — that outbound click is the goal.
- The recordings are the product. The interface exists to get out of their way.
- It is an open-source community catalogue. Contributors are credited, not hidden.

## USE THIS REAL DATA — NO PLACEHOLDER TEXT ANYWHERE

18 categories, exactly these names:
Accordions · Arc Sliders · Bottom Sheets · Buttons · Carousels · Charts ·
Circular Progress Bars · Drop Down · Full Apps · Headers · List · Loaders · Misc ·
Onboarding · Parallaxes · Pickers · Sliders · Tab bars

Category sizes are wildly uneven. These are the real counts and they sum to 277 — use
them, do not invent your own:

Misc 148 · Buttons 20 · Tab bars 19 · List 17 · Sliders 17 · Carousels 10 · Charts 9 ·
Bottom Sheets 6 · Onboarding 6 · Full Apps 5 · Loaders 4 · Parallaxes 4 · Headers 3 ·
Circular Progress Bars 3 · Accordions 2 · Arc Sliders 2 · Drop Down 1 · Pickers 1

Your design must not look broken when a category returns a single card, and it must not
look broken when one category holds more than half the catalogue.

Real entries — use these exact strings, categories and numbers in every mockup:

| Component name | Contributor | Category | Views | Votes |
|---|---|---|---|---|
| Fluid Carousels | William Candillon | Carousels | 1,426 | 0 |
| Morphing Loader | Daniel Friyia | Loaders | 1,385 | 3 |
| Onboarding by Thomino | Thomino | Onboarding | 1,272 | 2 |
| Bottom Bar | Thomino | Tab bars | 1,252 | 2 |
| Parallax Carousel | Arunabh Verma | Parallaxes | 1,132 | 3 |
| Wheel Picker | Enzo Manuel Mangano ( Reactiive ) | Sliders | 1,079 | 0 |
| Airbnb's Search component | Konstantinos Efkarpidis | Misc | 476 | 4 |
| Ripple Effect With React Native Skia | Daehyeon Mun (문대현) | Misc | 316 | 4 |
| Threads Holo Ticket | Enzo Manuel Mangano ( Reactiive ) | Misc | 558 | 3 |
| Bezier Curve Outline | Enzo Manuel Mangano ( Reactiive ) | Misc | 43 | 0 |

Contributor entry counts, real: Enzo Manuel Mangano ( Reactiive ) 124 · Hewad Mubariz 31 ·
Daniel Friyia 19 · Arunabh Verma 16 · Konstantinos Efkarpidis 11 · William Candillon 10 ·
Kacper Kapuściak 8 · Alireza Hadjar 8, then a long tail down to 1. Note that Misc holding
148 entries and one contributor holding 124 are separate facts about different things —
do not conflate them in any copy.

Four facts about this data that your layout must survive:

1. Contributor names run to 33 characters, contain internal spaces inside parentheses, and
   include non-Latin script — the literal strings are "Enzo Manuel Mangano ( Reactiive )",
   "Daehyeon Mun (문대현)", "Kacper Kapuściak". Never design a name slot that only fits
   "Alex Kim". Show what the longest one actually does — and if it truncates, the truncation
   must not destroy the disambiguating part of the name.
2. Component names run 5–36 characters; the longest is "Spread Cards Effect ( Color Swatch )".
   Never design a title slot that only fits two words. Reserve two lines everywhere a title
   appears, including in the loading skeleton.
3. 124 of 277 entries are by one contributor, so in date order 68% of adjacent card pairs
   share a contributor. A wall of cards will repeat the same name over and over. Handle
   that — but any "same as above" marker you invent will fire on most of the grid, so it
   must be designed for the common case, not as a rare annotation.
4. Vote counts are almost all 0–4 while view counts are 43–1,426. Two metrics with
   wildly different magnitudes sitting next to each other. Make that not look silly. If you
   draw a bar for views, its track must be a fixed width independent of the label beside it,
   must clip its fill, and must be comparable across tiles — otherwise it is decoration.

## WHAT EVERY VARIANT MUST CONTAIN — IDENTICAL ACROSS ALL 5 RUNS

Three screens exist:

**A. Catalogue** — the grid of entries. This is the home page and also the result of any
filter, search, or sort. One screen serves all three.

**B. Entry detail** — one entry, large. Must work in two forms from one composition:
as a standalone page someone opened from a shared link, and as an overlay on top of the
catalogue. Show both.

**C. Saved** — entries the visitor saved. Same grid, different heading.

Every card must show: the recording, the component name, the category, the contributor,
the view count, the vote control with its count, a save control, and a link to the source
repo. A "New" tag appears on entries added in the most recent batch.

Every catalogue view must offer: filter by category, filter by contributor, free-text
search, and sort by Recent / Most viewed / Most voted. Two filters plus a search term must
be able to be active at the same time, and the interface must make all active filters
visible and individually removable.

Every variant must design these states, not just the happy path:

- Loading — the shape of the page before content arrives. Must reserve the exact space the
  content will take, so nothing jumps when it lands.
- Zero results — a search or filter combination that matches nothing, with a way out.
- Empty Saved — a visitor who has saved nothing yet.
- A single recording that failed to play — some recordings genuinely fail to decode in
  some browsers. This is required UI, not an edge case. Design the tile's failed state and
  a way to reach the source repo anyway.
- End of the catalogue — the "Load more" affordance, and what the last page looks like.

## WHAT IS FREE — DIFFERENT IN EVERY RUN

The direction below is fixed. Every concrete choice that serves it is yours to make and
yours to commit to — the exact hex values, the exact typeface names, the exact arrangement
of the page. Choose them to push the direction further, not to soften it or substitute
something else for it:

- Layout. Sidebar, horizontal chip row, command palette, tabs, something else. Grid,
  masonry, staggered shelf, single-column feed. Your call.
- Whether there is a hero at all, and what it says if there is one.
- Palette, including whether the interface has any colour at all.
- Typefaces, type scale, weights.
- Corner radius, borders, elevation, texture, grain, gradients.
- Motion character — what animates, how fast, how it eases.
- Density. How many cards fit a 1440px-wide screen.
- Where the metrics, the contributor, and the source link sit on a card.

Commit hard to this direction. A cautious version of an art direction is worse than none,
and a cautious version of this one is the easiest of all five to produce by accident.

## HARD CONSTRAINTS — BREAKING ANY OF THESE MAKES THE DESIGN UNBUILDABLE

1. **Recordings are 9:16 portrait and cannot be recropped.** The media slot must be
   portrait. Any layout that wants landscape or square tiles is wrong. Portrait tiles at
   readable size are the reason this site is hard to lay out — solve that, don't dodge it.
2. **Playback: the still frame loads first; the video starts muted and looping only when
   the tile is on screen; at most 5 tiles play at once.** Design what a paused-and-waiting
   tile looks like versus a playing tile, and how the eye is not overwhelmed by 5
   simultaneous animations. There is no sound, ever — no volume control.
3. **48 cards, then a "Load more" control.** Not infinite scroll. The page has a bottom and
   a footer that people reach.
4. **Saved items and votes live only in this browser, on this device.** No accounts, no
   sign-in, no sync. Any copy about saving must say so honestly rather than implying an
   account exists.
5. **There is no code snippet to show.** Nothing on this site can display "npm install" or
   a copyable component source. The only thing an entry links to is a GitHub repo. Do not
   design a preview/code tab pair — that is the wrong pattern for this product.
6. **Contributor credit is required on the card and on the detail view,** with links to
   their X, LinkedIn, and GitHub where present. Some entries have only one of the three.
7. **Category names are fixed** — they are live URLs. Rename nothing in that list.
8. **Every interactive thing must be drawn as a real control.** The search field is an
   `<input>`, sort is a real segmented control of buttons, every filter is a button or a
   link — not a styled `<div>` or `<span>`. If it can be clicked it must be focusable, and
   you must show its focus state. A design made of divs cannot satisfy the keyboard
   requirements below, no matter what the annotations claim.
9. **Mobile is not a reduced edition.** Whatever the desktop can filter by, the mobile can
   filter by: all 18 categories and all 24 contributors must be reachable on a phone, which
   means the filter surface scrolls. Every active filter — including the search term — is
   individually removable on mobile too. The mobile detail screen has a visible way out.
10. **Your annotations must match what you drew.** Do not describe behaviour the mockup does
   not show. If a caption says "every control is at least 44px" or "the name wraps rather
   than truncating", that must be true of the actual boxes. An implementer will build from
   the drawing, so a caption that overstates it produces the wrong site.

## ACCESSIBILITY — NOT OPTIONAL, AND THE CURRENT SITE FAILS ALL OF IT

The site being replaced scores 91 on accessibility with these specific failures. Your
design must not repeat them:

- Body text and every link must clear 4.5:1 contrast against its own background, in BOTH
  modes. The current site's source links fail on all 277 cards.
- Every card must be reachable and openable with the keyboard alone. Show the focus state
  explicitly — a visible, high-contrast focus indicator on cards, the save control, the
  vote control, filters, and the search field. The current site has none.
- The overlay must show where focus goes when it opens and how Escape closes it.
- The save and vote controls must be visible without hovering. The current site hides the
  save button until mouse-over, so it does not exist on a phone.
- The focus indicator must be visible against the thing it sits on. A ring in your accent
  colour around a button already filled with that accent colour is invisible — check the
  ring against filled buttons, not just against the page background.
- Give every control a distinct accessible name. "Open entry" repeated on 277 cards, or
  "Remove" on every filter chip, is not usable. State must never be signalled by colour
  alone — an active filter needs a glyph, a weight change, or a label as well.
- No text below 12px anywhere, including labels sitting over the recording. Small
  low-opacity white text over a mid-tone still frame is the most likely contrast failure in
  a dark design — compute it, don't assume it.
- Minimum 44×44 touch targets on mobile, 24×24 on desktop, including the ✕ on filter chips.
  If the card is reused at a smaller width on a phone, its controls must scale with it
  rather than shrinking below the minimum.
- Design a reduced-motion version: what the catalogue looks like when the visitor's system
  asks for no animation. Recordings become still frames. It must differ visibly from the
  ordinary paused state — if the only change is a label, you have not designed it. Anything
  that dims or de-emphasises a paused tile must be dropped here, because in this mode
  nothing is playing and nothing should look secondary.

## PERFORMANCE — THE NUMBERS YOUR DESIGN IS BEING JUDGED AGAINST

The current site, measured: 4.5 MB per page load, 7.7 seconds before the page looks
finished on a phone, 232 images fetched before first paint, 11,349 elements in the page,
0.511 layout shift on desktop.

Design so that the first screen needs roughly 15 still frames and no video. That means:
whatever sits above the fold must be cheap, nothing may resize itself after loading, and
any text whose value arrives late — "Updated 13 hours ago", "277 items" — must occupy
reserved space from the start. Show me you have thought about what the first 800ms
looks like.

## DELIVERABLES FOR THIS RUN, IN THIS ORDER

Produce every one of these in BOTH LIGHT MODE AND DARK MODE. Both modes are required for
every screen — not a token swap shown once, but the actual designed light version and the
actual designed dark version, side by side, for each screen below. If a decision only works
in one mode, change the decision.

1. Catalogue, desktop 1440px — light and dark.
2. Catalogue, mobile 390px — light and dark. Show how filters are reached on a phone; the
   current site's filters become unreachable after 10px of scroll, which is the single
   worst bug in it.
3. Catalogue with two filters and a search term active — light and dark.
4. Entry detail as a standalone page, desktop — light and dark.
5. Entry detail as an overlay over the catalogue, desktop — light and dark.
6. Entry detail, mobile — light and dark.
7. The five states: loading, zero results, empty Saved, failed recording, end of catalogue
   — light and dark.
8. A one-page specimen sheet: the palette with values, the type scale with sizes and
   weights, corner radii, elevation levels, spacing rhythm, and motion timings. Both modes.
9. Six sentences naming what this direction is, what it optimises for, and what it
   deliberately sacrifices.

## THE DIRECTION — PLAYFUL, IN FULL

**The core idea, in one sentence.** A catalogue built like a box of well-made toys: big
soft-cornered tiles in loud flat colour that answer the pointer with a spring, arranged so
that the only thing looping on the page is somebody else's work.

**Typographic character.** A geometric sans with rounded terminals and a high x-height,
the kind of face whose letters look inflated rather than drawn, available at 800 or heavier
for display and used at 500 or 600 for everything else. Never 400 — a 400 weight reads as
apologetic in this direction and drains it. The scale is two clusters with a hole in the
middle: a small cluster at 13px for labels, 15px for body, 17px for card titles, and a big
cluster at 40px for section headings and 72px for the page title. Nothing lives between 17
and 40, and the emptiness of that gap is the point — a 24px heading would fill it in and
turn the page ordinary. Display type is tracked tight, around minus 2.5%, so a big word
reads as one solid shape; 13px uppercase labels get roughly plus 6%; body sits at zero. All
figures are tabular so 1,426 and 43 align inside their pills. Type leads once, at the top:
the page title is larger than any single tile and is the first thing the eye lands on.
Below that line, image leads and type serves — no caption in the grid ever competes with a
recording.

**Colour behaviour.** Loud, and rationed by rule. One accent at full chroma, one warm
secondary for support, and a neutral family that is never truly grey — every neutral is
tinted toward the accent's warmth so the page never reads as a default. The accent is
allowed on primary fills such as Load more and the active sort segment, on active filter
chips, on the frame of a playing tile, on the vote control once the visitor has voted, on
focus rings, and on exactly one large flat block per screen. It is not allowed inside the
media slot, on body text, or across more than roughly a quarter of any screen's area. Light
mode means daylight in a room with painted walls: a warm tinted off-white canvas, cards a
shade lighter than the canvas so they read as objects laid on it, accent at full strength.
Because the media is always a bright phone recording, in light mode the recording is not
the brightest thing on the page and does not need protecting — what it needs is separation,
so every media slot sits on a neutral mat two steps darker than the card, bounded by a
hairline, so a white app screen inside a recording cannot bleed into a white card. Dark
mode means the same painted room with the lights down — a deep saturated ink that keeps a
hue, never a neutral near-black, because a neutral black turns this direction into a
different one. In dark mode the recording is by a wide margin the brightest object on the
page, so the accent steps back: same hue, chroma pulled down far enough that a bright
recording beside it does not make it look muddy, and every text-on-accent pair recomputed
for that adjusted value rather than carried over from light. The mat under the media
inverts too — lighter than the card, not darker — so a recording of a dark app still has an
edge.

**Surface language.** Fills and edges, not blur. Every card is an opaque fill with a 1px
edge one step darker and a single solid offset shadow: 4px right, 4px down, zero blur, a
flat tinted colour, the way a sticker sits on paper or a screenprint's second pass sits off
its first. There is no soft ambient elevation anywhere; exactly one blurred shadow exists
in the whole system and it belongs to the detail overlay, which is the only thing allowed
to float. Radius is the signature and it must be concentric: 28px on the card, 20px on the
media slot inside it, 999px on every control that is not a card. A tight-radius rectangle
sitting inside a 28px card fails the whole direction on its own. Surfaces sit flat — one
layer, no nested panels, no card inside a card. Texture, if used at all, is a faint paper
grain on the canvas only, never on a card and never over media.

**Density and rhythm.** Four portrait tiles across a 1440px screen, generous gutters and
generous page margins, which puts about two and a half rows above the fold. That is
oversized on purpose. The column count is strictly regular and the rows are strictly
aligned — no masonry, no staggered shelf — because the loading skeleton has to reserve the
exact space the content will take and a stagger makes that promise impossible to keep. The
irregularity comes from inside the tiles instead: at fixed, seeded positions a tile takes
the accent as its card fill rather than the neutral, so the wall has a deliberate rhythm of
loud cards without any tile changing size, and no row ever carries more than one of them. A
single-card category takes the accent fill, sits alone in the first column at full size,
and keeps the row's air intact — one big confident object rather than a stranded fragment.
The 148-entry category is the same grid; it earns nothing extra.

**Motion character.** Every interface movement is a spring, and every one of them ends.
Card lift on pointer: up 6px, scale to 1.02, offset shadow growing from 4px to 8px, a
spring settling near 320ms with less than 4% overshoot. Press: scale 0.97 and the shadow
collapsing to zero offset in about 90ms, so the card physically bottoms out under the
finger. Filter chips arrive with a 180ms spring from 0.9 scale and leave in 120ms without
one. A vote count rolls its digit. The sort control's accent pill slides between segments
in about 240ms. Nothing fades over more than 200ms, nothing eases linearly, and no curve in
the system is symmetrical. What deliberately does not move: the page has no ambient motion
of any kind — no drifting gradient, no marquee, no auto-advancing anything, no scroll
parallax, nothing in the chrome loops. Interface motion is only ever a response to a
pointer, a key or a click, and it always finishes inside 400ms.

**Motion versus the recordings — the part that makes this direction hard.** Every tile
already contains someone else's animation, so the springiness has to yield to the content
by rule rather than by taste. Four rules do it. First, the media slot itself never
animates: the card frame lifts, scales and presses, but the video inside is never scaled,
never translated, never cross-faded — on lift the frame grows and the media holds its exact
rendered size, with the growth absorbed by the card's padding. Second, a tile that is
playing goes inert to the pointer: lift and press belong to still tiles only, and once a
recording is running the tile stops being springy and only its frame colour and its
controls still respond. Third, playing is marked by an addition and never by a subtraction
— a playing tile gains a 2px accent frame and a small filled accent dot with a word beside
it, while paused tiles are not dimmed, desaturated or blurred but sit at full opacity
showing a crisp still frame, because a still frame is a legible thing to look at and not a
placeholder. Fourth, five recordings at once must not read as a slot machine: the five that
play are the five nearest the vertical centre of the viewport, they start about 120ms apart
rather than together, and they are the only accent-framed objects in that band, with the
seeded accent card fills placed so loud cards and playing frames never pile up in the same
region. Everything outside that centre band is still, and since nothing else on the page
moves on its own, those five recordings are the only motion in view.

**Reduced motion is a second design, not a footnote.** Strip every spring and this
direction has to stand on colour, size, radius and weight alone — and it does, because the
springs were the reward, not the structure. What survives: the oversized four-across tiles,
the loud accent, the flat offset sticker shadow, the concentric radii, the pill controls,
the 17-to-40 type jump. What visibly changes: no tile plays, so the playing marker does not
exist in this mode at all, and the accent frame it used is reassigned to whatever the
keyboard is currently on — the page's one loud frame becomes a navigation aid instead of a
playback state. Every card carries identical frame weight and nothing is secondary, because
nothing is playing. Hover feedback becomes instant and un-interpolated: the offset shadow
jumps from 4px to 8px with no transition, press swaps to an inset fill, and the 6px lift is
dropped altogether rather than made instant, because an instant jump in position is worse
than none. Each tile gains a real button that plays that one recording on demand, and the
header carries a persistent strip stating that motion is off, with a control to re-enable
playback for the session. Someone comparing the two catalogue screens should see the same
design doing a different job, not a broken copy of the first.

**Reference points, described rather than named.** The injection-moulded confidence of good
children's construction toys: thick walls, generous fillets, a small fixed set of colours
used at full strength with no apology. A two-ink risograph poster: flat areas of loud
colour, a visible offset between passes, no gradient pretending to be light. The mechanical
feel of a well-built arcade button: short travel, firm bottom-out, an unmistakable moment
when it is down. And the way a sheet of stickers sits on a page — separate opaque objects
with their own edges, laid on the surface rather than embedded in it.

**What this deliberately sacrifices.** Seriousness: nobody will mistake this for an
enterprise tool, and a visitor who wanted a sober reference will find it noisy. Density:
four across at this size shows fewer entries per screen than any other approach here, and
chunky metric pills occupy space that small type would not. Precision of comparison: a view
bar drawn in this language reads as a toy gauge before it reads as data, so it has to be
strict about fixed track width and clipped fill to stay honest at all. And neutrality: a
strong accent is an opinion imposed on 277 pieces of other people's work, which is exactly
why it stays off the media and out of the body text.

**What a failed, watered-down version looks like.** A light grey card at a timid radius
with a soft blurred shadow, a mid-blue accent used only on one button, hover that fades
opacity from 100 to 90 over 150ms, narrow tiles six across, pastel tints instead of full
chroma, and 400-weight body text — a framework default with rounded corners. Also failed:
springs applied to the video element itself, playing tiles distinguished by dimming their
neighbours, ambient motion anywhere in the chrome, inner and outer radii that do not agree,
and a reduced-motion screen that is the ordinary screen with the word "paused" added.

## BEFORE YOU FINISH, CHECK YOURSELF

- Are all 9 deliverables present, each in both light and dark?
- Does a single card in a one-entry category look intentional?
- Does "Enzo Manuel Mangano ( Reactiive )" fit at its real 33 characters, or did you
  silently design for short names? If it truncates, is the truncated form still unambiguous?
- Can I tell which filters are active, and remove any one of them, on desktop AND on mobile?
- Are all 18 categories and all 24 contributors reachable on the phone?
- Does the mobile detail screen have a visible way out?
- Is every recording slot 9:16 portrait?
- Is every clickable thing a real control with a visible focus state, or did you draw divs?
- Is any text under 12px, or any control under 44px on mobile?
- Is the focus ring visible on your accent-filled buttons, not just on the background?
- Is there any code snippet, install command, or preview/code tab anywhere? Remove it.
- Did you design the failed-recording tile, or skip it?
- Does the reduced-motion screen differ from the paused screen by more than a label?
- Do the numbers in your mock agree with each other? If you show a filtered result count,
  recount it by hand against the entries you drew. If you show a last page, check the
  partial row against 277.
- Does every caption you wrote describe something actually visible in the drawing?
- Would the first screen need more than ~15 images to paint?
- Does the media slot itself move anywhere — on hover, on lift, on press, on arrival? Only
  the card frame around it is allowed to move.
- Are the radii concentric on every nested pair — card, media slot, controls — or is there
  a tight-radius rectangle sitting inside a soft card?
- Is a paused tile drawn at full opacity with a crisp still frame, and is playing marked by
  something added rather than by taking something away from every other tile?
- With five tiles playing, count the moving objects in one 1440px viewport: is anything
  other than those five recordings in motion?
- Is the accent anywhere it was forbidden — inside the media slot, on body text, or over
  more than about a quarter of the screen — and does the dark-mode accent still hold its
  contrast sitting next to a bright recording?
- Is the reduced-motion catalogue a second design or a disabled one? If removing the
  springs left the page looking generic, the direction was never in the layout.
