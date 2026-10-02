# 04 — `www.rnui.dev` → studio-dark, and retire `preview.rnui.dev`

Status: resolved
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

## Comments

### 2026-10-02 — Done. The cut is made.

`main` is the Production branch of `rnui-dev` (it already was — no change was needed), the
merged tree is deployed, and `preview.rnui.dev` 308s to `www.rnui.dev`. Measured, not assumed:

| host | http | `x-robots-tag` | serves |
|---|---|---|---|
| `www.rnui.dev` | 200 | *(none — indexable)* | the current Design |
| `rnui.dev` | 307 → `www` | *(none)* | the current Design |
| `old.rnui.dev` | 200 | `noindex` | the previous Design |
| `preview.rnui.dev` | **308** → `www` | `noindex` | the current Design |

PostHog on **both** hosts is `phc_6cIcFcQK` — project 117415, unchanged from deploy A. This
was the decision that had to survive the cut, and it did without an env change: `rnui-dev`'s
Production environment already held 117415's key, and the studio-dark *branch* held 559028's.
Choosing the production **branch** over the branch's own env is what made 559028 a
non-event.

`/`, `/products`, `/contributors`, `/submit`, `/subscribe`, `/contactus`, `/privacypolicy` all
200 on the live site.

### Three things that went wrong on the way, recorded because two were mine

**1. I pushed `main` by accident, in a cleanup command, one line after writing
"(main NOT pushed — pushing it is ticket 04, the cut)".** That queued a production deploy to
`rnui.dev`. The API cancel endpoints (`PATCH v13/v12/v6/deployments/{id}`, and
`POST …/cancel`) all 404; `vercel rm <deployment-url>` worked. `www.rnui.dev` never moved.
A label in a shell command is not a safeguard — the safeguard is not running the command.

**2. Two ADRs were numbered 0009.** `docs/adr/0009-a-contributors-identity-is-their-name-string.md`
already existed and is cited in four places; I added `0009-the-previous-design-…` without
scanning the directory, so `ADR-0009` named two decisions. Renumbered to **0010** and **0011**,
with four references corrected. Found while about to deploy — which is the only reason it was
found, and it is the second time in this effort that reading a rule was not the same as
running it.

**3. The redirect's first test was wrong, not the redirect.** `:path*` matches empty at the
root, so the destination is emitted as `https://www.rnui.dev` with no trailing slash. The
assertion expected the slash and failed; the config was right. The test now asserts what is
emitted and says why, because a redirect that silently gained a slash is one nobody checked.

### One thing left over, and it is not cosmetic

`rnui-dev` is connected to this repository, so pushing `old` also built the Archive as a
**Preview on the live project** — `rnui-dev-archive-git-main-…vercel.app`. It is noindexed by
the `headers()` rule and unreachable, but it exists on the production project. It disappears
when `old` is deleted from `origin`, which is the last line of this effort and is deliberately
not done here: deleting the branch the Archive is built from would leave the Archive
reproducible only from this worktree.
