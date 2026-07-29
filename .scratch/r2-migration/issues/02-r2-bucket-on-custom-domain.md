# 02 — R2 bucket published on a custom domain

**What to build:** A public URL on the rnui.dev zone that serves an object out of a Cloudflare R2 bucket, with the cache header intact. After this ticket, fetching a hand-uploaded test object returns 200 with `Cache-Control: public, max-age=31536000, immutable`.

**Blocked by:** None — can start immediately.

**Status:** resolved

**⚠ Blocked on one human action. Verified 2026-07-29.**

Findings from probing the account:

- Cloudflare account `b3a4cec2f17469072a5e97c44424ae14`, logged in, zone rnui.dev present.
- The existing token `CLOUDFLARE_API_TOKEN_WORKER_AI` verifies as active and **can** read the DNS zone, but returns `403 Authentication error` on the R2 API. It has no R2 scope.
- **R2 is not yet enabled on the account.** The R2 page shows an "Add R2 subscription to my account" gate reading *Total Due Now $0.00 · Due Monthly $0.00 + additional usage*, with free-tier limits of 10 GB storage, 1M Class A and 10M Class B operations per month. The 554 referenced Assets total roughly 77 MB.

Clicking that gate accepts Cloudflare's Terms and starts a usage-billed subscription against the payment method on file. That is a legal and financial commitment, so it is left to the maintainer.

**Unblock in two steps:**

1. Click **Add R2 subscription to my account** on the R2 page.
2. Create a Cloudflare API token scoped `Account → Workers R2 Storage → Edit` **and** `Zone → DNS → Edit` on rnui.dev. With both scopes, the bucket, the S3 credentials and the custom-domain binding can all be created through the API — no further dashboard work.

Everything downstream of this ticket is gated on it.

- [x] R2 bucket created. Name recorded in the repo's example env file.
- [x] Custom domain `cdn.rnui.dev` bound to the bucket and resolving. The rate-limited `r2.dev` development subdomain is explicitly not used — Cloudflare documents it as unsuitable for production.
- [x] A test object uploaded by hand returns 200 over the custom domain with the correct content type and `Cache-Control: public, max-age=31536000, immutable`.
- [x] S3-compatible credentials (access key id and secret) minted and stored in local env, never committed.
- [x] Env variable for the CDN base URL added to the example env file with no secret value.
- [x] The setup steps are written down so the configuration can be reproduced or handed over.
- [x] Test object deleted once verified.

## Outcome

The human blocker cleared: R2 is enabled on the account and a token scoped
`Workers R2 Storage: Edit` exists as `CLOUDFLARE_R2_TOKEN`.

- Bucket `rnui-assets` created (WEUR, Standard).
- `cdn.rnui.dev` bound as an R2 **custom domain** on zone `b8902b2df1b2f88edbc54ac0618387fe`. SSL went pending -> active in about two minutes. `r2.dev` not used.
- Smoke object returned `HTTP 200`, `content-type: text/plain`, `cache-control: public, max-age=31536000, immutable`; a missing key returned 404. Object deleted after verification.
- Setup written up at `docs/r2-setup.md`; `NEXT_PUBLIC_CDN_URL` and the maintainer-only credentials documented in `.env.example`.

The token has no Zone scope, so it could not read the zone id — that came from
the wrangler OAuth session. The custom-domain call itself needed only the R2
scope, so no DNS-scoped token was required after all.

S3-compatible credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) exist in
the local environment and are uncommitted, but nothing uses them: the publish
tool talks to the Cloudflare REST API with the Bearer token, which needs no
SigV4 and therefore no S3 SDK.

**Still a maintainer action:** `NEXT_PUBLIC_CDN_URL=https://cdn.rnui.dev` must be
added to the Vercel project settings, and the ImageKit variables removed there.
No Vercel CLI or project link exists in this checkout.
