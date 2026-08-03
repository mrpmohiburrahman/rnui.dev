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
    window.history.replaceState(null, "", `/recording/${next.id}${window.location.search}`)
    countView(next.id)
    recordingOpened(recordingFacts(next), "keyboard")
  }

  // One keydown listeners on window, added while a Recording is open and removed
  // when it closes. Escape is not in it: Radix owns Escape through onOpenChange.
  // ArrowLeft/Right move within the sequence, clamped at both ends rather than
  // wrapping; s/S and v/V toggle save and vote; a command or alt key returns
  // early so ⌘← (browser Back) keeps working — it is the one close path there is.
  useEffect(() => {
    if (!recording) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key
      if (key === "ArrowLeft") {
        if (index > 0) moveTo(sequence[index - 1])
      } else if (key === "ArrowRight") {
        if (index < sequence.length - 1) moveTo(sequence[index + 1])
      } else if (key === "s" || key === "S") {
        onToggleSave()
      } else if (key === "v" || key === "V") {
        onToggleVote()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [recording, sequence, index, onToggleSave, onToggleVote])

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
            {/* The scrim: top-aligned, canvas-tinted, blurred. The token carries
                its own alpha, so there is no opacity sublayer and no bg-black.
                Full-viewport backdrop blur is the one thing added here with a
                real cost on a low-end phone — ticket 13 measures it. */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-scrim backdrop-blur-[3px] flex items-start justify-center pt-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: enter, ease: RISE } }}
                exit={{ opacity: 0, transition: { duration: exit, ease: "easeIn" } }}
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
              {/* Top-aligned panel. The bar (context, legend, close) is first in
                  the DOM so Radix focuses the close button on open. */}
              <motion.div
                className="w-[1080px] max-w-[calc(100vw-32px)] rounded-[18px] border border-line2 bg-panel shadow-e2 overflow-hidden z-50 flex flex-col"
                initial={{ opacity: 0, y: rise }}
                animate={{ opacity: 1, y: 0, transition: { duration: enter, ease: RISE } }}
                exit={{ opacity: 0, y: rise, transition: { duration: exit, ease: "easeIn" } }}
              >
                {/* The chrome bar, Detail.dc.html:22-26. rail bg, border-b. */}
                <div className="flex items-center gap-3.5 px-[18px] py-3.5 border-b border-line bg-rail">
                  <span className="font-mono text-[9.5px] tracking-[0.13em] text-t3">
                    {recording.category.toUpperCase()} · {position} OF {sequence.length}
                  </span>
                  <span className="ml-auto flex items-center gap-[9px] font-mono text-[9px] tracking-[0.1em] text-t3">
                    <span aria-hidden>←</span>
                    <span aria-hidden>→</span> PREV / NEXT
                    <span aria-hidden className="text-line2">|</span> S SAVE
                    <span aria-hidden className="text-line2">|</span> V VOTE
                  </span>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close, or press Escape"
                      className="flex items-center gap-[7px] font-mono text-[10px] px-2.5 py-[7px] rounded-[8px] border border-acc bg-acc-soft text-t1 cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
                    >
                      ESC ✕
                    </button>
                  </Dialog.Close>
                </div>

                <div className="px-7 py-[26px]" >
                  <RecordingDetail
                    recording={recording}
                    Title={Dialog.Title}
                    topViewCount={topViewCount}
                    catalogueTotal={catalogueTotal}
                    contributorTotal={contributorTotal}
                    more={more}
                    saved={saved}
                    voted={voted}
                    onToggleSave={onToggleSave}
                    onToggleVote={onToggleVote}
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