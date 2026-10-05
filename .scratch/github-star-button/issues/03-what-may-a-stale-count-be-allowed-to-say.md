# What may a stale count be allowed to say

Status: resolved
Type: grilling
Blocked by:

## Question

**A star count is a number that will be wrong, and the header is the worst place to be visibly wrong.**
`metrics/weekly.json` already carries a `generated_at` alongside the count, so staleness is knowable —
the question is what the header does with that knowledge.

The concrete pressure: today the file says 343 and the truth is 350. A visitor who stars the repo and
comes back sees the number they caused to move, and it did not. That is a small, specific embarrassment
that sits exactly on the feature's own promise.

Decide:

- **Does the number appear at all?** A control that links to GitHub and shows no count is honest, is
  one flex item narrower, and cannot go stale. The count is also the entire social proof — dropping it
  may cost more than being seven off.
- **If it appears, is its age disclosed** — a `title`/tooltip reading "as of 4 Jun", a `+7` style
  qualifier, or nothing at all?
- **What is the expiry bound?** Pick a number of days past which the count must not be rendered at
  all, and what renders in its place — the bare control, nothing, or a dash. This is the number
  [Where does a live-enough star count come from](#02) designs its degradation around, so the two must
  agree; neither can pick it alone.
- **Does a wrong number get worse than a wrong number?** Stars only go up, so a stale snapshot is
  always *under*. Whether that direction is forgiving enough to render bare, or whether it is exactly
  the case that needs a date, is the judgement being asked for.

Also settle what the count is *for*, because it changes the bar: a number that exists to be glanced at
can be a week old, and a number a visitor might compare against GitHub cannot.

**The answer is a policy** — what renders, under what bound, with what disclosure — tight enough that
the implementation does not have to re-decide it. This is a decision, not a build.

## Answer

**Always show the number. Never hide it, no matter how old it is. No date anywhere. The staleness
defence is an assertion on the *refresh*, not a rule on the *render*.**

Chosen by the maintainer, 2026-10-05, across four decisions:

| Question | Answer |
|---|---|
| Does the count appear at all? | **Yes, always.** |
| Glanced at, or checked against GitHub? | **Checked.** |
| Is its age disclosed? | **No** — no tooltip, no qualifier, nothing. |
| Expiry bound past which it must not render? | **There is none.** |

### The policy, in the order an implementer needs it

**1. What renders.** `★ Star 350` at `xl`, `★ 350` below it, `★ 350` on the phone — variant F's
shapes, unchanged. Whatever integer is in the stored file is what renders. There is no branch, no
fallback state and no empty case, because **the file always has a number**. A visitor cannot see a
numberless chip, so the shape F was measured with never needs a second rendering.

**2. Where the number comes from.** A **new committed file holding only the star count**, written by
GitHub Actions on the weekly schedule. Not `metrics/weekly.json`: nothing in the app reads that file
(verified — zero readers outside `scripts/metrics-update.ts`), and it carries `forks`, `watchers`,
`open_issues`, `contributors` and two commit counts that are stale for the same reason as the stars.
The header now depends on a committed metric for the first time in this repo, so it depends on one
that holds nothing but the thing it needs.

**3. The bound is on refresh, not on render.** The weekly workflow reads the date inside its own
output file and **fails if that date is more than 7 days old.** That failure is what produces the
email. There is no render-time expiry, because the maintainer's decision is that the number shows
regardless.

This is the whole defence, and the assertion is load-bearing rather than a nicety. The workflow
commits only when the file changed and otherwise prints "No changes to commit" and **passes** — so a
workflow that silently stops writing produces a green run and no email. Without the assertion the
alerting never fires, which is the failure ticket 02 demonstrated once already: 18 runs, 18
failures, four months of a wrong number nobody noticed.

**4. What "checked" costs, in arithmetic.** The maintainer said the number is meant to be **compared
against GitHub**, so the cost of a weekly refresh is the size of the discrepancy a comparison can
reveal. Measured: the repo went from 343 stars (2026-06-04) to 350 (2026-10-05) — **7 stars in 123
days, 0.4 per week.** So the rendered number is typically 0–1 behind and occasionally 2. That is the
accepted cost of "always show". It is small, and it is one-directional in tendency (stars rise), but
it is not zero and the spec should say so rather than discover it.

**5. What this design removes.** GitHub is **never in the request path of a visitor**: no runtime
fetch, no ISR revalidation window, no 60/hour unauthenticated rate limit shared across Vercel's egress
IPs, no client-side layout shift when a number lands, and no "GitHub was down when this page rendered"
failure surface at all. Those were ticket 02's costs, and they are all gone with the mechanism.

### What this overrides

**Ticket 02's mechanism is superseded.** It chose an ISR server fetch with `revalidate: 21600` and
the committed JSON as a fallback. That is no longer the design. Its *research* stands and is now more
load-bearing than when it was written — the finding that the weekly workflow has never once succeeded
is what makes the repair mandatory here, and its documented one-line fix is the fix.

**CI repair moves from Out of scope into this effort.** The map had ruled
`.github/workflows/metrics-update.yml` out of scope as a build-and-delivery defect. The maintainer
overrules that: the chosen design *is* that workflow, so repairing it is no longer a separate
effort. Its fix is to delete `version: 9` from `pnpm/action-setup@v4`, per that action's own README.
`.github/workflows/ci.yml`'s identical pin stays out of scope — it is not on this path.

### Domain modelling

**No term is added to `CONTEXT.md`, deliberately.** The domain is **Recording** and **Contributor**
(ADR-0008). A star count is chrome, not a domain object, and nothing here renames or reshapes
anything in the vocabulary. The stored file is infrastructure; naming it would put a non-domain noun
into a glossary meant to hold only the domain's.

## Comments

- 2026-10-05 — Grilling ran as four decisions across three rounds. Two of them changed the map rather
  than just answering the question: the chosen mechanism **supersedes ticket 02's**, and the maintainer
  **pulled CI repair back in** from Out of scope. Both are recorded above and in `map.md`.
- 2026-10-05 — I recommended the opposite on three counts and was overruled each time: hide the number
  when old, treat it as glanced-at, and reuse `metrics/weekly.json`. The maintainer's version is
  coherent — the refresh-time assertion is a better staleness defence than a render-time rule, because
  it is the only one that produces the email they asked for — so this is a settled decision, not an
  open one. Recorded so the reasoning is not re-litigated.
- 2026-10-05 — **One thing I could not verify and the design rests on it:** GitHub only emails on a
  failed workflow if email notifications are enabled for Actions in the maintainer's notification
  settings, and nothing in this repo can confirm that. If it is off, the alerting half of this policy
  is silent and the 7-day assertion becomes the *only* defence — still worth having, but nothing
  would tell the maintainer it had fired.
- 2026-10-05 — A ticket is filed for the remaining sharp question this raised: whether the star file
  gets its own workflow or rides along with the existing one, which still does five other things that
  can fail for unrelated reasons.
