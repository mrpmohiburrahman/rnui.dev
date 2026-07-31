# 06 — Make the Entry caption the card headline

Status: resolved

Decision 4 (`.scratch/ui-ux-overhaul/spec.md:23`).

## Problem

The card emphasises the wrong string. `components/entry-card.tsx:188-193` puts
`entry.author.substring(0, 30)` in `MinimalCardTitle` — an `<h3>`
(`components/cult/minimal-card.tsx:69-82`) — and `entry.caption` in
`MinimalCardDescription`, a `<p>` (`components/cult/minimal-card.tsx:84-94`).
`components/card-modal.tsx:58-60` repeats the inversion: the author is the `<h2>`,
the caption a `<p>` at `card-modal.tsx:66-68`.

The 30-character truncation cuts **two** authors, not one as the brief states:
`Enzo Manuel Mangano ( Reactiive )` (33 chars, 124 of the 277 Entries) and
`Arnaud Dellinger ( evening kid )` (32 chars, 2 Entries). Both are cut mid-word.
Counted over `data/*.ts`: 277 Entries, 24 distinct authors.

Three brief claims corrected against the code:

1. **"the author becomes a byline that still links to their X, LinkedIn and GitHub"
   is already done.** Those three links exist at `entry-card.tsx:200-236` and already
   point at the author's profiles. No work. Relocating them beside the byline text
   would be a layout change and decision 1 forbids it.
2. What those links lack is a *name*: all three are labelled generically
   (`entry-card.tsx:206,219,231` — `"Twitter Profile"`, `"LinkedIn Profile"`,
   `"GitHub Profile"`), so a catalogue page announces "GitHub Profile" up to 124 times
   with nothing distinguishing them. Fixing that changes no pixels.
3. **"Add the Entry's Category to the card"** — the premise holds (the card renders
   author, caption, social links, Source, Views, Votes and the vote button and nothing
   else, `entry-card.tsx:186-275`; all 277 Entries carry a Category,
   `data/entry.ts:35-53`), but it is not in decision 4 and cannot be done without
   changing the screenshot. Left undone — see Open questions.

E2E exposure, `tests/e2e/`: exactly one assertion reads Entry text —
`remembered-set.spec.ts:38`, `getByText(remembered.author)` where
`remembered = allEntries[0]` resolves to `"William Candillon"` (17 chars, never
truncated, still rendered after the swap). Two specs locate the card by
`getByRole("heading", { level: 3 })` — `remembered-set.spec.ts:53` (no `.first()`, so
strict-mode single match) and `view.spec.ts:23` (`.first()`). Neither asserts the
heading's text. Nothing asserts on the profile-link labels.

## Work

1. `components/entry-card.tsx:188-193` — swap the two expressions and nothing else.
   `MinimalCardTitle` renders `{entry.caption}`; `MinimalCardDescription` renders
   `{entry.author}`. Leave both `className` strings byte-identical. `.substring(0, 30)`
   goes away with the move; do not re-add a truncation anywhere.
2. `components/entry-card.tsx:206,219,231` — name the byline's links:
   `` aria-label={`${entry.author} on X`} ``, `` `${entry.author} on LinkedIn` ``,
   `` `${entry.author} on GitHub` ``. Nothing visible changes.
3. `components/card-modal.tsx` — `<h2>` at 58-60 renders `selectedEntry.caption`; the
   `<p>` at 66-68 renders `selectedEntry.author`. No class edits, no element added or
   removed. Leave the `@{twitterId}` line at 61-63 exactly where it is (see Open
   questions).
4. Run the Playwright suite. Do **not** pre-emptively edit any spec — the analysis above
   says all four pass unchanged. If `remembered-set.spec.ts:38` does break, the one
   permitted edit is retargeting that single locator; leave every other line alone.

Do not add a heading, a `<span>`, a wrapper, or any element in steps 1 and 3. The
diff is string positions plus three `aria-label` values.

## Acceptance

- `rg "substring" components/entry-card.tsx` returns nothing.
- `git diff` for this ticket contains no changed `className` value and no added or
  removed JSX element.
- On a card by Enzo Manuel Mangano, `document.body.innerText` contains the whole
  33-character `Enzo Manuel Mangano ( Reactiive )` — no `Reactiiv`.
- The card's `<h3>` text equals `entry.caption`; the `<p>` directly under it equals
  `entry.author`. Same for the overlay's `<h2>`.
- Each profile link's accessible name contains the author's name, so no two links on a
  catalogue page share a name unless they are the same author *and* the same network.
- `pnpm test` and the Playwright suite are green, with at most the single locator edit
  from step 4 in `tests/`.
- Card height at the `sm` breakpoint (`w-[221px]`, ~165px text column after `p-2`,
  `p-4` and `px-1`) is measured on one Enzo card before and after and the delta recorded
  in the PR. The untruncated author is 3 characters longer than the truncated one, so
  one extra wrapped line is expected and is not a regression; more than that goes back
  to the maintainer before merge.

## Open questions

Neither is decided here; both need the maintainer.

1. **The Category on the card.** Any way of showing it adds a string the frozen
   screenshot does not have, and decision 4 says only which string is emphasised
   changes. It is also not a findability gap: `lib/entry-search.ts:29` already searches
   `[caption, author, category]`. If the maintainer wants it anyway, the slot that
   already exists is the empty `<MinimalCardContent />` at `entry-card.tsx:194`, which
   renders a `p-6 pt-0` div today and occupies space for nothing.
2. **Reading order inside the overlay.** After step 3 the panel reads
   caption / `@handle` / author, because `card-modal.tsx:61-63` sits directly under the
   `<h2>` and stays put. Putting the author above the handle is a DOM reorder, i.e. a
   visual change, so it is not taken here.

## Comments

Done as written. The diff is four string positions and three `aria-label` values,
across `components/entry-card.tsx` and `components/card-modal.tsx`. No `className`
value changed and no JSX element was added or removed. `substring` is gone from
`entry-card.tsx` and no truncation replaced it.

Step 4 held: the Playwright suite is 33/33 with **no** spec edited.
`remembered-set.spec.ts:38` did not break — `getByText("William Candillon")` still
matches, because the author is now the `<p>` rather than the `<h3>` but the text is
unchanged. `pnpm test` 159/159, `tsc --noEmit` clean, eslint and prettier clean on
both files.

### Card height at `sm` — the measurement the acceptance asks for

Measured on a production build at a 640px viewport (`w-[221px]` cards), on
`/products?page=6` so that all **277** cards render, before and after, matched by
position:

| | result |
|---|---|
| Cards unchanged | 269 |
| Cards +20px (one `text-sm` line) | 8 |
| Cards +2 lines or more | **0** |
| Cards that shrank | 0 |

The eight: Theme Canvas Animation, Telegram Theme Switch, Steps, Steddy Graph
Interaction, Animated Stacked Cards, Expandable List, Gran Turismo Countdown,
Metaball Shader. Worst case is one extra line, which this ticket's acceptance
admits as expected. Nothing goes back to the maintainer on height.

**The acceptance's stated reason for the growth is wrong, and it is worth recording
why.** It predicts the extra line comes from the author being 3 characters longer
untruncated. It does not. The first measurement was taken on an all-Enzo page, where
every card carries the identical 33-character author, and only 4 of those 48 grew —
if the author were the cause, all 48 would have. The cause is the **caption** moving
into `MinimalCardTitle`, which keeps `font-semibold` in its passed className. Semibold
is wider, so the longest captions gain a wrap. That is decision 4 working exactly as
written ("Only which string is bold changes"), but it means caption length is the
variable to watch, not author length — hence the re-measurement across all 277 rather
than one author's page.

### Review

Two-axis review run before commit. Spec: faithful, no missing or wrong requirement.
Standards: one hard violation — a five-line explanatory comment added above the swap
used "Entry" for what the glossary calls the caption and "contributor" for what it
calls the author, which ADR-0004 forbids. Both axes independently flagged the same
comment (Standards as vocabulary drift, Spec as scope creep beyond the declared
diff). It was deleted rather than reworded: this ticket file already records the
history, and the code reads fine without it.

Two review notes deliberately not acted on:

- `aria-label={`${entry.author} on X`}` sits on a link built from `entry.twitterId`,
  pointing at `twitter.com`, rendering `TwitterLogoIcon`. The label is the only place
  saying "X". Step 2 of this ticket dictates that exact string, so it stands; renaming
  the field and the icon is a separate change.
- The overlay now reads caption / `@handle` / author, because step 3 says to leave the
  handle line where it is. That is open question 2 below, still the maintainer's call.

## Depends on

Nothing. The overlay work (decision 5 and `.scratch/ui-ux-overhaul/motion-brief-overlay.md`)
replaces `components/card-modal.tsx` with a Radix Dialog; whichever of the two lands
second applies step 3 to the file that survives.
