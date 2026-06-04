# OpenAI Codex for OSS — Application

> Submission target: https://openai.com/form/codex-for-oss/
> Applicant: MD. Mohibur Rahman (GitHub: mrpmohiburrahman, email: mrpmohiburrahman@gmail.com)
> Numbers fetched: 2026-06-04

---

## Project

- **Name:** rnui.dev
- **URL:** https://rnui.dev
- **Repo:** https://github.com/mrpmohiburrahman/rnui.dev
- **License:** MIT
- **Stars:** 343 (fetched 2026-06-04 via `gh api repos/mrpmohiburrahman/rnui.dev`)
- **Forks:** 11
- **Watchers:** 5
- **Open issues:** 2
- **Last push:** 2026-06-04
- **Created:** 2024-06-10

---

## Maintainer evidence

- Total commits: **250** (`git rev-list --count HEAD`)
- Commits by `mrpmohiburrahman`: **247 (98.8%)** (`git rev-list --count HEAD --author=mrpmohiburrahman`)
- Contributors (GitHub API, 2026-06-04):
  - `mrpmohiburrahman` — 234 contributions
  - `lklima` — 2 contributions
  - `enzomanuelmangano` — 1 contribution
- Sole maintainer; project is in the documented process of opening to co-maintainers (see ROADMAP.md → Q4 2026).
- Commits in last 7 days (2026-05-28 to 2026-06-04): **13** — well above the ≥5 threshold.
- Screenshot of GitHub Insights → Contributors: `docs/application-assets/contributors.png` *(capture before submitting)*

---

## Traffic / ecosystem importance

rnui.dev is the most comprehensive curated catalog of React Native animation references on the web, covering Reanimated, Skia, Moti, Gesture Handler, and Lottie across **19 categories** and **343+ entries**. The React Native ecosystem suffers from animation discoverability — references live in scattered tweets, Snacks, and gists. By centralizing them with reproducible source links and natural-language search, rnui.dev shortens the time from "I want a swipeable card" to "here is the working implementation by a named author."

It complements official docs from Software Mansion (Reanimated) and Shopify (Skia) without duplicating them.

**Traffic (30-day, PostHog):**
- Unique visitors: **TBD — fetch from PostHog before submitting**
- Page views: **TBD — fetch from PostHog before submitting**
- PostHog dashboard screenshot: `docs/application-assets/posthog-30day.png` *(capture before submitting)*

> To fetch: Log into PostHog → Insights → set date range to "Last 30 days" → note unique users and total events. Or use:
> ```
> curl -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" \
>   "https://app.posthog.com/api/projects/<project_id>/insights/trend/?events=[{\"id\":\"\$pageview\"}]&date_from=-30d"
> ```

---

## How Codex will be used

Codex is already integrated in three places in the repository (commits on `codex-grant-prep` branch):

### 1. `scripts/codex-ingest.ts` — URL-to-PR ingestion

Turns any GitHub repo URL into a schema-valid catalog entry and opens a PR automatically. Flow:
1. Fetches README and repo metadata via `gh api`.
2. Calls `gpt-4o-mini` via `@ai-sdk/openai` with a structured-output schema requesting `{ id, title, author, category, description, tags, repoUrl }`.
3. Validates output with Zod against the catalog schema.
4. Appends the entry to the correct `data/<category>.ts` file using `ts-morph` (AST-safe, preserves formatting).
5. Prints a thumbnail TODO block with the file path to drop the video asset.
6. Creates a branch `submission/<slug>`, commits, pushes, opens a PR via `gh pr create`.

This collapses the contribution flow from "fork, edit TS by hand, generate a thumbnail, open a PR" to one command: `pnpm codex:ingest <url>`. Expected to significantly increase inbound submission rate.

```bash
pnpm codex:ingest https://github.com/software-mansion/react-native-reanimated
```

### 2. `.github/workflows/codex-triage.yml` — automated PR review

Triggers on every PR (`opened`, `synchronize`, `reopened`). Runs `scripts/codex-review-pr.ts` which:
1. Reads the PR diff via `gh pr diff`.
2. Sends it to `gpt-4o-mini` with a rubric (schema compliance, no duplicate IDs, image asset present, description quality).
3. Posts a review comment via `gh pr review --comment`.
4. Adds labels: `ready`, `needs-thumbnail`, or `spam`.

A single maintainer can keep up with submission volume at scale.

### 3. `scripts/codex-search-index.ts` + `/api/search` + `/search`

Natural-language RAG search over the catalog:
- `pnpm codex:index` reads every entry across all `data/*.ts` files, calls `text-embedding-3-small` per entry, and writes `data/embeddings.json` (local cosine similarity fallback — no Supabase dependency required).
- `GET /api/search?q=...` embeds the query and returns top 20 entries ranked by cosine similarity.
- `/search` page renders results with a live search input.

"Show me shared-element transitions" returns ranked, relevant entries.

**With the grant, API credits will fund:**
- Re-indexing as the catalog grows past current size.
- Per-PR triage at zero marginal cost to the maintainer.
- Experimenting with higher-quality extraction models as they become available.
- A planned "explain this animation's source code" page that uses Codex to annotate the linked source.
- The 6 months of ChatGPT Pro accelerates day-to-day maintainer work across the project.

---

## 12-month deliverables

- 1,000 GitHub stars (from **343** today).
- 200+ community-submitted entries via `pnpm codex:ingest`.
- Co-maintainer onboarded (see ROADMAP.md → Q4 2026).
- Public weekly auto-updated metrics page (already scaffolded: `metrics/weekly.json`, `.github/workflows/metrics-update.yml`).
- Catalog API for IDE plugins (see ROADMAP.md → Beyond).

---

## Other open-source contributions (truthful)

- **`mrpmohiburrahman/rnui.dev`** — sole maintainer; this application. 343 stars, 11 forks, 247/250 commits.
- **`bn.javascript.info`** — single translation contribution commit (Dec 2020). Not a maintainer.

---

## Demo

Loom (2 min): **TBD — record per `docs/demo-script.md` and paste URL here before submitting**

Outline: see `docs/demo-script.md`

---

## Requested benefits

- ChatGPT Pro with Codex (6 months)
- Codex Open Source Fund API credits
- Codex Security access (if available)

---

## Pre-submission checklist

Run these before opening the form:

```bash
# 1. All TBDs resolved
grep -i 'TBD' APPLICATION.md  # must return zero matches after filling PostHog + Loom

# 2. bn.javascript.info not claimed as maintained
! grep -i 'bn.javascript.info.*maintain' APPLICATION.md

# 3. CI green
gh run list --branch codex-grant-prep --limit 1 --json conclusion --jq '.[0].conclusion'
# expected: "success"

# 4. Recent commits
git rev-list --count HEAD --since='7 days ago' --author=mrpmohiburrahman 2>/dev/null \
  || git log --since='7 days ago' --author=mrpmohiburrahman --format="%H" | wc -l
# must be >= 5

# 5. Codex triage workflow registered
gh workflow list | grep codex-triage

# 6. Application screenshots captured
ls docs/application-assets/

# 7. Loom URL filled in
grep -i 'loom' APPLICATION.md | grep -v TBD
```
