// app/api/confirm-subscription/route.ts
//
// The second half of double opt-in (notify-and-preview ticket 06). The link in
// the confirmation email lands here; this flips the pending record to confirmed,
// spends the token, and only then does the address reach the Resend audience.
// Until that happens the address is a pending address, not a Subscriber.
//
// A route handler rather than a page because it writes: a server component that
// mutated on render would confirm twice under React's double render in dev, and
// the second pass would find a spent token and report the link invalid.
import { NextResponse } from "next/server"

import { confirmSubscription } from "@/lib/subscription-consent-firestore"

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? ""

  // One landing page for both outcomes, and no detail about which token failed:
  // a spent token, a made-up one and a mistyped one are indistinguishable from
  // out here, which is the point.
  let confirmed = false
  if (token) {
    try {
      confirmed = await confirmSubscription(token)
    } catch (err) {
      console.error("confirm-subscription: confirming failed", err)
    }
  }

  return NextResponse.redirect(
    new URL(`/subscribe?confirmed=${confirmed ? "yes" : "no"}`, request.url)
  )
}
