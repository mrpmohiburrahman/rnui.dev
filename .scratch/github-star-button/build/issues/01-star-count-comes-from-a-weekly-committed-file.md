# 01 — Star count comes from a weekly committed file

**What to build:** The header's star count can be read from a file in the repository, always current
to within a week, with no fetch of any kind and no credential in the deployment environment. A
dedicated weekly workflow fetches the count from the platform, writes it into a small committed file,
commits it, and — the part that matters — checks at the start of every run whether its own output has
gone stale, failing the run if it has.

This ticket makes no change to the header. It is verifiable on its own: a green workflow run and a
committed diff. `npm test`, lint and typecheck neither pass nor fail on it, which is why it is first.

**Blocked by:** None — can start immediately

**Status:** ready-for-human

- [x] A committed JSON file holds exactly two keys — `stars` (integer) and `generated_at`
      (`YYYY-MM-DD`), seeded with the count measured live and today's date, written with a trailing
      newline:

      ```json
      { "stars": 350, "generated_at": "2026-10-05" }
      ```

      The date key keeps the exact name the file it replaces used. The file lives beside the other
      automation-written committed data, not in a data directory and not in a metrics directory.
- [x] A dedicated weekly workflow replaces the existing weekly metrics workflow. Name, weekly Monday
      cron, `contents: write` permission, and the manual-dispatch trigger carry over; everything else
      is rebuilt.
- [x] The job is **shell-only with no toolchain at all** — no Node setup, no pnpm setup, no install
      step. The job it replaces failed 18 runs out of 18 dying at a missing `pnpm` binary before any of
      its platform calls, so its failure surface is entirely toolchain; this shape removes that class
      of failure rather than repairing it.
- [x] Four steps in this order, and the order is load-bearing: check out at default shallow depth;
      **capture the age of the file as checked out**; fetch, write, commit and push; then assert.
- [x] **The assertion reads the age captured before the write, never the file.** An assertion placed
      after the write that re-reads the file reads the copy the fetch step just made, is always zero
      days old, and never fires — while looking entirely correct. This is the single most likely way to
      ship this broken.
- [x] The assertion compares whole days in UTC as integers, **fails when the age exceeds 9 days**, and
      puts the age and the stale-since date in the failure message.
- [x] The assertion runs **even when the fetch failed**, and is guarded to scheduled runs so a manual
      dispatch cannot fail on it.
- [x] The file **keeps its date field**. With the date retained the file always differs week to week so
      the commit always fires; a file holding only a number, whose value happened not to move, would
      take the "no changes to commit" branch and the run would **pass having written nothing** — the
      exact failure this mechanism exists to prevent. The commit step commits only when the file
      changed, and pushes as the automation bot.
- [x] The five dead things are deleted: the weekly metrics workflow, the committed metrics file, the
      script that wrote it, the now-empty metrics directory, and the npm script entry that ran it. All
      five together, because the numbers they carried are read by nothing and one of them moves on its
      own clock.
- [x] The deletion does not break anything: `npm test`, lint and typecheck are unaffected, and no code
      reads the deleted file.
- [ ] Verified for real, not by reading: the workflow is dispatched manually once and produces a commit
      and a passing assertion.
- [x] **Not part of this ticket:** the stale-data fix that would have applied to the workflow being
      deleted. Its one-line pnpm pin is moot because the job carrying it no longer exists. The sibling
      CI workflow carries an identical pin and stays red — out of scope.


## Comments

- 2026-10-05 — **Built.** Twelve bullets, eleven done. The twelfth needs a person and is named below.
  The change is **seven paths**, which is ticket 08's change list with one row swapped: **two
  created** (`.github/workflows/star-count.yml`, `scripts/star-count.json`), **three deleted**
  (`.github/workflows/metrics-update.yml`, `metrics/weekly.json` and with it the emptied `metrics/`,
  `scripts/metrics-update.ts`), **one edited** (`package.json`, dropping `metrics:update`), and **one
  path the list does not have at all** — see below.

  The seeded file is `350` / `2026-10-05`, and `350` was re-measured live at build time
  (`gh api repos/mrpmohiburrahman/rnui.dev --jq .stargazers_count`). It is written with a trailing
  newline and is **byte-for-byte the format the workflow's own `printf` emits**, so the first real run
  produces a one-line diff rather than a whole-file rewrite — verified by running the shipped `printf`
  and diffing it against the committed file.

  **One path the change list did not list.** `scripts/scrub-email-list.ts:7` carried the sentence
  "the way `scripts/metrics-update.ts` shells out to gh", and this change deletes that file, so it
  would have left a comment naming a path that no longer exists. One line, repointed at
  `group-email-list.ts`, which does the same `gcloud auth print-access-token` + `curl` thing. It is
  here rather than silent because the map's own rule against bundling unrelated fixes does not cover
  a dangling reference **this change creates** — that one is not an unrelated fix, it is a loose end
  of this one. Ticket 08's change list is otherwise complete: nothing else it names was missed, and
  nothing it misses besides this one needed doing.

- 2026-10-05 — **The workflow's shell was executed, not read.** The acceptance says the staleness
  assertion is verified by "a manual dispatch plus a green run", and a dispatch needs the workflow on
  the default branch. Rather than leave all of it to a human, the three `run:` blocks were extracted
  out of the shipped YAML and run against a throwaway repo with a bare remote and a fake `gh` on
  `PATH` — including a fake `gh` that fails, so the failed-fetch path is genuinely walked rather than
  argued about. `date` was shimmed to the real GNU `date`, since the runner is `ubuntu-latest` and
  this machine's BSD `date` rejects `-d`. **39 checks, all passing.** The ones that matter:

  - **The trap, walked deliberately.** A **400-day-old** file whose fetch *succeeds*: the assertion
    still fires, reporting 400 days. An assertion that re-read the file there would have seen the copy
    the fetch had just written, reported 0 days, and passed. This is the single most likely way to
    ship this broken, and it is now measured rather than hoped for.
  - **The boundary is 9/10, not 8/9.** A 9-day-old count passes; a 10-day-old one fails with
    `::error::… is 10 days old (generated 2026-09-25), over the 9-day threshold. The refresh has been
    broken since 2026-09-25.` Two consecutive failed runs, as ticket 08 priced it.
  - **The assertion survives a failed fetch.** `gh` exits 1: nothing is committed, the stale file is
    left uncorrupted, and the assertion still runs and still fires on the 30-day-old count. Symmetric
    case checked too — a 1-day-old count with a failed fetch **passes**, so the guard does not cry
    wolf.
  - **A missing or renamed `generated_at` fails loudly** and says `No age was captured`, rather than
    passing vacuously on an empty value.
  - **An unchanged star count still commits.** Seeded at 1 with the API also returning 1, the date is
    the only difference and the commit fires — the `No changes to commit` branch is not taken.
  - `workflow_dispatch` skips the assertion, `schedule` runs it.

- 2026-10-05 — **The one bullet that is not ticked is the manual dispatch, and it is not mine to do.**
  GitHub only offers `workflow_dispatch` for a workflow that exists on the **default branch**, and
  this is the throwaway `prototype/star-button` branch, whose standing instruction is that it is not
  to be merged. So: **merge `star-count.yml` to `main`, then
  `gh workflow run star-count.yml` once.** That run produces the first bot commit and exercises the
  real `gh` against the real API. Everything the run would tell us has already been produced locally
  against the same shell, so this is a confirmation, not a discovery — but it is a real external
  dependency and it stays open until a person does it.

- 2026-10-05 — **What the repo's own checks say.** `pnpm check-types` clean. `pnpm test` 473/473
  across 28 files. `pnpm lint` reports 133 warnings and **1 error, all pre-existing and none of them
  mine** — the error is `.scratch/social-cards/probe/avif-datauri.tsx:35`, an untracked file from a
  different effort that CI never sees.

  `pnpm build` **fails on this branch, and it fails identically at HEAD without this change**:
  `components/prototype/star-control-prototype.tsx` calls `useSearchParams()` with no Suspense
  boundary, so prerendering `/prototype/star-button` throws. Proven pre-existing by building HEAD in a
  throwaway worktree. With that one prototype route set aside, **both HEAD and this branch compile and
  prerender cleanly**, and this branch prerenders **316/316** pages. So this
  change is build-clean, and the prototype's missing Suspense boundary is a separate pre-existing
  break on a branch nobody is going to merge. **It is worth knowing that `pnpm build` is red on this
  branch and that this ticket did not cause it** — and worth not reading it as new.

- 2026-10-05 — **The prototype's now-stale comment was left alone, on purpose.**
  `components/prototype/star-control-prototype.tsx:32` says "The shipped number would come from
  `metrics/weekly.json`", which this change makes false. Ticket 08 anticipated exactly this and called
  it not drift: the file is prototype-branch-only and throwaway by the map's standing preference, so
  its comment dies with it. **Leaving it is the decision, not an oversight.**
