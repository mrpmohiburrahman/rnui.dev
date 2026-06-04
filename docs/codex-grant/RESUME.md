# Resumption prompt

Copy everything between the fences into a fresh Claude Code session whose working directory is the repo root.

---

```
Read CODEX-GRANT-PROMPT.md and docs/codex-grant/STATUS.md.

STATUS.md is the authoritative record of what is done, what is in flight, and
what was already decided. Do not re-ask any question in its "Decisions already
made" section.

Steps:
1. Identify the next pending phase from the STATUS.md table.
2. For that phase, surface any unresolved items from "Open questions" via
   AskUserQuestion before writing code.
3. Execute the phase per CODEX-GRANT-PROMPT.md. Use pnpm, not npm. Branch is
   already codex-grant-prep — do not create a new branch.
4. One logical unit per commit, Conventional Commits.
5. In the same commit series, update docs/codex-grant/STATUS.md: flip the
   phase row to ✅ Done, add the PR/commit reference, advance the "Next to
   execute" line, and remove resolved Open Questions.
6. Push to codex-grant-prep. Do not merge to main without explicit user go.

Hard rules from CODEX-GRANT-PROMPT.md §2 still apply — re-read them before
any Phase 5 work.
```

---

## Why this works

- `STATUS.md` is the durable state. The previous session's decisions are written down, so the new session does not re-litigate (license, branch base, pnpm vs npm, real categories, etc.).
- The prompt above is small and stable — paste-as-is every time.
- Each phase commits an update to `STATUS.md`, so even mid-phase interruptions leave honest state on disk.

## If something goes wrong

- The branch is `codex-grant-prep`. `git log codex-grant-prep` shows the real history.
- The open PR (currently #4) is the canonical place to see scope so far.
- If `STATUS.md` and the actual git/repo state disagree, **trust git** and fix the file.
