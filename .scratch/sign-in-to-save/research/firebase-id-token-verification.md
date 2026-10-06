# How is a Firebase ID token verified on the way to D1?

Resolved 2026-10-06. Sources are Google's and Firebase's own documentation.

## Bottom line

The check is **small and unremarkable** — around 30 lines with `jose`, no service-account
credential anywhere in our stack, and no network round trip on the hot path after the first
cache warm. It is not heavy enough to argue for going back to Firestore.

The one genuine gotcha: **a deleted or disabled account's token stays cryptographically valid
until it expires.** This is not fixable by verifying harder, and the ADR must not claim
otherwise.

## The exact verification

Firebase's own documentation specifies this precisely
(https://firebase.google.com/docs/auth/admin/verify-id-tokens).

### Keys

Public keys come from:

```
https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com
```

Firebase's docs also give the older x509 form, and instruct you to *"Use the value of `max-age`
in the `Cache-Control` header of the response from that endpoint to know when to refresh the
public keys."* `jose`'s `createRemoteJWKSet` handles this, honouring `Cache-Control` itself.

### Header claims

| Claim | Requirement |
| --- | --- |
| `alg` | `"RS256"` |
| `kid` | Must correspond to one of the public keys from the endpoint above |

### Payload claims

| Claim | Requirement |
| --- | --- |
| `aud` | Must be **our Firebase project ID** |
| `iss` | Must be `"https://securetoken.google.com/<projectId>"`, same project ID as `aud` |
| `sub` | Non-empty string; **this is the `uid`** |
| `exp` | In the future (seconds since UNIX epoch) |
| `iat` | In the past |
| `auth_time` | In the past |

`sub` is the uid to store against saved Demos.

## Library choice

**Use `jose`. Do not use the Firebase Admin SDK.** The reasoning:

Firebase's docs present two options. The Admin SDK's `verifyIdToken()` is the documented happy
path, but Firebase states: *"To verify ID tokens with the Firebase Admin SDK, you must have a
service account."* That means a service-account JSON private key would have to live in Vercel's
environment as a credential capable of admin access to the whole Firebase project. We do not need
that power to check a signature.

`jose` verifies against the same public JWKS with no credential at all. Firebase's docs explicitly
endorse the third-party route: *"verify the header, payload, and signature of the ID token"*, then
list exactly the claim constraints above.

The trade-off is that we re-implement checks the Admin SDK does for us. Those checks are six rows
in a table, which is why the recommendation is `jose`.

## What is NOT checkable

This is the part the ADR must get right, because it is where an overclaim becomes a security
assumption nobody tested.

**Revocation is not detectable from the token alone.** Firebase is explicit: *"Because Firebase ID
tokens are stateless JWTs, you can determine a token has been revoked only by requesting the
token's status from the Firebase Authentication backend. For this reason, performing this check on
your server is an expensive operation, requiring an extra network round trip."*
— https://firebase.google.com/docs/auth/admin/manage-sessions

Firebase documents two ways to check, and both are worse for us than the limitation is worth:

1. `verifyIdToken(token, checkRevoked = true)` — a network round trip to Firebase on **every**
   request. That defeats the point of choosing D1 over Firestore, because it reintroduces a
   per-request network dependency and a per-request latency cost.
2. Firestore Security Rules comparing `auth.token.auth_time` against a stored `revokeTime` — a
   solution for people who chose Firestore. Not available to us.

**Accept it, and state the consequence honestly.** If someone deletes their Firebase account, an
already-issued ID token remains valid for the remainder of its lifetime. Firebase's docs state
ID tokens *"last for an hour"*.

For a saved-Demos list this is a proportionate trade: the worst outcome is that a deleted account
keeps the ability to read and edit its own bookmark list for up to an hour, and the D1 rows are
not readable by anyone else either way. It is **not** acceptable for anything involving payments,
private data, or another person's records — and it should be recorded as a constraint so this
decision is revisited if the feature ever grows into one of those.

The mitigation, when wanted, is a periodic sweep: store a `lastSeenAt` per account in D1 and delete
rows whose account has been gone for longer than the token lifetime. That is a scheduled job, not a
hot-path cost, and it belongs on the map's fog rather than in this ticket.

## Read path

Reading a saved list must be at least as locked down as writing one. Concretely, for both:

- The uid used in the query comes **only** from the verified `sub` claim. Never from a request
  body, query parameter, or header the client controls.
- D1 is reached through the single module ticket 05 defines, so no route can construct its own
  query against another account's saved Demos.
- The query itself is scoped by uid, so even a logic error in a route cannot widen it — a missing
  uid filter returns the writer's own empty list rather than anyone's data.

## Reference implementation

```ts
// lib/firebase-token.ts
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID
if (!PROJECT_ID) throw new Error("FIREBASE_PROJECT_ID is not set")

// Firebase's own public keys. `jose` honours the Cache-Control max-age on this
// response, so this is one fetch per cache lifetime rather than one per request.
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
)

export type VerifiedVisitor = {
  uid: string
  email: string | undefined
  emailVerified: boolean | undefined
}

/**
 * Verify a bearer token and return the visitor it identifies.
 *
 * Throws on anything unverified. Callers must not fall back to an anonymous
 * identity — a failed verification is an unauthenticated request, not an error
 * to swallow.
 *
 * NOT checked, and deliberately so: whether the account has since been deleted
 * or disabled. Firebase ID tokens are stateless, so that costs a network round
 * trip to Firebase on every request. See the ADR and this file's header.
 */
export async function verifyVisitor(
  authorization: string | null
): Promise<VerifiedVisitor> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token")
  }
  const token = authorization.slice("Bearer ".length)

  let payload: JWTPayload
  try {
    ;({ payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    }))
  } catch (cause) {
    throw new Error("Invalid session token", { cause })
  }

  // jwtVerify checks exp/iat but not that sub is present and non-empty.
  if (typeof payload.sub !== "string" || payload.sub === "") {
    throw new Error("Session token has no subject")
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified:
      typeof payload.email_verified === "boolean" ? payload.email_verified : undefined,
  }
}
```

Three things in that shape are load-bearing and easy to lose in a refactor:

- **`algorithms: ["RS256"]`** is pinned so an attacker cannot present an `alg: none` token or
  downgrade to HMAC using a public key as the secret.
- **`audience` and `issuer` are both pinned to our project ID**, so a valid token minted by a
  different Firebase project — including the maintainer's own side projects — is rejected.
- **There is no anonymous fallback.** A thrown error means the request is unauthenticated.

## Failure modes

| Condition | Behaviour |
| --- | --- |
| Missing or malformed `Authorization` | Throws before any crypto |
| Expired token | `jwtVerify` throws on `exp` |
| Token from a different Firebase project | Throws on `aud` / `iss` |
| Signed by an unexpected key | `kid` not in JWKS; throws, and triggers a JWKS refetch |
| `alg: none` or HMAC downgrade | Rejected by the pinned algorithm list |
| JWKS endpoint unreachable | Throws. **Fail closed** — no cached-key fallback past `max-age` |
| Account deleted or disabled | **Still accepted until the token expires** (up to ~1 hour). Documented, not fixed |
| Token valid but `sub` empty | Throws |

The JWKS-unreachable case deserves emphasis because it is the one that produces an outage rather
than a rejection: if Google is briefly unreachable and `jose` has no cached key, every save fails.
That is correct behaviour — failing closed — and it is another reason the merge in ticket 07 should
not delete the local copy on success alone.