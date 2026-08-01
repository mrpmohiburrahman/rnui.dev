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
