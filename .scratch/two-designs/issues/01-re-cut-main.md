# 01 — Re-cut `main` from `feat/studio-dark`

Status: ready-for-agent

## Problem

`main` must mean "what visitors see" (decision 1). It currently means the design being
replaced. But `main` is **not** an ancestor of `feat/studio-dark` — merge-base `3d479be`,
2 commits behind, 114 ahead — so this is a real merge, not a fast-forward.

The two commits `main` has that the branch does not:

- `5051644 docs: link the author's portfolio` — README only, 4 lines.
- `539f042 chore: trigger production rebuild` — `scripts/lastCommitDate.json` only.

Neither touches code. `CLAUDE.md` records the hazard explicitly: *"Note also that
`origin/main` is not an ancestor of `feat/studio-dark`: `main` carries a pnpm lockfile fix
the branch never received."* **Verify that is still true** — the lockfile claim has not been
checked since 2026-08-01, and if it is real, `pnpm install --frozen-lockfile` will fail on
the merged tree and that is the one thing here that can break.

## Work

1. `git checkout main && git merge feat/studio-dark`. Resolve nothing; capture whatever it
   does resolve.
2. Check `pnpm-lock.yaml` for divergence. If the branch is behind, `pnpm install` and commit
   the lockfile as part of this ticket, not as a separate one.
3. `pnpm install --frozen-lockfile && pnpm test && pnpm check-types && pnpm build` on the
   merged tree.
4. Push `main`. **Not** yet a production deploy — ticket 04 is the cut.

## Acceptance

- `git merge-base --is-ancestor 539f042 main` succeeds: main's tip carries both its commits.
- `pnpm install --frozen-lockfile` succeeds on the merged tree.
- `pnpm test`, `pnpm check-types`, `pnpm build` all green on `main`.
- `git log --oneline main ^feat/studio-dark` is empty — nothing left behind.
- `feat/studio-dark` is **not** deleted yet. Ticket 02 branches `old` off `main`'s pre-merge
  history, and deletion waits until `old` exists and is verified reachable.
