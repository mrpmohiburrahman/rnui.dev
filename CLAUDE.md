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

Active effort: `.scratch/posthog-expansion/`.

1. Read `spec.md` in that directory first. Its Goals, Non-goals and Constraints are binding — in particular `api_host` stays `https://us.i.posthog.com`, Firebase not PostHog owns view and vote counts, and nothing here changes what the site looks like.
2. Scan `issues/`. A ticket is available when its `Status:` is `ready-for-agent` and every number on its `Blocked by:` line is `resolved`. Lowest number wins. No `Blocked by:` line means nothing blocks it. **If `spec.md` names a ticket to take first, that beats the lowest number** — some orderings are about a data-collection clock rather than a dependency, and cannot be written as `Blocked by:` without lying.
3. Set that ticket's `Status:` to `claimed` and save before writing any code.
4. Implement only that ticket. Its `## Acceptance` is the definition of done.
5. On finish: append what you did under `## Comments`, and commit the code and the ticket together. Set `Status: resolved` only when every `## Acceptance` bullet is actually met. If one needs a deploy, a person's judgement, or data that does not exist yet, set `ready-for-human` instead and name what is left and who does it — `resolved` is terminal, and claiming it early is how the remainder gets lost.

Stop and hand back to the maintainer at the checkpoints listed in `spec.md`.

Finished efforts, not to be reopened: `.scratch/ui-ux-overhaul/` — all 14 tickets `resolved` as of 2026-07-31. Its one outstanding checkpoint is a PostHog task, ticket 09 steps 2 to 4, which must land before the redesign deploys.
