# Does anything acknowledge the press

Status: open
Type: grilling
Blocked by: 03

## Question

**A visitor stars the repo, comes back, and the number they caused to move has not moved — for up to
a week. Is anything said about that?**

This graduated out of the map's fog once
[What may a stale count be allowed to say](#03) settled the refresh cycle. The fog patch had said the
question "depends on whether the Preview is in scope and on whether the count can be current"; neither
holds any more. The count is current by construction (weekly, and now alerted), and the surface
question is [Which surfaces carry the control](#06)'s, not this one's.

The situation is now precisely stateable and it is the one thing the design cannot fix by being
accurate:

- The number is **checked**, not glanced at — the maintainer's own word. So the returning visitor is
  primed to look at it.
- The number is **refreshed weekly**, at 0.4 stars per week, so the typical window where a new star is
  not yet visible is **most of a week**.
- The number is **always shown** and carries **no date**, so nothing on the page says why it has not
  moved.

Nothing here is a data problem. It is a question about whether the site says anything at all about an
action the visitor took somewhere else, on another site, which the site cannot observe.

The options are genuinely different in kind, which is why this was fog and is now a ticket:

- **Nothing.** The header is a static mirror and does not narrate. Cheapest, and consistent with a
  number that is "checked" rather than transactional.
- **A PostHog-only signal** — the star control records that it was clicked, so the maintainer can see
  the outbound intent even though no star is ever observed. No visitor-facing change at all, and it
  folds naturally into whatever [What the control is called, and does it say anything](#05) decides
  about the analytics position. **This may not be a separate decision at all** — check 05 before
  treating it as one, and if 05 already puts a click event on the control, say so and fold this into
  it rather than opening a second analytics decision.
- **A visible acknowledgement** — a toast, or a one-line note. This is the only option the visitor
  sees, and it is the one that costs width in a header that already wraps between 860 and 890 under
  variant F. If this is chosen, it has to say something that is *true* — a toast that says "thanks for
  starring" claims an observation the site cannot make.

Also settle the boundary with [Which surfaces carry the control](#06): on `old.rnui.dev` and the
Preview, the same situation exists with a number nothing will ever refresh. If nothing is said
anywhere, that is consistent; if a visible acknowledgement is added, it is a claim made by two frozen
Deployments and a Preview that will never learn it was wrong.

**The answer is whether the site narrates an action it cannot observe** — and if the answer is yes,
the exact words, plus whether they are the same words on every surface.

## Notes

- Grilling. This is short, and part of it may collapse into ticket 05 — check 05's Answer first.
- **Both dependencies named in the Question are now answered. Do not re-open them.**
  - **05 already put the PostHog-only signal on the control.** It settled `star_clicked` carrying
    `stars_shown`, called from `onClick` in both layouts through one shared handler. So the Question's
    second bullet — "this may not be a separate decision at all" — is answered: **it is not one.** Fold
    it into 05's event and do not open a second analytics decision.
  - **The surface boundary does not exist.** 06 resolved this ticket's `old`-and-Preview worry:
    `preview.rnui.dev` **308s and serves no build**, and the Archive is out **by structure** — `old` is
    a separate Vercel project, `origin/old` has no `site-header.tsx`, and the control is gated to the
    live site. So a visible acknowledgement, if chosen, exists on **exactly one** surface and cannot be
    contradicted by a second frozen Deployment. That removes the reason 06 had to be consulted.

  What is left is the question this ticket was really asking, and it is unchanged: **does the live site
  narrate an action it cannot observe?** Nothing / a visible acknowledgement. If the latter, it must say
  something *true* — a toast thanking a visitor for starring claims an observation the site cannot make.
