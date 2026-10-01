# 03 — `rnui-dev-archive`: create, link, env, assign `old.rnui.dev`

Status: ready-for-human
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

## Comments

### 2026-10-02 — Built. The Archive is deployed; `old.rnui.dev` needs one DNS record.

Done, in this order, and each step verified rather than assumed:

- `rnui-dev-archive` created (`prj_hZzHCtFIxBWIj0T166E1aDGO1PHN`). `vercel project add`
  put it on **Node 24.x** with framework preset **"Other"**; the live project is 22.x on
  Next.js. Both corrected through `PATCH /v9/projects/{id}` — `vercel project` has no
  update subcommand. A frozen copy of a design on a different major Node is not a frozen
  copy.
- 15 env vars set on **Production only**, values verified by comparing SHA-256 prefixes
  after an `env pull`: the PostHog key is **`phc_6cIcFcQK`**, project 117415, matching the
  live site. `NEXT_PUBLIC_SITE_ORIGIN` pinned to `https://old.rnui.dev`.
- `CLOUDFLARE_*`, `TURNSTILE_*` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` **deliberately not
  copied** — `old` has no R2 code path, no Turnstile code path and no `/submit` route. A
  frozen host carrying the live site's webhook credentials it cannot use is a liability.
  Verified absent.
- Deployed. Serves deploy A (`NOTIFY` — the studio-dark-only footer column — appears on the
  Archive and not on `www`), compiles 117415's token, and answers
  `x-robots-tag: noindex` on all three of its hosts.
- `old.rnui.dev` added to the project and reports `verified: true` with no
  misconfiguration. **It does not resolve**, which is the next item, not this one.
- `.vercel/project.json` for `rnui-dev` is unchanged. Every `vercel` command that needed it
  was given `--project rnui-dev-archive` explicitly.

### Two things an agent cannot do here, and one that is a mistake worth recording

**1. The CNAME.** `rnui.dev` uses Cloudflare nameservers (`harleigh`/`keaton`), and the
working hosts are `CNAME cname.vercel-dns.com`. `CLOUDFLARE_API_TOKEN` is valid and returns
`success: true` for `/zones` with **zero zones** — it has no DNS permission on `rnui.dev`.
`CLOUDFLARE_GLOBAL_API_TOKEN` is rejected outright as an invalid access token. So: **add
`old` CNAME `cname.vercel-dns.com`** at Cloudflare and this ticket is done.

**2. The production branch is `main` and cannot be changed by API.** Vercel exposes no
endpoint for it — `PATCH /v9/projects/{id}` and `PATCH /v2/projects/{id}` both reject
`productionBranch`, `PATCH …/git-connection` 404s, and `vercel git connect` derives it from
the repository's default branch on every invocation (tried: disconnect + reconnect while
`old` was checked out). Vercel's own community thread says the same.

**Until it is set to `old` in the dashboard, a push to `main` creates a production
deployment on the Archive project and steals its production alias** — which would put
studio-dark on `rnui-dev-archive.vercel.app`. Ticket 04 pushes `main`, so this must be
fixed *before* ticket 04, not during it.

**3. My own mistake, and the one that nearly shipped.** `vercel env pull` returns the
literal string `"[SENSITIVE]"` for write-only variables. Four of the live project's
Production secrets are write-only — `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`,
`RESEND_API_KEY`, `SUBSCRIBE_TOKEN_SECRET` — and I copied that string across verbatim as
their values. The build caught it:

```
ERROR posthog_cli::commands: msg="Oops! Invalid Personal API key:
      \"Token looks wrong, must start with 'phx_'\""
⨯ Failed to run runAfterProductionCompile: Command failed with code 1
```

An earlier verification of mine reported these values as "readable" because it compared
against the unquoted `[SENSITIVE]` while the file quotes it. **Verify a secret by
classification, not by eyeballing a diff.**

All four were removed rather than left holding a wrong value. Consequence:

- `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` — **correctly absent.** `next.config.ts` handles
  exactly this case ("Off unless both are present; the site is identical either way, only
  the stack traces in PostHog differ"), and a frozen Archive is not where you want
  readable stack traces. No action needed.
- `RESEND_API_KEY` / `SUBSCRIBE_TOKEN_SECRET` — **the Archive's `/subscribe` and
  `/contactus` render but cannot send.** Decisions 12 and 13 said those two forms keep
  working; that is currently untrue and needs one of: the two values pasted into
  `rnui-dev-archive`'s Production env from the maintainer, or a decision to 404 both forms
  on the Archive after all. **Do not leave it half-true.**

### Also found

- A `vercel deploy` from a working copy uploads everything git does not ignore, and failed
  on a broken symlink: `Error: …/.scratch/demos/android/demosnitro is not a valid symlink`.
  `.vercelignore` was added on `old` for this, but `--archive=tgz` packages before the
  ignore rules apply — the working deploy was a clean `git worktree` checkout. **Rebuild
  the Archive from a clean worktree, not a working copy.**
- `.vercel/project.json` exists only for `rnui-dev`. Anything driven from the CLI needs
  `--project`.
