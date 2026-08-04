# Motion brief — studio-dark mobile bottom sheet (`/filter-dock`)

Produced for `studio-dark` ticket 11. The Specimen draws the moment but gives it no easing:
`Specimen.dc.html:166` — *"Bottom sheet — 260ms spring, no overshoot"* — is the only
specification, and *"spring"* is a framer primitive, not a CSS curve.

**Verdict:** animate — a damped transition, no bounce.

**Trigger:** the mobile filter surface opens from the phone header's filter control
(`components/filter-dock.tsx`, a Radix Dialog) and closes on its own close button, a backdrop
tap, or Escape.

**Duration:** **260ms**, fixed by the Specimen.

**Easing:** the Specimen writes *"spring, no overshoot"* but names no damping; ticket 11 builds
it as a **260ms `cubic-bezier(.2,.8,.2,1)` transition**, explicitly **not** a framer spring.
Two reasons, both recorded in ticket 11: (a) the sheet is a Radix Dialog whose open/close is a
CSS `data-state` transition, so a framer spring would mean a second animation system layered on
top of Radix's own; (b) *"no overshoot"* is a constraint a spring honours only at the cost of
tuning, whereas `cubic-bezier(.2,.8,.2,1)` is the rise curve the rest of the design already uses
and cannot overshoot at all. The `review-animations` `STANDARDS.md` flags bare CSS easings as
*"almost never strong enough"* (its collision 3); the rise curve is the site's answer to that,
and the sheet reuses it rather than inventing a spring.

**Reduced motion:** the ticket-13 global rule zeroes the sheet's `transition-duration` to 0s,
so the sheet appears instantly. Radix's `data-[state=open]:animate-in` path is covered by the
same `animation-duration: 0s` rule that reaches `components/ui/dropdown-menu.tsx` and the other
`animate-in`/`animate-out` consumers.

**Stack:** Radix Dialog (`forceMount` + `data-state`) owns the trap, Escape and scroll lock;
the transition is plain CSS on the content element. One animation system, not two.
