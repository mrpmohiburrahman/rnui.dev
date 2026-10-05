# Where does a live-enough star count come from

Status: resolved
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

## Answer

**A server-side `fetch` of `api.github.com` with `next: { revalidate: 21600 }` (6 hours), falling back
to `metrics/weekly.json` when the fetch fails. Freshness bound: at most 6 hours, enforced by the
framework. No token, no cron, no CI change.**

Full report with evidence: [`research/02-star-count-source.md`](../research/02-star-count-source.md).

**The charting decision does not survive as the primary source.** `metrics/weekly.json` was chosen
because it "already exists, already refreshed weekly." The first half is true and the second is false
in the strongest available way:

- The workflow has been modified **exactly once**, on 2026-06-04 (`1d779e3`).
- `gh run list` returns **18 runs, 18 failures, zero successes** — earliest 2026-06-08, the first
  Monday after the file was added.
- Every commit to `metrics/weekly.json` is a hand commit. **The bot has never written it.** `343` is
  a number a human typed; the live value is 350.

So it was never rot — it never worked, and four months passed without anyone noticing.

**A correction to what charting told the maintainer.** Charting blamed the pnpm 11 upgrade. That is
wrong: `packageManager` became `pnpm@11` in `f143745` on **2026-09-25**, three months *after* the
first failure, and that commit is itself the cause of a *different*, louder failure now live on
`main` — `ci.yml` pins `version: 10` against the same field and both its jobs die with `Multiple
versions of pnpm specified` (6 consecutive red runs on `main`, most recently 2026-10-05T03:25Z). The
June-era metrics logs are expired (`HTTP 410`), so **the original cause is not recoverable** and may
be unrelated. What *is* established is the documented fix: `pnpm/action-setup@v4`'s README makes
`version` optional when `packageManager` is present, so the pin should be dropped.

Note the asymmetry that let this hide: `ci.yml` fails loudly, `metrics-update.yml` fails with a single
downstream `Unable to locate executable file: pnpm` and no action-level error. Same class of mistake,
one impossible to miss and one invisible.

**Why the ISR fetch rather than a repaired cron.** A repaired cron bounds freshness at 7 days *only
while it works* — and this one's success rate is 0%. The build-time variant has the same class of
dependency, just a different trigger (deploy cadence). The route-handler variant is worse: the header
is a server component, so calling its own route handler is a self-hop. shields.io cannot carry F's
chip tokens or the word that changes at `xl`. A client-side fetch is *possible* — verified
`access-control-allow-origin: *` — but leaks every visitor's IP to GitHub and lands the number after
first paint, so the chip reflows.

**Verified GitHub API, unauthenticated:** `200`, `x-ratelimit-limit: 60`, `remaining: 42`,
`access-control-allow-origin: *`, `stargazers_count: 350`. Four requests a day is negligible even
against Vercel's shared egress IPs; a `GITHUB_TOKEN` would raise the ceiling to 5,000/hour if that
ever became a concern, and is not needed now.

**The useful side effect:** the star control becomes **independent of the broken cron**. Whatever
June's cause was, the header stops depending on it.

**Staleness is knowable at render time on both paths**, which is what
[What may a stale count be allowed to say](#03) needs: on the fetch path by construction (it cannot
exceed `revalidate`), and on the fallback path via the `generated_at` already in the file. Ticket 03
can therefore set its expiry bound to the `revalidate` interval and have a single rule for both.

**Not on this feature's critical path:** repairing the two workflows. That is a real defect and it is
recorded in the map's Out of scope, but the star control does not wait on it and this map should not
absorb it.

## Comments

- 2026-10-05 — **This ticket's mechanism was superseded on 2026-10-05 by
  [What may a stale count be allowed to say](03-what-may-a-stale-count-be-allowed-to-say.md).** The
  maintainer replaced the ISR server fetch with a **committed file holding only the star count,
  refreshed weekly by the repaired `metrics-update.yml` workflow**, always rendered with no expiry and
  no date. **The answer above is history and must not be built.** The *research* in this ticket is
  still correct and is now load-bearing rather than superseded: the proof that the workflow has failed
  18 runs out of 18 is what makes its repair mandatory, and the documented one-line fix is the fix the
  star control now depends on. Kept rather than rewritten, because `resolved` is terminal and the
  chain of reasoning is part of how the map arrived here.

- 2026-10-05 — Research was meant to run as a `/research` subagent per the wayfinder ticket type.
  Subagents are unavailable in this environment (`explore` and `general` both fail with
  `Model not found`), so the research was done in-session. That is permitted for research tickets and
  changes nothing about the answer, but it is worth knowing the ticket's AFK label was not honoured
  in practice.
- 2026-10-05 — One claim in this ticket's own question is now known to be wrong and is corrected above:
  it said the workflow "has failed every single run — the last eight consecutive", implying a recent
  regression. It has failed all 18 runs it has ever had, back to its first.