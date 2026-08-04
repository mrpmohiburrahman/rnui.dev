# Plan: ticket 03 — assets:measure (duration, aspect, hue per Recording)

## Context

- Active effort `.scratch/studio-dark/`. Ticket 01 `resolved`; ticket 02 is `ready-for-human`
  (implemented and committed `4a663a5`/`342b87e`; its LCP stop condition needs the maintainer's
  ship/trim call and is not actionable by an agent).
- Frontier per tracker rules: **ticket 03** — `Status: ready-for-agent`, `Blocked by: 01`
  (resolved). User confirmed proceeding.
- Environment verified: `NEXT_PUBLIC_CDN_URL=https://cdn.rnui.dev` in `.env.local`/`.env`,
  ffprobe 8.1.1 installed, sharp `^0.34.5` devDependency, `process.loadEnvFile` available,
  277 Recordings / 554 Asset paths, no `durationMs`/`aspect`/`hue` anywhere yet, no component
  consumes them.

## Work

TDD at the pre-agreed seam `lib/poster-hue.ts`.

1. Claim ticket 03: `Status: claimed` before writing code.
2. `tests/poster-hue.test.ts` first (red):
   - pure grey buffer → `null`
   - 99.9% white + a few red pixels → `null` (below 0.005 coverage floor)
   - half `rgb(255,0,0)` / half white → hue within 2° of 0
   - half `rgb(0,128,255)` / half black → hue within 2° of 210
3. `lib/poster-hue.ts` (green): `dominantHue(rgb: Buffer): number | null`.
   Per pixel: max/min/chroma `c` on 0–1; skip `c < 0.08`; hue by sextant into 36×10° bins,
   each pixel weighted by its chroma, accumulating `sumC`/`sumX`/`sumY` per bin.
   `ΣsumC < 0.005 × pixelCount → null`. Heaviest bin → chroma-weighted circular mean,
   `Math.round(((atan2(sumY,sumX)*180/π)+360)%360)`.
4. `data/recording.ts`: three optional fields with the ticket's doc comments
   (`durationMs?`, `aspect?`, `hue?`) beside `posterPath`. Optional so
   `tests/data-integrity.test.ts:40-58` keeps listing exactly the seven required fields.
5. `tests/data-integrity.test.ts`: new case — where present, `durationMs` integer > 0,
   `aspect` in [0.2, 5], `hue` integer in [0, 360).
6. `package.json`: `"assets:measure": "tsx scripts/measure-demos.ts"` beside the other
   `assets:*` scripts; not in `build`/`postbuild`.
7. `scripts/measure-demos.ts`, shaped after `scripts/generate-posters.ts`:
   - Header: run once by hand; output committed; re-measure by deleting the fields; ffprobe
     reads the URL directly (range-requests the header).
   - Load `.env.local` then `.env` via `process.loadEnvFile` (try/catch); read
     `NEXT_PUBLIC_CDN_URL`, strip trailing slash, exit 1 naming it when empty. Do not import
     `getCdnUrl` from `lib/cdn.ts` (module-scope const captures empty string).
   - Iterate `allRecordings` from `../data/catalogue`; skip any with `durationMs`.
   - Per Demo: `execFile("ffprobe", [… -of json <url>], { timeout: 60_000 })`; parse
     `streams[0]` width/height/sample_aspect_ratio + `format.duration`.
     - `durationMs = Math.round(Number(format.duration) * 1000)`
     - `aspect = Number((width/height).toFixed(4))`
     - SAR: multiply width only when present and differs from 1 by > 1%.
   - Per Poster: `fetch`; non-200 → record failure, move on; 200 →
     `sharp(buf).resize(64,64,{fit:"inside"}).removeAlpha().raw().toBuffer({resolveWithObject:true})`
     → `dominantHue`; emit `hue` only when a number.
   - Concurrency 8.
   - Write-back grouped by `CATEGORIES[recording.category].file` (`data/categories.ts`):
     read `data/<file>.ts` once, apply all insertions in memory, write once. Anchor = trimmed
     `posterPath: "…",` line (unique per data-integrity). If an anchor matches 0 or >1 times,
     write nothing and exit 1 naming the Recording. Insert `durationMs`/`aspect`/`hue`
     immediately after the anchor at the anchor's indentation; omit `hue` when none.
   - Report `+ <id>` per Recording; end with `N measured, N already recorded, N failed`, a
     named failure list `<id> — <demoPath|posterPath> — <reason>`, and `process.exit(1)` when
     any failed. Fields independent (Demo clean + Poster 404 still writes duration/aspect).
8. Acceptance verification:
   - `pnpm assets:paths > /tmp/before.txt` before the run; byte-identical after.
   - Run once → 277 measured; record with-hue / without-hue split for Comments.
   - Re-run → `0 measured, 277 already recorded, 0 failed`; `git status` clean.
   - Unset-env: run from a temp cwd with no env files and `NEXT_PUBLIC_CDN_URL` unset →
     exit 1 naming the variable, writes nothing.
   - 404 demo: temporarily point one `demoPath` at a missing file, run → exits non-zero, names
     the Recording + path, still writes the other 276; revert, re-run to complete that one.
9. Checks: `pnpm check-types`, `pnpm test` (full vitest suite), `pnpm format:check`,
   `pnpm lint`, `pnpm build`; Playwright suite if cheap (no UI change, should pass untouched).
10. Finish: append `## Comments` (measured counts, hue split, 404 demo), `Status: resolved`,
    commit code + committed data + ticket together; commit message states measured count and
    how many have no hue.
11. `/code-review-mp` on the branch.

## Acceptance (from the ticket)

- `pnpm assets:measure` exists; appears in no build/test script.
- Every CDN-served Recording carries `durationMs` and `aspect`; `hue` count stated in Comments.
- No `aspect` equals exactly 0.5625 by default (no fabricated fallback).
- `pnpm assets:paths` byte-identical before/after.
- Re-run reports `0 measured, 277 already recorded, 0 failed`; git clean.
- Unset env → exit 1 naming the variable; writes nothing.
- 404 Demo → exit non-zero, names it + path, still writes the rest.
- `tests/poster-hue.test.ts` passes (incl. pure grey → null).
- data-integrity range case passes over committed data.
- `pnpm check-types`, `pnpm test`, `pnpm format:check`, `pnpm lint`, `pnpm build` pass.
