# 08 — Feature-flag the autoplay rollout

Status: needs-triage
Blocked by: 03

Was `ready-for-agent`. Moved to `needs-triage` on 2026-08-01 because its premise no longer
holds — see `## Why this is back in triage`. Do not implement it as written.

## Problem

Zero feature flags exist. The UI/UX effort is about to make two changes that are hard to
reverse once shipped and that alter what the site's numbers mean:

1. **Autoplay in view.** Recordings will start by themselves, capped at ~5 concurrent. This
   changes the view metric's definition (see the UI/UX decision record) and could regress
   INP on mobile, which is already at 286ms p75 — the worst of the four field metrics.
2. **Card title swap.** The card headline changes from contributor to component name.

Shipping both to everyone at once means a regression cannot be isolated, and the metric
discontinuity cannot be measured — only assumed.

Feature flags are free at this volume.

## Why this is back in triage

Both changes already shipped, unflagged, in the `ui-ux-overhaul` effort — the one CLAUDE.md
records as finished, all 14 tickets `resolved` as of 2026-07-31:

| Change | Where it lives now | Shipped by |
|---|---|---|
| Autoplay, capped at 5 concurrent | `components/playback-owner.tsx:34` (`MAX_PLAYING = 5`) | `ui-ux-overhaul` ticket 09 |
| Caption as the card headline | `components/entry-card.tsx:281` renders `entry.caption`; `entry.author` demoted to `:285` | `ui-ux-overhaul` ticket 06 |

So "roll out 0% → 25% → 100%" is not available. What the work below would actually build is a
**kill-switch retrofitted around live behaviour**, and step 4's flag-on versus flag-off
comparison becomes an A/B of the current site against a rollback. That is a different and much
larger decision than the one this ticket was written for, and it is not the maintainer's to
discover halfway through an implementation.

## Decision needed from the maintainer

Pick one:

1. **Close as `wontfix`.** Both changes are live and, so far, not reported as regressions. The
   thing flags were meant to protect against has already happened without incident.
2. **Keep, rewritten as a kill-switch.** Two flags defaulting to **on**, guarding a revert path
   rather than a rollout. Worth it only if there is real doubt about autoplay's INP cost on
   mobile — and ticket 04's dashboard will answer that without any flag.
3. **Keep only step 3.** `bootstrap` in `posthog.init` is worth having before the *first* flag
   this project ever ships, whenever that is, because a flag arriving after hydration causes
   exactly the layout shift this effort is trying to remove. It is a few lines and depends on
   nothing here. Could become its own ticket.

Recommendation: **1 or 3.** Ticket 04 measures the INP question directly, which is what option
2 was really for.

## Original work, retained for reference

1. Create `catalogue-autoplay`, boolean, default off, rolled out 0% → 25% → 100%.
   Guard the playback provider on it. When off, the tile keeps click-to-play.
2. Create `card-title-caption`, boolean, default off. When off, the card keeps contributor as
   the headline.
3. Add `bootstrap` values to `posthog.init` at `lib/posthog-provider.tsx` so flags resolve on
   first render rather than flickering after hydration.
4. At 25%, compare flag-on against flag-off for: INP p75 on mobile, LCP p75, `repo_clicked`
   per session, and `entry_opened` per session. Hold for a week before going to 100%.
5. Remove both flags and their branches once at 100% for two weeks. A permanent flag is
   permanent dead code.

## Acceptance

Superseded — this ticket cannot be accepted as written. Re-specify after the decision above.

## Depends on

Ticket 03 — `repo_clicked` and `entry_opened` must exist before they can be compared. Still
true for any version of this ticket that keeps step 4.
