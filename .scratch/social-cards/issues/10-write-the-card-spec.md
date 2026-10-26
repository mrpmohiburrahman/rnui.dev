# Write the card spec

Status: open
Type: task
Blocked by: 04, 05, 06, 07, 08, 09

## Question

**Every decision on this map is made. This is the destination: one spec that says what card is served
where, what each says, and how it is generated — written down well enough that implementing it needs
no further questions.**

Not a ticket in the ordinary sense; it is the map's terminus. It produces a document, and the document
is the deliverable. When it exists this map is done and the implementation becomes a fresh effort.

The spec has to state, completely:

- **Every route, and its card.** The four families from tickets 04–06 and 08, the ten routes from
  ticket 09, and what happens to a `/recording/<id>` for an id that is not a Recording.
- **Each chosen design, as rendered output**, with its preview URL, and the one that was chosen over
  it. The losers are part of the record — the next person to ask "why is the count in the corner" needs
  to know it was tried in the middle.
- **The generation mechanism** from ticket 07: the route, the parameters, the key derivation, the
  caching headers, the runtime, the failure mode, the per-render cost.
- **The Satori constraint list** from ticket 02, as a constraint a future implementer designs inside
  rather than re-discovers.
- **The scraper cache facts** from ticket 03, next to the Contributor card's live count, so the
  staleness bound is written down next to the decision it bounds.
- **What replaces `app/opengraph-image.png`, `app/opengraph-image.tsx` and `app/twitter-image.png`**
  — the map's fog holds this, and ticket 01 answers which one currently wins. Two of the three files
  are byte-identical and dated Jan 2025; the spec says what happens to each, and the impl effort
  deletes.

Where it lives: `.scratch/social-cards/spec.md`, per this repo's convention that a charted effort's
frozen artifact is a `map.md` and a spec is what a build effort is planned from.

## Notes

- **Read the six seed answers in `map.md` Decisions so far before writing.** They are the maintainer's
  and they are already settled — a spec that reopens one has gone wrong.
- The spec binds the implementation the way `.scratch/public-submissions/map.md`'s **Settled at
  charting** binds its code: it states decisions, not steps.
- When the spec is written, set this ticket's `Status: resolved`, append the pointer to the map's
  Decisions so far, and remove this map's **Not yet specified** — which should be empty by then, since
  every patch of it graduated into a ticket. Anything left is fog this effort reached the end of without
  resolving, and belongs in **Out of scope** with a line saying so.