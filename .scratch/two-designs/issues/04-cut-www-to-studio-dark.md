# 04 — `www.rnui.dev` → studio-dark, and retire `preview.rnui.dev`

Status: ready-for-human
Blocked by: 01, 03

## Problem

This is the cut. It is the moment visitors see the new design, it is hard to reverse in the
only sense that matters — the annotation and the analytics history either line up or they do
not — and it needs the Archive already standing, or a broken flip leaves `www.rnui.dev`
serving something nobody chose.

`www.rnui.dev` currently aliases deployment `rnui-avci131g7e-…vercel.app` together with the
apex `rnui.dev`, `rnui-dev.vercel.app` and `rnui-dev-git-main-…vercel.app`. Four hosts, one
deployment. The cut has to move all of them or leave some behind pointing at the old design.

## Preconditions — verify each, do not assume

- `old.rnui.dev` answers 200 and carries `x-robots-tag: noindex` (tickets 02, 03).
- The Archive's chunks carry the 117415 token (ticket 03).
- `rnui-dev`'s Production env still holds the 117415 key, not 559028. `vercel env ls`.
- `main` is merged and green (ticket 01).
- The three keyboard-parity specs pass — measured, not read:
  `pnpm exec playwright test tests/e2e/posthog-events.spec.ts` → 3/3.

## Work

1. Make `main` the Production branch of `rnui-dev`. **Read the current setting first** —
   `studio-dark`'s checkpoint 13 gates deploy B, and that gate is what ADR-0011 moved.
2. Deploy `main` to Production. Watch the build; the two hosts must not be dark at once.
3. Point `www.rnui.dev`, `rnui.dev`, `rnui-dev.vercel.app` at the new deployment. Verify with
   `vercel alias ls` — a leftover alias on the old deployment is a silent second site.
4. Verify `www.rnui.dev` serves the studio-dark design and `old.rnui.dev` still serves
   deploy A. **Grep both chunk sets for their PostHog tokens** — the same measurement that
   was used to chart this effort is the measurement that proves it worked.
5. `preview.rnui.dev` 301s to `https://www.rnui.dev`. Do this **last**; until the swap lands
   it would point at the wrong design.
6. Confirm the live site's headers carry **no** `x-robots-tag`. The noindex regex on
   `main` covers `preview\.rnui\.dev` and the branch aliases — it must not match `www`.

## Acceptance

- `www.rnui.dev` serves the studio-dark design; `old.rnui.dev` serves deploy A; both 200.
- Both compile the 117415 token.
- `www.rnui.dev/` carries no `x-robots-tag`. `old.rnui.dev/` carries `noindex`.
- `preview.rnui.dev` 301s to `https://www.rnui.dev`.
- `vercel alias ls` shows no alias still pointing at the superseded deployment.
- PostHog shows `$pageview` from both hosts within minutes, separable on `$host`.
