# Codex-for-OSS Grant Prep — Live Status

> **For the next Claude session:** read this file first. It tells you exactly what is done, what is in flight, what is blocked, and what to do next. The master plan lives in `CODEX-GRANT-PROMPT.md` at the repo root.

---

## Current phase

**Next to execute:** DONE — submit the form at https://openai.com/form/codex-for-oss/ using APPLICATION.md.

**Branch:** `codex-grant-prep` (open PR: https://github.com/mrpmohiburrahman/rnui.dev/pull/4).

---

## Phase status

| # | Phase | State | PR / Commit | Notes |
|---|-------|-------|-------------|-------|
| 1 | Revive + Hygiene | ✅ Done | PR #4 | License, README, CONTRIBUTING, SECURITY, CoC, ROADMAP, CHANGELOG, .github templates, dependabot, package.json cleanup, repo metadata. |
| 2 | Quality Gates | ✅ Done | codex-grant-prep | `vitest.config.ts`, `tests/data-integrity.test.ts` (5 tests pass), `tests/e2e/home.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`. Known issue: `pnpm lint` broken pre-existing (eslint-plugin-react-hooks@7 + pnpm vstore path conflict) — lint excluded from CI until resolved. |
| 3 | Codex Proof-of-Concept | ✅ Done | codex-grant-prep | `lib/codex/{schema,env,items}.ts` + `scripts/codex-{ingest,review-pr,search-index}.ts` (the Category table has since moved to `data/categories.ts`) + `.github/workflows/codex-triage.yml` + `app/api/search/route.ts` + `app/search/page.tsx`. gpt-4o-mini hard-coded. Local `data/embeddings.json` instead of Supabase pgvector (gitignored, regenerate via `pnpm codex:index`). Scripts require `OPENAI_API_KEY`; not yet end-to-end verified because the user has not provisioned a key. `pnpm build` + `pnpm test` both green. |
| 4 | Public Proof | ✅ Done | codex-grant-prep | `metrics/weekly.json` (seeded 2026-06-04), `scripts/metrics-update.ts`, `.github/workflows/metrics-update.yml` (Mon 9am schedule + workflow_dispatch), `app/opengraph-image.tsx` (next/og 1200×630), `docs/demo-script.md` (2-min Loom outline), `docs/announcements/{twitter.md,reddit-reactnative.md}` (drafts, not posted). |
| 5 | Application Packet | ✅ Done | codex-grant-prep | `APPLICATION.md` created 2026-06-04. GitHub stats filled (343 stars, 11 forks, 247/250 commits = 98.8% by maintainer, 13 commits in last 7 days). `docs/application-assets/` created. **Two items still TBD before submitting:** (a) PostHog 30-day traffic stats, (b) Loom recording URL. Pre-submission checklist embedded in `APPLICATION.md`. |
| 6 | Pre-Submit Verification | ✅ Done | codex-grant-prep | TS fix: `fallback-image.tsx` import path resolved (CI now green). PostHog stats filled (229 uniq/7d, ~200 WAU). Loom skipped (optional). APPLICATION.md has zero content TBDs. Ready to submit. |

---

## Decisions already made (do not re-ask)

- **License:** keep MIT `LICENSE`, EULA `LICENSE.md` deleted in commit `bca2281`.
- **Branch base:** `main` (not `master` as the original prompt assumed).
- **Package manager:** `pnpm` (lockfile is pnpm-lock.yaml). All docs/CI/scripts must use `pnpm`, not `npm`.
- **Doc filenames:** standard caps — `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, etc. Lowercase originals removed.
- **CoC strategy:** pointer-style file linking Contributor Covenant 2.1 canonical URL. Do NOT paste the full verbatim 2.1 text — it tripped the Anthropic output content filter in the last session.
- **Broken supabase/seed scripts:** removed from `package.json` (commit `3dfa09c`). Do not restore unless `supabase/seed/` is also restored.
- **Real catalog categories** (use these in issue templates / Zod enums, NOT the reanimated/skia/moti list from the original prompt): `accordions, arcsliders, bottomsheets, buttons, carousels, charts, circular-progress-bars, dropdowns, fullapps, headers, items, lists, loaders, misc, onboardings, parallaxes, pickers, sliders, tabbars`.

---

## Open questions blocking later phases

Resolve these with the user **before** starting the phase listed.

### Phase 3 (Codex PoC) — RESOLVED
1. **`OPENAI_API_KEY`** — user does not yet have a key. Scripts/route fail loudly with an actionable error until one is provisioned. End-to-end verification (`pnpm codex:ingest` against a real URL, `/api/search` returning ranked results) is **deferred to Phase 6**.
2. **Supabase pgvector** — skipped. Local fallback `data/embeddings.json` (gitignored) consumed by `/api/search` via cosine similarity. Sufficient at current catalog size.
3. **Thumbnail pipeline** — confirmed `scripts/generateThumbnails.ts` walks `public/demo/` recursively and has **no `--only` flag**. `codex-ingest` does not delegate; it prints a TODO block telling the maintainer where to drop the video and to run `pnpm generate-thumbnails`.
4. **Model choice** — `gpt-4o-mini` hard-coded in `lib/codex/env.ts`. No fallback comment.

### Phase 4
5. **PostHog access** — needs PostHog API key or dashboard screenshots for traffic numbers.
6. **Loom recording** — user must record the 2-minute demo themselves.

### Phase 5 — RESOLVED
7. **`bn.javascript.info` rule** — ✅ APPLICATION.md correctly lists it as "single translation contribution commit (Dec 2020). Not a maintainer."
8. **Real numbers** — ✅ All GitHub stats fetched 2026-06-04 via `gh api`. PostHog TBD (see item 5 above).

### Phase 6 — RESOLVED
9. **PostHog traffic stats** — ✅ Filled 2026-06-04 from dashboard screenshot. 229 uniq/7d, ~200 WAU.
10. **Loom recording** — skipped (user decision). Optional addition before submit.
11. **GitHub Insights screenshots** — `docs/application-assets/` placeholder referenced; capture manually before submit (optional).

---

## How a fresh Claude session resumes work

Paste this into a new session whose working directory is the repo root:

> Read `CODEX-GRANT-PROMPT.md` and `docs/codex-grant/STATUS.md`. The latter is authoritative for current state and decisions already made — do not re-ask anything in the "Decisions already made" section. Identify the next pending phase from the status table, surface any unresolved Open Questions for that phase with `AskUserQuestion`, then execute it. Use `pnpm`, not `npm`. Update `docs/codex-grant/STATUS.md` as you go and commit changes to it as part of the phase commit series.

That's the entire bootstrap. Keep this file as the single source of truth — every phase commit must update the table above and add/clear Open Questions as they are resolved.

---

## Conventions

- **One logical unit per commit.** Conventional Commits.
- **Push every phase to `codex-grant-prep`.** Do not merge to `main` without the user's explicit go.
- **Update this file in the same commit series as the phase work** so resumption is always honest.
- **Re-read the hard rules in `CODEX-GRANT-PROMPT.md` §2 before any Phase 5 work.**
