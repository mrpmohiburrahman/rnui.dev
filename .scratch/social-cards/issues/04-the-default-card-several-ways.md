# The default card, several ways

Status: resolved
Type: prototype
Blocked by: 14

## Question

**The card every share without a filter gets. The maintainer has said "I don't like it at all" —
so produce four or five designs that are genuinely different from each other, in this Design, and
let one be chosen.**

What is the default card *for*? A share of `https://www.rnui.dev` with no context — someone pasted the
root URL into a chat or a tweet. The card is the only thing that arrives. So:

- What does it say that makes someone click? The catalogue's size, the Categories, a claim, a
  Poster, the wordmark?
- **Is it one card or several?** The root URL is shared by people who mean "look at this site" and by
  people who mean "find my animation". The map has not established whether the default card is one
  static design or varies.
- The current card claims **"343+ animations"** and `data/meta-data.ts:22` says "A list of React
  Native animations made by the community" — and the site today is nearer **280 Recordings**
  (`CONTEXT.md:38`). Whether the count is on the default card at all is part of this ticket, not
  settled in advance; ticket 03 bears on it the same way it bears on the Contributor card.

Produce **four or five rendered designs at 1200×630**, as a live preview route so they can be flipped
through, in this Design's palette and type per ticket 02's constraint list. They must differ
*structurally* — not one layout with the accent moved. A wordmark-only card, a catalogue-scale card, a
Poster-grid card, a Category-list card and a poster-child card are five real directions.

Name each, say in one line what it is betting on, and say what it costs. The maintainer picks.

## Notes

- **Do not invent colour or a type step.** `app/globals.css:203-268` and the seven `fontSize` steps in
  `tailwind.config.ts` are the palette. Every device the Satori subset drops is ticket 02's list, not
  yours to re-discover.
- **Light or dark?** The site has both, `next-themes` picks one, and a card is rendered server-side
  with no visitor preference in hand. Worth putting to the maintainer explicitly — it may be the single
  largest determinant of whether the card reads as this site.
- **Read the existing card as a document.** `app/opengraph-image.tsx` and the Jan 2025 PNG are what
  shipped; ticket 01 says which one. Knowing what is being replaced is part of proposing what replaces
  it.
- Link the preview route as the ticket's asset. Do not edit `app/opengraph-image.*` — nothing ships
  from this map.
## Answer

**Six designs, rendered as real `ImageResponse` output rather than HTML, each in BOTH modes** —
13 renders including the incumbent for comparison. Preview:
[`../preview/gallery-default.html`](../preview/gallery-default.html) (open it directly; arrow keys flip).
Rebuild with `pnpm tsx .scratch/social-cards/preview/render-default.tsx`, and the Wall's tiles with
`pnpm tsx .scratch/social-cards/preview/grid-renditions.ts` first. Probes:
[`../probe/ticket04/audit.ts`](../probe/ticket04/audit.ts).

| | Design | Betting on | Cost |
|---|---|---|---|
| **0** | **Incumbent** — re-rendered beside the candidates | knowing what is being replaced | slate gradient, `system-ui`, and a number 45 too high |
| **1** | **Hero** — the homepage's own h1 and its own three counts | the card is a share of *the site*, said in the site's own words | text only; says nothing about what a Recording looks like |
| **2** | **Mark** — the wordmark alone at 108px | a stranger who has seen it needs only to know which site | says nothing else, so it cannot persuade anyone who does not already recognise the name |
| **3** | **Scale** — 298 / 24 / 18 as the headline, claim demoted | a number is what makes a catalogue clickable | a bare number needs the claim beneath it to survive a stranger's first question |
| **4** | **Wall** — eight real Posters, cropped to tiles, wordmark on a chip | this is what the site **is**, not what it says | the chip eats 13.1% of the card; the crop is 57–76% of each Poster |
| **5** | **Facets** — the Category list with counts, in two columns | it is browsable by facet, so show the index | **a subset, so it is a claim about which Categories matter that nobody made** |
| **6** | **Facets (all 18)** — the same list, complete | — | **18 Categories do not fit at a readable size.** Rendered so the cost is visible |

**Hero is what I would build**, and the reason is that it is the only variant that needs no new copy:
the claim is the homepage's h1 verbatim (`components/hero.tsx:23`) and the counts are the hero's own
stat row, so the card and the page say the same thing in the same way. **Wall is the better card** and
I would build it second, because it is the only one that shows the catalogue.

### The count is wrong today, and that is not a taste question

`app/opengraph-image.tsx:56` claims **"343+ animations"**. The catalogue has **298 Recordings**. So
the shipped claim is **45 too high**, and it uses the wrong noun twice over: the domain is
**Recording** (CONTEXT.md, ADR-0008), and 6 of the 298 are Full Apps rather than animations. Every
count here is read off `allRecordings`, not typed: **298 / 24 / 18**.

There is a second cost, and it is the one that should stop a count appearing on any card.
**Ticket 03 measured that LinkedIn documents an existing share as permanent.** A count on a card is
therefore a number that freezes at share time and can never be corrected — so a card carrying 298 is
a card that will be wrong in every share made after the 299th Recording. The count is not wrong
because 298 is wrong; it is wrong because **it is a claim a cache cannot revisit.** Whether any card
carries a count at all is handed to **ticket 10** as a live decision, not a settled one.

### The composition was never the problem

The incumbent and **Hero** are the same layout: mark top-left, a headline, a sub-line. What differs is
everything else — slate `#0f172a` against this Design's `#0A0B0D`, `system-ui` against Space Grotesk
loaded, 28px against 81px, and a wrong number. "I don't like it at all" is a fair verdict on that
card and it does not indict the composition, so this ticket did not spend its budget inventing new
layouts for its own sake.

### Dark versus light: measured, and the site cannot answer it

The ticket asks to put this to the maintainer. It is better answered by measurement, because **the
site is not one appearance**: `app/layout.tsx:92-93` sets `defaultTheme="system"` with
`enableSystem`, so a first-time visitor sees their *device's* mode and nothing is persisted until the
toggle is used. A card is rendered server-side with no request context, so it cannot match "whatever
the site is" — there is no such thing to match.

Both modes clear AA on every token pair the variants use, measured exactly:

| pair | dark | light |
|---|---|---|
| `t1` on canvas (headline, claim, facet name) | 17.58 | 16.44 |
| `t2` on canvas (claim caption) | 9.87 | 6.92 |
| `t3` on canvas (stat label, count) | 6.46 | **4.86** |
| `acc` on canvas (`.dev`) | 12.69 | 5.43 |

So contrast does not decide it. **The catalogue's own imagery does.** The same eight tiles, measured
against each canvas:

| | worst tile on this canvas |
|---|---|
| dark `--canvas` `#0A0B0D` | **2.27:1** |
| light `--canvas` `#F4F4F1` | **1.06:1** |

**1.06:1 is invisible** — that tile measures luma 246 on a canvas of luma 244. Ticket 14 already found
64 of 297 Posters are more than 90% near-white app chrome, and one of the eight sampled here is exactly
that. So **light mode cannot render the catalogue**; it can only render text about it. Dark carries
all eight, worst case 2.27:1.

**Recommendation: dark**, on that measurement rather than on continuity with the old card. Every
text-only variant would survive either choice; the Wall is the discriminator, and the Wall is the only
variant that shows the thing the site is for.

### The platform floor, as arithmetic

A card is 1200px wide and Slack renders it at 360 — a factor of 0.3. So an element clears an 11px
on-screen size only at **>= 37 card px**. This is the most transferable number the ticket produced,
and it is the same constraint ticket 06 found from the other end, where it bounded the caption's
scale from *above*. Here it bounds the small steps from *below*, and the two pull in opposite
directions in the same column.

It caught a real defect on the first render: the stat labels were scaled off the numbers' own
proportion, which put them at **16px — 4.8px at Slack**. Those three labels are what turn three
numbers into a sentence, so they are now at the floor, 37px. Everything passes except Facets18,
deliberately.

### 18 Categories do not fit, and that is arithmetic

Facets is the direction the ticket named, and it fails on a number rather than on taste:

- Four columns leave **150px** each; the name budget is 116px. **6 of 18 names are truncated** —
  `Circular Progress Bars` is over by 143px.
- At 19px the rows are **5.7px at Slack**, under the floor.
- Raising the rows to the 37px floor: **width is fine** (one column is 684px, the longest name needs
  505px) but **height binds** — a 37px row with its padding is 56px, so one column holds **11** of the
  card's 630px, and there are 18.

**Eleven is the ceiling and there are eighteen.** So the honest options are a subset (a claim nobody
made) or unreadable type. Both are rendered so the choice is visible rather than argued.

### `flexWrap` does not grid in Satori

Worth recording because it is a Satori limitation ticket 02 did not list and it produced the worst
defect in this ticket. Facets' first build used `flexWrap: wrap` for its columns; the items packed
into ragged rows instead, each count's `marginLeft: auto` pushed it into the *next item's* cell —
"161BUTTONS" — and the third column ran off the card entirely. **A multi-column list must be built
from nested `flexDirection: column` boxes.** Column widths are also now *derived* from what is left
after the label column, the gap and the padding; the first fixed attempt hard-coded 372 and overflowed
by 92px, clipping the last count in all four rows.

### The Wall's crop, measured

A tile keeps **57–76%** of its Poster's height — `TILE_H × aspect / TILE_W`, computed per tile in
`grid-renditions.ts`. That is far better than the **25%** a single-poster card measures, and it is
defensible here for a reason it is not defensible on a Recording card: **no tile is being read as a
device.** What is lost is the frame — the home indicator and the tab bar are cropped away. The tiles
are eight real Posters chosen by greedy farthest-point on the hue circle, because a wall of eight that
all measure hue 356 is a wall of one colour.

The chip's geometry is **derived and then verified**, not guessed: two earlier audits assumed it from
the stylesheet and were both wrong, the second by a flood-fill that leaked straight through the chip
because its fill *is* `--canvas` and so is the card behind it. The check that matters is not "is tile
ink near the chip" — the chip is *meant* to sit on the tiles — but "does a **tile edge run along the
chip's border**", which would make an intentional overlay look accidental. Inset past the chip's own
16px radius, **0 of 1128 border pixels** are non-canvas in either mode.

### Two audits that produced false results first

Recording these because they are the same failure ticket 06 hit repeatedly, and a check that cannot
report its own blindness is not a check:

1. The first audit reported `Facets` as **"AA ok" having measured zero pixels**. Its solid-glyph test
   used a 5×5 neighbourhood at tolerance 26, and a 28px mono stroke has no 5×5 block within that
   tolerance, so every candidate was rejected and the worst-case ratio stayed at its initialiser.
   **A check that measures nothing must report NOT MEASURED, never ok.** The rewrite computes
   flat-background contrast *exactly* from the declared token pairs — no pixel-peeping, nothing to
   fool — and keeps pixels only for the Wall, where the question genuinely is about imagery.
2. It measured the incumbent against `--canvas`, which is not the incumbent's background (it has a
   slate gradient), so it "failed" at 1.1:1 purely by being compared to the wrong backdrop.

### Handed to ticket 10

The counts, if any card carries one: **298 Recordings, 24 Contributors, 18 Categories**, and the
weight that a count is a claim a cache cannot revisit. The claim, verbatim:
`A community-made catalogue of React Native interfaces.` The wordmark treatment, shared with ticket
06's chosen card. **K = 2.8**, and the **37px platform floor** alongside it — the two bounds pull in
opposite directions in the same column and both must be respected. **Dark**, with the light-mode
failure measured. A cropped Poster grid is possible and its bound is 57–76% of height. **Satori's
`flexWrap` cannot make columns.**

**Not decided here, and the map should say so:** which of the six is built — the maintainer's call.
And **ticket 07** now has a new fact to carry: a card carrying a count is render-live by necessity,
which strengthens the map's existing decision to render at request time rather than at build.

## Comments

### 2026-10-05, round 2 — "the mark, but not plain"

The maintainer's verdict on the six above: **"I didn't like any of the design. These are only text.
I like the mark-dark where it only shows the site name, but it's really plain. It's no fun. You
should add some assets or maybe make some variation of this same design… Don't make it plain. User
should be able to see what the site is about. It should delight the eyes."**

So: **the wordmark stays the hero in all six**, and each adds a different way of showing what the
catalogue *is*. Twelve renders, both modes. Preview:
[`../preview/gallery-mark.html`](../preview/gallery-mark.html). Rebuild with
`pnpm tsx .scratch/social-cards/preview/grid-renditions.ts` then
`pnpm tsx .scratch/social-cards/preview/render-mark.tsx`. Probe:
[`../probe/ticket04/audit-mark.ts`](../probe/ticket04/audit-mark.ts).

| | Design | The added device | Cost |
|---|---|---|---|
| **1** | **Halo** | 21 real Posters scattered on an ellipse, each rotated, each lit by its own `--media-glow` at its own `hue` | the ring is decoration; a stranger still cannot name a single demo |
| **2** | **Deck** | 5 Posters **uncropped** in device frames on a shelf, bleeding off the bottom | devices at the edges are half-cut by design, so none reads as a whole phone |
| **3** | **Marquee** | the mark, the claim, and **eleven real Recording captions** as a credit roll | the roll is the smallest type on any variant, 8.1px at Slack |
| **4** | **Ramp** | a diagonal cascade of tiles running off the right edge — the card implies motion | motion implied by a diagonal is a claim a still image cannot keep |
| **5** | **Orbit** | 16 tiles on a hairline ellipse, the name in the middle of the catalogue | the tightest ring; the tiles crowd the plate at small sizes |
| **6** | **Bloom** | a four-hue radial bloom with three large Posters in front | the least informative and the best-looking; depth before data |

**Bloom is what I would build**, and **Halo** second. Bloom is the only one that reads as *designed*
rather than *arranged* — the washes give it depth the others do not have, and it holds up in both
modes because its tiles happen to be dark. Halo is the better card for a first impression because the
ellipse of 21 says "a lot of these" in a way no number does.

**Everything on these cards is real.** Every Poster comes from `data/catalogue.ts`, chosen by greedy
farthest-point on the hue circle because a ring of eight Posters that all measure hue 356 is a ring
of one colour. Every caption in Marquee's roll is a real Recording caption. The claims and counts are
the same ones round 1 established.

#### Three devices this round needed and ticket 02 had never tested

Every card so far has been axis-aligned rectangles on a flat canvas, so the devices that make a
*composed* card were all unchecked. Each is measured by RGBA-diffing against the same render with the
element removed (`../probe/ticket04/device-probe.ts`), which is ticket 02's method — not read off a
support list, because a device that renders as *nothing* still leaves a card that looks like a card:

| probe | px changed | verdict |
|---|---|---|
| `radial-gradient` (circle) | 218,668 | renders |
| `radial-gradient(ellipse at center)` | 275,492 | renders |
| `transform: rotate(18deg)` / `(-12deg)` | 181,096 / 182,175 | renders |
| `transform: scale(0.9)` | 145,800 | renders |
| `border-radius: 50%` | 213,208 | renders |
| `box-shadow` blur only | 267,768 | renders |
| `opacity: 0.35` | 180,000 | renders |
| **`conic-gradient`** | — | **THROWS** — `Failed to parse declaration` |

So the washes are safe and nothing here uses a conic gradient.

#### The one asset deliberately not used

`public/logo.png` is a **red-and-white paintbrush**. The Design's accent is green (`--acc #6FE3CC`),
so putting the logo on a card would break the palette the whole map is bound to. Flagged rather than
quietly omitted, because "why is there no logo on any of these" is a fair question.

#### A measured AA failure, found by the one check that worked

A Strip laid directly over a radial **wash** is not on the flat canvas — the wash lifts the backdrop
on dark and drops it on light. `--t3` on the flat canvas is a comfortable 6.46:1 / 4.86:1, but **on a
wash it measured 4.80:1 dark and 4.44:1 light — under AA in light mode.** Every Strip that sits on a
wash now takes `--t2`, and re-measures at **7.34:1 dark / 6.31:1 light**.

#### Two checks dropped rather than tuned, and the third time this happened

Round 1's audit produced two false results and this round's produced two more, all of the same kind:

- **Plate opacity, dropped.** The centre plate is `background: pal.canvas` — a flat literal fill, so
  it is opaque by construction and reading the style settles it. The pixel version inferred the
  plate's box by re-deriving the layout constants and was wrong twice: 16 "leaks" from the 28px
  corner radius, then 68 from a width estimate 300px short of the real one.
- **Edge ink, dropped.** All six are full-bleed compositions — tiles and washes are *meant* to reach
  the edge — so "ink in the margin" flagged all twelve renders and distinguished nothing.

That is the **third** time on this ticket a check inferred the geometry it was checking and then
blamed the card for it, after the Wall chip's box and round 1's "AA ok" that had measured zero pixels.
The pattern is worth carrying to ticket 10 as a rule: **a check that must guess where the thing it
measures is will keep guessing wrong.** Derive the geometry from the same constants the card lays out
with, or do not run the check.

#### Round 1's dark-versus-light finding, confirmed visually

Rendered rather than argued: in **Halo-light**, **Orbit-light** and **Deck-light** the near-white
Posters — `Snake Body Fluid`, `Morphing Loader` — visibly disappear into the `#F4F4F1` canvas. That is
the 1.06:1 measurement from round 1, made visible. **Light can carry text about the catalogue; only
dark can carry the catalogue.** Dark remains the recommendation, and this round makes the case by
showing it rather than by measuring it twice.

#### Handed to ticket 10

Unchanged from round 1: the counts (298 / 24 / 18) and the weight that a count is a claim a cache
cannot revisit; the claim verbatim; **K = 2.8** and the **37px platform floor** pulling in opposite
directions in the same column; dark; `flexWrap` cannot grid.

New from this round: **`radial-gradient`, `transform: rotate`, `border-radius: 50%` and `box-shadow`
blur all render in Satori; `conic-gradient` throws.** A wash changes a type's contrast, so **type over a
wash must be measured against the wash and not against `--canvas`.** And a small tile is cheap enough
to scatter: 22 tiles at 92×116 are **39 KB in total, 2.7 KB the largest**, which is what makes Halo
and Orbit possible at all — the Wall's eight big tiles cost more than all 22 small ones put together.

### 2026-10-05, round 3 — ramp-dark chosen, and impeccable's rulebook applied

The maintainer chose **Ramp-dark** and asked for *"more variant… use
https://impeccable.style/ make more beautiful and asthetic variants."*

#### What impeccable.style is, and what it said about round 2

A detector with **61 source rules and 6 design-review patterns**. Its CLI
(`npx impeccable detect`) found `overused-font` in `app/globals.css` — **Space Grotesk
is on its overused list**, which is the site's actual typeface — but **reports nothing
on a Satori card**, because it reads `className` and CSS while `ImageResponse` renders
`createElement` with inline style objects and can use neither. So the catalogue was
applied **by hand**, and it is not kind to round 2. Genuine hits:

| rule | what round 2 did |
|---|---|
| `radial-gradient-background-halo` | a bright halo on a dark page — *"a familiar AI background effect… remove the glow when it has no role in the design"* |
| `soft-spotlight-behind-content` | and the halo sat **behind the content** specifically |
| `dark-mode-with-glowing-accents` | `--media-glow` on all 22 tiles — *"a wall of neon"* |
| `hairline-border-with-wide-shadow` | `glow()` was literally a 1px ring **plus** a 60px blur: the rule's own example |
| `hero-metric-layout` | `Stats` was *"a huge number with a small label and supporting stats… a familiar landing-page template"* |
| `extreme-border-radius-on-cards` | radius-28 plates and `999px` pills |
| `images-hidden-under-overlays` | the centre plate covered tiles to buy legibility |
| `monotonous-spacing` | one gap value everywhere |
| `badge-above-the-main-headline` | the wordmark sat above the claim like a badge |

**So the washes came out**, and that is the single biggest change. A radial halo behind
a wordmark is decorative and has no role, which is the rule's entire complaint.

#### The one tension, named rather than hidden

`ai-color-palette` (*"bright cyan on dark backgrounds are familiar AI defaults"*) and
`cream-beige-palette` both indict **this Design's own tokens** — `--acc #6FE3CC` and
`--canvas #F4F4F1`. The map binds every card to `app/globals.css`, so a card cannot
adopt a different accent to satisfy a rule. What the rule actually asks for is
restraint — *"reduce the glow so useful information stands out"* — and that **is**
available without touching a token: `--media-glow` is the tile's own treatment, and a
card may use it **three times instead of twenty-two**. Every variant here does. The
glow became an accent rather than a texture, and that single change is what these look
better than round 2.

#### The six

| | Design | Device | Cost |
|---|---|---|---|
| **1** | **Ramp** ⭐ | the chosen design, cleaned — tiles **abut** into a band rather than floating as confetti | the band is dense; a stranger cannot read any single tile |
| **2** | **Ribbon** | nine tiles on an explicit diagonal, overlapping into a continuous band | the sparsest field at 4.5% coverage — a thin gesture |
| **3** | **Aperture** | the diagonal reversed: tiles funnel **inward toward** the name, so the composition has a destination | the funnel's mouth crowds the claim at small sizes |
| **4** | **Echo** | **one** Poster repeated nine times at falling scale and opacity | repetition implies motion better than a diagonal, but it is one demo repeated |
| **5** | **Stack** | a strict edge-to-edge column; the left half is pure typography | the least dynamic — the diagonal energy is gone |
| **6** | **Ladder** | three offset rungs, a big gap between them and a small gap inside | each rung is one Category's worth of tiles, which is a claim nothing verifies |

**Ramp is what I would build.** It is the chosen idea with the confetti removed, and
removing the glow is what makes the diagonal read as a *band* rather than as noise.

**Echo is the most interesting** and the cheapest: it costs **one image** instead of
twenty-eight, and it says "animation" through repetition, which is the only device here
that does. Round 2's diagonal implied motion with a graphic gesture that says nothing
about time.

The **hero-metric stat triple is gone from every variant** — the rule was right that it
is a landing-page template. Where the counts appear they are one quiet two-line strip.
The claim is set in Space Grotesk **300** at display size: a weight the Design already
ships and nothing on the site reaches for, which is what *"vary size and weight before
adding a second family"* asks for.

#### Two Satori findings that the fixes depended on, both measured

**`overflow: hidden` clips a container's positioned children** — but **not their
`box-shadow`**, and the gap is larger than it looks (`probe/clip-probe.tsx`,
`probe/shadow-clip-probe.tsx`):

| what | reaches outside the clip |
|---|---|
| a child's background | 0px — clipped |
| a **flat** 1px hairline shadow | **0px** — clipped |
| a **blurred** glow shadow | **20px** |
| a blurred glow on a **rotated** child | **43px** |

The 43px is the one that matters and the probe does not produce it: a shadow follows the
child's *rotated* bounding box, which a −8° rotation widens by ~25px per side before the
blur. So **"the tile field is clipped" is not by itself a safety argument**, and the
clearance a card needs is 43px. `FIELD_X` carries that in its arithmetic rather than
assuming the clip is total. (Also found by the probe failing: **Satori requires an
explicit `display: flex` on any div with more than one child** — a hard error, not a
default.)

#### Two audits that were wrong before they were right

Both were caught by looking at the pixels rather than at the code:

1. **"Text overflows into the field" on three variants, at x=619** — one pixel inside the
   boundary. Dumped, those pixels are `[18,22,16]` against a canvas of `[10,11,13]`: the
   **clip's own antialiased edge**. Not text, not a defect. The check now tests the text
   column's **declared** width, which is a fact about the layout rather than a guess
   about where a clip lands.
2. **"Text overflows" on Ramp, 142 rows.** The truth was that Ramp's glow reaches 43px
   and its type ends at 576 — **25px clear**. The check was counting the halo as type.
   Its first replacement (bright + neutral) was then wrong on **every light variant**,
   630 rows each, because on a `#F4F4F1` canvas the *background* is the bright thing.
   The test that works is **contrast against this card's own canvas, threshold 90**:
   `--t1` measures 231, `--t3` 140, the glow's peak **49**.

All 12 renders now pass both checks — no type in the halo's reach, and no empty tile
field. The second check exists because **Ribbon rendered as a diagonal line of faint
empty outlines twice** and nothing said so; a field with no imagery is a silent failure,
because the card still looks like a card.

#### Handed to ticket 10

Everything from rounds 1 and 2, unchanged. New and durable:

- **`overflow: hidden` clips positioned children but NOT their shadows — 20px for a blur,
  43px for a blur on a rotated child.** Any card that separates type from imagery with a
  clip needs that margin.
- **Satori requires explicit `display: flex` on a div with more than one child.**
- **When checking a card for a text overflow, test contrast against that card's own
  canvas, not absolute luminance and not "any non-background pixel".** Both simpler tests
  were wrong here, one of them on all six light variants at once.
- **`--media-glow` is the tile's own treatment, so a card can use it three times instead
  of twenty-two.** That is how a card satisfies "reduce the glow" without departing from
  `app/globals.css`.
- **Space Grotesk is on impeccable's overused-font list.** That is the site's real
  typeface and the map binds every card to it, so it is recorded rather than acted on —
  but it belongs to whoever owns the type system.

### 2026-10-05, round 4 — the first round with a point of view

The maintainer's challenge, and it was the right one: *"But did you used
https://impeccable.style/ — the open graph image that you generated is not good at
all."*

**The honest answer to the first half: partly, and not the part that mattered.**

| | |
|---|---|
| Fetched the site and read `/slop` — the **61-rule detector** list | yes |
| Ran `npx impeccable detect` — found `overused-font` in `app/globals.css`, nothing on the card | yes |
| Applied that list by hand as a critique checklist | yes |
| Used the **skill** — "the missing design vocabulary for agents" | **no** |

The npm package ships only the detector CLI. The vocabulary lives in
`.agents/skills/impeccable/` in the repo, and I had not read it. `bolder.md` and
`typeset.md` are what the six variants actually needed, and they say the opposite of
what I did.

#### What rounds 1–3 were, in impeccable's words

> **bolder.md:** *"The reflex answer, reaching for more effects, is the opposite of
> bold; reject it first."*
>
> **bolder.md:** *"Commit, then clarify. Half-measures read as noise. Make the one
> decisive move completely, then quiet everything around it so the move is legible. If
> every element got louder, the section got flatter."*
>
> **bolder.md:** *"Strip the copy out of your planned section and study the bare
> structure. Does the skeleton still say what this section is and why it matters,
> through hierarchy and the system's devices alone?"*
>
> **bolder.md:** *"A placeholder for an image or artifact names a job, an anchor and a
> piece of evidence, not a cue to drop in a decorative photo; fill that job with
> whatever the subject actually has."*

**The skeleton test failed on all of rounds 1–3.** They were one skeleton six times:
wordmark top-left, a claim, a counts strip, Posters on the right. Strip the words and
they are indistinguishable. That is why "add assets, make it less plain" kept producing
cards that were *plainer* — and round 3, which removed the glow and the washes, got
**quieter**, which is the same failure from the other side: **there was nothing louder
to commit to.**

**And the tiles were decoration.** `bolder.md` asks an image to name a job, an anchor
and a piece of evidence. The job here is specific: *this is a catalogue of real,
running, community-made interfaces and you can see them working now.* At 92px a Poster
is a postage stamp that proves nothing — you cannot read a single control. Meanwhile the
system already owned the decisive move and I had been spending it on thumbnails: **the
site shows Demos full-bleed**, and a Poster is a frame of a Demo.

#### The six, each with one decisive move and a different skeleton

| | Design | Skeleton | The one decisive move |
|---|---|---|---|
| 1 | **Vitrine** | object on a plinth, type beside it | **scale** — one Poster at 700px, uncropped, where the actual UI is readable |
| 2 | **Contact** ⭐ | 5×4 contact sheet, edge to edge | **subordination** — `rnui.dev` typeset *inside* the grid as one cell of twenty |
| 3 | **Specimen** | image band over a rule | **the crop** — one Poster blown to 1200px and cut to 3:1, the one card that crops on purpose |
| 4 | **Foreshorten** | type left, six devices receding | **depth** — different Posters receding like a feed, not one image echoed |
| 5 | **Set** ⭐ | type, full stop | **type as image** — no grid at all; the claim at 88px across four lines |
| 6 | **Field** | type left, solid field right | **completeness** — the ramp committed: 180px tiles edge to edge, no gaps |

**Contact is what I would build.** It is the only one where the structure itself says
"catalogue" — twenty frames of the same roll, and the site's own name is one of them.
**Set** is the best-looking and the cheapest: one 150px image, and the argument is
entirely typographic.

`Specimen` deserves a note because it **breaks a rule this map established**. Ticket 06
decided a Poster is never cropped, and measured `cover` keeping 25% of a portrait
Poster. Specimen crops to 3.23:1 on purpose, and it is defensible *because* it is not
putting the Poster in a device frame — the fragment is the composition, read as a
specimen under glass rather than as a phone. If this is chosen, ticket 06's rule needs
its "never cropped, to fit a device frame" qualifier made explicit.

#### Two layout lessons, both from Satori rather than from taste

1. **A child wraps at its *parent's* width, not the width it was handed.** Vitrine's
   column was `width: 500` and its `Claim` was `width: 520`; the claim broke at 500 and
   stranded *"of"* alone on line 2 while the box it was given said 520 and claimed room.
   **A column and the block inside it must declare the same width.**
2. **`flexGrow` hands out *remaining* space, so a fixed-width sibling silently starves
   whatever follows it.** Specimen's credit line was a `flexGrow` after a 620px claim
   column and received ~150px, clipping `DAEHYEON MUN (문대현)` — measured at **255px** —
   to the letter D. **Nothing flexible goes after a fixed column.**

Plus one measurement worth keeping: **Space Grotesk measures 0.515em per glyph at
weight 300**, rendered and ink-counted (`preview/tmp/measure2.ts`), and every set line
now carries `whiteSpace: nowrap` so a mis-sized line overflows visibly instead of
silently re-wrapping and drawing over the counts.

#### Handed to ticket 10

Everything from rounds 1–3, plus: **a card's type must be measured per line, not
averaged over the claim** — the lines that matter differ by 12%; **a column and its
child must share one width**; **`flexGrow` is not a guarantee of room**; and **the
skeleton test is the cheapest honest check there is** — strip the copy, and if the
structure cannot say what the card is, the design is not finished.

### 2026-10-05 — the maintainer declined: the default card does not change

**Decision: `app/opengraph-image.tsx` stays exactly as it is.** None of the twenty-three
designs this ticket produced (six round 1, six round 2, six round 3, five round 4 — plus
the incumbent re-rendered for comparison) will be built, and the ticket's four prototypes
are reference only.

Recorded plainly, with what it means:

- **What stays live is the slate gradient, `system-ui`, and the claim "343+ animations".**
  The catalogue has **298 Recordings** (round 1), so the number is 45 high and the noun is
  wrong twice — the domain is **Recording** (CONTEXT.md, ADR-0008), and 6 of the 298 are
  Full Apps rather than animations. That is a live inaccuracy on every share of the root
  URL, and it is now a **standing decision rather than an oversight**. It was raised twice
  (round 1's "the count is wrong today", and the permanence finding below); the answer is
  to leave it.
- **The blast radius is wider than `/`.** Ticket 01 established that `/products` is not
  prerendered and serves the root card, filter or no filter — so this card is what a share
  of `/products?category=buttons` shows too.
- **It does not touch the other three families.** Contributor, Recording and Category cards
  are separate routes with their own slots; `app/opengraph-image.tsx` is only the fallback.
  Ticket 05 and ticket 06 proceed unaffected.
- **It settles part of ticket 10's open question.** The map was carrying *"What happens to
  `app/opengraph-image.png` and `app/twitter-image.png` — ticket 01 established that all
  three emit and which one wins. Ticket 10 decides the fate of each."* All three now have
  their answer for the root slot: **they stay.** Ticket 10 records the fact rather than
  choosing it.

#### What this ticket is still worth

Not the designs. The measurements, which were made about the catalogue rather than about any
one layout, and which every remaining card depends:

- **Dark, not light** — the same eight Posters measure worst **2.27:1** on the dark canvas and
  **1.06:1** on the light one, and 64 of 297 Posters are >90% near-white. Light can render
  *text about* the catalogue; only dark can render the catalogue.
- **The 37px platform floor** — a card is 1200px wide and Slack shows it at 360, so anything
  below 37 card px lands under 11px on the reader's screen. It bounds the small steps from
  *below* while K = 2.8 bounds the caption from *above*, in the same column.
- **A count on a card is a claim a cache cannot revisit** — ticket 03 measured LinkedIn
  shares as permanent. This is the sharpest reason not to put a count on the Recording,
  Contributor or Category card, and it now also explains the state of the root card.
- **18 Categories cannot share a card at a readable size**, so a Category card must name
  exactly one — which is why ticket 08 is cheap rather than expensive.
- **Satori's real limits**, measured rather than assumed: `radial-gradient`, `transform:
  rotate`, `border-radius: 50%` and `box-shadow` blur all render and `conic-gradient`
  **throws**; `overflow: hidden` clips positioned children but **not their shadows** (0px
  flat, 20px blurred, **43px on a rotated child**); an explicit `display: flex` is
  **required** on any div with more than one child; a child wraps at its **parent's** width;
  and `flexGrow` hands out only *remaining* space, so a fixed sibling silently starves it.
- **Space Grotesk measures 0.515em per glyph at weight 300**, rendered and ink-counted —
  and lines differ by 12%, so type must be measured **per line**, never averaged.
- **The skeleton test**: strip the copy, and if the structure cannot say what the card is,
  the design is not finished. That one check would have caught rounds 1 through 3.
