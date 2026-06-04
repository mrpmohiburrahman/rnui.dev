# rnui.dev

[![CI](https://github.com/mrpmohiburrahman/rnui.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/mrpmohiburrahman/rnui.dev/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/mrpmohiburrahman/rnui.dev?style=social)](https://github.com/mrpmohiburrahman/rnui.dev)
[![Last commit](https://img.shields.io/github/last-commit/mrpmohiburrahman/rnui.dev)](https://github.com/mrpmohiburrahman/rnui.dev/commits/main)

> A curated, searchable catalog of React Native UI components, animations, and design inspiration — with AI-assisted contribution and review powered by OpenAI Codex.

Live: **https://rnui.dev**

## Why

React Native developers spend hours hunting for UI and animation references across Twitter threads, Snacks, and GitHub repos. `rnui.dev` centralizes them with reproducible source links, attribution, and (soon) natural-language search.

## What's inside

Entries are organized into UI-element categories under `data/`:

`accordions`, `arcsliders`, `bottomsheets`, `buttons`, `carousels`, `charts`, `circular-progress-bars`, `dropdowns`, `fullapps`, `headers`, `lists`, `loaders`, `misc`, `onboardings`, `parallaxes`, `pickers`, `sliders`, `tabbars`.

Each entry links to the original repo or Snack with author attribution.

## Powered by Codex

OpenAI Codex (currently `gpt-4o-mini` + `text-embedding-3-small` via the Vercel AI SDK) is wired into three parts of the workflow:

1. **`pnpm codex:ingest -- <github-url>`** (`scripts/codex-ingest.ts`) — fetches repo metadata + README, asks Codex for a structured catalog entry that matches `ItemType` in `data/items.ts`, validates it with Zod, `ts-morph`-appends it to the right `data/<category>.ts`, then opens a `submission/<slug>` PR. Demo-video upload stays manual; the script prints the expected path.
2. **`.github/workflows/codex-triage.yml`** (`scripts/codex-review-pr.ts`) — runs on every PR open/sync, asks Codex to score the diff against a fixed rubric (schema, ID uniqueness, asset paths, category match, source URL), and posts the review as a PR comment. The workflow is gated on the `OPENAI_API_KEY` secret so it stays quiet on forks or before the key is configured.
3. **`pnpm codex:index`** (`scripts/codex-search-index.ts`) + **`/api/search`** + **`/search`** — embeds every catalog entry with `text-embedding-3-small`, writes `data/embeddings.json` (gitignored, regenerated locally), and serves natural-language search via cosine similarity. Migrate to Supabase pgvector when the catalog outgrows JSON.

All Codex-calling commands require `OPENAI_API_KEY` in the environment and fail loudly when it is missing.

## Run locally

This project uses **pnpm**.

```bash
git clone https://github.com/mrpmohiburrahman/rnui.dev
cd rnui.dev
pnpm install
cp .env.example .env.local  # fill in Supabase, Firebase, OpenAI, ImageKit keys
pnpm dev
```

Open http://localhost:3000.

## Contribute

The fastest path: open an issue using the [Animation Submission template](./.github/ISSUE_TEMPLATE/animation-submission.yml) with the source URL. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full flow, including the upcoming `pnpm codex:ingest` shortcut.

## License

MIT — see [LICENSE](./LICENSE).
