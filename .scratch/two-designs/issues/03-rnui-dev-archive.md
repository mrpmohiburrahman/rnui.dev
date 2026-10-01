# 03 — `rnui-dev-archive`: create, link, env, assign `old.rnui.dev`

Status: ready-for-agent
Blocked by: 02

## Problem

Vercel scopes env vars to **environments** (Production / Preview / Development), not
branches — a branch deployment always receives the Preview set. Publishing the Archive as a
branch of `rnui-dev` therefore hands it the Preview PostHog key (559028) and the Preview
Turnstile hostnames, and neither is correctable per-branch without breaking every
feature-branch preview. Hence a second project (decision 4).

`.vercel/project.json` is per-directory, so this project's link must not overwrite the
live one. Check whether `vercel link` supports a non-default state path before running it
in the working directory.

## Work

1. `vercel project create rnui-dev-archive` — Next.js, Node 22.x, matching `rnui-dev`.
2. Link the repo with its own `.vercel` state, or document the `--cwd` arrangement.
3. Env, all scoped **Production only**, all copied from `rnui-dev`'s Production values:
   the full Firebase set, `NEXT_PUBLIC_POSTHOG_KEY` (117415's), `NEXT_PUBLIC_SITE_ORIGIN`
   pinned to `https://old.rnui.dev`, `TURNSTILE_HOSTNAMES` (unused — `/submit` is gone —
   but harmless), `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
   `CLOUDFLARE_*`, `R2_*`, `SUPABASE_*`, `RESEND_API_KEY`, `SUBSCRIBE_TOKEN_SECRET`,
   `NEXT_PUBLIC_CDN_URL`, `NEXT_PUBLIC_UI_HOST`, `NEXT_PUBLIC_POSTHOG_API_HOST`.
   **`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` decide whether source maps upload** —
   `next.config.ts` warns when exactly one is set. Copy both or neither.
4. Production branch = `old`.
5. Add `old.rnui.dev` to `rnui.dev`'s DNS as an alias to the Archive project. **Check
   `vercel domains ls` first** — `rnui.dev` is already registered in `rnui-dev` with
   third-party nameservers, so the subdomain has to be added there rather than to the new
   project, or the two will fight over the zone.
6. Deploy and verify against ticket 02's acceptance.

## Acceptance

- `old.rnui.dev` resolves and serves the deploy-A design.
- `curl -sI https://old.rnui.dev/` answers `x-robots-tag: noindex` (ticket 02's first bullet).
- The Archive's compiled chunks contain the **117415** token, not 559028 — grep the JS, the
  way the two live builds were measured for charting.
- `.vercel/project.json` for `rnui-dev` is unchanged.
