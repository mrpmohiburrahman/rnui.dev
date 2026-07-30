# 04 — Core Web Vitals dashboard and alerts

Status: ready-for-agent

## Problem

`$web_vitals` has been capturing for 90 days (2,135 events) and nothing reads it. The data
says every device is in Google's "poor" band for LCP:

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

## Work

1. Create a dashboard "Web performance — field" with, all p75 and all test-accounts-filtered:
   - LCP, INP, CLS, FCP over time, broken down by `$device_type`
   - The same four broken down by `$pathname`, so `/products` and `/` are separable
   - Sample count per day, so a quiet day is not mistaken for an improvement
2. Add a marker for the redesign deploy date so before/after is readable on one chart.
3. Alerts, checked weekly rather than instantly — this is a trend, not an incident:
   - LCP p75 above 4,000ms
   - CLS p75 above 0.25
   - INP p75 above 200ms
4. Use `query-web-vitals` for the per-page view rather than hand-rolled SQL, so the insights
   stay editable in the UI.

## Acceptance

- The dashboard reproduces the p75 table above for the trailing 90 days.
- `/products` and `/` have separate LCP and CLS lines.
- An alert fires against the current data, since every threshold is already breached — if it
  does not, the alert is misconfigured.

## Notes

This is the measurement half of the performance work. The fixes live in the UI/UX effort:
lazy posters, 48 + load more, reserved space for late-arriving text. This ticket exists so
those changes can be proved rather than claimed.

## Depends on

Ticket 01.
