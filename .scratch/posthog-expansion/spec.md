# PostHog expansion

Get everything useful out of PostHog that the free tier already includes, and make the
numbers trustworthy enough to judge the UI/UX work against.

Measured 2026-07-30 against project **117415 "rnui.dev dashboard"**
(token ending `sBr4Ihce`), 90-day window, via the PostHog MCP.

## What is running today

| | State |
|---|---|
| Autocapture | on — 14,879 events / 90d, the dominant signal |
| Manual pageviews | on — `capture_pageview: false` + `SuspendedPostHogPageView` |
| Pageleave | on — 1,020 events |
| Web vitals | on — 2,135 events |
| Rageclick | on — 74 events / 50 people |
| Session replay | on — 100% sample, 90d retention, console logs + network perf captured |
| Heatmaps | on (server side) |
| Person profiles | `always` — a profile for every anonymous visitor |
| Exception autocapture | **off** |
| Dead clicks | **off** |
| Surveys | **off** |
| Feature flags | **0 defined** |
| Actions | **0 defined** |
| Insights | 6 |
| Dashboards | 1 (primary: 295272) |
| Custom events | **none — zero in 90 days** |
| Test-account filter | localhost / 127.0.0.1 only |
| Path cleaning rules | none |

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

## Tickets

| # | Ticket | Why it is first |
|---|---|---|
| 01 | Exclude AI-crawler and internal traffic | Every other number is wrong until this lands |
| 02 | Turn on error tracking | Free, off, and would have caught the HEVC decode incident |
| 03 | Instrument the catalogue's real events | Zero custom events exist today |
| 04 | Core Web Vitals dashboard and alerts | Field data already contradicts the site's claims |
| 05 | Put session replay to work | Already recording; nothing is watching |
| 06 | Turn on dead-click capture | Cards are non-semantic divs; this measures it |
| 07 | One exit survey | Free, off, and the only qualitative signal available |
| 08 | Feature-flag the autoplay rollout | Autoplay redefines the view metric; ship it reversibly |
| 09 | Redesign baseline dashboard | Capture "before" while the old site is still live |
| 10 | Person-profile and retention hygiene | Crawler profiles burn quota for no signal |
