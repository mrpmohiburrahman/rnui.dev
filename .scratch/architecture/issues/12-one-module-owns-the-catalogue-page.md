# 12 — One module owns the catalogue page

**What to build:** The home page, the Category listing and the bookmarks page render
from one module instead of three near-identical ones.

Each of the three repeats the same four-hook preamble in the same order, the same
hydration guard returning an empty element while stored state loads, the same grid
call, and the same modal tail. The only real differences are a heading, an
animation, and where the Entries come from.

By the time this lands the three have no behavioural difference left at all. Ticket
09 removed the vote wrappers that were the only divergence in what they did; ticket
10 removed the dead props and the address sniffing that were the only divergence in
what they passed. So this is a move rather than a merge, and it can be reviewed as
one: if the diff contains a behaviour change, an earlier ticket was incomplete and
this one should stop.

The module needs a name, and the glossary does not have one. `CONTEXT.md` defines
eight terms — Entry, Category, Demo, Poster, Asset, Asset path, Staging copy,
Published Asset — and none of them names the thing that renders a catalogue for
three routes. ADR-0004 says names are invented in the glossary and then adopted by
the code, never the other way round, so adding the term is part of this ticket
rather than a decision made in a filename. The one module in the tree still carrying
a name for a concept the glossary does not have retires with it.

**Blocked by:** 09 and 10. Both edit the same three page modules and the card
surface this one freezes; landing this first means touching all three files twice.

**Status:** ready-for-agent

- [ ] One client module renders the catalogue for all three routes
- [ ] The term for it is added to `CONTEXT.md` with its own _Avoid_ list before the module is named, and the name comes from that term
- [ ] The bookmarks route keeps its own fetch, since unlike the other two it has no server component above it
- [ ] All three routes keep their current addresses, and every legacy Category redirect still lands exactly where it did
- [ ] The hydration placeholder is written once
- [ ] The last component name in the tree that names a concept the glossary does not have is retired
- [ ] Type check, build and end-to-end tests all pass

No new abstraction is invented. Where the three differ in shape, the module takes
whichever of the three already had it. Any behaviour change at all means stopping
and finishing the earlier ticket instead.
