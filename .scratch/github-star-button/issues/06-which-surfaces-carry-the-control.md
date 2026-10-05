# Which surfaces carry the control

Status: open
Type: grilling
Blocked by:

## Question

**This repo serves at least three surfaces, and one of them is a trap.**

Per `CLAUDE.md`: `www.rnui.dev` serves the current Design, `old.rnui.dev` serves the previous one —
a **separate, frozen Vercel project** (`rnui-dev-archive`) that must never be merged into — and a
public branch Preview lives at `preview.rnui.dev`, noindexed, reporting into a different PostHog
project. `SiteHeader` renders from `app/layout.tsx`, so anything added to it appears on all three.

Decide:

- **Does the Preview carry it?** It is public and reachable without Vercel Authentication, and the
  Preview already runs a *different* PostHog project (559028 vs 117415). A star button on a
  noindexed branch preview asks a favour of whoever stumbles onto a URL that is not the site. Its
  analytics would also land somewhere the main dashboards do not read. This is the surface where the
  question is not obvious, and it is the one most likely to be forgotten because it never appears in
  local development.
- **Does `old.rnui.dev`?** `old` is frozen and takes no new code by definition, so the answer is
  almost certainly no — but say so explicitly rather than leaving it implied, because "we added it to
  the header" and "it appears on both live Designs" are different claims.
- **Does the phone header carry it, or is it desktop-only?** `old` is one question; the phone is a
  design question already inside [Five directions for the star control](#01) and should be settled
  there, not duplicated here. This ticket is about *deployments*, not breakpoints.

If the answer is "production only", that is a condition on the implementation — an env check or a
build-time branch test — and it belongs in the spec, so state which mechanism is expected rather than
leaving the implementer to pick.

**The answer is a per-surface yes/no with the mechanism named for any "no".** This is cheap to decide
now and expensive to discover after a Preview has been asking strangers for stars.

## Comments