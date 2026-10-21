// lib/sender-identity.ts
//
// Ticket 04 settled the sender identity and both disclosure blocks, and asked
// ticket 06 to put them in one module rather than paste them into the form, the
// policy and the Digest separately: three copies of a postal address is three
// places for it to drift, and an identity block that differs between them is
// worse than either spelling of Cumilla.
//
// The signup block requests consent. It names the sender and states the right
// to withdraw consent. Its policy link provides the postal address and contact
// email. The Digest footer includes those details directly. The blocks serve
// different purposes.

export const SENDER_NAME = "MD. MOHIBUR RAHMAN"

/**
 * Byte-identical in the form, the policy and the Digest footer. `Cumilla` is the
 * official romanisation since 2018; `Comilla` is the older spelling and is still
 * widely used. Either delivers, the postcode and office name carry the routing -
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
 * apex, map decision 8.
 */
export const FROM = "rnui.dev <digest@mail.rnui.dev>"
export const REPLY_TO = CONTACT_EMAIL

/** The real path. There is no `/privacy` route, whatever a hand-typed link says. */
export const PRIVACY_PATH = "/privacypolicy"

/**
 * The policy as an absolute URL, which is the only form an email can use, a
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

/**
 * "Get the Digest", not "Get the weekly Digest". The heading sat above the form
 * in the footer and on /subscribe, so the weekly promise was made twice: once
 * here and once in SIGNUP_DISCLOSURE_BODY. Both went in the same edit, because
 * a heading that promises a schedule the Digest does not keep is the more
 * visible of the two.
 */
export const SIGNUP_HEADING = "Get the Digest"

/**
 * The consent request, as the maintainer chose it on 2026-10-09, in the two
 * pieces a form needs: the last sentence has to be a real link, and splitting it
 * here beats a regex at the render site. SIGNUP_DISCLOSURE below joins them
 * back, and that joined string is both what the form shows and what every record
 * stores, so what somebody agreed to is provable from the record alone rather
 * than from a guess about which deploy they saw.
 *
 * Six clauses became three, and every removal is recorded here because this
 * string is the consent evidence: `consentText` on every record is exactly these
 * words plus SIGNUP_DISCLOSURE_POLICY_SENTENCE
 * (app/actions/subscribe-email.ts:127).
 *
 * 1. "New Recordings added to rnui.dev, once a week." went first, per ticket 01.
 *    The cadence is undecided, and a fixed-frequency promise is broken by an
 *    ad-hoc send and by any week with nothing new. The promise line above the
 *    field carries the frequency instead.
 * 2. The maintainer removed POSTAL_ADDRESS and CONTACT_EMAIL from the string.
 *    The policy link provides both details. Ticket 06 accepts this reading of
 *    CASL ECPR s.4(d) as defensible, not certain. Every Digest footer still
 *    includes the address through IDENTITY_BLOCK_HTML.
 * 3. "link in every email" went with them. CASL s.4(e) wants a statement that
 *    consent can be withdrawn, which "Unsubscribe any time" is on its own; the
 *    mechanism is evidenced by the stored record and by the link actually being
 *    in the sent mail.
 *
 * The policy sentence keeps its existing text. The linked policy publishes
 * the postal address and contact email. Ticket 06 records that decision.
 *
 * "Unsubscribe any time" must survive every future edit. It is the only
 * withdrawal statement in the string, and tests/subscription-consent.test.ts
 * pins it for that reason.
 */
export const SIGNUP_DISCLOSURE_BODY =
  `Sent by ${SENDER_NAME} from rnui.dev. Unsubscribe any time.`

/**
 * What a Reader is signing up for, stated in ordinary prose and shown above the
 * email field on every capture surface.
 *
 * It used to live inside SIGNUP_DISCLOSURE_BODY as "New Recordings added to
 * rnui.dev, once a week", which was the only description the footer form had.
 * Removing it left the footer promising nothing at all, so it moved here rather
 * than staying behind. Keeping it in one constant is what stops the three
 * surfaces (footer, /subscribe, popup) drifting apart again.
 *
 * No frequency, per ticket 01: an ad-hoc send and a week with nothing new both
 * break a weekly promise. No "unsubscribe anytime" either — that belongs to the
 * disclosure below the field, which is the string stored as consent evidence
 * and the only copy CASL s.4(e) is satisfied by. Saying it in both places is
 * what made the popup feel cramped.
 */
export const SIGNUP_PROMISE =
  "New Recordings, only when there is something new. Confirm once."

export const SIGNUP_DISCLOSURE_POLICY_SENTENCE = "See our Privacy Policy."

export const SIGNUP_DISCLOSURE = `${SIGNUP_DISCLOSURE_BODY} ${SIGNUP_DISCLOSURE_POLICY_SENTENCE}`

/**
 * Bump this whenever SIGNUP_DISCLOSURE changes. Stored beside the disclosure
 * itself, which looks redundant and is not: the string proves the words, the
 * version makes two cohorts comparable without diffing prose.
 */
export const CONSENT_FORM_VERSION = "2026-10-09.1"

/**
 * The identity block as HTML, assembled once. Both senders paste it, the
 * confirmation email (ticket 06) and the broadcast script (ticket 05), and
 * ticket 09's Digest footer will be the third. Assembling it here is the same
 * argument as the constants above, one level up: three copies of the assembled
 * block drift exactly as readily as three copies of the address.
 *
 * NOT the Digest footer, which additionally carries `{{SIGNUP_DATE}}` and the
 * unsubscribe link, and does a different legal job. This is only the identity.
 */
export const IDENTITY_BLOCK_HTML = `<p style="font-size:13px;color:#666">
rnui.dev, ${SENDER_NAME}<br>
${POSTAL_ADDRESS}<br>
${CONTACT_EMAIL}
</p>`
