# What the control is called, and does it say anything

Status: open
Type: grilling
Blocked by: 01, 02

## Question

**A control that leaves the site is three obligations at once, and the third is easy to forget.**

It is an **accessible name**. The header's own comments treat a11y as load-bearing —
`site-header.tsx:270-274` records that the two chip rows remove the same facet and that an accessible
name drifting between them is drift `catalogue-nav.tsx:76-78` names. This control has the same problem
in a new form: its name must carry the action *and* the number, and it must not drift between the
desktop bar and the phone header the way the `Saved` chip's two spellings nearly do. Decide the exact
string, including how the count reads aloud — "350" as a bare number is not the same as "350 stars" to
a screen reader, and `tabular-nums` (`:139`) is a visual instruction with no spoken equivalent.

It is an **exit affordance**. The footer already has a convention for this: the Repository link
carries a trailing `<span aria-hidden="true">↗</span>` and `target="_blank" rel="noopener noreferrer"`
(`site-footer.tsx:51-58`), and its comment records that the arrow means "leaves the site". Does the
star control follow that convention, and does it open a new tab or navigate away? A nav-bar control
that navigates away from `rnui.dev` is a heavier gesture than a footer link to the same place, and the
Preview (see the surfaces ticket) makes leaving expensive to undo.

It is a **hit target**. The phone header's `◆` chip is 38px and its comment (`:167-168`) records why
it is not the mock's 36px. A third control on a 390px phone, with a 320px floor, is where a hit target
gets quietly cut. Decide the minimum and whether it is met by padding or by the transparent `::before`
trick the `✕` uses (`:281`).

And it is **analytics, or it is not**. The repo has a PostHog setup (`lib/analytics.ts`,
`lib/posthog-provider.tsx`) and a call-site convention (`reportFacetClick` in
`components/nav/catalogue-nav.tsx`). ADR-0008 governs event naming and this repo takes it seriously —
`entry_id` and `entry_opened` must never be emitted. Decide whether the press is captured at all, and
if so: the event name, its properties (does it carry the count? the stale-or-not state?), and whether
a click that opens a new tab is reliably capturable before navigation.

**The answer is the accessible name verbatim, the exit behaviour, the hit-target minimum, and a
yes/no on the event with its name and properties if yes.** Depends on 01 for what the control is
called and on 02 for whether a count exists to include.

## Comments