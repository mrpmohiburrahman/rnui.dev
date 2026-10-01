# 09 — Replace the deploy-A/B vocabulary in `CLAUDE.md` and four specs

Status: ready-for-agent

## Problem

`CONTEXT.md` now defines **Design**, **previous design** and **Archive**, and lists
`Studio Dark`, `deploy A`, `deploy B`, `the old rnui.dev` and `legacy` under `_Avoid_`.
Those words are still load-bearing in `CLAUDE.md` and in five `.scratch/` specs, and they
now mean the wrong thing: "deploy B is not the merge of feat/studio-dark" in `CLAUDE.md`
describes a hazard that a different mechanism replaced, and it will mislead the next
reader about what is and is not dangerous.

The vocabulary is a **boundary problem**: with both hosts in one PostHog project and no
deploy in between, the boundary is now a **host** boundary.

## Work

1. `CLAUDE.md`: the "Deploy A is not the merge of `feat/studio-dark`" paragraph becomes a
   statement that `main` is studio-dark, `old` is the Archive, and the boundary between
   their numbers is a `$host` filter on dashboard `1937576`.
2. `studio-dark/spec.md`: Goal 4 and the Sequence's `4 DEPLOY B -> annotate` step record
   that the annotation landed at the host split instead.
3. `posthog-expansion/spec.md` and `posthog-expansion/issues/11`: same substitution.
4. `notify-and-preview`: tickets 12 and 13 reference the Preview's 301 and the survey that
   ticket 03 deletes. Mark them superseded rather than rewriting their history — they are
   closed records and should keep saying what was true when they were written.
5. Do **not** touch `.scratch/studio-dark/checkpoint-13-gate.md`. It is the verification
   artefact ADR-0010 points at.

## Acceptance

- No file outside `.scratch/**` uses `deploy A`, `deploy B` or `Studio Dark` as current
  vocabulary.
- Every `.scratch/` reference is either updated to the Design/Archive terms or explicitly
  marked superseded — and none is silently deleted.
- `CLAUDE.md`'s branch-topology paragraph matches reality after tickets 01–04.
