You are designing a complete visual and structural overhaul of rnui.dev, a catalogue of
React Native UI components where every component is shown as a short screen recording of
a real phone. Do not ask me questions. Make every decision yourself, commit to it, and
produce the full set of deliverables in one pass.

## ACTIVE DIRECTION

Direction 1 — Editorial.

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

The direction below is fixed. The concrete choices that realise it are yours, and you must
make all of them — but each one is judged on whether it serves the direction, not on
whether it is defensible in isolation:

- Layout. Sidebar, horizontal chip row, command palette, tabs, something else. Grid,
  masonry, staggered shelf, single-column feed. Your call.
- Whether there is a hero at all, and what it says if there is one.
- Palette, including whether the interface has any colour at all.
- Typefaces, type scale, weights.
- Corner radius, borders, elevation, texture, grain, gradients.
- Motion character — what animates, how fast, how it eases.
- Density. How many cards fit a 1440px-wide screen.
- Where the metrics, the contributor, and the source link sit on a card.

Pick exact hex values, name exact typefaces, settle the exact arrangement — and commit
hard to the direction while you do it. A cautious version of an art direction is worse
than none.

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

## THE DIRECTION — EDITORIAL

**The idea in one sentence.** This is a printed design monthly whose plates happen to move:
one considered opening spread, a real hierarchy between a featured recording and the run of
the catalogue, captions set like captions, and whitespace measured out as structure rather
than left over between tiles.

That sentence carries a specific obligation, and it is the obligation most component grids
duck. A magazine does four things a card grid does not. It opens with a spread that is
mostly air and one strong statement, so you know what this issue is about before you see a
single item. It makes one plate unmistakably more important than the others — not by
scaling the same tile up 20%, but by giving it a different position in the grid, a wider
column, a longer caption, and neighbours that defer to it. It prints its captions in a
distinct, small, quiet voice that never competes with the plate and never sits on top of
it. And its white space is on a rhythm: the same intervals recur, so the eye learns the
page instead of re-parsing it. Build all four. A hero band with a headline and a search box
is not an opening spread, and the first tile made slightly larger is not a featured entry.

**The cover.** The cover of a 277-recording catalogue is not a picture — it is a claim plus
one plate. The first band of the catalogue is an issue statement set in the largest type on
the site (a sentence, in words, that names what the collection is and how large it is,
using the real 277 and the real 18 categories and the real 24 contributors), a masthead-like
rule beneath it that holds the search field and the sort control, and then a single featured
recording at plate size with a caption long enough to read as editorial copy — the component
name, the contributor at full length, the category, and the metrics. Choose the featured
entry by a stated editorial rule and print the rule ("Most viewed this batch"), so it does
not look arbitrary. The three or four ordinary tiles that share that first band sit lower on
the page and smaller, so the featured plate is obviously the lead. That band alone is the
first screen, and it is cheap: one large still and a handful of small ones.

**Typographic character.** Type leads, image follows. A high-contrast display face — a
transitional or modern serif with real thin strokes, or a grotesque with strong optical
sizing — carries the issue statement, the section headings and the large numerals. Small
text is a plain, boring, extremely legible neutral sans: captions, contributor credits,
metrics, filter labels. The scale has a hole in the middle on purpose. Something like
13 / 15 / 17 for everything functional, then a jump straight to 34 for headings and 88 or
above for the issue statement, with nothing between 17 and 34. That gap is the hierarchy;
if you fill it in with 20 and 24 and 28 you will have five sizes that all look like the
same size. Display tracking is tight and negative, around −2% to −3%, and it is set to
wrap across two or three lines with deliberate line breaks rather than flowing to a random
rag. Caption tracking is slightly open, and category labels are the one place all-caps at
small size with generous letter-spacing is allowed. Weight range is narrow — a regular and
a medium do nearly everything; if you reach for black weights you are compensating for a
scale that does not jump. Numerals are tabular everywhere a view count appears, because
two view counts in adjacent captions that do not align vertically will read as sloppiness
in a layout this bare. Never set a caption below 12px, and given the small end of this
scale, expect 13px to be where captions actually live.

**Colour behaviour.** Near-monochrome, and mean it: ink, paper, and two or three greys
between them. Exactly one accent, allowed on no more than three things per screen — the
active state of the vote control, the active filter, and the focus ring — and it must clear
4.5:1 as text and be distinguishable from the ink by more than hue. Everything else earns
its distinction from size, weight, position and rule weight.

The media is always a bright phone recording, and that changes what each mode is for. Light
mode is paper: a warm off-white page, near-black ink with a trace of warmth in it, daylight,
the reading mode, the default. On paper a bright recording has no edge of its own, so every
plate needs a hairline containing rule on all four sides — without it a white-background
recording bleeds into the page and the composition collapses. Dark mode is not a studio and
not a showroom; it is a reading room with the lights down, or a press proof on dark stock.
Warm charcoal, not black. In dark mode the recording is by a wide margin the brightest
object on the page, so the surrounding contrast is deliberately capped: captions step down
to a mid grey that still clears 4.5:1 but never fights the plate, headings lose a little
weight rather than gaining it, and the hairline rule around the media becomes barely-there
because the plate now has its own edge. Do not add glow, bloom or a scrim in dark mode —
that is a different direction. Both modes keep the same intervals, the same grid and the
same type scale; only value and rule weight change.

**Surface language.** No shadows anywhere. No gradients. No elevation in the visual sense —
the specimen sheet's "elevation levels" for this direction are rule weights and value steps,
and you should say so. Structure is carried by hairline rules that are actually one crisp
pixel and by fields of empty page. Radius is near zero: 2px on the media well and on
controls, 0 on rules and dividers. A pill-shaped filter chip belongs to another direction —
filters here are small rectangular buttons with a rule, and their active state is a weight
change plus a glyph plus fill, never colour alone. Surfaces sit flat on one plane. The
overlay is the only second plane, and it announces itself by laying a full sheet of page
over the catalogue rather than floating a rounded card in the middle — the catalogue behind
it goes quiet, but does not blur or scale. Texture, if any, is at most an imperceptible
tone difference between the page and the media well. If you find yourself adding grain to
make it feel printed, stop; the printedness comes from the grid and the captions.

**Density and rhythm.** Four portrait tiles across 1440px in the ordinary run of the
catalogue — four, not five, and certainly not six. Column gutters around 32–40px, row gaps
noticeably larger at 56–72px so rows read as bands rather than as a mesh. The caption hangs
in the space beneath its plate, on the page, never over the recording — which also removes
the single most likely contrast failure in the whole design. Everything sits on an 8px
baseline, and captions across a row share a baseline whether their title took one line or
two; that shared baseline is the reason two lines are reserved for every title. Vertical
intervals are declared and repeated — one value above the first plate, one between bands,
one between a plate and its caption — and no interval exists because something happened to
be short. The body grid is regular and the first band is deliberately irregular; that
contrast is the whole composition. 48 cards then Load more resolves to twelve bands of
four, and the last page's partial band should be drawn as a deliberately incomplete band
with its empty columns left as page, not backfilled or centred. A one-entry category is
one plate at featured size with a full caption and a line of copy stating that this
category holds a single entry — in a magazine, one plate on a page is the most confident
thing you can do, so lean into it rather than apologising with a lonely small tile. The
148-entry Misc category is the same four-across run for as long as it takes.

For the repeated-credit problem, take the editorial answer: a magazine credits every plate,
every time. Print the full contributor name in every caption at caption size, so repetition
reads as rhythm rather than as a bug. If you additionally want a run marker, it must be
built for the common case — a run of three or more adjacent entries by one contributor in
Recent order gets a single hanging credit in the left margin of the band, and the
per-caption credit shortens within that band only. Whatever you choose, draw it in a state
where it fires several times on one screen, because that is the normal state of this data.

**Motion character.** Almost nothing moves except the recordings themselves. There is no
hover lift, no scale, no tilt, no card that grows or shifts its neighbours, no reveal of
controls on hover — controls are always drawn. Transitions are opacity and small position
changes only, 120–180ms, plain ease-out, no spring, no bounce, no overshoot. The still-frame
to playing handoff is a cross-fade of about 200ms, not a zoom, and it must not change the
tile's size by a single pixel. The overlay arrives as an opacity fade plus a 2–4px rise over
about 200ms and leaves faster. The one piece of motion allowed any personality is a link
underline. State that the grid, the type, the filter row and the tile boxes never move, and
then honour it — a layout this quiet reveals a single stray hover animation as a mistake in
a way a busy layout would hide.

**Reference points, described rather than named.** The confidence of a well-printed design
annual, where a single plate is given most of a page and its caption sits quietly beneath in
nine-point type, and nobody worries that the page is half empty. The tone of a museum wall
label: artist, year, medium, in three short lines, telling you everything without raising
its voice. The front-of-book of a monthly, where the opening spread is mostly white and one
sentence tells you what this issue is about before any image appears. And a typographic
specimen sheet, where the numerals themselves are the ornament and there is no decoration
anywhere that is not a letterform or a rule. Take the quality, not the surface: none of
these are websites, and the result should not look like a homage to any one artefact.

**What this sacrifices, plainly.** Density. Four across instead of six or eight means
roughly a dozen to sixteen entries within reach of the fold instead of forty. Someone
hunting for one specific slider will scroll more here than they would in a tighter layout,
and that is a real cost you should not pretend away. What it buys is worth naming in the
mockup's own copy: at four across, each recording is large enough that the interaction being
demonstrated is actually legible — which is the only reason anyone came — the 33-character
contributor name fits on one line without truncating, the caption can carry name, credit,
category and both metrics without crowding, and the first screen paints from a small handful
of stills. This direction assumes browsing over searching, so it pays that assumption back
by giving search, the sort control and the active-filter row a prominent, permanent home at
the top of the page instead of hiding them behind an icon.

**What a failed version of this looks like.** Twenty-four pixel gaps described in the
annotations as "generous whitespace". A display size that tops out around 32px, so the
issue statement never actually feels large. Six tiles across because four "wasted space".
Every step of the type scale filled in, producing no hierarchy at all. A soft drop shadow
that crept back in under the tiles. Sixteen-pixel radii and pill chips. Eleven-pixel grey
captions that fail contrast and are illegible anyway. The accent colour used on fifteen
elements. A "featured" entry that is the first tile at 1.2× with the same caption as its
neighbours. A hero that is a centred headline over a search box with no plate in it. Any of
those and the result is a slightly airier version of the site being replaced, which is the
one outcome worse than not attempting this direction.

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
- Count the tiles across your 1440px catalogue. Is it four or fewer? If you drew five or six
  to keep more entries visible, you drew a different direction and should redraw it.
- Is the featured entry different from the ordinary tiles in position, column width and
  caption treatment — or is it just bigger? Bigger alone is not hierarchy.
- Does your type scale have an actual gap in the middle, and does the largest size appear on
  every screen that needs it, including mobile and the states page — or did the big type only
  ever show up in the desktop hero?
- Is there a single shadow, gradient, or radius above 4px anywhere in any screen? Find it and
  remove it.
- Do captions sit on the page beneath the plate rather than over the recording, and do the
  captions across one row share a baseline even where one title wrapped to two lines?
- Are the row gaps larger than the column gaps, and is every vertical interval a repeat of a
  declared value rather than whatever space was left over?
- Does anything at all move on hover, and is the accent colour used more than three times on
  any one screen?
