# The Contributor card, several ways

Status: resolved
Type: prototype
Blocked by: 14

## Question

**The card behind every `/products?contributor=<name>` link: the Contributor's name, their live count,
and something worth looking at. Produce several genuinely different designs and let one be chosen.**

The card is for the person whose work it is. It lands in a group chat or a timeline where the sender
has just said this person made something good — so the card's job is partly to confirm it and partly
to make the receiver want the whole set. The number is settled as present (map, Decisions so far).
What is not:

- **Does the card show one of the Contributor's Posters?** The map flagged this as fog rather than a
  ticket because it is not yet clear it arises. Answer it here. A Contributor has between 1 and ~40
  Recordings, and which one would stand for them is a question with taste in it — most-views? newest?
  first in the catalogue? **No Recording has a canonical "best"**, so any of these is an invention and
  must be put to the maintainer as one.
- **What does the count say?** "12 animations", "12 Recordings", a bare numeral against the rail's
  own metric type? `app/recording/[id]/page.tsx` prints contributor totals in the Design's metric step;
  the card should not invent a third spelling.
- **Where does the name sit, and what happens to a long one?** `Enzo Manuel Mangano ( Reactiive )` and
  `Konstantinos Efkarpidis` are the names that broke truncation on `/contributors`
  (`app/contributors/contributor-rows.tsx`), at 12.5px on a full-width row. At card scale, on a phone,
  in a chat client that clips the bottom-right corner — several of these 23 names will not fit. Decide
  what happens, and show a long name in the render rather than only a short one.
- **Is the initials block reused?** `lib/contributor-initials.ts` is what the site draws for a
  Contributor elsewhere, and it is a pure function with no catalogue import — usable from a card route.

Produce **four or five rendered designs at 1200×630** in this Design's palette and type, behind a live
preview route, flipping through the real range of names rather than one flattering example. Render at
least one with `Enzo Manuel Mangano ( Reactiive )` and one with `Daehyeon Mun (문대현)` — the second
is the name every slugifier on this repo has destroyed (`lib/contributor-match.ts:27-31`), and a card
that drops the Hangul is not showing the Contributor.

## Notes

- **The count is live at request time** (map, Decisions so far). A design whose number is baked into a
  font choice — tabular figures, a fixed-width slot — is preferable to one that is not, because a
  one-digit-to-two-digit change must not reflow the card. `font-variant-numeric: tabular-nums` is
  unlikely to survive Satori; verify rather than assume.
- **Do not mint a Contributor slug.** ADR-0009. The image key may be a hash of the folded name; the
  page address is `/products?contributor=<exact name>` and stays that way.
- The design for the **Category card** is ticket 07 and reuses whatever this ticket settles about
  shared structure — name, count, metric type, long-name handling. Settle those here rather than twice.
- Do not edit any route. Nothing ships from this map.
## Answer

**Five designs, fifty renders** — 5 variants × 5 real Contributors × both modes, as real
`ImageResponse` output. Preview: [`../preview/gallery-contrib.html`](../preview/gallery-contrib.html).
Rebuild: `pnpm tsx .scratch/social-cards/probe/ticket05/tiles.ts` then
`pnpm tsx .scratch/social-cards/preview/render-contrib.tsx`. Probes:
[`../probe/ticket05/name-widths.ts`](../probe/ticket05/name-widths.ts).

The cast spans every axis rather than flattering one: **138** Recordings / 11 Categories /
the widest name · **31** / 12 Categories / the broadest spread · **Daehyeon Mun (문대현)** ·
**Aswin C**, the shortest name · **Hubert Ryan**, the one-Recording minimum.

| | Design | Betting on | Cost |
|---|---|---|---|
| **1** | **Name** | the name at **68px**, full card width, uncut | says nothing about the work; one Poster as a stamp |
| **2** | **Shelf** | four of their Posters at 250px, readable | picks four arbitrarily from 138 |
| **3** | **Field** | **density scales with the count** — 138 fills the card, 1 is one tile | the name drops to 29px to clear the grid |
| **4** | **Metric** | the count as the hero — **138 is a fact about a person** | no work shown at all |
| **5** | **Initials** | the site's own initials block promoted to 190px | the disc is decoration; a grid is stronger evidence |

**Initials is what I would build**, and it is the cheapest: it reuses
`lib/contributor-initials.ts` unchanged, needs no invented rule about which Poster
represents anyone, and its skeleton — a person on the left, their work on the right —
says what the card is before a word is read. **Name** is the strongest single statement
and the one I would ship if the count matters more than the work.

### The four questions, answered

**1. The name never truncates.** All 24 real names ink-counted at five sizes
(`probe/ticket05/name-widths.ts`): the spread is **4.4×** — `Aswin C` is 211px at 60px,
`Enzo Manuel Mangano (Reactiive)` is 930px — so **no single size suits every name**.
But a card is 1200px wide, Slack crops 66px off each side, and that leaves **1068px of
safe width**, which the widest name clears at up to **68px**. So the answer is not
ellipsis or a second line: **68px on one line, measured**. This is the opposite of ticket
06, where the name shared an 860px column with a caption and `M2`'s 543px forced a
decision. A Contributor card has no caption, so the name has the card.

**The ceiling is a function of what else is on it.** At 68px the widest name needs 1054px
of 1068 — so a name-only card holds it and *nothing else can*. With a 176px Poster beside
it, `1068 − 176 − 40 = 852px` puts the same name at **55px**; a 460px column puts it at
**29px**. Every variant now asks `fitName(columnWidth)` rather than choosing a size, which
is the only reason this stopped being a recurring bug.

**2. "N Recordings", singular for one.** The domain's noun, never "animations" — the root
card's word, and wrong there too. **"1 RECORDING · 1 CATEGORY"** is a real render
(`out-contrib/Name--Hubert-Ryan--dark.png`), not a nicety: Hubert Ryan has exactly one
Recording, and "1 Recordings" would be visibly machine-made on a real share.

**3. Which Poster: their most recent.** Not an invention — `data/recording.ts:122` already
sorts `created_at` descending, so this is the order `/` serves. Most-viewed would need
live Firestore at request time; "first in the catalogue" is arbitrary.

**4. The initials block is reused, unchanged.** `contributorInitials` is a pure function
with no catalogue import, so a card route can call it: `Thomino` → `T`,
`Daehyeon Mun (문대현)` → `DM`, `Epicode | 0xV` → `E`.

### The finding that matters more than the design

**A newest-first Poster makes the card's bytes mutable, and the image key cannot be the
Contributor's name alone.** Ticket 03 measured that an existing LinkedIn share is
**permanent**; RFC 9111 §4 makes a *changed URI* a fresh cache entry but an unchanged one
a cache hit. The map decided the image key is a hash of the folded name — so no slug is
minted (ADR-0009) and `/products?contributor=<exact name>` stays the address. But then,
when that Contributor's next Recording lands, **the render changes and the URL does not**,
and every share made before it keeps the old Poster forever. Fix: **put the chosen
Recording's id in the key.** **This is ticket 07's to settle and it did not know it needed
to.**

### A distribution fact no design can fix

**One Contributor is 46% of the catalogue.** Enzo has 138 of 298; the next has 31; then a
long tail to 1. Any card that scales its density with the count is therefore scaling it
mostly for one person, and a `Field` layout shows that asymmetry honestly rather than
hiding it. Recorded because it bears on whether the Contributor card is worth building at
all, which is a question the count answers better than a design does.

### Verified rather than looked at

- **Name widths**: all 24 names, five sizes, rendered and ink-counted — never estimated
  from a character count, because the set includes Latin-ext, Hangul, a `|` and two
  28-character names, and an average derived from one string is wrong for the other 23.
- **The widest name renders whole** at 68px on a name-only card and at 29px beside a grid —
  both confirmed in the renders, after two clipping defects that a sheet thumbnail had
  made me misdiagnose as an overlap.

### Three defects worth recording, all Satori

1. **`maxWidth` does not stop clipping at the *resolved* width.** `Name` asked for 852px in
   a `space-between` row and received 560, clipping "Enzo Manuel Mangano (Reacti" mid-word.
   A flex child with no width is sized by what is left after its siblings.
2. **`width: "100%"` inside a `flexGrow: 1` parent resolves against the parent's free
   width** and swallows the card — Shelf's four 250px tiles became four ~290px letterbox
   strips running off the right edge. Ticket 06 documented this; this is its second
   occurrence on this map.
3. **A `\u00b7` written as a bare escape renders as the literal text** `\u00b7` — on all
   fifty renders at first. Separators now come from a named constant.

### Handed to ticket 08 (the Category card), which reuses this

The shared structure settled here rather than twice: **the count's spelling and singular**;
**the metric type** (mono label step, never a display numeral except in `Metric`, where the
number *is* the news); **`fitName(columnWidth)` as the only way to size a name**; **no
truncation anywhere**; **Slack's 1068px safe width as the real constraint**, not the card's
1200; and **`overflow: hidden` clips positioned children but not their shadows** — 0px flat,
20px blurred, **43px on a rotated child** — which is why every column here is set 44px
clear of its neighbour's art.

**And to ticket 10:** the image key must include the chosen Recording's id, or a
newest-first Poster freezes every existing share.

## Comments

### 2026-10-05 — Initials, without the disc

The maintainer chose **Initials** and asked for it **without the disc**. The skeleton
they liked is kept — a person on the left, their work on the right — and the one element
they did not is gone. Three answers, differing in what replaces the disc's anchor
(`preview/out-contrib/Plain-*`, `PlainGrid-*`, `PlainShelf-*`; the disc version is kept
as `Initials--*` for comparison):

| | Replaces the disc with | Left column | Name at |
|---|---|---|---|
| **Plain** | nothing — the name becomes the anchor, set larger | 560px | **36px** |
| **PlainGrid** | a bigger grid; the column narrows and the name with it | 430px | **27px** |
| **PlainShelf** ⭐ | nothing, and the name takes the **full card** with the work beneath | 1068px | **68px** |

**PlainShelf is the one to build.** Removing the disc is a **trade**, not a subtraction:
the disc was 190px of `--panel` giving the left column a visual anchor, and without it the
column has no centre of its own — so the name has to become that anchor, which costs it
size. PlainShelf recovers almost all of the loss by giving the name the whole card and
putting the work under it, so the name lands at the same **68px** the disc version had to
fight for.

The maintainer's call is also defensible on impeccable's own terms, which is worth
recording: a 190px circle is decoration, and `extreme-border-radius-on-cards` and
`hero-metric-layout` both have something to say about it. What is lost is a piece of the
site's identity — `contributorInitials` is what the Recording detail and About page draw,
so the Contributor card stops looking like those two. That is a real loss and it is the
maintainer's to weigh.

### The card must be regenerated when a Recording is added — and the mechanism is not free

The maintainer noted that the card **has to be regenerated if a new Demo is added for that
Contributor**. That is right, and it is sharper than it sounds, because the repo already
establishes three things that make the obvious implementation wrong:

1. **Next already hashes the image URL** — measured on the built HTML as
   `/opengraph-image?ad14766c…` (`app/contributors/page.tsx:41`). So a card's bytes changing
   does **not** by itself change its address, and naming the URL by hand is explicitly called
   a "second spelling of it that rots the day the file changes."
2. **A route that declares its own `openGraph` block loses the image entirely.** Measured on
   the same file: `/aboutus`, which exports no metadata, carries `og:image` plus its alt,
   type, width and height; `/contributors`, which declares `openGraph: { title, description }`,
   carries **none of the five**. The inherited image is replaced wholesale.
3. **The page address cannot change.** ADR-0009 refuses to mint `/contributors/[slug]`, so
   the address stays `/products?contributor=<exact name>` — a **stable** URL, forever.

So the requirement is: **the chosen Recording ids must be part of the image key.** With a key
of the folded name alone, a Contributor's 139th Recording changes the render but not the URL,
and by RFC 9111 §4 every share already made keeps the old bytes — permanently, since ticket 03
measured LinkedIn shares as permanent. **The card would silently show stale work forever, and
nothing would report it.**

Two consequences worth writing down before ticket 07 starts:

- **`/products` must not declare a partial `openGraph` block.** Point 2 is a live trap on the
  exact route this card hangs off. Either it declares the full block *including* `images`, or
  it declares none and lets the inherited image through.
- **The count changes too, not just the tiles.** So the same shared link shows a different
  number over time. That is inherent to the "the count is present" decision the map already
  made, and it is the same trade ticket 03 settled when it chose render-live over
  build-time-and-frozen.

**This is ticket 07's to settle.** It now carries a hard requirement it did not have when it
was written: *the image key is not the page key.*

### 2026-10-05 — Light mode, then: the texts are too small, and here is why

**First, a correction I owe.** The maintainer said *"let's use the plain no disc, light
version"* and I built **`PlainShelf`** — the same Initials skeleton with the disc removed and
the name moved full-width above a bottom shelf. They meant **`Plain`**: the card with
`rnui.dev`, the name and the count in a **560px column on the left** and a **3x2 grid of six
152px Posters on the right**. They sent a screenshot of it to make the difference unambiguous
and I had already rendered the wrong thing twice. The first version of this comment measured
the wrong layout's ceilings against Slack's 1068px, which is not the constraint on this one.

**All seven other skeletons are now deleted** — `Name`, `Shelf`, `Field`, `Metric`,
`Initials`, `PlainGrid`, `PlainShelf` — along with their renders. What remains is **Plain, in
light mode, at five text sizes**: `preview/out-contrib/`, gallery at
`preview/gallery-contrib.html`. Keeping dead variants is how a prototype becomes a museum.

### The texts are small because the column is 560px, and that is measured

**Slack's 1068px safe width is not the constraint on this layout — the 560px column is**, and
every line of type on the card lives inside it. Rendering and ink-counting the real strings
in the real column (`probe/ticket05/plain-ramp.ts`):

| | one-line ceiling in 560px | why |
|---|---|---|
| the name | **36px** | `Enzo Manuel Mangano (Reactiive)` is 1050px at 68px, so **556px at 36px — 4px of margin** |
| the count | **30px** | `138 RECORDINGS - 11 CATEGORIES` is 29 mono characters at 0.638px per px of size, so 592px at 32px |
| the mark | no ceiling | 125px wide at 34px, 192px at 52px |

**So at Slack's 360px — a 30% scale — the shipping card sets its name at 10.8px and its count
at 7.8px.** The shelf layout measured 20.4px for the same name. That **1.9x gap is the entire
difference between the two layouts**, and it is why this card reads as small while looking
correct at full size. The maintainer was looking at a 1200px render; everyone else sees 360px.

The count fails twice, as it did on the shelf: **7.8px on screen is below any legible size,
and its words are `t3` at 4.9:1** — the only text on the card not comfortably readable. So the
smallest text is also the faintest. Promoting the words to `t2` is **6.9:1**.

### The five scales

| | mark | name | name lines | count | count lines | words | |
|---|---|---|---|---|---|---|---|
| **Current** | 34 | 36 | 2 | 26 | 1 | `t3` | the control, defects included — name 10.8px, count 7.8px |
| **Read** ⭐ | 40 | 44 | 2 | 38 | 2 | `t2` | the first clean, legible step |
| **Loud** ⭐ | 48 | 52 | 2 | 44 | 2 | `t2` | 526px is the widest name line, of 560 |
| **Max** | 52 | **56** | 2 | 50 | 2 | `t2` | the two-line ceiling; 60px takes **three** lines |
| **Wide** | 52 | 48 | **1** | 50 | 2 | `t2` | **not this layout** — grid drops to 2x2 of 132px |

**`Read` or `Loud` is the one to build.** `Max` buys name size by making the count the second
loudest thing on the card, which starts to compete with the work; `Read` gets 82% of the
legibility gain for a third of the size. **`Wide` is arithmetic, not an option:** a name on one
line of `w` costs `15.45w` of column, and the card must hold `66 + column + 43 (shadow
clearance, this ticket's own measurement) + grid + 66` inside 1200. With the smallest grid
worth having — 2x2 of 132px, 276px — that leaves `15.45N <= 749`, so **N <= 48**. The first
attempt at this scale asked for 68px in a 1068px column and the name ran straight under the
tiles; it never could have worked, and **48px is what the one-line guarantee is actually worth
here.**

### Two break bugs, both found by rendering rather than by reasoning

**1. CSS breaks CJK between any two characters.** At 56px, `Daehyeon Mun (문대현)` came out as
`Daehyeon Mun (문대` / `현)` — split between the second and third syllable. `lineBreak:
"strict"` changes nothing (measured, `probe/ticket05/cjk-break.ts`). **`wordBreak: "keep-all"`
fixes it and Satori honours it**, moving the break to `Daehyeon Mun (` / `문대현)`.
`lib/contributor-match.ts:27-31` exists because every slugifier on this repo has already
destroyed that name; **a card that breaks it mid-word has done the same thing again.**

**2. But `keep-all` trades one bad break for another, so it is a scale's decision.** At 36px
it turns the Hangul whole and orphans a *single character* instead:
`Enzo Manuel Mangano (Reactiive` / `)`. And Satori's break point is **not monotonic in the
font size**:

| | the break it chose | |
|---|---|---|
| 36px | `Enzo Manuel Mangano` / `(Reactiive)` | orphan |
| 44px | `Enzo Manuel Mangano (` / `Reactiive)` | clean |
| **52px** | `Enzo Manuel Mangano` / `(Reactiive)` | **orphan — the size *above* a clean one is worse** |
| 56px | `Enzo Manuel` / `Mangano (Reactiive)` | clean |

**So "pick a bigger size" does not reliably fix a bad break**, which is the same lesson the
width probe gave twice on this ticket: no single size suits all 24 names, and the only honest
answer is to measure each one. The fix is to stop leaving it to Satori — **bind the
parenthetical to the word before it with `\u00a0`**, so the only break points left are the
spaces before it. 52px then breaks like 56px. `who.name` is untouched, so nothing about the
image key moves, and the space is a non-breaking one rather than a name change.

**`Current` keeps the shipped behaviour, defects included**, because a control with its bugs
fixed is not a control.

### Carried forward

- **`t3` is 4.9:1 on `canvas` and is only for text at 40px and up.** Every card on this map
  should check its smallest text against that floor rather than against taste. Measured for
  the light palette: `t1` 16.4:1, `t2` 6.9:1, `t3` 4.9:1, `acc` 5.4:1.
- **`keep-all` belongs to every card that sets a Contributor's name.** It is a one-property
  fix and the alternative is shipping a mangled Hangul name to anyone who shares a link.
- **`\u00a0` to bind a trailing parenthetical** is a card-level rule, not a per-name patch.
- **A prototype that measures the wrong layout is worse than one that measures nothing** —
  the first two passes here answered the right question about the wrong card.

---

## Round 2 — the Fan card (opened by the maintainer, 2026-10-06)

Status: **open — five rendered, none chosen**
Type: prototype

### What changed and why

The maintainer supplied a reference image and asked for a **fan of Posters on the LEFT and a
type block on the RIGHT** — the inverse of the `Plain, no disc` layout this ticket settled —
and said twice to keep that arrangement. So this round keeps it: the fan is always left, and
the right column always carries exactly three things in order — `rnui.dev`, the name, the
count. What varies is **the fan's geometry and the type scale**, nothing else.

Preview: [`../preview/gallery-fan.html`](../preview/gallery-fan.html) ·
Renders: [`../preview/out-fan/`](../preview/out-fan/) ·
Verify: [`../preview/verify-fan.tsx`](../preview/verify-fan.tsx)

### The five, and the trade they make explicit

| | fan | how much of each card shows | right column | name | Posters legible |
|---|---|---|---|---|---|
| **Fan** | 5, arc | 17% | 693 | **60px** | 1 of 5 |
| **Stair** | 4, climbing | 30% | 624 | **56px** | 3 of 4 |
| **Deck** | 8, tight | 13% | 733 | **64px** | 2 of 8 |
| **Slab** | 3, loose | 36% | 590 | **52px** | 3 of 3 |
| **Drum** | 1–6, by count | 16% | 704 | **60px** | 1–6, all |

**A wider fan shows more of each Poster and costs type; a tighter fan buys type and turns the
Posters into texture.** That is the whole argument between them, and it is now a number on
each card rather than an adjective.

### Where most of the size came from — and it was not the fan

**The card owns the name's break.** A trailing parenthetical here is always an *alias*, so it
is emitted as its own block and Satori is never asked to choose a break point.

That is a fix, not a preference. With `keep-all` **plus** a `\u00a0` binding — both inherited
from the settled layout — the widest name still broke as `Enzo Manuel Mangano (` /
`Reactiive)`, orphaning the bracket. **`fan-break.tsx` measures all four combinations and
neither CSS setting fixes both breaks alone.** Owning the break makes an orphan *impossible*
and makes `(문대현)` unsplittable without needing `keep-all` at all.

Measured across **all 24** real names (`fan-ceiling.tsx`), largest size at which every name
keeps each part on one line:

| right column | settled card | this card |
|---|---|---|
| 556–560px | 36px | **48px** |
| 590px | — | **52px** |
| 624px | — | **56px** |
| 693–704px | — | **60px** |
| 733px | — | **64px** |

**Every one of those ceilings is set by `Konstantinos Efkarpidis`** — 23 characters, and the
only long name with no parenthetical, so it is measured whole and cannot be given a second
line. He is not in the five-Contributor cast and he decides the size on all five variants. The
two names that broke the settled card (`Arnaud Dellinger (evening kid)`, a two-word alias, and
Konstantinos, no alias) were never in that cast either.

### Three defects only a render or a guard found

1. **A rotated card's corner swings a full height, not half.** The first overhang maths used
   `w·AR/2` and put the fan's leftmost ink at **x=12** — 54px inside the 66px Slack crop, so
   the outer card was cut off on every share. `verify-fan.tsx` caught it; the fan is now inset
   by its own left overhang **plus** the shadow's reach, because on a fanned card the outermost
   ink is shadow.
2. **A shortfall padded with empty slots reads as broken images.** Hubert Ryan has one
   Recording; drawing him as one small card inside four pale rectangles looked like four
   failures to load. **The fan's footprint is now fixed and the cards inside it grow to fill
   it**, so a one-Recording Contributor gets one Poster shown properly.
3. **The alias competed with the name.** At the same size in the same `--t1`, `(Reactiive)`
   read as a second equal line. It is now 0.6× in `--t2`, which is what tells a reader which
   line is the person.

`verify-fan.tsx` renders **24 names × 5 variants = 120 name blocks** plus full cards, and fails
on any wrap, any overflow, or ink outside the safe area. Its own first version passed while
detecting **no ink at all** — `sharp`'s `resolveWithObject` puts channels under `info`, so
every index was `NaN`. A guard that cannot fail is worse than no guard; it now fails when it
finds nothing.

### Carried forward

- **`zIndex` does not exist in Satori.** Overlap order comes from DOM order. Measured, not read
  off a list — a probe ordering by `zIndex` rendered byte-identically to DOM order.
- **`transform-origin` does work** (`bottom center` ≡ `50% 100%`, byte-identical ink), so a
  fan is CSS rather than trigonometry.
- **The break point is still not monotonic in size.** 68px fits two lines in a 680px column;
  72px takes three. Every size is measured.
- **A type size must be derived from its column, never stored beside the geometry.** Stored, it
  went stale in four variants at once when a fan's width changed, and `ImageResponse` renders an
  oversized name happily rather than complaining.
- **Unmeasured is not "small".** A ceiling table keyed on round numbers left one variant's
  column with no entry and `ceilingFor` answered `0`. The renderer now fails on an unmeasured
  column.

### The maintainer chose `Deck`, and overrode the noun (2026-10-06)

**Chosen: `Deck`** — 8 Posters, tightest fan, right column 733px, name at the measured
**64px** ceiling. It was also the recommendation: on the *median* card (5 Recordings — half the
contributors have 5 or fewer, and 2 of 24 hold half the catalogue) it is one of only two
variants whose trailing Posters stay recognisable, and it is the only one that spends the
count's width on type rather than on slivers.

**The noun is now `ANIMATIONS`, not `RECORDINGS`.** The maintainer's explicit override of what
this ticket settled, after being told. Scoped to `Deck` alone via `Variant.noun`; the other
four renders still read `RECORDINGS` because only the chosen card was asked to change.

- **`ANIMATIONS` is 8px NARROWER than `RECORDINGS`, not identical.** Both are 10 characters and
  the line is set in JetBrains Mono, so the widths *ought* to match — measured, they do not
  (288px → 280px at 32px), because that font's glyph advances are not uniform. Shorter is safe,
  so nothing reflows and no size was re-measured. Worth recording because the assumption was
  reasonable, was stated as fact in the first draft of this note, and was wrong.
- **Singular is real, not theoretical:** `1 ANIMATION` is a render (`out-fan/Deck--Hubert-Ryan.png`).

**One consequence to keep in view:** this card's wording now differs from the site's glossary.
`CONTEXT.md` and ADR-0008 name the domain noun **Recording**, and `data/catalogue.ts`,
`lib/contributor-match.ts` and the `/contributors` page all still say Recording. The card is
the one surface that says animation. That is a legitimate editorial choice — the card speaks
to a stranger in a chat client, the rest of the site speaks to someone browsing — but it is a
divergence, so it is written down rather than left to be rediscovered.

**Still to do, and NOT started:** nothing under `app/` has been touched. The Fan card is a
prototype; wiring it to `/products?contributor=…` is a separate effort and is waiting on the
maintainer's go-ahead. When it happens, ticket 07's open question applies — the image key needs
the chosen Recording's id in it, or a share freezes the fan it was made from.

---

## SHIPPED — `Deck`, 2026-10-06

The maintainer chose `Deck` and approved implementation. This ticket is no longer a prototype.

| | |
|---|---|
| Card | `lib/og-contributor-card.tsx` — the `Deck` geometry, unchanged |
| Route | `app/api/og/contributor/route.ts` — `runtime: nodejs`, `dynamic: force-dynamic` |
| Address | `lib/og-contributor-url.ts` — the cache key and the absolute URL |
| Wired | `app/products/page.tsx` `generateMetadata`, only when `?contributor=` is present |
| Guard | `tests/og-contributor-card.test.ts` — 13 invariants |
| Prototypes | `prototypes/og-cards/` — all five variants, committed, re-selectable |

**Verified against a production build**, not only in dev: card `200 image/png`, `og:image` and
`twitter:image` both emitted and pointing at it, `cache-control: public, max-age=0,
must-revalidate` with **no `etag` and no `last-modified`**, an unknown name `404`, and the route
listed as **`ƒ` (Dynamic)** in the build output — which is the render-live requirement, since a
statically-optimised card would freeze its count at build.

**Nothing existing moved.** Unfiltered `/products`, `/`, `/recording/[id]` and `/contributors`
all still serve exactly what they served before; `generateMetadata` returns `{}` unless
`?contributor=` is present.

### Four things that only running it could find

1. **`zIndex` does not exist in Satori** — measured, twice now. Overlap order is DOM order.
2. **Font files are named `<family>-<weight>.ttf` but Satori matches on family alone.** The first
   version passed `load("SpaceGrotesk", 400)` and built `SpaceGrotesk.ttf`, so every card 500'd.
3. **`ArrayBufferLike` is not `ArrayBuffer`.** `Buffer.buffer.slice()` hands Satori a value that
   includes `SharedArrayBuffer`, which it cannot use. `new Uint8Array(b).buffer` is what
   narrows it.
4. **ADR-0009's folding rule already existed** in `lib/contributor-match.ts`, and this feature
   had re-implemented it three times. The third copy folded for the cache key but matched
   *exactly* for the Recording id, so a mis-cased name produced a key that could never move when
   the fan changed. `tests/og-contributor-card.test.ts` caught it; the fix was to import the
   existing `existingContributor` rather than patch the symptom.

### Not built, and why

**Renditions.** `CONTEXT.md` and ADR-0012 describe a pre-converted sibling per Poster, which is
the better shape for a card requested often. It needs a publish step against the R2 bucket —
`public/thumbnails/` is gitignored and the Posters live on R2 — so it is a credentialed
operation, not something a card route should do. The route fetches AVIF from the CDN and
converts with sharp per request, memoised per process. Bounded, and paid rarely: Slack caches
~30 minutes and LinkedIn shares are permanent.

**The Posters are cropped to 1:1.26, keeping the top**, because that is what the approved renders
showed — the sources are 0.46-ratio phone screenshots, so this discards roughly the middle 58%
of each. A known cost, measured at ticket 06. The full ratio would need the fan re-derived, and
is the first thing to try if this card is ever revised.
