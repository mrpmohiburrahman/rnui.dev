# 07 — The two catalogue merges are asserted to agree

**What to build:** Adding a Category to one of the two catalogue merges and not the
other stops being a silent failure.

Two modules perform the identical eighteen-way merge of the Category data files, in
the same order, from the same imports. Diffing the two spread lists returns one
hunk: the name of the exported constant. One feeds the site, the tooling and the
data suite; the other feeds only search. Nothing asserts they agree.

The data suite already covers half of this. It walks every row of the Category
table, imports that Category's data file, and asserts every Entry in it reached the
merged catalogue — the test that exists because forgetting a merge line makes a
Category's Entries vanish with no error and nothing failing. That guard covers one
merge. The second has none, so a nineteenth Category added correctly to the first
passes the entire suite while disappearing from the other.

This is deliberately the guard and not the collapse. Collapsing the two into one
module is gated on whether search ships at all, because search is the only consumer
of the second merge — and if search is cut, the module is deleted rather than
merged, making the collapse work thrown away. The assertion survives either answer:
if search is cut it is deleted alongside the module, and if search ships it was
mandatory anyway. The two merges are byte-identical today, so it passes on the tree
as it stands and pins them from here.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The data suite asserts that the two merges hold exactly the same set of Entry ids
- [x] The assertion lives beside the existing catalogue-wiring guard, since it is the same class of silent failure
- [x] Its failure message names which Entries are missing from which merge, in the shape the suite's other assertions use
- [x] Removing one Category's spread from the second merge turns the assertion red, checked by hand before the ticket closes
- [x] Test suite and type check pass

The two merges are not collapsed into one. That is gated on the search decision and
is recorded separately.

## Comments

**Implemented 2026-07-29.**

The assertion is `tests/data-integrity.test.ts`, last test but one of the
`catalogue wiring` block — the same describe as the per-Category merge guard, and
it reuses that block's `merged` set rather than rebuilding it. It compares id sets
in both directions, so an Entry present in one merge and not the other fails
whichever side it is missing from. The message takes the sibling assertion's
shape — count, em-dash, comma-joined ids — and prints both directions always, so
a failure says which side is clean rather than leaving it to be inferred.

Red checked by hand: deleting `...pickers,` from `lib/codex/entries.ts` fails with

```
1 Entries in data/catalogue.ts never reached lib/codex/entries.ts — 01G8YVZ8XY1G8VZ8XY1G8VZ8XY; 0 Entries in lib/codex/entries.ts never reached data/catalogue.ts —
```

then restored. Only the catalogue→search direction was exercised by hand; the
reverse has no way to be triggered on this tree, since nothing is in the search
merge that is not in the catalogue. It is written and type-checked but unexecuted.

Three comments changed. The header of `lib/codex/entries.ts` said "nothing asserts
the two agree", which this ticket makes false; it now points at the test and keeps
the survey-candidate-3 reference the spec still files this duplication under.
`data/catalogue.ts` gained the matching pointer — per
`docs/adr/0005`'s convention that both halves of a deliberate duplication name
each other, and because it is the likelier place to add a nineteenth Category. The
gating rationale is written once, in `lib/codex/entries.ts`; the other two point at
it rather than restate it.

`docs/agents/triage-labels.md` had no terminal state, so closed tickets have been
drifting between `resolved` (thirteen of them) and `done` (ticket 06). The table
now records `resolved` as the terminal state and ticket 06 is corrected to match.

Gates: `pnpm check-types` and `pnpm test` (74 passed, was 73) both pass.

**2026-07-30 — the assertion is deleted, and so is what it guarded.** This ticket
pinned the two merges together *because* the search decision was still open. It is
now closed the other way: search does not ship, `lib/codex/entries.ts` is deleted,
and one merge remains in `data/catalogue.ts`. The `the search merge holds exactly
the Entries the catalogue does` case went with the module it compared against — it
was made unnecessary rather than weakened, and the sibling per-Category case that
shares its `merged` set still asserts every Category's Entries reach the catalogue.
See [ADR-0006](../../../docs/adr/0006-search-does-not-ship-and-the-codex-layer-goes-with-it.md).
