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
