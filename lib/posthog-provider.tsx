// app/providers.tsx
"use client"

import { useEffect } from "react"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"

import SuspendedPostHogPageView from "./posthog-page-view"

declare global {
  interface Window {
    /** The posthog-js singleton, as the snippet install would expose it. */
    posthog?: typeof posthog
  }
}

//
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      // Direct PostHog host, not a first-party /ingest proxy. The reverse proxy this
      // used to point at got rnui.dev categorised as Malware by URL-reputation
      // engines, which read "domain forwards traffic to a third party" as filter
      // evasion. Hardcoded so a stale dashboard env var cannot reintroduce it.
      api_host: "https://us.i.posthog.com",
      ui_host: process.env.NEXT_PUBLIC_UI_HOST!,
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      capture_pageleave: true, // Enable pageleave capture
      person_profiles: "always", // or 'always' to create profiles for anonymous users as well
      // Unhandled exceptions become $exception events. Set here and not left to
      // the project's remote config so capture starts on the first page of a
      // session, before the config arrives, and so a toggle flipped in PostHog
      // cannot silently switch it off. It supplements demo_load_failed, which
      // reports a Demo the browser refused to play — that is not an exception
      // and never raises one.
      capture_exceptions: true,
      // A dead click is a click on something that looks interactive and does
      // nothing. Set here rather than in the project's remote config, for the
      // same reasons as capture_exceptions above. RecordingCard is a motion.div
      // and its bookmark control is pointer-events-none until hover, so a
      // finger tapping it on a phone produces exactly this.
      capture_dead_clicks: true,
      session_recording: {
        // Already the recorder's default, so this changes no behaviour — it
        // pins one. The newsletter and contact forms take email addresses and
        // this flag is what keeps them out of the recordings, which is worth
        // asserting at the call site rather than inheriting silently.
        maskAllInputs: true,
      },
    })

    // The snippet install exposes the instance as `window.posthog`; the npm
    // module does not, so this restores it. It is the object PostHog's own docs
    // tell you to poke from the console, and it is the only seam a browser test
    // has: `lib/analytics.ts` captures through this same singleton, so wrapping
    // `window.posthog.capture` sees all sixteen call sites. Without it
    // tests/e2e/posthog-events.spec.ts polled for a `window.posthog` that never
    // arrived and read an empty array — three assertions about deploy B's
    // keyboard layer that could never have failed for the right reason.
    window.posthog = posthog
  }, [])

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}
