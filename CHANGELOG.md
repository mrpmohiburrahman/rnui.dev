# Changelog

All notable changes to this project are documented in this file. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `README.md` rewritten with badges, project description, and contribution path.
- `CONTRIBUTING.md` describing the issue → PR → triage flow.
- `SECURITY.md` with a private disclosure address.
- `CODE_OF_CONDUCT.md` pointing to Contributor Covenant 2.1.
- `ROADMAP.md` outlining milestones for Q3 2026 onward.
- `.github/ISSUE_TEMPLATE/animation-submission.yml`, `bug.yml`.
- `.github/PULL_REQUEST_TEMPLATE.md`.
- `.github/dependabot.yml` for weekly npm + github-actions updates.

### Removed
- The tag and label filters. Both filter bodies were commented out, no Entry carried either field, and the sidebar was never handed any values — but `/products?tag=X` still printed a chip and a heading over the *whole* catalogue. `tags` is no longer a required field for a manual entry in `CONTRIBUTING.md`.
- `/feedback`, a copy of `/contactus` differing only in its heading and one line of copy, writing to the same `userFeedback` collection. Zero pageviews in 90 days against `/contactus`'s 18, and no inbound links against four. `/feedback` now redirects to `/contactus`.
- The nav for an `/admin` area that does not exist. No `app/admin` directory, and `app/not-found.tsx` redirects unmatched paths server-side, so the `pathname.includes("admin")` gate that rendered it could never be true.
- The Haskoy webfont, 172KB preloaded on every route and used by nothing: `next/font` emitted `@font-face{font-family:fontSans}` while Tailwind asked for `Haskoy`, and no stylesheet read the `--font-sans` variable. The site rendered in `ui-sans-serif`/`system-ui` before and after.
- The OpenAI/Codex layer, in full: `scripts/codex-{ingest,review-pr,search-index}.ts`, `lib/codex/`, `.github/workflows/codex-triage.yml`, the `/search` page and its `/api/search` route, and the `ai` / `@ai-sdk/*` / `ts-morph` dependencies. Reasoning in [ADR-0006](./docs/adr/0006-search-does-not-ship-and-the-codex-layer-goes-with-it.md).
- The grant paperwork the Codex layer was written for: `APPLICATION.md`, `CODEX-GRANT-PROMPT.md`, `docs/codex-grant/` and `docs/demo-script.md`. The two drafts in `docs/announcements/` went with them — their headline features were the three Codex tools, so publishing either would advertise something the site does not do. The Twitter / Bluesky announcement is still an open Q4 item in `ROADMAP.md` and starts from a blank page.
- `LICENSE.md` (legacy EULA inherited from the original Next.js template). Project license is MIT (`LICENSE`).
- Legacy lowercase `code-of-conduct.md` and `contributing.md` — replaced with standard-cased equivalents.

### Changed
- `package.json` — removed scripts whose target files do not exist in the repo: `seed:products`, `bulk:enrich`, `normalize:data`, `fetch:og`, `enrich`. The corresponding `supabase/seed/` directory is not present; these scripts can be reintroduced when (and if) that pipeline is restored.

## Prior history

See `git log` for changes prior to the introduction of this changelog.
