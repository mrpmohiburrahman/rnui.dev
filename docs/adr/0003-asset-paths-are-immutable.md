# Asset paths are immutable

An Asset path identifies specific bytes, not a Demo. Re-recording a Demo produces a new Asset path and an edit to its Entry; a path is never reused for different bytes. This lets every Published Asset carry `Cache-Control: public, max-age=31536000, immutable`, so browsers and the CDN never revalidate — which is the point, since bandwidth is why the Assets moved off Vercel and ImageKit in the first place.

## Considered options

- **Mutable paths with a cache purge on upload.** No Entry edit when re-recording, but purging becomes a mandatory step that fails silently: forget it and users see the old Demo indefinitely with nothing to signal it.
- **Mutable paths with a short max-age.** Simplest upload flow, but pays revalidation traffic forever on 278 Assets that essentially never change.

## Consequences

- The existing 558 filenames are kept as-is. They are already unique and none will be overwritten, so immutable caching is safe on them without a mass rename; the rule applies to new recordings only.
- Superseded Assets are not deleted from R2 — an object whose URL may still be cached for a year cannot be safely removed. Orphans accumulate; at 73 MB against a 10 GB free tier this is not a near-term concern.
- Because a stale Published Asset can never be corrected in place, a bad upload has to be fixed by publishing a new path.
