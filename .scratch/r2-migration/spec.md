# Spec: Serve Assets from Cloudflare R2

Status: tickets 01–08 resolved; 09 (history rewrite) not started — it is irreversible and outward-facing and needs the maintainer's explicit go-ahead

Related: [CONTEXT.md](../../CONTEXT.md), [ADR-0001](../../docs/adr/0001-assets-served-from-object-storage-not-the-repo.md), [ADR-0002](../../docs/adr/0002-rewrite-git-history-to-drop-asset-blobs.md), [ADR-0003](../../docs/adr/0003-asset-paths-are-immutable.md)

## Problem Statement

Every Asset in the catalogue — 278 Demos totalling 73 MB and 280 Posters totalling 4.4 MB — is committed to the repo and shipped to Vercel on every deploy. Three costs follow from that, and all three grow with the catalogue:

1. **Metered bandwidth.** Posters are fetched from Vercel on every grid render, and Demos fall back to Vercel whenever the CDN in front of them misses. Both the Vercel and the ImageKit free tiers meter transfer, so popularity produces a bill rather than a win.
2. **A repo that is 98% binary.** The working tree carries 77 MB of media against a few MB of source, and history carries 228 MB. Cloning is slow, and every new Entry makes it permanently slower.
3. **A CDN that is not a mirror.** ImageKit stores its own uploaded duplicate rather than proxying the origin, and silently re-encodes what it stores. That is how 48 Demos shipped as undecodable HEVC and stayed broken for months: the bytes on disk were fine, the bytes users received were not, and nothing in the repo could tell the difference.

Underneath all three is a failure mode with no signal attached. When a Demo does not load, the card shows a black rectangle. No error, no log, no metric. The only detection mechanism is a user complaining.

## Solution

Assets move to a Cloudflare R2 bucket published on a custom domain, and leave the repo entirely.

Users get Demos and Posters from an edge cache with zero egress cost and a one-year immutable cache lifetime, so a repeat visitor re-downloads nothing. The maintainer gets a repo whose clone is a few MB rather than 228 MB, publishing that refuses to ship an unplayable Asset, and a failed Demo that announces itself on the card and in analytics instead of hiding.

Three properties make it work:

- **R2 is a dumb store.** It serves back exactly the bytes uploaded. No silent transcoding, so what passes the pre-upload check is what users receive.
- **Asset paths are immutable.** A path identifies specific bytes, never a Demo. That makes a one-year `immutable` cache safe without any purge machinery.
- **Staging copies stay where they are, gitignored.** The 558 Asset paths in the catalogue do not change, local development keeps working offline, and Vercel never receives a byte of media — because gitignored files never reach the build.

## User Stories

### Site visitor

1. As a site visitor, I want every Demo to play whatever browser I use, so that I can evaluate a component without discovering my vendor lacks a codec.
2. As a site visitor far from the origin, I want Demos served from an edge location near me, so that playback starts quickly.
3. As a returning site visitor, I want a Demo I have already watched to replay from my browser cache with no revalidation request, so that it starts instantly and costs me no data.
4. As a site visitor, I want a Poster to appear before I click, so that I can tell what a Demo contains without waiting for video to load.
5. As a site visitor, I want a Demo that fails to load to say so on the card, so that I know the site is broken rather than assuming the component is boring or that I misclicked.
6. As a site visitor, I want one failed Demo to leave the rest of the grid working, so that a single bad Asset does not cost me the page.
7. As a site visitor, I want clicking a card to actually start playback, so that I am not left looking at a still frame that never moves.
8. As a site visitor on a metered connection, I want a Demo downloaded only when I click it, so that browsing the grid does not cost me 73 MB.

### Maintainer

9. As the maintainer, I want media bandwidth to not count against a metered free tier, so that traffic growth never produces a bill or a throttle.
10. As the maintainer, I want to publish new Assets with a single command, so that adding an Entry is not a manual dashboard chore.
11. As the maintainer, I want publishing to refuse any Demo that is not H.264, so that the HEVC incident cannot recur through a new upload.
12. As the maintainer, I want publishing to refuse to overwrite an existing key, so that the immutability rule is enforced by the tool rather than by my memory.
13. As the maintainer, I want the upload to report a result per Asset, so that a partial upload is visible rather than assumed complete.
14. As the maintainer, I want CI to verify that every Published Asset is reachable and decodable, so that I learn about a broken Asset from a build rather than from a bug report.
15. As the maintainer, I want CI to also verify the cache header is actually set on Published Assets, so that the immutability decision is real and not merely intended.
16. As the maintainer, I want a failed Demo to emit an analytics event carrying its Asset path, so that breakage is something I can count and locate.
17. As the maintainer, I want to re-record a Demo without any risk of users seeing a stale copy, so that correcting a Demo is safe by construction rather than dependent on a purge step I might forget.
18. As the maintainer, I want the repo to stop growing by a video per Entry, so that the catalogue can grow without the checkout doing the same.
19. As the maintainer, I want a fresh clone to take seconds, so that setting up a new machine or a CI runner is not dominated by media transfer.
20. As the maintainer, I want a full backup clone taken before history is rewritten, so that an irreversible operation has a recovery path.
21. As the maintainer, I want to keep developing offline against local Staging copies, so that losing network does not mean losing the ability to work on the site.
22. As the maintainer, I want the Cloudflare bucket and domain setup recorded as written steps, so that I can reproduce or hand over the configuration.
23. As the maintainer, I want ImageKit removed completely rather than left half-wired, so that nobody later has to work out which of two CDNs is authoritative.
24. As the maintainer, I want the pre-upload check to run against Staging copies before anything is published, so that a bad Asset is caught while it is still cheap to fix.
25. As the maintainer, I want to know that all 558 Assets are live before any file is deleted from the repo, so that the deletion is never the thing that breaks the site.

### Contributor

26. As a contributor, I want a fresh clone to be small, so that I can start work without downloading a quarter of a gigabyte.
27. As a contributor, I want the site to render correctly straight after `pnpm dev` on a clean clone, so that I do not need to obtain 77 MB of Assets before I can see what I am changing.
28. As a contributor, I want the contributing guide to tell me I never add binary files, so that I do not attempt to commit a video and have the PR rejected.
29. As a contributor, I want CI to pass on a metadata-only PR without R2 credentials, so that a first-time contributor is not blocked on secrets they cannot have.
30. As a contributor with an open PR, I want the history rewrite to not silently leave my branch unmergeable, so that I am not left debugging a conflict I did not cause.

### Future maintainer

31. As a future maintainer, I want to find a recorded reason the Assets are not in the repo, so that I do not "helpfully" commit them back.
32. As a future maintainer, I want to find a recorded reason that re-recording requires a new filename, so that I do not simplify away the rule and reintroduce stale-cache bugs.
33. As a future maintainer, I want the glossary to define Asset, Asset path, Staging copy and Published Asset, so that I can read the upload tooling without guessing which copy is which.
34. As a future maintainer, I want to know that orphaned objects in the bucket are deliberate, so that I do not write a cleanup job that breaks year-long cached URLs.

## Implementation Decisions

### CDN URL resolution

- The ImageKit module is replaced by a **CDN URL module** exposing a single function: Asset path in, Published Asset URL out. It tolerates a leading slash, as the current helper does, because Asset paths in the catalogue appear both ways.
- Its three currently-unused exports — the thumbnail transform builder, the LQIP builder, and the untransformed base-URL builder — are **deleted, not ported**. R2 performs no transformations, so there is nothing for them to express, and nothing calls them today.
- Base URL comes from `NEXT_PUBLIC_CDN_URL`. The existing warn-on-missing behaviour is kept.

### Poster resolution

- **Posters currently bypass the CDN entirely** — they are resolved as root-relative paths and served by Vercel. This is the single largest source of per-pageload Vercel traffic and must change. Poster URLs go through the same CDN URL module as Demos.
- There is exactly one place that resolves a Poster: the interactive video component, which uses it both as the video element's poster attribute and as the play-button background. The card image component in the card library accepts a raw source and is never passed a Poster; it is left untouched.

### Failure handling

- The current error handler swaps the video source to a root-relative Asset path. Once Assets leave the repo that path 404s in production, making the fallback a guaranteed second failure. It is **removed, not repaired**.
- It is replaced by a terminal error state: a visible message rendered in place of the card's media, plus a PostHog event carrying the Asset path and the failure reason. This is the only behavioural change users will notice, and it is deliberate — the previous silent failure is what allowed 48 broken Demos to persist.
- The effect that starts playback must keep its dependency on the resolved source, not only on the playing flag. This was fixed recently and the reason is easy to lose; the e2e assertion below locks it down.

### Storage and delivery

- Cloudflare R2 bucket, published through a **custom domain** on the rnui.dev zone, which is already on Cloudflare nameservers. The `r2.dev` development subdomain is explicitly rejected: Cloudflare rate-limits it and documents it as unsuitable for production.
- Object keys mirror the existing Asset paths exactly, so the catalogue needs no edits.
- Every object carries `Cache-Control: public, max-age=31536000, immutable` and a correct content type, set at upload time as object metadata rather than as a CDN rule, so the header travels with the object.

### Publishing

- A **publish tool** replaces the ImageKit upload script. It walks the Staging copies, derives each object key from the relative path, sets the cache and content-type metadata, and prints a per-Asset result.
- It **refuses to overwrite an existing key.** This enforces ADR-0003 mechanically instead of relying on discipline, and makes an accidental re-publish a loud failure rather than a silent cache poisoning.
- It runs the codec check against the Staging copies first and aborts before uploading anything if that check fails.
- Publishing stays manual and maintainer-run, as the ImageKit upload was. Automating it in CI would require putting write credentials in the repo's secrets for a step that runs a few times a month.

### Repo and deployment

- Staging copies stay at their current locations and are added to gitignore, then removed from the index. This keeps all 558 catalogue Asset paths unchanged, keeps the codec check working as written, and keeps local development serving media offline — while guaranteeing Vercel receives no media, since gitignored files never reach a build.
- Resource hints in the document head are repointed from the ImageKit host to the CDN host.
- ImageKit environment variables are removed from the example env file, the local env files, and the Vercel project settings.
- The contributing guide gains an explicit statement that contributors never add binary Assets, and how a maintainer publishes them.

### History rewrite

- `git-filter-repo` strips the Asset directories from every commit, then a force-push. This is the **final** step and is performed alone, after every other change is committed and pushed.
- A full backup clone is taken first.
- All 8 open PRs are dependabot, which recreates its branches after a force-push; no human PR is affected. Forks and existing clones break by design — accepted in ADR-0002.

### Ordering constraint

This sequence is load-bearing and any ticket breakdown must preserve it:

**publish and verify → then delete from the working tree → then rewrite history.**

Deleting before the delivered Assets are verified green turns a reversible mistake into an outage.

## Testing Decisions

A good test here asserts what a user or an operator can observe — a Demo plays, an Asset is reachable and decodable, a catalogue invariant holds — and never how a URL happens to be constructed. The CDN URL function is deliberately **not** unit-tested: it is a string concatenation whose only interesting property, that it produces URLs which actually resolve, is already observable at two other seams. A test asserting it returns `${base}/${path}` would only restate the implementation.

Three seams, all of which already exist and already run in CI. No new test infrastructure.

### Seam 1 — catalogue data integrity (vitest, runs in `pnpm test`)

Prior art: `tests/data-integrity.test.ts`, which already merges every Category's Entries into one array and asserts over it (unique IDs, required fields present, source URLs well-formed). New assertions extend the same array.

- No two Entries share an Asset path. This is the immutability rule expressed as data: reusing a path is how bytes get silently replaced.
- Every Asset path is pure ASCII. macOS stores filenames decomposed while the catalogue stores them composed; byte-exact object storage 404s on the mismatch, and this previously affected 16 Assets.
- Every Demo path and Poster path is well-formed for its kind — correct prefix directory and extension.

This seam needs no filesystem and no network, which matters because CI will no longer have any Assets checked out.

### Seam 2 — delivered Assets (`pnpm check:videos`)

Prior art: `scripts/check-video-codecs.sh`, written during the HEVC diagnosis. It already probes local files, already has a production mode, and already reads its endpoint from the environment.

- The production mode is repointed at the CDN host.
- It gains a **`Cache-Control` header assertion**. Without this, ADR-0003 is an intention rather than a fact, and the failure is invisible.
- **CI must run the production mode.** In local mode against a CI checkout it would find zero Assets and report success — a vacuous green, which is worse than no check. The script should treat "zero Assets found" as a failure rather than a pass.
- Local mode keeps its existing role and gains one more: the gate the publish tool runs before uploading.

### Seam 3 — user-visible playback (Playwright, its own CI job)

Prior art: `tests/e2e/home.spec.ts`, which loads the home page against a built server and asserts on visible elements.

- Clicking a card starts playback: the video element advances past its first frame. Asserting the element merely exists is not enough — the most recent bug was a video that mounted, loaded, decoded a frame, and never advanced. This assertion is the regression test that bug never got.
- With the CDN request stubbed to fail, the card shows the visible error state. This is the only way to verify the replacement for the removed fallback, and it is deterministic because the failure is injected rather than waited for.

## Out of Scope

- **Transcoding.** All 278 Demos are already H.264; that work is done and committed.
- **Cloudflare Stream, adaptive bitrate, or HLS.** R2 is object storage by choice. Streaming is a paid product solving a problem this catalogue does not have.
- **Responsive image or video transforms.** ImageKit offered them, three helpers were written for them, and nothing ever called them. Not reimplemented.
- **Moving non-media static files.** Logos, icons, fonts and similar stay in the repo and on Vercel; they are small and are part of the app shell.
- **Automated publishing from CI.** Manual and maintainer-run, as today.
- **Deleting orphaned objects from the bucket.** Deliberately not done — see ADR-0003.
- **Renaming the existing 558 Assets to content-hashed names.** They are already unique and will never be overwritten; the naming rule applies to new recordings only.
- **Changing how entries are contributed** beyond documenting that binaries are not committed.
- **The unused viewport-intersection value** computed by the interactive video component and never read, despite a comment claiming it drives lazy loading. Real, but a separate cleanup.
- **The broken pre-commit hook.** Unrelated and pre-existing.

## Further Notes

- **Known dead code in the touched area,** listed so it is not mistaken for something worth preserving: the card library's image component is exported but never receives a Poster; the intersection-observer result in the interactive video component is computed and discarded; the gitignore file contains a duplicated env entry.
- **Free-tier headroom.** R2 gives 10 GB of storage against the 77 MB being moved, and egress is unmetered. Class B read operations are capped monthly, but a custom domain puts Cloudflare's cache in front of the bucket, so cached hits never reach R2 at all.
- **The reason ImageKit is not simply reconfigured.** It was proven this session to keep its own uploaded copy rather than proxying the origin — files that 404 at ImageKit returned 200 from Vercel — and to re-encode most of what it stores. A store that changes the bytes cannot be verified from the repo, which is the property this migration is buying.
- **Detection, not just delivery.** The bandwidth drivers are what motivated this work, but the durable win is that a broken Asset now produces a CI failure and an analytics event instead of a black rectangle nobody reports.
