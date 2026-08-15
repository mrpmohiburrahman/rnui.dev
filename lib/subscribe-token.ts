// lib/subscribe-token.ts
//
// The confirmation token, signed so that only this server can mint one.
//
// Why signing rather than a bare random id. The signup write goes through the
// *client* Firebase SDK — a server action uses the same public config a browser
// does — so Firestore cannot tell our write from anybody else's, and
// `allow create` on the signup collection is open by necessity. Without a
// signature an attacker plants their own pending record at a document id they
// chose:
//
//     setDoc(doc(db, "emails", "id-i-picked"),
//            { email: "victim@example.org", confirmed: false, … })
//     GET /api/confirm-subscription?token=id-i-picked
//
// …and the confirm route would happily push `victim@example.org` into the Resend
// audience, having sent that person nothing. That is double opt-in defeated end
// to end, and it is the one outcome this ticket exists to prevent.
//
// So the URL token is `<id>.<signature>` while the *document id* stays the bare
// `<id>`. An attacker can still write junk documents — they always could, and
// nothing here changes that — but they cannot produce a signature for one, so no
// planted record is ever confirmable.
//
// HMAC-SHA256 over the id, not a JWT: there are no claims, no expiry to encode
// and no third party to interoperate with, so a library would be a dependency
// for two calls into node:crypto.

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

/**
 * Read at call time, never at import, so a build without it still builds and the
 * failure lands on the one request that needs it. No NEXT_PUBLIC_ prefix: this
 * must never reach a client bundle, or minting a token becomes public.
 */
function secret(): string {
  const s = process.env.SUBSCRIBE_TOKEN_SECRET
  if (!s) {
    throw new Error(
      "SUBSCRIBE_TOKEN_SECRET is not set — refusing to issue or accept a " +
        "confirmation token, because an unsigned one lets anybody confirm an " +
        "address they do not own."
    )
  }
  return s
}

function sign(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("base64url")
}

export type IssuedToken = {
  /** The Firestore document id. Bare, unsigned — the signature is not stored. */
  id: string
  /** What goes in the confirmation link. */
  token: string
}

export function issueToken(): IssuedToken {
  // 122 bits from the platform CSPRNG, and the document id on its own.
  const id = randomUUID()
  return { id, token: `${id}.${sign(id)}` }
}

/**
 * The document id this token authorises, or null if it authorises nothing.
 *
 * Null covers a token that was never issued, one whose signature does not match,
 * and one that is simply malformed — the caller treats all three identically,
 * and distinguishing them would tell an attacker which half they got right.
 */
export function verifyToken(token: string): string | null {
  const cut = token.lastIndexOf(".")
  if (cut <= 0) return null
  const id = token.slice(0, cut)
  const provided = token.slice(cut + 1)

  const expected = sign(id)
  // Length must match before timingSafeEqual, which throws on a length mismatch
  // rather than returning false.
  if (provided.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(provided), Buffer.from(expected)))
    return null
  return id
}
