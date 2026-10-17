# Does the popup fight the PostHog prompts that are already live?

Status: resolved
Type: grilling
Blocked by: 03, 05

## Question

Ticket 03 ordered the Save gate above this popup and said the popup dies for the visit when it
loses. It did not rank the two prompts PostHog already puts on `rnui.dev`, because at the time
neither was in the same frame as a centered modal. Now they are. The sharp question:

1. **The "Try the Preview" popover** — survey `01a00821-b97e-0000-22ae-8da5e1689800`, project
   117415, live since 2026-08-16. Bottom-right popover, dismissible, deliberately **not** a modal,
   `schedule: once`, 20s dwell, `$pageview`-triggered so never on a first pageview. It draws in a
   PostHog shadow root at its own z-index, and our scrim is `z-[70]`. Decide: does the popup yield
   to it, suppress it, or do nothing and accept a dismissible popover sitting under a scrim? Ticket
   03's rule ("the popup loses, always") argues for yielding, but that rule was written about a
   modal competing with a modal, not with a corner element.
2. **The exit survey** — `019fbc46-c7ec-0000-5875-da30034b95d1`, and the constraint is the one that
   matters: **any shown PostHog survey sets `$last_seen_survey_date`**, which suppresses it for 30
   days via `seenSurveyWaitPeriodInDaysInDays`. Confirm the subscribe popup does not touch that —
   it is our code, not a PostHog survey, so it should not — and decide whether the popup should
   *know* about the interaction at all.
3. **`components/preview-survey.tsx` is mounted in `app/layout.tsx`**, so it ships in the production
   bundle and is silenced by a host check (`preview.rnui.dev` only), not by a build flag. Confirm
   nothing about this feature disturbs that silencing.

Carry-over from `notify-and-preview` ticket 13, which is the closed record of both prompts — read it
rather than re-deriving the survey ids or the token split. Its accepted side effect still stands:
the maintainer chose to leave the exit survey running knowing that any shown survey suppresses it
for 30 days.

Not in question: whether either PostHog survey should stop. That is notify-and-preview's surface,
not this map's, and this map never modifies them — it only has to coexist.

## Answer

**Two of the three premises are spent, and the third is answered: the popup does nothing. It
does not yield, does not suppress, and does not know the PostHog prompts exist.** All three
facts below were re-verified on 2026-10-17 rather than carried forward, and two of them had
moved since this ticket was written.

### 1. The "Try the Preview" popover — the question no longer exists

Read back through the PostHog API today: survey `01a00821-b97e-0000-22ae-8da5e1689800`
carries `end_date: 2026-10-02` and its internal targeting flag `823688` is `active: false`.
It was stopped by two-designs ticket 05 the day the current Design shipped, for the reason
recorded in its own `description`: the redesign it advertised became the site, so its copy
was false on the host showing it. Nothing renders, so there is nothing to yield to, suppress,
or accept. The yield/suppress/do-nothing frame this ticket posed was written while it was
live; the maintainer's stop decision, taken on another map, retired the frame before this
ticket answered it. Its description says relaunch is one `survey-launch` away, so if a corner
prompt is ever revived, the standing rule is the one ratified for the exit survey below.

### 2. The exit survey — live, and the popup never touches it

Still live, and retargeted the same day the popover died: `conditions.url` is now
`regex ^https://(www\.)?rnui\.dev/products` (two-designs ticket 06), 45s dwell, `$pageview`
with `repeatedActivation: false`, `schedule: once`, `seenSurveyWaitPeriodInDays: 30`. So the
only surface where anything PostHog can still appear is `/products` — one of the popup's two
routes — and never on a first pageview.

**The suppression property is confirmed untouched, by the code, not by inference.** Nothing
under `lib/`, `components/` or `app/` names `$last_seen_survey_date` or any `$survey_*`
property; posthog-js sets that person property only when it renders a PostHog survey, and the
popup is our React, not a survey. Its entire analytics footprint is one event,
`newsletter_submitted` with `{route}` (`lib/analytics.ts:244`), fired on submit. The 30-day
wait is the surveys' own bookkeeping and the popup contributes nothing to it.

**The overlap decision, ratified by the maintainer 2026-10-17: do nothing.** The live facts
put to him: the survey renders at `--ph-survey-z-index`, default `2147483645` in
`posthog-js/dist/surveys.js` — far above the scrim's `z-[70]`, so a completed 45s dwell during
an open modal draws a bright corner popover over the dimmed backdrop. The collision requires a
visitor to sit on the open modal past the dwell mark — forty-plus seconds without acting on
it — the survey's own record is 14 shown and 0 completed, and any shown survey suppresses it
for 30 days, so its true frequency is lower still. Both elements are dismissible and the
moment resolves itself when either closes. The rejected alternative was having the popup check
for a PostHog popover and die for the visit, which couples our trigger to an undocumented
shadow-root DOM that posthog-js can change without notice; retargeting the survey was out of
bounds, since this map never modifies their surface. Ticket 03's "the popup loses, always" was
written for modal against modal, where only one can be interacted with; a corner popover does
not block the modal's interaction, so the rule does not extend to it.

### 3. `components/preview-survey.tsx` — the premise is stale

There is nothing left to silence. The component was deleted in `47db41f` ("feat(two-designs):
delete the Preview survey", 2026-10-02) along with `lib/preview-survey.ts`, and
`app/layout.tsx` mounts no survey component — the imports there are header, footer, shell,
`SaveGateModal`, toaster and providers. The host-check silencing this ticket asked not to
disturb guarded a file that no longer exists, deleted because its first question
("Compared to the old rnui.dev, this is…") became unanswerable the day both Designs were live
at real hostnames. The popup's build cannot disturb it.

### What the build takes from this

One rule, not three: **the popup ships with no awareness of PostHog's prompt machinery** — no
shadow-root detection, no suppression-property reads, no special casing per route. The only
coexistence fact a builder needs is the z-order one: if the exit survey's popover ever appears
over the scrim, that is the accepted behaviour, not a defect to fix.