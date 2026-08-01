// app/providers.tsx
"use client"

import { useEffect } from "react"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"

import SuspendedPostHogPageView from "./posthog-page-view"

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
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}
