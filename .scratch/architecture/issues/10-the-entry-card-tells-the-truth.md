# 10 — The Entry card tells the truth about its props and its counts

**What to build:** The Entry card takes what it actually reads, is told which
treatment to render, and shows the counts it was given rather than the ones it
happened to mount with.

Four things are wrong with its surface. A featured-Entries prop is declared, drilled
two levels and destructured by neither grid; the id list feeding it is permanently
empty, so the filter it drives always yields nothing. A truncation prop is declared
and never passed by the only caller, which means captions have never been truncated
on any route. An ordering prop is passed but redundant, because the key above it
already carries the index. And the single thing distinguishing the two visual
treatments is a substring test against the current address, performed inside the
grid — invisible from every call site, and wrong the moment a route is added.

Two things are wrong with its state. The card captures the view and vote counts once
when it first mounts and never reseeds them when it is handed a fresh Entry, so a
re-render with updated counts shows the old numbers. And the modal holds a view
count seeded from nothing — it is mounted before anything is selected, incremented
on every open, and rendered nowhere. It is state that cannot be right and cannot be
seen, so it is deleted rather than kept in sync.

Underneath both is one judgement the ticket makes rather than defers: **playing the
Demo is the view; opening the Entry is not.** Today both fire, which is why one
watch bills two. Opening and dismissing without watching is not a view of anything.
That choice is reversible and stated in a comment where it fires, so the next reader
does not have to infer it.

This lands before the page collapse because it shrinks the surface that collapse
freezes into one shared module.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The featured-Entries prop, the permanently empty id list and the filtering they drive are gone from the grid and from both callers
- [ ] The unpassed truncation prop is gone, and caption behaviour is whatever it already was in practice
- [ ] The redundant ordering prop is gone from the card and from the grid that passes it, and the key above it still carries the index
- [ ] The grid takes its visual treatment as an explicit prop rather than reading the current address, and both routes render exactly as before
- [ ] The card derives its displayed counts from the Entry it is given rather than snapshotting them at mount
- [ ] The modal's unused count state is deleted, since nothing renders it
- [ ] Opening an Entry and playing its Demo records one view, not two, and a comment where it fires says which interaction counts
- [ ] Type check, build and end-to-end tests all pass

Two notes for whoever picks this up. The count reseed has no automated check —
nothing in CI can observe it, because CI builds against placeholder credentials so
counts never move there. It ships as reviewed hygiene, and the ticket says so rather
than pretending otherwise. And the existing end-to-end test cannot see the double
billing: it clicks the play control on a grid card, which stops the event before the
Entry opens. Reaching the doubled path means clicking the card body, waiting for the
modal, and playing from inside it.

The vote path is not touched. Ticket 09 owns it, and the two tickets must not both
edit it.
