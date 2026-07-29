# 03 — Codec check knows about the CDN

**What to build:** The existing Asset check, run in production mode, tells the truth about what the CDN actually serves — the codec, and whether the immutable cache header is really set. Critically, it fails rather than passes when it finds no Assets at all.

**Blocked by:** 02 (for end-to-end verification against a real Published Asset; the empty-set and header-parsing logic can be built and proven against any live endpoint first).

**Status:** resolved

- [x] Production mode probes the CDN base URL from the environment rather than a hard-coded provider.
- [x] Production mode asserts each Published Asset returns `Cache-Control: public, max-age=31536000, immutable`. Without this the immutability decision is an intention rather than a fact, and its absence is invisible.
- [x] **An empty Asset set is a failure, not a success.** Once Assets leave the working tree, local mode in CI would otherwise report "all 0 Assets are fine" and pass — a vacuous green is worse than no check.
- [x] Local mode keeps its current behaviour and remains usable as a pre-upload gate.
- [x] Both new failure modes are proven red: run against an endpoint with no cache header, and run against an empty directory.
- [x] Posters are covered, not just Demos — they are the larger share of per-pageload traffic.

## Outcome

`scripts/check-video-codecs.sh` now derives its Asset list from the **catalogue**
rather than the filesystem, via `scripts/asset-paths.ts`. That is what makes the
empty-set rule meaningful: once Staging copies leave the repo, a filesystem walk
in CI finds nothing and passes.

- Production mode reads `NEXT_PUBLIC_CDN_URL` (env, then `.env.local`/`.env`).
- Every Demo is downloaded and ffprobed; every Poster is HEADed. Both assert the exact `Cache-Control` string.
- Posters are covered, which they were not before.
- An empty Asset set exits 1 in **both** modes.
- Local mode additionally reports referenced Assets with no Staging copy, so it is a real pre-upload gate.

Proven red:

| Mutation | Result |
| --- | --- |
| Catalogue emptied | `No Assets found in the catalogue (0 Demos, 0 Posters)`, exit 1, both modes |
| Run against ImageKit (200 but `must-revalidate`) | named the delivered header and exited 1 |
| Poster absent at that endpoint | `HTTP 404`, exit 1 |

Green: 277 Demos + 277 Posters at `cdn.rnui.dev` in 64s.
