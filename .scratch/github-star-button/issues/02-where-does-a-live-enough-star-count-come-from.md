# Where does a live-enough star count come from

Status: open
Type: research
Blocked by:

## Question

**The chosen count source is dead, and its deadness is the finding.** Charting measured it on
2026-10-05:

- `metrics/weekly.json` reads `"generated_at": "2026-06-04"` and `"stars": 343`. The truth today is
  **350** (`gh api repos/mrpmohiburrahman/rnui.dev`). The file is four months stale and seven stars
  wrong.
- `.github/workflows/metrics-update.yml` is scheduled weekly (`0 9 * * 1`) and has **failed every
  single run** — the last eight consecutive scheduled runs, back to 2026-08-10, all `failure`.
- The cause is legible in the log: `##[error]Unable to locate executable file: pnpm`. The workflow
  pins `pnpm/action-setup@v4` with `version: 9`, while `package.json` declares
  `packageManager: pnpm@11.15.1`. The action installs nothing, so `pnpm install --frozen-lockfile`
  has no pnpm to call and the job dies before `metrics:update` ever runs.
- The file's last commit is `e9cb6c4` (2026-07-30) — a **hand** commit, not the workflow. It was
  written from an already-stale copy, which is why a July commit carries a June date.

Establish the cheapest correct way to make the number current, and say plainly whether **the charting
decision to source the count from `metrics/weekly.json` survives**. It may not: the deciding argument
for that file was "already exists, already refreshed weekly" — and the refresh half is false. Weigh
at least:

- **Repair the workflow.** Drop the `version: 9` pin so the action honours `packageManager`, or
  invoke `corepack`. Smallest diff. Costs: the file is still only as fresh as its last cron run, and a
  cron can rot again silently — which is exactly what happened here, unnoticed for eight weeks.
- **Fetch at build time.** `gh api` in the deploy, or a `GITHUB_TOKEN` read. Fresh as of every
  deploy. Costs: a token in CI, and a failed fetch must degrade rather than break the build — the
  shape of that degradation is [What may a stale count be allowed to say](#02)'s to decide.
- **A route handler caching the number.** Fresh on read, one hop, needs an edge cache story and a
  rate-limit story, and puts GitHub in the request path of every page.
- **shields.io, or client-side `api.github.com`.** Recorded here only so it is visibly weighed and
  set aside with a reason, not forgotten.

Also answer, because the spec needs them and only this ticket can see the refresher: does the chosen
mechanism's `generated_at` travel with the number, so staleness is *knowable at render time* or only
knowable to whoever last edited the JSON? And does `metrics:update`'s existing `gh` dependency need a
token in every one of these paths?

**The answer is a mechanism, and the freshness guarantee it actually provides** — stated as a bound
("at most N old"), not as an intention. Link any findings file from this ticket.

## Comments