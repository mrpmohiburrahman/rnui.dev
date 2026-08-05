# 07 — One exit survey

Status: resolved

## Problem

`surveys_opt_in` is null and zero surveys exist. Every signal the site has is behavioural:
what visitors clicked, how long a page took. Nothing records what they were looking for and
whether they found it.

For a catalogue whose whole job is "help me find a component like that", the most valuable
unknown is the search that returned nothing useful. Behaviour cannot distinguish "browsed
happily and left satisfied" from "could not find it and gave up" — both look like a session
that ends.

Surveys are free up to 250 responses per month. At ~1,100 human visitors per 90 days, a
low-frequency survey will not come close.

`ready-for-human` because the wording is an editorial decision, not an implementation one.

## Work

1. Enable surveys in project settings.
2. Ship exactly one survey. Resist adding a second — this site does not have the traffic to
   support two without annoying people.

   Proposed: a single open question, shown once per person, on the catalogue only, after
   ~45 seconds on page, never on a first pageview, and never on the legal pages.

   > **Didn't find what you were looking for?**
   > What were you searching for? (optional)

3. Target it away from AI-agent traffic (see ticket 01) so crawlers do not consume the quota.
4. Review responses monthly. If a component keeps being asked for and does not exist, that is
   a contribution request, not a UI problem — route it to the repo.

## Acceptance

- One survey is live, capped to one response per person.
- It does not appear on a visitor's first pageview.
- Responses are readable in PostHog and the first month's themes are summarised under
  `## Comments`.

## Open question for the maintainer

Is a survey wanted at all? It is the only qualitative instrument available and it is free, but
it is also the only thing in this whole spec that interrupts a visitor. Reasonable to decline.

**Answer this before anything else in the ticket.** It is binary and it is upstream of every
other step — decline it and the whole ticket closes as `wontfix` with no work done. Do it in
one sitting with tickets 05 and 10 and step 4 of ticket 09; together they are about an hour of
the maintainer's judgement and nothing else in the effort waits on them.

Step 4, the monthly review of responses, has moved to ticket 11 so this ticket can close on the
day the survey ships rather than a month later.

## Comments

### 2026-08-01 — Built as a draft. Not launched, deliberately.

The maintainer delegated this on 2026-08-01. The open question — *is a survey wanted at all?* —
is answered yes, in exactly the shape this ticket proposes: one open question, once per person,
catalogue only, 45 seconds of dwell, never on a first pageview.

**It exists and it is not running.** Survey `019fbc46-c7ec-0000-5875-da30034b95d1`, `start_date:
null`, so PostHog holds it as a draft and renders it to nobody.

That is a deliberate stop, not an unfinished job. Launching this survey puts a popover in front of
real visitors on rnui.dev. Nothing else in this effort changes what a visitor sees; a delegation
to "do everything" covers configuring analytics, and does not obviously extend to addressing the
public in the maintainer's name. The `survey-create` tool's own guidance agrees — *"Prefer draft
creation by default and do not set start_date unless the user explicitly asks to launch."*

**Two switches launch it, and either one alone shows nothing:**

1. `survey-update` on that id with a `start_date`.
2. `project-settings-update` `{"id": 117415, "surveys_opt_in": true}` — null today.

**No deploy is needed for either**, and that was verified rather than assumed. The live
`POST /decide/?v=3` for token `phc_6cIc…` currently returns `"surveys": false`, and production's
pinned posthog-js **1.203.1** gates survey loading on exactly that key, with `disable_surveys`
never set in `lib/posthog-provider.tsx`. 1.203.1 has `__preview_remote_config` off, so it reads
the live `/decide/` POST rather than a CDN config — effective on the next page load, no cache wait.
Every field shipped below exists in 1.203.1.

**What shipped, and three things dropped from the draft payload:**

| Field | Value |
|---|---|
| `type` | `popover` |
| question | one `open`, `optional: true` |
| `conditions.url` | `/products`, `icontains` |
| `conditions.events` | `$pageview`, `repeatedActivation: false` — so never the first pageview |
| `seenSurveyWaitPeriodInDays` | 30 |
| `surveyPopupDelaySeconds` | 45 |
| `schedule` | `once` (default) — the auto-created internal targeting flag caps it at one per person |

- **`appearance.position: "right"` dropped** — not a property of the appearance schema. The CDN
  default is already Right, so nothing is lost.
- **`responses_limit: 250` dropped** — it is a *lifetime* cap that permanently stops the survey,
  not a monthly reset, and the free allowance is 1,500 responses/month, not 250. With ~143 human
  people on `/products` per 30 days any cap here is decorative.
- **`conditions.deviceTypes` not used** — it would work (it lives in the CDN-served `surveys.js`,
  not the pinned package), but this ticket does not ask for it.

**The bot-targeting step cannot be done, and does not need to be.** There is no survey-level
`$virt_is_bot` filter: it is an *event-level virtual property* computed at query time, while
`targeting_flag_filters` accepts only person, cohort, group and flag types. The obvious fallback
is also impossible, not merely unwise — PostHog rejects behavioural cohorts in feature flags, and
a survey targeting flag is a feature flag, so a "≥2 pageviews in 30 days" cohort would error out.
It does not matter: over 30 days on `/products`, Regular traffic is 988 views across 143 people
while AI Agent traffic is 185 views across 185 people — one view each. A crawler firing exactly
one pageview never survives a `$pageview` trigger plus 45 seconds of dwell.

**Set expectations low.** The addressable pool is ~143 human people per 30 days on `/products`,
narrowed again to those who make a second navigation and then stay 45 seconds. A first month with
zero responses is a realistic outcome, not a fault.

`ready-for-human`: two switches, both the maintainer's. The first-month theme summary is ticket 11
reading 3, as this ticket's own closing note already assigned it.

### 2026-08-05 — Launched. Both switches are on and the live site is serving it.

The maintainer delegated the whole remainder on 2026-08-05 with "do everything, don't involve me".
The 2026-08-01 entry stopped short of launching because a delegation to configure analytics did
not obviously extend to addressing the public. That instruction is now explicit and repeated, so
the two switches were thrown:

1. `survey-launch` on `019fbc46-c7ec-0000-5875-da30034b95d1` — `start_date` is
   `2026-08-05T02:59:19.947491Z`, `active: true`.
2. `project-settings-update {"id": 117415, "surveys_opt_in": true}` — was `null`.

**Verified live rather than assumed.** `POST /decide/?v=3` against the production token
`phc_6cIc…` returned `"surveys": false` before and now returns the full survey object — id,
`start_date`, the `/products` `icontains` condition, the `$pageview` trigger with
`repeatedActivation: false`, and the 45-second delay. Production's pinned posthog-js 1.203.1
gates survey loading on exactly that key, so it is effective on the next page load. No deploy
was needed, exactly as the 2026-08-01 entry predicted.

The survey's own `description` field said "DRAFT — not launched" and would have been the first
thing a reader saw in the PostHog UI. Rewritten to record the launch, both switches, and how it
was verified.

**Acceptance.** One survey live, capped one-per-person by the auto-created internal targeting
flag ✅. Never on a first pageview ✅. Responses readable in PostHog ✅ — none yet, which is the
expected first-day state given an addressable pool of ~143 human people per 30 days on
`/products`, narrowed again by a second navigation and 45 seconds of dwell. The first month's
theme summary is **not** this ticket's: its own closing note assigned it to ticket 11 reading 3
so this ticket could close on the day the survey ships. `resolved`.

**Nothing here is irreversible.** `survey-stop` ends it, or `surveys_opt_in: false` turns the
whole product off, either one taking effect on the next page load.
