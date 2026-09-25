"use client"

// components/turnstile-widget.tsx
//
// The browser half of Turnstile, following Cloudflare's canonical Next.js
// reference (`turnstile-spin/references/nextjs-app.md`) rather than the
// `class="cf-turnstile"` shorthand, for a reason that is functional:
//
// **Explicit rendering returns a widget id, and the widget id is what `reset()`
// needs.** Tokens are single-use and live 300 seconds, so a visitor whose first
// submission fails must be handed a *fresh* token before retrying — and a widget
// built by the implicit markup path has no id to reset, which would leave the
// retry sending a token that was already spent.
//
// **When this mounts is the caller's decision, and it matters.** Ticket 02
// measured browser compression in *minutes*, and the form compresses before
// submitting (map decision 4). A widget that rendered on page load would mint a
// token that expires long before the visitor can press submit. So the parent
// renders this component only once the file is ready — the same ordering ticket
// 07's provisioning note records.
//
// It renders nothing until the script is ready, so an empty container is the
// normal first frame rather than a fault.
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react"
import Script from "next/script"

import { SUBMIT_ACTION } from "@/lib/turnstile-shared"

type TurnstileWidgetId = string

/** The slice of Cloudflare's browser API this component uses. */
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action: string
      callback: (token: string) => void
      "error-callback"?: () => void
      "expired-callback"?: () => void
    }
  ) => TurnstileWidgetId
  reset: (widgetId?: TurnstileWidgetId) => void
  remove: (widgetId?: TurnstileWidgetId) => void
}

declare global {
  interface Window {
    /** Injected by the script below. Absent until that script has loaded. */
    turnstile?: TurnstileApi
  }
}

export type TurnstileHandle = {
  /** Discard the current token and mint a fresh one. Required before a retry. */
  reset: () => void
}

export function TurnstileWidget({
  onToken,
  action = SUBMIT_ACTION,
  ref,
}: {
  onToken: (token: string) => void
  action?: string
  ref?: Ref<TurnstileHandle>
}) {
  const container = useRef<HTMLDivElement | null>(null)
  const widgetId = useRef<TurnstileWidgetId | null>(null)

  const render = useCallback(() => {
    const el = container.current
    const api = window.turnstile

    // Already rendered. A second render would stack a second widget inside the
    // same div with the first one's id left unreachable, so its token could
    // never be reset — and the retry after a failure would silently reuse it.
    if (!el || !api || widgetId.current !== null) return

    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!sitekey) {
      // A build-environment fault, not the visitor's, so it is loud in the
      // console and quiet on the page. The submit control stays disabled, which
      // is the honest state: nothing has been verified.
      console.error(
        "turnstile: NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set — the widget cannot render"
      )
      return
    }

    widgetId.current = api.render(el, {
      sitekey,
      action,
      callback: onToken,
      // An expired token is not a token. Clearing it keeps the submit control
      // disabled instead of letting a dead value be sent and refused upstream.
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    })
  }, [action, onToken])

  const reset = useCallback(() => {
    if (widgetId.current !== null && window.turnstile) {
      window.turnstile.reset(widgetId.current)
    }
    onToken("")
  }, [onToken])

  useImperativeHandle(ref, () => ({ reset }), [reset])

  useEffect(() => {
    // Covers what next/script's `onReady` does not: mounting *after* the script
    // has already loaded. That is the ordinary path here, because the parent
    // renders this component only once compression has finished — and the
    // script may well have loaded on a previous attempt.
    if (window.turnstile) render()
  }, [render])

  useEffect(
    () => () => {
      // Unmounting without removing leaks the widget and its iframe. Reachable
      // whenever the parent hides the widget, e.g. the visitor clearing the
      // chosen file after a failed attempt.
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    },
    []
  )

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={container} />
    </>
  )
}
