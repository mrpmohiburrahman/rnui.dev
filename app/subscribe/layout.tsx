// app/subscribe/layout.tsx
//
// The page is `"use client"` (it owns the pending/success state), and Next
// forbids a client component from exporting metadata, so the route's title
// lives here — a server layout that adds no chrome and only supplies the
// one-key title (ticket 12 step 6).
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Subscribe",
  description:
    "One email when a new recording is added to the rnui.dev catalogue. No account, nothing else on a schedule.",
}

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}