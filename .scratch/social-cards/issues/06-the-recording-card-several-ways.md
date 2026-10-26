# The Recording card, several ways

Status: resolved
Type: prototype
Blocked by: 14

## Question

**Pasting a `/recording/<id>` link shows that Recording's Poster — already, today,
`app/recording/[id]/page.tsx:41-50` — as a bare AVIF with no text on it. Produce several designs that
put it in this Design, and decide whether compositing the Poster is even the right shape.**

The brief was "a screenshot of the demo, maybe the poster, with some text". The existing behaviour is
the Poster alone, and a bare AVIF at 1200×630 is a tall thin image letterboxed into a wide frame, so
the Poster alone is already a poor card. That is the finding this ticket starts from.

- **How does a 0.46-ratio Poster sit on a 1.91-ratio card?** The capture standard is **0.459954**
  (`.scratch/demo-capture-ratio/map.md`), and 171 of the catalogue's Demos are phone-shaped around
  0.44–0.50. Every Recording card therefore has a vertical image and a horizontal frame. Side by side
  (text left, device right), overlaid (Poster full-bleed with a scrim and text on it), or framed
  (device inset in a `panel` with a border) are three real answers, and only the overlaid one is a
  question about legibility.
- **What text, and whose?** `app/recording/[id]/page.tsx:42-43` already builds the pair —
  `${caption} — ${contributor}` for the title, and `${caption}, a ${category} demo by
  ${contributor}` for the description. `Recording.caption` is community-supplied free text and varies
  from a few characters to a long phrase. **What happens when a caption will not fit**, on a card with
  a fixed safe area and no way to wrap across the device frame?
- **Should the Category and Contributor appear on the card at all**, given the page is one click away
  and the Recording *is* one of that Contributor's? Or is the card only the caption and the visual?
- **Is the Poster the right image?** It is the frame two seconds into the Demo
  (`scripts/generate-posters.ts:38`), which may be a blank sheet. Nothing decides this today; the map
  did not chart it because it cannot be decided until a card exists to judge it on.

Produce **four or five rendered designs at 1200×630**, with the Poster composited at its true 0.459954
ratio, behind a live preview route. Use at least three real Recordings with different caption lengths
and different hues, so the design is judged on the range rather than on the flattering one.

## Notes

- **`Recording.hue`** is already measured for 240-odd tiles (`lib/poster-hue.ts`), so a per-Recording
  accent is available and free. Whether a card should use it — the Design's accent is one green — is
  one of the questions here.
- **Satori cannot blend.** An overlaid text needs a solid scrim or a per-block opacity; `mix-blend-mode`
  and `filter` are absent (ticket 02). A scrim over a busy Poster can fail contrast, and that has to
  be measured rather than eyeballed.
- **The Poster is AVIF and the renderer refuses AVIF — settled by ticket 14, not by this ticket.**
  A card here composites a JPEG **Rendition**, not the Poster: Satori's allowlist is
  `[png, apng, jpeg, gif, svg+xml]`, so an AVIF renders a **blank** card with no error. The four other
  constraints this ticket inherits, all established there: renditions are **1200×630, 25 KB average**; a
  missing image is a **designed hue-tinted panel**, not a hole; **215 of 297** Recordings carry a measured
  `hue` and the rest take `--tile-hue`; and the capture ratio is **0.4598** against a **1.91** card.
  See [Can a card show a Poster at all](14-can-a-card-show-a-poster-at-all.md) and ADR-0012.
- Nothing ships from this map. Do not edit `app/recording/[id]/page.tsx`.

## Answer

**Five designs, rendered as real `ImageResponse` output rather than HTML** — a card drawn in a browser
would show devices that silently drop the day it is implemented. Thirty renders: five variants × six
real Recordings. Preview: [`../preview/gallery.html`](../preview/gallery.html) (open it directly; arrow
keys flip variants). Rebuild with `pnpm tsx .scratch/social-cards/preview/render.tsx`. Probes:
[`../probe/ticket06/`](../probe/ticket06/).

| | Design | Betting on | Cost |
|---|---|---|---|
| **A** | **Device** — Poster in a phone shell on a plinth, text left | the Poster reads as a screen in motion | 604px text column, so **no initials block** (see below) |
| **B** | **Bleed** — Poster cropped full-bleed, scrim, text over it | the Poster *is* the card | the crop shows **25%** of a portrait Poster; scrim must be opaque under the type |
| **C** | **Stage** — Poster centred above, caption beneath | the Poster as a specimen, the detail page's composition | smallest Poster (250px) of the five |
| **D** | **Split** — Poster at true ratio right, wide text column left | caption leads, Poster is evidence and is **never cropped** | rail takes 820px, Poster 470px |
| **E** | **Poster-first** — Poster is the whole card, one quiet line of type | a share is a picture of the animation | most minimal; says least |

**D is what I would build**, and the reasons are the measurements rather than the taste: it is the only
variant that shows a Poster uncropped *and* holds the catalogue's longest caption *and* the longest
Contributor name. A is a close second and reads best at small size.

### The four answers the ticket asked for

1. **Is compositing the Poster the right shape? Yes — but never cropped.** `object-fit: cover` on a
   0.477 Poster in a 1.905 frame keeps **25%** of its height: the status bar, the home indicator and the
   device's rounded corners are all cut away, and what survives is a colour field. Rendered
   (`probe-out/C1-cover.png`), it does not read as a phone. That retires B and E as *primary* designs
   and is why A, C and D all letterbox instead.
2. **What text, and whose? Caption + Contributor's name, and the Category as the `label` step.** All
   five carry all three. The name is not optional — a Contributor *is* their name string (`CONTEXT.md`)
   — and it is the one field that must never be cut. The Category is cheap in the `label` step and gives
   a stranger context they would otherwise have to click for.
3. **What happens when a caption will not fit? It wraps, into a fixed three-line box.** Satori's text
   wrapping is real, so nothing is truncated. The box is `height`, not `maxHeight`, which enforces the
   bound (no line-clamp exists) *and* makes the text block the same geometry for a 5-character caption
   and a 36-character one. Two things this buys, the second unexpected: a card's composition does not
   change with its caption, and it makes each glyph's backdrop measurable (see 4).
4. **Is the contrast question real? Yes, and it was the largest single failure here.** Measured, not
   eyeballed — see below.

### The type scale, bounded by the catalogue rather than by taste

The seven `fontSize` steps are sized for a browser at 1×. A card is 1200px wide and is *seen* at ~400px
in a chat client, so a literal `detail` (36px) lands at ~12px on the reader's screen. The steps are
therefore used as ratios, scaled by **K = 2.8**.

K is **bounded above by the longest caption that exists**, and the bound is measured rather than
guessed: 290 distinct captions, the longest `Spread Cards Effect ( Color Swatch )` (36 chars). At
K=3.16 — the geometrically "correct" 1200/380 — `detail` is 114px and that caption needs **five** lines,
and since Satori has no line-clamp and `gap` does not stop siblings overlapping, the headline silently
collides with the byline. At K=2.8 it is **three lines with 320px of headroom**
(`probe/ticket06/caption-bound.ts`). My first attempt used 3.16; the catalogue found the error.

### Contrast: measured, and it failed twice before it passed

The ticket said a scrim over a busy Poster "can fail contrast, and that has to be measured rather than
eyeballed". It did. Method (`probe/ticket06/contrast.ts`): render each card twice — once normally,
once with the caption blanked, which is a pixel-exact backdrop **because the caption box has a fixed
height** — then take each solid glyph interior (5×5 neighbourhood, so anti-aliased edges are rejected,
since an edge pixel is a blend and always measures ~1.00) against its true backdrop.

- **A, C, D: 15.2–17.6:1** — `--t1` on canvas. Safe.
- **B, E: started at 1.01:1.** Two real causes, both found by measuring:
  - **E's scrim was 200px while a three-line caption is 280px**, so the top of the caption sat on bare
    Poster — white text on a white Poster. 64 of 297 Posters are more than 90% near-white app chrome
    (ticket 14), so this was not an edge case.
  - **The gradient stops were inverted**, painting the fade over the type instead of above it.
  - Sizing each scrim *from the text block* and deriving the fade above it fixes both: **worst 8.33:1**.

Two further things fell out of the measurement: **an overlay card cannot keep the site's 80px safe
area** (a three-line caption plus an opaque scrim does not fit), and **a wordmark over a Poster must
sit on a solid `--canvas` chip** — `--t1` is invisible on a pale one, and blending is unavailable.

### The ticket's premise about shape is wrong, and it mattered

The question opens with "a 0.46-ratio Poster" and "171 of the catalogue's Demos are phone-shaped" and
concludes "**every** Recording card therefore has a vertical image". Measured across all 297: **195 are
phone-shaped (<0.55) and 77 are wider than 0.8, up to 1.7778** — a quarter of the catalogue is
landscape or square. A hard-coded phone shell drew a 1.78 screenshot inside a portrait frame with two
dead black bands (`out/A-land.png`, before the fix). **The device frame is now sized from
`Recording.aspect`**, with a wide Poster getting a wide frame and a smaller radius. Any implementation
must do the same or it will look broken on 77 Recordings.

### The longest name, and why A has no initials block

Measured across all 23 names at `body-sm`: the widest is `Enzo Manuel Mangano (Reactiive)` at **543px**
(`probe/ticket06/byline-width.ts`). D's content column is 660px so it keeps both the name and the
initials disc. **A's column is 604px, so a 40px disc plus its gap forces truncation — A drops the disc
and keeps the name.** The name is the identity; the disc is decoration. Also measured: `D`'s column
`width` includes its own padding, so an earlier 660 meant 500 of content and truncated every render —
a card that looks fine on a short name and clips on a long one is worse than one that never clips.

**Both Latin-ext and Hangul render** in the pinned static TTFs — `Daehyeon Mun (문대현)` at 367px, so
no name is dropped for want of glyphs. `text-overflow: ellipsis` **does** work in Satori (ticket 02
tested `-webkit-line-clamp`, which does not); it is used only for the byline, where losing the tail is
honest, never for the caption.

### A missing Poster is a designed state

Ticket 14's hue-tinted panel, implemented: gradient wash at the Recording's `hue` (or 175), the site's
`--media-glow`, and a `label`-step line. It occupies the same slot the image would, so a share
degrades to a coloured card with the caption. See `out/A-noster.png`. One defect worth recording: the
first version drew a device outline inside a device shell and rendered a phone inside a phone — the
tinted Posters had hidden it, because an `<img>` sizes to its own aspect while a `width: 100%` panel
inside `flex: 1` resolved against the parent's free width and swallowed the card.

### Verified rather than looked at

- **Edge audit** (`probe/ticket06/edge-audit.ts`): all 30 renders, nothing bleeds off an edge and no
  type touches one. This caught a clipped byline in C that looking had missed — C centred its column, so
  the column's *height* decided the top edge, and a three-line caption pushed the Poster off the card.
  C's Poster is now anchored rather than centred.
- **Contrast**: worst 8.33:1 across all 30, above AA.
- **Fallback**: renders for every variant (`out/*-noster.png`).
- **Subjects** (`preview/render.tsx`): the shortest caption (5), the median (15), the longest in the
  catalogue (36) against the longest name, a no-hue Recording, and a **1.7778 landscape** Poster.

### Handed to ticket 10

Six decisions: **K = 2.8** as the card's type scale; **captions wrap into a fixed three-line box** and
are never truncated; **the card carries caption + Contributor + Category**; **the Poster is never
cropped**, so it must be letterboxed at true ratio; **the device frame follows `Recording.aspect`**, not
a phone; **overlay variants need an opaque scrim sized from the text block** and cannot keep an 80px
safe area. Plus the implementation note: an overlay card's scrim height is a function of the caption
box, so it must be derived, never a literal.

**Not decided here, and the map should say so:** whether to build **D** specifically is the maintainer's
call, and the two decisions that remain genuinely open are **dark versus light** (ticket 04's question,
answered dark here because a card renders with no visitor preference in hand) and whether **C's
centred composition is worth a smaller Poster**. Both are taste, not measurement, and both belong to
whoever chooses.

## Comments

### 2026-10-05 — the maintainer chose **M2**, the no-Category variant

Four rounds of prototypes followed the answer above, all in `preview/variants-n.tsx`, and the choice
is **M2** (`preview/out-n/M2-*.png`): `rnui.dev` in the homepage's wordmark treatment, then the
Recording's caption, then the Contributor's name, then the Poster on its rail. **No Category.**

The chain of revisions, because each one was forced by something measured:

| Round | Variants | What changed |
|---|---|---|
| **D** | D1–D4 | D (Split) promoted. Small steps pushed up for narrow screens — 14 type-step/platform pairs below the 11px floor went to **0**. D4's 60px inset added as crop insurance. |
| **N** | N1–N4 | The disc dropped from all four; the **wordmark became the headline** at 48px (it had been 22px, behind a 44px Category); wordmark set byte-for-byte as `components/site-header.tsx:98-102` sets it — `rnui` in `--t1`, `.dev` in `--acc`, **weight 700**, `-0.02em`, **zero gap** between the runs (the header's `gap-[9px]` belongs to the link, not the pair). |
| **M** | M1–M2 | Category demoted to **30px** beside the 48px wordmark, and a variant dropped it entirely. |

**The chosen card is M2**, so `rnui.dev` leads, the caption leads the content, the Contributor's name
follows, and nothing sits below the readability floor at any platform width.

**What the rounds established, and it changes what ticket 10 writes:**

1. **The wordmark is capped at 48px** — the same binding constraint as the caption's, found the same
   way. N2's first attempt at 92px sheared the caption's third line mid-glyph, because the wordmark
   shares a column with a 3-line caption and a 2-line byline. **48px is measured, not taste.**
2. **The Category and the Contributor's name cannot share a row.** 44px tracked mono plus the 543px
   name is over 700px of type in a 600px box; it wrapped and pushed the layout past 630. All four
   variants stack instead.
3. **Contrast is unchanged at 17.58:1** — the type sits on canvas, not on the Poster, so promoting it
   costs nothing.
4. **Removing the Category frees ~56px that must not be spent.** M2's first build put it into padding
   (72) and gap (30), which pushed the caption's third line out of its box and sheared it. M2 keeps
   M1's vertical budget (64/24) and lets the freed space be slack.
5. **The cost of dropping the Category, stated plainly:** the card no longer says which of 18
   Categories this is. The maintainer's ranking was the site's name, then the Recording, then the
   Contributor, and the Category was not on it.

**This overrides one line of the answer above.** "Handed to ticket 10" says the card carries
*caption + Contributor + Category*. **It does not.** The chosen card carries caption + Contributor's
name only, plus the wordmark. Ticket 10 must not write the Category in.

Unchanged by the choice: K = 2.8, captions wrap into a fixed three-line box and are never truncated,
the Poster is never cropped, the device frame follows `Recording.aspect`, and a missing Poster is
ticket 14's hue-tinted panel.