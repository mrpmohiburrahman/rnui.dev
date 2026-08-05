// components/recording-overlay.tsx
//
// The Recording detail overlay. It replaces components/modal.tsx, which declared
// `role="dialog" aria-modal="true"` while behaving as though it were not modal:
// no portal, no focus trap, no Escape handler, no scroll lock, so focus stayed
// reachable in the 277 cards behind it. Radix Dialog supplies all four.
//
// The motion is settled by the Specimen (spec.md:58-67), which supersedes the
// ui-ux-overhaul motion brief: enter 240ms ease-rise with an 8px rise, exit
// 160ms ease-in, both compositor-only nodes, in AnimatePresence's default mode
// (a close-then-reopen must not queue behind the exit). Read the brief before
// overriding — checkpoint 4 — the brief's scale 0.98 is dropped in favour of
// the Specimen's 8px translate, which is what this ticket closes.
"use client"

import { useEffect, useRef } from "react"
import type { Recording } from "@/data/recording"
import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { recordingFacts, recordingOpened } from "@/lib/analytics"

import { countView } from "./playback-owner"
import { RecordingDetail } from "./recording-detail"

// The Specimen's curves (Specimen.dc.html:164-165): rise = cubic-bezier(.2,.8,.2,1).
const RISE = [0.2, 0.8, 0.2, 1] as const
const ENTER_MS = 0.24
const EXIT_MS = 0.16

export function RecordingOverlay({
  recording,
  onClose,
  topViewCount,
  catalogueTotal,
  contributorTotal,
  more,
  saved,
  voted,
  onToggleSave,
  onToggleVote,
  savedIds,
  votedIds,
  onToggleSaveId,
  onToggleVoteId,
  // The Category sequence the arrows walk: the Recordings the page was handed,
  // filtered to the open one's Category, in the order they arrived — never the
  // sorted grid, so a sort control cannot reorder under the panel and an
  // un-save cannot make it vanish (components/catalogue-page.tsx:90-93).
  sequence,
}: {
  recording: Recording | null
  onClose: () => void
  /** The props the detail body needs, threaded through so the catalogue page and
   *  the standalone page can both own them. The overlay itself owns none of the
   *  counts; it just relays. */
  topViewCount: number
  catalogueTotal: number
  contributorTotal: number
  more: Recording[]
  saved: boolean
  voted: boolean
  onToggleSave: () => void
  onToggleVote: () => void
  /** Relayed to the body's MORE FROM THIS CONTRIBUTOR strip, which draws the
   *  catalogue's own Tile and so needs both Remembered sets. */
  savedIds: string[]
  votedIds: string[]
  onToggleSaveId: (id: string) => void
  onToggleVoteId: (id: string) => void
  sequence: Recording[]
}) {
  // Under reduced motion the clean fades survive and the transform does not.
  // <MotionConfig reducedMotion="user"> in app/providers.tsx makes framer *snap*
  // transforms rather than drop them, so the translate has to be gated here too,
  // exactly as the old scale was. The durations stay at the Specimen's 240/160:
  // reduced motion removes the rise, not the fade — the acceptance samples both
  // opacities still changing while ty is constant.
  const reduce = useReducedMotion()
  const enter = ENTER_MS
  const exit = EXIT_MS
  const rise = reduce ? 0 : 8

  const index = sequence.findIndex((r) => r.id === recording?.id)

  // Focus returns somewhere real on close. Radix's own restore can't do it:
  // there is no trigger to restore to, and the card is a div with an onClick and
  // no tabIndex, so a mouse open leaves focus on <body>. The tile that was open
  // at the moment of closing — which after an arrow step is not the tile that
  // opened it — carries data-recording-id.
  const lastId = useRef<string | null>(null)
  useEffect(() => {
    if (recording) lastId.current = recording.id
  }, [recording])

  // Move to another Recording in the Category. replaceState, not pushState: a
  // step within a mode is not a step out of it, and Escape — which is
  // history.back() — must step to the grid, not walk back through every
  // Recording visited (hooks/use-sorted-data.ts:22-26). The query string is
  // carried over so the grid behind keeps its page count. Arriving by arrow is
  // an open (ADR-0007:3 reach), so it counts a view and flags `opened_from:
  // keyboard` (see ## Comments: a third value beside `card` and `url`).
  const moveTo = (next: Recording) => {
    window.history.replaceState(
      null,
      "",
      `/recording/${next.id}${window.location.search}`
    )
    countView(next.id)
    recordingOpened(recordingFacts(next), "keyboard")
  }

  // The arrows, on a window listener added while a Recording is open and removed
  // when it closes. Escape is not in it: Radix owns Escape through onOpenChange.
  // ArrowLeft/Right move within the sequence, clamped at both ends rather than
  // wrapping; a command or alt key returns early so ⌘← (browser Back) keeps
  // working — it is the one close path there is.
  //
  // S and V are NOT here, though step 10 wrote them here. Step 10 says they
  // "call `onToggleSave`" / "`onToggleVote`", and they did — but those props are
  // the bare Remembered-set toggles (catalogue-page.tsx:211-212), while the
  // click path is handleSave/handleVote inside components/recording-detail.tsx,
  // which also fire bookmark_added / vote_cast and call
  // increment/decrementVoteCount. So the keyboard flipped aria-pressed and
  // nothing else: no Firestore, no PostHog, and no movement in the count the
  // panel prints — against the acceptance's "V moves the vote count in both",
  // and the exact narrowing spec.md:107-115 warns the keyboard layer must not
  // cause. Worse, the two paths disagreed about state, so V then a click ran
  // decrementVoteCount for a vote never counted.
  //
  // The fix is to put the keys on the component that owns what they do rather
  // than to rebuild its handlers here: RecordingDetail holds the optimistic
  // count as well as the handlers, so lifting them would have moved that state
  // too, and duplicated it again for the standalone route. It takes
  // `keyboardControls` and listens for S and V itself. The cost is a second
  // window listener while the overlay is open, which is the one thing here that
  // departs from step 10 as written.
  useEffect(() => {
    if (!recording) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "ArrowLeft") {
        if (index > 0) moveTo(sequence[index - 1])
      } else if (e.key === "ArrowRight") {
        if (index < sequence.length - 1) moveTo(sequence[index + 1])
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [recording, sequence, index])

  const position = sequence.length > 0 ? index + 1 : 0

  return (
    <Dialog.Root
      open={!!recording}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AnimatePresence>
        {recording && (
          <Dialog.Portal forceMount>
            {/* The scrim: canvas-tinted, blurred. The token carries its own
                alpha, so there is no opacity sublayer and no bg-black.
                Full-viewport backdrop blur is the one thing added here with a
                real cost on a low-end phone — ticket 13 measures it.

                It carries no flex. Step 9 quotes the mock's
                `align-items:flex-start; justify-content:center; padding-top:64px`
                from Catalogue.dc.html:167, where the Detail really is a child of
                the scrim div — but Radix gives every Dialog.Portal child its own
                portal, so Overlay and Content are siblings on <body> and a flex
                container here has nothing to lay out. The panel positions
                itself instead, which is what the rest of step 9 describes. */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-scrim backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: enter, ease: RISE },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: exit, ease: "easeIn" },
                }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onCloseAutoFocus={(e) => {
                // Radix's own restore can't land anywhere real: there is no trigger
                // to return to, and the card is a div with an onClick but no tabIndex,
                // so a mouse open leaves focus on <body>. Return instead to the tile
                // that was open at the moment of closing — which after an arrow step
                // is not the tile that opened it. It carries data-recording-id.
                e.preventDefault()
                const last = lastId.current
                if (last) {
                  const tile = document.querySelector(
                    `[data-recording-id="${last}"]`
                  ) as HTMLElement | null
                  tile?.focus()
                }
              }}
            >
              {/* Top-aligned panel, positioned by itself: `top-16` is step 9's
                  64px, and `left-1/2` with `x: "-50%"` is its horizontal centre.
                  The `x` is repeated across all three motion states for the
                  reason step 9 records — framer writes `transform` wholesale, so
                  a Tailwind `-translate-x-1/2` would be wiped the moment `y`
                  animates. What went, and only what went, is the vertical
                  centring: `top-1/2` and `y: "-50%"`.

                  `max-h` plus the body's own scroll keeps a tall Recording
                  reachable without the panel losing its 18px corners; Radix
                  already whitelists this subtree for wheel and touch while the
                  page behind it is locked.

                  The bar (context, legend, close) is first in the DOM so Radix
                  focuses the close button on open. */}
              <motion.div
                className="fixed left-1/2 top-16 z-50 w-[1080px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-64px)] rounded-[18px] border border-line2 bg-panel shadow-e2 overflow-hidden flex flex-col"
                initial={{ opacity: 0, x: "-50%", y: rise }}
                animate={{
                  opacity: 1,
                  x: "-50%",
                  y: 0,
                  transition: { duration: enter, ease: RISE },
                }}
                exit={{
                  opacity: 0,
                  x: "-50%",
                  y: rise,
                  transition: { duration: exit, ease: "easeIn" },
                }}
              >
                {/* The chrome bar, Detail.dc.html:22-26. rail bg, border-b. */}
                <div className="flex items-center gap-3.5 px-[18px] py-3.5 border-b border-line bg-rail">
                  <span className="font-mono text-[9.5px] tracking-[0.13em] text-t3">
                    {recording.category.toUpperCase()} · {position} OF{" "}
                    {sequence.length}
                  </span>
                  <span className="ml-auto flex items-center gap-[9px] font-mono text-[9px] tracking-[0.1em] text-t3">
                    <span aria-hidden>←</span>
                    <span aria-hidden>→</span> PREV / NEXT
                    <span aria-hidden className="text-line2">
                      |
                    </span>{" "}
                    S SAVE
                    <span aria-hidden className="text-line2">
                      |
                    </span>{" "}
                    V VOTE
                  </span>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close, or press Escape"
                      aria-keyshortcuts="Escape"
                      className="flex items-center gap-[7px] font-mono text-[10px] px-2.5 py-[7px] rounded-[8px] border border-acc bg-acc-soft text-t1 cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
                    >
                      ESC ✕
                    </button>
                  </Dialog.Close>
                </div>

                {/* min-h-0 or this flex child refuses to shrink and gets
                    clipped by the panel's overflow-hidden instead of scrolling. */}
                {/* `padding: 26px 28px 28px` — Detail.dc.html:131's overlay
                    figure. The bottom is 28, not the top's 26. */}
                <div className="min-h-0 overflow-y-auto px-7 pb-7 pt-[26px]">
                  <RecordingDetail
                    recording={recording}
                    form="overlay"
                    Title={Dialog.Title}
                    // S and V belong to the body, because the controls they
                    // operate do. See the comment on the keydown effect above.
                    keyboardControls
                    topViewCount={topViewCount}
                    catalogueTotal={catalogueTotal}
                    contributorTotal={contributorTotal}
                    more={more}
                    saved={saved}
                    voted={voted}
                    onToggleSave={onToggleSave}
                    onToggleVote={onToggleVote}
                    savedIds={savedIds}
                    votedIds={votedIds}
                    onToggleSaveId={onToggleSaveId}
                    onToggleVoteId={onToggleVoteId}
                  />
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
