# Git commit skills for Claude Code — public landscape + local inventory

Research date: 2026-07-25. Every claim below cites either a source URL or an absolute file path.
All public claims were verified by reading the actual `SKILL.md` / command markdown / `plugin.json`, not blog roundups.

---

## TL;DR

**Anthropic ships no commit *skill*.** [`anthropics/skills`](https://github.com/anthropics/skills) (164k stars, pushed 2026-07-24) contains 17 skills — `algorithmic-art`, `brand-guidelines`, `canvas-design`, `claude-api`, `doc-coauthoring`, `docx`, `frontend-design`, `internal-comms`, `mcp-builder`, `pdf`, `pptx`, `skill-creator`, `slack-gif-creator`, `theme-factory`, `web-artifacts-builder`, `webapp-testing`, `xlsx` — and **none of them is commit-related** (verified: `gh api repos/anthropics/skills/contents/skills`).

What Anthropic *does* ship is a thin *slash-command plugin*, `commit-commands`, in the official marketplace. It is 12 lines of prompt and explicitly bakes in Claude Code attribution — which this machine spends four layers of hooks trying to prevent.

**Recommendation: keep what you already have.** `caveman:caveman-commit` (installed) is a better commit-message generator than anything in the public set — it is the only one that explicitly forbids AI attribution lines, and it enforces a ≤50-char subject. The one real gap it leaves is **atomic-commit splitting**, and the best public fill for that is Sentry's `commit` skill or davila7's `commit-work`. See [What to actually use](#what-to-actually-use--gaps).

**Top 3 public picks:** 1. [getsentry/skills → `commit`](#a1-getsentryskills--commit) · 2. [davila7 `commit-work`](#a3-davila7-commit-work) · 3. [Anthropic `commit-commands`](#a2-anthropic-commit-commands) (official, but weakest content).

---

## Part A — public landscape

| # | Name | Repo | Kind | Stars / last push | Convention enforced | Splits into atomic commits? | AI-attribution stance |
|---|------|------|------|------------------|--------------------|-----------------------------|----------------------|
| A1 | `commit` | [getsentry/skills](https://github.com/getsentry/skills) | Skill | 886 / 2026-07-24 | Conventional Commits + Sentry types (`ref`, `meta`, `license`) | Advises one coherent change; no splitting workflow | Silent |
| A2 | `commit-commands` (`/commit`, `/commit-push-pr`, `/clean_gone`) | [anthropics/claude-plugins-public](https://github.com/anthropics/claude-plugins-public/tree/main/plugins/commit-commands) | Plugin (slash commands) | 32.6k / 2026-07-25 | "matches your repo's style" — nothing enforced in the prompt | No — explicitly "a single git commit" | **Adds** Claude Code attribution (per its README) |
| A3 | `commit-work` | [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) | Skill | 29.9k / 2026-07-25 | Conventional Commits (declared "required") | **Yes** — `git add -p` patch-staging workflow | Silent |
| A4 | `commit-smart` | davila7/claude-code-templates | Skill | 29.9k / 2026-07-25 | Conventional Commits, 72-char subject | No — one commit, but suggests logical grouping when staging | Silent |
| A5 | `commit-guardian` | davila7/claude-code-templates | Agent | 29.9k / 2026-07-25 | Conventional Commits, ≤72 chars | Check 9 flags non-atomic and asks the human | Silent |
| A6 | `git-commit-helper` | davila7/claude-code-templates | Skill | 29.9k / 2026-07-25 | Conventional Commits (7 types) | No | Silent |
| A7 | `git-pr-workflows` (`/git-workflow`) | [wshobson/agents](https://github.com/wshobson/agents/tree/main/plugins/git-pr-workflows) | Plugin | 38.2k / 2026-07-22 | `--conventional` flag, default `true` | Not the focus — it's review → PR orchestration | Silent |
| A8 | `AtomicCommit-Pro` | [milc3sar/AtomicCommit-Pro](https://github.com/milc3sar/AtomicCommit-Pro) | Skill | **0** / 2026-01-16 | Spanish-language skill; atomic-splitting engine | Yes (its stated purpose) | Silent |

Marketplaces checked and found **not** to contain a commit skill:
- `anthropics/skills` — 17 skills, none commit-related (`gh api repos/anthropics/skills/contents/skills`).
- `hesreallyhim/awesome-claude-code` (50.9k stars) — grep of its `README.md` for "commit" returns only shields.io `last-commit` badge URLs. It curates repos, not individual commit skills.
- `anthropics/claude-plugins-official` marketplace — 273 plugins; only `commit-commands` is a commit tool (the rest of the "git" hits are `github`, `gitlab`, `gitkraken`, `sourcegraph`, `coderabbit`, `pagerduty`, `security-guidance`, `receipts` — none write commit messages).

### A1. getsentry/skills → `commit`

- Source: <https://raw.githubusercontent.com/getsentry/skills/main/skills/commit/SKILL.md>
- Install: `/plugin marketplace add getsentry/skills` (repo is a skills collection).
- **What it does, from the file:** runs `git branch --show-current` first and **refuses to commit on `main`/`master`** unless explicitly asked (it re-checks and stops if still on main). Then it dictates `<type>(<scope>): <subject>`, imperative present tense, **capitalized subject**, ≤70 chars, all lines <100 chars.
- **Types:** `feat`, `fix`, `ref`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `meta`, `license`, `revert`. Note `ref` (not `refactor`) and `meta` — Sentry-specific.
- **Footers:** `Fixes <issue>` / `Refs <issue>` / `BREAKING CHANGE:`.
- **Unique strength:** an explicit PII/secrecy rule — *"Never include customer or organization names, user emails, support ticket contents, secrets, or PII. Describe the technical symptom instead."* Nothing else in this landscape has that.
- **Unique strength 2:** a mechanical rule that avoids a real Claude Code failure mode — *"Use separate `-m` arguments for paragraphs and footers. Never put literal `\n` sequences in a commit message or open an interactive editor."*
- **Weakness:** `ref`/`meta` are non-standard types; capitalized subject conflicts with the lowercase-after-colon convention used by `caveman-commit`. It doesn't split changes into atomic commits — it only says "commit one coherent change at a time".

### A2. Anthropic `commit-commands`

- Source: <https://github.com/anthropics/claude-plugins-public/tree/main/plugins/commit-commands> (listed in the official marketplace as `"source": "./plugins/commit-commands"`, verified in `anthropics/claude-plugins-official/.claude-plugin/marketplace.json`).
- Install: `/plugin install commit-commands@claude-plugins-official`
- **What `/commit` actually is** (<https://raw.githubusercontent.com/anthropics/claude-plugins-public/main/plugins/commit-commands/commands/commit.md>) — the whole prompt is:
  - frontmatter `allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)`
  - context injections: `git status`, `git diff HEAD`, `git branch --show-current`, `git log --oneline -10`
  - task: *"Based on the above changes, create a single git commit… Stage and create the commit using a single message. Do not use any other tools or do anything else."*
- **Convention enforced: none.** There is no format spec in the command. The convention comes entirely from `git log --oneline -10` — it mimics your repo's last 10 commits. That is elegant (zero config, adapts per repo) and fragile (a repo with sloppy history gets sloppy commits).
- `/commit-push-pr` additionally branches off main, pushes, and runs `gh pr create`.
- **The disqualifying detail for this machine:** the README lists as a feature *"Includes Claude Code attribution in commit message"*, and the same for the PR body. That is precisely what `/Users/mrp/.config/git/hooks/commit-msg` rejects — using `/commit` here would produce commits the global hook blocks.
- **Strength:** the `allowed-tools` scoping is genuinely good — the command physically cannot run `git push` or anything outside add/status/commit.

### A3. davila7 `commit-work`

- Source: <https://raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/skills/productivity/commit-work/SKILL.md>
- Install: `npx claude-code-templates@latest --skill productivity/commit-work` (repo is a CLI installer; components live under `cli-tool/components/`).
- **The only skill here with a real atomic-commit workflow.** Its step 2 names the split axes explicitly: *"feature vs refactor, backend vs frontend, formatting vs logic, tests vs prod code, dependency bumps vs behavior changes"*, and step 3 mandates `git add -p` patch staging for mixed-file changes (with `git restore --staged -p` to back out).
- **Best single heuristic in the whole landscape** (step 5): describe the staged change in 1-2 sentences *before* writing the message — *"If you cannot describe it cleanly, the commit is probably too big or mixed; go back to step 2."*
- Also requires reviewing `git diff --cached` for secrets, debug logging, and unrelated formatting churn, and running the repo's fastest meaningful check (step 7) before moving on.
- **Weakness:** prescribes `git commit -v` (interactive editor) for multi-line messages — the opposite of Sentry's rule, and awkward for an agent. It has no opinion on subject length.

### A4. davila7 `commit-smart`

- Source: <https://raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/skills/git/commit-smart/SKILL.md>
- **The only skill with an explicit diff→type decision table.** Verbatim mapping: new files with new functionality → `feat`; new/added tests → `test`; changes to existing logic fixing wrong behavior → `fix`; structural, no behavior change → `refactor`; `package.json`/`tsconfig`/CI → `chore`; build/bundler config → `build`; README/docs/comments → `docs`; whitespace/semicolons → `style`; perf → `perf`.
- **Scope inference is also mechanical:** `src/api/` → `api`, `src/components/auth/` → `auth`, `tests/` → `tests`, root config files → omit scope, multiple unrelated areas → omit scope.
- Accepts `$ARGUMENTS` overrides: `/commit-smart fix` sets the type, `/commit-smart refactor api` sets type and scope.
- 72-char subject, imperative, no trailing period, body explains **WHY** ("the diff shows what"), body skipped for trivial changes.
- **Weakness:** the type/scope tables are heuristics presented as rules — a `fix` that adds a new file gets mislabeled `feat`. Best used as a reference table, not an authority.

### A5. davila7 `commit-guardian` (agent)

- Source: <https://raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/agents/git/commit-guardian.md>
- A pre-commit **gate agent**, not a message writer. Runs 10 ordered checks and refuses to commit on failure, printing a box-drawn PASS/WARN/BLOCK report.
- Checks, verbatim scope: 1 branch (BLOCK on `main`/`master`) · 2 secret scan (`AKIA…`, `ghp_…`, `sk-…`, JWTs, DB URLs — escalate to human) · 3 build (auto-detects .NET/Node/Python/Go/Rust) · 4 tests · 5 lint/format (auto-fix + re-stage) · 6 static review (unused imports, debug statements, leftover TODOs) · 7 docs updated · 8 file size · 9 **atomicity** (suggests a split, waits for human) · 10 Conventional Commits format (BLOCK + propose corrected message).
- **Strength:** checks 1, 2 and 9 are the three failure modes an LLM commit workflow actually hits.
- **Weakness:** it duplicates work Husky already does in this repo (`/Users/mrp/Documents/1-Projects/OpenSource/awesome-react-native-ui/rnui.dev/.husky/pre-commit`), and running a full build + test suite through an agent on every commit is slow. A deterministic hook does checks 2-5 better than a prompt can.

### A6. davila7 `git-commit-helper`

- Source: <https://raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/skills/development/git-commit-helper/SKILL.md>
- The weakest of the four davila7 entries: a plain Conventional Commits cheat sheet (7 types) plus `git diff --staged` examples.
- Notable only for a quirk: its frontmatter carries a `hooks.PostToolUse` block that appends a log line to `~/.claude/git-commit-helper.log` on every Bash call. That is a skill silently installing a global hook — worth knowing before installing.

### A7. wshobson `git-pr-workflows`

- Source: <https://raw.githubusercontent.com/wshobson/agents/main/plugins/git-pr-workflows/commands/git-workflow.md>, `plugin.json` v1.3.1, MIT, author Seth Hobson.
- Install: `/plugin marketplace add wshobson/agents` then `/plugin install git-pr-workflows`.
- Not a commit-message tool. It is a **stateful, multi-phase orchestrator**: writes `.git-workflow/state.json`, resumes interrupted sessions, requires each step to write an output file before the next begins ("do NOT rely on context window memory"), stops at phase checkpoints for user approval via AskUserQuestion, and halts on any failure.
- Flags: `--skip-tests --draft-pr --no-push --squash --conventional --trunk-based`; `conventional` defaults to `true`.
- Ships a bundled `code-reviewer` agent plus `/pr-enhance` and `/onboard`.
- **Strength:** the state-file discipline is the right architecture for long workflows. **Weakness:** enormous ceremony for "write me a commit message" — this is a PR-shipping tool, and `wshobson/agents` has **no** dedicated commit skill (verified by grepping its full tree).

### A8. AtomicCommit-Pro

- Source: <https://github.com/milc3sar/AtomicCommit-Pro>, `gh api repos/milc3sar/AtomicCommit-Pro` → **0 stars, last push 2026-01-16**.
- Description (Spanish) states its purpose is fragmenting complex changes into indivisible logical units, separating fixes/features/styles.
- Listed only for completeness — it is the one repo dedicated purely to atomic splitting, but zero stars and 6 months stale make it unvettable. Do not install; steal the idea from `commit-work` instead.

---

## Part B — what is already on this machine

### B1. `caveman:caveman-commit` — installed, and it is the best local option

- Skill: `/Users/mrp/.claude/plugins/cache/caveman/caveman/ef6050c5e184/skills/caveman-commit/SKILL.md`
- Slash command: `/Users/mrp/.claude/plugins/cache/caveman/caveman/ef6050c5e184/commands/caveman-commit.toml`
- Installed from `JuliusBrussee/caveman` at sha `ef6050c5e1848b6880ff47c32ade1a608a64f85e` (`/Users/mrp/.claude/plugins/installed_plugins.json`).
- **Rules, from the file:** `<type>(<scope>): <imperative summary>`; types `feat fix refactor perf docs test chore build ci style revert`; **≤50 chars preferred, hard cap 72**; no trailing period; match project capitalization.
- **Body only when needed** — skipped when the subject is self-explanatory; added only for non-obvious *why*, breaking changes, migration notes, linked issues. Wrapped at 72, `-` bullets, `Closes #42` at the end.
- **Auto-Clarity rule:** always force a body for breaking changes, security fixes, data migrations, and reverts — *"future debuggers need the context."*
- **Explicit banned list:** "This commit does X", "I"/"we"/"now"/"currently", "As requested by…", emoji, restating a filename the scope already covers, and — decisively — **"Generated with Claude Code" or any AI attribution**.
- **Boundaries:** generates the message *only*. Does not `git commit`, does not stage, does not amend; outputs a paste-ready code block.
- **Why it wins locally:** it is the only commit tool in this entire study (public or local) whose prompt is aligned with this machine's anti-attribution hooks. Every other option is either silent on attribution or actively adds it.
- **Gap:** by design it does nothing about staging or splitting. That's the hole.

### B2. `no-ai-coauthor` — installed, and installed **machine-wide**

- Skill: `/Users/mrp/.claude/skills/no-ai-coauthor/SKILL.md` (source of truth: `/Users/mrp/dotfilesOSX/claude/.claude/skills/no-ai-coauthor/`)
- Template: `/Users/mrp/dotfilesOSX/claude/.claude/skills/no-ai-coauthor/templates/commit-msg`; installer `install.sh`.
- **Confirmed active globally:** `git config --global core.hooksPath` → `/Users/mrp/.config/git/hooks`, and `/Users/mrp/.config/git/hooks/commit-msg` is the skill's 2.6K hook (verified by reading its header). Every existing and future repo on this machine inherits it.
- **Confirmed active at the source too:** `/Users/mrp/.claude/settings.json` contains `"attribution": {"commit": "", "pr": "", "sessionUrl": false}` — Claude Code stops emitting attribution before a hook ever has to catch it.
- Four layers per the SKILL.md: (a) `.claude/settings.json` suppression, (b) `.githooks/commit-msg` rejection, (c) `core.hooksPath` for distribution, (d) a CI workflow as the only un-bypassable layer.
- Covers Claude, Copilot, Cursor, Aider, Codex, Windsurf, Codeium, Devin, Jules, Gemini, CommandCode, Hermes — matching bot **emails** precisely and product **names** only in the trailer's name position, so `CLAUDE.md`, `@anthropic-ai/sdk`, model ids and human coauthors on agent-ish domains are false-positive-safe.
- The installer is idempotent and self-verifies (asserts the hook blocks a trailer and allows a clean message) before reporting success.

### B3. This repo's four-layer commit guard (commit `30aa29b`)

Commit `30aa29b` "chore: block AI attribution trailers in commits" is the per-repo instance of B2, adapted because Husky already owned `core.hooksPath`:

| Path (absolute) | Role |
|---|---|
| `/Users/mrp/Documents/1-Projects/OpenSource/awesome-react-native-ui/rnui.dev/.claude/settings.json` | `{"attribution": {"commit": "", "pr": "", "sessionUrl": false}}` — suppress at source |
| `…/rnui.dev/.githooks/commit-msg` | the real hook: rejects the trailer family + AI author identity, exits 1 with a red message |
| `…/rnui.dev/.husky/commit-msg` | 3-line shim, `exec bash .githooks/commit-msg "$@"` — husky runs under `sh -e`, the hook is bash |
| `…/rnui.dev/.github/workflows/no-ai-attribution.yml` | un-bypassable CI backstop (`--no-verify` skips local hooks); scans `origin/base..HEAD` on PRs |

The commit body records the reasoning: repointing `core.hooksPath` at `.githooks` would have disabled the existing husky `pre-commit` script, so a shim was used instead. The CI workflow's own comment notes it should be made a **required status check** on the default branch — worth confirming that was done in repo settings.

Note the repo `pre-commit` (`…/rnui.dev/.husky/pre-commit`) is project-specific bookkeeping, not quality gating: `pnpm run update:lastcommit`, followed by a `git add` of the generated JSON. **There is no lint/typecheck/test gate on commit in this repo.**

### B4. `setup-pre-commit` — installed, not applied here

- `/Users/mrp/.claude/skills/setup-pre-commit/SKILL.md` (91 lines).
- Detects the package manager from the lockfile (`package-lock.json`/`pnpm-lock.yaml`/`yarn.lock`/`bun.lockb`), installs `husky lint-staged prettier`, runs `npx husky init`, writes `.husky/pre-commit` with `npx lint-staged` + `npm run typecheck` + `npm run test`, writes `.lintstagedrc` (`{"*": "prettier --ignore-unknown --write"}`) and a `.prettierrc` if missing. Omits typecheck/test lines if the scripts don't exist.
- **Overlap warning:** this repo already has husky and a `.husky/pre-commit` doing something else. Running this skill as-is would overwrite that file and drop the `lastcommit` generation. If you want lint-staged here, merge by hand.

### B5. `git-guardrails-claude-code` — installed skill, adjacent not overlapping

- `/Users/mrp/.claude/skills/git-guardrails-claude-code/SKILL.md` (95 lines), script at `scripts/block-dangerous-git.sh`.
- Installs a **PreToolUse** hook on `Bash` that blocks, before execution: `git push` (all variants incl. `--force`), `git reset --hard`, `git clean -f`/`-fd`, `git branch -D`, `git checkout .`/`git restore .`. Claude is told it "does not have authority" over these.
- Asks scope first (project `.claude/settings.json` vs global `~/.claude/settings.json`).
- **It does not touch `git commit` or commit messages.** Complementary to everything above — it protects against destructive ops, not bad commits.
- Not currently wired into this project: `…/rnui.dev/.claude/settings.json` contains only the `attribution` key, no `hooks` block.

### B6. Everything else checked and found empty

- `/Users/mrp/.claude/agents/` — contains only `.gitkeep`. **No agents installed.**
- `/Users/mrp/.claude/commands/` — `graphify-site.md`, `scrape-site-and-graphify.md`, `scrape-site.md`, `tx.md`. **No commit slash command.**
- `/Users/mrp/.claude/skills/` — 50 skills; the only commit/git-adjacent ones are B2, B4, B5 plus `resolving-merge-conflicts`.
- Installed plugins (`/Users/mrp/.claude/plugins/installed_plugins.json`): `caveman`, `warp@claude-code-warp` (no markdown skills at all), `mempalace`, `ponytail`, `humanizer`. Only caveman contributes a commit tool.
- Known marketplaces (`/Users/mrp/.claude/plugins/known_marketplaces.json`) include `anthropic-agent-skills` (anthropics/skills) and `claude-plugins-official` — so `commit-commands` is **one command away** from being installable, but is not installed.
- A recursive `find … -iname '*commit*'` over `/Users/mrp/.claude/plugins/cache` and `/Users/mrp/dotfilesOSX/claude` returned exactly four hits: the two caveman files, `setup-pre-commit/`, and the `no-ai-coauthor` `commit-msg` template. Nothing hidden.

---

## What to actually use / gaps

**Use `/caveman-commit` for messages.** It is installed, it is stricter than every public option on subject length, and it is the only one that bans AI attribution — which matters because two independent layers on this machine (`/Users/mrp/.config/git/hooks/commit-msg` globally, `…/rnui.dev/.githooks/commit-msg` locally) will hard-reject a commit that carries one. Installing Anthropic's `commit-commands` would fight your own hooks.

**Do not install anything else wholesale.** Three real gaps exist; two are worth closing by copying a rule, not a package.

| Gap | Who has the answer | Cheapest fix |
|---|---|---|
| **Atomic splitting.** `caveman-commit` explicitly does not stage or split. Nothing on this machine decides commit boundaries. | [`commit-work`](#a3-davila7-commit-work) step 2-3 (`git add -p`, split axes) and its step-5 test | Add ~6 lines to your own commit workflow: the split axes + *"if you can't describe the staged change in two sentences, it's too big"*. Installing the whole skill duplicates message rules you already have and adds a conflicting `git commit -v` instruction. |
| **`\n` in commit messages / interactive editor.** A real agent failure mode; nothing local guards it. | [Sentry `commit`](#a1-getsentryskills--commit) | One rule: separate `-m` args per paragraph, never literal `\n`, never open an editor. |
| **Secrets and PII in messages and diffs.** No local layer checks this. The repo hook only pattern-matches AI trailers; the repo `pre-commit` only regenerates JSON. | Sentry's PII rule + [`commit-guardian`](#a5-davila7-commit-guardian-agent) check 2 | A deterministic secret-scan hook beats a prompt here. Not a skill problem. |

**Two things to verify rather than build:**
1. Is `no-ai-attribution.yml` actually a **required status check** on `main`? Its own comment says it must be, and it is the only un-bypassable layer — `git commit --no-verify` walks past both commit-msg hooks.
2. This repo has **no lint/typecheck/test gate** on commit (`…/rnui.dev/.husky/pre-commit` only regenerates two JSON files). `setup-pre-commit` (B4) would add one, but **it will overwrite that file** — merge by hand, don't run it blind.

**Skip:** `commit-commands` (adds attribution your hooks reject, and enforces no convention), `git-commit-helper` (a cheat sheet that silently installs a global logging hook), `AtomicCommit-Pro` (0 stars, stale), `git-pr-workflows` (a PR shipper, not a commit tool). `commit-smart`'s diff→type and path→scope tables are worth reading once as a reference; they don't need installing.
