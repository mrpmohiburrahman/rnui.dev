# Saving requires a social sign-in, verified into D1

Saving a Demo used to be browser-local and anonymous: `useRememberedSet` wrote Recording ids
into `localStorage` under `"bookmarkedItems"` and the server never saw them. We now require a
signed-in **Reader** to save, and a Reader's saved Demos live in Cloudflare D1 so they follow
them across devices. Identity is **base Firebase Auth**, social providers only. Every write is
authorised by verifying a Firebase ID token against Google's public JWKS with `jose`. The
`"bookmarkedItems"` value already sitting in a visitor's browser is merged into their account
once, on first sign-in, and the key is never written to again.

## Why this shape

**Firebase, and specifically base Firebase Auth.** The requirement was social sign-in including
Google, with no Google Cloud project of our own. Clerk and Supabase both require a developer to
create their own Google Cloud OAuth client, consent screen and verification for a *production*
instance — Clerk's own docs put it as "for production instances, you must provide custom
credentials" — which defeats the constraint outright. Firebase provisions a shared Google
client, so no console of ours is touched. Clerk Hobby was genuinely free (50,000 MRU, no credit
card) and remains a live option if this ever needs revisiting.

**Never enable Identity Platform.** This is the one irreversible-by-accident decision on the
effort. Base Firebase Auth has *unlimited* users on the Spark plan. Enabling Identity Platform
switches the billing model and drops Spark to **3,000 daily active users** — a 94% cut — while
doing nothing visible. Nothing this feature needs requires it: no MFA, no SAML, no audit logs.
The toggle sits in the Firebase console and nothing warns you. A future agent enabling it "for
user management" would silently break the free tier.

**D1, not Firestore.** Firestore on the Spark plan allows 50,000 reads/day and then *refuses*
further operations rather than throttling — so one viral day breaks saving sitewide until
midnight UTC, invisibly, discovered from a GitHub issue rather than a dashboard. D1's free tier
is roughly 100× our plausible peak. The usual counter-argument is that Firestore hands
`request.auth.uid` straight to its rules engine and needs no token verification; that is real,
and it is the price of D1. Hand-verifying costs ~30 lines and needs no service-account
credential in Vercel, which is why `jose` was chosen over the Admin SDK rather than the other
way round.

**`jose` over the Firebase Admin SDK.** Firebase's docs state that verifying with the Admin SDK
"requires a service account", which would put a project-admin private key in Vercel's
environment. We need a signature check, not admin access.

**Merge on first sign-in.** The alternatives either strand every existing visitor's saved list
(the server has never seen it and cannot recover it) or split one person's list in two. Merging
is the only option where nobody loses what they saved. The local copy is **kept** after a
successful merge: verification fails closed if Google's JWKS endpoint is unreachable, so
deleting the only copy on success can lose data when the very next call fails.

**Voting is untouched.** It stays anonymous and browser-local. Touching it would widen into the
paused `posthog-expansion` effort, which this does not reopen.

## Considered options

- **Clerk Hobby** — rejected only because production Google sign-in requires our own Google
  Cloud OAuth client. Prebuilt UI, genuinely the least work of any option, and worth revisiting
  if the no-GCP-project constraint is ever relaxed. Its Hobby plan also cannot remove "Secured by
  Clerk" branding.
- **Supabase Auth** — rejected for the same reason: its Google guide's first prerequisite is
  "Prepare a Google Cloud project". Free tier is 50,000 MAU, comparable to Firebase.
- **Firestore with `request.auth.uid` rules** — rejected on the daily-read-cap behaviour above.
  Reuses this repo's existing rules-test harness (`scripts/verify-firestore-rules.ts`), which is
  the strongest argument in its favour.
- **Two providers with no linking** — rejected because it ships a bug that presents to users as
  silent data loss. See below.

## Consequences

- **A Reader's saved Demos are server-side, so the glossary's "nothing on the server can read a
  Remembered set" is no longer the whole story.** `Remembered set` now describes voting alone
  and that sentence remains true rather than stale. The `"bookmarkedItems"` key survives only as
  merge input.
  **This amends one line of ADR-0008**, which recorded that `"bookmarkedItems"` and
  `"votedItems"` "are Remembered sets". That was accurate when written and is left as written,
  because an ADR is a record of a decision rather than a description of the present — but only
  `"votedItems"` still is one. The *reason* ADR-0008 gave for not renaming either key still holds
  in full: renaming `"bookmarkedItems"` still discards what a visitor has already saved, right up
  until the merge happens.
- **A deleted or disabled account's token stays valid for up to an hour.** Firebase ID tokens
  are stateless, so revocation costs a network round trip to Firebase on *every* request; the
  Admin SDK's `checkRevoked` would reintroduce exactly the per-request cost D1 was chosen to
  avoid, and the documented alternative is Firestore Security Rules. Accepted as proportionate
  for a saved-Demos list — the worst case is a deleted account editing its own saved Demos for an
  hour, and no route can read anyone else's. **This would not be acceptable for payments, private
  data, or another person's records**, and must be revisited if the feature ever grows into one of
  those. A periodic sweep over a stored `lastSeenAt` is the eventual mitigation.
- **Our name and logo cannot appear on Google's consent screen**, which shows the Firebase
  project ID instead. This is the entire measured cost of the no-GCP-project constraint: brand
  verification requires a Google Cloud project of our own, and brand verification governs
  appearance, not access. There is **no unverified-app warning** — that is triggered by
  *sensitive* OAuth scopes, and Firebase requests only `openid`/`email`/`profile`, which Google
  classifies as non-sensitive.
- **Two providers must link accounts or they must not both ship.** With Firebase's "one account
  per email address" off, one human signing in through Google on one device and GitHub on
  another gets two accounts and two saved-Demos lists. Turning it on surfaces
  `auth/account-exists-with-different-credential`, which we must handle and complete via
  `linkWithCredential` — otherwise the Reader is locked out of their own saves, which is worse
  than the split.
- **A saved-Demos read is one query per visitor, never one per Recording.** This is what keeps D1
  cheap, and retrofitting it means rewriting the read path. All D1 access sits behind one module
  so the discipline is structural rather than a rule to remember.
- **PostHog events `bookmark_added` and `bookmark_removed` keep their exact names** (ADR-0008).
  Firing them from the new path is not optional.
- **A Reader is not a Contributor.** One human may be both; the two are unrelated and the
  glossary now says so, because `user` was already on Contributor's avoid list and the new
  concept needed a name that could not be confused with it.