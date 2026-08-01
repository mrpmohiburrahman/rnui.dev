# PostHog expansion

Get everything useful out of PostHog that the free tier already includes, and make the
numbers trustworthy enough to judge the UI/UX work against.

Measured 2026-07-30 against project **117415 "rnui.dev dashboard"**
(token ending `sBr4Ihce`), 90-day window, via the PostHog MCP.

## What is running today

Measured 2026-07-30; the **Now** column is kept current as tickets land, so a fresh session does
not have to re-measure the project to know what is already on.

| | 2026-07-30 | Now |
|---|---|---|
| Autocapture | on — 14,879 events / 90d, the dominant signal | on |
| Manual pageviews | on — `capture_pageview: false` + `SuspendedPostHogPageView` | on |
| Pageleave | on — 1,020 events | on |
| Web vitals | on — 2,135 events | on |
| Rageclick | on — 74 events / 50 people | on |
| Session replay | on — 100% sample, 90d retention, console logs + network perf captured | on, 100% kept; input masking pinned in code (was already the default, unchanged behaviour), 1,000ms minimum duration — ticket 04 |
| Heatmaps | on (server side) | on |
| Person profiles | `always` — a profile for every anonymous visitor | `always` — ticket 10 |
| Exception autocapture | **off** | **on** — ticket 02, both project setting and `capture_exceptions` in `posthog.init` |
| Source-map upload | not wired | wired, off until `POSTHOG_API_KEY` + `POSTHOG_PROJECT_ID` are on Vercel — ticket 02 |
| Dead clicks | **off** | on in `posthog.init`, live at next deploy — ticket 04 |
| Surveys | **off** | **off** — ticket 07 |
| Feature flags | **0 defined** | **0 defined** — ticket 08 |
| Actions | **0 defined** | 0 defined |
| Insights | 6 | 20 — +1 error tracking (ticket 02), +13 web vitals (ticket 04) |
| Alerts | 0 | 5 — daily on `$error_tracking_issue_created`, weekly on LCP (mobile + desktop), CLS (desktop), INP (mobile) p75 |
| Dashboards | 1 (primary: 295272) | 2 — "Web performance — field" (`1937530`); ticket 09 adds one |
| Custom events | **none — zero in 90 days** | **still none** — ticket 03 |
| Test-account filter | localhost / 127.0.0.1 only | localhost, `*.vercel.app`, `$virt_is_bot` — ticket 01, default-checked |
| Path cleaning rules | none | none, and now overdue — `/entry/<id>` shipped, 275 paths, ticket 10 |

## What the data already says

**Every device is in Google's "poor" band for LCP.** Field p75, 90 days:

| Device | Samples | LCP | INP | CLS | FCP |
|---|---|---|---|---|---|
| Desktop | 1,792 | 4,212ms | 96ms | 0.549 | 3,502ms |
| Mobile | 330 | 4,515ms | 286ms | 0.025 | 5,904ms |
| Tablet | 13 | 4,861ms | 86ms | 0.612 | 3,462ms |

Thresholds: LCP good ≤2,500ms / poor >4,000ms. CLS good ≤0.1 / poor >0.25. INP good ≤200ms.
Desktop CLS 0.549 corroborates the lab measurement of 0.511 — real visitors are getting it.

**41% of apparent visitors are AI crawlers.** `$pageview` by traffic type:
Regular 4,748 views / 1,092 people · AI Agent 774 / 765 · Bot 8 / 8. Each crawler is counted
as a unique person, so every person-based number on the dashboard is inflated by ~70%.

**`/products` is the primary catalogue surface, not `/`.** Pageviews / people, 90 days:
`/products` 3,554 / 1,010 · `/` 1,826 / 979 · `/bookmarks` 39 / 26 · `/subscribe` 35 / 35 ·
`/aboutus` 29 / 24 · `/contactus` 18 / 18 · `/termsofservice` 15 / 14 · `/privacypolicy` 14 / 14.
**`/feedback`: zero.** This is the evidence for deleting it.

**Visitors rage-click the home page.** 32 rage-clicks on `/` with no element text — they are
clicking something that is not a labelled control. The clickable card is a `motion.div` with
no role, and the demo needs a second click to start. Search results draw their own cluster:
`?search=star`, `?search=text`, `?search=grid`, `?search=bar`, `?search=drawer`,
`?search=tray` — consistent with an undebounced search that re-renders 277 cards per keystroke.

**`demo_load_failed` has never fired.** It is the only custom event in the code
(`components/interactive-video.tsx:75`) and has zero occurrences in 90 days. Either no demo
has failed since instrumentation, or the capture never runs. Ticket 03 resolves which.

## Goals

1. Make the numbers trustworthy — exclude crawlers and internal traffic before anything else.
2. Instrument what the product is actually for: demos watched, repos opened.
3. Turn on the free products that are currently off and would have caught real incidents.
4. Establish a before/after baseline so the UI/UX work can be judged, not asserted.

## Non-goals

- Paid PostHog features. Current volume (~5.5k pageviews / 90d) sits far inside every free
  allowance, and nothing here should change that.
- Identifying visitors. The site has no accounts and gains none here.
- Anything that changes what the site looks like.

## Constraints

- **`api_host` must stay `https://us.i.posthog.com`.** It is hardcoded at
  `lib/posthog-provider.tsx:18` with a comment recording why: a first-party `/ingest` reverse
  proxy got rnui.dev categorised as Malware by URL-reputation engines. Do not reintroduce a
  proxy, and do not move this to an env var.
- Firebase, not PostHog, owns view and vote counts (`lib/counters-firestore.ts`). PostHog
  events are for behaviour, never for the numbers rendered on a card.
- No PII in event properties. Contributor names are public catalogue data; visitor data is not.

## Checkpoints

`CLAUDE.md` says to stop and hand back at the checkpoints listed here. These are they. Each is
a place where continuing would mean an agent deciding something that is not an agent's to
decide, or claiming something it cannot verify.

1. **Before anything reaches a visitor.** The exit survey (ticket 07) is the only instrument in
   this effort that interrupts someone. Do not enable `surveys_opt_in` or ship a survey until
   the maintainer has answered 07's open question, which allows "no".
2. **Before wiring an alert to a channel.** Email to the project's own users is fine. Slack, a
   webhook, Discord or anything else outbound needs the maintainer to supply and confirm the
   destination — a new alert never goes to a shared channel on an agent's initiative.
3. **Before setting `Status: resolved` on a ticket whose acceptance needs a deploy.** Vercel
   environment variables and preview deployments are outside an agent's reach. Hand back with
   `ready-for-human` and say exactly what is left; ticket 02 is the worked example.
4. **Before implementing anything marked `needs-triage`.** Tickets 08 and 10 are decisions with
   the options already written out. Present the options; do not pick one and build it.
5. **Before agreeing what counts as success.** Ticket 09 step 4 has to be settled by the
   maintainer, in writing, before the numbers arrive. Deciding it afterwards is not measurement.
6. **Before reading data that is not ripe.** Ticket 11's readings each have a waiting period.
   Reading two days of dead clicks and writing it up as the breakdown is worse than not reading
   it, because it looks like an answer.

## Tickets

Regrouped 2026-08-01. The original ten split cleanly into three kinds of work, and several
files mixed two of them, which is why nothing could be finished in one sitting. Each file now
carries exactly one kind. Numbers did not change — 08, 09 and ticket 02's notes reference them.

### Agent work, in this order

| # | Ticket | State |
|---|---|---|
| 03 | Instrument the catalogue's real events | **Take this next.** `ready-for-agent`, unblocked. Land ticket 09 steps 2–3 in the same pass |
| 09 | Redesign baseline dashboard | `ready-for-agent`, blocked by 03. Step 1 is already done; steps 2–3 ride with 03 |

04 landed 2026-08-01 and is `ready-for-human` — its work is done, two acceptance bullets wait
on a deploy. It was taken before 03 because it starts the dead-click clock ticket 11 reads;
that ordering no longer applies, and 03 is now simply the frontier.

### The maintainer's judgement — one sitting, about an hour

| # | Ticket | The decision |
|---|---|---|
| 07 | One exit survey | Is a survey wanted at all? Binary, and upstream of the whole ticket |
| 10 | Person-profile and retention hygiene | Four yes/no answers; every trade-off is already written down |
| 05 | Watch the rage-click replays | What were the 32 home-page rage-clicks aimed at? |
| 09 | Step 4 only | Agree success criteria **in writing, before** the redesign numbers land |

Nothing else in the effort waits on any of these.

### Held

| # | Ticket | Why |
|---|---|---|
| 02 | Turn on error tracking | `ready-for-human`. Code and project config are done; acceptance needs the Vercel credentials and a preview deploy |
| 04 | Field performance, dead clicks and replay | `ready-for-human`. Dashboard, three firing alerts, playlist and project settings all landed; `$dead_click` arriving and input masking both need the deploy |
| 08 | Feature-flag the autoplay rollout | `needs-triage`. Its premise is stale — autoplay and the card headline both already shipped, unflagged, in `ui-ux-overhaul` |
| 11 | Post-deploy readout | `needs-triage`, blocked by 02 and 04. Fully specified, not yet due. Convert when the first reading is ripe |

### Done

| # | Ticket | |
|---|---|---|
| 01 | Exclude AI-crawler and internal traffic | `resolved` — every other number was wrong until it landed |

### Why ticket 11 exists

Four tickets shared a shape: do the thing now, come back in one to four weeks and read what it
collected. That tail is what kept ticket 02 out of `resolved` — the work was done, one step was
a calendar entry, and the tracker has no way to say "finished, but check back". The tails now
live in ticket 11 so their parents can close on the work they actually did.
