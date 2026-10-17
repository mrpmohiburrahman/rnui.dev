// app/subscribe/layout.tsx
//
// The page is `"use client"` (it owns the pending/success state), and Next
// forbids a client component from exporting metadata, so the route's title
// lives here — a server layout that adds no chrome and only supplies the
// one-key title (ticket 12 step 6).
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Subscribe",
  // Ticket 06: the old description promised "one email when a new recording is
  // added", which is not the promise the form now makes and stores. "weekly"
  // came out on 2026-10-09 with the same edit that removed it from
  // SIGNUP_DISCLOSURE_BODY and SIGNUP_HEADING: the cadence is undecided, so a
  // fixed-frequency promise in the page description contradicts the form.
  description:
    "A Digest of the Recordings added to the rnui.dev catalogue. Confirm your address once; unsubscribe from any email. No account.",
}

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
