# 10 — Person-profile and retention hygiene

Status: resolved

## Problem

`lib/posthog-provider.tsx:23` sets `person_profiles: "always"`, which creates a person profile
for every anonymous visitor. Combined with 765 AI-crawler "people" over 90 days, the project is
storing profiles for entities that will never return and can never be identified.

Events with person processing are billed at a higher rate than events without. At current
volume this costs nothing real — the point is that it is pure waste, and the ratio gets worse
as crawler traffic grows.

The obvious fix is not safe. The site has no accounts and never calls `identify`, so switching
to `identified_only` would mean **zero** person profiles, which breaks unique-visitor counts,
retention, and every person-based insight on the dashboard. That is a worse outcome than the
waste.

This is `needs-triage` because it is a genuine trade-off with no clearly correct answer, not a
task waiting to be done.

## Options

1. **Leave `always`.** Costs some quota on crawler profiles. Everything keeps working. At
   ~5.5k pageviews per 90 days this is comfortably inside the free tier and likely stays there.
2. **Suppress profiles for classified bot traffic only.** Keeps human profiles and unique
   counts intact while dropping the waste. Needs a way to know the traffic type before
   `posthog.init` runs, which is not available client-side — PostHog classifies server-side on
   ingest. Likely not achievable without a proxy, and a proxy is forbidden
   (`lib/posthog-provider.tsx:18` — a previous `/ingest` proxy got the domain flagged as
   Malware). **Probably a dead end; confirm before spending time on it.**
3. **Switch to `identified_only` and accept losing person-level analytics.** Cheapest, and
   wrong for this site.

Recommendation: **option 1**, revisited only if the free tier is ever approached.

## Also in scope

- `session_recording_retention_period` is 90 days. Confirm that is wanted; shorter costs less
  storage and 90 days of replay for a site with 1,100 human visitors is generous.
- `event_retention_months` is 84 (seven years) with `events_retention_enforced: false`.
  Deliberate or default? Seven years of pageview data for a component catalogue is unlikely
  to be useful and is worth a conscious decision either way.
- `path_cleaning_filters` is empty. Not needed today — `$pathname` excludes the query string,
  so `/products?category=Buttons` already groups under `/products`. Revisit only if per-entry
  URLs ship (the UI/UX effort adds `/e/<id>`), at which point 277 distinct paths will flood
  every path breakdown and a cleaning rule collapsing them to `/e/:id` becomes necessary.

## Acceptance

A decision is recorded here for each of the four items, with its reason. No code change is
required for the recommended path.

## Notes

Every option and its trade-off is already written above, so this is four yes/no answers, not an
investigation. Do it in one sitting with tickets 05 and 07 and step 4 of ticket 09 — the whole
maintainer-judgement pile of this effort is about an hour, and nothing else waits on any of it.

One item has already had its trigger pulled: `path_cleaning_filters`. The last bullet says to
revisit "only if per-entry URLs ship". They shipped, with `ui-ux-overhaul` ticket 08 — as
`/entry/<id>`, not the `/e/<id>` guessed here, and `pnpm build` prerenders 275 of them. So that
item is no longer "revisit later"; the cleaning rule collapsing them to `/entry/:id` is due
now, and the path breakdowns on ticket 04's and ticket 09's dashboards are the things that
break without it.

## Comments

### 2026-08-01 — All four decided, and one error in this ticket's own Notes found

The maintainer delegated every remaining decision on 2026-08-01. Each of the four is recorded
below with what was actually checked, not what was assumed.

**1. Person profiles — keep `person_profiles: "always"`.** No code change to
`lib/posthog-provider.tsx:22`. The ticket's option 2 (suppress profiles for bot traffic) is not
merely a dead end, it is impossible: `$virt_is_bot` is **not a stored property** in project
117415 — the taxonomy check returns *"Property $virt_is_bot was not found in this project
taxonomy"* — because it is derived server-side at query time. Nothing client-side can know the
traffic type before `posthog.init` runs. Only a proxy could, and `api_host` is pinned by the
Malware-classification constraint. Option 3 (`identified_only`) is ruled out by the ticket's own
argument: this site never calls `identify()`, so it would produce no profiles at all.

**2. Session-recording retention — keep 90 days.** Confirmed live at `90d`; the enum is
30d/90d/1y/5y. No call made. The setting governs *new* recordings only, ticket 05 still has
existing rage-click replays to watch, ticket 11's readout will want the window, and volume is
~734 recordings/month against a 5,000/month allowance. Revisit if that allowance is approached.

**3. Event retention 84 months — accepted, because no lever exists.** `event_retention_months`
and `events_retention_enforced` are absent from the `project-settings-update` schema, and
PostHog's own documentation is explicit that event retention is plan-derived and cannot be
customised. So 84 is not a choice anyone made and not one anyone can unmake. At ~5,500
pageviews/90d it costs nothing.

**4. Path cleaning — two rules saved.** `/recording/<id>` → `^/recording/[^/]+/?$`, and
`/entry/<id>` → `^/entry/[^/]+/?$`. Both verified against sample paths before saving: they
rewrite the two detail forms and leave `/`, `/products`, `/contributors` and `/recording/`
untouched.

Two corrections to what this ticket assumed:

- **The alias is `/recording/<id>`, not the ticket's `/entry/:id`.** Commit `fb6a0ea` renamed the
  route. Angle brackets are PostHog's convention, not colons.
- **Both rules are dormant today.** Zero `/recording/` pathnames have ever been ingested, and
  `/entry/` has exactly 4, all from `$host = localhost:3000` and already excluded by ticket 01's
  test-account filter. This is pre-positioning for deploy A, not a fix to a live problem. The
  `/entry/<id>` rule was added deliberately anyway — see below.

### The error in the Notes, and the tile fix it was hiding

This ticket's Notes claimed the path cleaning rule protects the four "by page" web-vitals tiles.
**It does not, by itself.** The rule is a project setting; a saved trends insight has to opt in.
Insights `10645891` LCP, `10645892` CLS, `10645893` INP and `10645894` FCP on dashboard `1937530`
all broke down by raw `$pathname` with `breakdown_limit: 6`.

Why that matters after deploy A: 277 `/recording/<id>` addresses start being served, and a p75
breakdown is **ordered by value**. One recording page with a single sample and a 12-second LCP
outranks `/products`, and the six pages the dashboard exists to show get pushed out by noise. The
tile would still render, still look reasonable, and be describing nothing.

Fixed on all four by setting `breakdownFilter.breakdown_path_cleaning: true`, which is the
supported field for exactly this and which reads the project rule rather than duplicating its
regex in a hand-written expression.

**This was tested, not assumed, because the two available sources disagreed.** A review pass
claimed path cleaning does not reach trends breakdowns, citing PostHog issue 29801; the live tool
schema documents `breakdown_path_cleaning` as doing precisely that. The `/entry/<id>` rule exists
because it is the only rule matching data that has actually been ingested, which made an
end-to-end test possible. Two identical `query-trends` runs on `$pageview`, `filterTestAccounts:
false`, breakdown `$pathname`, differing only in the flag:

| `breakdown_path_cleaning` | Breakdown value returned |
|---|---|
| `true` | `/entry/<id>` — 4 |
| omitted | `/entry/01JFP0VE8A5KT8R0QSBQFE34VR` — 4 |

The flag works. The review pass was reading a stale issue.

Status `resolved`: every acceptance bullet here is a recorded decision, and the two actions they
implied are MCP writes that are done, not deploys that are pending.
