# Merge deploy A and start the clock

Status: ready-for-human
Type: task
Blocked by: 01

## Question

Deploy A — the rename plus `ui-ux-overhaul`'s behaviour work plus 13 PostHog events — is written,
tested and has never been in production. Merging it starts the six-week collection window that
decision 11 committed to, and everything else in this map that touches the live site waits behind
it.

**The deploy itself is the maintainer's to authorise**, not an agent's. `studio-dark/spec.md`
checkpoint 2 says so explicitly. An agent prepares it; a person ships it.

Also unblocks the six `ready-for-human` tickets in `.scratch/posthog-expansion/`, every one of
which has been waiting on exactly this merge.

## Acceptance

- Branch merged to `main` and deployed.
- A PostHog annotation created at the deploy timestamp, naming it deploy A.
- The `recording_id` property migration run, per `studio-dark/spec.md` — the day after, as that
  spec sequences it.
- The 277 `/recording/[id]` addresses serving, and the legacy redirects `middleware.ts` owns still
  alive.
- **The collection start date recorded in this ticket's Comments.** Decision 11's six-week window
  and its four-week review are both measured from it, and nothing else records it.

## Comments

### 2026-08-14 — the SHA is on `main`, the site is not. Deploy A is NOT live.

The maintainer authorised the deploy in session. It was cut exactly as
`.scratch/studio-dark/deploy-a-handback.md` prescribes, and every claim in that file was
re-verified against live git first rather than trusted: `76651a3` is still `4a663a5^`,
`origin/main` (`ba8ffbc`) is still a strict ancestor of it, so the push was a clean fast-forward
of **54 commits**, holding back the **48** Studio Dark commits on `feat/studio-dark`.

```
git push origin 76651a3:main     # ba8ffbc..76651a3, 2026-08-14T22:54:30Z
```

**Both production builds then failed, for two different reasons, and neither is app code.**

**1. `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` — fixed here, in `3d479be`.** The build died inside
`pnpm install`, before a line was compiled. Two pnpm versions build this repo and read overrides
from different files: pnpm 11 (local, CI) reads `pnpm-workspace.yaml`; Vercel pins pnpm 9
("Using pnpm@9.x based on project creation date") which reads only `package.json`'s `pnpm` field.
The `zod-validation-error` override lived only in the former, so pnpm 9 saw an `overrides:` block
in the lockfile it could not corroborate and refused the frozen install. `pnpm-workspace.yaml`'s
own comment had predicted pnpm 9 would be fine because it "installs from the frozen lockfile" —
that prediction was wrong, and it is why nothing caught this. **This was never specific to deploy
A**: every commit from the override's introduction onward carries it, so the branch tip would have
failed deploy B identically. Fixed by declaring the override in both files; the comment now says
to keep them byte-identical.

This is also why a green local build did not predict a green Vercel build. `pnpm install
--frozen-lockfile && pnpm build && pnpm test` was run at `76651a3` in a disposable worktree before
the push — 290 static pages, **184/184 unit tests** — and passed, because local pnpm is 11.5.3.
The toolchain differed, not the code.

**2. The PostHog source-map upload rejects the key — open, and the maintainer's.** With the install
fixed, `next build` compiled and then failed in `runAfterProductionCompile`:

```
Invalid Personal API key: "Token looks wrong, must start with 'phx_'"
```

`next.config.ts` enables the upload when **both** `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are
present, and both are set on the Vercel project. The value in `POSTHOG_API_KEY` is not a personal
API key — those start `phx_`. A project token (`phc_…`) in that slot would produce exactly this.
The `deploy-a-handback.md` note that "that credential step is done as of 2026-08-05" is true about
the variables *existing* and wrong about one of their *values*; nothing had run a production build
since, so nothing could have caught it.

Two ways out, both requiring credentials or Vercel settings an agent must not touch:

- **Correct it** — create a PostHog personal API key (`phx_…`) and replace `POSTHOG_API_KEY`
  (Production) on `rnui-dev`. Build goes green, source maps upload, and
  `posthog-expansion` ticket 02's last bullet closes with it.
- **Unblock now** — delete `POSTHOG_API_KEY` from the Vercel project. The guard at
  `next.config.ts` then sees exactly one of the pair, prints its warning and skips the upload, so
  the build goes green immediately and stack traces stay minified until the key is fixed.

**State to hand on, stated plainly:**

- `origin/main` is `3d479be`. **What visitors run is still `ba8ffbc`** — Vercel keeps the last
  successful production deployment aliased, so there was no outage and no half-deploy. `main` is
  pushed-but-not-deployed, which is not a state this repo has been in before.
- **The collection start date is deliberately not recorded above.** Decision 11's six-week window
  measures from the moment visitors run deploy A, and they do not yet. Recording today's date
  would silently start a clock against traffic that is still seeing the old build.
- A PostHog annotation (id `392081`, project 117415) was created at the push timestamp and then
  **deleted** once the build failure surfaced, rather than left to draw a boundary line on both
  dashboards for a release nobody received. It must be recreated at the real deploy timestamp.
- `posthog-expansion` 03, 04 and 09 stay blocked. Nothing about their status changed.
- Dependabot PR #16 still wants closing rather than merging, per `deploy-a-handback.md`.
