# Put the tile on the capture ratio

Status: open
Type: grilling
Blocked by:

## Question

**`components/demo-tile.tsx:135` keeps `aspect-[9/16]` (0.5625). The capture standard is 0.459954.**
The maintainer has directed that the tile move to the capture ratio, so every Demo — the ones already
published and the ones recorded from now on — is presented in one shape.

This is a reversal of two things this repo already decided, which is why it is a ticket and not a
change:

- **Q1**, settled in the untracked probe work and recorded at `app/probe-q3/page.tsx:3` before that
  file was deleted: *"Q1 is settled at (a): the box stays a uniform 9/16."*
- **Checkpoint 4** in `.scratch/studio-dark/spec.md`, which is un-cleared and stops an agent:
  *"Before deleting or restyling anything `ui-ux-overhaul` shipped for a recorded reason."*
  `studio-dark` ticket 07 names `components/demo-tile.tsx` as the outcome of `ui-ux-overhaul` ticket
  09 and lists `object-cover` (`:144-150`) as surviving verbatim.

Both were read before this ticket was written. **The recorded reasons are below, and the maintainer's
sign-off is the gate.**

### The recorded reasons, and what the measurement says about them

**1. The 9/16 box reserves the Poster's space.** `ui-ux-overhaul` ticket 01:47 — *"The Poster's box is
already reserved — `aspect-[9/16]` on the wrapper... This ticket therefore claims no CLS win."* Any
fixed ratio reserves the same space, so this reason survives the change untouched. It is `0.549 → 0`
CLS that was already booked against decision 16, not the ratio itself.

**2. The autoplay threshold is calibrated to this geometry.** `ui-ux-overhalf` ticket 09:70 — *"Not
higher: a 9/16 tile in a phone's landscape viewport cannot reach an intersectionRatio of 0.25 at all,
and would then never play."* This is the one real coupling. A 0.459954 box is **taller** for the same
width, so the concern gets *stronger*, not weaker. Measured in an 844×390 landscape viewport:

| tile | width | height | intersectionRatio | clears the 0.25 gate |
| --- | --- | --- | --- | --- |
| 9/16 | 208 | 370 | 1.000 | yes |
| 0.459954 | 208 | 452 | **0.862** | yes |
| 9/16 | 140 | 249 | 1.000 | yes |
| 0.459954 | 140 | 304 | 1.000 | yes |

So it clears at the catalogue's `w=208` and the detail strip's `w=140`. **This must still be confirmed
by running the real suite** — `tests/e2e/poster-loading.spec.ts` asserts the `<img>` rect equals the
tile rect and `object-fit: cover`, and the playback owner is a live IntersectionObserver.

### What the change fixes

This is the strongest argument for it, and it was not visible before the measurement:

| Demo | ratio | at 9/16 (today) | at 0.459954 |
| --- | --- | --- | --- |
| narrowest | 0.4146 | height −35.7% | height −10.9% |
| in-band low | 0.4566 | height −23.2% | height −0.7% |
| **CATALOGUE MODE** | **0.4611** | **height −22.0%** | **width keeps 99.8%** |
| in-band high | 0.4828 | height −16.5% | width keeps 95.3% |

**Today the tile is cutting ~22% off the height of every one of the 171 phone-shaped Demos** — top and
bottom, including status bars and the bottom of the component being demonstrated. At 0.459954 that
falls to roughly zero, because the box finally matches the shape of the thing in it.

### What it costs, stated plainly

1. **The grid gets 18% taller.** +82px per tile at `w=208` (370 → 452). 48 tiles per page. The
   `studio-dark` spec records field LCP p75 at **4,212ms desktop / 4,515ms mobile, both in Google's
   poor band**, and names a per-tile glow as one of two things most able to undo that work. More height
   is more tiles below the fold, so this must be measured, not assumed.
2. **The 108 outliers get worse.** Landscape goes 31.6% → **25.9%** of width visible; square 56.2% →
   46.0%. They are already unusable at this size and become slightly more so.
3. **The Detail page is a separate question.** `recording-detail.tsx:266` derives its box from
   `String(recording.aspect ?? 9 / 16)` — per-Demo, already correct, and it is what makes those 108
   look right when opened. It is not the tile and this ticket does not touch it. But if the tile says
   "one shape" and the Detail page says "each its own shape", that inconsistency should be a decision
   rather than an accident.

### The part that cannot be done, and must not be attempted

The instruction also said to use the capture ratio **for all existing Demos**. That is not available,
and the reason is structural:

- **The originals are gone.** Every published Demo is a compressed MP4 on the CDN. Nothing was kept
  that could be re-recorded on an iPhone 18 Pro — they were shot on ~40 Contributors' own devices.
- **Re-encoding is destruction, not conversion.** Forcing a 1.7778 Demo to 0.459954 means cropping it
  to a 26% sliver or padding it with bars. Either way the content is lost permanently.
- **ADR-0003 makes it a 280-row migration.** An Asset path names specific bytes, so every re-encode
  needs a **new** path — 280 of them — plus 280 new Posters, 280 `data/*.ts` edits, and a full re-upload
  to R2.

So "all existing Demos at the capture ratio" is achievable **only as presentation** — which is what
this ticket does — and not as bytes. If the intent was bytes, say so and this becomes a different and
much larger decision that needs its own map.

### What to decide

1. **Sign off, or not.** Checkpoint 4 requires it. The measurement is above; the maintainer accepts the
   18% height and the worse outliers, or does not.
2. **How is the ratio written?** A literal `aspect-[1206/2622]`, a Tailwind arbitrary value, or a
   constant in `lib/` next to `Recording.aspect` — so the tile and the standard cannot drift apart.
3. **What happens to the 108.** Leave them cropped (status quo, slightly worse), pillarbox them, or
   stop autoplaying anything whose ratio is outside the band. The probe work tested pillarbox and
   no-autoplay and never decided; this ticket forces the question.
4. **Does the Detail page follow?** Leave per-Demo, or snap to the standard.

### Definition of done

`components/demo-tile.tsx` renders one shape at 0.459954, `pnpm check-types && pnpm lint && pnpm test`
pass, `tests/e2e/poster-loading.spec.ts` passes, the autoplay threshold is re-verified against the new
geometry in a landscape viewport, and grid height and LCP are measured against the `studio-dark`
baseline rather than assumed.
