# Link a Reader's accounts across providers instead of splitting their saved Demos

Type: task
Status: resolved
Blocked by: 03

## Answer — resolved 2026-10-07

The defect is closed and the path behind ticket 06's dead-end sentence now exists.

### The setting

**"One account per email address" is ON.** `signIn.allowDuplicateEmails: false`, verified
by reading the config back — and verified *meaningfully*, because the API omits a field
that is `false`. Setting it `true` round-tripped and read back `True`, which is what
proves the later absence means false rather than "never set". Until this was done, two
providers meant one human got two uids and two saved-Demos lists — a bug that could not
fire until 06 deployed, and would have fired the moment it did.

### The path

`getRedirectResult` rejects with `auth/account-exists-with-different-credential` carrying
the credential Firebase was about to use. That is cached, and the sheet offers the *other*
door. Signing in through it makes `onAuthStateChanged` fire with a signed-in Reader and a
cached credential at once — which is exactly the precondition `linkPendingTo` waits for, so
the link needs no extra coordination.

### Three findings worth carrying

**`OAuthProvider.credential` does not exist on the modular SDK** — it fails to compile.
The public round-trip is `error.credential.toJSON()` into storage and
`OAuthCredential.fromJSON()` back out. Both are public, and both are on the exported
`OAuthCredential`.

**`pendingToken` alone is not enough to rebuild a credential.** Read out of
@firebase/auth 1.8.1's source rather than assumed: `OAuthCredential.fromJSON` routes
through `_fromParams`, which sets `pendingToken` only *inside* its
`if (idToken || accessToken)` branch. A `{ pendingToken, nonce }` object falls to the
`else` and throws `auth/argument-error`. So the whole serialised credential rides along in
`PendingLink.credentialJson`, opaque to the pure module — which is why the cache's
validator rejects an entry without it, rather than failing in front of a Reader later.

**The invariant is a type, not a rule.** `consume` takes `{ linked: true }`, so
`cache.consume({ linked: false })` is `TS2322: Type 'false' is not assignable to type
'true'` — confirmed against `tsc`, not asserted. The failure path that drops a Reader's
only route back to their other Demos cannot be written, rather than being discouraged by
a comment.

### Every branch lands somewhere

| Branch | Reachable now? | Where the Reader ends up |
| --- | --- | --- |
| Link succeeds | yes | One uid; credential consumed only here |
| Reader cancels | yes | Signed in as whoever they came in as; Demos untouched; offer stands |
| `linkWithCredential` refuses | yes | Same as cancel; credential **retained** |
| Credential unreadable | yes | Same as cancel; retained |
| Redirect never started | yes | Same as cancel; retained |
| Merge fails closed (JWKS) | **no — ticket 07** | `offer-retry` — claims success on the link, nothing on the merge |

The last row is the one worth arguing about, and the one worth being precise
about: **it is not reachable from this ticket.** Nothing here performs a merge — that
is `lib/saved-demos.ts` meeting an authenticated route, which is ticket 07. `merge-unconfirmed`
is declared, has copy, is handled in `decideLinkAction`, and is tested, but no code path
publishes it yet. `grep -rn 'linkPhase: "' hooks/use-reader.ts` shows five phases published
and `merge-unconfirmed` is not among them.

It is here anyway on purpose. The copy decision belongs to this ticket, not to 07: "a failed
merge is not a failed link" is a statement about how to talk to a Reader, and the person who
wrote the link flow is the one who can say what the link did. 07 publishes the phase; if it
does not, the tests here are what tell it the copy was written for a reason.

So: a failed *merge* is not a failed *link*. The Reader is one person the moment
`linkWithCredential` returns. Telling them "error" would overstate a retryable condition;
telling them "done" would overstate a merge that did not happen. The copy is written to be
true about both halves — and until 07 publishes the phase, nothing reaches it.

### Two corrections this review found

**`OAuthProvider.credentialFromError(error)` already exists and is public.** The first version
hand-rolled it: it cast the error to `{ code?, credential?: { toJSON } }` and read the
credential off it. That worked, but it encoded Firebase's internal error shape in a cast
this repo did not have to own. The public static does the `_tokenResponse` mapping itself and
returns null rather than throwing when there is nothing usable. Replaced.

**`merge-unconfirmed` was documented as a live branch when it is not.** The first version of
the table above listed it alongside five branches the code actually reaches, which is how a
reader concludes it has been exercised. It has not. Corrected, with the reason it is still
here at all.

Both were found by reviewing this ticket's own diff — the Spec reviewer returned an empty
report, so these came from checking the claims by hand against
`@firebase/auth` 1.8.1's source and by grepping what the code actually publishes.

### Tests — 19, all five the ticket asked for

`tests/reader-link.test.ts`, node-only, no Firebase import, because `linkWithCredential`
needs a browser and what is worth testing here is the part where a mistake costs somebody
their Demos.

- link succeeds → credential consumed, phase `linked`
- link cancelled mid-flow → `offer-retry`, credential retained, wording says unchanged
- one account empty and one not → the union returns the non-empty one, **not** a wipe
- both non-empty → union keeps both, order stable
- JWKS unreachable mid-flow → `offer-retry`, and the copy matches neither `/lost/` nor `/deleted/` nor `/error/i`

Plus: the `consume({linked:false})` type guard at runtime, malformed storage, a blob-less
credential, replace-not-stack, and a `CONTEXT.md` vocabulary sweep over every phase's copy.

Verified: `tsc` clean, `eslint` clean on all three files, 37 files / 587 tests green,
`next build` compiles. The one repo lint error is a `require()` in
`.scratch/social-cards/probe/avif-datauri.tsx`, which is another effort's untracked file.

### What is still not proven

**The Firebase calls themselves are untested.** `linkWithCredential`, the redirect
round-trip, and whether `fromJSON` actually produces a credential Firebase accepts are
exercised by nothing here — a node runner cannot reach them. The first real proof is a
Reader with two accounts, which is ticket 07's smoke test after deploy. Everything above
is the logic around those calls being correct, not the calls.

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

### Popup, 2026-10-07 (no logic change)

Sign-in moved from redirect to popup (ticket 06's note for why). Nothing in this ticket's logic
moves with it: the refusal still carries the credential, the cache still holds it, and the join
still fires when a signed-in Reader coincides with a cached credential — except nothing
navigates any more, so the "other door" is a second popup on the same page rather than a second
redirect. Simpler than what this ticket designed for, and every test still passes unchanged.