// lib/turnstile-shared.ts
//
// The two Turnstile values that both halves need, in a module with no server code
// in it.
//
// Why this file exists at all: `TURNSTILE_FIELD` and `SUBMIT_ACTION` are read by
// the browser widget and by the server verifier, and they have to agree. A widget
// minting action `submit` against a verifier comparing `signup` refuses every
// visitor with `action-mismatch`, which reads as "the form is broken" and is
// invisible in any log that does not name the action. So they are written once.
//
// They cannot live in lib/turnstile.ts, because that module calls Siteverify and
// must never reach a browser bundle — Cloudflare's own rule for this integration
// is "Do not call siteverify from the browser. Always: browser → user's backend →
// siteverify." Importing the constants from there would pull the verifier in with
// them. Same split, same reason, as lib/counters.ts against
// lib/counters-firestore.ts.
//
// public-submissions ticket 07.

/**
 * The field the widget posts its token under. Cloudflare's name for it, not ours
 * — it is the key the endpoint reads out of the multipart body.
 */
export const TURNSTILE_FIELD = "cf-turnstile-response"

/**
 * The action this surface mints tokens under.
 *
 * Arbitrary but permanent in effect: Siteverify echoes the action back, and
 * lib/turnstile.ts compares the echo against this constant. Changing it means
 * changing it in both places at once, which is exactly why there is one place.
 */
export const SUBMIT_ACTION = "submit"
