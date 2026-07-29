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

**Status:** resolved

- [x] The featured-Entries prop, the permanently empty id list and the filtering they drive are gone from the grid and from both callers
- [x] The unpassed truncation prop is gone, and caption behaviour is whatever it already was in practice
- [x] The redundant ordering prop is gone from the card and from the grid that passes it, and the key above it still carries the index
- [x] The grid takes its visual treatment as an explicit prop rather than reading the current address, and both routes render exactly as before
- [x] The card derives its displayed counts from the Entry it is given rather than snapshotting them at mount
- [x] The modal's unused count state is deleted, since nothing renders it
- [x] Opening an Entry and playing its Demo records one view, not two, and a comment where it fires says which interaction counts
- [x] Type check, build and end-to-end tests all pass

Two notes for whoever picks this up. The count reseed has no automated check —
nothing in CI can observe it, because CI builds against placeholder credentials so
counts never move there. It ships as reviewed hygiene, and the ticket says so rather
than pretending otherwise. And the existing end-to-end test cannot see the double
billing: it clicks the play control on a grid card, which stops the event before the
Entry opens. Reaching the doubled path means clicking the card body, waiting for the
modal, and playing from inside it.

The vote path is not touched. Ticket 09 owns it, and the two tickets must not both
edit it.

## Comments

**Implemented 2026-07-30.**

**The double billing has a test after all.** The ticket said the reseed could not be
checked; it said nothing about the double billing, and that one is observable.
`tests/e2e/view.spec.ts` clicks the card's `<h3>` — the card body, so the event is
not stopped by the play control, the bookmark button, the vote button or a profile
link — waits for the modal, plays from inside it, and asserts one view action.
Before the fix it recorded the same action id twice, which is the two the ticket
describes.

Reaching the modal needed a handle. `components/modal.tsx` had no role, so
`getByRole("dialog")` found nothing. It now carries `role="dialog"`,
`aria-modal="true"` and `aria-label="Entry details"` — three attributes not in the
ticket's criteria, taken rather than adding a `data-testid`, because the modal was
missing the semantics a screen reader needs anyway and a test hook would not have
fixed that.

The counting helper came out of `vote.spec.ts` into `tests/e2e/server-actions.ts`,
since both files need the same "record the `Next-Action` header per POST, wait for
silence" machinery and it was written for ticket 09.

**The counts.** Two number states, `viewsClicked` and `votesClicked`, holding only
what this visitor clicked; the rendered count is the Entry's count plus that. An
effect on `[entry.view_count, entry.vote_count]` resets both to zero, because
counts arriving from the server already include the visitor's clicks and the local
additions would otherwise stack on top. Two numbers rather than one object: setting
a number back to its current value lets React bail out of the re-render, where a
fresh `{views: 0, votes: 0}` is a new identity every time and would not.

The `Math.max(…, 0)` clamp on votes survives from the old decrement handler.

**A third interaction the ticket does not rule on.** Following a profile or source
link out of a card still records a view — `handleLinkClick` in
`components/entry-card.tsx`. The ticket decided opening versus playing and said
nothing about links, so it is left as it was, with a comment saying so rather than
being decided in passing. If "playing the Demo is the view" is meant strictly, this
is the next line to delete.

**The treatment prop** is `treatment: "framed" | "plain"`, required rather than
defaulted so all three call sites have to state it. `/products` is `plain`, which is
what `pathname.includes("/products")` selected; `/` and `/bookmarks` are `framed`,
which is what it selected for them. Every legacy Category redirect lands on
`/products?category=…` and so still gets `plain`.

**The reseed remains unchecked**, as the ticket said. CI builds against placeholder
Firebase credentials, so counts never move there and nothing can observe a re-render
carrying fresh ones.

Verified: `pnpm check-types`, `pnpm test` (74 passed), `pnpm build`,
`pnpm exec playwright test` (6 passed).
