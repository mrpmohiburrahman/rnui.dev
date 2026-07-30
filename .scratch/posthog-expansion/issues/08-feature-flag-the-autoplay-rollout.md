# 08 — Feature-flag the autoplay rollout

Status: ready-for-agent

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

## Work

1. Create `catalogue-autoplay`, boolean, default off, rolled out 0% → 25% → 100%.
   Guard the playback provider on it. When off, the tile keeps click-to-play.
2. Create `card-title-caption`, boolean, default off. When off, the card keeps contributor as
   the headline.
3. Add `bootstrap` values to `posthog.init` at `lib/posthog-provider.tsx:14-25` so flags
   resolve on first render rather than flickering after hydration. A flag that arrives late
   causes exactly the layout shift this effort is trying to remove.
4. At 25%, compare flag-on against flag-off for: INP p75 on mobile, LCP p75, `repo_clicked`
   per session, and `entry_opened` per session. Hold for a week before going to 100%.
5. Remove both flags and their branches once at 100% for two weeks. A permanent flag is
   permanent dead code.

## Acceptance

- Both flags exist and default to off.
- With flags off, the site behaves exactly as it does today.
- Flags resolve before first paint — verified by checking that no card changes its headline
  after load.
- A comparison of the four metrics above at 25% is recorded under `## Comments` before
  anything goes to 100%.

## Depends on

Ticket 03 — `repo_clicked` and `entry_opened` must exist before they can be compared.
