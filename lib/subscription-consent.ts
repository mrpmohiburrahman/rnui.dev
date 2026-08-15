// lib/subscription-consent.ts
//
// Double opt-in, as ordinary logic a test can import. Everything Firebase-shaped
// and everything Resend-shaped is injected, the same split lib/counters.ts makes
// against lib/counters-firestore.ts.
//
// Why double opt-in at all (ticket 06): confirmed opt-in is simultaneously the
// proof-of-consent record this site did not have AND the bot filter it did not
// have. One mechanism, both problems — which is why no captcha was added.

/**
 * A pending address: written, not yet confirmed, therefore NOT a Subscriber.
 * Only a confirmed address is a Subscriber, and only a Subscriber may exist in
 * the sending audience.
 */
export type PendingSignup = { id: string; email: string }

export type ConsentStore = {
  /**
   * The pending record this token addresses, or null. Null covers every way a
   * token can be no good — never issued, or already spent — because the caller
   * treats them identically and telling them apart would tell a stranger which
   * tokens exist.
   */
  findPending(token: string): Promise<PendingSignup | null>
  /**
   * Marks the record confirmed. That flag is the replay guard: `findPending`
   * returns null for an already-confirmed record, so a second click on the same
   * link does nothing.
   *
   * Not atomic with `findPending`, and deliberately not made so. Two clicks
   * racing can both pass the check, and the only consequence is `addContact`
   * running twice — which Resend answers with a 409 that addContact treats as
   * the no-op it is. A transaction would buy nothing for that.
   */
  confirm(id: string): Promise<void>
  addToAudience(email: string): Promise<void>
}

export function createConfirmSubscription(store: ConsentStore) {
  /** True if this token confirmed an address, false if there was nothing to confirm. */
  return async function confirmSubscription(token: string): Promise<boolean> {
    const pending = await store.findPending(token)
    if (!pending) return false

    // Consent is recorded BEFORE the audience write, and the order is the
    // decision. Firestore is the source of truth for the consent record (map
    // decision 12), so if the audience write then fails, the failure is "a
    // consenting person is not receiving the Digest yet" — recoverable, and
    // visible. The other order fails as "an address is in the sending audience
    // with no consent record behind it", which is the one outcome this whole
    // effort exists to prevent.
    await store.confirm(pending.id)
    await store.addToAudience(pending.email)
    return true
  }
}

/**
 * Reserved names (RFC 2606, RFC 6761) can never receive mail, so a confirmation
 * sent to one is a guaranteed hard bounce charged against a sending domain that
 * has not sent its first real Digest yet.
 *
 * Not hypothetical: tests/e2e/undrawn-routes.spec.ts submits an @example.com
 * address on every Playwright run, and .env.local carries a live RESEND_API_KEY.
 * Bot junk aims at the same names. The address is still written — the record is
 * the point — it just never becomes a send.
 */
// `(^|\.)` on both halves is what keeps `myexample.com` and `examples.com`
// deliverable: a reserved name is the whole label, not a suffix of one. The
// second half also has to match a bare `localhost`, which has no dot at all.
const RESERVED =
  /(^|\.)example\.(com|net|org)$|(^|\.)(test|invalid|localhost|example)$/

export function isUndeliverableByDefinition(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@").pop() ?? ""
  return RESERVED.test(domain)
}
