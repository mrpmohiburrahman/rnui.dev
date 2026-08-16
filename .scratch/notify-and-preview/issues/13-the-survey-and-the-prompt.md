# The survey, and the prompt that gets people to it

Status: resolved
Type: task
Blocked by: 12

## Question

Two pieces. A prompt on `rnui.dev` inviting visitors to try the Preview, and the survey itself
firing on the Preview once they have actually looked at it.

**It is a defect detector, not a referendum.** Decision 6, and it is arithmetic rather than
preference: at 94 visitors per week, a survey shown to *everyone* returns 2–5 responses per week at
industry rates. Fifteen to forty responses over the whole window cannot settle "which design is
better", and nothing about how the survey is built will change that. What fifteen people *can* do
is tell you the search is unfindable. Build for that.

Decision 7 fixes the questions:

1. *"Compared to the old rnui.dev, this is…"* → Better / About the same / Worse
2. *"What's the one thing you'd change?"* → open text

Question 2 carries all the value. Question 1 costs one click and gives a crude trend.

Worth knowing before building: the existing exit survey has been **shown 14 times and completed 0
times in 9 days**. That is too small to conclude the format fails, but it is a warning that
whatever is built here needs to be cheaper to answer than that one is — and a reason to check its
trigger and its dismissal rate rather than copying them.

## Acceptance

- Both questions live on the Preview, exactly as decision 7 words them.
- Fires **after** the visitor has scrolled or opened a Recording — not on arrival. Someone who has
  seen nothing has no opinion worth collecting.
- Shown once per person; a dismissal is remembered.
- Optionally: the "what's worse?" follow-up shown only to those answering *Worse*. Nothing beyond
  that — a third unconditional question collapses completion.
- A prompt on `rnui.dev` linking to the Preview, dismissible, not a modal.
- Survey responses land in the **Preview's** PostHog project, per ticket 12.
- Honours `prefers-reduced-motion`, consistent with what `ui-ux-overhaul` already ships.

## Comments

**2026-08-16 — both halves built. The prompt is live on `rnui.dev`; the survey is committed and
goes up with the branch build.** Status stays `claimed` until that build is measured.

### The prompt on `rnui.dev` is not code, and could not have been

Production runs `main` — deploy A, `3d479be`. This work is on `feat/studio-dark`, and merging that
branch **is deploy B**, which `studio-dark` checkpoint 5 gates. So a React component written here
cannot reach `rnui.dev` without shipping deploy B past its own gate. That is not a reason to be
clever; it is the reason the prompt is a PostHog survey, which needs no deploy at all — the thing
ticket 07 already established and verified on this project.

Survey `01a00821-b97e-0000-22ae-8da5e1689800`, **"Try the Preview"**, in project 117415. One
`link` question, which is PostHog's CTA type rather than a question: a popover bottom-right with a
button and an ✕, so it is dismissible and is not a modal. `schedule: once` plus the auto-created
internal targeting flag cap it at one per person. `conditions.url` is `icontains rnui.dev`, which
matches every route on the apex and on `www` and matches no localhost; `$pageview` with
`repeatedActivation: false`, so never on a first pageview; 20 seconds of dwell.

> There's a redesign of rnui.dev to look at
> Same catalogue, redrawn, at preview.rnui.dev. Two questions there if you have an opinion about it.
> **[ Open the Preview ]** → `https://preview.rnui.dev`

**Launching it took two switches, not one, and the second is a trap worth recording.**
`survey-launch` set `start_date`, and the survey appeared in `POST /decide/?v=3` against the
production token immediately. It would still have rendered to nobody. Its internal targeting flag
`823688` (`survey-targeting-1eb4100998-custom`) was **created `active: false`**, and the same
`/decide/` response that carried the survey withheld that key from `featureFlags` — posthog-js
gates a survey on its own `internal_targeting_flag_key`, so every browser was being handed a
survey it would then decline to draw. From the survey API alone that state is indistinguishable
from a working one: `start_date` is set either way. `update-feature-flag {"id": 823688, "active":
true}` fixed it, and `/decide/` now returns **both** flags `true` and both surveys. Ticket 07's
launch never hit this — that survey's flag was already active — so "one switch, no deploy" was
true there and is not the general rule.

The maintainer approved putting this in front of live visitors, explicitly, on 2026-08-16. It is
reversible in one call: `survey-stop` on that id.

**An accepted side effect, put to them rather than absorbed.** The exit survey
`019fbc46-c7ec-0000-5875-da30034b95d1` carries `seenSurveyWaitPeriodInDays: 30`, and *any* shown
survey sets `$last_seen_survey_date`. So anyone shown this prompt will not be shown the exit survey
for 30 days. Offered the choice of stopping the exit survey, the maintainer chose to leave it
running: it is 14 shown and 0 completed in 9 days, so the suppressed reading is one that was not
arriving. Recorded here because it is a real cost to `posthog-expansion` ticket 11's reading 3, not
a technicality.

The prompt cannot leak onto the Preview even though `icontains rnui.dev` matches
`preview.rnui.dev`: the Preview compiles `phc_oFZi…` (project 559028) and this survey lives in
117415. Ticket 12 measured that token split in the two builds' chunks, so this is inherited
evidence rather than a fresh assumption.

### The survey on the Preview is code, and three acceptance bullets are why

A hosted PostHog survey was the obvious first rung and it does not reach:

- **The trigger is "scrolled _or_ opened a Recording".** Survey conditions take events, not scroll.
  Arming on scroll through PostHog would have meant emitting a fifteenth custom event whose only
  purpose is to trigger a survey — `recording_opened` alone would have narrowed the pool to
  Recording-openers, which at this traffic is most of the fifteen answers gone.
- **Decision 7's question 1 has to cost one click.** That is the whole answer to 14-shown-0-completed.
  A hosted popover puts its first question in a box you type into; this one puts three buttons on
  screen and asks for the sentence second.
- **`prefers-reduced-motion`.** PostHog renders surveys into a shadow root, which
  `app/globals.css`'s reduced-motion rule cannot reach.

`lib/preview-survey.ts` holds the copy, the stored key and `shouldShowPreviewSurvey`, which is the
whole decision as one pure boolean and is what `tests/preview-survey.test.ts` pins.
`components/preview-survey.tsx` is the wiring and the panel, mounted once in `app/layout.tsx`.

- **Host.** `preview.rnui.dev` only, plus `localhost` under `next dev` so the panel can be looked
  at before it is in front of anyone. Deliberately **not** the `rnui-dev-git-….vercel.app` alias
  that the noindex rule covers: a crawler can find that host, which is a different problem from an
  answer arriving from a hostname no visitor was sent to. This is also what silences the component
  after deploy B, when it ships to `rnui.dev` with the rest of the branch and `preview.rnui.dev`
  301s away — deleting it is still ticket 12's tidy-up, but forgetting to does not put "compared to
  the old rnui.dev" in front of anyone.
- **Trigger.** `window.scrollY > 600`, or a pathname of `/recording/…` — which reads true both for
  a real navigation and for the overlay the catalogue pushes with the History API. Opening a
  Recording **arms** the panel and the close **reveals** it, so it never lands on top of the thing
  the visitor just asked to see.
- **Once per person.** `previewSurveyShown` writes `"previewSurveyShown"` to localStorage the
  moment the panel reaches the screen, and the key is read once per page load and cached, so
  writing it cannot take the panel away mid-question. None of the three frozen browser keys is
  touched, and a test asserts that.
- **Three events**, all landing in 559028 because the Preview build compiles that token:
  `preview_survey_shown`, `preview_survey_verdict` (fired on the click, so a visitor who answers
  question 1 and closes the tab is not lost), and `preview_survey_note`.
- **Reduced motion.** One 240ms entrance on the Specimen's overlay curve, zeroed by the
  `animation-duration: 0s !important` rule `app/globals.css:293` already ships. Verified by reading
  the rule out of the live stylesheet rather than by assuming it applies: `*, ::before, ::after`,
  priority `important`, which beats the arbitrary-property class the panel carries.

`preview_survey_note` is **the only event on the site that carries a visitor's own words**, and the
header of `lib/analytics.ts` no longer claims otherwise. It has to carry them — "what's the one
thing you'd change?" reported as a length is not an answer.

### Measured in a browser, not read off the code

| bullet | evidence |
| --- | --- |
| not on arrival | fresh load of `/products`: `scrollY 0`, no panel in the DOM, key unwritten |
| scroll arms it | scrolled past 600px → panel appears, `preview_survey_shown` fires exactly once |
| a Recording arms it | card click → path `/recording/01KAY9B2AMN590C8YP5WTNDTHQ`, **no panel**, key still unwritten; Escape → panel appears at `scrollY 0`, one `preview_survey_shown` |
| the two questions | `Compared to the old rnui.dev, this is…` with Better / About the same / Worse, then `What's the one thing you'd change?` |
| the events | `preview_survey_verdict {verdict: "worse"}` on the click, then `preview_survey_note {verdict: "worse", note: "…"}` on Send |
| dismissal remembered | ✕ → panel gone, key retained |
| both modes | panel drawn on `bg-panel`/`border-line` in light and dark |

`pnpm test` 311 passing across 18 files, `pnpm check-types` clean, `eslint` clean on both new
files, `pnpm build` green.

### Two things deliberately not built

**The optional "what's worse?" follow-up.** The acceptance marks it optional and warns in the same
breath that a third unconditional question collapses completion. Question 2 already asks what the
one thing you'd change is, which is the same sentence a *Worse* answer would give to a narrower
prompt. Add it only if the *Worse* count grows large enough that the general question is visibly
not reaching what is wrong.

**A `preview_survey_dismissed` event.** `shown` minus `verdict` is the rate at which this panel is
ignored or waved away, which is the number worth watching from day one. Splitting an active close
from scrolling past would not change what anyone did about it.

### One thing found here that belongs to ticket 07

The privacy policy enumerates what PostHog records — page views, Recordings opened and played,
filters, searches, errors, bookmarks and votes — and says nothing about a survey collecting a
visitor's typed comment. **That gap is older than this ticket**: the exit survey has been asking
for open text on `rnui.dev` since 2026-08-05, and the policy was written after it. This ticket
does not widen it beyond a second surface, and it puts the disclosure at the point of capture
instead — the panel says the sentence goes to PostHog with the browser's pseudonymous profile and
links to the policy, on the same reasoning as `components/signup-disclosure.tsx`. Adding the
sentence to the policy itself is ticket 07's: it bumps the published policy version, which is not
this ticket's call to make.

**2026-08-16 — the branch is pushed, the Preview carries the survey, and every acceptance bullet is
measured on a live host.** Status `resolved`.

The maintainer approved the push (nothing here touches `main`; this is the Preview's branch build,
not deploy B). Two things were then measured on `preview.rnui.dev` itself rather than inferred from
a green build:

- **The survey is in the served build.** `Compared to the old rnui.dev, this is…` is present in
  `/_next/static/chunks/7748780b25ef603b.js`, reached by walking the 15 chunks the live
  `/products` document loads. The panel only draws for a visitor who has scrolled or opened a
  Recording, so the compiled string is the honest proof the build carries it.
- **The responses land in 559028, not 117415.** The two live builds compile different tokens, read
  out of their own chunks: `phc_oFZi…` on `preview.rnui.dev` and `phc_6cIc…` on `www.rnui.dev`.
  That is the same evidence ticket 12 used, re-taken today rather than cited.

One change went in after the first push and is in the build above: the question is given an id and
pointed at, so the textarea takes it as its `aria-labelledby` and the three verdict buttons as
their `aria-describedby`. Without it a screen reader announced a button called "Better" with no
sight of the sentence it answers, and the textarea offered only its placeholder. The wording still
exists once, in `lib/preview-survey.ts`, so the two cannot drift.

### Acceptance, bullet by bullet

| bullet | state |
| --- | --- |
| both questions live on the Preview, as decision 7 words them | met — in the served build, and pinned verbatim by `tests/preview-survey.test.ts` |
| fires after a scroll or a Recording, not on arrival | met — measured on both paths; a fresh load at `scrollY 0` draws nothing |
| shown once per person; a dismissal remembered | met — `"previewSurveyShown"`, written on show, read once per load |
| optionally, the "what's worse?" follow-up | **deliberately not built**, with the reason above. The bullet says optional and warns against a third question |
| a prompt on `rnui.dev`, dismissible, not a modal | met — survey `01a00821`, live and verified through `POST /decide/?v=3` |
| responses land in the Preview's PostHog project | met — token measured in the live chunks of both hosts |
| honours `prefers-reduced-motion` | met — the panel's 240ms entrance is zeroed by `app/globals.css:293`, read out of the live stylesheet |

### What the next person should watch, and what would undo this

`preview_survey_shown` minus `preview_survey_verdict` is the number that says whether this format
works where the exit survey's did not. It is not readable for a while: the Preview's traffic is
whatever the prompt sends it, and the prompt reaches roughly 94 visitors a week, once each.
**Expect a first week of zero, and do not read it as a fault** — the same expectation ticket 07 set
and was right about.

Two things would quietly undo this. Re-enabling Vercel Authentication on the project puts the
Preview back behind a login and no answer can ever arrive (ticket 12 records why it is off). And
`NEXT_PUBLIC_POSTHOG_KEY` widened back to All Environments would send these events into 117415,
where they would mix with deploy A's baseline — the failure ticket 12 called silent, and it is
silent here too.
