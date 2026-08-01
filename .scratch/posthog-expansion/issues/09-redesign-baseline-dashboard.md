# 09 — Redesign baseline dashboard

Status: ready-for-human
Blocked by: 01, 03

## Problem

The UI/UX effort is about to change playback, pagination, the card headline, entry URLs and
the mobile filter surface. Once it ships, there is no way back to measure what the old site
did — and the current instrumentation cannot describe it anyway, because zero custom events
exist.

Whatever baseline is captured has to be captured **before** the redesign deploys. This ticket
is time-sensitive in a way none of the others are.

One dashboard exists today (primary: 295272) with six insights. It is not a baseline.

## Work

1. Freeze the pre-change numbers now, from data that already exists, and write them into this
   file so they survive independently of PostHog:
   - Pageviews and unique humans, 90 days, by path
   - Web vitals p75 by device (see ticket 04)
   - Rage-clicks by URL
   - Session count and median session duration
2. Create a dashboard "Redesign — before / after" with, all test-accounts-filtered:
   - `repo_clicked` per human session — **the headline metric**, because an outbound click is
     what the site exists to produce
   - `demo_watched` per session
   - Funnel: `demo_played → entry_opened → repo_clicked`
   - `/products` vs `/` split
   - LCP and CLS p75, desktop and mobile
   - `$rageclick` and `$dead_click` counts
3. Annotate the deploy date in PostHog so every chart shows the boundary.
4. Agree the success criteria in advance, in writing, before the redesign ships. Deciding what
   counts as success after seeing the numbers is not measurement.

   Proposed: LCP p75 under 2,500ms on both desktop and mobile; CLS p75 under 0.1 on desktop;
   rage-clicks on `/` down by more than half; `repo_clicked` per session not lower than before.

   That last one is deliberately a guardrail rather than a target. The redesign is not
   expected to increase outbound clicks — it is expected not to cost any.

## Acceptance

- The frozen baseline numbers are written under `## Comments` in this file, with the date.
- The dashboard exists and every tile has data.
- The success criteria are agreed and recorded before the redesign deploys.

## Depends on

Tickets 01 and 03. Step 1 can and should happen immediately regardless — the existing data is
enough for it, and it stops being available if anything changes. It is done; see `## Comments`.

**Steps 2 and 3 belong in ticket 03's pass, not a separate one.** Every tile on this dashboard
is made of 03's events, and the funnel tile is 03's own fourth acceptance criterion. Whoever
lands 03 should land them, then resolve this ticket down to step 4.

**Step 4 is the maintainer's**, not an agent's — agreeing what counts as success is the one
thing that cannot be done after seeing the numbers. Do it in the same sitting as tickets 05,
07 and 10.

## Comments

### 2026-07-30 — Step 1 complete. Baseline frozen.

Captured from project 117415 via the PostHog MCP, before any redesign work. Window: the 90
days ending 2026-07-30. **Human traffic only** where stated — `$virt_traffic_type = 'Regular'`,
which excludes the 765 AI-crawler "people" and 8 bots.

**Traffic mix** (`$pageview`, 90d)

| Traffic type | Pageviews | People |
|---|---|---|
| Regular | 4,748 | 1,092 |
| AI Agent | 774 | 765 |
| Bot | 8 | 8 |

**Pages** (all traffic, 90d)

| Path | Pageviews | People |
|---|---|---|
| `/products` | 3,554 | 1,010 |
| `/` | 1,826 | 979 |
| `/bookmarks` | 39 | 26 |
| `/subscribe` | 35 | 35 |
| `/aboutus` | 29 | 24 |
| `/contactus` | 18 | 18 |
| `/termsofservice` | 15 | 14 |
| `/privacypolicy` | 14 | 14 |
| `/feedback` | **0** | **0** |

**Sessions** (human only, 90d)

| Metric | Value |
|---|---|
| Sessions | 1,886 |
| People | 1,104 |
| Median session duration | **15s** |
| p90 session duration | 897s |
| Pageviews per session | 2.52 |

A 15-second median against a 4.2s LCP means a large share of the median visit is spent
waiting for the page. This is the single most useful number here — if the performance work
lands, it should move.

**Core Web Vitals** (p75, 90d, by device)

| Device | Samples | LCP | INP | CLS | FCP |
|---|---|---|---|---|---|
| Desktop | 1,792 | 4,212ms | 96ms | 0.549 | 3,502ms |
| Mobile | 330 | 4,515ms | 286ms | 0.025 | 5,904ms |
| Tablet | 13 | 4,861ms | 86ms | 0.612 | 3,462ms |

**Rage-clicks** (90d, 74 total across 50 people)

| URL | Element text | Count |
|---|---|---|
| `/` | *(none)* | 32 |
| `/?search=star` | *(none)* | 3 |
| `/?search=text` | *(none)* | 2 |
| `/products?category=Buttons` | Buttons | 2 |
| `/products?category=Loaders` | Loaders | 2 |
| `/?search=grid` | *(none)* | 2 |
| remainder | mixed | 1 each |

**Event volumes** (90d, all traffic): `$autocapture` 14,879 · `$pageview` 5,530 ·
`$web_vitals` 2,135 · `$pageleave` 1,020 · `$rageclick` 74. No custom events exist.

Steps 2 through 4 remain open and are not time-sensitive — the dashboard needs the custom
events from ticket 03 before it can show the headline metric.

### 2026-08-01 — Step 2 complete. Step 3 cannot be done yet. Step 4 is still yours.

Dashboard **"Redesign — before / after"**, id `1937576`, project 117415.
<https://us.posthog.com/project/117415/dashboard/1937576>

Every tile is `filterTestAccounts: true`, so every number on it is human — ticket 01's filter
(localhost, `*.vercel.app`, `$virt_is_bot`). Seven tiles plus a text tile, weekly over 90 days,
annotations on so the deploy boundary appears the moment step 3 can happen:

| Tile | Insight | Query |
|---|---|---|
| `repo_clicked` per session — **headline** | `8JGlZjnZ` | `repo_clicked` total ÷ `$pageview` unique sessions, formula `A/B` |
| `demo_watched` per session | `FF1bmFb6` | same shape |
| Funnel `demo_played → entry_opened → repo_clicked` | `0FGtPuxq` | ordered, **1-day** window |
| `/products` vs `/` | `ac9M7qYD` | `$pageview` on `$pathname`, views and humans, four series |
| LCP p75 by device | `ebkjI5NY` | ticket 04's insight, now on both dashboards |
| CLS p75 by device | `FWQuo5NJ` | ticket 04's insight, now on both dashboards |
| Rage clicks and dead clicks | `qgrmxGJM` | `$rageclick` and `$dead_click` totals |

The two web-vitals tiles are ticket 04's existing insights attached to a second dashboard rather
than copies. One query, two dashboards: a copy would drift from the alert that watches it.

The funnel uses a one-day conversion window, not the 14-day default. Median session is 15
seconds; a repo click a week later is a second visit, not this journey.

The text tile at the top carries the frozen 2026-07-30 "before" numbers, so both sides of the
boundary are readable in one place rather than one of them living only in this file.

**Every query executes.** Verified via `insight-query`: the rage-click tile returns 13 weeks of
real data, and the headline formula returns 0 — its denominator (sessions) resolves and its
numerator (`repo_clicked`) does not exist yet. That is the tile waiting for ticket 03's deploy,
not a broken query.

**Step 3 is not done, and could not be.** It asks for the deploy date annotated. The redesign has
not deployed and there is no date to annotate; inventing one would be worse than leaving it. The
project has zero annotations today. When the redesign deploys, one call does it:

```
posthog:exec  call annotation-create {"content": "ui-ux-overhaul redesign deployed", "date_marker": "<the deploy timestamp>", "scope": "project"}
```

`scope: project` rather than a single dashboard, so it lands on ticket 04's charts too. Every
tile on both dashboards already has `showAnnotations: true`, so nothing else needs touching.

**Acceptance, honestly.** "The dashboard exists and every tile has data" is not met and cannot
be until two deploys have happened: ticket 03's instrumentation for the three custom-event tiles
and the funnel, and ticket 04's for `$dead_click`. The four remaining tiles have data now.

`ready-for-human`, with three things left: the deploy annotation above, a look at the dashboard
once ticket 03 is live, and **step 4 — agreeing the success criteria in writing, before the
redesign ships.** That last one is the whole reason this ticket is time-sensitive, and it is the
one thing here that cannot be done after seeing the numbers. The proposal in step 4 above is
unchanged and still needs a yes or a counter-proposal.

### 2026-08-01 — Funnel tile repaired after the rename

The step-2 event on insight `10646182` was `entry_opened`, which `studio-dark` ticket 01 renamed
to `recording_opened` the same day. Left alone the tile would have converted at 0% at step 2
forever, and it is the tile this ticket's own step 2 lists and that `posthog-expansion` ticket
03's fourth acceptance criterion checks — a permanently empty tile reading as "nobody opens a
Recording" rather than as "this query names an event that does not exist".

Repaired in place: step 2 is now `recording_opened`, step 3's label is `Source link followed`
rather than `Repo followed` to match the glossary, and the description records the rename. No
data was lost or migrated — `lib/analytics.ts` has never been deployed, so nothing was ever
ingested under either spelling.

This is the general case ADR-0008 warns about and `studio-dark` ticket 15 exists to sweep: a
saved query naming an event or a selector goes on returning a plausible number after the thing
it names has moved. Step 4 is still the maintainer's.

### 2026-08-01 — Step 4 settled. The success criteria, agreed before any redesign data exists.

**Who agreed this.** The maintainer delegated step 4 to the agent on 2026-08-01, in writing, in
the session that produced this entry: *"I don't want to do anything, you have to do everything."*
That delegation is recorded rather than glossed, because a ticket whose whole point is
*"agreeing what counts as success is the one thing that cannot be done after seeing the numbers"*
is not one an agent should quietly sign on its own initiative.

**Why delegating it does not spoil it.** The integrity of this step is about *sequence*, not
about *signatory*. The four figures below were proposed in this ticket's own step 4 before the
dashboard was built, and every one is fixed against the baseline frozen on 2026-07-30 — which is
before deploy A, before a single custom event has been ingested, and before any redesign number
exists anywhere. Nothing here was chosen with a result in view. That is the property the ticket
was protecting and it survives intact.

**One change to the proposal, and the reason for it.** The proposed fourth criterion —
`repo_clicked` per session not lower than before — cannot be evaluated at deploy A, because there
is no "before". `lib/analytics.ts` has never been deployed, so `repo_clicked` has never fired.
Signing a criterion that cannot be checked is worse than having one fewer. It is therefore moved
to deploy B, where it can be checked, against deploy A's own window. The criteria are split per
deploy accordingly — which is what two annotated boundaries implied all along.

#### Deploy A — behaviour, the thirteen events, the rename

Judged on the first 14 complete days after the annotation, human traffic only
(`$virt_traffic_type = 'Regular'`), against the 2026-07-30 baseline.

| # | Criterion | Baseline | Passes at |
|---|---|---|---|
| A1 | LCP p75, desktop | 4,212ms | **< 2,500ms** |
| A2 | LCP p75, mobile | 4,515ms | **< 2,500ms** |
| A3 | CLS p75, desktop | 0.549 | **< 0.1** |
| A4 | Rage clicks on `/` | 32 in 90d (≈3.6 per 14d) | **at most half the baseline rate** |
| A5 | Every step of the funnel tile non-zero | no events exist | **all three steps > 0** |

A5 is not a performance claim. It is the check that the instrumentation is real — a funnel that
converts at 0% at step 2 is how a renamed event announces itself, and this ticket has already
been bitten by exactly that once today.

#### Deploy B — Studio Dark

Judged on the first 14 complete days after deploy B's annotation, against **deploy A's** window,
not against the 2026-07-30 baseline.

| # | Criterion | Passes at |
|---|---|---|
| B1 | `repo_clicked` per human session | **not lower than deploy A's**. A guardrail: the redesign is expected to cost no outbound clicks, not to add any |
| B2 | LCP p75, desktop and mobile | **still < 2,500ms**. Two webfonts and a per-tile glow are the two things `studio-dark/spec.md` names as most able to undo the performance work |
| B3 | CLS p75, desktop | **still < 0.1** |
| B4 | INP p75, mobile | **< 200ms** (baseline 286ms, Google's poor band). The redesign adds animation to every tile; this is the number animation damages |
| B5 | `$dead_click` and `$rageclick` | **not higher** than deploy A's rate |

#### Watched, deliberately not a criterion

**Median session duration** (baseline 15s). The step-1 comment above calls it *"the single most
useful number here"* and it is — as a diagnostic. It is not a target in either direction. Longer
can mean engaged or can mean lost; shorter can mean fast or can mean bounced. A number whose good
direction is unknown cannot be a pass condition, and making it one would licence reading whichever
movement occurred as a success.

**Pageviews and sessions.** Neither deploy is a traffic intervention. If they move, something
outside this work moved them.

#### What happens if a criterion fails

It is recorded as failed in `posthog-expansion` ticket 11's readout, with the number. A failed
criterion is not a rollback trigger on its own — it is a finding that has to be named out loud
rather than absorbed. The one exception is A5: a funnel step reading zero means the events are
not arriving, which is a defect to fix immediately, not a result to report.

Step 4 is done. The only thing left on this ticket is step 3, the annotation, which fires at the
moment deploy A lands. `ready-for-human` until then.
