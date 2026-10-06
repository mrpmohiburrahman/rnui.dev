# Link a Reader's accounts across providers instead of splitting their saved Demos

Type: task
Status: open
Blocked by: 03

## Question

Shipping two sign-in providers without account linking ships a bug that presents to users as
silent data loss. This ticket decides and builds the fix.

The problem, from Firebase's own documentation: with "one account per email address" **off**
(the default), a person who signs in with Google on a laptop and GitHub on a phone gets **two
Firebase accounts, two uids, and two saved-Demos lists**. We cannot tell them apart and cannot
tell that person their saves are split. From where they stand, the site lost their data.

Decided at grilling: keep both providers **and** build the linking path. This ticket does that.

Work:

- **Turn on "one account per email address"** in the Firebase console. Record it, because it
  changes behaviour for every Reader and is easy to toggle off by accident.
- **Handle `auth/account-exists-with-different-credential`.** This is the whole ticket. Per
  Firebase's docs, when the setting is on and an email already exists under a different provider,
  this error is thrown *with* the pending credential attached. Catch it, cache that credential
  (the docs specify `sessionStorage` for redirect mode, which is the mode a web OAuth flow uses),
  prompt the Reader for which account to continue as, then finish with `linkWithCredential`.
- **Get the failure mode right, not just the happy path.** The unacceptable outcome is a Reader
  locked out of their own saved Demos. Every branch must land somewhere: cancel, provider retry,
  or successful link. A dead end with an error toast is a regression against the split it
  replaces.
- **Decide what merging means when both accounts already hold saved Demos.** Union, most-recent-
  wins, or prefer the account being signed into. Union is the only option that loses nothing, and
  it mirrors what the browser-merge already does.
- Tests: link succeeds; link cancelled mid-flow; one account empty and one not; both non-empty;
  JWKS unreachable mid-flow (fails closed — do not drop the cached credential).

## Notes

This ticket exists because the alternative was shipping a known defect. If the linking path proves
more expensive than expected, the correct fallback is **one provider only** — a single door cannot
split, so there is no linking code to get wrong. Do not ship two doors without this working.