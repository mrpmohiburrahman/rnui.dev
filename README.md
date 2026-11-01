# rnui.dev

[![CI](https://github.com/mrpmohiburrahman/rnui.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/mrpmohiburrahman/rnui.dev/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/mrpmohiburrahman/rnui.dev?style=social)](https://github.com/mrpmohiburrahman/rnui.dev)
[![Last commit](https://img.shields.io/github/last-commit/mrpmohiburrahman/rnui.dev)](https://github.com/mrpmohiburrahman/rnui.dev/commits/main)

> A curated, searchable catalog of React Native UI components, animations, and design inspiration.

Live: **https://rnui.dev**

## Why

React Native developers spend hours hunting for UI and animation references across Twitter threads, Snacks, and GitHub repos. `rnui.dev` centralizes them with reproducible source links and attribution.

## What's inside

Entries are organized into UI-element categories under `data/`:

`accordions`, `arcsliders`, `bottomsheets`, `buttons`, `carousels`, `charts`, `circular-progress-bars`, `dropdowns`, `fullapps`, `headers`, `lists`, `loaders`, `misc`, `onboardings`, `parallaxes`, `pickers`, `sliders`, `tabbars`.

Each entry links to the original repo or Snack with author attribution.

## Run locally

This project uses **pnpm**.

```bash
git clone https://github.com/mrpmohiburrahman/rnui.dev
cd rnui.dev
pnpm install
cp .env.example .env.local  # fill in Supabase and Firebase keys
pnpm dev
```

Open http://localhost:3000.

## Submit an animation

Found a React Native UI animation worth featuring? Submit it at **[rnui.dev/submit](https://www.rnui.dev/submit)** with its source link (GitHub repo, Expo Snack, or gist). A maintainer reviews each submission before it is published. Do not open an issue to submit an animation.

## Contribute to the site code

Code contributions are welcome — bug fixes, new features, and documentation changes to the site itself. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the setup and PR flow.

## License

MIT — see [LICENSE](./LICENSE).

---

Built by **MD. Mohibur Rahman** — [resume.rnui.dev](https://resume.rnui.dev)
