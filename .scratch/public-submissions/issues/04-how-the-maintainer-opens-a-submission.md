# How does the maintainer open a stored Submission?

Status: resolved
Type: research

## Question

The notification email (ticket 09) carries a link, not an attachment (decision 12). But the
bucket the link would point into — `rnui-assets` — is **public**, served through the
`cdn.rnui.dev` custom domain with year-long `immutable` caching (`docs/r2-setup.md`). A
Submission is unreviewed, unreleased work by somebody else. It must not be publicly readable,
and it must not be cached for a year.

Establish how the maintainer opens one, and write it to `research/opening-a-submission.md`
with a source for every claim. Start from `research/r2-presigned-uploads.md`, which already
establishes that R2 supports presigned GET and that presigning never works on a custom domain.

Answer:

1. **A separate prefix in the same bucket, or a separate bucket?** State which is lower risk
   for leaking unvetted work, and what each costs against the 10 GB free tier. Note that
   `publish-assets.ts` refuses keys that already exist and walks the whole bucket — say
   whether a `submissions/` prefix inside `rnui-assets` would confuse it, and cite the code
   path that decides.

2. **How is the link in the email made to work?** A presigned GET minted at send time and
   embedded in the email has a bounded lifetime and will expire in the maintainer's inbox.
   Compare: a presigned GET per notification with a stated expiry, a long-lived presigned GET,
   a Cloudflare Worker endpoint that streams the object on an authenticated request, and
   downloading the object with the existing `CLOUDFLARE_R2_TOKEN` from a local script. Give
   the expiry range presigned URLs allow and say what happens to an expired one.

3. **Does presigning need a new credential?** `research/r2-presigned-uploads.md` found that
   object-scoped tokens are S3-API-only and cannot replace `CLOUDFLARE_R2_TOKEN`. Confirm
   whether a presigned **GET** can be minted with the credential `publish-assets.ts` already
   uses, or whether this is a second secret to provision — and if it is, name it.

4. **What does the object look like when it arrives?** Confirm content type, size and key as
   stored, and whether the `.mp4` extension survives a browser upload of a compressed file.

## Acceptance

`research/opening-a-submission.md` exists; question 1 gives a recommendation with the
`publish-assets.ts` code path cited; question 2 names exactly what the email link contains and
when it stops working; question 3 answers yes or no on a new credential.

## Answer

Resolved 2026-09-25. Full findings, every claim sourced, in
[`../research/opening-a-submission.md`](../research/opening-a-submission.md).

**A `submissions/` prefix inside `rnui-assets` is public by construction. Use a second bucket.**

- **Public access is a bucket-level setting with no per-prefix exclusion.** An object under
  `submissions/` would be world-readable at `cdn.rnui.dev/submissions/<key>`, served `immutable`
  for a year. That is exactly what must not happen to unreviewed work by somebody else. This is the
  finding that changes the most: **ticket 08 was charted around a prefix and must be rebuilt around
  a second, private bucket** with its own 30-day lifecycle rule.
- **`publish-assets.ts` would not be confused** by a prefix — `loadPublishedKeys()` does walk the
  whole bucket, but that set is only queried with catalogue paths from `narrow(allAssetPaths, …)`.
  Worth recording for the day someone revisits the prefix idea; moot once the bucket is separate.
- **Presigned GETs cap at 7 days** (604,800 s) and then return `403 ExpiredRequest`, while the
  object lives 30. A bare link in the notification is dead long before the maintainer acts on it.
- **What the email must carry:** the object key plus a copy-pasteable
  `pnpm submissions:open <key>` command doing a REST Get Object with the `CLOUDFLARE_R2_TOKEN`
  already held — optionally a re-mintable 7-day presigned URL as a convenience.
- **No new credential** is needed for that path. Presigning would need a new read-only R2 token
  scoped to the submissions bucket.

**Consequences, applied to the map:** decision 12 was amended from "a link" to "the key plus a
command". **Tickets 08 and 09 both need rewriting** — 09 currently asks for "the link from ticket
04", which no longer exists in that form.
