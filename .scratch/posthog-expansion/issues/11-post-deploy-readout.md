# 11 — Post-deploy readout

Status: needs-triage
Blocked by: 02, 04

**Read that `Blocked by` line as "after 02 and 04 have deployed", not by the literal tracker
rule.** `docs/agents/issue-tracker.md` says a ticket is unblocked when every file it lists is
`resolved`; 02 and 04 are both `ready-for-human` and will stay that way until someone deploys
and checks their last acceptance bullet, so the literal rule would keep this ticket blocked for
ever. That is an artefact of tickets whose tail is a calendar entry — the exact thing this file
exists to absorb. The triage action below is still a date check, done by a person.

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

First of those three is now met: both are on Vercel as of 2026-08-05, Production-scoped (see
ticket 02's "Left for the maintainer"). The clock still has not started — no build has shipped
carrying them, because deploy A has not happened. Count the week from that deploy, not from
the credentials landing.

### 2. Dead clicks — two weeks after ticket 04 lands

**The clock starts at the deploy, not at ticket 04's commit.** `capture_dead_clicks` went into
`posthog.init` on 2026-08-01, but no visitor runs that code until it ships. Count two weeks
from the first production deploy carrying it; before that, `$dead_click` is necessarily zero
and a zero is not a finding.

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

## Comments

### 2026-08-01 — Two facts this ticket will need, found while auditing the effort

Nothing on this ticket is startable — every reading is keyed to deploy A, which has not happened.
Two things were established that its readings depend on, recorded here so they are not
rediscovered under time pressure.

**Production runs posthog-js 1.203.1, not the `^1.409.0` in `package.json`.** All 1,902
production events (host `www.rnui.dev`) come from 1.203.1. The caret range is what the *next*
deploy will install; it is not what is serving today. Any reading that assumes a 1.409 feature is
live before deploy A is wrong.

**Reading 1 now owns ticket 02's step 4** — setting `autocapture_exceptions_errors_to_ignore`
once a week of `$exception` data exists. Ticket 02's Comments have been corrected to stop
claiming it has to stay open for that.

**Reading 3's clock is still conditional and should be dated when it starts.** Ticket 07's survey
now exists as an unlaunched draft (`019fbc46-c7ec-0000-5875-da30034b95d1`); the month begins when
somebody launches it, not when it was created.

Stays `needs-triage`.
