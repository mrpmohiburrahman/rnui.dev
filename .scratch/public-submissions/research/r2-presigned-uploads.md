# R2 presigned uploads vs Worker ingest (primary-source research)

## Question

Two candidate architectures for letting a browser upload a file (target ≤ 5 MB) into the existing
private R2 bucket `rnui-assets` from the Next.js 16 app on Vercel Hobby, whose Vercel Function
payload ceiling is 4.5 MB:

- **A — presigned PUT direct to R2**, minted by a Node.js route handler.
- **B — Cloudflare Worker with an R2 binding** receiving the upload directly.

Which one needs less new machinery and fewer new credentials, and what can each actually enforce?
Every claim below cites the page that owns it. Anything a primary source does not confirm is marked
**unconfirmed**. Two behaviours of `aws4fetch` are measured locally against the published package
artifact (Node v22.13.1, `aws4fetch@1.0.20`) and are labelled as measured, not documented.

## Findings

### 1. Presigned PUT is supported; endpoint, region/service, payload hash

| Item | Value | Source |
| --- | --- | --- |
| Supported presigned methods | `GET`, `HEAD`, `PUT`, `DELETE`. `POST` (multipart form uploads via HTML forms) "is not currently supported" | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Expiry bound | 1 second to 7 days (604,800 s), starting from `X-Amz-Date` | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Generation | Server-side, "with no communication with R2", requiring the R2 credentials and an implementation of SigV4 | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Account-scoped endpoint (path style) | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<bucket>/<key>` | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>, <https://developers.cloudflare.com/r2/examples/aws/aws4fetch/> |
| Virtual-hosted style (in R2's own SDK example comment) | `https://<bucket>.<ACCOUNT_ID>.r2.cloudflarestorage.com/<key>` | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Jurisdiction endpoints | `<ACCOUNT_ID>.eu.`, `.fedramp.`, `.us.` `r2.cloudflarestorage.com`; jurisdictional buckets only reachable through the matching host | <https://developers.cloudflare.com/r2/api/tokens/> |
| Region for SigV4 | `auto`; an empty value and `us-east-1` alias to it | <https://developers.cloudflare.com/r2/api/s3/api/> |
| Service for SigV4 | `s3` ("Required by SDK but not used by R2") | <https://developers.cloudflare.com/r2/examples/aws/aws4fetch/> |
| Algorithm / credential scope | `AWS4-HMAC-SHA256`, scope `<YYYYMMDD>/auto/s3/aws4_request` | R2's own example presigned URL: `X-Amz-Credential=CFEXAMPLEKEY12345%2F20251201%2Fauto%2Fs3%2Faws4_request` — <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Payload hash for a presigned PUT | `UNSIGNED-PAYLOAD` — R2's example presigned URL carries `X-Amz-Content-Sha256=UNSIGNED-PAYLOAD` | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Parameters that must not be tampered with | `X-Amz-Algorithm`, `X-Amz-Credential`, `X-Amz-Date`, `X-Amz-Expires`, `X-Amz-Signature`; altering resource, operation or expiry yields `403/SignatureDoesNotMatch` | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Custom domains | Presigned URLs work only with the S3 API domain "and cannot be used with custom domains" | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Errors to expect | `10035 SignatureDoesNotMatch` (403), `10018 ExpiredRequest` (403), `10033 MissingContentLength` (411, "Content-Length header required but missing… in PUT/POST requests") | <https://developers.cloudflare.com/r2/api/error-codes/> |

Concrete host for this account (account ID from `docs/r2-setup.md`):
`https://b3a4cec2f17469072a5e97c44424ae14.r2.cloudflarestorage.com/rnui-assets/<key>`.
Uploads therefore never touch `cdn.rnui.dev`, and the CDN cache is not involved
(<https://developers.cloudflare.com/r2/api/s3/presigned-urls/>).

### 2. Which credential mints the URL — the crux

There is one credential object type underneath, but two permission groups, and the two are **not**
interchangeable for the repo's existing tooling.

| Question | Answer | Source |
| --- | --- | --- |
| What the R2 dashboard flow gives you | "Secret Access Key" and "Access Key ID" values, used as the S3 credentials; Client Secret / Client ID are the same pair | <https://developers.cloudflare.com/r2/api/tokens/> |
| What those values are | Access Key ID = the **`id` of the API token**; Secret Access Key = the **SHA-256 hash of the API token `value`** | <https://developers.cloudflare.com/r2/api/tokens/> |
| Is an "R2 API token" the same object as a "Workers R2 Storage: Edit" Cloudflare API token? | Same class of object — a Cloudflare API token carrying `Workers R2 Storage*` permission groups. Evidence: R2's temporary-credentials example sends an R2 API token as `Authorization: Bearer <PARENT_API_TOKEN>` to `api.cloudflare.com`, alongside `parentAccessKeyId` | <https://developers.cloudflare.com/r2/examples/authenticate-r2-temp-credentials/>, <https://developers.cloudflare.com/r2/api/tokens/> |
| So can the repo's existing token mint presigned URLs? | **In principle yes** (its permission group includes object read/write), but **unconfirmed**: the derivation rule sits on the R2 token page, which says the R2 flow "is different from generating API tokens for other services". No page states that a token minted under *My Profile → API Tokens* converts via `id` + `SHA-256(value)` | <https://developers.cloudflare.com/r2/api/tokens/> |
| Permission group names | Cloudflare's permission reference lists both `Workers R2 Storage Edit` and `Workers R2 Storage Write`; R2's docs use the latter: "Can create, delete, and list buckets, edit bucket configuration, and read, write, and list objects" | <https://developers.cloudflare.com/fundamentals/api/reference/permissions/>, <https://developers.cloudflare.com/r2/api/tokens/> |
| Can a least-privilege R2 object token replace the repo's REST token? | **No.** "The **Object Read & Write** and **Object Read only** permissions are only supported by the S3-compatible API, not the Cloudflare REST API." `scripts/publish-assets.ts` uses the REST API (LIST + `PUT /objects/<key>`). Two credentials, necessarily | <https://developers.cloudflare.com/r2/api/tokens/> |
| Is there a "separate S3 API key/secret"? | Same object, different view: the documented least-privilege path is a token created for R2 with **Object Read & Write** and optionally scoped to a set of buckets, whose `id`/`value` become the S3 pair | <https://developers.cloudflare.com/r2/api/tokens/> |
| Blast radius if you derive S3 credentials from the existing account token | The signing secret *is* account-wide admin in that case; the presigned URL is still one object + one operation, but the key that minted it is not scoped to `rnui-assets` | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>, <https://developers.cloudflare.com/r2/api/tokens/> |

Practical reading: the credential the repo already holds is the REST/management credential. Presigning
wants a second, narrower one — R2 API token → **Object Read & Write** → scope to `rnui-assets` — kept
as server-only env vars in the Vercel project. That is one new credential, and it deliberately cannot
run `pnpm assets:publish` (REST surface), which is the least-privilege split
(<https://developers.cloudflare.com/r2/api/tokens/>).

### 3. Yes — a few kB of `aws4fetch`, no `@aws-sdk/client-s3`

R2 documents `aws4fetch` directly for JS/TS: "This package uses the `fetch` and `SubtleCrypto` APIs
which you will be familiar with when working in browsers or with Cloudflare Workers", and you only
pass the R2 credentials when instantiating the client
(<https://developers.cloudflare.com/r2/examples/aws/aws4fetch/>). R2 also publishes a Worker-side
presign snippet using it (<https://developers.cloudflare.com/r2/objects/upload-objects/>).

Minimal correct call shape for a presigned PUT (R2 docs; `Content-Type` added so it can be signed —
see §4):

```ts
import { AwsClient } from "aws4fetch";

const r2 = new AwsClient({
  service: "s3",   // Required by SDK but not used by R2
  region: "auto",  // Required by SDK but not used by R2
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
});

const url = new URL(
  `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/rnui-assets/submissions/<key>.mp4`,
);
url.searchParams.set("X-Amz-Expires", "600"); // 1 s – 604800 s

const signed = await r2.sign(
  new Request(url, { method: "PUT", headers: { "Content-Type": "video/mp4" } }),
  { aws: { signQuery: true, allHeaders: true } }, // allHeaders is required to sign content-type
);
const putUrl = signed.url.toString(); // hand to the browser
```

Evidence for the last line — measured locally against the published package
(`aws4fetch@1.0.20`, `dist/aws4fetch.esm.mjs`, Node v22.13.1): `UNSIGNABLE_HEADERS` contains
`authorization`, `content-type`, `content-length`, `user-agent`, `presigned-expires`, `expect`,
`x-amzn-trace-id`, `range`, `connection`, and signable headers are
`['host', ...headers].filter(h => allHeaders || !UNSIGNABLE_HEADERS.has(h))`. Outputs observed:

| Call | `X-Amz-SignedHeaders` |
| --- | --- |
| `sign(req, { aws: { signQuery: true } })` | `host` |
| `sign(req, { aws: { signQuery: true, allHeaders: true } })` with `Content-Type` + `Content-Length` set | `content-length;content-type;host` |

(Measured; the R2 doc example shows `X-Amz-SignedHeaders=content-type%3Bhost` for code that omits
`allHeaders`, which does not match the library's 1.0.20 default. Pass `allHeaders: true` if you want
`Content-Type` bound into the signature.)

In query mode `aws4fetch` inserts `X-Amz-Date`, `X-Amz-Expires` (defaulting to `86400` if you do not
set it — within R2's 7-day ceiling), `X-Amz-Algorithm`, `X-Amz-Credential`, `X-Amz-SignedHeaders` and
`X-Amz-Signature` into the URL, and uses `UNSIGNED-PAYLOAD` as the body hash for `service: "s3"` in
`signQuery` mode (source: `dist/aws4fetch.esm.js` in the published tarball,
<https://registry.npmjs.org/aws4fetch/-/aws4fetch-1.0.20.tgz>).

Sizes (measured from that tarball; `gzip -9`): `dist/aws4fetch.esm.js` 11,283 B raw / 3,557 B
gzipped; `dist/aws4fetch.umd.js` 12,318 B / 3,784 B. The package README claims "6.4kb minified,
2.5kb gzipped" and the package declares **zero runtime dependencies**, MIT, shipping only `dist`
(<https://registry.npmjs.org/aws4fetch/latest>).

"A few hundred bytes of hand-rolled WebCrypto": **unconfirmed**. No primary source documents a
minimal hand-rolled SigV4 presigner, and no byte count is published for one. What is confirmed is
that the algorithm needs nothing beyond `fetch` + `SubtleCrypto`
(<https://developers.cloudflare.com/r2/examples/aws/aws4fetch/>), so a bespoke implementation is
feasible; `aws4fetch` at ~3.5 kB gzipped is the documented version of it.

### 4. What a presigned PUT can and cannot enforce

**Content-Type: enforceable. Maximum size: not enforceable.** R2 has no POST-form upload support, so
the S3 `content-length-range` POST-policy mechanism does not exist on R2 at all.

| Mechanism | What it actually enforces | Evidence / status |
| --- | --- | --- |
| Signed `Content-Type` header | Hard: the upload fails when the client sends a different `Content-Type`. R2 states this twice — "The upload will fail if the client sends a different `Content-Type` header" and, in best practices, "uploads will fail with a `403/SignatureDoesNotMatch` error" | <https://developers.cloudflare.com/r2/examples/aws/aws4fetch/>, <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Signed `Content-Length` header | Signable in principle (measured: `allHeaders: true` puts `content-length` into `X-Amz-SignedHeaders`). Whether R2 rejects a PUT whose body length differs from the signed value is **unconfirmed** — R2 documents enforcement only for `Content-Type` | measured against `aws4fetch@1.0.20`; absence of a claim: <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>, <https://developers.cloudflare.com/r2/examples/aws/aws4fetch/> |
| S3 POST policy `content-length-range` (min/max) | **Unavailable on R2.** "`POST` (multipart form uploads via HTML forms) is not currently supported." The condition itself is an S3 feature — e.g. `Conditions: [["content-length-range", 2, 5]]` in a presigned POST | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>, <https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3/client/generate_presigned_post.html> |
| CORS `AllowedOrigins` | **Browser-enforced only.** R2 returns CORS headers keyed off the request's `Origin` header; any non-browser client can set any `Origin`. Not a security boundary | <https://developers.cloudflare.com/r2/buckets/cors/> |
| R2 hard upload caps (always on) | 5 GiB per single-part upload (4.995 TiB multipart), 5 TiB per object; exceeding them gives `400 EntityTooLarge` / `100100`. A 500 MB PUT is accepted | <https://developers.cloudflare.com/r2/platform/limits/>, <https://developers.cloudflare.com/r2/api/error-codes/> |
| Short `X-Amz-Expires` | Shrinks the window, not the bytes. The URL stays reusable until expiry | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Single-object, single-operation scope | Cannot be repointed (resource, operation or expiry tampering → 403), so a fresh unguessable key per upload is the right shape. No size effect | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Object lifecycle rule (delete after N days) | Cleanup, not prevention; objects are typically removed within 24 h of the `x-amz-expiration` value | <https://developers.cloudflare.com/r2/buckets/object-lifecycles/> |
| Post-upload reconciliation | A HEAD/GET after the PUT to check size and metadata, then delete the object. Application code, not an R2 feature | R2 writes are strongly consistent once the PUT returns: <https://developers.cloudflare.com/r2/api/workers/workers-api-reference/> |
| A server that terminates the request (Worker) | The only place bytes can be counted and refused. Cloudflare's own reference architecture does the *metadata* check in a Worker before issuing the signed URL ("the file is within acceptable limits (for example, 10MB max), allowed MIME types") and then hands the URL to the client — a policy check on client-claimed values, with only the `Content-Type` signature holding after that | <https://developers.cloudflare.com/reference-architecture/diagrams/storage/storing-user-generated-content/> |

Two further consequences worth stating plainly:

- A signed `Content-Type` pins the *declared* MIME type, not the bytes. The uploader chooses the
  Blob's type; a valid `video/mp4` MIME with arbitrary payload is accepted. R2 performs no content
  sniffing that any source documents — **unconfirmed** that it does any.
- If a hard 5 MB ceiling is a requirement rather than a preference, architecture A cannot provide it
  as shipped: you would need B (Worker counting bytes), or A plus a post-upload check-and-delete
  sweep, or a storage service that still implements S3 POST policies.

### 5. Bucket CORS required for a browser PUT from `https://rnui.dev`

R2 requires a bucket CORS policy for any browser use of a presigned URL: "Without a CORS policy,
browser-based uploads and downloads using presigned URLs will fail, even though the presigned URL
itself is valid" (<https://developers.cloudflare.com/r2/buckets/cors/>).

Minimal policy for this case — PUT only, `Content-Type` allowed, `ETag` readable:

```json
[
  {
    "AllowedOrigins": ["https://rnui.dev"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

| Detail | Rule | Source |
| --- | --- | --- |
| Preflight | A PUT with `Content-Type: video/mp4` (or `image/avif`) is not a simple request — PUT is not a safelisted method and neither MIME type is a safelisted `Content-Type` value — so the browser sends `OPTIONS` first and the answer must allow both the method and the header | <https://fetch.spec.whatwg.org/#cors-safelisted-request-header>, <https://developers.cloudflare.com/r2/buckets/cors/> |
| `AllowedMethods` | Must include the verbs the presigned URLs use: "use `GET`, `PUT`, `HEAD`, and/or `DELETE`" | <https://developers.cloudflare.com/r2/buckets/cors/> |
| `AllowedHeaders` | "Set `AllowedHeaders` to include any headers the client will send when using the presigned URL, such as headers for content type, checksums, caching, or custom metadata" — add `Cache-Control`, `Content-Disposition`, `x-amz-checksum-*` if the client sends them | <https://developers.cloudflare.com/r2/buckets/cors/> |
| `AllowedOrigins` syntax | Either `*` or a valid origin: `scheme://host[:port]`, no path, exact match unless one `*` wildcard is used (which may span periods). `https://rnui.dev/` is invalid | <https://developers.cloudflare.com/r2/buckets/cors/> |
| Local development | Ports cannot be wildcarded; list each origin separately, e.g. `https://rnui.dev`, `http://localhost:3000` | <https://developers.cloudflare.com/r2/buckets/cors/> |
| Origin gating | "Only a cross-origin request includes CORS response headers… Requests without an `Origin` header do not return CORS response headers" | <https://developers.cloudflare.com/r2/buckets/cors/> |
| Expired presigned URLs | Return `403 ExpiredRequest` **without** CORS headers, so browser JS cannot read the error body — refresh before expiry, or proxy through the app server if the browser must handle expiry | <https://developers.cloudflare.com/r2/buckets/cors/> |
| `MaxAgeSeconds` | Caches the preflight; browsers may cap it at 2 h even if 86400 is set | <https://developers.cloudflare.com/r2/buckets/cors/> |
| Propagation | CORS rule changes can take up to 30 seconds to propagate | <https://developers.cloudflare.com/r2/buckets/cors/> |

Applying it — two documented routes, with two different JSON shapes:

```sh
# Wrangler: note this is the bucket-config shape, not the dashboard shape above
# cors.json = {"rules":[{"allowed":{"origins":["https://rnui.dev"],"methods":["PUT"],"headers":["Content-Type"]}}]}
npx wrangler r2 bucket cors set rnui-assets --file cors.json
# Dashboard: R2 → rnui-assets → Settings → CORS Policy → Add CORS policy → JSON tab
```

Sources: <https://developers.cloudflare.com/r2/buckets/cors/>,
<https://developers.cloudflare.com/workers/wrangler/commands/r2/>.
The REST surface exists as `PUT /accounts/{account_id}/r2/buckets/{bucket_name}/cors` (with GET and
DELETE), so it is scriptable, but the CORS doc itself documents only dashboard and Wrangler
(<https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/cors/>).

One caching caveat: a CORS policy change on a bucket already serving via a custom domain does not
update already-cached assets until they are purged
(<https://developers.cloudflare.com/r2/buckets/cors/>) — relevant to cross-origin GETs of
`cdn.rnui.dev` objects, not to the PUT path.

### 6. Bucket-scoped tokens, write-only scope, and URL lifetime

| Question | Answer | Source |
| --- | --- | --- |
| Can an R2 token be scoped to one bucket? | Yes, for the object-level permissions: "If you select the **Object Read and Write** or **Object Read** permissions, you can scope your token to a set of buckets" | <https://developers.cloudflare.com/r2/api/tokens/> |
| Can it be write-only? | **No.** The four permissions are Admin Read & Write, Admin Read only, **Object Read & Write** (read, write, *and list* objects) and Object Read only. No write-only permission exists for a long-lived token | <https://developers.cloudflare.com/r2/api/tokens/> |
| Where per-operation scoping does exist | Temporary credentials: `scope` presets (`object-read-only`, `object-read-write`, `admin-read-only`, `admin-read-write`) or an explicit `actions` list. `actions: ["PutObject"]` is the closest thing to write-only, but "`actions` is currently supported via local signing only" (not yet via the Temporary Credentials API) | <https://developers.cloudflare.com/r2/api/s3/temporary-credentials/> |
| Other temporary-credential bounds | Exactly one bucket per credential; optional `prefixes` / `objects`; `ttlSeconds` (default 1 h); "A temporary credential cannot exceed its parent"; "If you revoke the parent API token, all temporary credentials derived from it stop working immediately" | <https://developers.cloudflare.com/r2/api/s3/temporary-credentials/> |
| Is a presigned URL's lifetime bounded by the token? | Not by the token — by `X-Amz-Expires` (1 s – 604,800 s), fixed at signing time. The token's permissions bound *what* the URL may do (bucket, operation, key), not how long it lives; signing happens locally "with no communication with R2" | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> |
| Does revoking the token kill an outstanding presigned URL? | **Unconfirmed for R2 presigned URLs.** R2 states the invalidation guarantee only for temporary credentials. AWS states the analogous rule for its own presigned URLs ("a presigned URL expires when the credential you used to create it is revoked, deleted, or deactivated"), which does not transfer to R2 | <https://developers.cloudflare.com/r2/api/s3/temporary-credentials/>, <https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html> |
| Can a presigned URL be signed with temporary credentials? | **Unconfirmed** — R2's presign page lists only the R2 API token (Access Key ID / Secret Access Key). `aws4fetch` accepts a `sessionToken` and temporary credentials are documented with S3 clients, but no R2 page shows a presigned URL carrying `X-Amz-Security-Token` | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>, <https://developers.cloudflare.com/r2/api/s3/temporary-credentials/> |

Net: the tightest credential available for signing today is an R2 API token with **Object Read &
Write** scoped to `rnui-assets` — read/list included, unavoidably. Per-operation write-only means
local-signing temporary credentials, which is unproven for presigning.

### 7. Worker-with-binding ingest on the Free plan

| Limit | Workers Free | Notes / source |
| --- | --- | --- |
| Requests | 100,000/day | <https://developers.cloudflare.com/workers/platform/limits/> |
| CPU time per HTTP request | 10 ms | same |
| Memory | 128 MB per isolate | same |
| Subrequests | 50/request | same |
| Simultaneous outgoing connections | 6 | same |
| Worker size / Workers per account | 64 MiB / 100 | same |
| **Request body size** (your Cloudflare account plan, not the Workers plan) | **Free 100 MB**, Pro 100 MB, Business 200 MB, Enterprise up to 5 GB | same; exceeding returns `413` |
| Wall time, incoming HTTP request | Unlimited while the client stays connected | same |

A 5 MB upload is therefore an order of magnitude inside that ceiling (5 MB vs 100 MB).

**Buffering is not required.** The canonical documented Worker is exactly this pass-through:

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    if (request.method === "PUT") {
      await env.MY_BUCKET.put(key, request.body); // streams the request body into R2
      return new Response(`Put ${key} successfully!`);
    }
  },
};
```

`put()` accepts `ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob`, plus
`onlyIf` (conditional writes), `httpMetadata`, `customMetadata`, and checksums
(<https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>). R2's own guidance:
a Request body can only be read once, clone it if you need it twice, and "Workers have a memory
limit of 128 MB per Worker and loading particularly large files into a Worker's memory multiple times
may reach this limit. To ensure memory usage does not reach this limit, consider using Streams"
(<https://developers.cloudflare.com/r2/api/workers/workers-api-usage/>).

**Does a 5 MB write fit the 10 ms CPU budget?** Partially confirmable, and the answer is "expected to,
but not documented for this workload":

- CPU time "measures how long the CPU spends executing your Worker code. Waiting on network requests
  (such as `fetch()` calls, KV reads, or database queries) does **not** count toward CPU time." A
  streamed pass-through is I/O wait, not CPU (<https://developers.cloudflare.com/workers/platform/limits/>).
- Documented reference points: "the average Worker uses approximately 2.2 ms per request"; heavier
  workloads that "parse large payloads" typically use 10–20 ms — i.e. per-byte work is what burns
  CPU (<https://developers.cloudflare.com/workers/platform/limits/>).
- Isolates get "some built-in flexibility… where your Worker infrequently runs over the configured
  limit"; sustained overage terminates the invocation with error 1102
  (<https://developers.cloudflare.com/workers/platform/limits/).
- **Unconfirmed:** no primary source measures a 5 MB `put(request.body)` on the Free plan. The
  doc-supported reading is that it is I/O-bound and fits; the failure mode to design around is any
  per-byte work (hashing, re-encoding, `arrayBuffer()`), which pushes CPU proportional to size.

If the endpoint is public, the 100,000 requests/day cap matters more than CPU: it is the first Free
plan limit a submission endpoint can exhaust
(<https://developers.cloudflare.com/workers/platform/limits/>).

Two extras the binding gives you that the presigned path does not:

- Conditional writes: `put(key, value, { onlyIf })` with `If-None-Match` / `If-Match`, returning
  `null` when the precondition fails — the create-only semantics `scripts/publish-assets.ts` currently
  emulates with a LIST because the REST API ignores `If-None-Match`
  (<https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>,
  <https://developers.cloudflare.com/r2/api/s3/api/>, `docs/r2-setup.md`).
- Metadata set at write time (`httpMetadata: { contentType, cacheControl }`), so no second request is
  needed to tag the object (<https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>).

### 8. Object lifecycle rules for auto-deletion: yes, and they are API-configurable

R2 supports lifecycle rules that delete objects after N days (or on a date), transition storage class,
and abort incomplete multipart uploads. Confirmed behaviours
(<https://developers.cloudflare.com/r2/buckets/object-lifecycles/>):

| Fact | Value |
| --- | --- |
| Rule count | 1000 rule maximum per bucket |
| Scope | Rules carry a `prefix`, so a `submissions/` prefix can expire without touching `demo/` or `thumbnails/` |
| Required permission | Bucket-level action; "requires an API token with the `Workers R2 Storage Write` permission group" |
| Deletion timing | Objects are "typically removed from a bucket within 24 hours of the `x-amz-expiration` value" |
| New vs existing objects | Newly uploaded objects reflect a new rule immediately; existing objects may lag by up to ~24 h |
| Default rule | Every bucket has a default rule expiring multipart uploads 7 days after initiation |
| Interfaces | Dashboard, Wrangler, the S3 API (`putBucketLifecycleConfiguration` / `getBucketLifecycleConfiguration` / `deleteBucketLifecycle`), and the Cloudflare REST API |

REST API call (`PUT`, not dashboard-only):

```
PUT https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket_name}/lifecycle
Authorization: Bearer <token with Workers R2 Storage Write>
Content-Type: application/json

{
  "rules": [
    {
      "id": "expire-submissions",
      "conditions": { "prefix": "submissions/" },
      "enabled": true,
      "deleteObjectsTransition": { "condition": { "type": "Age", "maxAge": 2592000 } }
    }
  ]
}
```

Shape and field names from the API reference: `rules[].id`, `rules[].conditions.prefix`,
`rules[].enabled`, `rules[].deleteObjectsTransition.condition` as either
`{ type: "Age", maxAge }` (seconds) or `{ type: "Date", date }`, plus `storageClassTransitions` and
`abortMultipartUploadsTransition`
(<https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/lifecycle/methods/update/>).
Note the units differ by interface: `maxAge` is **seconds** in the REST API, while the S3 API and
Wrangler express it as **days** (`Days`, `--expire-days`)
(<https://developers.cloudflare.com/r2/buckets/object-lifecycles/>).

Equivalent one-liners:

```sh
# Documented signature: r2 bucket lifecycle add <BUCKET> [NAME] [PREFIX]
# Flags: --expire-days <n>, --expire-date <YYYY-MM-DD>, --ia-transition-days, --abort-multipart-days
npx wrangler r2 bucket lifecycle add rnui-assets expire-submissions submissions/ --expire-days 30
npx wrangler r2 bucket lifecycle list rnui-assets
```

Flags and positional arguments from the Wrangler reference: `<BUCKET> [NAME] [PREFIX]`, `--expire-days`,
`--expire-date`, `--ia-transition-days`, `--abort-multipart-days`
(<https://developers.cloudflare.com/workers/wrangler/commands/r2/>).

Relevance here: a lifecycle rule is cleanup, not a size control. It bounds how long an oversized or
wrong-MIME object survives (typically ≤ 24 h of its expiry moment), which is the cheapest mitigation
available for architecture A.

## What this repo already has

| Thing | State | Evidence |
| --- | --- | --- |
| Bucket | `rnui-assets`, location hint WEUR, 554 objects / 74.1 MB against a 10 GB free tier | `docs/r2-setup.md` |
| Public read path | `https://cdn.rnui.dev`, an R2 **custom domain** (not `r2.dev`) | `docs/r2-setup.md` |
| Object metadata convention | `Cache-Control: public, max-age=31536000, immutable` + `video/mp4` or `image/avif` | `docs/r2-setup.md`, `lib/asset-path.ts` |
| Credential in use | `CLOUDFLARE_R2_TOKEN` = Account → Workers R2 Storage → **Edit**, used only as a `Bearer` header against `api.cloudflare.com/client/v4/accounts/…/r2/buckets/…` | `docs/r2-setup.md`, `scripts/publish-assets.ts` |
| Env vars | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_TOKEN`, `R2_BUCKET=rnui-assets` (maintainer-only), `NEXT_PUBLIC_CDN_URL` (public, set in Vercel) | `docs/r2-setup.md`, `.env.example` |
| AWS SDK | Absent. `package.json` has no `@aws-sdk/*` and no presign-related dependency | `package.json` |
| Presign code | None. A repo-wide search for `presign`, `aws4fetch`, `X-Amz-` returns no matches across 1218 files | repo search |
| REST API quirks already worked around | LIST first, then PUT; the REST API "accepts and ignores `If-None-Match`"; `HEAD` answers 405 | `docs/r2-setup.md`, `scripts/publish-assets.ts` |
| CORS | No bucket CORS policy is documented anywhere in the repo | `docs/r2-setup.md` |
| Immutability rule | An Asset path is never reused; overwriting poisons caches for a year with no purge (ADR-0003) | `docs/adr/0003-asset-paths-are-immutable.md`, `lib/asset-path.ts` |
| Function shape | Next.js 16 route handlers (`app/api/…/route.ts`) on Vercel; payload ceiling 4.5 MB for both request and response bodies, over which Vercel returns `413 FUNCTION_PAYLOAD_TOO_LARGE` | `app/api/confirm-subscription/route.ts`, `app/api/counters-collection/route.ts`, <https://vercel.com/docs/functions/limitations> |
| Cloudflare Worker | None. No `wrangler.toml`, no Workers deploy path anywhere in the repo | repo listing |

The 4.5 MB Vercel ceiling is the structural reason neither existing route handler can proxy the
bytes: a 5 MB upload is over it before any Cloudflare limit is reached
(<https://vercel.com/docs/functions/limitations>).

## Bottom line

**Architecture A — presigned PUT minted by a route handler — needs less new machinery and is the one
to build, with one caveat: it cannot enforce a maximum size.**

| | A: presigned PUT from a route handler | B: Worker with an R2 binding |
| --- | --- | --- |
| New infrastructure | None. One `app/api/.../route.ts` handler on the existing Vercel project | A Worker, `wrangler` config, a deploy path the repo does not have, plus an origin (a `*.workers.dev` host, or a Worker route/subdomain on the zone `rnui.dev` currently points at Vercel) |
| New credentials | One R2 API token, **Object Read & Write**, scoped to `rnui-assets` → Access Key ID + Secret Access Key in Vercel env (<https://developers.cloudflare.com/r2/api/tokens/>) | None long-lived — the binding authenticates implicitly (<https://developers.cloudflare.com/r2/api/workers/workers-api-usage/>) |
| New dependency | `aws4fetch` (~3.5 kB gzipped, zero deps) — or a bespoke SigV4 signer | None beyond the Worker runtime |
| Vercel 4.5 MB ceiling | Not hit: only a small JSON request/response crosses the function (<https://vercel.com/docs/functions/limitations>) | Not hit, and not relevant |
| Bucket CORS | **Required** for `https://rnui.dev` (PUT + `Content-Type`); no bucket policy is documented in the repo (<https://developers.cloudflare.com/r2/buckets/cors/>) | Needed on the Worker's own origin instead |
| Enforce `Content-Type` | Yes — signed header, `403 SignatureDoesNotMatch` on mismatch (<https://developers.cloudflare.com/r2/api/s3/presigned-urls/>) | Yes — the Worker chooses what to write |
| Enforce a maximum size | **No.** See §4; the mitigation is short expiry, lifecycle cleanup, and post-upload HEAD + delete | Yes, in principle — the Worker can refuse before calling `put()` |
| Upload host the browser talks to | `<ACCOUNT_ID>.r2.cloudflarestorage.com` (never `cdn.rnui.dev`) | The Worker's own hostname |

Blockers that would make A infeasible, stated plainly:

1. **A hard 5 MB cap.** A presigned PUT cannot enforce a maximum size, and R2 does not support the S3
   POST-policy `content-length-range` mechanism at all
   (<https://developers.cloudflare.com/r2/api/s3/presigned-urls/>). If "must be impossible to upload
   500 MB" is a requirement, A fails as specified; the options are B (Worker refuses bytes), or A plus
   a post-upload `HEAD` check and delete, or a different storage service.
2. **A policy against a new long-lived secret in Vercel.** Then use temporary credentials minted
   per request (`scope: object-read-write`, `prefixes: ["submissions/"]`, short `ttlSeconds`), with the
   caveat that R2 documents that scoping model for S3 clients, not for presigning — **unconfirmed**
   (<https://developers.cloudflare.com/r2/api/s3/temporary-credentials/>).

Practical shape if A is chosen: route handler validates the declared request (size claim, MIME from a
fixed allow-list), signs a PUT to a fresh unguessable key under a `submissions/` prefix with
`allHeaders: true` so `Content-Type` is bound, expires it in ~5–10 minutes, and returns the URL; browser
PUTs directly; bucket gets a CORS policy and a `submissions/` lifecycle rule (e.g. 30 days) so anything
wrong disappears on its own; published assets keep their existing immutable keys and never mix with the
submission namespace (ADR-0003). The maintainer then promotes a submission by copying it to its final
`demo/` or `thumbnails/` path with the existing metadata convention, which is the only place the
`Cache-Control: public, max-age=31536000, immutable` value belongs.
