# Does the star file get its own workflow, or ride with the existing one

Status: resolved
Type: grilling
Blocked by:

## Question

**The star count's entire reliability now rests on one scheduled job, and the obvious way to build it
puts that job inside a workflow that does five other things.**

[What may a stale count be allowed to say](#03) settled the policy: the number always renders, the
staleness defence is an assertion that the stored file is ≤ 7 days old, and that assertion lives in the
workflow that writes the file. So the workflow's reliability *is* the count's reliability. The question
is what else rides along with it.

The existing `.github/workflows/metrics-update.yml` runs `pnpm metrics:update`, which fetches five
separate things in five separate `gh api` calls — stars, forks, watchers, open issues, and the
contributors list — plus two `git log` counts. Measured from its own log history: **it has failed 18
runs out of 18**, and the last logged cause was a missing `pnpm` binary. None of those five numbers is
read by the application; only the script writes them.

So:

- **A second workflow**, whose only job is stars-and-its-date. One thing to break, one thing to repair,
  and a failure means the star count rather than something incidental. Costs a second file and a
  second schedule entry, and leaves the other five numbers on a workflow that is still broken.
- **Extend the existing workflow**, which is the smaller diff and one schedule for the repo. Costs
  coupling: the contributors API is a different endpoint with different failure modes, so it can fail on
  a night the stars succeeded — and if that failure takes the job down before the staleness assertion
  runs, the assertion never fires and the email says "workflow failed" instead of "stars went stale".
  Those are two different problems a maintainer would have to tell apart from one email.

The second is the sharper half of this: **the staleness assertion has to run even when the fetching
did not.** Whatever the workflow's shape, the assertion needs to be reachable when the other four
numbers are the thing that broke.

Also settle the two smaller questions the shape forces:

- **Does `metrics/weekly.json` and `scripts/metrics-update.ts` survive?** The maintainer chose a new
  file holding only the stars, which leaves the old file written by a script that a repaired workflow
  would still run, still producing five stale numbers nobody reads. Keep it (something else may want it
  later — the OG image work in `.scratch/social-cards/` was going to need exactly these figures) or
  delete it as part of this?
- **Does the assertion's threshold have to equal the schedule's period?** A weekly schedule asserting
  "not older than 7 days" fails the first run after any delay — a cancelled run, a GitHub outage, a
  weekend. 8 or 9 days is the same defence with slack. Pick the number, because a threshold that fires
  on the first hiccup trains a maintainer to ignore the email, which is worse than having no email.

**The answer is the workflow's shape** — what it does, what it is allowed to also do, and the exact
staleness threshold that sends the email.

## Answer

Resolved 2026-10-05. **Its own workflow, shell-only with no toolchain, on a weekly schedule, with a
9-day refresh-time assertion; and `metrics/weekly.json` and everything that wrote it are deleted.**

The maintainer accepted all five recommendations in one instruction, so the grilling ran as five
decisions in one round and the **shape question this ticket was named after turned out to be derived
rather than chosen** — see below. Three corrections to the question's premises and one to my own
round-1 framing are recorded at the end, because two of them change what the assertion is *for*.

| Question | Answer |
|---|---|
| Does `metrics/weekly.json` survive? | **No** — file, script, npm entry and workflow all deleted. |
| Does the refresh need this repo's toolchain? | **No** — shell only; no `setup-node`, no `pnpm/action-setup`, no install. |
| Must the assertion survive a failed fetch? | **Yes** — a step with `if: always()`, guarded to scheduled runs, failing **with the age in the message**. |
| The threshold? | **9 days**, against an unchanged weekly `0 9 * * 1`. |
| Alert channel? | **Email only**, with the notification setting written in as a **precondition**. |

### The shape question was never a real choice, and why

Charting offered "a second workflow" or "extend the existing one" as the decision. **Deleting
`metrics/weekly.json` removes the second option from the table**, because extending a workflow means
adding a job to it, and once the five unused numbers go there is no job left to add to. So the order
was: the survival question decided first, and the shape followed from it.

That is not a dodge — it is the better order, because the shape question *as written* had a false
premise underneath it. The ticket's reason for keeping the file was that "the OG image work in
`.scratch/social-cards/` was going to need exactly these figures". **It does not.** That effort's
counts are **298 Recordings, 24 Contributors, 18 Categories** — computed from the catalogue in
codebase — and its ticket 04 exists to *fix* the shipped OG card's wrong "343+ animations" claim
against those 298. Its `343` is a coincidence of digits, not a reader of this file. Nothing in that
effort wants `forks`, `watchers`, `open_issues` or an API contributor list.

And the file is not merely unread — it is **demonstrably rotting at more than one rate**:

| field | file says (2026-06-04) | live today | drift in 123 days |
|---|---|---|---|
| `stars` | 343 | 350 | −7 |
| `forks` | 11 | 11 | exact |
| `watchers` | 5 | 5 | exact |
| `open_issues` | 2 | **8** | **−6** |
| `total_commits` | 237 | — | stale |

`open_issues` is the argument. It moves on its own clock — anyone filing an issue changes it — so a
weekly snapshot of it is wrong most of the time and nobody would notice, because nothing reads it.
A file whose whole job is to be right about one number should hold that number.

### The workflow, exactly

`.github/workflows/star-count.yml`. Name, cron and permissions carry over from the file it replaces;
**everything else is rebuilt from nothing.**

```yaml
name: Star Count
on:
  schedule: [{ cron: "0 9 * * 1" }]   # unchanged: Mondays 09:00 UTC
  workflow_dispatch:                  # kept — this is how a maintainer repairs by hand
permissions:
  contents: write
jobs:
  refresh:
    runs-on: ubuntu-latest
```

**Step order is load-bearing, and two steps of it are traps.**

1. **`actions/checkout@v4`**, default `fetch-depth: 1`. The old workflow needed `fetch-depth: 0` only
   because `scripts/metrics-update.ts` counted commits with `git log`; nothing here needs history.
2. **`id: age` — read the age of the file *as checked out*, before anything writes.** Whole-day
   arithmetic in UTC: `days = floor((now_utc − generated_at) / 86400)`, both sides from
   `date -u +%s`, compared as integers. Write `days` to `$GITHUB_OUTPUT`. **`set -euo pipefail`.**
3. **Fetch, write, commit** — `gh api repos/mrpmohiburrahman/rnui.dev --jq .stargazers_count` with
   `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`; write the two-key file; `git add` that one path; commit
   only if it changed; push, as `github-actions[bot]`. `set -euo pipefail`.
4. **`if: always() && github.event_name == 'schedule'` — assert on step 2's captured `days`.**
   If `days > 9`, exit 1 with the age and the date in the message.

**The two traps, stated because an implementer will otherwise get both wrong.**

- **Step 4 must read `steps.age.outputs.days`, not the file.** A step that re-reads
  `scripts/star-count.json` reads the copy step 3 just wrote, is always 0 days old, and never fires.
  This is the single most likely way to ship a version of this workflow that looks correct and
  silently asserts nothing.
- **The file must keep its date field, or the weekly commit can no-op.** With the date retained the
  file *always* differs week to week, so the commit always fires. If the file held only a number and
  the star count happened not to move, `git diff --cached --quiet` would take the "No changes to
  commit" branch and the run would **pass having written nothing** — which is precisely the failure
  ticket 03 identified. Ticket 03's "no date" is a rule about the **render**; the file carrying one
  is not a contradiction, and this is the second thing the date is load-bearing for.

### The file, and where it lives

**`scripts/star-count.json`**, seeded in the same commit with the count measured live today:

```json
{ "stars": 350, "generated_at": "2026-10-05" }
```

`scripts/` is not a guess — it is where this repo already keeps **a committed JSON written by
automation and imported by a component**: `scripts/lastCommitDate.json`, written by
`scripts/updateLastCommitDate.js` and read by `components/last-updated.tsx:1` as
`import data from "@/scripts/lastCommitDate.json"`. `data/` holds only `.ts` modules and `metrics/`
is emptied by this change, so the existing precedent is also the only house-style answer.
`resolveJsonModule` is already `true` (`tsconfig.json:16`) and `moduleResolution` is `"Bundler"`, so
the import compiles with no config change. The name is kebab to match the workflow it ships with,
though its neighbour is camelCase — immaterial, and flagged only so it reads as chosen.

`generated_at` keeps the **exact key** `metrics/weekly.json` used, deliberately: ticket 03's answer
and this map both quote that key, so keeping it leaves the existing prose literally true instead of
creating a rename nobody asked for. Written with a trailing newline, as `metrics-update.ts:51` did.

**This is a build-time read, and that is a consequence to state rather than discover.** The count is
inlined when the site is built, so the rendered number changes when the weekly bot commit's **deploy**
lands, not when the commit lands. That is fine today — `www.rnui.dev` deploys on push to `main`, so
the bot commit deploys and the count goes live minutes later — and it is exactly how
`lastCommitDate.json` already works. It would stop being fine only if the site were ever served from
a build that is not rebuilt weekly. One related note: on a **branch deployment** the count is
whatever was committed when the branch was cut, which is consistent with ticket 06's decision that the
control appears there at all.

### Complete change list

| Action | Path |
|---|---|
| delete | `.github/workflows/metrics-update.yml` |
| delete | `metrics/weekly.json` |
| delete | `metrics/` (empty once the file above goes) |
| delete | `scripts/metrics-update.ts` |
| edit | `package.json` — drop `"metrics:update": "tsx scripts/metrics-update.ts"` |
| create | `.github/workflows/star-count.yml` |
| create | `scripts/star-count.json` (seeded `350` / `2026-10-05`) |

Verified there is nothing else to touch: `metrics/` is referenced in exactly five places, all of them
either the script, the workflow, a build artefact (`tsconfig.tsbuildinfo`), or
`components/prototype/star-control-prototype.tsx:32` — which is **prototype-branch-only**, lives on
`prototype/star-button`, and is throwaway by the map's standing preference. Its comment goes stale and
that is not drift. `.github/workflows/no-ai-attribution.yml` does not reference metrics.

**This is the whole CI repair, and it is smaller than repairing the old workflow would have been.**
The one-line fix this map inherited — delete `version: 9` from `pnpm/action-setup@v4` — is **no longer
part of it**, because the job that carried the pin no longer exists. `.github/workflows/ci.yml`'s
identical `version: 10` pin stays red and stays **out of scope**, as decided.

### What the assertion catches, and what it cannot

Stated plainly, because ticket 03's framing over-promised slightly and this is the sharper truth.

**It catches a failed refresh, one cycle late.** That is its real and unique job. With the date
retained and `set -euo pipefail` in the fetch step, a failed fetch already fails the job by itself —
so the narrow case ticket 03 named (a green run that wrote nothing) is covered by ordinary exit codes.
What the date assertion adds is the **cross-run** check: at the start of a run it sees how old the
count already is, which is the only thing in the system that can say "the refresh has been broken
since *date X*".

**It cannot detect its own non-execution.** A workflow that never runs — dropped schedule, disabled
workflow — fires no step, so nothing inside it can notice. This is the real limit of the design and no
threshold changes it; only a second, differently-scheduled checker could, which is a cost the
maintainer declined under Q5.

### The threshold's arithmetic, and a correction to my own round 1

Period 7 days, threshold 9 days, so **two consecutive failed runs before the email**: run *N* fails
leaving the file 7 days old (7 ≤ 9, assertion passes), run *N+1* finds it 14 days old and fires. The
worst case is therefore **≈14 days of silence** before the maintainer is told, and the email says
which date the refresh broke on, not merely that something broke.

**What this would have caught, measured.** The file was last written `2026-06-04`; the first failed
run was `2026-06-08`. Run two, `2026-06-15`, would have found an 11-day-old file and fired —
**112 days before today.** The count sat wrong and unnoticed for four months; this design would have
emailed inside the first fortnight.

**Correction.** In round 1 I priced 9 days as "the rendered number can be ~10 behind rather than ~7".
That conflated *days stale* with *stars behind*, and the second is not a function of the first at this
growth rate. At the measured **0.4 stars/week**, even a full 14-day silence leaves the rendered number
**≈0.8 stars** behind — inside the **0–1** ticket 03 already accepted and priced. So the 9-day slack
costs **nothing measurable in accuracy** and buys two free missed runs. The threshold is better than I
argued for it.

### The build sequence gains a PR0

Ticket 07 fixed PR1 (the `Saved` chip's accessible name) and PR2 (the star control, sequential after
PR1). **This work is a third PR, and it goes first.**

Its own reasoning applies with more force here than it did there. PR1's precedent: "PR1's subject is
already the `Saved` chip's accessible name; the phone fix is not the star button's subject, and putting
it in PR2 would have made PR2 the two-subject PR that B exists to prevent." Left inside PR2, this
would make it a **three**-subject PR — count source, star chip, and a breakpoint move. And the map
already stated the principle for `ci.yml`: *"bundling it into a PR whose subject is a star button is
how a one-line fix gets reviewed as four."*

It is also **independently verifiable**, which nothing else in this map is: a green Actions run and a
committed diff, with **not one line of the header touched**. `pnpm check-types`, `pnpm lint` and
`pnpm test` neither pass nor fail on it.

| PR | Subject | Touches the header? |
|---|---|---|
| **PR0** | The star count's source: new workflow, seeded file, delete the four dead things | **no** |
| **PR1** | The `Saved` chip announces one name at every width | yes |
| **PR2** | Add the star control | yes |

A bonus that is operational rather than tidier: PR0 **starts the weekly cadence immediately**, so the
count is correct and the assertion has been observed for real by the time PR2 merges. PR2 then lands on
a mechanism with a history rather than one introduced in the same PR.

### Accepted costs, stated rather than discovered

- **The assertion is untested.** It is bash in a workflow; vitest cannot reach it and eslint does not
  lint YAML (verified — `eslint.config.mjs` has no YAML block). Q2's accepted trade was losing
  typecheck/lint coverage, and this is the same trade seen from the other side. The mitigation is that
  the comparison is deliberately trivial and auditable by reading: two `date -u +%s` epoch values,
  integer division, one integer compare. **`gh api --jq` is gh's own filter, not a call to a `jq`
  binary**, so the job needs no installed tool at all. (`node` *is* preinstalled on `ubuntu-latest`
  and could do the date arithmetic instead — declined, because it reopens Q2's accepted principle for
  a marginal gain in a two-line calculation.)
- **Email is the only channel**, and it works only if Actions email notifications are enabled in the
  maintainer's account settings. **Unverifiable from this repository** — carried from ticket 03's
  comment. Recorded here as a **precondition on the spec**: confirm the setting is on, or the alerting
  half of ticket 03's policy is silent and the 9-day assertion becomes the only defence with nothing
  to announce it.
- **A weekly bot commit lands on `main`**, forever. That is the mechanism working, not noise.

### Corrections to this ticket's premises

1. **The `social-cards` premise was false** — set out above. Nothing wants those five figures, and
   that effort's `343` is a wrong OG-card claim, not a reader.
2. **The extension option's cost was understated.** The ticket said the contributors API "can fail on a
   night the stars succeeded". It is worse and it is **already true inside the existing script**: all
   five fetches are one `execSync` chain in `scripts/metrics-update.ts`, so a contributors-API failure
   kills the stars write regardless of workflow shape. Deleting the script removes the coupling
   entirely, which no amount of workflow restructuring would have.
3. **The measurement is worse than "18 of 18".** I re-verified against the live log: 18 runs,
   18 failures, `2026-06-08` → today, and **today's run started at `09:29:56Z`** — about half an hour
   after its own cron — dying at `Unable to locate executable file: pnpm`, **before any of its five API
   calls**. The failure surface is 100% toolchain and 0% GitHub API, which is the strongest argument
   the shell-only job exists to make. It is also why the one-line `version: 9` fix is now moot.

### Domain modelling

**No term is added to `CONTEXT.md`**, for the reason ticket 03 gave and this ticket confirms rather
than changes: the domain is **Recording** and **Contributor** (ADR-0008), and a star count is chrome.
`metrics-update` was never a domain noun and `star-count` is not one either. Nothing here renames or
reshapes anything in the vocabulary.

## Comments

- 2026-10-05 — Grilling ran as **five decisions in a single round**: the maintainer accepted all five
  recommendations in one instruction rather than answering serially, which is their call and is
  recorded rather than second-guessed. I asked the **survival** question before the **shape** question
  on purpose, and said why at the time: extending a workflow means adding a job to it, so once the
  five unused numbers go there is nothing left to extend. **The shape was therefore derived, not
  chosen** — which is the ticket's headline question answered without ever being put to the maintainer
  as a binary, and is the main reason this ticket's framing did not survive contact with the repo.
- 2026-10-05 — Three facts found while writing this, none of which were in the question and two of
  which change the answer: **(a)** all five fetches are one `execSync` chain, so the coupling is inside
  the script, not just between workflows; **(b)** today's run died at `pnpm`, before any API call, so
  the failure surface is entirely toolchain; **(c)** `scripts/lastCommitDate.json` is a near-exact
  precedent — a committed JSON written by automation and imported by a component — which settled the
  file's location and import style by existing house style rather than by preference.
- 2026-10-05 — **One correction to my own round-1 framing, made rather than buried:** I priced the
  9-day threshold as "~10 stars behind". That conflated days stale with stars behind. At 0.4
  stars/week even a 14-day silence is **≈0.8 stars** behind, inside the 0–1 ticket 03 already priced.
  The threshold is better than I argued for it. I also narrowed what the assertion is *for*: it does
  not primarily catch a green run that wrote nothing (ordinary exit codes catch that, given the
  retained date); it catches a failed refresh **one cycle late**, and it cannot detect its own
  non-execution at all.
- 2026-10-05 — **The most likely way to ship this broken, recorded so a reviewer checks it:** an
  assertion step placed *after* the write, re-reading the file. It then reads the copy the fetch step
  just wrote, is always 0 days old, and never fires — while looking entirely correct. The assertion
  must read the age **captured before the write**. Related: dropping the date field would let the
  weekly commit no-op and pass silently, which is the failure this whole design exists to prevent.
- 2026-10-05 — **One thing still cannot be verified from this repo, and the spec now carries it as a
  precondition rather than a footnote:** GitHub emails on a failed workflow only if Actions email
  notifications are enabled in the maintainer's account settings. The maintainer accepted email-only
  under Q5 with that dependency written down. If the setting is off, the 9-day assertion is the *only*
  defence and nothing announces that it fired.
