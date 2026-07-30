# 06 — Make the Entry caption the card headline

Status: ready-for-agent

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

## Depends on

Nothing. The overlay work (decision 5 and `.scratch/ui-ux-overhaul/motion-brief-overlay.md`)
replaces `components/card-modal.tsx` with a Radix Dialog; whichever of the two lands
second applies step 3 to the file that survives.
