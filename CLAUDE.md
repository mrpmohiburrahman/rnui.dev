# rnui.dev

## Agent skills

### Issue tracker

Local markdown — issues and specs live as files under `.scratch/<feature>/`, not in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name, recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Implementing without a named ticket

`/implement` with no ticket named means **take the frontier** of the active effort. Do not ask which one, and do not re-plan — the spec is frozen.

Active effort: `.scratch/ui-ux-overhaul/`.

1. Read `spec.md` in that directory first. Its decision table is binding; decision 1 freezes the site's appearance.
2. Scan `issues/`. A ticket is available when its `Status:` is `ready-for-agent` and every number on its `Blocked by:` line is `resolved`. Lowest number wins. No `Blocked by:` line means nothing blocks it.
3. Set that ticket's `Status:` to `claimed` and save before writing any code.
4. Implement only that ticket. Its `## Acceptance` is the definition of done.
5. On finish: set `Status: resolved`, append what you did under `## Comments`, and commit the code and the ticket together.

Stop and hand back to the maintainer at the checkpoints listed in `spec.md`.
