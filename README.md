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

This project is integrating OpenAI Codex into the maintenance workflow (in progress on the `codex-grant-prep` branch — see [ROADMAP.md](./ROADMAP.md)):

1. `scripts/codex-ingest.ts` — turn a GitHub/Snack/gist URL into a schema-valid catalog entry + PR.
2. `.github/workflows/codex-triage.yml` — automated Codex review on every submission PR.
3. `scripts/codex-search-index.ts` + `/api/search` + `/search` — natural-language RAG search over the catalog.

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
