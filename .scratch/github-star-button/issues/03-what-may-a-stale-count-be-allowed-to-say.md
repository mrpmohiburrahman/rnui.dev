# What may a stale count be allowed to say

Status: open
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

## Comments