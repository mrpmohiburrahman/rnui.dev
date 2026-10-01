// app/contactus/layout.tsx
//
// The page itself is `"use client"` (it owns form state), and Next forbids a
// client component from exporting metadata, so the route's title lives here —
// a server layout that adds no chrome (the root layout owns the header, rail
// and footer) and only supplies the one-key title (ticket 12 step 6).
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions or feedback about the rnui.dev catalogue? Send them here.",
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
