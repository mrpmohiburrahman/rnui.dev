# 03 — Codec check knows about the CDN

**What to build:** The existing Asset check, run in production mode, tells the truth about what the CDN actually serves — the codec, and whether the immutable cache header is really set. Critically, it fails rather than passes when it finds no Assets at all.

**Blocked by:** 02 (for end-to-end verification against a real Published Asset; the empty-set and header-parsing logic can be built and proven against any live endpoint first).

**Status:** ready-for-agent

- [ ] Production mode probes the CDN base URL from the environment rather than a hard-coded provider.
- [ ] Production mode asserts each Published Asset returns `Cache-Control: public, max-age=31536000, immutable`. Without this the immutability decision is an intention rather than a fact, and its absence is invisible.
- [ ] **An empty Asset set is a failure, not a success.** Once Assets leave the working tree, local mode in CI would otherwise report "all 0 Assets are fine" and pass — a vacuous green is worse than no check.
- [ ] Local mode keeps its current behaviour and remains usable as a pre-upload gate.
- [ ] Both new failure modes are proven red: run against an endpoint with no cache header, and run against an empty directory.
- [ ] Posters are covered, not just Demos — they are the larger share of per-pageload traffic.
