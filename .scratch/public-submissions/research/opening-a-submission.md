# Opening a Submission: storage placement, the link in the email, and whether it needs a new secret

Primary-source research, 2026-09-25. Ticket: `issues/04-how-the-maintainer-opens-a-submission.md`.
Builds on `research/r2-presigned-uploads.md` (cited as **R2PU** below), which already establishes that R2
supports presigned GET/HEAD/PUT/DELETE, that a presigned URL never works on a custom domain, and that
object-scoped temporary credentials are documented for S3 clients, not for presigning.

## Question

The notification email (ticket 09) carries a link, not an attachment (map decision 12,
`.scratch/public-submissions/map.md`). The bucket a naive link would point into, `rnui-assets`, is **public**
through `cdn.rnui.dev` with `Cache-Control: public, max-age=31536000, immutable` on every object
(`docs/r2-setup.md`). A Submission is unreviewed work by somebody else: it must not be publicly readable and
must not be cached for a year. How does the maintainer open one?

## Findings

### 1. A separate prefix in the same bucket, or a separate bucket?

**A separate bucket. A `submissions/` prefix inside `rnui-assets` leaks by construction.**

| Fact | Source |
| --- | --- |
| Public access is a **bucket-level** setting with exactly two shapes: "Expose your bucket as a custom domain under your control" or "Expose your bucket using a Cloudflare-managed `https://r2.dev` subdomain". No prefix-level or per-object exclusion is documented. | <https://developers.cloudflare.com/r2/buckets/public-buckets/> |
| `rnui-assets` already uses the first shape: "`https://cdn.rnui.dev` — an R2 **custom domain**, not `r2.dev`". | `docs/r2-setup.md` |
| The only documented restrictions on a custom-domain bucket are themselves bucket/domain-wide: "use Cloudflare's existing security products" — Zero Trust Access, or WAF Token Authentication. WAF HMAC "requires Pro plan or above"; neither can carve out a prefix of the same bucket. | <https://developers.cloudflare.com/r2/buckets/public-buckets/>, <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |

Consequence: with a `submissions/` prefix, the object is world-readable at
`https://cdn.rnui.dev/submissions/<key>` — a bare GET, no credential, no expiry, behind a cache that can hold
it for a year. Every object in a public bucket is public; the prefix is a naming convention, not an access
boundary.

**Cost against the free tier.** R2 bills "the total volume of data stored" and publishes its free tier as a
flat allowance — Storage `10 GB-month / month`, Class A `1 million requests / month`, Class B
`10 million requests / month`, egress free (<https://developers.cloudflare.com/r2/pricing/>). The page does not
attach that allowance to a bucket, and it states the free tier covers Standard storage only; whether a second
bucket shares the account's allowance is **unconfirmed** — but the page gives no per-bucket dimension, so
assume it is shared.

- A separate bucket therefore costs exactly the objects put in it: ≤5 MB each (`map.md` decision 3), deleted
  after 30 days by lifecycle rule (decision 11). 10 GB ÷ 5 MB ≈ 2,000 retained submissions before any charge,
  and the realistic arrival rate is orders of magnitude below that.
- A `submissions/` prefix costs the same bytes and cannot be made private. Same price, unbounded downside.
- `rnui-assets` today is "554 — 277 Demos, 277 Posters, 74.1 MB" (`docs/r2-setup.md`), i.e. ~0.7% of the free
  tier, which is why nothing here is a storage-capacity argument.
- The only extra cost of a separate bucket is configuration: one more bucket to create, and a lifecycle rule
  per bucket (rules are per bucket, prefix-scoped, "1000 rule maximum" —
  <https://developers.cloudflare.com/r2/buckets/object-lifecycles/>). A lifecycle rule with
  `Filter: { Prefix: "submissions/" }` and an `Expiration` is the documented, unattended deletion mechanism;
  "Objects will typically be removed from a bucket within 24 hours of the `x-amz-expiration` value".

**Would a `submissions/` prefix confuse `publish-assets.ts`? No — but the code path decides it, so state it precisely.**

- `loadPublishedKeys()` lists the **whole bucket**, paged: `` `${api}/objects?per_page=1000` `` with a `cursor`,
  adding every `obj.key` to a `Set` (`scripts/publish-assets.ts` lines 80–102).
- The `Set` is only ever queried with catalogue paths: `main()` builds `paths` from
  `narrow(allAssetPaths, fragments)` (line 149) and checks `published.has(path)` before `publish(path)`
  (line 206). `publish()` PUTs only `path`, and only after `CONTENT_TYPES[extname(path)]` resolves
  (lines 104–136).
- `allAssetPaths` can only produce `demo/…` and `thumbnails/…` (`lib/asset-path.ts` lines 31–32, 69–71), so a
  `submissions/…` key can never be selected, never uploaded over, and never mistaken for a Published Asset.
- What it *would* do is pollute the publisher's safety mechanism. The whole-bucket listing exists as a
  correctness check — the comment at lines 69–79 says listing once "replaces ~560 cheap Class B operations"
  because this API "answers HEAD with 405" — and an unreviewed namespace arriving through that same listing
  degrades the one audit the publisher performs, for no benefit. Listing is a Class A operation
  (`ListObjects` — <https://developers.cloudflare.com/r2/pricing/>).

**Recommendation.** A second bucket, e.g. `rnui-submissions`, with public access never enabled, plus a
`submissions/` prefix inside it and a 30-day lifecycle rule. Keys are `submissions/<key>.mp4`. Nothing about
the published catalogue changes, and `publish-assets.ts` never sees a Submission.

### 2. How is the link in the email made to work?

The four candidates, against the two hard constraints (not public, not cached for a year):

| Option | What the email contains | Stops working when | New infra / credential | Verdict |
| --- | --- | --- | --- | --- |
| **A — presigned GET minted at send time** | A signed URL on `<ACCOUNT_ID>.r2.cloudflarestorage.com`, valid **1 s – 7 days (604,800 s)**, fixed at signing time by `X-Amz-Expires`; generated server-side "with no communication with R2" | At expiry: `403 ExpiredRequest` (error `10018`); tampering with expiry yields `403 SignatureDoesNotMatch` (`10035`) | Mints with R2 API credentials (Access Key ID + Secret Access Key) — see §3 | Works, but the maximum life is 7 days while decision 11 keeps the object 30 |
| **B — "long-lived" presigned GET** | Same, at `X-Amz-Expires=604800` | 7 days. There is no longer URL; 7 days **is** the ceiling | Same as A | Not a third option — it collapses into A at its maximum |
| **C — Worker endpoint streaming on an authenticated request** | A Worker URL (`/open/<key>` or similar) guarded by Cloudflare Access or an HMAC check | When the lifecycle rule deletes the object (~30 days), or when the access session ends | A Worker, a `wrangler` config and a deploy path the repo does not have (R2PU, "Architecture B"), plus an Access application | The only option with no expiry, but the most machinery — and WAF HMAC needs Pro |
| **D — download locally with the token the repo already has** | A command, not a URL: `GET https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET/objects/$KEY` with `Authorization: Bearer $CLOUDFLARE_R2_TOKEN` — "Retrieves an object from an R2 bucket. Returns the object body along with metadata headers." | When the object is deleted (~30 days). No signature, so no expiry | None — the same credential `publish-assets.ts` already uses | Cheapest, works for the object's whole life, never touches a public host |

Sources for that table: expiry range, generation and custom-domain exclusion —
<https://developers.cloudflare.com/r2/api/s3/presigned-urls/>; expiry failure —
<https://developers.cloudflare.com/r2/api/error-codes/> (`10018 ExpiredRequest`, 403) and
<https://developers.cloudflare.com/r2/buckets/cors/> ("Expired presigned URLs return a `403` `ExpiredRequest`
response"); the REST endpoint and that it returns the body plus metadata headers —
<https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/methods/get/>;
the Bearer-token call shape already in use — `scripts/publish-assets.ts` lines 57–58, 87, 128–136; Worker cost —
`map.md` (10 ms CPU) and R2PU's Architecture B row.

Three points decide between them:

1. **CORS is not a factor for the maintainer.** "Only a cross-origin request includes CORS response headers.
   R2 identifies these requests by an `Origin` HTTP request header." A click from an email client is a
   top-level navigation with no `Origin`, so it needs no bucket CORS policy
   (<https://developers.cloudflare.com/r2/buckets/cors/>). CORS *is* required for the browser-side upload,
   not for the download.
2. **A presigned GET cannot be the only link, because 7 days < 30 days.** The email arrives once; the object
   lives 30 days. Any emailed URL that is a signature is dead for most of the object's life, and re-minting
   means the maintainer runs something — at which point a command is as good as a URL.
3. **Nothing may be stored with the catalogue's cache header.** `lib/asset-path.ts` line 45 defines
   `CACHE_CONTROL = "public, max-age=31536000, immutable"`, and `publish-assets.ts` line 133 writes it on
   every PUT. A Submission must instead be stored with a no-store value; `Content-Type`, `Content-Disposition`
   and `Cache-Control` are all settable object metadata ("You can set the Content-Type (MIME type),
   `Content-Disposition`, `Cache-Control` and other HTTP header metadata" —
   <https://developers.cloudflare.com/r2/objects/upload-objects/>), and the presigned PUT binds `Content-Type`
   through the signature (R2PU). Whether R2 returns the stored `Cache-Control` on a presigned GET is
   **unconfirmed** by any page read here; storing `no-store` is the safe direction either way, and the S3 API
   host is not the CDN host, so the year-long CDN cache in front of `cdn.rnui.dev` never sees it
   (<https://developers.cloudflare.com/r2/buckets/public-buckets/> for what caching applies where).

**Recommendation for the email.** Lead with option **D** — the email carries the key and a command the
maintainer can paste into a shell that already has `CLOUDFLARE_R2_TOKEN` (`pnpm submissions:open <key>`,
implemented with the REST "Get Object" endpoint above). It survives the object's full 30 days, has no
signature to expire, costs no new infrastructure and no new secret, and cannot be forwarded into a public
cache by accident. Offer option **A** only as a convenience: a 7-day presigned GET minted by the same script
on demand (`pnpm submissions:link <key>`), never minted at send time and never the only route.

### 3. Does presigning need a new credential?

**Yes for a presigned URL; no for the recommended path.** Two separate answers, because they use different APIs.

- **Option D (REST API) needs nothing new.** `scripts/publish-assets.ts` already authenticates to
  `https://api.cloudflare.com/client/v4/accounts/{account}/r2/buckets/{bucket}/…` with
  `Authorization: Bearer $CLOUDFLARE_R2_TOKEN` (lines 57–58, 128–136), and the same endpoint family serves
  "Get Object" (<https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/methods/get/>).
  Same env var, same permission (`Workers R2 Storage: Edit` — "read, write, and list objects",
  <https://developers.cloudflare.com/r2/api/tokens/>), no second secret.
- **A presigned URL needs a credential the repo does not hold.** Presigning "requir[es] only your R2 API
  credentials and an implementation of the AWS Signature Version 4 signing algorithm"
  (<https://developers.cloudflare.com/r2/api/s3/presigned-urls/>), and R2 defines those as the token pair:
  "**Access Key ID**: The `id` of the API token. **Secret Access Key**: The SHA-256 hash of the API token
  `value`" (<https://developers.cloudflare.com/r2/api/tokens/>). `docs/r2-setup.md` records only
  `CLOUDFLARE_R2_TOKEN` — the **value** — so even if the existing token could sign, its `id` (a different
  value) is not in the environment and would have to be looked up first. R2 also warns that its token flow "is
  different from generating API tokens for other services", and whether a token minted outside
  *R2 → Manage API Tokens* converts by that rule is **unconfirmed** (R2PU §"So can the repo's existing token
  mint presigned URLs?").
- **The credential to provision, if presigning is wanted:** a second **R2 API token**, permission **Object
  Read only**, scoped to the submissions bucket ("If you select the Object Read and Write or Object Read
  permissions, you can scope your token to a set of buckets" — <https://developers.cloudflare.com/r2/api/tokens/>),
  held as `R2_SUBMISSIONS_ACCESS_KEY_ID` and `R2_SUBMISSIONS_SECRET_ACCESS_KEY`. Name it `R2_SUBMISSIONS_*`
  rather than reusing `CLOUDFLARE_R2_TOKEN`: it is read-only, bucket-scoped, and revocable without disturbing
  the publisher. It needs to exist only where links are minted (the maintainer's shell; the Vercel project if
  a route handler mints them).
- Temporary credentials are the tighter option on paper — `scope: object-read-only`, `prefixes`, `ttlSeconds`,
  "A temporary credential cannot exceed its parent"
  (<https://developers.cloudflare.com/r2/api/s3/temporary-credentials/>) — but whether a **presigned URL** can
  be signed with one is **unconfirmed** (R2PU), so it is not a recommendation here.


### 4. What does the object look like when it arrives?

| Property | As stored | Source |
| --- | --- | --- |
| Key | Authored by us, not by the submitter: `submissions/<key>.mp4` in the submissions bucket. Keys are flat and path-like; "May contain slashes for path-like keys" | <https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/methods/get/> |
| Key encoding on read-back | "Slashes (`/`) within the key MUST be sent literally and MUST NOT be percent-encoded (i.e. `%2F`)" — a local-open script must not reuse `encodeKey` from `publish-assets.ts` (lines 59–60), which encodes each segment | <https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/methods/get/>, `scripts/publish-assets.ts` |
| Content type | Whatever the upload sent in the `Content-Type` header, stored as object metadata. R2 stores `Content-Type`, `Content-Disposition` and `Cache-Control` as object metadata; it performs **no** content sniffing, so "a valid `video/mp4` MIME with arbitrary payload is accepted" | <https://developers.cloudflare.com/r2/objects/upload-objects/>, R2PU |
| Size | The PUT body's own byte count; `Content-Length` is mandatory on PUT (`10033 MissingContentLength`, 411). Size is only knowable after upload — metadata comes back with the body | <https://developers.cloudflare.com/r2/api/error-codes/>, <https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/methods/get/> |
| Extension | Not "survived" from anywhere — it is written by us. `File.type` is not read from the bytes: "browsers won't actually read the bytestream of a file to determine its media type. It is assumed based on the file extension… Uncommon file extensions would return an empty string" | <https://developer.mozilla.org/en-US/docs/Web/API/Blob/type> |

So the `.mp4` question has a sharp practical form. A visitor picks `IMG_0001.MOV`; the browser hands the page
`type: "video/quicktime"` on the strength of the extension (MDN, above). If the compression step re-encodes to
a Blob and that Blob is uploaded under a Content-Type derived from the *original* file, the object is stored as
`video/quicktime` under a `.mp4` key — a mismatch that survives into review, because R2 accepts any MIME with
any payload and never checks. The extension therefore lives or dies on our own ingest code, not on the upload:
the compression step must construct the file with its own name and type, and the route handler must derive
`Content-Type` from a fixed allow-list (`video/mp4` only), not from `file.type` or `file.name`. Which container
`MediaRecorder` produces by default, and whether a `.mp4` recorder is available in the browsers that matter, is
**unconfirmed** here — it belongs to tickets 02/06, and this ticket only needs the rule that the stored
`Content-Type` is ours to set and the signature enforces it.

## Bottom line

**Storage.** A dedicated bucket (`rnui-submissions`), never made public, with a `submissions/` prefix and a
30-day lifecycle rule. A `submissions/` prefix inside `rnui-assets` is publicly readable at
`https://cdn.rnui.dev/submissions/<key>` the moment it exists, because public access is a bucket setting with
no per-prefix exclusion. `publish-assets.ts` would *not* be confused — it lists the whole bucket
(`loadPublishedKeys`, lines 80–102) but only ever queries that set with catalogue paths
(`narrow(allAssetPaths, …)`, lines 149 and 206; `lib/asset-path.ts` lines 31–32, 69–71) — its objection is
that unreviewed keys pollute the one listing it treats as a safety check.

**What the email link contains.** The object key plus a copy-pasteable command — `pnpm submissions:open <key>`
— backed by a small local script that HTTP-GETs
`/accounts/$ACCOUNT_ID/r2/buckets/rnui-submissions/objects/submissions/<key>.mp4` with the existing
`CLOUDFLARE_R2_TOKEN`. Optionally, alongside it, a re-mintable 7-day presigned GET
(`pnpm submissions:link <key>`) as a clickable path, minted on demand and never at send time.

**When it stops working.** The command works for as long as the object exists: it stops when the 30-day
lifecycle rule deletes it (typically within 24 hours of `x-amz-expiration`). A presigned alternative stops at
`X-Amz-Expires`, at most 7 days (604,800 s) after `X-Amz-Date`, and then returns `403 ExpiredRequest` (10018).

**New credential.** No, for the recommendation — the REST API path reuses `CLOUDFLARE_R2_TOKEN`. Yes, if a
presigned URL is wanted: a new **R2 API token with Object Read only, scoped to the submissions bucket**
(`R2_SUBMISSIONS_ACCESS_KEY_ID` + `R2_SUBMISSIONS_SECRET_ACCESS_KEY`), because the repo holds only the token
*value* while presigning needs the token *id* as the Access Key ID and the SHA-256 of the value as the Secret
Access Key, and whether a non-R2 token converts that way is unconfirmed.

**Cache.** No Submission object may be written with `lib/asset-path.ts`'s `CACHE_CONTROL` (line 45). Store
`no-store`, and never route a Submission through `cdn.rnui.dev`.
