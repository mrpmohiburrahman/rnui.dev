# 05 — All Assets published and verified

**What to build:** Every Asset in the catalogue is live on the CDN and provably correct. This is the gate: after this ticket the CDN can serve the whole site, and before it nothing may be deleted from the repo.

**Blocked by:** 01, 04

*01 genuinely gates this.* Publishing under a duplicated or non-ASCII key is unfixable once objects are immutable and the publish tool refuses overwrites — the invariant must hold before 558 objects are written.

**Status:** resolved

- [x] All **554 referenced Assets** published — 277 Demos and 277 Posters. Established in ticket 01: there are 561 Asset files on disk, so **7 are unreferenced orphans and must not be published**.
- [x] The Asset check in production mode passes over the full catalogue: every Asset reachable, every Demo decodable as H.264, every object carrying the immutable cache header.
- [x] Object count in the bucket matches the Asset count in the catalogue — no silent partial upload.
- [x] A spot-checked Published Asset plays in a browser directly from its CDN URL.
- [x] Total stored size recorded, against the 10 GB free tier.
- [x] **Nothing is deleted from the repo in this ticket.** Both origins are live simultaneously and the site is still serving from the old one; this is the point at which the migration is still free to abort.

## Outcome

All **554 referenced Assets** are live. The unreferenced orphans were not
published, because the tool reads the catalogue rather than the filesystem.

**Correction to ticket 01's count.** Ticket 01 recorded "561 Asset files on disk
-> 7 unreferenced orphans". Both numbers counted `.DS_Store`. The real figures:
556 `.mp4`/`.avif` files on disk, 554 referenced, so **2 genuine orphans** —
`demo/misc/parallax_cards_lucas_lima.mp4` and its Poster. The 5 `.DS_Store`
files were never tracked by git and were never candidates for publishing.

- Bucket holds exactly 554 objects: 277 under `demo/`, 277 under `thumbnails/`, nothing else.
- **74.1 MB** stored, 0.74% of the 10 GB free tier.
- `pnpm check:videos:production` passes over the full catalogue: every Asset reachable, every Demo decoding as H.264, every object carrying the immutable header.
- Spot-checked `demo/accordions/accordion_william_candillon.mp4` — 200, `video/mp4`, 240681 bytes, H.264.
- Nothing was deleted from the repo in this ticket.

The first full run hit a transient `HTTP 502` on one object and exited non-zero
naming it — which is exactly the failure this tool exists to make visible. The
rerun published that one object and reported the other 553 as already published.
