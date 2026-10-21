"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"

import { newsletterSubmitted } from "@/lib/analytics"
import { SIGNUP_HEADING, SIGNUP_PROMISE } from "@/lib/sender-identity"
import {
  createSubscribePopup,
  isSubscribePopupRoute,
  SUBSCRIBE_POPUP_DWELL_MS,
} from "@/lib/subscribe-popup"
import { getReaderToken } from "@/hooks/use-reader"
import { useSavedDemos } from "@/hooks/use-saved-demos"
import { SignupDisclosure } from "@/components/signup-disclosure"
import { subscribeEmail } from "@/app/actions/subscribe-email"

const RISE = [0.2, 0.8, 0.2, 1] as const

export function SubscribePopup({ signInOpen }: { signInOpen: boolean }) {
  const pathname = usePathname()
  const { popupSuppressed } = useSavedDemos()
  const reduce = useReducedMotion()
  const previousFocus = useRef<HTMLElement | null>(null)
  const visit = useRef<{
    route: string
    started: number
    depth: number
  } | null>(null)
  const [popup] = useState(() =>
    createSubscribePopup({
      storage: () => {
        try {
          return window.localStorage
        } catch {
          return null
        }
      },
      getReaderToken,
      request: (...args) => fetch(...args),
      subscribeEmail,
      newsletterSubmitted,
    })
  )
  const state = useSyncExternalStore(
    popup.subscribe,
    popup.getSnapshot,
    popup.getSnapshot
  )
  const listing = isSubscribePopupRoute(pathname)
  const recordingOpen = pathname.startsWith("/recording/")

  useEffect(() => {
    if (listing) {
      if (visit.current?.route !== pathname) {
        visit.current = {
          route: pathname,
          started: performance.now(),
          depth: window.scrollY,
        }
      }
    } else if (!recordingOpen) {
      visit.current = null
    }

    const evaluate = () => {
      const current = visit.current
      if (current && !recordingOpen)
        current.depth = Math.max(current.depth, window.scrollY)
      popup.update({
        route: current?.route ?? pathname,
        scrollDepth: current?.depth ?? 0,
        dwellMs: current ? performance.now() - current.started : 0,
        readerSuppressed: popupSuppressed,
        signInOpen,
        recordingOpen,
      })
    }
    evaluate()
    const remaining = visit.current
      ? SUBSCRIBE_POPUP_DWELL_MS - (performance.now() - visit.current.started)
      : null
    const timer =
      remaining !== null && remaining > 0
        ? window.setTimeout(evaluate, Math.ceil(remaining))
        : null
    window.addEventListener("scroll", evaluate, { passive: true })
    window.addEventListener("storage", evaluate)
    window.addEventListener("focus", evaluate)
    return () => {
      if (timer !== null) window.clearTimeout(timer)
      window.removeEventListener("scroll", evaluate)
      window.removeEventListener("storage", evaluate)
      window.removeEventListener("focus", evaluate)
    }
  }, [listing, pathname, popup, popupSuppressed, recordingOpen, signInOpen])

  if (!listing || signInOpen) return null

  const centered = "translate(-50%, -50%)"
  const resting = reduce ? centered : "translate(-50%, calc(-50% + 8px))"

  return (
    <Dialog.Root
      open={state.open}
      onOpenChange={(open) => {
        if (!open) void popup.dismiss()
      }}
    >
      <AnimatePresence>
        {state.open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[70] bg-scrim backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.24, ease: RISE },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.16, ease: RISE },
                }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={() => {
                previousFocus.current =
                  document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                if (document.activeElement === document.body)
                  previousFocus.current?.focus({ preventScroll: true })
              }}
            >
              <motion.div
                className="fixed left-1/2 top-1/2 z-[71] w-[400px] max-w-[calc(100vw-48px)] max-h-[calc(100dvh-48px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-line2 bg-header p-[16px] shadow-2xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
                initial={{ opacity: 0, transform: resting }}
                animate={{
                  opacity: 1,
                  transform: centered,
                  transition: { duration: 0.24, ease: RISE },
                }}
                exit={{
                  opacity: 0,
                  transform: resting,
                  transition: { duration: 0.16, ease: RISE },
                }}
              >
                <div className="flex items-start justify-between gap-[8px]">
                  <Dialog.Title className="m-0 px-[6px] text-[15px] font-medium tracking-[-0.01em] text-t1">
                    {SIGNUP_HEADING}
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label="Close"
                    className="flex size-[32px] shrink-0 items-center justify-center rounded-[6px] text-t3 hover:text-t2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
                  >
                    <X size={16} aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <div className="px-[6px]">
                  {state.submitted ? (
                    <p
                      role="status"
                      className="m-0 pb-[10px] pt-[6px] text-[12.5px] leading-[1.5] text-t1"
                    >
                      Check your inbox — the Digest starts once you confirm.
                    </p>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        void popup.submit(
                          new FormData(event.currentTarget),
                          pathname
                        )
                      }}
                    >
                      <p className="m-0 pb-[18px] pt-[8px] text-[12.5px] leading-[1.5] text-t2">
                        {SIGNUP_PROMISE}
                      </p>
                      <div className="flex flex-col gap-[9px]">
                        <input
                          id="popup-subscribe-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="youremail@example.com"
                          required
                          aria-label="Email address"
                          aria-invalid={state.error ? true : undefined}
                          aria-describedby={
                            state.error ? "popup-subscribe-error" : undefined
                          }
                          className="h-[40px] w-full min-w-0 rounded-[10px] border border-line bg-field px-[12px] text-[12.5px] text-t1 placeholder:text-t3 focus:outline-none focus-visible:ring-2 focus-visible:ring-acc"
                        />
                        <button
                          type="submit"
                          disabled={state.pending}
                          className="h-[40px] w-full shrink-0 rounded-[10px] bg-acc px-[14px] text-[12px] font-medium text-on-acc transition-colors duration-120 disabled:opacity-60 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
                        >
                          {state.pending ? "Subscribing…" : "Subscribe"}
                        </button>
                      </div>
                      {state.error && (
                        <p
                          id="popup-subscribe-error"
                          role="alert"
                          className="m-0 mt-[6px] text-[11px] text-destructive"
                        >
                          {state.error}
                        </p>
                      )}
                      <SignupDisclosure className="mt-[16px] text-[11.5px] leading-[1.55] text-t3" />
                    </form>
                  )}
                  <Dialog.Close className="mt-[14px] w-full rounded-[6px] py-[7px] text-[11.5px] text-t3 hover:text-t2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2">
                    Not now
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
