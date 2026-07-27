---
name: commit
description: Commit with a message written by a cheap CommandCode model, falling back to you when it fails. Use when the user types /commit, or asks to commit or save their changes, fix the last commit message, or undo a commit. Splitting into several commits belongs to commit-split.
---

# commit

`commit.sh` owns every decision here — repo state, file selection, the secret scan, the model ladder, AI-trailer stripping, and the commit itself. Your job is to **relay**: hand it context, read its exit code, report back. Every git action goes through the script, so its guards stay in front of the repo.

## Steps

1. **Run it**, with `--why` whenever you know why the change exists. One line of intent is the single biggest lever on message quality — the model can read the diff but cannot read the reason.

   ```bash
   bash .claude/skills/commit/commit.sh [split|amend|undo] --why "<one line>"
   ```

   Modes and flags: `bash .claude/skills/commit/commit.sh --help`.

2. **Act on the exit code.**

   | Code | Meaning | What you do |
   |---|---|---|
   | `0` | committed | Report the subject. Mention `commit.sh undo` if the user sounds unsure. |
   | `2` | nothing to commit | Say so, stop. |
   | `3` | repo state blocks it | Relay the message verbatim — it already names the command that belongs in that state. |
   | `4` | possible secret | Show every finding. `--allow-secrets` is the user's call to make, so ask. |
   | `5` | needs input | It printed a file menu, a message to approve, or a detached-HEAD warning. Put that to the user, then re-run with `--pick "…"`, `-y`, or `--message-file`. |
   | `6` | every model failed | Read the prompt it left at `.git/commit-skill/plan`, write the message yourself, re-run with `--message-file <file>`. |
   | `1` | error | Relay stderr. A hook rejection or a failed commit stays failed — the user decides what happens next. |

3. **Done when** the script exits `0`, or the user knows exactly what blocked it and what comes next.

## Testing

`bash .claude/skills/commit/test.sh` builds a throwaway repo per git state and stubs the CommandCode CLI, so it costs no credits and needs no network. Run it after any edit to `commit.sh`.

## Why the script is shaped this way

Behaviour pinned against the installed CommandCode build, not its docs — the two disagree. Findings in [`docs/research/commandcode-cli-headless.md`](../../../docs/research/commandcode-cli-headless.md); the load-bearing ones:

- **`timeout` is mandatory.** CommandCode has no request timeout of its own.
- **Exit `1` is a bucket.** Out of credits, unknown model, and empty prompt all land there, so the reason is read off stderr.
- **Unknown flags are silently ignored.** A flag from the newer docs will appear to work while doing nothing, so `test.sh` is what confirms a flag is real.
