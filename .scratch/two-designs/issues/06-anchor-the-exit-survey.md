# 06 — Anchor survey `019fbc46` away from the Archive

Status: resolved
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

## Comments

**2026-10-21 — taken against the already-anchored survey, and finished.** The file still said
`ready-for-agent` after commit `b5ae1dd` closed the effort; PostHog already held the change.
No second `survey-update` was needed.

- **Condition re-read.** `conditions.url` is `^https://(www\.)?rnui\.dev/products` with
  `urlMatchType: regex`. `events` is still `$pageview` with `repeatedActivation: false`;
  `surveyPopupDelaySeconds` is still 45; `seenSurveyWaitPeriodInDays` is still 30. Only the URL
  moved — Acceptance bullet 3 holds.
- **Eight-URL regex check re-run** (Python `re.search` against the stored pattern — equivalent
  for this unanchored-end pattern to the client's `RegExp.test`, not the same engine):
  match — `www.rnui.dev/products`, with `?category=buttons`, with `#hash`, and apex
  `rnui.dev/products` (307 → www); no match — `old.rnui.dev/products`, with `?x=1`, the
  Archive's `vercel.app` host, `preview.rnui.dev/products`, and `www.rnui.dev/contributors`.
- **`/decide/` re-verified.** `POST /decide/?v=3` against project 117415's public token
  returns `019fbc46` when `current_url` is `https://www.rnui.dev/products`. That bullet can
  only fail if the survey is stopped or the project key is wrong — decide returns the payload
  for every URL and does **not** evaluate `conditions.url`. The client does. So decide proves
  the survey is live for the live host (Acceptance 1); the stored regex plus the `$host`
  split below prove the Archive is excluded (Acceptance 2).
- **Behavioural proof that the Archive never sees it.** `survey shown` since the cut
  (2026-10-02 → 2026-10-21), broken down on `$host`: **93 from `www.rnui.dev`, 0 from
  `old.rnui.dev`**. The client-side URL filter is what enforces the anchor, and it is working.
- **Work step 4 status, updated.** The ticket recorded **14 shown, 0 completed in 9 days** from
  `notify-and-preview` 13. Lifetime now (survey-stats, 2026-10-21): **113 shown, 63 dismissed,
  0 sent** (response rate 0%, dismissal rate 55.75%), last shown `2026-10-20T21:03:43Z`. The
  14 figure is stale and is left above only as the number this ticket was written against.
  Ticket 05 (`01a00821` stopped) did free the 30-day `$last_seen_survey_date` wait for anyone
  who had been shown the Preview prompt, so volume after 2026-10-02 is higher than the old
  reading — expect that; it was already called for here.
