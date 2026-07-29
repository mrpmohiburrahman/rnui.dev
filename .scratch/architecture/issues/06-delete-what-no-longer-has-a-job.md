# 06 — Delete what no longer has a job

**What to build:** Committing stops moving the working tree, and five modules that
nothing calls stop being part of the repository.

Two maintenance scripts survive only in the package manifest. The changed-Entries
script runs on **every commit** through the pre-commit hook. It looks in the data
directory for JSON files, but every Entry is TypeScript, so the only file it has
ever matched is the empty output file it writes itself — which nothing reads. On
its way to finding nothing it checks out a branch twice, once the current one and
once the remote main, leaving a detached HEAD in the middle of a commit. Every
failure is swallowed and the entry point is never awaited, so the hook exits
successfully whatever state it left the tree in. It is not theoretical: it fired
during a commit on 2026-07-29 and printed a checkout refusal.

The created-at backfill script cannot run from the command wired to it at all —
it throws before its first line of work. Even forced to run it would do nothing,
because its file discovery walks the Entry module's relative imports, and since
the catalogue merge moved that resolves to a single file whose array holds only
spreads, never an Entry. Every Entry already carries a created-at date. There is
no backfill left to perform.

Separately, three server-action modules have no importers anywhere. One of them
runs a function at module import — outside any request — that logs three lines.
Another is the fifth independent declaration of the Firestore collection name and
its production fallback, so deleting it shrinks that duplication for free before
ticket 14 tries to unify what remains.

The last-commit-date half of the pre-commit hook stays. Unlike the changed-Entries
half its output is genuinely rendered on the site, so removing it is a product
decision rather than a cleanup, and it is recorded as such rather than taken here.
After this ticket the hook still writes and stages a file on every commit; it just
stops checking out branches.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] A full commit produces no checkout entries in the reflog, where the current tree produces several
- [x] The changed-Entries script, its committed empty output file and its package command are gone, and nothing anywhere read that output
- [x] The created-at backfill script, its package command and its redundant compiler force-include are gone, and every Entry still carries its created-at date
- [x] The three server-action modules with no importers are deleted, along with the function that ran at module import and the dead filter type beside it
- [x] The Firestore collection name and its fallback are now written four times in the counter path rather than five
- [x] The dependencies that existed only to serve the two deleted scripts are dropped; the one the ingest tooling still imports is kept
- [x] The last-commit-date half of the hook is untouched, and the ticket says why
- [x] Type check, test suite and build all pass — the type checker covers the whole tree, so a surviving import of a deleted module fails the gate

Neither script is repaired. Fixing the backfill's discovery would produce a tool
with nothing to backfill, and nothing has ever consumed the changed-Entries output.
Repair here would be work spent making a no-op run correctly.

## Comments

**Implemented 2026-07-29.**

Deleted: `scripts/updateChangedItems.js`, `data/changedItems.json`,
`scripts/add-created-at.ts`, `app/actions/cached_actions.ts` (the module-scope
`displayFilters()` call and the `FilterData` type were both inside it),
`app/actions/get-filters.ts`, `app/actions/get-view-count.ts`.

Dependencies dropped: `simple-git` and `fs-extra` (+ `@types/fs-extra`), which only
the two scripts required, and `ts-node`, which only the backfill's package command
invoked. `ts-morph` is kept — `scripts/codex-ingest.ts:23` imports it. `.tsnoderc`
went with `ts-node`: it configured nothing else and had no other reader.

The eight other unused direct dependencies are out of scope here; ticket 11 records
why they are swept separately.

The remaining declarations of the Firestore collection name and its `"rnui"`
fallback are `app/actions/{decrement-vote-count,increment-view-count,increment-vote-count}.ts`
and `data/entry.ts:64` — four, for ticket 14 to unify. The newsletter collection is
untouched.

The hook now runs one command instead of four, with a comment saying why the
last-commit-date half stays: `components/last-updated.tsx:2` imports
`scripts/lastCommitDate.json` and `components/entry-card-grid.tsx:166` renders it
as "Updated: …", so removing it changes what visitors see. Review caught two errors
in the first draft of that comment — it said "footer" (it is a pill in the grid's
header row) and implied the script reads the git log (`updateLastCommitDate.js:6`
reads the clock). Both corrected; the misnaming itself is left alone, since
renaming the file is not this ticket.

`docs/research/git-commit-skills.md:149,155` described the hook as still running
`update:updateChangedItems`; corrected in the same commit, since it was the only
surviving prose naming a deleted package command.

Reflog evidence. Before: nine of the last twenty `git reflog` entries were
`checkout: moving from main to main`, one on each side of every commit — including
one on each side of every commit for tickets 01 through 05. After: the two commits
this session made (`f6d2e27`, `022400c`) sit adjacent in the reflog with no
`checkout:` entry between or around them.

Gates: `pnpm check-types`, `pnpm test` (73 passed) and `pnpm build` all pass.
`public/sitemap-0.xml` churns on every build because `next-sitemap` restamps
`lastmod`; that churn was reverted rather than committed.
