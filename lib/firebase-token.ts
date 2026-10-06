// lib/firebase-token.ts
//
// Who, if anyone, is making this request.
//
// This is the only thing standing between an anonymous internet and a Reader's
// saved Demos. It answers exactly one question — is this bearer token a valid
// Firebase ID token for *our* project, and who is it for — and it answers it by
// checking a signature against Google's public keys. There is no admin SDK, so
// there is no service-account private key anywhere in this project's
// environment, which is the whole reason this file is 60 lines rather than a
// dependency on a credential with admin access to Firebase.
//
// From sign-in-to-save ticket 02, whose research is at
// .scratch/sign-in-to-save/research/firebase-id-token-verification.md.
//
// THREE THINGS HERE ARE LOAD-BEARING AND EASY TO LOSE IN A REFACTOR
//
//   1. `algorithms: ["RS256"]` is pinned. Without it an attacker may present an
//      `alg: none` token, or downgrade to HMAC using a key they published in the
//      JWKS as the shared secret.
//   2. `audience` AND `issuer` are both pinned to our project id. A perfectly
//      valid Firebase ID token from a *different* Firebase project — including
//      one of the maintainer's side projects — is otherwise accepted here, and
//      would be accepted as a Reader.
//   3. There is no anonymous fallback. A throw means the request is
//      unauthenticated. Nothing in this project may catch that throw and
//      substitute a blank identity, because "signed out" and "signed in as
//      someone whose token we failed to check" must not be the same state.
//
// WHAT THIS CANNOT DO, because ADR-0013 records it as an accepted limitation
//
// It cannot detect a deleted or disabled account. Firebase ID tokens are
// stateless and last an hour, so a token belonging to an account deleted from
// Firebase stays valid until it expires. Detecting that needs a network round
// trip to Firebase on every request, which is the per-request cost D1 was
// chosen to avoid; see the research report for why Firestore Security Rules
// would have got it for free and we do not have them. For a saved-Demos list the
// worst case is a deleted account editing its own list for up to an hour, and no
// request here can read anybody else's. This would NOT be acceptable for
// payments, private data, or another person's records.

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

/**
 * Google's public signing keys for Firebase ID tokens.
 *
 * Read at call time, not at import, so this file imports in a test with no
 * environment set and a missing project id fails at the request that needed it
 * rather than at module load. No NEXT_PUBLIC_ prefix: this must never be read on
 * a client, and `FIREBASE_PROJECT_ID` — not `NEXT_PUBLIC_FIREBASE_PROJECT_ID` —
 * is what keeps it server-side even though the value is public anyway.
 */
function projectId(): string {
  const id = process.env.FIREBASE_PROJECT_ID
  if (!id) {
    throw new Error(
      "FIREBASE_PROJECT_ID is not set. This is the Firebase project the site's " +
        "NEXT_PUBLIC_FIREBASE_API_KEY belongs to; without it a token cannot be " +
        "checked against our issuer and audience, and no request is authenticated."
    )
  }
  return id
}

/**
 * Google's public signing keys for Firebase ID tokens. Public, and Google's, and
 * hard-coded rather than read from the environment — there is nothing here to
 * configure and a wrong value would be a security bug rather than a missing one.
 */
const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"

/**
 * Firebase's own public key set.
 *
 * Module-level on purpose, and this is load-bearing rather than tidiness.
 * `createRemoteJWKSet` memoises the fetched keys per instance, so one instance
 * means one fetch per cache lifetime. Constructing it inside `verifyReader` —
 * which is where a draft of this file had it, because the project id is read at
 * call time and the two got conflated — compiles to a JWKS fetch on every single
 * verification, putting a network round trip to Google on the save path. That is
 * the exact per-request cost D1 was chosen to avoid, reintroduced through the
 * front door. `tests/firebase-token.test.ts` counts the fetches.
 *
 * What the cache actually does, measured against jose 6.2.12 rather than taken
 * from what its docs used to say:
 *
 *   - It does **not** honour `Cache-Control: max-age` on the response, whatever
 *     Google sends. The TTL is the `cacheMaxAge` option, which defaults to
 *     **10 minutes**, and that is what applies. Ticket 02's report said jose
 *     "honours Cache-Control itself"; that is no longer true of this version, and
 *     a comment here claiming otherwise would be a guess dressed as a fact.
 *   - On a `kid` it has not seen, it refetches at most once per **30 second**
 *     cooldown, and only if the key set is already older than that.
 *
 * Together those mean a Firebase key rotation does not require a deploy and does
 * not require a cache purge: for at most ~30 seconds after the rotation, saves
 * fail closed, and then the next token with the new `kid` triggers the refetch
 * and succeeds. That is the real behaviour and it is worth knowing, because the
 * instinct on seeing "saves stopped working" is to redeploy — which changes
 * nothing.
 *
 * It holds no secret and depends on no environment variable, so there is nothing
 * in it to read late.
 */
const JWKS = createRemoteJWKSet(new URL(JWKS_URL))

/**
 * A signed-in Reader, as far as this check can tell.
 *
 * `uid` is the verified `sub` and is the ONLY identity the rest of the app may
 * use. `email` is carried because the sign-in sheet wants to greet somebody, and
 * it is never matched on: CONTEXT.md is explicit that a Reader's display name is
 * not stable and never belongs to the catalogue, and ADR-0013 reserves
 * cross-provider linking for ticket 08. `emailVerified` is kept separate from
 * `email` rather than folded into it, because "we have an address" and "the
 * provider says the address is theirs" are different facts.
 */
export type VerifiedReader = {
  uid: string
  email: string | undefined
  emailVerified: boolean | undefined
}

/**
 * Verify a bearer token and return the Reader it identifies.
 *
 * Throws on anything that does not verify, including every one of these, each of
 * which `tests/firebase-token.test.ts` pins:
 *
 *   - a missing or malformed `Authorization` header, rejected before any crypto
 *   - an expired token
 *   - a token whose `aud` is another Firebase project
 *   - a token whose `iss` is another Firebase project
 *   - a token signed by a key not in the JWKS (`kid` we have never seen)
 *   - `alg: none`, and an HMAC downgrade using a public key as the secret
 *   - a valid token carrying an empty `sub`
 *   - Google's JWKS endpoint being unreachable — **fails closed**
 *
 * The last one is the only case that is an outage rather than a rejection, and it
 * is correct: there is no cached-key fallback past `max-age`, because falling back
 * is how a token that should have been rejected gets accepted. The consequence
 * downstream is recorded in sign-in-to-save ticket 07: the merge of a browser's
 * existing bookmarks must not delete the local copy on a successful merge alone,
 * because the very next call can fail closed.
 */
export async function verifyReader(
  authorization: string | null | undefined
): Promise<VerifiedReader> {
  const id = projectId()

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token")
  }
  const token = authorization.slice("Bearer ".length).trim()
  if (token === "") {
    throw new Error("Missing bearer token")
  }

  let payload: JWTPayload
  try {
    ;({ payload } = await jwtVerify(token, JWKS, {
      // (1) pinned: blocks `alg: none` and HMAC downgrade.
      algorithms: ["RS256"],
      // (2) both pinned to our project: a valid token from any other Firebase
      // project is rejected.
      issuer: `https://securetoken.google.com/${id}`,
      audience: id,
    }))
  } catch (cause) {
    // One message for every cryptographic failure, deliberately. Saying which
    // check failed turns this endpoint into an oracle for probing tokens, and
    // the caller has no use for the distinction: a token that did not verify is
    // an unauthenticated request, full stop.
    throw new Error("Invalid session token", { cause })
  }

  // jwtVerify checks exp, iat and nbf but not that `sub` is present and non-empty,
  // and an empty uid would key a Reader's saved Demos to "" — which would put
  // every such visitor on the same row.
  if (typeof payload.sub !== "string" || payload.sub === "") {
    throw new Error("Invalid session token")
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified:
      typeof payload.email_verified === "boolean"
        ? payload.email_verified
        : undefined,
  }
}

/**
 * The Reader a request belongs to, or null when nobody is signed in.
 *
 * The ONLY safe way to ask "is this request signed in?" in this project. It is a
 * single funnel through `verifyReader`, so "signed out" is one place rather than
 * N try/catch blocks that each decide for themselves what an unverified token
 * means.
 *
 * The rule this exists to make hard to get wrong: **this distinguishes "no token"
 * from "a token that failed to verify" by treating both as signed out.** It does
 * not distinguish them, on purpose — neither state is ever allowed to become an
 * identity — but it does not swallow the failure either. A route that must know
 * the difference (sign-in, and anything else where "your session expired" is a
 * different answer from "you are not signed in") calls `verifyReader` and lets
 * the throw reach a 401. Everywhere else, `null` is the honest answer and the
 * error is logged by the route's own error handling.
 */
export async function currentReader(
  authorization: string | null | undefined
): Promise<VerifiedReader | null> {
  try {
    return await verifyReader(authorization)
  } catch {
    return null
  }
}
