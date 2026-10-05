# 03 — The `Saved` chip announces one name at every width

**What to build:** The header's `Saved` control announces itself as "Saved {count}" on the desktop bar
**and** on the phone, at every width. Today the phone form announces a bare number with nothing to
attach it to. Alongside that, the desktop chip drops its visible word below the middle breakpoint —
which repairs a layout bug that is live in production right now, where the chip breaks onto two lines
at 768 and 820 — **without** that drop taking the accessible name with it.

This ticket is a bug fix in its own right. Nothing about stars appears in it.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Both layouts announce **"Saved {count}"**. The phone chip gains an accessible name it has never
      had, adding no visible word — only the spoken one.
- [ ] The desktop chip's visible word becomes **visual-only below the middle breakpoint** and is
      restored at it.
- [ ] **The accessible name stays "Saved {count}" at every width on both layouts.** This is the
      criterion that makes this ticket safe to land alone. Dropping the visible word without it would
      ship exactly the fault the name rule exists to prevent: a bare number announced between the
      breakpoints, which is the fault the phone chip has today. If the name and the word are bound
      together, this ticket is not done.
- [ ] The word's removal is hidden from assistive technology the way the header already does it — the
      glyph is `aria-hidden`, the name carries an `sr-only` label — rather than by removing the text
      from the DOM.
- [ ] **A regression test asserts the `Saved` chip is single-line at 768 and 820.**
- [ ] **Nothing in that test asserts anything about the theme toggle, and this is deliberate.** A test
      covering both controls passes here and goes red when the star control lands, because that ticket
      reintroduces a toggle wrap on purpose. Amending it later to assert the toggle *does* wrap would
      pin an accepted defect as expected behaviour in a suite that outlives this effort. The toggle's
      state is a manual measurement note in the pull request body.
- [ ] The header's deliberate **no-width-reservation rule on its counts is not reversed.** It was
      removed once before so a one-digit-to-two-digit change could not shove the toggle sideways, and it
      stays removed. This ticket adds no reservation.
- [ ] **No existing test breaks.** The suite that locates the chip by its route and asserts it contains
      a digit is satisfied by a wordless chip; nothing pins the visible word, and the accessibility gate
      makes no assertion about this control.
- [ ] The fix is described as a repair of the 768–880 band, with the measured before-and-after
      recorded in the pull request body.
