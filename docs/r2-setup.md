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

## The Submissions bucket

A second bucket, `rnui-submissions`, holds **Submissions** — work somebody sent that has not been
reviewed or published (`CONTEXT.md`). It exists as a **separate bucket rather than a
`submissions/` prefix inside `rnui-assets`**, and that is the load-bearing decision: public access
in R2 is a bucket-level setting with **no per-prefix exclusion**, so a prefix would have been
world-readable at `cdn.rnui.dev/submissions/<key>` and cached `immutable` for a year. Unreviewed
work by somebody else must be neither.

| Thing | Value |
| --- | --- |
| Bucket | `rnui-submissions`, location hint WEUR, Standard storage, created 2026-09-25 |
| Public URL | **none, deliberately** — no custom domain, and the `r2.dev` managed domain is disabled |
| Keys | `<ulid>.mp4` — one flat namespace, no prefix. A Submission is not an Asset and its key is not an Asset path (ADR-0003) |
| Lifecycle | `expire-submissions` — `deleteObjectsTransition` `{type: "Age", maxAge: 2592000}`, i.e. 30 days |
| Environment | `R2_SUBMISSIONS_BUCKET`, optional; the tooling defaults to `rnui-submissions` |

### Creating it

```bash
npx wrangler login
npx wrangler r2 bucket create rnui-submissions
```

**Stop there.** Do not run the `domains/custom` call above, and do not enable the `r2.dev` managed
domain. Either one makes submissions public, which is the entire thing the separate bucket exists
to prevent.

### The 30-day rule

`maxAge` is **seconds** in this API — 2592000 for 30 days. This endpoint is a **full replace**, so
a `PUT` that omits the default multipart-abort rule deletes it:

```bash
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/rnui-submissions"
curl -s -X PUT "$API/lifecycle" -H "Authorization: Bearer $CLOUDFLARE_R2_TOKEN" \
  -H "Content-Type: application/json" -d '{"rules":[
    {"id":"Default Multipart Abort Rule","enabled":true,"conditions":{},
     "abortMultipartUploadsTransition":{"condition":{"type":"Age","maxAge":604800}}},
    {"id":"expire-submissions","enabled":true,"conditions":{},
     "deleteObjectsTransition":{"condition":{"type":"Age","maxAge":2592000}}}]}'
```

Objects are typically removed within 24 hours of the expiry time, not at it.

### Reading one back

```bash
pnpm submissions:open <key>              # writes it here
pnpm submissions:open <key> --out <dir>  # writes it into <dir>
pnpm submissions:open --list             # everything still inside the 30 days
```

**Not a presigned URL.** A presigned GET expires in at most 7 days (604,800 s) while the object
lives 30, so a link inside a notification email is dead long before it is used. The command uses
the same `CLOUDFLARE_R2_TOKEN` as `pnpm assets:publish`.

### What was verified, and how — 2026-09-25

| Check | Result |
| --- | --- |
| Anonymous GET via the `r2.dev` hostname | 401 |
| Anonymous GET at the S3 endpoint | 400 — no object served; note this is **not** a clean 403 |
| Anonymous LIST | 400 |
| `cdn.rnui.dev/<key>` | 404 |
| Authenticated GET | 200 |
| Authenticated PUT, then DELETE | 200, 200 |

The bucket carries no custom domain and no enabled managed domain, which is what those numbers
measure. Do not treat the 400s as a deliberate refusal — they are R2 rejecting an unsigned
request, and they are offered as evidence only because no object was served and the same request
authenticated returned 200.

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
