# Next session — how to pick up this survey

## Copy-paste blocks

Three sessions, in order. `/clear` first, then paste the whole block. Nothing
else needs saying.

### Session 1 — delete the dead code

```
Read .scratch/architecture/survey.md, candidate 1 only.

Delete everything it lists as having zero importers, plus the two unused
dependencies (react-dropzone, @tanstack/react-virtual). Also fix the two
comments that describe the virtualised grid as if it ships:
components/interactive-video.tsx:99-101 and tests/e2e/home.spec.ts:55-56.

Verify: pnpm check-types && pnpm test && pnpm build, then pnpm exec playwright test.
One commit.
```

No slash command — deletion has nothing to design.

### Session 2 — the grilling

```
/grill-with-docs

Read .scratch/architecture/survey.md first — candidates 2, 4 and 8.

The idea: one module owns Category, one module owns Asset path, and the code
adopts the CONTEXT.md names (Entry, Demo, Poster). Grill me on it.
```

Then stay in that same window and type `/to-spec`, then `/to-tickets`. No
`/clear` and no `/compact` between those three — see *Context hygiene* below.

### Session 3+ — one per ticket

`/clear` before each. Real filenames appear after `/to-tickets` runs.

```
/implement .scratch/architecture/issues/01-<slug>.md
```

---

## Why a paste is required at all

A fresh session knows **nothing** about the survey unless you point it at a
file. Clearing context clears everything: the four agent reports, the nine
candidates, the recommendation. What survives is only what is on disk.

Three things are auto-loaded into any session started in this repo:

- `CLAUDE.md` — the three agent-skill pointers
- `CONTEXT.md` — the domain glossary
- `docs/agents/*.md` — only when a skill reads them

The survey is not among them. You have to name it.

`/handoff` does not solve this either: it writes its document to the **OS temp
directory**, not the workspace, and you would still have to paste the path into
the new session. That is why the survey was written to `.scratch/` instead —
this repo's own issue tracker convention (`docs/agents/issue-tracker.md`), and
the same place `r2-migration` lives.

## What is on disk now

| File | What it carries |
| --- | --- |
| `.scratch/architecture/survey.md` | All nine candidates with file:line evidence. Enough that a fresh session need not re-run the four Explore agents. |
| `.scratch/architecture/report.html` | The visual version — before/after diagrams per candidate. For you, not for the agent. |
| `.scratch/architecture/NEXT.md` | This file. |

Commit these before clearing. An uncommitted file survives `/clear` fine, but
not a machine change or an accidental `git clean`.

## Notes on each block

**Session 1.** Deletion has no design questions, so it skips the main flow
entirely. Do not `/grill-with-docs` it — there is nothing to sharpen.

**Session 2.** Candidates 2, 4 and 8 are one idea, not three: the Category
module owns the slug the Asset path module needs, and the renames land in both
interfaces. Grilling them separately would design the same seam three times.

`/grill-with-docs` cannot invoke itself — it is `disable-model-invocation:
true`, so you must type the slash command yourself. Naming the survey file in
that same message is the entire mechanism by which the new session learns
anything.

**Context hygiene.** `/to-spec` writes `.scratch/architecture/spec.md`;
`/to-tickets` writes `.scratch/architecture/issues/NN-<slug>.md`. Both run in
the same window as the grilling, with no `/clear` and no `/compact` between
them, so all three build on the same thinking. Do not `/triage` the tickets
afterwards — `/to-tickets` output is already agent-ready, and triage is for
issues you did not create.

**Session 3+.** `/implement` drives `/tdd` internally, then runs
`/code-review-mp` on the diff before committing. Clear context between tickets.

## If you pick a different candidate

Change the numbers in the session-2 paste. The couplings that matter:

- **2 before 4** — the Asset path module reads the Category slug.
- **2 before 3** — 3 is nearly mechanical once the loader has one owner.
- **6 before 7** — 7 hands its leaked `incrementViewCount` to 6.
- **5 anytime** — independent of the rest.
- **9 is blocked on a product decision**, not an architectural one: does search
  ship at all?

## Why not just carry it in this window

This session ran four Explore agents over the whole repo and wrote a 62 KB
report. Grilling, spec and tickets all need to happen in one unbroken window,
and that window needs to stay inside the smart zone (~120k tokens) to reason
sharply. Starting the grill here would start it degraded.
