# 04 — Publish tool

**What to build:** One command that takes Staging copies and makes them Published Assets, and that cannot silently do the wrong thing. It refuses to run if the Assets would not play, refuses to overwrite anything already published, and reports what happened to every file rather than exiting 0 and leaving you to hope.

**Blocked by:** 03

**Status:** resolved

- [x] A single command publishes Staging copies to the bucket, deriving each object key from the Asset path so the catalogue needs no edits.
- [x] Every object is written with `Cache-Control: public, max-age=31536000, immutable` and a correct content type, set as object metadata so the header travels with the object rather than depending on a CDN rule.
- [x] The codec check runs against the Staging copies first and the tool aborts before uploading anything if it fails. A Demo that browsers cannot decode must never become a Published Asset.
- [x] **Publishing refuses to overwrite an existing key.** This makes ADR-0003 a mechanism instead of a discipline; an accidental re-publish becomes a loud failure rather than silent cache poisoning that lasts a year.
- [x] Per-Asset result reported, and a non-zero exit if any Asset failed, so a partial upload is visible rather than assumed complete.
- [x] Re-running after a successful publish is safe and reports every object as already published.
- [x] Verified end-to-end on a single small Category before being used on the full catalogue.
- [x] Credentials come from the environment and are never committed.

## Outcome

`scripts/publish-assets.ts`, run as `pnpm assets:publish [prefix...] [--dry-run]`.
No new dependency: the Cloudflare R2 REST API takes a Bearer token, so there is
no SigV4 and no S3 SDK.

- Object key is the Asset path verbatim; the catalogue needed no edits.
- `Cache-Control` and content type are set as object metadata at upload.
- The Asset check runs first and a failure aborts before any byte is written — proven by emptying the catalogue and confirming `Asset check failed — nothing was published`.
- Overwrites refused: the bucket is listed first and existing keys are reported `=` and skipped.
- Per-Asset line, summary, non-zero exit if any Asset failed.
- Verified end-to-end on Accordions (2 Demos + 2 Posters): first run published 4, rerun reported 4 already published, and both were served from the CDN with the right headers and decoded as H.264.

**Known ceiling, marked in the source:** the API accepts and *ignores*
`If-None-Match: *` — a `PUT` overwrites — so the guard is check-then-put rather
than an atomic conditional write. Fine for a manual single-writer command; move
to the S3 endpoint with SigV4 if that ever stops being true.

### Two defects found in review and fixed

1. **The gate ignored the prefix filter.** It ran the Asset check over the whole
   catalogue regardless of what was being published, so `pnpm assets:publish
   accordions` aborted unless the operator held all 554 Staging copies — which,
   after ticket 08, no fresh clone does. It made the documented contributor
   workflow unusable on every machine but one. The check script now takes the
   same fragments and both sides match identically (substring, so `misc` selects
   the Demos *and* the Posters). Regression-tested by emptying the tree down to
   one Category and publishing it.
2. **The overwrite guard could fail open.** It listed the bucket once and
   trusted `result_info.is_truncated`; a listing that came back short would have
   left keys out of the set and let the `PUT` overwrite live immutable objects
   silently — the exact year-long cache poisoning this ticket exists to prevent.
   Replaced with a per-object `HEAD` that publishes on 404, skips on 200, and
   *throws* on anything else rather than guessing. That deleted the pagination
   code entirely: shorter and stronger.
