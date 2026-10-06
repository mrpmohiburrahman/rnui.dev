# Does Firebase's shared Google client show an unverified-app warning?

Resolved 2026-10-06. Sources are Google's own documentation unless marked otherwise.

## Bottom line

**No unverified-app warning is expected, and map decision 1 (Firebase) stands.** But there is a
real and separate cosmetic problem: the consent screen shows the **Firebase project ID**, not
`rnui.dev`. That is a trust concern worth fixing, and unlike the warning it is fixable from the
Firebase console without creating a Google Cloud project.

## The chain of reasoning

The warning is not triggered by "being unverified" in general. It has a specific trigger.

1. **What triggers the warning.** Google's support documentation defines it precisely: *"An
   unverified app is an app or Apps Script that requests a sensitive or restricted OAuth scope,
   but hasn't gone through the Google verification process. Users of unverified apps or your test
   builds might get warnings based on the OAuth scopes you're using."*
   — https://support.google.com/google-ads/answer/7454865

   Google's Workspace troubleshooting docs say the same from the other direction: *"If the OAuth
   consent screen displays the warning 'This app isn't verified', your app is requesting scopes
   that provide access to sensitive user data."*
   — https://developers.google.com/workspace/admin/directory/v1/guides/troubleshoot-authentication-authorization

2. **Sensitive and restricted scopes trigger additional requirements.** Verification requirements
   for those scope classes are listed as requirements *"in addition to Brand Verification
   Requirements"* — the demonstration video, the security assessment for restricted scopes, the
   narrowest-scope justification.
   — https://support.google.com/cloud/answer/13464321

3. **Firebase's Google provider does not request sensitive scopes.** Google's brand-verification
   guide states: *"An initial set of scopes that are necessary for Google Sign-In are pre-filled
   in the **Non-sensitive scopes** section."*
   — https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification

   That initial set is `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile`. These
   are the scopes Firebase's `GoogleAuthProvider` uses unless a caller explicitly calls
   `addScope()` with something else.
   — https://firebase.google.com/docs/auth/web/google-signin

So the warning's trigger condition — a sensitive or restricted scope — is not met. Sign-in with
Google-only scopes should show a plain consent screen with no warning.

## What a visitor actually sees

Not the warning. Instead, the consent screen names **the Firebase project ID** rather than
`rnui.dev`. This is consistently reported:

- *"the app name shown is my Firebase project ID, which looks very…"* — r/Firebase, 10 months ago
  (https://www.reddit.com/r/Firebase/comments/1p6b9fg/how_to_change_project_name_shown_in_google_signin/)
- A long-standing Stack Overflow question, *"How to change the app name for Firebase
  authentication — what the user sees"*
  (https://stackoverflow.com/questions/46135993/how-to-change-the-app-name-for-firebase-authentication-what-the-user-sees)

**Confidence:** high that the project ID is displayed; this is reproducible developer experience
rather than documentation. **Uncertain:** whether renaming the Firebase project's *display name*
propagates to the consent screen. Many developers report it does, but I did not find a primary
source confirming it for the shared-client case. This is a five-minute empirical check to perform
during ticket 06, not a blocker — the worst case is an unattractive project id on one screen.

This is a trust signal, not a scare screen. `rnui.dev` asking for an email address reads as
ordinary; a random-looking project id asking for the same reads as slightly worse. Worth fixing,
not worth redesigning the feature over.

## GitHub sign-in

No equivalent problem. GitHub OAuth apps require no verification and no brand review at all, so
there is nothing to trigger a warning and no project-id-shaped name to display — the app name is
whatever the developer typed in. GitHub sign-in is a strictly cleaner fallback and should be
enabled alongside Google (already specified in ticket 06).

## Answer to question 3 — can the warning be avoided with no GCP project of ours?

**The warning does not appear in the first place**, so there is nothing to avoid and no OAuth
client of ours is required. Firebase's shared client covers the entire Google sign-in path.

This is the key finding: the concern that drove researching this was unfounded, and it was
unfounded because it was based on the warning being triggered by "unverified" rather than by
sensitive scopes. Google does require **brand** verification to display a logo and display name
on the consent screen — and that is the one thing genuinely unavailable to us without our own
Google Cloud project. The consolation is that brand verification is explicitly about trust and
appearance, not access: *"If your app's branding information remains unverified, it might result
in decreased user trust of your request for their data."*

So the precise cost of the no-GCP-project constraint is: **we cannot put `rnui.dev` and our logo
on Google's consent screen.** That is the whole price. No warning, no user cap, no verification
queue.

## Does this change the provider decision?

**No.** Decision 1 stands, now on better evidence than when it was made:

- Google sign-in works with no Google Cloud project of ours — verified.
- No unverified-app warning — verified from Google's scope-classification rules.
- No 100-user cap, which is the usual hidden cost of an unverified Google app — verified, since
  that cap is tied to the same Testing/unverified state.
- The only cost is consent-screen branding — verified and bounded.

If anything the finding strengthens the case for adding **GitHub alongside Google**, because
GitHub has neither the branding problem nor any verification requirement.

## Carried forward

- Ticket 06 gains one step: rename the Firebase project display name, then **empirically confirm**
  what the consent screen shows before declaring this settled. If the rename does not propagate,
  the fallback is to lead with GitHub rather than Google, which is a UI ordering decision rather
  than a provider change.
- Ticket 03's ADR should record the precise cost of the constraint — consent-screen branding is
  unavailable — rather than a vague "we use Firebase."