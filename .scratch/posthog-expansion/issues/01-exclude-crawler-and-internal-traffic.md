# 01 — Exclude AI-crawler and internal traffic

Status: ready-for-agent

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
