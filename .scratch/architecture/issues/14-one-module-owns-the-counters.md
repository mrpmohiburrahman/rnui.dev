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

**Status:** ready-for-agent

- [ ] One plain module owns recording a view, changing a vote, and reading the counts for the catalogue
- [ ] The collection name and its fallback are declared exactly once in the counter path
- [ ] The not-found-then-create recovery is written once rather than three times
- [ ] Recording a view never rejects, by contract, so no caller needs its own handler
- [ ] The server-action files become thin delegates, so the client import graph is unchanged
- [ ] The stored field spellings at the database boundary are unchanged, per ADR-0004 — those are records in a live database, not names
- [ ] A test drives the module against an in-memory stand-in in the existing test environment, with no new dependency
- [ ] Type check, test suite, build and end-to-end tests all pass

Three things are deliberately not done. No subscription or observable, because no
caller wants one. No unifying of the newsletter collection name, which is a
different collection that happens to be spelled the same way. And no reconciliation
between a browser's vote membership and the recorded count — clearing browser
storage lets the same visitor vote again, and a failed write leaves the browser
believing it voted forever, but every remedy for that is a decision about whether
this site wants visitor identity at all.
