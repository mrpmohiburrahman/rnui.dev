# 10 — Person-profile and retention hygiene

Status: needs-triage

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
