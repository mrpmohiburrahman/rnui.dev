# Serving Assets from Cloudflare R2

How `cdn.rnui.dev` is configured, so it can be reproduced or handed over.

Background: [ADR-0001](adr/0001-assets-served-from-object-storage-not-the-repo.md),
[ADR-0003](adr/0003-asset-paths-are-immutable.md).

## What exists

| Thing | Value |
| --- | --- |
| Cloudflare account | `b3a4cec2f17469072a5e97c44424ae14` |
| Zone | `rnui.dev` (`b8902b2df1b2f88edbc54ac0618387fe`) |
| Bucket | `rnui-assets`, location hint WEUR, Standard storage |
| Public URL | `https://cdn.rnui.dev` — an R2 **custom domain**, not `r2.dev` |
| Objects | 554 — 277 Demos, 277 Posters, 74.1 MB against a 10 GB free tier |
| Object metadata | `Cache-Control: public, max-age=31536000, immutable`, plus `video/mp4` or `image/avif` |

The `r2.dev` development subdomain is deliberately unused: Cloudflare rate-limits
it and documents it as unsuitable for production. A custom domain also puts
Cloudflare's cache in front of the bucket, so cached hits never reach R2 and
never count against the Class B operation cap.

## Reproducing it

Needs an API token scoped **Account → Workers R2 Storage → Edit**. Everything
below is API-only; no dashboard step is required once R2 is enabled on the
account. Enabling R2 itself is a one-off click in the dashboard, because it
accepts Cloudflare's terms and starts a usage-billed subscription.

```bash
export CLOUDFLARE_ACCOUNT_ID=...   # account id
export CLOUDFLARE_R2_TOKEN=...     # Workers R2 Storage: Edit
ZONE=...                           # rnui.dev zone id

# 1. The bucket
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets" \
  -H "Authorization: Bearer $CLOUDFLARE_R2_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"rnui-assets","locationHint":"weur"}'

# 2. The public domain. Creates the DNS record and orders the certificate;
#    ssl goes pending -> active in a couple of minutes.
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/rnui-assets/domains/custom" \
  -H "Authorization: Bearer $CLOUDFLARE_R2_TOKEN" -H "Content-Type: application/json" \
  -d "{\"domain\":\"cdn.rnui.dev\",\"zoneId\":\"$ZONE\",\"enabled\":true}"

# 3. Watch for ssl: active
curl -s "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/rnui-assets/domains/custom" \
  -H "Authorization: Bearer $CLOUDFLARE_R2_TOKEN"
```

Then publish and verify:

```bash
pnpm assets:publish                 # every Asset the catalogue references
pnpm check:videos:production        # every Published Asset, from the CDN
```

## Environment

| Variable | Who needs it |
| --- | --- |
| `NEXT_PUBLIC_CDN_URL` | The site, everywhere — local, CI and **the Vercel project**. Public, not a secret. |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_TOKEN`, `R2_BUCKET` | The maintainer running `pnpm assets:publish`. Never committed, never needed by a build. |

`NEXT_PUBLIC_CDN_URL` must be set in the Vercel project settings. Without it the
site resolves Assets to root-relative paths, which no longer exist in a
deployment — see the warning `lib/cdn.ts` logs on startup.

## Things that will bite you

- **The REST API accepts and ignores `If-None-Match`.** A `PUT` overwrites. The
  publish tool therefore lists the bucket first and refuses keys that already
  exist; do not replace that with a conditional write unless you move to the
  S3 endpoint and SigV4.
- **Overwriting a key is unrecoverable for a year.** Objects are served
  `immutable`, so a replaced Asset stays wrong in every cache that holds it,
  with no purge. Re-recording a Demo means a new Asset path — ADR-0003.
- **Orphaned objects are deliberate.** An Asset no longer referenced by the
  catalogue stays in the bucket. Deleting it would break the year-long cached
  URLs still pointing at it, and 74 MB against 10 GB buys nothing back.
