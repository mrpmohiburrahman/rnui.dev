import type { PopupSuppression } from "@/lib/popup-suppression"
import {
  SUBMITTED_ADDRESS_KEY,
  submitSubscription,
} from "@/lib/subscribe-form"
import type { SubscribeResult } from "@/app/actions/subscribe-email"

export const POPUP_DISMISSED_KEY = "rnui:popup-dismissed"
export const SUBSCRIBE_POPUP_DWELL_MS = 5000

type PopupStorage = Pick<Storage, "getItem" | "setItem"> | null

export type SubscribePopupInput = {
  route: string
  scrollDepth: number
  dwellMs: number
  submitted: boolean
  dismissed: boolean
  readerSuppressed: PopupSuppression | null
  signInOpen: boolean
  recordingOpen: boolean
  open: boolean
  shown: boolean
}

export function isSubscribePopupRoute(route: string): boolean {
  const pathname = route.split("?")[0]
  return pathname === "/" || pathname === "/products"
}

export function decideSubscribePopup(
  input: SubscribePopupInput
): "show" | "stay-hidden" | "close-and-count-as-shown" {
  const eligibleRoute = isSubscribePopupRoute(input.route)
  const suppressed =
    input.submitted ||
    input.dismissed ||
    input.readerSuppressed !== null ||
    input.shown
  if (!eligibleRoute || suppressed) {
    return input.open ? "close-and-count-as-shown" : "stay-hidden"
  }
  const triggered =
    input.scrollDepth >= 350 && input.dwellMs >= SUBSCRIBE_POPUP_DWELL_MS
  if (input.signInOpen || input.recordingOpen) {
    return input.open || triggered ? "close-and-count-as-shown" : "stay-hidden"
  }
  return input.open || triggered ? "show" : "stay-hidden"
}

type PopupAdapters = {
  storage: () => PopupStorage
  getReaderToken: () => Promise<string | null>
  request: typeof fetch
  subscribeEmail: (
    form: FormData,
    token: string | null
  ) => Promise<SubscribeResult>
  newsletterSubmitted: (route: string) => void
}

type PopupSnapshot = {
  open: boolean
  shown: boolean
  submitted: boolean
  pending: boolean
  error: string | null
}

export function createSubscribePopup(adapters: PopupAdapters) {
  let snapshot: PopupSnapshot = {
    open: false,
    shown: false,
    submitted: false,
    pending: false,
    error: null,
  }
  const listeners = new Set<() => void>()
  const publish = (changes: Partial<PopupSnapshot>) => {
    const next = { ...snapshot, ...changes }
    if (
      snapshot.open === next.open &&
      snapshot.shown === next.shown &&
      snapshot.submitted === next.submitted &&
      snapshot.pending === next.pending &&
      snapshot.error === next.error
    )
      return
    snapshot = next
    listeners.forEach((notify) => notify())
  }
  const read = (key: string) => {
    try {
      return adapters.storage()?.getItem(key) === "true"
    } catch {
      return false
    }
  }
  const write = (key: string) => {
    try {
      adapters.storage()?.setItem(key, "true")
    } catch {}
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (notify: () => void) => {
      listeners.add(notify)
      return () => {
        listeners.delete(notify)
      }
    },
    update: (
      input: Omit<
        SubscribePopupInput,
        "submitted" | "dismissed" | "open" | "shown"
      >
    ) => {
      const decision = decideSubscribePopup({
        ...input,
        ...snapshot,
        submitted: !snapshot.submitted && read(SUBMITTED_ADDRESS_KEY),
        dismissed: read(POPUP_DISMISSED_KEY),
      })
      if (decision === "show") publish({ open: true, shown: false })
      if (decision === "close-and-count-as-shown")
        publish({ open: false, shown: true })
    },
    submit: async (form: FormData, route: string) => {
      if (!snapshot.open || snapshot.pending || snapshot.submitted) return
      publish({ pending: true, error: null })
      try {
        const result = await submitSubscription(form, adapters)
        if (!result.ok) {
          publish({ pending: false, error: result.message })
          return
        }
        write(SUBMITTED_ADDRESS_KEY)
        publish({ pending: false, submitted: true })
        adapters.newsletterSubmitted(route.split("?")[0])
      } catch {
        publish({
          pending: false,
          error: "Could not submit your address. Try again.",
        })
      }
    },
    dismiss: async () => {
      if (!snapshot.open) return
      const submitted = snapshot.submitted
      publish({ open: false, shown: true })
      if (submitted) return
      try {
        const token = await adapters.getReaderToken()
        if (!token) {
          write(POPUP_DISMISSED_KEY)
          return
        }
        const response = await adapters.request("/api/reader-prefs", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "dismissed" }),
        })
        if (!response.ok) write(POPUP_DISMISSED_KEY)
      } catch {
        write(POPUP_DISMISSED_KEY)
      }
    },
  }
}
