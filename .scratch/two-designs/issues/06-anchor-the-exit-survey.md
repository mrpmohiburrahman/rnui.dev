# 06 — Anchor survey `019fbc46` away from the Archive

Status: ready-for-agent
Blocked by: 04

## Problem

Survey `019fbc46-c7ec-0000-5875-da30034b95d1`, "Didn't find what you were looking for?", is
**live**, fires on `/products` with `icontains` after 45 seconds of dwell, `schedule: once`,
`seenSurveyWaitPeriodInDays: 30`. `/products` is served by **both** hosts, and `icontains`
matches both. With both hosts on the same project key, the Archive would put a popover in
front of visitors looking at a frozen catalogue — asking them what they were searching for
on a site whose search results are stale by definition.

## Work

1. Read the survey's current `conditions.url`. It is `icontains` on `/products`.
2. Replace it with a condition that matches the live host and not the Archive. PostHog URL
   conditions support `regex` — anchor on the host rather than the path, e.g. a regex
   containing `www\.rnui\.dev` and `/products`. **Verify the anchored form still matches
   `www.rnui.dev/products` with a query string and a hash**, and does not match
   `old.rnui.dev/products`, before saving.
3. Confirm through `/decide/` that the survey is still returned for the live host.
4. Record its status: **14 shown, 0 completed in 9 days** (`notify-and-preview` 13). The
   30-day wait also suppresses it for anyone shown "Try the Preview", so its real volume is
   lower than that. Fixing ticket 05 makes it fire again — expect that, and say so here.

## Acceptance

- `/decide/` returns the survey for `https://www.rnui.dev/products`.
- The condition does not match `https://old.rnui.dev/products`.
- The `$pageview` `repeatedActivation: false` trigger and the 45-second delay are unchanged
  — this ticket changes the URL, not the survey.
