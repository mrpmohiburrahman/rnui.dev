# 02 — Where does a live-enough star count come from

Research findings. Wayfinder ticket 02, `.scratch/github-star-button/`. All measurements 2026-10-05.

## Verdict

**Fetch `api.github.com` server-side with Next's `next: { revalidate: 21600 }` (6 hours), and fall
back to `metrics/weekly.json` when the fetch fails.** The freshness bound becomes **at most 6 hours**,
and — unlike every other option — it is enforced by the framework rather than by a separate process
that has to keep working. It needs no token (4 requests/day against a 60/hour limit), no cron, no CI
token, and it does not care when the site was last deployed. **The committed JSON cannot be the
primary source**, because its refresher has never once succeeded, but it earns its place as the
fallback, and its `generated_at` is what makes the fallback's own staleness knowable at render time.

## Root cause

**The weekly metrics job has never worked. It is not rot.**

- `.github/workflows/metrics-update.yml` has been modified exactly once: commit `1d779e3`, **2026-06-04**.
- `gh run list --workflow=metrics-update.yml --limit 100` returns **18 runs, 18 `failure`, zero
  successes**, earliest **2026-06-08** — the first Monday after the file was added.
- `metrics/weekly.json` reads `generated_at: 2026-06-04`, and its only commits are `1d779e3`/`5292d91`
  (the same hand-written feature commit) and `e9cb6c4` (2026-07-30, also a hand commit). **The bot has
  never written it.**

So `343` is a number a human typed. The live value is **350** (`gh api`, and `api.github.com`).

**The proximate failure**, from the most recent run's log (`36403646556`, 2026-09-28) — exactly one
error line in the whole job:

```
##[error]Unable to locate executable file: pnpm. Please verify either the file path exists
or the file can be found within a directory specified by the PATH environment variable.
```

`pnpm/action-setup@v4` installs nothing and does not say why; `pnpm install --frozen-lockfile` then
dies on a missing binary. The workflow pins `version: 9` while `package.json` declares
`"packageManager": "pnpm@11.15.1+sha512.81350b07…"`.

**Correction to the charting note.** Charting attributed this to the pnpm 11 upgrade. That is wrong:
`packageManager` became `pnpm@11` in `f143745` on **2026-09-25**, three months *after* the first
failure. Something was already wrong in June. The June-era logs are gone (`HTTP 410` — GitHub retains
run logs for 90 days), so **the original cause is not recoverable.** It may be unrelated config drift.

**The fix is documented.** `pnpm/action-setup@v4`'s README: *"`version` — Optional when there is a
`packageManager` field in the `package.json`. Otherwise, this field is required"*, with the example
"Install only pnpm with `packageManager`" showing **no `version:` input at all**. Drop the pin and let
`packageManager` drive.

**A second, louder instance of the same class is live on `main` right now.** `ci.yml` pins
`version: 10` against the same `packageManager: pnpm@11.15.1`, and both of its jobs fail with:

```
##[error]Error: Multiple versions of pnpm specified:
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION
```

Six consecutive `failure` runs on `main`, most recently 2026-10-05T03:25Z — i.e. since `f143745` on
2026-09-25. Note the two workflows fail *differently* for the same class of mistake: `ci.yml` fails
loudly, `metrics-update.yml` fails silently, which is precisely why the latter went unnoticed for four
months while the former is impossible to miss.

## Options weighed

| Option | Freshness bound | New cost | Failure mode | Visitor sees |
|---|---|---|---|---|
| **ISR server fetch** ✅ | **≤ 6h, structural** | ~20 lines | GitHub 403s → Next serves last good cached value | correct or slightly old, never broken |
| Committed JSON + repaired cron | ≤ 7d *if the cron works*; **unbounded if it does not** | drop one `version:` line | silent; **demonstrated 18/18** | a number that is quietly months wrong |
| Build-time `gh api` | time since last deploy — same class as cron, different trigger | Vercel env token (maintainer action; no `VERCEL_TOKEN` in the shell per `CLAUDE.md`) | failed fetch must degrade, not break the build | correct as of the last deploy |
| Route handler hitting GitHub | ≤ `revalidate` | a self-hop; the header is a server component, so calling your own route is an anti-pattern | 60/hr shared across Vercel's egress pool | as above |
| shields.io `<img>` | theirs, not ours | none | their cache | **cannot carry F's chip tokens or the word that changes at `xl`** |
| client-side `api.github.com` | live | none | 60/hr **per visitor**; layout shift when the number lands | a broken or empty chip for a rate-limited visitor |

**Verified about the GitHub API** (unauthenticated `GET /repos/mrpmohiburrahman/rnui.dev`):
`HTTP 200`, `x-ratelimit-limit: 60`, `x-ratelimit-remaining: 42`,
`access-control-allow-origin: *`, `cache-control: public, max-age=60, s-maxage=60`, `stargazers_count:
350`. So CORS is wide open (client-side is *technically* possible — rejected on privacy and layout-shift
grounds, not capability) and 60/hour is the unauthenticated ceiling. **Four requests a day is
negligible** even against a shared Vercel egress IP. A `GITHUB_TOKEN` would raise the ceiling to
5,000/hour if that ever mattered.

**The strongest argument for the ISR fetch is a side effect:** it makes the star control **independent
of the broken cron entirely**. Whatever the June cause was, the header stops depending on it.

## Does the committed-file decision survive?

**No, not as the primary source. Yes, as the fallback.**

The argument charting recorded for `metrics/weekly.json` was "already exists, already refreshed
weekly." The first half is true; the second is false in the strongest possible way — 18 runs, 18
failures, never once succeeded. A primary source whose updater has a 0% success rate is not a source.

It survives as the fallback because it is already in the repo, costs nothing to read, and degrades
gracefully. Read it *only* when the fetch fails, and gate it on `generated_at`.

## Staleness at render time

**Yes, on both paths** — which is what ticket 03 needs:

- **Fetch path:** staleness is knowable *by construction* — it can never exceed the `revalidate`
  interval, because the framework refetches on that schedule whether or not anything else works.
- **Fallback path:** `generated_at` travels with the number in the same file, so the reader can
  compute the age and refuse to render a number past its bound.

## Files it would touch

- `lib/star-count.ts` — new. The fetch, the `revalidate`, the try/catch, the fallback read, and one
  exported accessor returning `{ stars: number | null, asOf: string | null, source: "github" | "file" }`
  so ticket 03's policy and ticket 05's accessible name have a single shape to consume.
- `components/site-header.tsx` — consume it in the right column (and the phone row). `SiteHeader` is
  already a client component behind a Suspense boundary, but the fetch belongs in a **server**
  component; if that proves awkward inside the header, thread it from `app/layout.tsx` the way
  `recordingCount` already is — which is the existing precedent for build-time data in this header
  (`site-header.tsx:24-26`: "computed in the root layout — never imported here").
- `metrics/weekly.json` — read only, never written. Its writer stays broken until the workflows are
  fixed on their own merits.
- **Not** `.github/workflows/*` — see Out of scope below.

## Verified vs inferred

**Verified:** 18/18 metrics failures with zero successes, earliest 2026-06-08; workflow touched once on
2026-06-04; the single `Unable to locate executable file: pnpm` error; `packageManager` → `pnpm@11`
landed 2026-09-25 in `f143745`; CI's `Multiple versions of pnpm specified` and its 6 consecutive
failures on `main`; the action README's documented fix; the GitHub API status, rate-limit headers,
CORS header, cache-control and star count; `metrics/weekly.json`'s contents and hand-only commit
history.

**Inferred, not verified here:** that June's cause was the same class of configuration drift — its
logs are expired and unrecoverable, so this is a plausible story, not a finding. That Next's
`fetch(..., { next: { revalidate } })` keeps serving the last good value when the upstream errors is
**documented framework behaviour that I did not exercise in this repo**; if the spec depends on it,
the implementer should confirm the degradation path rather than trust this note.
