# PostHog: what can be programmatically VERIFIED?

Research date: 2026-08-04
Sources (fetched directly):
- `https://raw.githubusercontent.com/PostHog/mcp/main/README.md` — repo moved; server now lives in the monorepo at `PostHog/posthog/tree/master/services/mcp`
- `https://posthog.com/docs/model-context-protocol` (overview)
- `https://posthog.com/docs/model-context-protocol/tools.md` (**authoritative verbatim tool list**, ~700 tools)
- `https://posthog.com/docs/model-context-protocol/faq.md` (auth)
- `https://posthog.com/docs/api/queries` (query endpoint)

Two pages returned 404 HTML (`/docs/api/projects.md`, `/docs/product-analytics/dead-clicks.md`), so anything below about **project-settings field names is marked UNVERIFIED** and must be confirmed with one live `GET /api/projects/:id/`.

---

## 1. Official MCP server — tool inventory

Endpoint: `https://mcp.posthog.com/mcp` (auth server auto-routes US/EU).
The server exposes **~700 tools across 64 categories**. Tool names are stable and can be filtered with the `?tools=` query param. **CLI mode** ships a single token-optimised `exec` tool that lists/searches/inspects/calls the rest on demand — recommended, because loading every schema is enormous.

Legend: **R** = read-only, **W** = mutates.

### Categories that matter for the 10 tickets

**Core (4)**
| Tool | R/W |
|---|---|
| `project-get` | R |
| `project-settings-update` | W |
| `user-get` | R |
| `user-settings-update` | W |

**SQL / Data schema / Insights**
| Tool | R/W | Note |
|---|---|---|
| `execute-sql` | R | **the workhorse** — runs HogQL |
| `read-data-schema` | R | explore events, actions, properties, property *values* |
| `insight-query` | R | run a saved insight |
| `insights-list`, `insight-get` | R |
| `insight-create`, `insight-update`, `insight-delete` | W |
| `elements-stats-retrieve` | R | element click stats |

**Query wrappers (14)** — all R
`query-funnel`, `query-funnel-actors`, `query-trends`, `query-trends-actors`, `query-retention`, `query-retention-actors`, `query-paths`, `query-paths-actors`, `query-lifecycle`, `query-lifecycle-actors`, `query-stickiness`, `query-stickiness-actors`, `query-llm-trace`, `query-llm-traces-list`

**Alerts (6)**
`alerts-list` (R), `alert-get` (R), **`alert-simulate` (R-ish: "Simulate detector on insight" — evaluates against current data without firing)**, `alert-create` (W), `alert-update` (W), `alert-delete` (W)

**Error tracking (24)** — reads that matter:
`error-tracking-settings-get` (R), `error-tracking-grouping-rules-list` (R), `error-tracking-suppression-rules-list` (R), `error-tracking-bypass-rules-list` (R), `error-tracking-assignment-rules-list` (R), `error-tracking-symbol-sets-list` (R), `error-tracking-recommendations-list` (R), `query-error-tracking-issues-list` (R), `query-error-tracking-issue` (R), `query-error-tracking-issue-events` (R).
Writes: `error-tracking-settings-update`, `*-rules-create/update`, `error-tracking-issues-merge-create`, `error-tracking-issues-split-create`, `error-tracking-issues-partial-update`, `error-tracking-external-references-create`.
**Error tracking alerts (4):** `error-tracking-alerts-list` (R), `error-tracking-alerts-create/partial-update/delete` (W).

**Session replays (11)**
`query-session-recordings-list` (R), `session-recording-get` (R), **`session-recording-playlists-list` (R)**, `session-recording-playlist-get` (R), `session-recording-summaries-list` (R), `session-recording-summary-get` (R), `session-recording-summarize` (R, AI), `session-recording-playlist-create/update` (W), `session-recording-delete`, `session-recording-bulk-delete` (W).
**Replay vision (28)** — AI scanners over replays (`vision-scanners-*`, `vision-observations-*`); can scan a session on demand (`vision-scanners-scan-session`). Relevant as a *fallback* for visual checks like masking.

**Surveys (11)**
`surveys-get-all` (R), `survey-get` (R), **`survey-stats` (R)**, `surveys-global-stats` (R), **`surveys-responses-list` (R)**, `surveys-summarize-responses-create` (R, AI), `survey-create`/`survey-update`/`survey-delete`/`survey-launch`/`survey-stop` (W)

**Events & properties (2)** — `event-definition-update` (W), `property-definition-update` (W). ⚠️ *No* list/read tools here; use `read-data-schema` or the REST definition endpoints.

**Web analytics (12)** — `query-web-overview`, `query-web-stats`, `query-web-vitals`, `heatmaps-list`, `heatmaps-events`, `heatmaps-saved-list/get` (R); `heatmaps-saved-create/update/regenerate`, `path-cleaning-rules-update` (W).

**Actions (5)** — `actions-get-all`, `action-get` (R); `action-create/update/delete` (W).
**Feature flags (22)** — reads: `feature-flag-get-all`, `feature-flag-get-definition`, `feature-flag-get-definition-by-key`, `feature-flags-status-retrieve`, `feature-flags-activity-retrieve`, `feature-flags-evaluation-reasons-retrieve`, `feature-flags-test-evaluation-create`, `feature-flags-my-flags-retrieve`, `feature-flags-dependent-flags-retrieve`, `feature-flags-user-blast-radius-create`, `scheduled-changes-list/get`. Writes: `create-feature-flag`, `update-feature-flag`, `delete-feature-flag`, `feature-flags-bulk-*`, `feature-flags-copy-flags-create`, `scheduled-changes-create/update/delete`.
**Dashboards (18)** — `dashboards-get-all`, `dashboard-get`, `dashboard-insights-run`, `dashboard-widgets-run`, `dashboard-templates-list/retrieve` (R); the rest W.
**Persons (7)** — `persons-list`, `persons-retrieve`, `persons-values-retrieve`, `persons-cohorts-retrieve` (R); `persons-property-set/delete`, `persons-bulk-delete` (W).
**Cohorts (6)**, **Annotations (5)**, **Notebooks (15)**, **Logs (19)** (`query-logs`, `logs-count`, `logs-attributes-list`, `logs-alerts-*`), **Experiments (36)**, **Health (3)** (`health-issues-list/get/summary`), **Org/project (4)** (`organizations-get`, `projects-get`, `switch-organization`, `switch-project`), **Docs (1)** (`docs-search`), **Utilities (1)** (`generate-app-url`).
Also present but irrelevant here: AI observability (74), Customer analytics (50), Signals (59), Workflows (30), Data warehouse (22), Warehouse sources (26), Endpoints (14), Data catalog (16), Canvas, Conversations, Stamphog, ReviewHog, Tasks, Skills, Streamlit apps, MCP Store.

---

## 2. Verifiability matrix for the 7 acceptance categories

| # | Acceptance criterion | Verdict | How |
|---|---|---|---|
| 1a | `capture_dead_clicks` **is on** | ⚠️ **PARTIAL / likely a code-level check** | `capture_dead_clicks` is a **posthog-js init option**, not (confirmably) a server toggle. No MCP tool names it. Best checks: (a) grep your SDK init in the repo; (b) `project-get` and inspect returned keys — **UNVERIFIED whether the field is exposed**; (c) fetch the public remote config `GET https://us.i.posthog.com/array/<PROJECT_API_KEY>/config` and diff. |
| 1b | `$dead_click` events **are arriving** | ✅ **YES** | HogQL count over `events` (query A below). This is the criterion that actually matters — prefer it over the toggle. |
| 2 | Funnel `demo_played → recording_opened → repo_clicked` non-zero at every step | ✅ **YES** | MCP `query-funnel`, or POST `/query/` with `kind: "FunnelsQuery"`, or HogQL step-count approximation (query C). Assert every step's count > 0. |
| 3a | Error tracking **enabled** | ✅ **YES** | `error-tracking-settings-get` (MCP). |
| 3b | Exceptions **grouped** | ✅ **YES** | `query-error-tracking-issues-list` returns issue groups (each = a fingerprint group); `error-tracking-grouping-rules-list` shows custom rules. Cross-check raw volume with HogQL on `event = '$exception'`. |
| 4a | Replay **masks email inputs** | ❌ **NO — biggest gap** | Masking is applied client-side by rrweb at capture time. There is **no MCP tool** that reads replay masking settings (`session-recording-*` tools cover recordings and playlists only). `project-get` *may* expose masking config — **UNVERIFIED**. Even if it does, that proves configuration, not that a specific email input was masked. Practical substitutes: (i) grep `maskAllInputs` / `maskInputOptions` / `session_recording` in SDK init; (ii) Playwright test asserting the rrweb payload contains no typed email; (iii) HogQL PII scan (query D) as a negative signal; (iv) `vision-scanners-scan-session` for an AI visual check (costly, non-deterministic). |
| 4b | A **"Rage clicks" playlist exists** | ✅ **YES** | `session-recording-playlists-list` → match on name; also `GET /api/projects/:id/session_recording_playlists/`. |
| 5 | An **alert fires against current data** | ✅ **YES** | `alerts-list` for existence + **`alert-simulate`** to evaluate the detector against current data without waiting for a real fire. (Alert must be attached to an insight.) |
| 6a | A **survey exists** | ✅ **YES** | `surveys-get-all` / `survey-get`. |
| 6b | **Responses land** | ✅ **YES** | `survey-stats` (per survey) or `surveys-responses-list`; HogQL on `event = 'survey sent'` as an independent cross-check. |
| 7 | **No event carries a raw search string or email** | ✅ **YES** | HogQL regex scan across event properties (query D). Also `read-data-schema` to enumerate property *values* per property, and `GET /api/projects/:id/property_definitions/` to catch newly-created suspicious property names. |

### Gap summary (the valuable part)
1. **Project-setting toggles are the weak spot.** The only settings reads in the whole MCP surface are `project-get` and `error-tracking-settings-get`. There is **no** `session-recording-settings-get`, no dead-click settings tool, no autocapture settings tool. Verify **behaviour (events arriving)** instead of **configuration**, wherever possible.
2. **`capture_dead_clicks`** is an SDK init flag → assert it in code (unit/lint check on the init object) + assert `$dead_click` volume in PostHog. Do not write an acceptance test against a project setting until you've confirmed the field exists in a live `project-get`.
3. **Replay input masking is not API-verifiable.** Treat it as a client-side test (Playwright + rrweb payload assertion) or a manual sign-off, not an API check.
4. **Event/property definitions have no MCP read tool** (only `*-update`). Use `read-data-schema` or the REST definition endpoints.
5. **Alerts:** existence ≠ firing. `alert-simulate` is the only way to prove the detector trips on current data.
6. `/query` is explicitly **not an export path** — PostHog reserves the right to rate-limit export-shaped usage. Keep verification queries small, aggregate-only, and time-bounded.

---

## 3. Exact query shapes

### REST endpoint
```
POST /api/projects/:project_id/query/
Host: https://us.posthog.com   (or https://eu.posthog.com)
Authorization: Bearer $POSTHOG_PERSONAL_API_KEY
Content-Type: application/json
```
Body: `{"query": {"kind": "HogQLQuery", "query": "<SQL>"}, "name": "<label for query_log>"}`
Optional `refresh`: `blocking` | `async` | `force_async` | `lazy_async` | `async_except_on_cache_miss`.
Async responses return `{"query_status": {"id", "complete": false, ...}}` — poll `GET /api/projects/:project_id/query/:query_id/`.
Default 100 rows; explicit `LIMIT` up to 50k. **`OFFSET` pagination is rejected (HTTP 400) for personal API keys** — use keyset pagination on `timestamp`.
Other useful `kind` values: `FunnelsQuery`, `TrendsQuery`, `EventsQuery` (see the frontend query schema in the monorepo).

### A. Did event X arrive in the last N days?
```sql
SELECT count() AS events, uniq(person_id) AS users, max(timestamp) AS last_seen
FROM events
WHERE event = '$dead_click'
  AND timestamp >= now() - INTERVAL 7 DAY
```
Pass criterion: `events > 0` (and `last_seen` recent).

```bash
curl -sS -X POST "https://us.posthog.com/api/projects/$POSTHOG_PROJECT_ID/query/" \
  -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "kind": "HogQLQuery",
      "query": "SELECT count() AS events, uniq(person_id) AS users, max(timestamp) AS last_seen FROM events WHERE event = '\''$dead_click'\'' AND timestamp >= now() - INTERVAL 7 DAY"
    },
    "name": "verify:dead_click_arriving"
  }'
```
Response shape: `{"results": [[123, 45, "2026-08-04T..."]], "columns": [...], "types": [...], "is_cached": ..., "last_refresh": ...}`.

### B. Does event X carry property P?
```sql
SELECT
  count()                                   AS total,
  countIf(JSONHas(properties, 'repo_slug')) AS with_prop,
  countIf(empty(toString(properties.repo_slug))) AS empty_prop,
  any(properties.repo_slug)                 AS sample
FROM events
WHERE event = 'repo_clicked'
  AND timestamp >= now() - INTERVAL 7 DAY
```
Pass criterion: `total > 0 AND with_prop = total AND empty_prop = 0`.
Cheaper, schema-level alternative (no scan): MCP `read-data-schema`, or `GET /api/projects/:id/property_definitions/?event_names=["repo_clicked"]`.

### C. Funnel non-zero at every step
Preferred — MCP `query-funnel`, or the typed query:
```json
{"query": {"kind": "FunnelsQuery",
  "series": [{"kind":"EventsNode","event":"demo_played"},
             {"kind":"EventsNode","event":"recording_opened"},
             {"kind":"EventsNode","event":"repo_clicked"}],
  "dateRange": {"date_from": "-7d"}}}
```
Assert every returned step's `count > 0`.
HogQL smoke-test fallback (per-step volume, not true funnel ordering):
```sql
SELECT event, count() AS c
FROM events
WHERE event IN ('demo_played','recording_opened','repo_clicked')
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY event
```
Assert 3 rows returned, all `c > 0`.

### D. PII scan — no raw email / search string in any event
```sql
SELECT event, count() AS hits, any(toJSONString(properties)) AS sample
FROM events
WHERE timestamp >= now() - INTERVAL 7 DAY
  AND match(toJSONString(properties), '(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}')
GROUP BY event
ORDER BY hits DESC
LIMIT 20
```
Pass criterion: **zero rows.** (If `toJSONString` errors, try `toString(properties)`.)
Search-string variant — assert the query param is absent or hashed:
```sql
SELECT count() AS leaks
FROM events
WHERE timestamp >= now() - INTERVAL 7 DAY
  AND (JSONHas(properties, 'search_query')
       OR match(toString(properties.$current_url), '[?&](q|s|query|search)='))
```

---

## 4. Auth

### MCP server
- **Preferred: OAuth.** `npx @posthog/wizard@latest mcp add` wires it up; the auth server routes to the right region.
- **Fallback: personal API key.** Create it with the **`MCP Server` preset** at `https://app.posthog.com/settings/user-api-keys?preset=mcp_server` (the preset scopes the key to a specific project). Header: `Authorization: Bearer phx_...`.
- **Enterprise:** ID-JAG / enterprise-managed authorization via Okta, Entra ID, etc.
- Token prefix: **`phx_`**.

### Query API
- **Personal API key** with the **`Query Read`** scope (create at `/settings/user-api-keys#personal-api-keys`). Header `Authorization: Bearer phx_...`.
- Needs the **project ID** from `/settings/project#variables`.
- Additional scopes for the other checks: `session_recording:read` / `session_recording_playlist:read`, `survey:read`, `error_tracking:read`, `insight:read`, `alert:read` (grant read-only; never grant write to a CI verification key).

### Suggested env vars
```bash
POSTHOG_PERSONAL_API_KEY=phx_...     # personal API key (Query Read + read scopes)
POSTHOG_PROJECT_ID=12345             # numeric project id
POSTHOG_HOST=https://us.posthog.com  # or https://eu.posthog.com
POSTHOG_API_KEY=phc_...              # public project write key (client SDK / remote-config check only)
```
(`POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST` are the names PostHog's own docs and CLI use.)

---

## 5. Recommended verification harness

One script, ~8 HTTP calls, no MCP client required (MCP is a convenience wrapper over these same REST endpoints):

| Check | Call |
|---|---|
| dead clicks arriving | `POST /query/` — query A on `$dead_click` |
| funnel steps non-zero | `POST /query/` — `FunnelsQuery` |
| error tracking on | `GET /api/projects/:id/error_tracking/settings/` (MCP `error-tracking-settings-get`) |
| exceptions grouped | `GET`/`POST` error-tracking issues list (MCP `query-error-tracking-issues-list`) |
| rage-clicks playlist | `GET /api/projects/:id/session_recording_playlists/` |
| alert exists + trips | `GET /api/projects/:id/alerts/` then MCP `alert-simulate` |
| survey + responses | `GET /api/projects/:id/surveys/` + `survey-stats` |
| no PII | `POST /query/` — query D (assert 0 rows) |
| replay masking | ❌ not API-checkable → Playwright/rrweb assertion + code grep |
| `capture_dead_clicks` flag | ⚠️ code grep now; add a `project-get` key check only after confirming the field exists live |

Use `refresh: "blocking"` for determinism in CI, keep every query time-bounded and aggregate-only, and give each a distinct `name` so runs are traceable in the `query_log` table.
