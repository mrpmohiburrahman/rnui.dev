# 02 — The `old` branch, and the three Archive-side code changes

Status: ready-for-human
Blocked by: 01

## Problem

The Archive is `main` as it was before the merge (decision 2) plus three changes that
`main` never had, because they were written for the studio-dark branch and this code runs
deploy A.

**`next.config.ts` has no noindex header.** The rule on `feat/studio-dark` matches
`preview\.rnui\.dev|rnui-dev-git-.*\.vercel\.app`; `main` has no `headers()` at all. So
`old.rnui.dev` would serve all 277 Recordings as **indexable duplicate content** against the
live site while `next-sitemap.config.js` claims the same canonical URLs for both. This is
the single highest-consequence item in this effort.

**`/submit` would be a form that refuses every visitor** (decision 11). Turnstile's
hostnames are scoped per environment and `old.rnui.dev` is in none of them.

**`NEXT_PUBLIC_SITE_ORIGIN` must be pinned** (decision 9). Left unset,
`app/actions/subscribe-email.ts` falls back to the `Host` header — which that file's own
comment calls *"a phishing primitive, not just a wrong URL."* `/subscribe` and
`/contactus` keep working; the pin is what makes that safe.

## Work

1. `git branch old <the-pre-merge-main-sha>` — from `539f042`, not from the merged `main`.
2. On `old`: add `headers()` to `next.config.ts` with `X-Robots-Tag: noindex` matched on
   `type: "host", value: "old\\.rnui\\.dev"`, and `Link: <https://www.rnui.dev>; rel="canonical"`.
   **Check the regex cannot match the live host** — there is deliberately no bare
   `rnui\.dev` branch, and `old\.rnui\.dev` must stay anchored.
3. On `old`: make `/submit` 404. `app/not-found.tsx` answers with a `location` header that
   no browser follows, so a plain removal breaks the URL rather than 404ing it — either
   add a route that renders the not-found UI, or add a `redirects()` entry to `/products`
   the way `/feedback` is handled.
4. On `old`: set `NEXT_PUBLIC_SITE_ORIGIN` in the Archive project's env (ticket 03). No
   code change; recorded here because this is the ticket that establishes why.
5. `pnpm test && pnpm check-types && pnpm build` on `old`. Push.

## Acceptance

- `curl -sI https://old.rnui.dev/` carries `x-robots-tag: noindex` and a canonical Link to
  `https://www.rnui.dev` — **measured after ticket 03 deploys it**, not asserted from source.
- `curl -sI -H 'Host: old.rnui.dev' https://old.rnui.dev/` returns no `x-robots-tag` on the
  live host's response to any other path — the blast radius assertion.
- `/submit` on the Archive returns a 404 a browser renders, not a redirect nobody follows.
- `/subscribe` and `/contactus` still render on the Archive.
- `git log --oneline old` shows `539f042` plus this ticket's commits and nothing from the
  studio-dark branch.
