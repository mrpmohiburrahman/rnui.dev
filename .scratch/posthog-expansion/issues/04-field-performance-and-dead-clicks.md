# 04 — Field performance, dead clicks and replay configuration

Status: ready-for-agent
Blocked by: 01

Absorbs the whole of former ticket 06 (dead-click capture) and steps 3 and 4 of ticket 05
(replay configuration). All three were the same unit of work — one PostHog configuration pass,
no application code beyond a single `posthog.init` line — and splitting them across three files
only guaranteed three sessions doing one session's work. Ticket 05 keeps the half that needs a
person watching recordings.

**Do this before ticket 03, even though 03 is the lower number.** Two of the switches below
start a clock: dead clicks and the replay triggers produce nothing until visitors trigger them,
and the readout in ticket 11 is two weeks after they go on. Ticket 03 is a day's work that
delays that clock by a day for no reason. The frontier rule in `CLAUDE.md` picks the lowest
available number and will offer 03 first — take this one instead, and say why in the commit.

## Problem

### Nothing reads the web vitals

`$web_vitals` has been capturing for 90 days (2,135 events) and nothing reads it. The data says
every device is in Google's "poor" band for LCP:

| Device | Samples | LCP p75 | INP p75 | CLS p75 | FCP p75 |
|---|---|---|---|---|---|
| Desktop | 1,792 | 4,212ms | 96ms | 0.549 | 3,502ms |
| Mobile | 330 | 4,515ms | 286ms | 0.025 | 5,904ms |
| Tablet | 13 | 4,861ms | 86ms | 0.612 | 3,462ms |

Thresholds: LCP good ≤2,500 / poor >4,000. CLS good ≤0.1 / poor >0.25. INP good ≤200.

Desktop CLS of 0.549 independently corroborates the 0.511 measured in the lab, which means the
layout shift is not a lab artefact — real visitors see the page move under them.

Mobile FCP of 5,904ms is worse than mobile LCP on most sites. Worth its own look: it suggests
render-blocking work before anything paints at all, not just a slow largest element.

### Dead clicks are not captured

`capture_dead_clicks` is false. A dead click is a click on something that looks interactive and
does nothing — precisely the failure mode the 32 unlabelled home-page rage-clicks suggest.

The site has a concrete reason to expect them. The catalogue card is a `motion.div` with an
`onClick` and no `role`, `tabIndex` or keyboard handler (`components/entry-card.tsx:131-137`),
and the bookmark control is `pointer-events-none` until hover (`:149-154`), so on a touch
device it is visible but inert. A finger tapping the bookmark icon on a phone produces exactly
a dead click, and nothing currently records it.

### Replay is running at defaults

Session replay samples 100% of sessions, retains 90 days, and captures console logs and network
performance — all at defaults, with no masking and no triggers. The newsletter and contact
forms take email addresses.

## Work

### 1. Dead clicks

Set `capture_dead_clicks: true` in `posthog.init` (`lib/posthog-provider.tsx`), **not** in
project settings. It is an init option on the installed `posthog-js`, and ticket 02 already
established the pattern for `capture_exceptions`: set it in code so capture starts before
remote config arrives and a toggle flipped in the PostHog UI cannot silently switch it off.

### 2. Replay configuration

- Set a masking config. Nothing on the site is sensitive, but the newsletter and contact forms
  take email addresses — mask inputs by default.
- Consider `session_recording_minimum_duration_milliseconds` so one-second crawler visits are
  not stored.
- Keep the 100% sample rate. Volume is low enough that sampling would only lose signal.
- Add `$rageclick` to `session_recording_event_trigger_config` so those sessions are certain to
  be captured.
- Create the saved playlist "Rage-clicks", filtered to sessions containing `$rageclick`. The
  second playlist ticket 05 wants, "Failed demos", needs `demo_load_failed` verified by ticket
  03 — leave it to that pass.

### 3. Web performance dashboard

Create "Web performance — field" with, all p75 and all test-accounts-filtered:

- LCP, INP, CLS, FCP over time, broken down by `$device_type`
- The same four broken down by `$pathname`, so `/products` and `/` are separable
- Sample count per day, so a quiet day is not mistaken for an improvement

Add a marker for the redesign deploy date so before/after is readable on one chart. Use
`query-web-vitals` for the per-page view rather than hand-rolled SQL, so the insights stay
editable in the UI.

### 4. Alerts

Checked weekly rather than instantly — this is a trend, not an incident:

- LCP p75 above 4,000ms
- CLS p75 above 0.25
- INP p75 above 200ms

`integrations-list` on this project returns **zero** integrations, so the HogFunction alert path
is unavailable and these have to be insight-threshold alerts delivered by email — the same
pattern ticket 02 used for `$error_tracking_issue_created`. See 02's `## Comments`.

## Acceptance

- `capture_dead_clicks` is on and `$dead_click` events are arriving.
- The dashboard reproduces the p75 table above for the trailing 90 days.
- `/products` and `/` have separate LCP and CLS lines.
- An alert fires against the current data, since every threshold is already breached — if it
  does not, the alert is misconfigured.
- Replay masks email inputs, and the "Rage-clicks" playlist exists.

## Not in this ticket

The two-week dead-click breakdown, and the bookmark-on-touch hypothesis it settles, are ticket
11. This ticket cannot close them — the data does not exist yet — and a ticket that stays open
waiting on a calendar is what kept ticket 02 out of `resolved`.

## Notes

This is the measurement half of the performance work. The fixes live in the UI/UX effort: lazy
posters, 48 + load more, reserved space for late-arriving text. This ticket exists so those
changes can be proved rather than claimed. Re-check after the UI/UX work ships — dead clicks
going to near-zero is a clean, objective way to prove the keyboard and touch fixes worked.

## Depends on

Ticket 01, so the dashboard is not counting crawlers.
