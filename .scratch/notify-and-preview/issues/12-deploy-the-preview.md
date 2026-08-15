# Put Studio Dark on preview.rnui.dev

Status: ready-for-human
Type: task
Blocked by: 02

## Question

Serve the Studio Dark build at `preview.rnui.dev`, alongside the live site rather than instead of
it. This is what lets deploy A collect undisturbed for six weeks without hiding the redesign from
anyone who wants to see it — the two goals stopped competing the moment the Preview got its own
address.

Two things must be right or it does damage:

**Its PostHog events go to a separate project.** Decision 3. If the Preview reports into the main
project, deploy A's baseline becomes a blend of old-site and Studio Dark visitors, and the entire
reason for splitting into two deploys is gone. The `api_host` constraint still holds —
`https://us.i.posthog.com`, per `studio-dark/spec.md`; a first-party proxy previously got rnui.dev
categorised as Malware.

**It must not be indexed.** 277 Recordings served on two hostnames is duplicate content, and
Google may well rank the Preview against the real site. Cheap to prevent, tedious to undo.

The Preview is retired at deploy B, not merged — Studio Dark reaches `rnui.dev` through the normal
deploy, and `preview.rnui.dev` 301s to the root afterwards.

## Acceptance

- `preview.rnui.dev` serving the Studio Dark build.
- A **separate PostHog project**, its key in the Preview's environment only. Verified by confirming
  no Preview event appears in the main project.
- `X-Robots-Tag: noindex` (or equivalent) on every Preview response, and verified on a live URL.
- `api_host` unchanged.
- The deploy-B retirement plan — 301 to root — written down here, so it is not rediscovered later.

## Standing it up

Three steps, none of which an agent can reach: the Cloudflare DNS token in this repo is R2-scoped,
the Vercel connector exposes no domain or environment-variable tool, and the PostHog connector
exposes no project-create tool. All three were checked, not assumed.

**1. The PostHog project.** Create one in the existing organisation
(`01945af3-0d2e-0000-1292-5fc1a9fde6a8`) — the four projects there today are `rnui.dev dashboard`
(117415), `pixellog.io dashboard`, `resume` and `graflet`, and none of them is this. Its
`phc_…` token is what the Preview reports with.

**2. The Vercel environment variable.** Set `NEXT_PUBLIC_POSTHOG_KEY` to that token **scoped to
Preview**, and narrow the existing production value to **Production**. This is the step with a
silent failure mode: a key left on "All Environments" reaches the Preview as well, deploy A's
baseline quietly becomes a blend of old-site and Studio Dark visitors, and nothing looks wrong
until deploy B is compared against it and the comparison means nothing. `.env` and `.env.local`
are both untracked and gitignored, so there is no committed key that could override this — the
Vercel dashboard is the only source. Set `NEXT_PUBLIC_SITE_ORIGIN=https://preview.rnui.dev` on
the same scope while there; `.env.example` already names it.

**3. The domain.** Add `preview.rnui.dev` to the `rnui-dev` project
(`prj_oJwJTNITIGO5i4MqVVGqjLaPIOfc`) and assign it to the `feat/studio-dark` branch, then add
`preview` as a **CNAME to `cname.vercel-dns.com`, DNS-only (grey cloud)** at Cloudflare. That is
the shape `www.rnui.dev` already has and it resolves to Vercel's IPs rather than Cloudflare's, so
the existing records are the pattern to copy rather than a case to reason about. The subdomain
does not resolve at all today.

Assigning the domain to the branch is what makes this the Preview rather than deploy B. The merge
to `main` is deploy B and `studio-dark` checkpoint 5 gates it; nothing here touches `main`.

## Retiring it at deploy B

Acceptance bullet 5. The Preview is retired, not merged — Studio Dark reaches `rnui.dev` through
the ordinary deploy, so at that point `preview.rnui.dev` is a second hostname serving the same
site as the first.

1. **Unassign `preview.rnui.dev` from `feat/studio-dark`** on Vercel, then set the domain to
   redirect to `rnui.dev` with **301**. Vercel does this at the domain, before any request reaches
   the app, so it needs no code and no deploy.
2. **Delete the `headers()` rule in `next.config.ts`** and `tests/e2e/preview-noindex.spec.ts`
   with it. Once the redirect is at the edge the rule can never match again — it is dead config
   from that moment, and dead config that mentions a live-looking hostname is exactly what gets
   copied forward by someone who assumes it still does something.
3. **Leave the Preview's PostHog project in place.** Nothing reports into it after step 1, and it
   holds the only record of how the Preview behaved. Do not delete it to tidy up.

301 rather than the 307 used for `/feedback`, and the difference is deliberate: a permanent
redirect a browser has cached cannot be revoked, which is a reason to avoid one for a rule that
might be reverted, and a reason to *use* one for a hostname being retired for good. There is no
ranking to consolidate — the noindex saw to that — so the 301 exists to keep links people shared
during the Preview from breaking, not for SEO.

## Comments

**2026-08-15 — the noindex is built and verified locally; the three standing-up steps are the
maintainer's.** Status `ready-for-human`.

**One of the five acceptance bullets is met outright, one is half-met**, and the count is worth
stating precisely because the noindex bullet asks for two separate things:

- **`api_host` unchanged — met.** `lib/posthog-provider.tsx` is untouched and still hardcodes
  `https://us.i.posthog.com`. Nothing here adds an environment variable that could move it.
- **`X-Robots-Tag: noindex` — built, but "verified on a live URL" is not met** and cannot be until
  the host exists. One host-conditional rule in `next.config.ts`, verified against a real
  production build (`pnpm build` + `pnpm start`) rather than by reading the config. Measured, with
  the header present on `/`, `/products`, `/robots.txt`, a 404 and a `/_next/static` chunk; absent
  on `rnui.dev`, on `www.rnui.dev` and on localhost. That last row is the one worth re-running
  after any edit to the rule.

**The rule covers two hosts, not one.** `preview.rnui.dev` is the Preview proper, but the branch is
also served at `rnui-dev-git-feat-studio-dark-*.vercel.app` — the same 277 Recordings on a third
hostname, and the same duplicate content the ticket exists to prevent. Vercel is widely said to
noindex its own deployment URLs; from here both `.vercel.app` hosts were unreachable, so that could
not be measured, and it is too load-bearing to assume. The rule covers the alias itself instead.
An earlier draft of this comment asserted that Vercel's auto-noindex "stops applying once a custom
domain is attached to the branch" — that was written from recollection, not evidence, and is gone.

**A known exception, deliberately not chased.** A `redirects()` entry resolves before headers are
written, so two kinds of response answer without the header: the one config redirect (`/feedback`,
307) and Next's trailing-slash normalisation (`/products/`, 308). Both are empty redirects whose
destination *does* carry the header, so there is no body for a crawler to index. The redirects in
`middleware.ts` are unaffected — they run after the header is written and were measured carrying
it. Closing the remaining two would mean moving those redirects into middleware, which is a lot of
moving parts for nothing that would have been indexed.

A header, not a `robots.txt` rule, and not only because the ticket said "or equivalent":
`Disallow` stops the crawl, and a page that is never crawled is a page whose noindex is never
read — a URL blocked that way can still be indexed from inbound links. next-sitemap keeps
generating an allow-all `robots.txt` on the Preview, which is what lets a crawler reach the header
and obey it.

`.env.example` gained `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_UI_HOST`. Both are read with a
non-null assertion in `lib/posthog-provider.tsx` and neither was documented anywhere, so a fresh
clone initialised posthog-js with `undefined`. That gap is older than this ticket, but the first
variable is the one this ticket turns into a per-environment decision, so it is documented where
the decision has to be made.

What is left needs the maintainer: the three steps under **Standing it up**, and then two live
checks that close the half-met bullet and bullet 2 — `curl -I https://preview.rnui.dev/` shows
`x-robots-tag: noindex`, and no event with `$host = preview.rnui.dev` appears in project 117415.
Acceptance bullet 5, the retirement plan, is met above under **Retiring it at deploy B**.

Nothing here touches `main`, and nothing here is deploy B. Assigning the domain to the branch is
what keeps it the Preview; `studio-dark` checkpoint 5 still gates the merge.
