# 14 — One module owns the counters

**What to build:** Recording a view, casting or withdrawing a vote, and reading the
counts back become three functions in one plain module, with an in-memory stand-in
behind them — so the rules can be tested without credentials and without a network.

None of this is testable today. The Firestore collection name and its production
fallback are written out separately in each of the four remaining places that touch
it, and the fallback firing means writing to the **production** collection instead
of the development one — a mistake nothing would report. The same
not-found-then-create recovery is repeated verbatim in all three writers. There is a
fifth declaration of that same collection name for a different collection entirely,
the newsletter one; it is left alone, because unifying two things that only look
alike is how the next reader learns the wrong rule.

Recording a view becomes contractually incapable of rejecting. That removes the
fire-and-forget promises by construction rather than by adding a handler to each one
— there is nothing left to handle.

The server-action files stay, reduced to thin delegates. That is not ceremony: the
framework requires those files to export only async functions, and keeping them as a
boundary means the module itself is an ordinary module the test can import directly,
and the client import graph does not change.

By the time this lands the arithmetic is already correct — ticket 09 fixed the vote
inflation, ticket 10 fixed the display drift — so nothing here is a behaviour change.
Landing it earlier would mean building a module around call sites that should not
exist.

**Blocked by:** 06, which deletes the dead reader that is the fifth declaration in
the counter path; unifying it first would mean unifying a file that is about to be
deleted. 09 and 10, which own the two arithmetic fixes this ticket must not contain.

**Status:** resolved

- [x] One plain module owns recording a view, changing a vote, and reading the counts for the catalogue
- [x] The collection name and its fallback are declared exactly once in the counter path
- [x] The not-found-then-create recovery is written once rather than three times
- [x] Recording a view never rejects, by contract, so no caller needs its own handler
- [x] The server-action files become thin delegates, so the client import graph is unchanged
- [x] The stored field spellings at the database boundary are unchanged, per ADR-0004 — those are records in a live database, not names
- [x] A test drives the module against an in-memory stand-in in the existing test environment, with no new dependency
- [x] Type check, test suite, build and end-to-end tests all pass

Three things are deliberately not done. No subscription or observable, because no
caller wants one. No unifying of the newsletter collection name, which is a
different collection that happens to be spelled the same way. And no reconciliation
between a browser's vote membership and the recorded count — clearing browser
storage lets the same visitor vote again, and a failed write leaves the browser
believing it voted forever, but every remedy for that is a decision about whether
this site wants visitor identity at all.

## Comments

**Implemented 2026-07-30.**

**Two modules, not one, and for the reason the ticket gives.** `lib/counters.ts`
holds the rules, the `CounterStore` interface and the in-memory stand-in, and imports
no Firebase — that is what lets a test import it directly, which was the point.
`lib/counters-firestore.ts` holds the Firestore store, the one declaration of the
collection name, and `export const counters = createCounters(firestoreCounterStore)`.
Callers see one object with three methods.

**The store is three operations.** `readAll`, `addTo(entryId, field, by)` and
`create`. `addTo` resolves **false** rather than throwing when the document is
absent, and that single choice is what collapses the recovery: the Firestore adapter
translates `FirebaseError` code `not-found` into `false` and rethrows everything else,
so the shared rule is

```ts
if (!(await store.addTo(entryId, field, by))) await store.create(entryId, whenMissing)
```

written once instead of three times, and a permission error is no longer disguised
as a missing document.

**The three creation payloads are not the same and were kept apart.** The ticket
called the recovery "verbatim" in all three writers; the *shape* was, the values were
not. A missing document seeds `{view_count: 1, vote_count: 0}` from a view,
`{vote_count: 1, view_count: 1}` from a cast vote and `{vote_count: 0, view_count: 0}`
from a withdrawn one. All three are preserved, because the ticket says nothing here
is a behaviour change. The odd one — a cast vote seeding a view — carries a comment
saying it is kept rather than corrected, and that it is all but unreachable now that
a vote click records a view first.

**`recordView` cannot reject**, by contract, stated in its doc comment and pinned by
a test that hands it a store whose `addTo` always throws. `changeVote` also swallows
and logs, which is what all three server actions did before; only `recordView` is
*documented* as non-rejecting, because that is the criterion.

Its callers keep their handlers, and the first draft of this note had the reason
wrong. It said `entry-card.tsx`'s `try`/`catch` and `interactive-video.tsx`'s
`void incrementViewCount().catch(() => {})` were "now dead code". They are not.
`incrementViewCount` is a **server action**: the client reaches it over HTTP, so the
promise the client awaits can reject on a network failure, an aborted navigation or a
500 — none of which the server-side contract can prevent, because none of them reach
the server-side function. The contract is that `recordView` never rejects *in the
server process*. The client handlers guard a different failure and stay.

The criterion reads "so no caller needs its own handler", and that is satisfied for
the reason the module gives: no caller needs a handler for a *counting* failure. A
transport failure is not a counting failure.

**One thing beyond the criteria.** The ticket observes that the fallback firing means
writing to the *production* collection "a mistake nothing would report". It now
reports: `lib/counters-firestore.ts` warns once at startup when
`NEXT_PUBLIC_FIRESTORE_COLLECTION` is unset, naming the collection it is about to
count against. Checked by building with the variable blanked — the line appears
(seven times, once per server bundle) and the build still succeeds. `.env.example`
gained both Firestore collection variables too, since it had neither, which is how a
fresh clone ended up on the fallback in the first place.

**The test** is `tests/counters.test.ts`, 11 assertions in the existing node
environment against `inMemoryCounterStore`, no new dependency. It covers each writer
on an existing document and on a missing one, `readCounts` on a populated and an
empty collection, that `readCounts` hands back a copy rather than the stored objects,
and that a withdrawal is *not* clamped at zero — the stored count goes negative and
only the card's display clamps. That last one documents the tree rather than
asserting what it should be.

**Field spellings unchanged**: `view_count` and `vote_count` are the keys of the
`Counts` type, with a comment saying why they are not renamed.

**The newsletter is untouched.** Its `COLLECTION_NAME` in
`components/newsletter-form.tsx` and `app/subscribe/page.tsx` reads a different
variable — `NEXT_PUBLIC_FIRESTORE_EMAIL_COLLECTION` — so it was never the same
declaration, only the same local name.

Verified: `pnpm check-types`, `pnpm lint` (0 errors), `pnpm test` (93 passed, up from
82), `pnpm build`, `pnpm exec playwright test` (7 passed). One grep for
`NEXT_PUBLIC_FIRESTORE_COLLECTION` across `app/`, `lib/`, `data/` and `components/`
returns `lib/counters-firestore.ts` and nothing else.
