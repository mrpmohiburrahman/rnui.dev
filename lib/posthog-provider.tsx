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
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}
