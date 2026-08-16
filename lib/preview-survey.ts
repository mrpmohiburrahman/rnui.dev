// lib/preview-survey.ts
//
// The Preview's survey: its two questions, its stored key, and the one predicate
// that decides whether it is on screen. Everything here is pure, so the decision
// can be tested without a browser — components/preview-survey.tsx is then only
// the wiring that feeds it a hostname, a stored key and three booleans.
//
// **It is a defect detector, not a referendum** (ticket 13, decision 6). At 94
// visitors a week a survey shown to everyone returns 2-5 answers a week, and
// fifteen to forty answers over the whole window cannot settle "which design is
// better" however it is built. What fifteen people *can* say is that the search
// is unfindable. That is why question 2 carries the value and question 1 costs
// one click.
//
// The existing exit survey on rnui.dev has been shown 14 times and completed 0
// times in 9 days. Too small to conclude the format fails, but the reason this
// one is cheaper to answer than that one: its first question is three buttons
// already on screen, not a text box behind a popover.

/**
 * Only the Preview asks. Not `rnui.dev`, where "compared to the old rnui.dev"
 * is nonsense, and deliberately not the branch's own
 * `rnui-dev-git-….vercel.app` alias — the noindex rule in next.config.ts covers
 * that host because a crawler can *find* it, which is a different problem from
 * an answer arriving from a hostname no visitor was ever sent to.
 *
 * This is also what keeps the component silent after deploy B, when it ships to
 * rnui.dev with the rest of the branch: `preview.rnui.dev` 301s to the root at
 * that point (ticket 12's retirement plan), so the hostname never matches
 * again. Deleting the component is still the tidy-up; forgetting to does not
 * put the question in front of anyone.
 */
export const PREVIEW_HOST = "preview.rnui.dev"

/**
 * Written the moment the survey is first put on screen, not when it is answered
 * — "shown once per person" is the acceptance, and a dismissal is remembered by
 * the same key a fortiori. A new key, so none of the three frozen browser keys
 * (`bookmarkedItems`, `votedItems`, `viewedEntryIds`) is touched.
 */
export const PREVIEW_SURVEY_KEY = "previewSurveyShown"

/** Decision 7, question 1. Three answers, one click, a crude trend. */
export const COMPARISON_QUESTION = "Compared to the old rnui.dev, this is…"

/** Decision 7, question 2. The one that carries the value. */
export const CHANGE_QUESTION = "What's the one thing you'd change?"

/**
 * The three answers to question 1, in the order decision 7 writes them. `value`
 * is what the event carries; `label` is what the button says.
 */
export const VERDICTS = [
  { value: "better", label: "Better" },
  { value: "same", label: "About the same" },
  { value: "worse", label: "Worse" },
] as const

export type Verdict = (typeof VERDICTS)[number]["value"]

/**
 * Long enough for the sentence the ticket is asking for, short enough that the
 * box does not read as an invitation to paste a stack trace. Enforced by the
 * textarea, so nothing longer can be typed rather than silently truncated after
 * the fact.
 */
export const NOTE_MAX_LENGTH = 600

/**
 * How far down the page counts as "has scrolled". Roughly one viewport on a
 * phone and most of one on a laptop — far enough that the visitor has seen the
 * grid rather than the header, which is the whole point of not asking on
 * arrival.
 */
export const SCROLL_ARM_PX = 600

/** What the browser knows at the moment the question would be asked. */
export type SurveyGate = {
  /** `window.location.hostname`. Empty before the first effect has run. */
  hostname: string
  /** A development build, where localhost stands in for the Preview. */
  dev: boolean
  /** `PREVIEW_SURVEY_KEY` was already in localStorage when this tab loaded. */
  seen: boolean
  /** The visitor has scrolled, or has opened a Recording. */
  armed: boolean
  /** A Recording detail or overlay is on screen right now. */
  recordingOpen: boolean
}

/**
 * Whether the survey is on screen.
 *
 * `armed && !recordingOpen` is the trigger the acceptance asks for, split in
 * two on purpose. Opening a Recording arms the survey and is the strongest
 * signal a visitor has actually looked at something — but a panel that appears
 * *over* the Recording they just opened is the interruption this ticket is
 * trying not to build. So the open arms it and the close reveals it, and a
 * visitor who only scrolls sees it with nothing in the way either.
 */
export function shouldShowPreviewSurvey(gate: SurveyGate): boolean {
  const onPreview =
    gate.hostname === PREVIEW_HOST || (gate.dev && gate.hostname === "localhost")

  return onPreview && !gate.seen && gate.armed && !gate.recordingOpen
}
