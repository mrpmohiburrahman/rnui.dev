// components/preview-survey.tsx
//
// Ticket 13's survey, on the Preview only. Two questions, decision 7's wording,
// asked after the visitor has looked at something rather than on arrival.
//
// The decision of *whether* it is on screen is not in here — it is
// `shouldShowPreviewSurvey` in lib/preview-survey.ts, which is pure and tested.
// This file feeds it a hostname, the stored key and the two facts about the
// visit, and renders the panel.
//
// The trigger reuses two things the site already does rather than adding a
// signal to the grid or the overlay: `window.scrollY`, and the pathname, which
// reads `/recording/<id>` both for a real navigation and for the overlay the
// catalogue pushes with the History API (see components/site-shell.tsx for why
// the pathname is the right reader for that and the rendered segment is not).
//
// Motion is one entrance, 240ms with the Specimen's overlay curve, and
// `prefers-reduced-motion` is honoured by the global `animation-duration: 0s`
// rule app/globals.css:293 already ships — the panel lands in its final state
// with no rise, rather than never arriving.
"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  previewSurveyNote,
  previewSurveyShown,
  previewSurveyVerdict,
} from "@/lib/analytics"
import {
  CHANGE_QUESTION,
  COMPARISON_QUESTION,
  NOTE_MAX_LENGTH,
  PREVIEW_SURVEY_KEY,
  SCROLL_ARM_PX,
  shouldShowPreviewSurvey,
  VERDICTS,
  type Verdict,
} from "@/lib/preview-survey"
import { PRIVACY_PATH } from "@/lib/sender-identity"

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"

/** One panel on the page, so one id is enough and it can be a constant. */
const QUESTION_ID = "preview-survey-question"

/**
 * Two facts read straight off the browser, through the hook built for reading
 * things React does not own — the same one hooks/use-prefers-reduced-motion.ts
 * uses, and for the same reason: the server snapshot renders nothing, so the
 * served HTML and the hydrated HTML agree and no panel flashes in before the
 * browser has been consulted. Neither fact ever changes, so nothing subscribes.
 */
const NO_SUBSCRIPTION = () => () => {}

/**
 * Was the key already there when this tab loaded? Cached at module scope on the
 * first read, which is both what `useSyncExternalStore` needs (a stable value,
 * or it re-renders forever) and what the survey needs: the panel writes the key
 * the moment it appears, and a fact re-read after that write would take the
 * panel off screen mid-question.
 *
 * A browser that refuses storage reads as seen, so it is never asked — asking
 * once per person is not possible there, and asking every page is worse than
 * not asking.
 */
let seenAtLoad: boolean | null = null
function readSeenOnce(): boolean {
  if (seenAtLoad === null) {
    try {
      seenAtLoad = localStorage.getItem(PREVIEW_SURVEY_KEY) !== null
    } catch {
      seenAtLoad = true
    }
  }
  return seenAtLoad
}

export function PreviewSurvey() {
  const hostname = useSyncExternalStore(
    NO_SUBSCRIPTION,
    () => window.location.hostname,
    () => ""
  )
  const seen = useSyncExternalStore(NO_SUBSCRIPTION, readSeenOnce, () => true)

  const [scrolled, setScrolled] = useState(false)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [note, setNote] = useState("")
  const [sent, setSent] = useState(false)
  const [closed, setClosed] = useState(false)

  const recordingOpen = usePathname().startsWith("/recording/")

  // Opening a Recording arms the survey and never disarms it; the close is what
  // reveals the panel (lib/preview-survey.ts). Adjusted during render rather
  // than in an effect — React's own way to latch state off something derived,
  // and it costs one extra render on the click that opens a Recording.
  const [everOpened, setEverOpened] = useState(false)
  if (recordingOpen && !everOpened) setEverOpened(true)

  const armed = scrolled || everOpened

  useEffect(() => {
    if (armed) return

    const onScroll = () => {
      if (window.scrollY > SCROLL_ARM_PX) setScrolled(true)
    }

    // Once immediately: a reload restores the scroll position without ever
    // firing the event, and that visitor has plainly already been down the page.
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [armed])

  const visible =
    !closed &&
    shouldShowPreviewSurvey({
      hostname,
      dev: process.env.NODE_ENV === "development",
      seen,
      armed,
      recordingOpen,
    })

  // The ref, not `seen`, is what makes this once. `visible` goes false while a
  // Recording is open and true again when it closes, and without the guard that
  // would bill a second `preview_survey_shown` and rewrite the key each time.
  const reported = useRef(false)
  useEffect(() => {
    if (!visible || reported.current) return
    reported.current = true

    try {
      localStorage.setItem(PREVIEW_SURVEY_KEY, new Date().toISOString())
    } catch {
      // Nothing to do: the panel is on screen, and a browser that will not
      // remember that shows it again next time. Better than not asking.
    }
    previewSurveyShown()
  }, [visible])

  if (!visible) return null

  const chooseVerdict = (value: Verdict) => {
    setVerdict(value)
    previewSurveyVerdict(value)
  }

  const send = () => {
    const trimmed = note.trim()
    if (verdict && trimmed) previewSurveyNote(verdict, trimmed)
    setSent(true)
  }

  return (
    <section
      aria-label="Two questions about the Preview"
      // Above the grid and the phone dock, clear of the dock's own 96px of
      // fixed chrome (components/filter-dock.tsx). Never over a Recording:
      // `recordingOpen` has already taken the panel off screen by then.
      className="fixed inset-x-[14px] bottom-[104px] z-50 rounded-panel border border-line bg-panel p-[16px] shadow-e2 animate-in fade-in-0 slide-in-from-bottom-2 [animation-duration:240ms] [animation-timing-function:cubic-bezier(0.2,0.8,0.2,1)] md:inset-x-auto md:bottom-[26px] md:right-[26px] md:w-[340px]"
    >
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Dismiss"
        className={`absolute right-[10px] top-[10px] grid size-5 place-items-center rounded-[6px] bg-x-bg text-[10px] leading-none text-t1 ${FOCUS_RING}`}
      >
        ✕
      </button>

      {sent ? (
        <p className="pr-6 text-[12.5px] text-t2">
          Thanks — that is the half that actually helps.
        </p>
      ) : (
        <>
          {/* The question is named once and pointed at, rather than repeated
              into an aria-label on each control: the textarea takes it as its
              label and the three buttons as their description, so "Better" is
              announced with the sentence it is answering instead of on its
              own, and the wording cannot drift between the two copies. */}
          <p
            id={QUESTION_ID}
            className="pr-6 text-[12.5px] font-medium text-t1"
          >
            {verdict ? CHANGE_QUESTION : COMPARISON_QUESTION}
          </p>

          {verdict ? (
            <>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={NOTE_MAX_LENGTH}
                rows={3}
                autoFocus
                aria-labelledby={QUESTION_ID}
                className={`mt-[10px] w-full resize-none rounded-[9px] border border-line bg-field px-[10px] py-[8px] text-[12.5px] text-t1 outline-none placeholder:text-t3 ${FOCUS_RING}`}
                placeholder="Anything. The search, the colours, a thing you could not find."
              />
              <div className="mt-[10px] flex items-center justify-between gap-[10px]">
                {/* The disclosure at the point of capture, not one link away —
                    the same reason components/signup-disclosure.tsx exists.
                    This box is the only place on the site that sends a
                    visitor's own words to PostHog. */}
                <p className="text-[10.5px] leading-[1.4] text-t3">
                  Sent to PostHog with this browser&apos;s pseudonymous profile.{" "}
                  <Link
                    href={PRIVACY_PATH}
                    className={`text-acc underline underline-offset-2 ${FOCUS_RING} focus-visible:rounded-[3px]`}
                  >
                    Privacy
                  </Link>
                </p>
                <button
                  type="button"
                  onClick={send}
                  disabled={note.trim() === ""}
                  className={`flex-none rounded-chip bg-acc px-[12px] py-[6px] text-[12px] font-medium text-on-acc disabled:opacity-40 ${FOCUS_RING}`}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="mt-[10px] flex flex-wrap gap-[8px]">
              {VERDICTS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => chooseVerdict(value)}
                  aria-describedby={QUESTION_ID}
                  className={`rounded-chip border border-line bg-field px-[10px] py-[6px] text-[12px] text-t2 hover:border-acc hover:text-t1 ${FOCUS_RING}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
