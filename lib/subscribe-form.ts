// lib/subscribe-form.ts
//
// What every capture surface does when a visitor presses Subscribe: the
// current Reader's token, if there is one, travels with the address so
// app/actions/subscribe-email.ts can record the Reader as `subscribed`. Before
// subscribe-popup ticket 10 only the popup forwarded the token, so a Reader who
// subscribed from the footer was asked again by the popup on another device.
//
// One function with adapters, called by the footer form, /subscribe and the
// popup (lib/subscribe-popup.ts), so there is one place where the token could
// be forgotten. The adapters are the same two the popup already injects; the
// forms pass the real ones.

import type { SubscribeResult } from "@/app/actions/subscribe-email"

/**
 * The browser's memory that an address was submitted from this browser. The
 * string is unchanged even though it means "submitted", not "is a Subscriber":
 * renaming it would show the form again to everyone who already signed up,
 * and the popup reads the same string to stay away.
 */
export const SUBMITTED_ADDRESS_KEY = "newsletterSubscribed"

type SubscribeFormAdapters = {
  getReaderToken: () => Promise<string | null>
  subscribeEmail: (
    form: FormData,
    token: string | null
  ) => Promise<SubscribeResult>
}

export async function submitSubscription(
  form: FormData,
  adapters: SubscribeFormAdapters
): Promise<SubscribeResult> {
  try {
    const token = await adapters.getReaderToken()
    return await adapters.subscribeEmail(form, token)
  } catch {
    // A rejected token fetch or an unreachable action. The forms never touched
    // auth before ticket 10, so this cannot become a silent no-op: the address
    // stays in the field and the visitor is told to try again, in the words the
    // popup already uses.
    return { ok: false, message: "Could not submit your address. Try again." }
  }
}
