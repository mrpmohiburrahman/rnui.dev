// components/entry-overlay.tsx
//
// The Entry detail overlay. It replaces components/modal.tsx, which declared
// `role="dialog" aria-modal="true"` while behaving as though it were not modal:
// no portal, no focus trap, no Escape handler, no scroll lock, so focus stayed
// reachable in the 277 cards behind it. Radix Dialog supplies all four —
// its JS is already in the bundle through components/ui/sheet.tsx, so this
// costs nothing to ship.
//
// The motion is settled by .scratch/ui-ux-overhaul/motion-brief-overlay.md:
// two nodes, both compositor-only properties, enter 180ms / exit 100ms panel
// and 140ms backdrop. The old file faded the backdrop twice — the wrapper via
// `backdropVariants` and the inner tint inline, so the two opacities multiplied
// — and travelled 50px on open. Both are gone with it.
"use client"

import type { Entry } from "@/data/entry"
import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"

import { EntryDetail } from "./entry-detail"

/** A strong ease-out: arrives almost immediately, then settles. Both directions. */
const EASE = [0.19, 1, 0.22, 1] as const

export function EntryOverlay({
  entry,
  onClose,
}: {
  entry: Entry | null
  onClose: () => void
}) {
  // Under reduced motion the fade survives and the scale does not.
  // <MotionConfig reducedMotion="user"> in app/providers.tsx makes framer *snap*
  // transforms rather than drop them — `type: false`, not "don't set it" — so a
  // panel that started at 0.98 would still render one frame at 0.98 and jump.
  // The scale has to be gated here; MotionConfig covers everything else on the
  // site that never asks the question.
  const reduce = useReducedMotion()
  const enter = reduce ? 0.12 : 0.18
  const rest = reduce ? 1 : 0.98

  return (
    <Dialog.Root
      open={!!entry}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {/* Default mode, not mode="wait": a close-then-reopen would otherwise
          queue behind the exit and add latency to the most repeated action
          on the site. */}
      <AnimatePresence>
        {entry && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 0.5,
                  transition: { duration: enter, ease: EASE },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: reduce ? 0.1 : 0.14, ease: EASE },
                }}
              />
            </Dialog.Overlay>
            {/* No aria-label: the Dialog.Title below names the dialog, and
                Radix's aria-labelledby wins over an aria-label anyway, so one
                would only read as a name that never applies. aria-describedby
                is undefined on purpose — there is no description to point at,
                and without this Radix warns about that too. */}
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              {/* x/y are repeated in all three states on purpose: framer writes
                  `transform` wholesale, so a Tailwind -translate-x-1/2 would be
                  overwritten the moment `scale` animates. */}
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-[calc(100%-2rem)] p-6"
                initial={{ opacity: 0, scale: rest, x: "-50%", y: "-50%" }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: "-50%",
                  y: "-50%",
                  transition: { duration: enter, ease: EASE },
                }}
                exit={{
                  opacity: 0,
                  scale: rest,
                  x: "-50%",
                  y: "-50%",
                  transition: { duration: 0.1, ease: EASE },
                }}
              >
                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                    aria-label="Close Modal"
                  >
                    <X size={24} />
                  </button>
                </Dialog.Close>

                {/* Dialog.Title renders an h2, so the panel's heading is
                    unchanged and no hidden text is added. */}
                <EntryDetail entry={entry} Title={Dialog.Title} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
