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
4. Generates a thumbnail.
5. Opens a PR on a branch named `submission/<slug>`.

### 3. Manual entry

1. Fork and branch.
2. Add your entry to the correct file in `data/` — one file per UI category (`buttons.ts`, `carousels.ts`, `sliders.ts`, etc.).
3. Required fields: `id` (unique kebab-case slug), `title`, `author`, `repoUrl`, `category`, `description`, `tags`.
4. Run `pnpm check-types` and `pnpm lint`.
5. Open a PR. The Codex triage workflow (coming soon) will leave an automated review within a minute.

## Local development

```bash
pnpm install
pnpm dev            # Next.js dev server (turbopack)
pnpm check-types    # tsc --noEmit
pnpm lint
pnpm build
```

## Code style

- TypeScript strict mode, avoid `any`.
- Match existing import ordering (handled by the linter / prettier).
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

## Reporting bugs / security issues

- Bugs: [bug template](./.github/ISSUE_TEMPLATE/bug.yml).
- Security: see [SECURITY.md](./SECURITY.md). Do not open public issues for vulnerabilities.

## Code of conduct

By participating you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).
