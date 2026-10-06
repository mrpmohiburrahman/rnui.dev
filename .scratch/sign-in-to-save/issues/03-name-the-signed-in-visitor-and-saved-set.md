# What is the signed-in visitor called, and what is a saved set now?

Type: grilling
Status: resolved
Blocked by:

## Question

`CONTEXT.md` currently defines **Remembered set** as Recording ids held in one visitor's own
browser, and says flatly: *"Nothing on the server can read a Remembered set."* This effort makes
that sentence false. It also lists `user` under Contributor's *avoid*, so the new concept cannot
be called a user without colliding with the domain.

Decide, with the maintainer:

- The name for a person who has signed in to the site. Not a Contributor — a Contributor is
  catalogue data whose identity is a name string (ADR-0009), and conflating the two would be the
  exact mistake `CONTEXT.md` exists to prevent.
- Whether **Remembered set** survives as a term, redefined to be server-side, or is replaced by
  two distinct terms — the browser-local one that voting still uses, and the new account-owned
  one. The honest answer is probably two terms, since after this change they genuinely differ in
  where they live and who can read them.
- The name for "a Demo this account has saved", and whether saving is a state of the account or a
  collection beside it.
- What belongs in the ADR. At minimum: saved Demos are server-side, the stored key is unchanged,
  Identity Platform must never be enabled, D1 rather than Firestore, and `jose` rather than the
  Admin SDK. Consider whether "bookmarks are browser-only" was ever worth an ADR of its own, since
  this map supersedes it.
- **Record the accepted limitations honestly, or the ADR will overclaim.** Two, both from resolved
  research:
  - A deleted or disabled account's ID token stays valid for up to an hour, because revocation is
    not checkable without a per-request round trip to Firebase. Proportionate for a bookmark list;
    explicitly **not** acceptable for payments, private data, or another person's records.
  - Our name and logo cannot appear on Google's consent screen, because brand verification
    requires a Google Cloud project of our own. That is the entire measured cost of the constraint.
- What the ADR says about a **signed-in visitor who is not a Contributor**. Worth stating directly,
  since `CONTEXT.md` lists `user` under Contributor's *avoid* and the two will meet in the nav.

## Notes

Invoke `/domain-modeling`. ADR-0004 makes this repo's vocabulary binding on code, and ADR-0008
records that the stored keys were deliberately not renamed. A half-updated glossary is how a
later agent invents a contradictory term.
## Answer

Resolved 2026-10-06. Glossary: `CONTEXT.md`. Decision: `docs/adr/0013-saving-requires-a-social-sign-in-verified-into-d1.md`.

**The signed-in person is a `Reader`.** A fresh word with no baggage, impossible to confuse with
`Contributor`, and it required rewriting no existing prose. `user` stays on Contributor's avoid
list and is now doubly justified — it is banned *and* it was the wrong word.

**A Reader is not a Contributor.** Stated explicitly in the glossary, because one human may be
both and the two are unrelated acts. This is the trap ADR-0009's design makes visible: a
Contributor's identity is their name string with no id, while a Reader is an id with a name that
means nothing. Two opposite kinds of identity that must not blur.

**`Remembered set` keeps its meaning and now covers voting alone.** The existing definition was
*exactly* right for `votedItems`, so it was not redefined to straddle two things. "Nothing on the
server can read a Remembered set" is still true — it just stopped being the whole story. One
precise term plus a paragraph saying where a Reader's saves actually live.

**No new noun for the saved collection.** `Library` was proposed and declined. `Remembered set`'s
own avoid list bans "saved items" — because `item` is the *retired* name for a Recording (ADR-0008)
and that string is what smuggles the old word back — but the problem was never "saved", and a
glossary that invents a noun for "the list of things I saved" is stretching. Prose says "saved
Demos"; code uses plain names like `savedRecordingIds`.

**A Reader's display name is never matched on.** Noted in the glossary because the nav will
display one and a later reader could reasonably assume it is stable and usable as a key. It is
provider-owned and unstable; the provider id is the only identity.

**Graduated: two accounts per human is now ticket 08**, and 07 was rewired to depend on it. This
was not a naming question — it is a behavioural defect this feature introduces. With Firebase's
"one account per email address" off by default, one human signing in with Google on a laptop and
GitHub on a phone gets two uids and two saved-Demos lists. Shipping two providers without the
linking path ships a bug that looks like silent data loss.

**Two limitations recorded in the ADR rather than glossed over**, both from the research tickets:
a deleted account's token stays valid for up to an hour (revocation costs a per-request round trip
we deliberately refused), and our name cannot appear on Google's consent screen (brand verification
needs a GCP project). The ADR also records the Identity Platform trap by name, since that is the
decision most likely to be undone by accident.
