# 02 — R2 bucket published on a custom domain

**What to build:** A public URL on the rnui.dev zone that serves an object out of a Cloudflare R2 bucket, with the cache header intact. After this ticket, fetching a hand-uploaded test object returns 200 with `Cache-Control: public, max-age=31536000, immutable`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

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

- [ ] R2 bucket created. Name recorded in the repo's example env file.
- [ ] Custom domain `cdn.rnui.dev` bound to the bucket and resolving. The rate-limited `r2.dev` development subdomain is explicitly not used — Cloudflare documents it as unsuitable for production.
- [ ] A test object uploaded by hand returns 200 over the custom domain with the correct content type and `Cache-Control: public, max-age=31536000, immutable`.
- [ ] S3-compatible credentials (access key id and secret) minted and stored in local env, never committed.
- [ ] Env variable for the CDN base URL added to the example env file with no secret value.
- [ ] The setup steps are written down so the configuration can be reproduced or handed over.
- [ ] Test object deleted once verified.
