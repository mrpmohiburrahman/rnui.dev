# 09 — One vote click counts as one view

**What to build:** Voting on an Entry records one view, on every route.

Today it records two on the home page and three on the Category listing and the
bookmarks page, while the number the visitor watches change goes up by one. So the
stored count and the displayed count disagree the moment either moves, and the
route that inflates worst is the busiest one — every legacy Category address
redirects into it.

The cause is that recording a view is a fire-and-forget server action imported
directly by four unrelated layers. One user action has no owner, so each layer adds
its own call: the card fires one, the localStorage-backed vote toggle fires another
from inside a hook that otherwise touches no network at all, and two of the three
page modules wrap the toggle to fire a third.

The fix is deletion rather than abstraction. The vote toggle goes back to being a
set of remembered ids. The two page-level wrappers go away and all three routes
pass the toggle straight through. One call site survives, and it is awaited.

This lands before the three module tickets because that single leaked line is the
only structural difference between the two stored-set hooks and the only
behavioural difference between the three page modules. Written the other way round,
each of those tickets would have to correct the arithmetic on the way past, and a
reviewer would be reading a refactor and a bug fix in one diff.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] Voting on an Entry sends exactly one view increment, from one place
- [x] The recorded count is identical on the home page, the Category listing and the bookmarks page
- [x] The stored-set toggle for votes performs no network write at all
- [x] Both page-level vote wrappers are gone and all three routes pass the same toggle through
- [x] The surviving increment is awaited or explicitly handled, leaving no unhandled promise in the vote path
- [x] An end-to-end test intercepts the server-action requests a vote click produces, records their bodies, and asserts the same count on the home page and a Category page — where the tree today gives two and three
- [x] Type check, test suite, build and end-to-end tests all pass

Two things about that test are worth knowing before starting, because the obvious
version of it does not work. Every server action posts to the same address and is
told apart only by an opaque header value, so counting requests cannot by itself
separate the view increment from the vote increment the same click also fires — the
test asserts the number of distinct actions and that none repeats. And the requests
may be batched; confirming they are not is the first ten minutes of the ticket.

The increment that fires when an Entry is opened or its Demo plays is not touched
here. That path is ticket 10.

## Comments

**Implemented 2026-07-30.**

**The batching question, answered first.** Not batched. A throwaway probe recorded
every POST a single vote click produces, and each server action gets its own
request to the address of the page that fired it, distinguished only by the
`Next-Action` header. Roughly 700ms apart, which mattered more than the batching
answer did — see below.

Measured before the fix, one click on the home page:

```
+0ms    action=407b0172… body=["01KAY9B2AMN590C8YP5WTNDTHQ"]   ← view
+699ms  action=407b0172… body=["01KAY9B2AMN590C8YP5WTNDTHQ"]   ← view again
+1079ms action=403db821… body=["01KAY9B2AMN590C8YP5WTNDTHQ"]   ← vote
```

and on `/products?category=Buttons`, the same with `407b0172…` three times. The
survey's two and three, confirmed against the running site rather than inferred
from the imports.

After: two requests, `407b0172…` once and `403db821…` once, on both routes.

**The bodies are recorded too**, which the criterion asks for and the first version
of the test skipped — it read only the `Next-Action` header, on the reasoning that
the bodies cannot tell one action from another. True, but not what the criterion
says, and the bodies answer a different question the headers cannot: that every
action one click fires addresses the **same** Entry. `expectOneEntryTargeted` asserts
one distinct body across the click and that it matches a single ULID, so a body Next
never filled in cannot make it pass vacuously.

**The first draft of the test passed against the bug.** It waited for the request
count to stop growing, using `expect.poll`'s default intervals — 100ms then 250ms.
Both reads landed before the second request arrived at 699ms, so the count looked
stable at one and the test went green while the tree was still billing three. It
now waits for two seconds of silence after the last recorded action, which is
about three times the observed gap. Worth recording because the failure mode is
invisible: a settle-wait that is too short does not flake, it passes.

**What moved.** `hooks/use-votes.ts` lost its import of the view action and the
call inside `toggleVote`; it is now a set of remembered ids that touches no
network, and a comment at the top says so. The wrappers in
`components/entries-page-client.tsx` and `app/bookmarks/page.tsx` are gone and both
routes pass `toggleVote` straight through, which is what
`components/directory-page-client.tsx` already did. The surviving increment is the
one in `components/entry-card.tsx`'s `handleVoteClick`, already awaited, now
carrying a comment saying it is the only one in the vote path.

No unhandled promise: `handleVoteClick` is an async click handler, so React
discards the promise it returns, but every action call inside it sits in its own
`try`/`catch`, so there is nothing left to reject.

Verified: `pnpm check-types`, `pnpm test` (74 passed), `pnpm build`,
`pnpm exec playwright test` (5 passed, the two new ones included).
