# 04 — Field performance, dead clicks and replay configuration

Status: ready-for-human
Blocked by: 01

Absorbs the whole of former ticket 06 (dead-click capture) and steps 3 and 4 of ticket 05
(replay configuration). All three were the same unit of work — one PostHog configuration pass,
no application code beyond a single `posthog.init` line — and splitting them across three files
only guaranteed three sessions doing one session's work. Ticket 05 keeps the half that needs a
person watching recordings.

~~**Do this before ticket 03, even though 03 is the lower number.** Two of the switches below
start a clock: dead clicks and the replay triggers produce nothing until visitors trigger them,
and the readout in ticket 11 is two weeks after they go on. Ticket 03 is a day's work that
delays that clock by a day for no reason. The frontier rule in `CLAUDE.md` picks the lowest
available number and will offer 03 first — take this one instead, and say why in the commit.~~

**Done — 2026-08-01. This ticket was taken before 03, as instructed.** The directive is struck
through rather than deleted so the commit that acted on it still reads against something. 03 is
the frontier now; nothing here reorders it.

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
- ~~Add `$rageclick` to `session_recording_event_trigger_config` so those sessions are certain
  to be captured.~~ **Not done, deliberately — this instruction is wrong.** Event triggers
  *restrict* which sessions record rather than adding to them, so setting this would have cut
  capture from 100% to rage-click-only, contradicting the bullet below it. The goal is already
  met without it. Full reasoning under `## Comments`.
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

## Comments

Agent pass 2026-08-01 against project 117415. Taken before ticket 03, as the top of this file
instructs — the dead-click and replay switches start a clock that ticket 11 reads two weeks
later, and 03 is a day's work that would have delayed it for nothing.

**Not `resolved`.** Two acceptance bullets need the code deployed, which an agent cannot do.
Left `ready-for-human` per checkpoint 3 in `spec.md`; see "Left for the maintainer".

### Step 1 — dead clicks

`capture_dead_clicks: true` added to `posthog.init` (`lib/posthog-provider.tsx`), not to
project settings, as the ticket specifies. The project toggle stays `false`.

That is not merely a stylistic preference here — it is load-bearing. In
`posthog-js@1.409.0`, `isDeadClicksEnabledForAutocapture`
(`src/extensions/dead-clicks-autocapture.ts`) reads:

```ts
const isRemoteEnabled = !!instance.instance.persistence?.get_property(DEAD_CLICKS_ENABLED_SERVER_SIDE)
const clientConfig = instance.instance.config.capture_dead_clicks
if (isBoolean(clientConfig)) { return clientConfig }   // client boolean wins outright
...
return isRemoteEnabled                                  // remote config is only the fallback
```

So a client-side boolean short-circuits the remote value entirely: capture starts before
remote config arrives, and flipping the PostHog UI toggle cannot switch it off. Same property
`capture_exceptions` has in ticket 02.

### Step 2 — replay configuration

| | Before | After | Where |
|---|---|---|---|
| `maskAllInputs` | recorder default | `true`, explicit | `posthog.init` |
| `session_recording_minimum_duration_milliseconds` | `null` | `1000` | project 117415 |
| `session_recording_sample_rate` | `null` (100%) | unchanged | project 117415 |
| `session_recording_masking_config` | `null` | unchanged, deliberately | project 117415 |
| `session_recording_event_trigger_config` | `[]` | **unchanged — see below** | project 117415 |

Masking is set in code and *not* in the project's "Privacy and masking" settings, because
setting both would be redundant and could drift. `lazy-loaded-session-recorder.ts` resolves it
as `masking_client_side?.maskAllInputs ?? masking_server_side?.maskAllInputs` — the client wins
— and posthog-js logs a warning when the two are configured and differ. One place, in code.

`maskAllInputs: true` is already the recorder's default, so this line changes no behaviour.
**Email inputs are therefore masked in production today, and were before this commit** — the
line pins that guarantee rather than creating it. It is written out because it is the only
thing keeping the newsletter and contact form addresses out of the recordings, and that should
be readable at the call site rather than be a default someone has to confirm in `node_modules`.

A consequence worth being precise about: the acceptance bullet "replay masks email inputs" is
**already satisfied and is not deploy-gated**. Only `$dead_click` genuinely waits on a deploy.

`1000ms` for the minimum duration: it drops sub-second crawler hits, and a visitor who leaves
inside one second against a 4.2s LCP saw a blank page — there is no replay worth storing. Any
session containing a click, which is every dead-click and rage-click session, is far longer.

### The `$rageclick` trigger was not set, on purpose

The ticket asks to "add `$rageclick` to `session_recording_event_trigger_config` so those
sessions are certain to be captured". **Doing that would have had the opposite effect**, so it
was left alone.

Event triggers in PostHog *restrict* which sessions record; they do not add to them. In
`src/extensions/replay/external/triggerMatching.ts`, `anyMatchSessionRecordingStatus` returns
`BUFFERING` — not `ACTIVE` — whenever a trigger is configured and has not yet matched, and a
buffered session that never activates is discarded rather than uploaded. PostHog's own docs
file event triggers under "How to control which sessions you record", alongside sampling.

So setting it would have turned 100% capture into rage-click-only capture, contradicting this
same ticket's "Keep the 100% sample rate. Volume is low enough that sampling would only lose
signal."

The bullet's stated goal is already met without it: at 100% sampling with no triggers, every
session is recorded, including every session containing a rage-click. The trigger would have
added nothing and removed everything else. Nothing to do here — flagging it only so the next
reader does not "fix" the omission.

### Step 3 — the dashboard

**"Web performance — field"**, dashboard `1937530`. Thirteen tiles, all `$web_vitals`, all p75,
all `filterTestAccounts: true`, all 90-day.

**`query-web-vitals` was not used; `query-trends` was.** Saying so plainly, because the ticket
does name the tool: "Use `query-web-vitals` for the per-page view rather than hand-rolled SQL,
so the insights stay editable in the UI." `query-web-vitals` is a web-analytics tile that
buckets each metric into good / needs-improvement / poor bands; it does not emit a p75 series,
and the rest of this ticket is specified in p75. `query-trends` with `p75` math on
`$web_vitals_*_value` gives the p75 the ticket asks for as a native trends insight — no SQL,
fully editable in the UI, which is what the instruction was protecting. The stated reason is
honoured, the named tool is not. If the band breakdown is wanted as well, that is a tile to
add, not a change to these.

| Tile | Short ID |
|---|---|
| Core Web Vitals p75 by device — trailing 90 days | `XSw7xeJB` |
| LCP / INP / CLS / FCP p75 by device (weekly) | `ebkjI5NY` `yo3yUBgO` `FWQuo5NJ` `KEr2cp5f` |
| LCP / CLS / INP / FCP p75 by page (weekly) | `X8ca1V2e` `JSgDxMmT` `SZp43DEN` `FLXuy5k0` |
| Web vitals samples per day | `HijKaE50` |
| LCP / INP p75 monthly and CLS p75 weekly, per device (alert sources) | `pBp25nzv` `LleLoEcq` `FtHY6Gh9` |

`XSw7xeJB` reproduces the baseline table, and it does so almost exactly despite now excluding
crawlers and internal traffic:

| Device | LCP | INP | CLS | FCP | Samples |
|---|---|---|---|---|---|
| Desktop | 4,212 (was 4,212) | 96 (96) | 0.553 (0.549) | 3,502 (3,502) | 1,780 (1,792) |
| Mobile | 4,523 (4,515) | 286 (286) | 0.007 (0.025) | 5,889 (5,904) | 331 (330) |
| Tablet | 4,861 (4,861) | 86 (86) | 0.612 (0.612) | 3,462 (3,462) | 13 (13) |

The near-identity is itself a result: **ticket 01's crawler filter barely touches web vitals**,
because crawlers do not stay long enough to emit them. Every person-based number on the
dashboard was inflated by ~70%; these were not.

`/` and `/products` separate cleanly, and the split contradicts the assumption behind the
ticket. **The home page is the slow one, not the catalogue** — latest complete week, LCP p75
`/` 3,928ms against `/products` 3,438ms, and `/` is worse in ten of thirteen weeks. Worth
knowing before the performance fixes are aimed.

### Step 4 — four alerts, and why they are per-device

| Alert | Series watched | Bucket | Threshold | Value | State |
|---|---|---|---|---|---|
| `019fbafb-868c-…` INP p75 (mobile) | Mobile | month | > 200ms | **234** | Firing |
| `019fbafb-5b33-…` CLS p75 (desktop) | Desktop | week | > 0.25 | **0.548** | Firing |
| `019fbafb-57ac-…` LCP p75 (mobile) | Mobile | month | > 4,000ms | **4,077.75** | Firing |
| `019fbb04-1e19-…` LCP p75 (desktop) | Desktop | month | > 4,000ms | **3,767** | Not firing |

The first three fired on their first check and emailed mrpmohiburrahman@gmail.com — observed in
`alerts-list`, not inferred from the arithmetic. That is the acceptance bullet met.

One caveat on that table, so it is not read as more than it is: the CLS alert's recorded check
(0.548) ran *before* its source insight was switched from monthly to weekly buckets, so 0.548
is the July figure. Its next check reads the weekly series, whose last completed week is
**0.514**. Every one of the twelve completed weeks in the window sits between 0.496 and 0.600,
so the alert stays Firing — verified by reading the series, not assumed, but the check itself
happens on 3 August.

Email, not Slack — `integrations-list` still returns zero integrations, exactly as ticket 02
found, and checkpoint 2 in `spec.md` puts any outbound channel in the maintainer's hands.
All four are `calculation_interval: weekly`, matching "this is a trend, not an incident".

**They watch one device each, not the site-wide blend.** The ticket's thresholds come from its
own per-device table, but a site-wide p75 is dominated by desktop, which is 84% of samples.
Blended monthly INP p75 is **96ms** and would never cross 200 — while mobile sits at 234–288ms,
in the poor band every single month. A site-wide INP alert would have been permanently silent
about a real problem. So each alert watches a specific device.

**Four alerts, not three.** The ticket lists three *thresholds*, which is not the same as three
alerts. Coverage is by `(metric, device)` pair, and the pairs worth watching are the ones at or
near their threshold:

| Pair | Latest | Threshold | Alert? |
|---|---|---|---|
| LCP mobile | 4,078 | 4,000 | yes |
| LCP desktop | 3,767 | 4,000 | yes — borderline, and 84% of traffic |
| CLS desktop | 0.548 | 0.25 | yes |
| INP mobile | 234 | 200 | yes |
| INP desktop | 96 | 200 | no — clear by 2× |
| CLS mobile | 0.007 | 0.25 | no — see below |

Mobile CLS needs a word, because 0.007 undersells it. Most mobile samples report a CLS of
exactly 0, which drags the 90-day p75 to 0.007, but individual weeks do spike (0.336, 0.617,
0.445) on a handful of samples. The aggregate the ticket states its thresholds in is clear, so
no alert; if mobile traffic grows enough for those weeks to stop being noise, this is the pair
to add next.

The desktop LCP alert is correctly **Not firing**: desktop LCP was 4,344 in May and 4,476 in
June, then **3,767 in July — back under Google's poor threshold for the first time in the
window**. The 4,212 in the baseline table is the 90-day figure and is carried by the two worse
months. That is a real, previously unnoticed improvement, and the alert now guards it.

**Bucket width differs on purpose.** An alert reads the last *completed* bucket, so a monthly
bucket means a regression can hide for up to 31 days. That is too long for desktop, which has
~140 samples a week — plenty for a stable p75 — so **CLS (desktop) buckets weekly**, cutting
its detection lag to under 7 days. Mobile has ~25 samples a week, where a p75 swings
2,999–6,398ms with nothing changing on the site, so the mobile alerts stay monthly and accept
the lag rather than emit noise. Desktop LCP stays monthly to share the mobile LCP tile; its
weekly series is steady enough to move later if the lag proves to matter.

`check_ongoing_interval` needed setting to `false` explicitly — the API defaults it to `true`,
which would have evaluated the in-progress bucket. Today is 1 August; that month holds zero
samples, so every alert would have silently compared against `0` and never fired. Caught by
re-reading the created alert rather than trusting the request.

### The deploy-date marker

`showAnnotations: true` is set on every chart, so the redesign boundary appears the moment the
annotation exists. **It does not exist yet** — the redesign has not deployed, so there is no
date to mark. Creating the annotation is ticket 09 step 3, on deploy day. A marker cannot be
placed on a date that has not happened, and guessing one would be worse than leaving it.

### A duplicate playlist to be aware of

"Rage-clicks" (`aEGpGdxI`) — sessions containing `$rageclick`, 90 days, test accounts excluded.
Built for ticket 05.

PostHog seeded this project with a stock playlist "Recordings with Rage Clicks" (`SezPvgHU`,
id 84676) that looks like the same thing and is not: 3-day window, `filter_test_accounts:
false`, and an `active_seconds > 5` filter. It would show a handful of recent sessions
including crawlers, not the 90 days ticket 05 needs. Left in place — deleting a seeded default
is the maintainer's call — but whoever does ticket 05 should open `aEGpGdxI`, not `SezPvgHU`.

### Checks

`pnpm check-types` clean. `pnpm test` 170 passed across 6 files. `pnpm lint` 0 errors (8
pre-existing warnings, none in touched files). `pnpm format:check` fails on 33 files across the
repo — pre-existing and untouched here; `lib/posthog-provider.tsx` itself passes Prettier.

No test was added. The change is two declarative config keys in an SDK init call with no
branch, loop or derived value — there is no logic for a test to hold. What could break it is a
posthog-js upgrade changing the option names, and `pnpm check-types` already catches that,
since both keys are typed on `PostHogConfig` in `@posthog/types`.

### Left for the maintainer

**One** acceptance bullet is deploy-gated and cannot be checked from here:

1. **`$dead_click` events are arriving.** The flag is in code and unreleased. Deploy, then
   confirm `$dead_click` appears in the activity feed. Until then the count is necessarily
   zero, and ticket 11's two-week clock starts at that deploy, not at this commit.

The other four are met: the dashboard reproduces the p75 table, `/` and `/products` have
separate LCP and CLS lines, three alerts are Firing, the "Rage-clicks" playlist exists, and
email inputs are masked (already, by the recorder default this commit pins — see step 2).
Watching a real recording to see the masking is ticket 05 step 2, which is a person's job, not
a gate on this ticket.
