# Contributing to rnui.dev

Thanks for helping the React Native UI ecosystem stay discoverable.

## Three ways to contribute

### 1. Suggest an entry (easiest)

Open an issue using the **Animation Submission** template. Provide the GitHub repo URL, Expo Snack, or gist. A maintainer — or the automated Codex ingest workflow (coming soon) — will turn it into a PR.

### 2. Submit a PR via `pnpm codex:ingest` (coming soon)

```bash
pnpm codex:ingest -- https://github.com/<author>/<repo>
```

This pipeline (planned, see [ROADMAP.md](./ROADMAP.md)):

1. Fetches the source.
2. Calls OpenAI to extract `{ id, title, author, category, description, tags, repoUrl }`.
3. Validates against the catalog schema.
4. Prints where the Demo must be dropped, and the commands that turn it into a
   published Entry — it does not fetch or encode any media itself.
5. Opens a PR on a branch named `submission/<slug>`.

### 3. Manual entry

1. Fork and branch.
2. Add your entry to the correct file in `data/` — one file per UI category (`buttons.ts`, `carousels.ts`, `sliders.ts`, etc.).
3. Required fields: `id` (unique kebab-case slug), `title`, `author`, `repoUrl`, `category`, `description`, `tags`.
4. Run `pnpm check-types` and `pnpm lint`.
5. Open a PR. The Codex triage workflow (coming soon) will leave an automated review within a minute.

## Never commit binary Assets

Demos (`.mp4`) and Posters (`.avif`) are **not** in this repo. They live in a
Cloudflare R2 bucket served from `cdn.rnui.dev`, and `public/demo/` and
`public/thumbnails/` are gitignored. A PR that adds a video or an image to those
directories will be rejected — not as a style preference, but because a repo
that grows by a video per entry makes every future clone slower, permanently.

So: **your PR changes `data/*.ts` and nothing binary.** Reference the Asset
paths your Demo and Poster will have, and a maintainer publishes the files.

A maintainer drops the Demo at `public/demo/<slug>/<file>.mp4` — `<slug>` being
the Category's lowercase asset slug, `bottomsheets` and not `Bottom Sheets` — and
then runs:

```bash
pnpm posters:generate   # writes the missing Posters as AVIF, one ffmpeg pass each
pnpm assets:publish     # checks every Demo is H.264 and every Poster AVIF, then
                        # uploads what is missing
```

Both need `ffmpeg` (`brew install ffmpeg`). A Poster that already exists is left
alone, so `posters:generate` after a single new recording takes a second.

That command refuses to overwrite an Asset path that is already published,
because Published Assets are cached as immutable for a year and cannot be
corrected after the fact. Re-recording a Demo means a **new** Asset path, never
a reused one. See [docs/r2-setup.md](./docs/r2-setup.md) and
[ADR-0003](./docs/adr/0003-asset-paths-are-immutable.md).

## Local development

```bash
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_CDN_URL is all you need for media
pnpm dev            # Next.js dev server (turbopack)
pnpm check-types    # tsc --noEmit
pnpm lint
pnpm build
```

A fresh clone has no Assets on disk and renders correctly anyway — every Demo
and Poster is fetched from the CDN. You do not need to download 77 MB of media,
and you do not need any Cloudflare credentials.

## Code style

- TypeScript strict mode, avoid `any`.
- Match existing import ordering (handled by the linter / prettier).
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

## Reporting bugs / security issues

- Bugs: [bug template](./.github/ISSUE_TEMPLATE/bug.yml).
- Security: see [SECURITY.md](./SECURITY.md). Do not open public issues for vulnerabilities.

## Code of conduct

By participating you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).
