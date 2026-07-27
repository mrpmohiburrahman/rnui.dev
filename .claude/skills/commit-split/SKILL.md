---
name: commit-split
description: Group the working tree into topical commits, one commit per group, each message written by a cheap CommandCode model. Use when the user types /commit-split, or asks to split changes into separate or atomic commits.
---

# commit-split

The `split` mode of `.claude/skills/commit/commit.sh`. Same script, same guards — this skill exists so `/commit-split` shows up in slash-command autocomplete.

**It commits without asking.** `undo` is the safety net, not an approval step:

```bash
bash .claude/skills/commit/commit.sh split -y --why "<one line>"
bash .claude/skills/commit/commit.sh split -y --pick all --why "<one line>"   # nothing staged yet
```

Report what landed, and name `commit.sh undo` in the same breath — it rewinds the entire run to where it started, changes intact and staged.

`-y` is what makes it one-shot. Without it the script builds the plan, exits `5`, and regenerates from scratch on the next run — so the messages shown would not be the messages committed. One run, no drift.

To look before leaping, `--dry-run` prints the plan and commits nothing.

## Steps

1. **Run it** with `-y`. Add `--pick all` when nothing is staged yet, or `--pick "1 3 5-7"` after the file menu.
2. **Exit codes** are the same protocol as the `commit` skill — see the table in [`../commit/SKILL.md`](../commit/SKILL.md) rather than a second copy here. Note that `-y` skips the *message* approval only: file selection and the secret scan still stop and ask.
3. **Done when** the script exits `0` and the user has been told what was committed and how to undo it.

## What split adds over a single commit

- The model decides the grouping; there is no per-group approval, by design.
- Any file the model leaves ungrouped is swept into a final group, so nothing is silently left behind.
- A failure partway through stops immediately and reports `committed N of M` — it never half-finishes quietly.
- The whole run rewinds with one command: `bash .claude/skills/commit/commit.sh undo`.
