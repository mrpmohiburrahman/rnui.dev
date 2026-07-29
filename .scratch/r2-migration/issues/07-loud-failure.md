# 07 — Loud failure

**What to build:** A Demo that cannot load says so. The visitor sees a message on the card instead of a black rectangle, and the maintainer gets an analytics event naming the Asset that failed. Breakage becomes something you can see and count rather than something a user has to report.

This is the durable win of the whole migration. The 48 undecodable Demos survived for months purely because failure was silent.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] The existing error handler, which swaps to a root-relative Asset path, is **removed, not repaired**. After the migration that path does not exist in production, making the fallback a guaranteed second failure.
- [ ] A failed Demo renders a visible error state in place of the media.
- [ ] A failed Demo emits an analytics event carrying the Asset path and the failure reason.
- [ ] One failed Demo leaves the rest of the grid working.
- [ ] End-to-end test: clicking a card causes playback to **advance past the first frame**. Asserting a video element exists is not sufficient — the most recent bug was a Demo that mounted, loaded, decoded a frame and never moved. This is the regression test that bug never got.
- [ ] End-to-end test: with the CDN request stubbed to fail, the visible error state appears. Deterministic, because the failure is injected rather than waited for.
- [ ] The playback effect keeps its dependency on the resolved source, not only on the playing flag. This was fixed recently and is easy to lose; the test above locks it down.
