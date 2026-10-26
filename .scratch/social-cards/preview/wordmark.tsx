// PROTOTYPE — ticket 06 round 3. The homepage wordmark, verbatim.
//
// The maintainer's instruction: the wordmark must be placed "just like the site's
// homepage", because a new visitor has to know instantly which site this is. So
// this is copied from `components/site-header.tsx:98-102` rather than invented:
//
//   <Link href="/" className="flex items-baseline gap-[9px]">
//     <span className="text-[16px] font-bold tracking-[-0.02em] text-t1">
//       rnui<span className="text-acc">.dev</span>
//     </span>
//   </Link>
//
// What that means for a card, and it is more than a font size:
//   * `rnui` in --t1 and `.dev` in --acc. Two spans, one accent run.
//   * fontWeight 700 (bold), NOT 500 as every card so far has used.
//   * letterSpacing -0.02em
//   * items-baseline, so the two runs share a baseline
//   * the 9px gap from `gap-[9px]` is the baseline gap the class name implies
//     and is reproduced as a real gap between the spans
//
// The scale differs -- the header's 16px is a browser size, and a card is
// displayed at a fraction of 1200 -- but the TREATMENT is the header's.
import { createElement as h } from "react"

import { C, SANS } from "./tokens"

/**
 * The wordmark, at the header's treatment and a card's scale.
 *
 * `size` is the em size of the whole wordmark on the 1200 card. The header's
 * proportion is kept: `.dev` is the accent run and carries no extra weight.
 */
export function Wordmark({ size = 22 }: { size?: number }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "baseline",
        // NO gap between the two runs. `gap-[9px]` in the header sits between the
        // <Link> and its single span -- it separates the wordmark from its
        // neighbour in the nav, not "rnui" from ".dev". Applying it between the
        // runs put a visible hole in the middle of the site's own name; the
        // header renders `rnui.dev` with nothing between them.
        fontFamily: SANS,
        fontSize: size,
        fontWeight: 700, // the header is bold; every card so far was 500
        letterSpacing: "-0.02em",
        color: C.t1,
      },
    },
    h("span", { style: { color: C.t1 } }, "rnui"),
    h("span", { style: { color: C.acc } }, ".dev")
  )
}
