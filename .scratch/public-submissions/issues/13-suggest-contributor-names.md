# Suggest existing Contributor names on the submit form

Status: resolved
Type: task

## Question

`NAME TO CREDIT` is free text and nothing compares it to the 23 names the catalogue already holds.
`app/submit/page.tsx` gives the field `autoComplete="name"` and nothing else, and
`lib/submission-form.ts`'s only rule for it is that it is non-empty. So a Contributor can be typed a
second time under a second spelling and become a second Contributor: `/contributors` grows a row, a
second `?contributor=` address starts existing, and their Recordings split across two counts.

Measured, not assumed: nothing in this repo normalises a Contributor name. De-duplication is
exact-string `Set` membership in `data/recording.ts`, and the catalogue's only defence against a
near-spelling is `tests/data-integrity.test.ts`'s guard on surrounding whitespace — the mechanism
that caught the one real duplicate, `"Pushkar Tandon "` in `data/fullapps.ts`, which was fixed by
editing the data rather than by trimming on the way out.

So: suggest the names that already exist, as the visitor types, and make the canonical spelling the
easy one to submit.

**The decision this implements is already recorded** —
[ADR 0009](../../../docs/adr/0009-a-contributors-identity-is-their-name-string.md): the name string
*is* the identity, there is no id and no slug, and two spellings differing only in letter case,
surrounding or repeated spaces, or Unicode encoding form name the **same** Contributor.

## Acceptance

- The field suggests from the **published catalogue's** Contributor names, computed on the server
  and passed into the client form as props. `@/data/*` must not enter a client chunk —
  `components/catalogue-search.tsx` records that the last such value import was deliberately
  removed, and `data/recording.ts` pulls in all 280 Recordings.
- Matching folds letter case, surrounding and repeated whitespace, and Unicode form. **Folding
  never reaches storage:** what is submitted is an exact existing spelling, or the visitor's own
  text.
- Prefix matches rank before substring matches; at most 6 rows; the row is the name alone.
- When the typed name folds equal to an existing Contributor, the form says so and submits the
  canonical spelling. It **never blocks** and never requires a pick — a first-time Contributor is
  not in the list, and refusing them would be the feature writing a rule the domain does not have.
- Close-but-not-equal names are suggested, never merged, never blocked. No edit-distance: it
  suggests the wrong John Smith as readily as the right one.
- Picking an existing Contributor does **not** fill GITHUB / LINKEDIN / X. The three handles are
  per-Recording and optional, so a Contributor-level set does not exist to fill from.
- The endpoint canonicalises too, so the notification the maintainer reads already carries the
  exact name rather than asking them to notice.
- `autoComplete="off"`, and the label is `CONTRIBUTOR NAME` — the glossary's word, which is also
  the site's own (`CONTRIBUTORS · 24` on the rail, `/contributors`).
- Keyboard and screen-reader correct: `combobox`/`listbox` roles, arrow keys move, Enter accepts,
  Escape dismisses, and **Enter still submits the form when the list is closed**.
- `add-recording` is untouched. It keeps byte-identical copying, which its own failure-modes
  section requires, and the point of this ticket is that its input is already canonical.
- A data test fails when two catalogue names fold to the same Contributor.
- `pnpm check-types`, `pnpm test` and lint clean.

## Notes

- **Why the guard is a test and the suggestion is only a nudge.** A suggestion reduces the odds of a
  duplicate; it cannot prevent one, because the visitor always has a keyboard. The last door is the
  pull request that adds a Recording to `data/*.ts`, and CI runs the data tests there — so the fold
  test is what turns "you probably will not get duplicates" into "a duplicate cannot merge".
- **A returning submitter whose first Demo was never published gets no suggestion.** The Firestore
  `submissions` collection is `allow read: if false`, deliberately, because it holds people's email
  addresses; so the only names available to suggest are the published ones. The cost of the gap is
  nil — the name still lands on the same Contributor — and widening the list would mean a new read
  path to discover it.
- **Not in scope:** any change to `add-recording`, any Contributor registry or id (ADR 0009), and
  typo tolerance.

## Comments

**2026-09-26 — built, driven in a real browser, and it uncovered a separate drift. Status `resolved`.**

### What shipped

- `lib/contributor-match.ts` — `foldContributorName`, `existingContributor`, `suggestContributors`
  and `canonicaliseContributor`. Pure, and with **no `@/data/*` import at all**, which is what lets
  the client form call them without shipping the catalogue behind them.
- `app/submit/page.tsx` is now a **server component** that computes `getUniqueContributors()` and
  renders `app/submit/submit-form.tsx`, the client half — the split `app/contributors/` makes.
- The name field is a combobox: suggestions after the first character, prefix matches before
  substring matches, six rows, name only. `ArrowDown`/`ArrowUp` move, `Enter` accepts **only when a
  row is highlighted**, `Escape` closes. `role="combobox"` with `aria-activedescendant`, so focus
  never leaves the field.
- An inline **"Existing Contributor. This will be credited to X."** line when the typed name means
  one. Said rather than silently corrected: the spelling belongs to a real person, and this is the
  last moment anybody can watch it change.
- `app/api/submit/route.ts` canonicalises the name too, so the notification the maintainer reads
  already carries the exact spelling instead of asking them to notice.
- `autoComplete="off"` — the browser's own stored-name history would be a second dropdown from
  somewhere else entirely — and the label is now `CONTRIBUTOR NAME`.
- New: `tests/contributor-match.test.ts` (14 cases) and `tests/e2e/submit-contributor-name.spec.ts`
  (6 browser cases).

### The guard, which is the part that makes the claim true

`tests/data-integrity.test.ts` gained **"no two contributor names fold to the same Contributor"**.
It restates the fold rather than importing `lib/contributor-match.ts`, for ADR-0005's reason: a test
that takes its expectation from the code under test cannot catch that code being wrong. The
suggestion list is only a nudge — a visitor always has a keyboard — so *this* is what makes a
duplicate unmergeable rather than merely unlikely.

### Verified

- `pnpm build` clean, and `/submit` still prerenders.
- Served `/submit`: `CONTRIBUTOR NAME` present, `NAME TO CREDIT` gone, the list's id present, a real
  Contributor name in the payload, and **no Recording caption in any chunk** under
  `.next/static/chunks/app/submit/`. The split does what it exists for.
- The keyboard path was **driven in a browser, not reasoned about**: 6/6 in
  `tests/e2e/submit-contributor-name.spec.ts`, including that `Enter` with nothing highlighted takes
  no suggestion.
- `pnpm check-types` clean, **489/489 vitest**, lint 0 errors (6 pre-existing warnings).

### What it uncovered, and what was deliberately left

Three `tests/e2e` specs pinned the catalogue's size as the literal `277`, so they were **red**: the
catalogue is 280 (`tests/recording-counts.test.ts`) and every page derives its figure from
`allRecordings.length`. Fixed by deriving rather than by updating the literal:

- `tests/e2e/recording-route.spec.ts` — two tests, **now green and verified**.
- `tests/e2e/headings.spec.ts` and `tests/e2e/home.spec.ts` — the count is derived now, but both
  files are **still red for a second reason that predates this ticket and is not a count**: they
  assert a design this branch no longer renders. The mock's result line (`48 OF 277 · SORTED
  RECENT`) and the hero copy are absent from `/`; the hydrated page has one heading,
  *"A community-made catalogue of React Native interfaces."*, and its only `OF` line is
  `48 OF 280 SHOWN · NO INFINITE SCROLL`.
- **Not repaired on purpose.** Fixing that means deciding what the current design *should* assert,
  and rewriting an assertion until it matches whatever the app happens to render destroys the test's
  only value. It needs its own ticket, and this one records the evidence instead.
- `docs/r2-setup.md`'s object count was a setup-day measurement that cannot be re-run from here (the
  Cloudflare token on this machine cannot list R2 objects), so the row now says that rather than
  implying it is current.
