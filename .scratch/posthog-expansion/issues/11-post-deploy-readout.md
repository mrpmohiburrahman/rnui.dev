# 11 — Post-deploy readout

Status: needs-triage
Blocked by: 02, 04

New on 2026-08-01. Every other ticket in this effort had a tail: do the thing now, come back in
one to four weeks and read what it collected. Those tails are the reason ticket 02 could not go
to `resolved` — the work was done, one step was a calendar entry, and the tracker has no way to
say "finished, but check back". Four of them are gathered here so their parent tickets can
close on the work they actually did.

**This is `needs-triage` on purpose.** It is fully specified; it is just not due yet. The triage
action is a date check: when the earliest reading below is ripe, set `Status: ready-for-agent`.
Do not convert it early — reading two days of dead clicks and calling it a breakdown is worse
than not reading it, because it looks like an answer.

## Readings

### 1. Exception noise — one week after ticket 02 deploys

From ticket 02, step 4: set `autocapture_exceptions_errors_to_ignore` for known third-party
noise. It is `null` today and must stay that way until there is data — ticket 02 is explicit
that it must not be pre-populated with guesses.

Ripe once `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are on Vercel, a build has shipped with
them, and a week of `$exception` events exists. Ticket 02's own acceptance is the gate.

### 2. Dead clicks — two weeks after ticket 04 lands

From former ticket 06, steps 2 and 3, now ticket 04's `## Not in this ticket`:

- Break `$dead_click` down by `$el_text`, `$current_url` and `$device_type`. Record the top ten
  under `## Comments` here.
- Settle the bookmark-on-touch hypothesis explicitly: the bookmark control is
  `pointer-events-none` until hover (`components/entry-card.tsx:149-154`), so a finger tapping
  it on a phone should produce a dead click. Confirmed by the data, or ruled out — not left
  open.
- Feed the list into the UI/UX effort as evidence, not as a fix here.

### 3. Survey themes — one month after ticket 07 ships, if it ships

From ticket 07, step 4. Summarise the first month's themes. If a component keeps being asked
for and does not exist, that is a contribution request, not a UI problem — route it to the repo.

Skip this reading entirely if ticket 07 is declined; its own `## Open question for the
maintainer` allows that.

### 4. Flag comparison — only if ticket 08 survives triage

From ticket 08, steps 4 and 5. Skip if 08 closes as `wontfix`, which is its own recommendation.

## Acceptance

Each reading above is either written into this file with its date, or explicitly marked skipped
with the reason. No reading is left silently undone.

## Notes

If this pattern recurs in a future effort, the cheaper fix is at the source: write the
collect-the-data half and the read-the-data half as separate tickets from the start, rather
than as step 4 of a ticket whose steps 1 to 3 finish in an afternoon.
