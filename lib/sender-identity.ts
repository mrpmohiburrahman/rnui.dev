// lib/sender-identity.ts
//
// Ticket 04 settled the sender identity and both disclosure blocks, and asked
// ticket 06 to put them in one module rather than paste them into the form, the
// policy and the Digest separately: three copies of a postal address is three
// places for it to drift, and an identity block that differs between them is
// worse than either spelling of Cumilla.
//
// The signup block below is a CONSENT REQUEST, which CASL's ECPR s.4 binds —
// name, mailing address, contact method, and that consent can be withdrawn, all
// four present. The Digest footer (ticket 09) is a different block doing a
// different job: it carries CAN-SPAM's postal address and opt-out, and it is not
// a consent request and cannot become one. Do not swap them.

export const SENDER_NAME = "MD. MOHIBUR RAHMAN"

/**
 * Byte-identical in the form, the policy and the Digest footer. `Cumilla` is the
 * official romanisation since 2018; `Comilla` is the older spelling and is still
 * widely used. Either delivers — the postcode and office name carry the routing —
 * but ticket 04 picked one, so nobody "corrects" it later.
 */
export const POSTAL_ADDRESS = "Halima Nagar, Cumilla 3502, Bangladesh"

/**
 * Must stay reachable for 60 days after every send (CASL s.6(2)/(3), s.11), so
 * it is a standing obligation rather than a launch step. On the apex
 * deliberately: it outlives any change of email vendor.
 */
export const CONTACT_EMAIL = "hello@rnui.dev"

/**
 * Permanent. Changing either after the first send resets the sender reputation
 * that a 29-address list spends months building. `mail.rnui.dev`, never the
 * apex — map decision 8.
 */
export const FROM = "rnui.dev <digest@mail.rnui.dev>"
export const REPLY_TO = CONTACT_EMAIL

/** The real path. There is no `/privacy` route, whatever a hand-typed link says. */
export const PRIVACY_PATH = "/privacypolicy"

/**
 * The policy as an absolute URL, which is the only form an email can use — a
 * relative href in an inbox resolves against the mail client, not the site.
 *
 * Ticket 07 requires the policy linked from the signup form and from the Digest
 * footer. The form gets there through components/signup-disclosure.tsx and
 * PRIVACY_PATH above; every *sent* message goes through here, so the two
 * senders cannot drift onto different URLs and ticket 09's footer has the link
 * already built rather than hand-typing one.
 */
export function privacyUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}${PRIVACY_PATH}`
}

export const SIGNUP_HEADING = "Get the weekly Digest"

/**
 * Ticket 04's signup disclosure, verbatim, in the two pieces a form needs: the
 * last sentence has to be a real link, and splitting it here beats a regex at
 * the render site. SIGNUP_DISCLOSURE below joins them back, and that joined
 * string is both what the form shows and what every record stores — so what
 * somebody agreed to is provable from the record alone rather than from a guess
 * about which deploy they saw.
 */
export const SIGNUP_DISCLOSURE_BODY =
  `New Recordings added to rnui.dev, once a week. Sent by ${SENDER_NAME}, ` +
  `${POSTAL_ADDRESS}, ${CONTACT_EMAIL}. No sponsor mail, no third-party ` +
  `marketing, and your address is never shared. Unsubscribe any time — link ` +
  `in every email.`

export const SIGNUP_DISCLOSURE_POLICY_SENTENCE = "See our Privacy Policy."

export const SIGNUP_DISCLOSURE = `${SIGNUP_DISCLOSURE_BODY} ${SIGNUP_DISCLOSURE_POLICY_SENTENCE}`

/**
 * Bump this whenever SIGNUP_DISCLOSURE changes. Stored beside the disclosure
 * itself, which looks redundant and is not: the string proves the words, the
 * version makes two cohorts comparable without diffing prose.
 */
export const CONSENT_FORM_VERSION = "2026-08-15.1"

/**
 * The identity block as HTML, assembled once. Both senders paste it — the
 * confirmation email (ticket 06) and the broadcast script (ticket 05) — and
 * ticket 09's Digest footer will be the third. Assembling it here is the same
 * argument as the constants above, one level up: three copies of the assembled
 * block drift exactly as readily as three copies of the address.
 *
 * NOT the Digest footer, which additionally carries `{{SIGNUP_DATE}}` and the
 * unsubscribe link, and does a different legal job. This is only the identity.
 */
export const IDENTITY_BLOCK_HTML = `<p style="font-size:13px;color:#666">
rnui.dev — ${SENDER_NAME}<br>
${POSTAL_ADDRESS}<br>
${CONTACT_EMAIL}
</p>`
