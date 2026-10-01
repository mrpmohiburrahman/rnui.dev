// app/submit/layout.tsx
//
// The page itself is `"use client"` (it owns form state), and Next forbids a
// client component from exporting metadata, so the route's title lives here — a
// server layout that adds no chrome (the root layout owns the header, rail and
// footer) and supplies the one-key title. Same shape as app/contactus/layout.tsx.
//
// public-submissions ticket 05.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Send us a Demo",
  description:
    "Send rnui.dev a screen recording of a React Native component, with the details to credit you.",
}

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
