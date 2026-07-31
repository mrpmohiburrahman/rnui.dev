# 01 — Exclude AI-crawler and internal traffic

Status: resolved

## Problem

41% of apparent visitors are not people. Measured over 90 days:

| Traffic type | Pageviews | "People" |
|---|---|---|
| Regular | 4,748 | 1,092 |
| AI Agent | 774 | 765 |
| Bot | 8 | 8 |

Each crawler is counted as a unique person, so person-based numbers are inflated by roughly
70%. PostHog already classifies this on every event via `$virt_traffic_type`,
`$virt_is_bot`, `$virt_traffic_category` and `$virt_bot_name` — nothing new needs capturing,
the filtering just is not applied.

Separately, the project's test-account filter excludes only `localhost` and `127.0.0.1`
(`test_account_filters` on project 117415). Vercel preview deployments and the maintainer's
own browsing of production both count as real traffic.

## Work

1. Extend the project's test-account filters to also exclude:
   - `$virt_is_bot` is true
   - `$host` matching Vercel preview domains (`*.vercel.app`)
2. Set `test_account_filters_default_checked` to true so every new insight excludes them by
   default rather than relying on the author remembering.
3. Re-check the six existing insights and the primary dashboard (295272); enable the
   "filter test accounts" toggle on each.
4. Record the human-only baseline for the 90 days before this change, so pre/post numbers
   remain comparable: pageviews, unique people, and the `/products` vs `/` split.

Both steps 1 and 2 are project settings — `project-settings-update` via the MCP, or
Settings → Project in the PostHog UI.

## Acceptance

- A trends query of `$pageview` over the last 90 days with test accounts filtered returns
  approximately 4,748 pageviews / 1,092 people, not 5,530 / 1,865.
- A new insight created from scratch excludes bots without the author doing anything.
- The pre-change baseline numbers are written into this file under `## Comments`.

## Notes

`$virt_traffic_type` is present on events but not registered in the project's property
taxonomy, so the MCP emits a taxonomy warning when querying it. The values are real; the
warning is about the definitions catalogue, not the data.

## Comments

Done 2026-07-31 against project 117415. No application code changed — this ticket is entirely
PostHog project configuration.

### Filters now on the project

`test_account_filters` went from one entry to three. Each is ANDed:

| Property | Operator | Value |
|---|---|---|
| `$host` | `not_regex` | `^(localhost\|127\.0\.0\.1)($\|:)` (pre-existing) |
| `$host` | `not_regex` | `\.vercel\.app$` (new) |
| `$virt_is_bot` | `is_not` | `true` (new) |

Kept the Vercel exclusion as its own row rather than folding it into the existing localhost
regex, so each rule reads as one concern in Settings → Project and can be removed on its own.

`test_account_filters_default_checked` went `null` → `true`.

Checked `$virt_is_bot` before picking the operator: it is set on every `$pageview` in the
window, never missing, so `is_not true` and `exact false` return identical counts. `is_not` is
the safer of the two if PostHog ever ships events without the property.

### Baseline, 90 days to 2026-07-31

Human-only means the three filters above applied (`filterTestAccounts: true`).

| Measure | Human-only | Unfiltered | Crawler share |
|---|---|---|---|
| `$pageview` | 4,780 | 5,564 | 14% |
| Unique people | 1,102 | 1,874 | 41% |
| `/products` views / people | 2,917 / 396 | 3,554 / 1,010 | 18% / 61% |
| `/` views / people | 1,814 / 928 | 1,826 / 979 | 1% / 5% |

Matches the ticket's expected ~4,748 / 1,092 (measured a day later than the spec, so slightly
higher). First acceptance criterion met.

The person-level distortion is worse than the pageview-level one, and it is concentrated on
`/products`: crawlers took 61% of that page's apparent audience but only 18% of its views —
each one arrives, reads the catalogue once, and never returns. `/` was barely touched. Any
prior read of "`/products` reaches 1,010 people" was off by a factor of 2.5.

### Insights and dashboard

All six insights had `filterTestAccounts: false`; all six are now `true`:

| ID | Insight |
|---|---|
| 2244701 | Daily active users (DAUs) |
| 2244702 | Weekly active users (WAUs) |
| 2244703 | Retention |
| 2244704 | Growth accounting |
| 2244705 | Referring domain (last 14 days) |
| 2244706 | Pageview funnel, by browser |

Dashboard 295272 carries all six as tiles and has no filter of its own (`filters: {}`).
PostHog has no dashboard-level test-account toggle — the setting lives per insight — so the
dashboard is fully covered once its tiles are, which they now are.

### One caveat worth knowing

`test_account_filters_default_checked` governs the **UI**: the toggle is pre-checked when you
build a new insight in PostHog. It does not change the API. A query sent through the MCP or
REST API without an explicit `filterTestAccounts: true` is still unfiltered — verified by
re-running the same query before and after the change and getting 5,564 both times. When
querying this project from an agent or a script, pass the flag explicitly.
