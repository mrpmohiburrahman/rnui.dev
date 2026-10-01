# 14 — The before-and-after recordings

Status: ready-for-human
Blocked by: 13

Steps 1 and 2 may be pulled forward by the maintainer at any time and there is a reason to —
see *The one real risk* below. The ticket is blocked at 13 only because the third capture is.

## Problem

The redesign has to be shown, not described, and there is nothing in this repo that can record
it. Worse, "before" names three different things, and picking the wrong one makes the clip lie.

**Three states exist, not two.**

| | State | What it is | Who has seen it |
|---|---|---|---|
| S1 | `main` | rnui.dev as served today. Pre-overhaul. | every visitor |
| S2 | deploy A | `feat/studio-dark` — pagination, autoplay, the five slots, the view signal, the overlay, the filters, the rename | nobody |
| S3 | deploy B | Studio Dark | nobody |

A single S1 → S3 clip credits the restyle with all of `ui-ux-overhaul`'s behaviour work —
autoplay, the overlay, the 4.34MB → 0.51MB drop. That is the same mistake `spec.md`'s
*Why two deploys* section exists to avoid on the PostHog side, made again in video. The two
honest pairs are **S1 → S2** and **S2 → S3**, one per annotated deploy. S1 → S3 is still worth
cutting as the headline, as long as it is captioned as two changes rather than one.

**Nothing is lost by not recording yet.** Git holds every state, and ADR-0003 makes an Asset
path identify *specific bytes* that are never reused — so `main`'s Demo and Poster URLs still
resolve and an old checkout still renders correctly. There is no window closing here. This
ticket sits at the end of the effort on purpose.

## The one real risk

Two things drift under all three captures:

- **The counts move.** `lib/counters-firestore.ts` owns `view_count` and `vote_count`, they are
  live, and every card prints them. Capture the three states in one sitting. Weeks apart, the
  numbers differ between clips and a viewer reads that as something the redesign did.
- **`main` may no longer build.** It predates the current lockfile and three commits of rename.
  Confirm `pnpm install && pnpm build` on a clean `main` checkout **before** the day of capture,
  not on it. This is the reason to pull step 1 forward.

## Work

1. **`playwright.tour.config.ts`** — a separate config file, not a project inside the existing
   one. `playwright.config.ts:4` sets `testDir: "./tests/e2e"`, so `tests/tour/` is already
   outside the 119-spec run and stays that way. Two deliberate differences from the e2e config:

   - `use: { video: "on", ... }`, and a fixed `viewport` — the three runs have to be the same
     size or they cannot be laid side by side.
   - **No `webServer` block.** The e2e config's `reuseExistingServer: !process.env.CI`
     (`playwright.config.ts:16`) already cost this repo a full afternoon of phantom failures
     against a stale build. The tour must attach to whichever server the operator started, and
     auto-starting one would defeat the entire point of running it against three checkouts.
   - Keep `launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] }`
     (`playwright.config.ts:11`). Without it the grid records as a wall of still Posters.

2. **`tests/tour/catalogue.spec.ts`** — one scripted tour, run twice per state, once per colour
   mode. Same script, same waits, same scroll offsets on every run: that identity is the whole
   value of doing this in Playwright rather than with a screen recorder. Two clips that pause in
   the same places at the same moments compare; two hand-driven captures do not.

   - **The tour must not assert.** A failed `expect` aborts the test and Playwright truncates
     the video at that frame. One soft check at the top — the page responded — and nothing after
     it. Anything the tour needs to be true is ticket 13's job, not this one's.
   - **Every wait is an explicit duration**, never `waitForLoadState` or an auto-retrying
     locator. Those settle at different times on different builds, which desynchronises exactly
     the thing being compared. S1 is slower than S3 by design; let the clip show that, do not
     let it shift the timeline.
   - **Drive by visible text and ARIA role, not by `data-testid`.** The testids in `tests/e2e/`
     were added by `ui-ux-overhaul` and mostly do not exist on `main`. Where the three states
     genuinely differ, keep one small per-state selector map at the top of the file rather than
     branching through the tour body.
   - The route: land on `/`, let the grid autoplay settle, scroll, hover a tile, open a detail,
     close it, filter by a Category from the rail, search, change sort, `Load more`, bookmark
     one, then toggle the colour mode. Ten routes exist but the clip is about the catalogue.

3. **Capture.** Three checkouts, two modes each, six webm files, one sitting. Land them in
   `.scratch/studio-dark/recordings/` and add that directory to `.gitignore` — they are
   megabytes, and they are reproducible from a sha and this script.

4. **Deliver.** Playwright writes webm. `ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p out.mp4`
   is the whole conversion if an mp4 is wanted. No editing pipeline, no gif tooling, no
   dependency added — if the pair needs titles or a wipe, that is a video editor's job and not
   this repo's.

## Acceptance

- `playwright.tour.config.ts` exists, has no `webServer` block, and running the default
  `pnpm exec playwright test` still collects exactly the 119 e2e specs and no tour.
- `tests/tour/catalogue.spec.ts` contains at most one `expect`, and it is before the tour begins.
- The tour runs green against a `main` checkout, against `feat/studio-dark` at deploy A, and
  against Studio Dark, with no per-state edits beyond the declared selector map.
- Six recordings exist under `.scratch/studio-dark/recordings/`, all six captured within one
  sitting, all six the same viewport, and the directory is gitignored.
- Playing S1 and S3 side by side, the two clips reach the detail overlay within a second of each
  other. If they do not, a wait in the tour is data-dependent and has to be pinned.
- The handover names which pair is which: S1 → S2 is deploy A, S2 → S3 is deploy B, and any
  S1 → S3 cut is captioned as both.

## Comments

### 2026-08-04 — Steps 1–2 authored; capture blocked on ticket 13

The two code deliverables (steps 1–2) are in place and verified without a server:

- `playwright.tour.config.ts` — standalone config, `video: "on"`, fixed 1440×900 viewport,
  **no `webServer` block**, and the `autoplay-policy` launch arg. `pnpm exec playwright test
  --list -c playwright.tour.config.ts` lists exactly 1 test; the default `pnpm exec playwright
  test --list` collects the 119+ e2e specs and zero tour specs, as the acceptance requires.
- `tests/tour/catalogue.spec.ts` — one scripted tour, exactly one `expect` (before the tour
  begins, a soft "page responded" check). Every wait is an explicit duration (no
  `waitForLoadState` / auto-retry); driven by visible text + ARIA role; the only per-state
  differences live in the `PER_STATE` map, so the body stays identical across checkouts.
- `.gitignore` now ignores `.scratch/studio-dark/recordings/` (megabytes of webm; reproducible
  from a sha + this script).

Steps 3–4 (the six captures + ffmpeg handover) remain blocked on ticket 13: the spec names
three states S1 (main), S2 (deploy A), S3 (Studio Dark) and requires all six clips captured
within **one sitting** so the live Firebase view/vote counts are frozen across them — and the
counts drift while ticket 13 (and its deploy A) are unmerged. The "one real risk" in the
Problem section is exactly this. So the scripts are committed and ready; the capture is the
maintainer's or a later agent's once 13 ships. Ticket 14 therefore moves to `ready-for-human`
rather than `resolved`: code done, capture intentionally not run.
