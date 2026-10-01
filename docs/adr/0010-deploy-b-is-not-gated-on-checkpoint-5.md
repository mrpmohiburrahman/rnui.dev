# Deploy B is not gated on studio-dark's checkpoint 5

`studio-dark`'s `spec.md` checkpoint 5 states that contrast, keyboard and reduced-motion
verification plus the LCP/CLS/INP measurement are acceptance, not a follow-up, and eight of
its fifteen tickets still carry `Status: ready-for-human`. The design nonetheless went to
`www.rnui.dev` before that gate was satisfied.

This is recorded so the repo never reads as though the gate had been met. The gate was
moved deliberately, by the maintainer, and the honest description of the state is "shipped
with the verification outstanding" rather than either "shipped after verification" or
"verification is a follow-up".

One thing is *not* waived. Ticket 15 asserts keyboard parity — that `S` produces the same
`bookmark_added` as the Save button, that `V` produces the same `vote_cast`, and that `/`
produces no `search_performed`. Those are precisely the claims that would catch a PostHog
regression on the live site, so they have to be green before the flip.

**They are green.** `pnpm exec playwright test tests/e2e/posthog-events.spec.ts` → 3/3.
This is worth recording because the ticket itself reports them failing in every
configuration, and that report was true when written on 2026-08-04: the specs wrap
`window.posthog.capture` while `lib/analytics.ts` talks to the `posthog-js` module
singleton directly, and nothing bridged the two. `lib/posthog-provider.tsx` now assigns
`window.posthog = posthog` at init, which is the same singleton, so the spy reads every
call site. **A ticket's recorded failure is not evidence about the current tree** — re-run
it before deciding it is a blocker.

The rest of ticket 15 — the inventory of every autocapture-based insight and heatmap that
the restyle invalidates, and the annotation on dashboard `1937576` — becomes more important,
not less, now that the Archive sits in the same project publishing the same 277 Recordings.
Every one of those insights also needs a `$host` filter, because both hosts report to
project 117415.