# Does the star file get its own workflow, or ride with the existing one

Status: open
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
