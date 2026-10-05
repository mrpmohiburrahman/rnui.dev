# Does the Saved chip's word drop ship with the star control, or separately

Status: open
Type: grilling
Blocked by:

## Question

**The chosen direction costs a change to a component the star control was never meant to touch.**

[Five directions for the star control](#01) resolved to **variant F**: A's chip shape at every desktop
width, with the words "Saved" *and* "Star" appearing only from `xl`. That only works because the
existing `Saved` chip gives up its word below `xl` — and it can, because the phone header at
`site-header.tsx:175` already draws `◆ 0` with no word at all. But shipping it means editing a
component that is not the star button.

Underneath that is a finding, not a preference. Measured on 2026-10-05 against the real site with no
star control present: **the `Saved` chip already wraps to 46px and the mode toggle to 49px at 768 and
820.** That is broken in production today, on the band `site-header.tsx:90-92` already says does not
fit. Adding a third control to that band without a fix is what clips the theme toggle off-screen.

So decide, explicitly:

- **Does the `Saved` word drop below `xl` ship as part of this feature, or as its own fix?** Both are
  defensible. Bundling it means the star button's PR also repairs a layout bug, and the diff touches
  a component with its own history. Splitting it means the star button is blocked on a fix that has
  nothing to do with stars — and until that fix lands, the star button cannot be F, so it would have
  to be A (clips at 768) or B (no chip at all).
- **Is the 768–880 breakage in scope for this map at all?** The map's destination is a spec for a star
  control. A pre-existing header bug is arguably the map's **Out of scope** — but if F is chosen, the
  map cannot be done without answering the scope question, so it cannot simply be ruled out and
  forgotten.
- **If the Saved word does not drop, does F survive some other way?** Worth ruling in or out rather
  than leaving implicit: the alternative is buying the width from somewhere else — the star chip's own
  word only (leaves `Saved` still wrapping at 768, which the baseline already does), or the search
  field's fixed `w-[424px]` shrinking between `md` and `xl`, which is a much larger change to the
  header's centring logic and would move the search bar's midpoint. The prototype did not test the
  search-width option; it is named here so it is visibly weighed rather than overlooked.

**The answer is one of: bundled / split, plus whether 768–880 is in scope or out of it** — tight
enough that the spec can state which files it touches.

## Comments
