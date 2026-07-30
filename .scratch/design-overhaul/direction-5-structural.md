You are designing a complete visual and structural overhaul of rnui.dev, a catalogue of
React Native UI components where every component is shown as a short screen recording of
a real phone. Do not ask me questions. Make every decision yourself, commit to it, and
produce the full set of deliverables in one pass.

## ACTIVE DIRECTION

Direction 5 — Structural.

This is the direction. Nothing below is a menu and nothing below is optional. The full
definition is the section headed THE DIRECTION — STRUCTURAL, and every screen you produce
answers to it.

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

The concrete choices are yours: the exact hex values, the exact typeface names, the exact
arrangement of the layout. Choose them so they serve the direction stated below — these are
the knobs of Structural, not a licence to replace it:

- Layout. Sidebar, horizontal chip row, command palette, tabs, something else. Grid,
  masonry, staggered shelf, single-column feed. Your call.
- Whether there is a hero at all, and what it says if there is one.
- Palette, including whether the interface has any colour at all.
- Typefaces, type scale, weights.
- Corner radius, borders, elevation, texture, grain, gradients.
- Motion character — what animates, how fast, how it eases.
- Density. How many cards fit a 1440px-wide screen.
- Where the metrics, the contributor, and the source link sit on a card.

Commit hard to Structural. A cautious version of an art direction is worse than none, and
the cautious version of this one — a softened corner, a shadow smuggled back in as a
"subtle" border, a grid declared on the specimen sheet but not visible on any screen — is
exactly the failure to avoid.

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

## THE DIRECTION — STRUCTURAL

The core idea, in one sentence: the grid is drawn rather than implied, and that visible
structure is the only ornament the page gets — hard edges, hairline rules, tabular numbers,
no shadows, no gradients, no radius, everything landing on a scale you declare out loud and
then obey on every screen.

Because the structure is the ornament, the structure must be stated, not felt. Declare and
then draw a 12-column grid: at 1440px, 48px outer margins, 24px gutters, 90px columns. A
portrait tile spans two columns, so its media is 204px wide and 363px tall at 9:16, and six
tiles sit across a row. Space is an 8px base with a 4px sub-unit for optical corrections
only; every vertical measure on the page is a multiple of 8. Rule weights come in exactly
two: a 1px hairline, which is the structure, and a 2px rule, which is the only emphasis the
system has. There is no third weight and no dashed rule anywhere except one licensed use —
1px dashed marks space that is reserved but not yet filled, which means the loading skeleton
and the empty Saved outline and nothing else. Lines start and stop on purpose: rules that
describe the page bleed the full width edge to edge, under the masthead, above the footer,
between major bands; rules that describe content are column-bound, starting exactly on the
left edge of a column and stopping exactly on the right edge of a column, never overhanging
by a pixel. Vertical rules run the full height of a tile block and stop on the baseline of
its last metadata line, not at the page bottom. The left margin carries the row index and
the row's date band, set small and uppercase, like the row numbers on a specification sheet
— that margin column is what makes the grid legible as a grid rather than as a coincidence.

The portrait tile is not a card. It is a cell in the ruled matrix, and it has no border of
its own beyond the rules it shares with its neighbours. Inside the cell, media is top-
aligned and fills the full two-column width. Below it, a metadata block of fixed height —
96px, twelve units — holds two reserved title lines, the contributor on one line, then a
single row of category, views and votes. That height is set by the worst case, a two-line
title plus "Enzo Manuel Mangano ( Reactiive )" at its real 33 characters, so short entries
leave visible empty space at the bottom of the block. That emptiness is the alignment. Do
not vertically centre anything to close it up, because the whole point is that every row
rule runs dead straight across all six cells.

Typographically this direction runs two voices and no more. A neutral grotesque with flat
terminals and a slightly condensed feel — the kind of face cut for signage and timetables —
carries titles and interface text. A monospace carries every number, every count, every
status token and every category label, always with tabular figures, so 1,426 and 43 occupy
the same column width and the metrics stack into a readable column down the grid. The scale
is 12 / 13 / 16 / 20 / 26 / 34 / 44 / 58, and the important thing is where it jumps: 12 and
13 are the label voice, 16 and 20 are the reading voice, and then it leaps straight to 44
for the masthead with nothing in between ever used on a screen. Two voices, one jump; the
absence of middle sizes is what makes the hierarchy read instantly. Weights are 400, 500 and
700, never 300 and never 800. Tracking tightens to about -2% at 34px and above, sits at 0
for reading sizes, and opens to +7% on the 12–13px uppercase labels so a label can never be
mistaken for content. Type leads at the top of the page — the masthead is a typographic
statement of counts, not an image — and image leads inside the grid, where the recording is
always the largest object in its cell.

Colour is almost absent and rationed on purpose. One ink, one paper, one accent, and the
accent appears in exactly three places on the entire site: the 2px rule that marks something
active, the focus indicator, and the loop progress rule under a playing tile. Nothing else
is ever coloured. Fills exist in one form only — a solid ink rectangle with paper-coloured
text, used for the selected sort segment and for active filter chips — which is what keeps
the focus indicator solvable: it is a 2px accent ring offset 2px outside the element with a
1px paper gap, so it survives on top of an ink-filled button as readily as on the page.
Light mode is a drafting sheet: paper that is a shade off pure white and very slightly
warm-neutral, deliberately darker than the brightest pixels of a phone recording, so 24
bright portrait rectangles per screen read as lit objects sitting on a printed page and the
1px rule around each one does the separating work a shadow would otherwise do. Dark mode is
not a mood and not a token inversion; it is the same drawing on a light table, graphite
ground with mid-grey hairlines rather than white ones, because 277 pure-white hairlines on
near-black vibrate and turn the grid into noise. The recordings are shown at full brightness
in both modes and never dimmed to protect the layout; in dark mode the countermeasure for
that blaze is that the rules step up in contrast and the ink text goes to full strength, so
structure still wins the eye. No tile in dark mode is ever lighter than the page it sits on.

The surface language is one plane. Nothing stacks, nothing lifts, radius is 0 on every
element including the search field, the New tag, the buttons and the media mask, and there is
no device bezel or phone mockup frame around the recordings — the raw 9:16 frame sits flush
inside its cell. Distinction is carried entirely by rules, spacing and weight, so each state
is assigned its own physical location on the cell and its own mechanism, and the four can
therefore co-occur on one tile without ambiguity. Active, for filters and sort, is the ink
fill with inverted text plus a 2px accent rule along its bottom edge plus a leading filled-
square glyph, so it is never colour alone. Playing is the cell's left vertical rule
thickening from 1px to 2px for the full height of the media, plus a 1px accent progress rule
directly under the media that sweeps left to right once per loop and resets; a paused tile
has neither. Focused is all four of the cell's rules going to 2px accent — the cell promotes
its own frame — and simultaneously the tick for that column lighting up in the ruler at the
top of the grid, so keyboard position is legible from anywhere on the page. Saved is a solid
12px ink square notched into the top-right corner where the two rules meet, scannable across
the whole grid without reading a word, backed by the save control's fixed-width monospace
label switching from an empty bracket to a filled one. Status tokens are monospaced and
occupy the same cells whichever state they show, so nothing on the page reflows when state
changes. Texture: none. One licensed exception, the grid substrate itself, allowed to show as
faint 1px ruling in the margins and inside reserved space. No grain, no noise, no glow, no
blur, no glass. The overlay declares itself the same way everything else does — a rectangle
snapped to columns 3 through 10, a 2px ink rule on all four sides, and a flat high-opacity
scrim over the catalogue behind it, a fill and not a blur, because a blur is a gradient by
another name.

Density is high and the rhythm is strictly regular. Six tiles across at 1440px, 24px
gutters, and rows separated not by a gap but by the rule itself with 16px of air above and
below it. At 390px it is two tiles across with 16px margins and a 12px gutter, the same
system at a smaller module, not a different design. The grid is regular everywhere and the
irregularity budget is spent in exactly one place: the most recent batch occupies its own
single labelled row at the top, bounded by full-bleed rules and named in the left margin.
Misc at 148 gets no special treatment and a category of 1 gets none either — a single cell
sitting in a row of five empty modules with the row rule still running full width reads as
inventory, correctly stated, rather than as a broken page.

Motion is minimal and switch-like. Rules never move; tiles never move; type never resizes;
nothing slides in from an edge and nothing staggers. State changes — 1px to 2px, fill
inverting, a token swapping — take 90ms with linear easing, because linear reads as a switch
being thrown and any ease-out would read as a gesture, which is warmth this direction does
not want. The overlay appears as a 120ms opacity step with no scale and no slide. Load more
appends rows already in position. The only continuous motion on the page is the recordings
themselves and the loop progress rule ticking under the playing ones, which is precisely why
those are the things the eye goes to.

Reference points, described as qualities rather than interfaces to copy: the authority of a
Swiss railway timetable, where the rules and the tabular figures are the entire design and
you find your train in under a second. The title block and sheet index of an architectural
drawing, where the frame around the content carries as much information as the content. A
component datasheet for a piece of electronics, where a table set with real care is more
beautiful than any illustration would have been. The printed index at the back of a
well-typeset catalogue raisonné, where hundreds of entries stay scannable because the setting
never varies.

What this sacrifices, plainly: warmth, softness and any sense of welcome. A first-time
visitor will not find it charming, contributors' work is presented as inventory rather than
celebrated, and there is nowhere in the system to later add a decorative flourish, because
the system has no slot for one. Accept that. What stops it becoming a wireframe is the
recordings and the precision. Twenty-four bright, saturated, moving portrait rectangles per
screen are the colour of this design, and the ink deliberately never competes with them; the
finish is exactness itself — hairlines that land on the module, figures that align down the
column, a masthead set with real typographic care, the margin indices, the loop rule ticking.
A wireframe is imprecise and unfinished; this is over-precise and finished. The test: if you
removed every recording and the page still looked complete, you have drawn a wireframe.
Failure modes to name and avoid: 8px-rounded bordered cards on a white page with a grey sans,
which is generic minimalism and not this; a grid declared on the specimen sheet but not
visible on any screen; a shadow reintroduced as a soft border; anything centred inside a
cell; grey-on-grey hairlines so faint the body text sitting beside them fails 4.5:1; and the
accent colour used decoratively anywhere beyond its three permitted jobs.

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
- Is the declared grid actually visible on the screens, or only asserted on the specimen
  sheet? Pick two unrelated elements on the catalogue and confirm their edges land on the
  same column line.
- Did a shadow, glow, gradient, blur or non-zero radius get back in anywhere — a "subtle"
  soft border, a blurred scrim behind the overlay, a dark-mode tile lighter than its page?
- Print the catalogue in greyscale in your head: can you still tell playing from paused,
  saved from unsaved, active from inactive and focused from unfocused, all at once, on one
  tile?
- Does every rule stop on a module line, or is there a hairline overhanging its column or
  stopping a few pixels short?
- Do the view and vote figures align vertically down the grid as tabular columns, or does
  1,426 sit at a different width from 43?
- Delete every recording from the catalogue screen in your mind. Does what remains read as a
  finished design, or as a wireframe? If wireframe, the precision is missing, not the ideas.
