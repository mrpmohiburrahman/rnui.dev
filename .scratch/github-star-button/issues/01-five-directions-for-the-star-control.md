# Five directions for the star control

Status: claimed
Type: prototype
Blocked by:

## Question

**What does a third control in the header actually look like?** The header's right column holds two
things today — the `◆ Saved` chip and `<ModeToggle />` — and adding a third changes the row's
balance, its hit-target budget, and its reading order. That cannot be decided on paper.

Build **five materially different** renderings and put them in front of the maintainer to choose from.
They must differ in *approach*, not in padding: if two of them are the same idea at two sizes, that is
four directions, not five.

Each one is drawn in the current Design's own grammar — read `app/globals.css` and
`components/site-header.tsx:87-146` first, and copy the `Saved` chip's actual treatment
(`rounded-chip`, `border-line`, `text-t2`, accent only when active) rather than inventing a new one.
Use `lucide-react`'s `Star` / `Github` **and** a glyph-text variant, because the header's house style
is currently glyph text (`◆`, `✕`) and whether it wants to stay that way is itself part of the answer.

Every direction must be shown at **both** breakpoints, because below `md` the phone header
(`site-header.tsx:155-204`) is a different component with three tight rows at 390px and a 320px floor.
A direction that only works in the 62px desktop bar has not answered the question.

Worth putting in the set, at minimum:

- A **sibling of the `Saved` chip** — same shape, third in the row, smallest possible addition.
- A **bare count + star**, no chip border, sitting quietest of the three.
- A **split control** — count as a link, star as a separate affordance, i.e. treating "learn the
  number" and "go star" as two different intents rather than one.
- Something that **leads** — the star is the most prominent of the three, not the last.
- At least one that is **deliberately awkward**, so the awkwardness is seen and rejected rather than
  avoided.

For each: say what it costs — the width it takes from the search bar's centring (the two `flex-1`
columns at `:97` and `:116` are what centre it), the hit-target cost on a phone, and what it does to
the reading order.

**The answer is a chosen direction and the reasons it beat the other four** — the prototype is the
artefact, the choice is the decision. Link the prototype from this ticket.

## Comments