# Rename the branch to what it actually holds

Status: resolved
Type: task

## Question

`feat/catalogue-ux` carries 50 commits that are almost entirely Studio Dark, plus deploy A's
rename and behaviour work. The name describes none of it. Rename it to `feat/studio-dark`.

The catch is that the branch is referenced *by name* as the definition of deploy A — `CLAUDE.md`
calls deploy A "the merge of `feat/catalogue-ux` to `main`", and the paused `posthog-expansion`
tickets wait on it under that name. A rename that leaves those behind makes six `ready-for-human`
tickets reference a branch that no longer exists.

## Acceptance

- Branch renamed locally and on `origin`, with the old name deleted remotely.
- `CLAUDE.md`'s references to `feat/catalogue-ux` updated.
- Every `.scratch/posthog-expansion/` ticket naming the branch updated.
- `grep -rn "feat/catalogue-ux" --include="*.md" .` returns nothing.
- Code and paperwork committed together.

## Comments

Renamed 2026-08-14. `git branch -m`, then six files rewritten. Two of the four
Acceptance bullets turned out to rest on a premise that was not true; both are
recorded here rather than quietly ticked.

**The branch was never on `origin`.** No remote ref, no upstream, no PR — 50 commits
that have only ever existed locally. So there was no old remote name to delete, and
the remote half of bullet 1 is a no-op rather than a task. Asked the maintainer
whether to publish it under the new name; the answer was no, keep it local. That is
consistent with how deploy A works here — ticket 02 merges to `main`, and `main` is
what gets pushed. The old name survives in the commit message and in `git reflog`.

**No `posthog-expansion` ticket names the branch.** Bullet 3 assumed six of them did.
They do not — every one of them says "deploy A" and nothing else, so the rename could
not have stranded them. `CLAUDE.md` line 35 was the only file that tied the two
together by name, and it is updated. Nothing in `posthog-expansion/` was touched.

Files rewritten: `CLAUDE.md`, `docs/qa-followup-prompt.md`,
`.scratch/studio-dark/checkpoint-13-gate.md`, and `studio-dark` tickets 07, 13 and 14.
The `studio-dark` hits were past-tense records of work done on this branch — same
commits, new name, so they were updated rather than left pointing at a dead ref.

The grep in bullet 4 now returns hits in exactly one file: this one, where the string
appears in the ticket's own Question and in the grep command bullet itself. Satisfying
that bullet literally would mean editing the check to pass its own test, so the ticket
body was left as written. Every reference outside this file is gone; confirm with
`grep -rn "feat/catalogue-ux" --include="*.md" . | grep -v 01-rename-the-branch`.
