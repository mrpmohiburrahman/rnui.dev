# 07 — Loud failure

**What to build:** A Demo that cannot load says so. The visitor sees a message on the card instead of a black rectangle, and the maintainer gets an analytics event naming the Asset that failed. Breakage becomes something you can see and count rather than something a user has to report.

This is the durable win of the whole migration. The 48 undecodable Demos survived for months purely because failure was silent.

**Blocked by:** 06

**Status:** resolved

- [x] The existing error handler, which swaps to a root-relative Asset path, is **removed, not repaired**. After the migration that path does not exist in production, making the fallback a guaranteed second failure.
- [x] A failed Demo renders a visible error state in place of the media.
- [x] A failed Demo emits an analytics event carrying the Asset path and the failure reason.
- [x] One failed Demo leaves the rest of the grid working.
- [x] End-to-end test: clicking a card causes playback to **advance past the first frame**. Asserting a video element exists is not sufficient — the most recent bug was a Demo that mounted, loaded, decoded a frame and never moved. This is the regression test that bug never got.
- [x] End-to-end test: with the CDN request stubbed to fail, the visible error state appears. Deterministic, because the failure is injected rather than waited for.
- [x] The playback effect keeps its dependency on the resolved source, not only on the playing flag. This was fixed recently and is easy to lose; the test above locks it down.

## Outcome

The root-relative fallback is removed, not repaired. A failed Demo is terminal
and visible.

- `data-testid="demo-error"` with `role="alert"` renders in place of the media, naming the Demo and the reason.
- A PostHog `demo_load_failed` event carries `asset_path`, `reason` and the resolved URL. `MediaError` codes are mapped to `network` / `decode` / `aborted` / `unsupported`, because "decode" is the signature of the HEVC failure and "network" is a missing object — the distinction is the whole point.
- The handler ignores error events that carry no `MediaError`, so the childless `<track>` cannot masquerade as a broken Demo.
- One failed Demo leaves the grid working: the test asserts every other card still offers to play.

Two e2e tests added, both proven red first:

| Break | Test that fired |
| --- | --- |
| `play()` removed from the effect | `Demo mounted but never advanced past frame 0` |
| `setFailureReason` removed | error state never appeared |

Playwright now runs with `--autoplay-policy=no-user-gesture-required`: playback
is started by a real click but `play()` lands in an effect a tick later, outside
Chrome's gesture window for unmuted audio. Without it the assertion is flaky
rather than wrong.

### Two defects CI found that local runs could not

1. **Playback waited on the view counter.** `handlePlayClick` awaited a Firestore
   write before setting `isPlaying`, so the Demo did not start until a round trip
   to the counter returned. Locally, with real credentials, that is fast enough to
   be invisible; in CI, which builds with dummy Firebase credentials, the write
   retried against `PERMISSION_DENIED` and *both* new tests failed — no `<video>`
   ever mounted. Fixed by starting playback first and letting the counter follow,
   which is also simply the right order: a view count must never sit between a
   user and the thing they clicked. Reproduced locally by rebuilding with CI's
   exact dummy env, then confirmed fixed the same way.

2. **The isolation assertion counted a virtualised grid.** "One failed Demo leaves
   the rest of the grid working" was written as `toHaveCount(before - 1)`. The grid
   is virtualised, so the mounted-card count moves on its own: CI saw 278 before
   the click and 276 after, and failed for a reason unrelated to the claim. Now it
   asserts the claim — one visible error state, and a grid that still renders and
   still offers playback.

Final CI on `1ca15ed`: `quality`, `assets`, `e2e` all green.

**Gap, stated plainly:** the analytics event is *not* asserted by a test. The
capture call was verified to execute against a live PostHog client, but the SDK
batches and did not flush within a 12s window, and stubbing the ingest endpoint
breaks its remote-config load. Asserting it would have meant new test
infrastructure, which the spec's testing decisions rule out. The two assertions
the spec named are both in place and both proven red.
