# Deploy A — hand-back

Written 2026-08-05. Deploy A is the maintainer's to authorise (`spec.md` checkpoint 2: "the
deploy itself... is the maintainer's to authorise and not a checkpoint an agent can clear or
is blocked by"). This file is meant to be sufficient on its own — the SHA, why it's the right
one, the exact commands, the PostHog side, and what unblocks.

## The SHA

**`76651a3`** — "docs: clear the PostHog remainder, and fix a tile that would have lied."

This is `spec.md`'s Sequence step 2, "DEPLOY A — behaviour (`ui-ux-overhaul`) + 13 PostHog
events + the rename." It is the parent of `4a663a5` ("feat: put the Studio Dark design system
in Tailwind, and the fonts it ships"), which is the first commit that touches Studio Dark
styling.

**How this was confirmed, independently, on 2026-08-05:**

```
git rev-parse --short 4a663a5^
# -> 76651a3
```

```
git show --stat 4a663a5
# app/globals.css, app/layout.tsx, tailwind.config.ts, tests/design-tokens.test.ts,
# tests/e2e/theme.spec.ts change. This is the first commit to touch styling.
```

```
git diff --stat $(git merge-base main 76651a3) 76651a3 -- app/globals.css tailwind.config.ts
# app/globals.css: no change. tailwind.config.ts: 4 insertions / 5 deletions, and reading the
# diff shows it is a bug fix (removing a dead `fontFamily.sans` override that never loaded,
# ticket 05), not a restyle.
```

```
git merge-base --is-ancestor fb6a0ea 76651a3 && echo ancestor
# fb6a0ea = "feat: call a catalogue record a Recording and its maker a Contributor" (the rename).
# It IS an ancestor of 76651a3 — the rename is in.
```

```
git show 76651a3:lib/analytics.ts | grep -c 'posthog.capture'
# 13 distinct event names: recording_opened, repo_clicked, filter_applied, filter_cleared,
# search_performed, sort_changed, bookmark_added, bookmark_removed, vote_cast,
# load_more_clicked, demo_played, demo_watched, demo_load_failed. Exactly the 13 the Sequence
# names (newsletter_submitted and $pageview are not among them — both arrive later, after 76651a3).
```

```
git show 76651a3:lib/posthog-provider.tsx
# capture_exceptions: true and capture_dead_clicks: true are both already set, and package.json
# at 76651a3 already carries posthog-js ^1.409.0 (the version posthog-expansion ticket 02
# needed for capture_exceptions to exist at all). ui-ux-overhaul's behaviour work — autoplay,
# five slots, the view signal, pagination, the overlay, the filters — predates 76651a3 in the
# same branch history.
```

`main`'s current tip is the merge-base of `main` and `76651a3` — i.e. `main` is a strict
ancestor of `76651a3`, so landing it is a clean fast-forward, no merge commit:

```
git rev-parse main                              # 3ff21a1...
git merge-base main 76651a3                      # 3ff21a1... — same commit
git merge-base --is-ancestor main 76651a3 && echo "clean fast-forward"
```

**Build and unit tests, in a disposable `git worktree` so this branch's own working tree was
never touched:**

```
git worktree add /tmp/deploy-a-check 76651a3
cd /tmp/deploy-a-check
pnpm install
NEXT_PUBLIC_CDN_URL="http://localhost:3000" pnpm build     # succeeded — 290 static pages, clean
pnpm test                                                   # 184 unit tests, 7 files, all passed
git worktree remove --force /tmp/deploy-a-check              # (--force: only build artefacts remained, untracked)
```

No Playwright and no `pnpm start` were run from the worktree, and port 3000 was never bound
from it, per the hard constraint that another agent owns that port.

## Exact commands to cut and deploy it

Because `main` is a strict ancestor of `76651a3`, this is a fast-forward — no rebase, no merge
conflict possible:

```
git fetch origin
git checkout main
git merge --ff-only 76651a3
git push origin main
```

Vercel is wired to this repo's `main` branch (`vercel.json` is present, empty — default git
integration) and `.github/workflows/ci.yml` runs on every push to `main`, so pushing triggers
both CI and the production deploy through the normal path. No manual Vercel action is needed
beyond the push itself, and no `git push --force` is required or should be used.

**Do not push past `76651a3`.** The whole point of this SHA is that it carries the rename, the
13 events and the `ui-ux-overhaul` behaviour with zero Studio Dark styling — landing anything
from `4a663a5` onward here would merge deploy A and deploy B into one boundary, which is
exactly what `spec.md`'s "Why two deploys" section (line 136) says to avoid: "one deploy
carrying pagination, playback, URLs, type, colour and layout at once would move every metric
and explain none of it."

> **2026-08-05 correction — `main` here means the *local* branch, and it is not what is
> deployed.** Checked against Vercel rather than assumed (project `prj_oJwJ…TIGO5i4MqVVGqjLaPIOfc`,
> `rnui-dev`):
>
> - The live production deployment is `dpl_5E3YdTLSTq7qh5ppkD6LbAUnTy8m`, built from
>   **`ba8ffbc`** on branch `main` — *"fix(posters): let the documented command produce a Poster
>   the suite accepts"*.
> - `origin/main` is at that same `ba8ffbc`. **Local `main` (`3ff21a1`) is 16 commits ahead of
>   it and unpushed** (`git rev-list --left-right --count main...origin/main` → `16  0`).
>
> **The commands above still work**, and that was verified rather than hoped:
> `git merge-base --is-ancestor ba8ffbc 76651a3` succeeds, so the push is still a clean
> fast-forward with no rebase and no conflict.
>
> **But deploy A ships more than this document said.** It carries the 16 unpushed commits as
> well, and they are not cosmetic. Among them: `0afe884 fix(votes): bill one view per vote
> click, not two or three`; `7c5e134 fix(search): find Categories and Authors, not just
> captions`; `87f518c`, `059597b` and `a34ff3b`, the counter/hooks/catalogue consolidations;
> `1682f14 build(lint): make the linter run, and have CI run it`; and `e9cb6c4 refactor: delete
> the Codex layer the grant was written for`. Anyone reading a metric move after deploy A should
> know these are in it — the boundary is `ba8ffbc → 76651a3`, not `3ff21a1 → 76651a3`.
>
> **One free side effect.** Dependabot PR #16 (`dependabot/npm_and_yarn/ai-da764df078`, bumping
> `ai` 4.0.20 → 7.0.44) currently fails its Vercel preview build with
> `Module not found: Can't resolve 'zod/v4'` — `ai@7` needs zod's v4 export path and this repo
> pins `zod ^3.24.1`. It does not need fixing: `ai`, `@ai-sdk/anthropic` and `@ai-sdk/openai`
> are **already deleted** from `package.json` in the unpushed work, along with the
> `app/api/search/route.ts` that imported them. Once deploy A lands, that PR is bumping
> dependencies the project no longer has. **Close it rather than merging it.**

## The PostHog annotation

Project **117415** (`rnui.dev dashboard`). `posthog-expansion` ticket 09 already specifies the
exact call, agreed 2026-08-01, waiting only on the deploy timestamp:

```
posthog:exec  call annotation-create {
  "content": "ui-ux-overhaul redesign deployed",
  "date_marker": "<the deploy timestamp>",
  "scope": "project"
}
```

`scope: "project"` (not a single dashboard) so the boundary line appears on both dashboard
`1937576` ("Redesign — before / after") and ticket 04's "Web performance — field" dashboard —
every tile on both already has `showAnnotations: true`, so nothing else needs touching. The
project has zero annotations today; this is the first.

## Which `posthog-expansion` tickets unblock, and which do not

Read directly from each ticket's own `Status:` / `Blocked by:` line and its own comments on
2026-08-05 — not from any count carried in `CLAUDE.md` or elsewhere. There are **six**
`ready-for-human` tickets (02, 03, 04, 05, 07, 09), and they split into two groups:

**Actually gated on deploy A landing:**

- **03 — Instrument the catalogue's real events.** `Blocked by: 01` (resolved). Its two
  remaining acceptance bullets need the events to appear in the PostHog activity feed and the
  funnel to read non-zero. All 13 events are already in `lib/analytics.ts` at `76651a3` — this
  is exactly what deploying `76651a3` is for.
- **04 — Field performance, dead clicks and replay configuration.** `Blocked by: 01`
  (resolved). One remaining bullet: `$dead_click` events arriving. `capture_dead_clicks: true`
  is already in `lib/posthog-provider.tsx` at `76651a3` — unblocks the moment traffic hits the
  deployed code.
- **09 — Redesign baseline dashboard.** `Blocked by: 01, 03`. The dashboard (`1937576`) and its
  seven tiles are already built; the headline `repo_clicked`-per-session tile and the funnel
  tile read zero only because the events have never been ingested. Its own step 3 — the
  annotation above — "fires at the moment deploy A lands" (ticket's own words). Landing
  `76651a3` is what step 3 and the dashboard's real data both wait on.
- **02 — Enable error tracking.** No `Blocked by:` line. Partially gated: `capture_exceptions:
  true` and the `@posthog/nextjs-config` source-map wrapper are both already in `76651a3`, but
  its acceptance bullet asks for verification "in a preview deployment," and it separately
  needs `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` added to the Vercel project's environment —
  that credential step is independent of deploy A and is still the maintainer's regardless.
  Landing `76651a3` makes the check possible but does not complete it alone.

**Not gated on deploy A at all — already actionable today, verified by reading each ticket's
own text rather than assuming:**

- **05 — Watch the rage-click replays.** No `Blocked by:` line. This is about watching *90 days
  of already-existing* session replays and confirming email masking on one recording — nothing
  in it depends on a future deploy. It is `ready-for-human` because it needs a person's eyes,
  not because it needs `76651a3` to land.
- **07 — One exit survey.** No `Blocked by:` line. Its own 2026-08-01 comment says explicitly:
  "No deploy is needed for either" of the two switches that launch it (a `survey-update`
  `start_date` and a `project-settings-update` on `surveys_opt_in`). It is `ready-for-human`
  purely because launching a public-facing survey is an editorial call, not a technical one.

So: deploy A directly unblocks **03, 04, and 09**, and is a necessary-but-not-sufficient step
for **02**. It does nothing for **05** or **07** — those two are stuck on the maintainer's own
judgement/action today, deploy or no deploy, and can be closed independently of this hand-off.

(Tickets 08 and 11 are `needs-triage`, not `ready-for-human`, and blocked by 03 and 02/04
respectively — they are not part of the "six ready-for-human" count and are not addressed
further here.)

## What the maintainer does about `checkpoint-13-gate.md` steps 10–12 now

The gate's *Does not prove (hand-offs)* section hands steps 10–12 (the LCP/CLS/INP
before-and-after) to the maintainer because it believed no "before" SHA existed in this
branch's history. That belief was false — `76651a3` is that SHA, and it builds and passes its
unit tests on this machine today (see above). The correction text for that section has been
handed to the agent that owns the single write to `checkpoint-13-gate.md`; it is not edited
here.

What is still genuinely the maintainer's, because it needs data and a person's run, not because
the SHA is unreachable:

1. Run the "before" Lighthouse pass against `76651a3` (a `git worktree` build works — see the
   build commands above, using `pnpm build && pnpm start`, not `dev`) and the "after" pass
   against the current Studio Dark tip, on the same machine, same Chrome/Playwright versions,
   one sitting — the gate's own stated method for a valid comparison.
2. Diff the two and record LCP/CLS/INP deltas in `checkpoint-13-gate.md` steps 10–12, replacing
   the current hand-off language.
3. This is independent of cutting deploy A to production — the worktree-based before/after
   comparison can happen on a laptop without deploying anything. Deploying `76651a3` to `main`
   (this document's main subject) and running the before/after Lighthouse comparison (steps
   10–12) are two different actions that happen to share one SHA.
