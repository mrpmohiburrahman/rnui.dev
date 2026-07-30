You are designing a complete visual and structural overhaul of rnui.dev, a catalogue of
React Native UI components where every component is shown as a short screen recording of
a real phone. Do not ask me questions. Make every decision yourself, commit to it, and
produce the full set of deliverables in one pass.

## ACTIVE DIRECTION

Direction 3 — Utility. Defined in full at the bottom of this brief.

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

The concrete choices below are yours to make, and I want you to make them decisively — but
make them in service of the direction, not instead of it. The direction is the fixed point;
these are the variables you set in order to reach it:

- Layout. Sidebar, horizontal chip row, command palette, tabs, something else. Grid,
  masonry, staggered shelf, single-column feed. Your call.
- Whether there is a hero at all, and what it says if there is one.
- Palette, including whether the interface has any colour at all.
- Typefaces, type scale, weights.
- Corner radius, borders, elevation, texture, grain, gradients.
- Motion character — what animates, how fast, how it eases.
- Density. How many cards fit a 1440px-wide screen.
- Where the metrics, the contributor, and the source link sit on a card.

Commit hard to the direction, and be able to trace every choice on that list back to it. A
cautious version of an art direction is worse than none.

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

## DIRECTION 3 — UTILITY, IN FULL

**The core idea.** rnui.dev as a queryable table you drive from the keyboard: every entry
is a row of hard facts with a small live portrait beside it, the recordings are the only
pictures on a screen otherwise made entirely of text and rules, and a command palette — not
the pointer — is the primary instrument for getting anywhere. This is an instrument panel
for a developer who already knows they need a wheel picker, not a gallery for someone who
wants to be shown something nice.

**Keyboard-first is the structure, not a garnish.** If the keyboard layer were removed this
direction would collapse, so it has to be drawn, not annotated. Commit to a specific,
complete key map and show it in use in the mockups.

The list owns a selection cursor at all times. `j` and `k`, or Down and Up, move the cursor
one row. Home and End jump to the first and last loaded row. Enter opens the selected entry
as the overlay; Escape closes it and puts focus back onto that exact row, visibly. `o` opens
the selected entry's source repo in a new tab — the site's whole purpose gets its own single
key. `s` toggles saved on the selected entry, `v` casts or withdraws its vote, both updating
the row in place with no reflow. `/` moves focus to the search field, and Escape leaves the
field while keeping the typed query, returning the cursor to the list. `t` cycles the sort
through Recent, Most viewed, Most voted. `g` switches between the two view modes described
below. Backspace, when the list has focus, removes the most recently applied filter.
Command-K or Control-K opens the palette. `?` opens a keyboard map panel, and that panel
must list exactly the keys you actually drew and nothing more.

Tab and the arrow keys must do different jobs, and you must show that you know the
difference. The whole list is a single tab stop: Tab lands on the list once, arrows and
`j`/`k` move between rows inside it, and Tab from there goes on to the next region — nobody
tabs through 48 rows times five controls. Within the selected row, Tab reaches that row's
own controls in a stated order: vote, save, repo link. State the page's tab sequence
outright — skip link, search, sort control, filter rail, list, footer — and draw the focus
ring at every one of those stops in both modes.

**What the palette can do that the pointer cannot.** The palette is not a search box in a
modal. It is a command surface with a typed grammar, and its advantage over the mouse must
be legible in the drawing. It composes a multi-part query in one uninterrupted motion:
typing a category term, then a contributor term, then free text applies all three without
travelling to three separate controls. It reaches the far end of the long tail — a
contributor with a single entry — by typing four letters, where the rail would need
scrolling and scanning. It ranks rather than filters blindly, so a partial, misspelled or
out-of-order query still puts the right thing at the top. It acts on the current selection
without moving the pointer: save it, vote on it, open its repo, copy its link, clear the
filters, switch the sort, jump to Saved. And it is the only place in the product where the
site's entire vocabulary — every category, every contributor, every sort, every view mode,
every action, and every entry by name — appears enumerated in one ranked list. Draw the
palette in at least three states across the deliverables: opened empty with its default
command list, mid-query with mixed result types grouped and labelled, and a query that
returns nothing with a way out.

**The selection is never lost.** Three redundant signals mark the cursor, so it is never
colour alone: a 2px accent bar on the row's leading edge, a very light accent tint filling
the row, and that row's controls switching from ghost to outlined. Moving the cursor scrolls
the list to keep it inside a band roughly 120px clear of the top and bottom of the viewport,
never letting it sit against an edge. A status bar is pinned to the bottom of the viewport,
36px tall, monospace, always present in every catalogue drawing: it names the cursor's
position in the result set, the selected entry's name, its category and its contributor in
full, the active sort, the number of active filters, and the two or three keys that are
relevant right now. That bar is also how the direction pays its debt on long strings — a row
may truncate "Enzo Manuel Mangano ( Reactiive )", but the status bar states it complete and
unabridged, and it is the mobile answer too. When the overlay is open the underlying cursor
stays drawn behind the scrim, so Escape has an obvious destination.

**Typographic character.** Type leads and image follows; this is the one direction where the
recordings are cells inside a type-driven layout rather than the layout being built around
them. Two families only. A neutral grotesque with genuinely good small sizes for all prose,
names and labels — the kind of face that was drawn for interfaces and stays crisp at 12 and
13px rather than a display face shrunk down. A monospace with tabular figures for every
number, every key cap, every category token, the status bar, and the counts: views, votes,
result totals, positions. The rule is absolute and it is the direction's signature — if it
is a quantity or a machine string, it is monospace; if it is a human name or a sentence, it
is the grotesque.

The scale is short and deliberately flat: five sizes, roughly 12, 13, 15, 20 and 28px, with
28 appearing at most once per screen. The three working sizes sit one step apart, which means
hierarchy cannot come from size — it comes from weight, from case, from monospace versus
grotesque, and from the hairlines that separate regions. There is exactly one big jump in the
whole system, from 15 to 20, and it marks the boundary between the catalogue's rows and the
detail view's title. Tracking is opened slightly, about +0.02em, on the 12px labels and on
any small-caps column heading so they survive at that size; the 20 and 28 are tightened
about -0.01em. Line height is tight: about 1.35 on the working sizes, 1.2 on the two large
ones. Nothing is set in italic. Nothing is centred except the digits inside a control.

**Colour behaviour.** Near-zero colour. Two neutral ramps and exactly one accent hue. The
accent is permitted in four places and nowhere else: the focus ring, the selection cursor,
an active filter token, and the fill of the views bar. Categories are never colour-coded —
eighteen hues would turn the page into confetti and would fail the colour-alone rule anyway,
so a category is a monospace token with a hairline border. "New" is a monospace token too,
distinguished by border and letterform rather than a colour patch. If you find yourself
wanting a second accent, you have started designing a different direction.

Light mode is a paper spec sheet: bright, even, unshadowed, the background a very slightly
warm off-white rather than pure white, chosen so the hairlines register and so the bright
phone recordings do not blaze out of the page. In this mode the media cells sit almost flush
with the page and the grid reads as continuous printed matter with pictures set into it.

Dark mode is a text editor at night, and its intention is specifically not atmosphere. The
interface stops emitting light so the recordings — which are always bright phone captures —
are the only luminous thing on screen, but the surrounding text stays at full working
contrast rather than being dimmed for mood; a utility surface that whispers is a broken
utility surface. Because every recording is bright, each media cell in dark mode gets a
1px neutral border to give the bright rectangle a hard edge instead of letting it bleed into
the canvas, and no glow, bloom or coloured spill is allowed around it. Both modes must reach
the same working contrast for the same text; the dark canvas is a dark grey, not black, so
that a border can be drawn darker than the surface as well as lighter.

**Surface language.** Borders, never shadows. One hairline weight at 1px throughout, at a
single stated contrast against its background in each mode, used for column rules, row
separators, control outlines and media edges. Radius is 2px — effectively square, enough to
avoid looking like a scan of a table but never enough to read as soft. Nothing stacks:
everything is coplanar, and the only two elements that leave the plane are the command
palette and the detail overlay, which announce themselves with a scrim and a single hairline
border rather than with elevation. Fills exist only to carry state: hovered row, selected
row, active token, pressed control. No gradients, no glass, no grain, no noise, no
decorative texture. The one permitted texture is structural: the visible hairline grid of the
table itself.

**Density and rhythm — and the tension the brief creates.** Utility interfaces normally buy
density by shrinking type to 10 or 11px and squeezing controls to 20px squares. This brief
forbids both: nothing under 12px, 44px targets on mobile, 24px on desktop. State this
tension in your own annotations and resolve it the only honest way — take the density out of
decoration and out of information architecture, not out of the content. That means no card
padding beyond 8px, hairlines where other directions would put 24px of gutter, no shadow
clearance, no radius eating the corners, no hero, no section headers that repeat what the
status bar already says, and every fact placed in a column rather than restated per card.

Concretely, the desktop 1440px catalogue has two view modes and both must be drawn with
equal rigour. The default is **rows**, and it is the direction's identity: a fixed 240px
left rail holding filters, and a row table filling the rest. Each row is about 88px tall
with 12px vertical padding, and its media cell takes the row's full height at 9:16, roughly
50px wide. That width is derived, not chosen: a 12px meta line plus two reserved lines of
15px title plus padding sets the minimum row height, and 9:16 sets the width from there.
Columns, left to right: media, name over two reserved lines, category token, contributor,
views, votes, save, repo. About ten rows are visible above the fold at 1440×900 with the
header and the status bar in place. The second mode, reached with `g`, is a **grid**: seven
portrait tiles across at 1440, roughly 152px wide by 270px tall, 12px gutters, a regular
grid with no stagger and no masonry, each tile carrying its name, category and counts
beneath it. Be honest in your annotations about the division of labour: in rows the media
is a motion locator — you can tell a loader from a carousel by movement at that size — and
in grid mode and on the detail view the recording is the subject at genuinely readable size,
where the detail view shows it at roughly 420px wide at native aspect. Do not draw only the
grid and describe the rows in a caption.

Playback binds to the cursor, which is what makes the five-at-once limit feel intentional
rather than arbitrary: the selected row plus the two above and the two below play, and every
other row holds its still frame. Move the cursor and the playing window moves with it. Say
this in the annotation and draw it — five rows in motion, the rest still.

The views bar is the only bar in the product. Fixed 88px track, fill clipped, scaled against
a fixed ceiling of 1,500 views rather than against whatever the current page's maximum
happens to be, so bars stay comparable across filters and pages. Its label is monospace with
tabular figures, right-aligned so 1,426 and 43 align on the digits. Votes get no bar at all,
because a 0-to-4 range has nothing to plot: votes are a monospace integer beside a stepper
control, and zero prints as "0", never as blank or a dash.

The repeated-contributor problem gets a structural answer, designed for the common case. In
Recent sort, a run of consecutive rows by the same contributor prints the name once at the
run's first row and continues it with a 1px vertical rule down the contributor column for the
rest of the run. Because that fires on most of the page, it is the column's normal
appearance rather than an annotation, and it is not merely decorative — the rule is a control
that filters to that contributor. The suppressed name is never actually unavailable, because
the status bar always states the selected row's contributor in full. In the other two sorts
runs break naturally and names print normally; show both.

**Motion character.** Almost nothing moves except the recordings, and that restraint is a
feature you must state. The cursor does not animate at all — 0ms, an instantaneous jump —
because a sliding selection bar falls behind held key repeat and makes the instrument feel
loose. The scroll that keeps the cursor in view is 90ms, ease-out. The palette appears in
80ms on opacity alone, no scale and no slide. The overlay is 120ms, opacity plus a 4px
upward move, and that is the only translate anywhere in the direction. Filter tokens appear
and disappear with no transition at all, instantly, because animated tokens make rapid
filtering feel gummy. Row hover has no transition, so a fast pointer does not leave a smear
of half-lit rows behind it. The views bars are drawn at their final width and never grow in,
which also protects the first-800ms budget. Nothing springs, nothing bounces, nothing
staggers in on scroll, no number counts up. Reduced motion costs this direction almost
nothing, which is worth saying: the recordings freeze, the cursor-follow scroll becomes an
instant reposition, and everything else was already still.

**Reference points.** Four qualities to aim at, in your own execution rather than anyone
else's pixels. The status line of a well-configured terminal session: one row of monospace
text at the bottom of the screen that always says where you are and what will happen next,
and never lies. A professional trading or operations terminal, where hundreds of records
stay legible because alignment, tabular figures and hairlines do all the work and colour is
reserved for the two things that matter. The fuzzy file-jumper of a good code editor, where
four letters and one Enter beat any amount of clicking, and the list ranks rather than
filters. And a well-printed technical parts catalogue, where dense columns of numbers and one
small photograph per part coexist on the page without a single ornament.

**What this sacrifices, plainly.** Delight. There is no hero moment, no reveal, no
personality, nothing to screenshot for a launch post. A first-time visitor who arrived
curious gets no seduction and may find the page cold or intimidating, and browsing for
inspiration is a second-class use of this design. The recordings are smaller by default than
any other direction would tolerate, which is the price of maximum entries per screen. The
interface will feel unrewarding to anyone who does not learn a single key.

**What a failed version looks like.** An ordinary card grid with a Command-K box bolted onto
it and a few monospace numbers sprinkled around. A keyboard map panel listing keys the
mockups never show working. Density bought by dropping text to 11px or squeezing controls
below the minimums, instead of by removing decoration. Eighteen colour-coded category chips.
Shadows, 12px radii, or a second accent. A palette that only searches and cannot act. Only
the grid mode drawn, with the rows described in a caption. A selection cursor that vanishes
when the overlay opens, or a status bar that is drawn once and then forgotten on the other
screens. Any of those and the direction has been watered down into a generic dashboard.

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
- Is the selection cursor visible in every single catalogue drawing, including the ones with
  the palette open and the overlay open — and is it marked by more than colour?
- Does the keyboard map panel you drew list exactly the keys the mockups demonstrate, with
  no key claimed that is never shown and no key shown that is never listed?
- Is the list a single tab stop with arrow navigation inside it, or did you leave a keyboard
  user tabbing through 48 rows of controls?
- Can the palette do something the pointer cannot, and is that shown rather than asserted?
  If it only searches, it has failed.
- Did you find your density in layout and information, or did you find it by shrinking text
  toward 11px and controls toward 20px? Measure the smallest text and the smallest target
  in every drawing and state both numbers.
- Are both view modes drawn at full fidelity in both light and dark, or is one of them only
  described in a caption?
- Does the status bar appear on every catalogue screen, and does it state the selected
  entry's contributor at full length even where the row truncates it?
- In dark mode, does every bright recording have a hard edge against the canvas, and did you
  avoid dimming the surrounding text for atmosphere?
