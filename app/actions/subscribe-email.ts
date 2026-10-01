// app/actions/subscribe-email.ts
//
// The one place the email write lives. The two client forms that used to call
// addDoc themselves — components/newsletter-form.tsx and app/subscribe/page.tsx —
// now call this, so the Firestore write and its validation are not duplicated.
// It follows the pattern app/actions/increment-view-count.ts sets: a thin
// "use server" delegate over lib/, callable from a client component.
//
// notify-and-preview ticket 06 made the write the FIRST half of double opt-in.
// What lands here is a pending address, not a Subscriber: `confirmed: false`,
// an opaque token, and the consent record — the exact disclosure string shown,
// the form version, the IP and the timestamp — so what somebody agreed to is
// provable from the record rather than reconstructed from a deploy date. The
// second half is app/api/confirm-subscription/route.ts.

"use server"

import { headers } from "next/headers"
import { doc, setDoc, Timestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { sendEmail } from "@/lib/resend"
import {
  CONSENT_FORM_VERSION,
  IDENTITY_BLOCK_HTML,
  privacyUrl,
  SIGNUP_DISCLOSURE,
  SIGNUP_DISCLOSURE_BODY,
  SIGNUP_DISCLOSURE_POLICY_SENTENCE,
} from "@/lib/sender-identity"
import { issueToken } from "@/lib/subscribe-token"
import { isUndeliverableByDefinition } from "@/lib/subscription-consent"
import { EMAIL_COLLECTION_NAME } from "@/lib/subscription-consent-firestore"

export type SubscribeResult =
  | { ok: true; message?: never }
  | { ok: false; message: string }

/**
 * The origin the confirmation link points at.
 *
 * `Host` is attacker-controlled — it is whatever the client sent — so trusting
 * it alone lets a forged request make rnui.dev mail a real person a link to
 * somebody else's domain, over rnui.dev's own authenticated sender. That is a
 * phishing primitive, not just a wrong URL, so a deploy pins its own origin and
 * the header is only the local-development fallback.
 *
 * Not NEXT_PUBLIC_UI_HOST — that one is PostHog's UI host. A per-deploy variable
 * rather than a constant because this effort deliberately runs two deploys,
 * rnui.dev and preview.rnui.dev, and each must confirm against itself.
 */
function confirmOrigin(h: Headers): string {
  const pinned = process.env.NEXT_PUBLIC_SITE_ORIGIN
  if (pinned) return pinned.replace(/\/$/, "")
  const host = h.get("host") ?? "rnui.dev"
  const proto = h.get("x-forwarded-proto") ?? "https"
  return `${proto}://${host}`
}

function confirmationHtml(origin: string, token: string): string {
  const confirmUrl = `${origin}/api/confirm-subscription?token=${token}`
  // The disclosure's last sentence is "See our Privacy Policy." — a real link on
  // the form, and until ticket 07 dead text here, because SIGNUP_DISCLOSURE is
  // the joined plain string that also gets stored as the consent record. Linked
  // absolutely: a relative href in an inbox resolves against the mail client.
  const disclosure = `${SIGNUP_DISCLOSURE_BODY} <a href="${privacyUrl(
    origin
  )}">${SIGNUP_DISCLOSURE_POLICY_SENTENCE}</a>`
  return `<p>Please confirm you want the rnui.dev Digest.</p>
<p><a href="${confirmUrl}">Yes, confirm my address</a></p>
<p>${disclosure}</p>
<p style="font-size:13px;color:#666">
If you did not ask for this, ignore this email — nothing is sent to an address
that is never confirmed, and this link stops working the moment it is used.
</p>
<hr>
${IDENTITY_BLOCK_HTML}`
}

export async function subscribeEmail(
  formData: FormData
): Promise<SubscribeResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()

  if (!email) {
    return { ok: false, message: "Email is required" }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address" }
  }

  // The document id is 122 bits from the platform CSPRNG; the link additionally
  // carries an HMAC over it, so only this server can mint a confirmable token.
  // Both halves matter, for different reasons — lib/subscribe-token.ts has the
  // attack the signature stops.
  //
  // Minted BEFORE the write, so a missing signing secret fails here rather than
  // after a record exists that nothing can ever confirm.
  //
  // The id is the document id rather than a stored field, because finding a
  // field means a `where(…)` query, a query is a `list` operation, and no rule
  // can grant `list` only to a client that filtered on the right token — so that
  // shape would need the collection listable, publishing every Subscriber's
  // address. As an id it is a `get`, which already requires the secret.
  let issued
  try {
    issued = issueToken()
  } catch (err) {
    console.error("subscribeEmail: cannot issue a confirmation token", err)
    return {
      ok: false,
      message: "An unexpected error occurred. Please, try again later.",
    }
  }

  const h = await headers()

  try {
    await setDoc(doc(db, EMAIL_COLLECTION_NAME, issued.id), {
      email,
      createdAt: Timestamp.now(),
      confirmed: false,
      // The consent record. `consentText` is the disclosure as rendered, not a
      // reference to it, because the words are the thing being evidenced.
      consentText: SIGNUP_DISCLOSURE,
      formVersion: CONSENT_FORM_VERSION,
      // x-forwarded-for is a list when proxies chain; the first entry is the
      // client. "unknown" rather than an empty string so the field always exists.
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
    })
  } catch (err) {
    console.error("subscribeEmail: storing email failed", err)
    return {
      ok: false,
      message: "An unexpected error occurred. Please, try again later.",
    }
  }

  // A reserved name cannot receive mail, so there is nobody to confirm and the
  // send would be a hard bounce against a brand-new sending domain. The pending
  // record above still stands; it simply never gets confirmed.
  if (isUndeliverableByDefinition(email)) {
    return { ok: true }
  }

  try {
    const origin = confirmOrigin(h)
    await sendEmail({
      to: email,
      subject: "Confirm your rnui.dev Digest subscription",
      html: confirmationHtml(origin, issued.token),
    })
  } catch (err) {
    // Deliberately an error rather than a quiet success: "check your inbox" is a
    // lie if nothing was sent, and the pending row left behind is harmless
    // because a pending row is never a Subscriber and never reaches the audience.
    console.error("subscribeEmail: confirmation send failed", err)
    return {
      ok: false,
      message: "We could not send the confirmation email. Please try again.",
    }
  }

  return { ok: true }
}
