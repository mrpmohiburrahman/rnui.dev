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

**Status:** ready-for-agent

- [ ] Voting on an Entry sends exactly one view increment, from one place
- [ ] The recorded count is identical on the home page, the Category listing and the bookmarks page
- [ ] The stored-set toggle for votes performs no network write at all
- [ ] Both page-level vote wrappers are gone and all three routes pass the same toggle through
- [ ] The surviving increment is awaited or explicitly handled, leaving no unhandled promise in the vote path
- [ ] An end-to-end test intercepts the server-action requests a vote click produces, records their bodies, and asserts the same count on the home page and a Category page — where the tree today gives two and three
- [ ] Type check, test suite, build and end-to-end tests all pass

Two things about that test are worth knowing before starting, because the obvious
version of it does not work. Every server action posts to the same address and is
told apart only by an opaque header value, so counting requests cannot by itself
separate the view increment from the vote increment the same click also fires — the
test asserts the number of distinct actions and that none repeats. And the requests
may be batched; confirming they are not is the first ten minutes of the ticket.

The increment that fires when an Entry is opened or its Demo plays is not touched
here. That path is ticket 10.
