# The Category card, several ways

Status: open
Type: prototype
Blocked by: 05

## Question

**`/products?category=<name>` is a public, shareable link (ADR-0004) and there are 18 Categories. The
map called this "the Contributor card with one string swapped" — is it?**

Blocked by the Contributor card on purpose: that ticket settles the shared structure (where the name
sits, what the metric type is, what a long name does), and re-deciding it here would produce two cards
that disagree. So this ticket is narrow —

- **Does the Contributor card's structure survive a Category?** A Contributor's name is a person's,
  up to 31 characters, sometimes with Hangul in parentheses. `Circular Progress Bars` is 23 characters
  of title case, and every Category name is short enough to fit on one line where most Contributor
  names are not. The layout that handles the Contributor might be over-built for the Category, or the
  Category card might be the better general shape and the Contributor card the special case.
- **Is the count the same kind of number?** `RECORDINGS_PER_CATEGORY` and `RECORDINGS_PER_CONTRIBUTOR`
  are computed by one pass in `data/recording.ts:32-39` and are the same quantity over different
  groupings. A Category with 148 Recordings and a Contributor with 12 are not the same claim, and the
  card may want to say so differently.
- **Does the Category card get a Poster?** A Category spans many Recordings and the hue mechanism
  (`lib/poster-hue.ts`) is per Recording, not per Category. There is no single image for "Sliders" —
  so either the card is image-free, which makes it a different shape from the Contributor card, or
  someone picks a representative Recording, which is an invention.

Produce **three or four rendered designs at 1200×630**, derived from whichever Contributor card
structure ticket 05 settles, behind a live preview route. Include `Misc` (148) and the smallest
Category, so both ends of the range are visible.

## Notes

- This ticket is cheap on purpose. It is the last design ticket, and if it confirms the map's guess its
  answer is one line — which is a legitimate outcome for a decision ticket and not a failure to find
  work.
- The 18 Category display names are the canonical spellings (`data/categories.ts` `CATEGORY_NAMES`);
  `lib/asset-path.ts` derives the lowercase asset slugs from them and never the other way round. Use
  the display names on the card.
- Nothing ships from this map.