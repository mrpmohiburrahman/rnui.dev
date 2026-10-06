# How is a Firebase ID token verified on the way to D1?

Type: research
Status: resolved
Blocked by:

## Question

D1 has no `request.auth.uid`. Every write of a saved Demo must therefore prove who is writing,
and the proof is a Firebase ID token checked against Google's public JWKS. Establish the correct
and safe shape of that check before any route that depends on it is written.

Report, specifically:

- The exact verification steps: which JWKS endpoint, which issuer, which audience claim, and the
  algorithm. Name them exactly rather than describing them loosely.
- Whether `jose` or an equivalent is the right library here, or whether Firebase's Admin SDK
  should be used server-side instead, and what each choice costs. Note that the Admin SDK would
  mean shipping a service-account credential to Vercel, which is its own supply-chain question.
- What must be checked beyond the signature: expiry, issuer, audience, and whether a revoked or
  disabled account is detectable. Be explicit about what is **not** checkable, so the ADR does not
  overclaim.
- The JWKS caching story, and what happens on a cache miss.
- The read path as well as the write path. A saved list is read far more often than it is written,
  and reading someone's saved Demos must be as locked down as writing them.
- The concrete failure modes: an expired token, a token for a different project, a token signed
  by an unexpected key, a token for a user deleted from Firebase.

## Notes

This is security-sensitive code, and the recommendation is that it arrives with tests rather than
after them. Sizing this ticket's answer is also what tells us whether the provider choice needs
revisiting — a check this heavy would be a fair argument for going back to Firestore and its
native rules.
## Answer

Resolved 2026-10-06. Full report, with a working reference implementation:
`../research/firebase-id-token-verification.md`.

**Use `jose`, not the Admin SDK. The check is ~30 lines and unremarkable** — small enough that it
does not reopen the storage decision.

Keys: `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`.
Claims: `alg` must be `RS256`; `aud` must be our project ID; `iss` must be
`https://securetoken.google.com/<projectId>`; `sub` is the uid; `exp` in the future; `iat` and
`auth_time` in the past. Honour `Cache-Control: max-age` on the JWKS response.

**Why not the Admin SDK:** Firebase's docs state verifying with it *"requires a service
account"*, which would put a project-admin private key in Vercel's environment. We need a
signature check, not admin access.

**The one real gotcha, and it is not fixable by verifying harder:** a deleted or disabled
account's token stays cryptographically valid until it expires (ID tokens last an hour). Firebase
is explicit that revocation detection *"requires an extra network round trip"* to their backend.
The Admin SDK's `checkRevoked` would put that round trip on every request, reintroducing exactly
the per-request cost D1 was chosen to avoid; the documented alternative is Firestore Security
Rules, which we do not have.

This is proportionate for a saved-Demos list — the worst case is a deleted account editing its own
bookmarks for up to an hour, and no route can read anyone else's. It would **not** be acceptable
for payments, private data, or another person's records, and the ADR must say so. A periodic
D1 sweep on a stored `lastSeenAt` is the eventual mitigation; it belongs on the map's fog.

Three things in the reference implementation are load-bearing and easy to lose in a refactor:
pinned `algorithms: ["RS256"]` (blocks `alg: none` and HMAC downgrade), both `audience` **and**
`issuer` pinned to our project ID (rejects tokens from other Firebase projects), and **no
anonymous fallback** — a failed verification is an unauthenticated request, not an error to
swallow.

Fail closed when the JWKS endpoint is unreachable. That is correct, and it is a second reason
ticket 07 should not delete the local bookmark copy on success alone.
