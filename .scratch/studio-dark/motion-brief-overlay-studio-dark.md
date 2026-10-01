# Motion brief — studio-dark overlay (rebuild of entry detail)

Produced for `studio-dark` ticket 09, which supersedes the `ui-ux-overhaul` overlay brief
(`.scratch/ui-ux-overhaul/motion-brief-overlay.md`, see its 2026-08-04 correction). The
`ui-ux-overhaul` brief left the surface largely unspecified; `assets/new-ui/Detail.dc.html` and
`Specimen.dc.html:164-165` name every value, so this brief is a record of drawn numbers, not a
set of open calls.

**Verdict:** animate — the rise, not the fade.

**Trigger:** a card is activated (click, Enter, or a shared-link arrival at `/recording/<id>`),
which pushes the Recording's own URL and opens the overlay. Closing is Escape, the close button,
a backdrop click, a `←`/`→` step to another Recording in the Category, or the browser Back
button (`history.back()`).

**Enter (open):**
- Scrim `opacity 0 → 1` over **240ms**, `cubic-bezier(.2,.8,.2,1)` — the Specimen's `rise` curve.
- Panel `opacity 0 → 1`, `y 8px → 0` over **240ms**, `cubic-bezier(.2,.8,.2,1)`.

**Exit (close):**
- Scrim `opacity → 0` over **160ms**, `ease-in` (Specimen `:165`, *"Overlay close on Escape"*).
- Panel `opacity → 0`, `y → 8px` over **160ms**, `ease-in`.

**Origin:** centred, with an 8px rise. The `ui-ux-overhaul` brief's *"deliberately not anchored"*
zero-travel is replaced by the Specimen's rise — the mock draws the panel arriving 8px up and
settling. A shared-element morph from the card is still not taken (same `layoutId`-over-277-cards
cost `ui-ux-overhaul` decision 16 removed).

**Easing:** `cubic-bezier(.2,.8,.2,1)` for the open, **`ease-in`** for the close. `ease-in` on a
close is the one deliberate break from the `review-animations` *"never ease-in on UI"* rule; the
Specimen names the key by its key (*"Overlay close on Escape"*) and the gate records it as a
deliberate override (see ticket 13's problem section, collisions 1 and 2).

**Duration:** open 240ms · close 160ms. Above `ui-ux-overhaul`'s 180/100-140ms because the rise
is a travel, not a scale, and the Specimen's own table fixes these numbers.

**Interrupt:** retargets from wherever it is; `AnimatePresence` default mode (no `mode="wait"`),
so a close-then-reopen does not queue behind the exit.

**Reduced motion:** `<MotionConfig reducedMotion="user">` (already on the app) snaps the `y`
transform to 0 and keeps the two fades at their full 240/160ms. The ticket-13 global
`@media (prefers-reduced-motion: reduce)` rule zeroes every `transition-duration` and
`animation-duration` to 0s as well, so the CSS-side transitions of the chips share the same
honoured state. Opacity survives; travel does not.

**Stack:** Radix Dialog owns the trap, Escape, scroll lock and portal. framer-motion
`AnimatePresence` with `forceMount` drives the scrim and panel. Two compositor-only nodes — no
layout, no repaint.
