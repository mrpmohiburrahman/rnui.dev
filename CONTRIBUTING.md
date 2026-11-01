# Contributing to rnui.dev

Thanks for helping the React Native UI ecosystem stay discoverable.

## Submit an animation

Go to **[rnui.dev/submit](https://www.rnui.dev/submit)** and send the animation with its source link: a GitHub repo, an Expo Snack, or a gist. Attach the demo and describe what it shows. A maintainer reviews each submission before it is published. Do not open an issue to submit an animation.

## Contribute to the site code

Bug fixes, new features, and documentation changes to the site itself are welcome.

1. Fork and branch.
2. Make your change.
3. Run `pnpm check-types`, `pnpm lint`, and `pnpm test`.
4. Open a PR.

A maintainer adds a published animation to the catalogue in `data/` — one file per UI category (`buttons.ts`, `carousels.ts`, `sliders.ts`, etc.). Required fields: `id` (unique kebab-case slug), `title`, `author`, `repoUrl`, `category`, `description`.

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
pnpm lint           # eslint . — warnings are advisory, errors fail CI
pnpm build
```

CI runs `check-types`, `lint`, `test` and `build` on every pull request, so a
clean local run of those four is a clean job. `lint` forbids `console.log` and
friends anywhere the browser or the server renders — `app/`, `components/`,
`hooks/`, `lib/`, `data/`, `utils/`. `console.error` and `console.warn` are
allowed, and `scripts/` is exempt because printing to the terminal is what those
tools are for.

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
