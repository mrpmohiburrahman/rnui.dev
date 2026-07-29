# 05 — All Assets published and verified

**What to build:** Every Asset in the catalogue is live on the CDN and provably correct. This is the gate: after this ticket the CDN can serve the whole site, and before it nothing may be deleted from the repo.

**Blocked by:** 01, 04

*01 genuinely gates this.* Publishing under a duplicated or non-ASCII key is unfixable once objects are immutable and the publish tool refuses overwrites — the invariant must hold before 558 objects are written.

**Status:** ready-for-agent

- [ ] All **554 referenced Assets** published — 277 Demos and 277 Posters. Established in ticket 01: there are 561 Asset files on disk, so **7 are unreferenced orphans and must not be published**.
- [ ] The Asset check in production mode passes over the full catalogue: every Asset reachable, every Demo decodable as H.264, every object carrying the immutable cache header.
- [ ] Object count in the bucket matches the Asset count in the catalogue — no silent partial upload.
- [ ] A spot-checked Published Asset plays in a browser directly from its CDN URL.
- [ ] Total stored size recorded, against the 10 GB free tier.
- [ ] **Nothing is deleted from the repo in this ticket.** Both origins are live simultaneously and the site is still serving from the old one; this is the point at which the migration is still free to abort.
