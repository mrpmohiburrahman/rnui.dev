# Five directions for the star control

Status: resolved
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

## Answer

**Variant F — A's chip shape at every desktop width, with the two words ("Saved" and "Star") appearing only from `xl` (1280px). Chosen by the maintainer 2026-10-05.**

Prototype: branch `prototype/star-button`, commits `be949ab` and `3f49fe7`, at
`/prototype/star-button?variant=F`. Six variants (A–F), switchable by `?variant=` and the arrow keys.

**The control.** A third chip in the right column of the desktop bar, sibling to `◆ Saved` and before
`<ModeToggle />`: `★ Star` + the count in the same `rounded-chip` / `border-line` / `text-t2` treatment
`Saved` already uses. On the phone it keeps its own chip, `★ 350`, at `min-h-[38px]` beside `◆ 0` —
every variant fit there down to 320px, so the phone needed no variant of its own beyond sizing.

**Why F over the five.** The decision turned out not to be taste but a width budget, and only
measurement found it. A clips the theme toggle off-screen at 768 (+10px), degrades 900–1024 from clean
to wrapped, and C — the widest — clips by 59px. Only B survived 768, and it gives up both the chip
vocabulary and the honest word "Star". F keeps A's shape everywhere and pays for it out of the two
words instead.

**The load-bearing discovery: the header is already broken at 768–880 today**, with no star control
present anywhere. Measured against the real site: the `Saved` chip wraps to 46px and the mode toggle to
49px at 768 and 820. `site-header.tsx:90-92` already records that the md-to-lg band does not fit —
it demotes the counter line to `lg`-up for that reason — so this is a known wall, not a surprise.
F is therefore strictly *better than what ships* at 768 and 820, because it buys its width back out of
the same word that was already overflowing.

**Why `xl` and not `lg`.** F was first built restoring the words at `lg` (1024px) and that regressed
exactly 1024, where the words return but there is still no room. `xl` (1280) is the first width at
which the unmodified header is clean, so that is where they go. The wordless `Saved` form is not
invented — `site-header.tsx:175` already draws `◆ 0` on the phone.

**Traffic, from PostHog** (project 117415, `$pageview`, `$host = www.rnui.dev`,
`$virt_traffic_type = 'Regular'`, 90 days): **89.0%** of real pageviews are ≥1280, 4.3% are 1024–1279,
**1.1%** are 768–1023, 5.6% are <768. The band the constraint lives in is 1.1% (76 pageviews: 57
desktop, 18 landscape phone, 1 tablet). Governing catalog consulted: empty, no approved metric.

**Measured outcome** (clip = theme toggle pushed past the viewport edge; wrap = a control taller than
44px, i.e. broken onto two lines):

| width | baseline, today | A | F |
|---|---|---|---|
| 768 | Saved 46px + toggle 49px | **CLIP +10px**, both wrap | ok, toggle only |
| 820 | Saved 46px + toggle 49px | both wrap | ok, toggle only |
| 880 | clean | both wrap | ok, toggle only |
| 900 | clean | both wrap | **clean** |
| 1024 | clean | both wrap | **clean** |
| 1100+ | clean | clean | clean |

**Known cost, stated rather than buried:** around 860–890 the toggle wraps under F where the baseline is
clean. One narrow band, accepted.

**Carried out of this ticket, not decided by it:** F requires the `Saved` chip to drop its word below
`xl` — a change to an existing component that goes beyond adding a star button. That is
[Does the Saved chip's word drop ship with the star control, or separately](#07), and the spec cannot
be written until it is answered. Also still open: the count source ([Where does a live-enough star
count come from](#02)) may move the number 350 is standing in for, and the honest label, exit
convention, hit target and analytics position are
[What the control is called, and does it say anything](#05).

## Comments

- 2026-10-05 — Built as throwaway branch `prototype/star-button` so `main` never carries prototype
  code. The prototype route opts out of the catalogue chrome through the seam `site-shell.tsx` already
  owns (`useSelectedLayoutSegment`), because a page cannot replace a layout's header and a header
  rendered inside `main` is offset by the 265px rail — which made the first round of width
  measurements meaningless. Verified `/`, `/products` and `/bookmarks` still serve 200 with no star
  control on the branch.