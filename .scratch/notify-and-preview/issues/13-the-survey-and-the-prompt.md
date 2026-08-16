# The survey, and the prompt that gets people to it

Status: claimed
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
