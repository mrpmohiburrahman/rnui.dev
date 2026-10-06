# Does Firebase's shared Google client show an unverified-app warning?

Type: research
Status: resolved
Blocked by:

## Question

Firebase provisions a shared Google OAuth client so that Google sign-in works without our own
Google Cloud project. Does a visitor signing in with that client see a "Google hasn't verified
this app" or "This app is blocked" consent screen?

This can invalidate map decision 1. A frightening warning on a catalogue's Save button is a
conversion problem severe enough to reconsider the provider — and if the warning is present and
unavoidable, that is an input the maintainer has not yet weighed, because it was not known when
they chose Firebase.

Report, specifically:

- Whether the warning appears, and under what conditions it does and does not (publishing status,
  scopes requested, whether the app is in Testing or In production, risk-assessment triggers).
- Whether Firebase's shared client is exempt because Google recognises it, or because it is
  unverified and shows the warning.
- Whether the warning is avoidable *without* creating our own Google Cloud project — this is the
  load-bearing question. A workaround that needs an OAuth client of ours defeats the entire reason
  for choosing Firebase.
- Whether GitHub sign-in, as a fallback provider, has any equivalent warning. GitHub OAuth apps
  need no verification, so this may be the cleaner path if Google is noisy.
- What a visitor actually sees, quoted, rather than paraphrased.

## Notes

Fire this before any code is written. It is cheap, and it is the one open question that can still
change the provider decision.
## Answer

Resolved 2026-10-06. Full report: `../research/firebase-google-unverified-warning.md`.

**No warning appears, and map decision 1 stands.**

The warning is not triggered by being unverified in general. Google's support docs define it
precisely: an unverified app is one *"that requests a sensitive or restricted OAuth scope, but
hasn't gone through the Google verification process."* Firebase's Google provider requests only
`openid`, `userinfo.email` and `userinfo.profile` — which Google's own brand-verification guide
lists under *"An initial set of scopes that are necessary for Google Sign-In are pre-filled in
the Non-sensitive scopes section."* The trigger condition is not met, so there is no warning, no
100-user cap, and no verification queue.

**The real, smaller problem:** the consent screen shows the **Firebase project ID**, not
`rnui.dev`. Consistently reported by developers (r/Firebase, Stack Overflow). Uncertain whether
renaming the project's display name propagates — a five-minute empirical check for ticket 06.

**The precise cost of the no-GCP-project constraint** is therefore: *we cannot put `rnui.dev`
and a logo on Google's consent screen.* Brand verification exists for trust and appearance, not
access. That is the whole price, and it is bounded.

GitHub sign-in has neither problem — no verification requirement and no project-id-shaped name.
Enable it alongside Google.

Carried forward: ticket 06 gains a rename-then-verify step, and should fall back to leading with
GitHub rather than Google if the rename does not propagate. That is a UI ordering change, not a
provider change.
