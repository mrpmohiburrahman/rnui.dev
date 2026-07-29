# 02 — R2 bucket published on a custom domain

**What to build:** A public URL on the rnui.dev zone that serves an object out of a Cloudflare R2 bucket, with the cache header intact. After this ticket, fetching a hand-uploaded test object returns 200 with `Cache-Control: public, max-age=31536000, immutable`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**⚠ Requires credentials that do not currently exist.** The account's existing token (`CLOUDFLARE_API_TOKEN_WORKER_AI`) verifies as active and can read the DNS zone, but returns `403 Authentication error` on the R2 API — it has no R2 permission. Before this ticket can run, the account needs:

1. **R2 enabled** on the Cloudflare account. One-time activation; the free tier still requires a payment method on file.
2. **A Cloudflare API token** with `Account → Workers R2 Storage → Edit` and `Zone → DNS → Edit` on rnui.dev. With both scopes, the bucket, the S3 credentials, and the custom-domain binding can all be created through the API — no dashboard work.

Everything downstream of this ticket is gated on it.

- [ ] R2 bucket created. Name recorded in the repo's example env file.
- [ ] Custom domain `cdn.rnui.dev` bound to the bucket and resolving. The rate-limited `r2.dev` development subdomain is explicitly not used — Cloudflare documents it as unsuitable for production.
- [ ] A test object uploaded by hand returns 200 over the custom domain with the correct content type and `Cache-Control: public, max-age=31536000, immutable`.
- [ ] S3-compatible credentials (access key id and secret) minted and stored in local env, never committed.
- [ ] Env variable for the CDN base URL added to the example env file with no secret value.
- [ ] The setup steps are written down so the configuration can be reproduced or handed over.
- [ ] Test object deleted once verified.
