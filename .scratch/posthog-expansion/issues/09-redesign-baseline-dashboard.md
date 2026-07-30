# 09 — Redesign baseline dashboard

Status: ready-for-agent

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
enough for it, and it stops being available if anything changes.

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
