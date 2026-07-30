# Motion brief — entry detail overlay

Produced with `/motion-brief`. Frequency and purpose were answered by the maintainer;
every remaining call was taken by the agent at the maintainer's instruction, on the grounds
that none of them can be judged without seeing the thing run. Flagged accordingly below.

**Verdict:** animate — minimally

**Trigger:** a card is activated (click, Enter or Space), which changes the URL to the entry's
own address and opens the overlay. Closing is Escape, the close button, a backdrop click, or
the browser back button.

**Frequency:** 10–30 opens per engaged session. Median session is 15s but p90 is 897s, so the
visitors who matter browse hard. This is the *reduce it* band — not a cut, but nothing
decorative survives.

**Purpose:** tells the visitor the catalogue is still underneath. The URL changes on open, so
without a transition an instant full-screen panel reads as having navigated to a new page —
and then the back button feels wrong. The fade is the only thing distinguishing "on top of"
from "went somewhere else".

**Enter:**
- Backdrop `opacity 0 → 0.5`
- Panel `opacity 0 → 1`, `scale 0.98 → 1`

**Exit:** mirrors enter, faster, panel leading. Panel `opacity → 0`, `scale → 0.98` over 100ms;
backdrop `opacity → 0` over 140ms. The panel clears before the tint lifts, so there is never a
frame showing a bare panel over a fully lit grid.

**Origin:** centered — `transform-origin: center`. Deliberately *not* anchored to the clicked
tile. A shared-element morph from the card would communicate more, but it needs framer's
`layoutId` across a grid of up to 277 cards, which is the exact machinery decision 16 removes
for performance. At 10–30 opens a session it would also be the most-seen and most expensive
animation on the site.

**Easing:** `cubic-bezier(0.19, 1, 0.22, 1)` both directions — a strong ease-out that arrives
almost immediately and settles. Never `ease-in` on UI. A built-in curve is not strong enough
here.
**Duration:** enter 180ms · exit 100ms panel / 140ms backdrop. Below the 200–500ms modal band
because of the frequency finding.

**Interrupt:** retargets from wherever it currently is, never restarts. Tween transitions via
framer-motion, not CSS `@keyframes`, which would restart from zero. `AnimatePresence` runs in
its default mode — **not** `mode="wait"`, which would make a close-then-immediately-reopen wait
for the exit to finish and add latency to the most repeated action on the site.

**Reduced motion:** opacity survives, scale does not. Panel and backdrop fade at 120ms enter /
100ms exit with no transform at all. Implemented globally by wrapping the app in
`<MotionConfig reducedMotion="user">` rather than per-component, so the site's other animations
inherit it — today `prefers-reduced-motion` is honoured in exactly one file
(`components/cult/fade-in.tsx:11`). Consistent with decision 3: under reduced motion no grid
video is ever mounted.

**Stack:** Radix Dialog (`@radix-ui/react-dialog`, already a dependency and currently unused
here) supplies the focus trap, Escape, scroll lock and portal that `components/modal.tsx`
lacks entirely. framer-motion `AnimatePresence` with `forceMount` drives the two fades.
Two animated nodes, both compositor-only properties — no layout, no repaint, no main-thread
work, which matters against a 286ms mobile INP.

## Also required, and not animation

- **Pause the grid's players on open.** Up to five muted loops keep decoding behind an opaque
  panel otherwise — wasted battery and main thread, on the metric that is already weakest.
  Resume the in-view ones on close.
- Delete the double backdrop fade. `components/modal.tsx:31-43` fades the wrapper via
  `backdropVariants` *and* the inner backdrop via an inline `animate`, so the two opacities
  multiply.
- Delete `y: -50`. Fifty pixels of travel that the purpose does not justify.

## Open risk

**The 2% scale on a large panel.** The panel is `max-w-3xl`, so at full width `scale(0.98)`
is roughly 15px of growth — more visible than "felt, not seen" implies. Larger surfaces need
smaller scale to read the same as small ones. If it draws attention in use, drop to `0.99`
(~8px) or remove the scale entirely; the fade alone still serves the stated purpose. Check
this first on a 1440px desktop viewport, which is where the panel is widest.

Second, smaller: exit timings of 100/140ms are tuned by reasoning, not by eye. They are the
first thing to adjust after seeing it run.
