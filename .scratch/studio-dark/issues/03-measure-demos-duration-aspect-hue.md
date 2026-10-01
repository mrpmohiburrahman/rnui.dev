# 03 — assets:measure — duration, aspect and hue per Recording

Status: resolved
Blocked by: 01

## Problem

Three numbers that the mock draws as facts about each Recording are recorded nowhere in this
repo, so every one of them is currently a hardcoded constant that is wrong for most of the
catalogue.

**The mock states them as facts.** `assets/new-ui/Detail.dc.html:35` prints
`9:16 · PLAYING · MUTED · LOOPING` across the middle of the media box and
`assets/new-ui/Detail.dc.html:39` prints `CAPTURED ON DEVICE · 4S LOOP · SILENT` underneath it.
`assets/new-ui/Tile.dc.html:91` prints `9:16 · PLAYING · MUTED` on a playing tile and
`assets/new-ui/Tile.dc.html:95` sizes the media box from the same assumption:

```js
w, mediaH: Math.round(w * 16 / 9), entry: e,
```

The third number is the whole of elevation E1. `assets/new-ui/Tile.dc.html:75` reads

```js
const hue = e.hue == null ? 175 : e.hue;
```

and lines 81 to 85 build both the wash and the glow out of it — the playing tile's
`radial-gradient(72% 48% at 50% 27%, hsla(${hue},72%,64%,0.46), transparent 74%)` and its
dark-mode shadow `0 0 0 1px hsla(${hue},60%,60%,0.24), 0 22px 60px -20px hsla(${hue},70%,55%,0.45)`.
`spec.md:78-80` calls E1 *"emission — a playing tile, tinted by its own recording"*, and spec
decision 8 says the hue is extracted from the Poster so that this "becomes true rather than
decorative". The mock's own sample data carries hand-authored hues — `hue:196`, `hue:272`,
`hue:28`, `hue:150`, `hue:290`, `hue:172`, `hue:44`, `hue:8`, `hue:186` at
`assets/new-ui/Catalogue.dc.html:181-190` — which exist only because nothing real was available
to read.

**Nothing in the repo records any of the three.** The Recording type — `data/entry.ts:24-59`
today, `data/recording.ts` after ticket 01 — lists `id`, `caption`, `demoPath`, `posterPath`,
`author`/`contributor`, `source`, the three social ids, `category`, `view_count`, `vote_count`,
`created_at` and `isNew`. There is no duration, no aspect and no hue. `scripts/` holds
`asset-paths.ts`, `publish-assets.ts`, `generate-posters.ts`, `check-video-codecs.sh` and
`metrics-update.ts`; none of them writes anything back into `data/*.ts`.

**`9:16` is fiction, and the site already pays for it.** `components/entry-card.tsx:266` wraps
the Demo in `aspect-[9/16]` and `components/entry-card.tsx:272` renders it `object-contain`, so
a Demo that is not 9:16 is letterboxed into black bars. Twelve Demos drawn at random from
`pnpm assets:paths demo` and probed against `https://cdn.rnui.dev`, plus the Pickers Demo used
as a worked example below:

| Demo | w×h | w/h | duration (s) |
|---|---|---|---|
| `demo/misc/sudoku_enzo_manuel_mangano_reactiive.mp4` | 330×720 | 0.4583 | 16.543085 |
| `demo/buttons/micro_interactions_alek_mikucki.mp4` | 458×270 | **1.6963** | 10.583000 |
| `demo/misc/morphing_circle_david_friyia.mp4` | 582×540 | **1.0778** | 4.933333 |
| `demo/tabbars/fluid-tab-interaction_enzo_manuel_mangano_reactiive.mp4` | 330×720 | 0.4583 | 3.606415 |
| `demo/misc/counter_card_thomino.mp4` | 414×866 | 0.4781 | 5.480000 |
| `demo/charts/radar-chart_enzo_manuel_mangano_reactiive.mp4` | 332×720 | 0.4611 | 3.723962 |
| `demo/misc/firework_alireza_hadjar.mp4` | 424×890 | 0.4764 | 6.762000 |
| `demo/misc/online-offline_enzo_manuel_mangano_reactiive.mp4` | 330×720 | 0.4583 | 3.933116 |
| `demo/lists/stacked-bottom-sheet_enzo_manuel_mangano_reactiive.mp4` | 332×720 | 0.4611 | 4.980000 |
| `demo/misc/image-cropper_enzo_manuel_mangano_reactiive.mp4` | 332×720 | 0.4611 | 3.549979 |
| `demo/misc/add-to-cart_enzo_manuel_mangano_reactiive.mp4` | 332×720 | 0.4611 | 6.939260 |
| `demo/misc/ios_search_bar_konstantinos_efkarpidis.mp4` | 510×444 | **1.1486** | 12.883333 |
| `demo/pickers/pickers_konstantinos_efkarpidis.mp4` | 236×496 | 0.4758 | 29.100000 |

Not one of the thirteen is 9:16 (0.5625). Three of the twelve sampled are **wider than tall** —
they are landscape recordings being shown today in a portrait box, and they would be shown in
the mock's box at `Math.round(w * 16 / 9)` as well. The portrait ones cluster near 0.458 to
0.478, which is a 19.5:9 phone screen, not 16:9.

**`4S LOOP` is fiction too.** The same sample runs from 3.549979s to 29.100000s. A Recording
whose Demo runs 29 seconds, labelled `4S LOOP`, is exactly the thing spec decision 2 forbids:
*"The mock ships as drawn, and gains whatever features make it work … Nothing on screen lies."*

**The obvious way to get a hue does not work on this catalogue.** `sharp` is already a
devDependency (`package.json:90`, resolving to 0.34.5 with libvips 8.17.3, and its `heif` input
reports `fileSuffix: [".avif"]`, so it reads Posters as-is). Its `stats()` returns a `dominant`
colour from a 4096-bin histogram, which is the one-line answer — and on sixteen Posters drawn at
random from `pnpm assets:paths posters`, thirteen came back as exact greys (five at
`rgb(248,248,248)`, four at `rgb(8,8,8)`, two at `rgb(232,232,232)`, one `rgb(200,200,200)`, one
`rgb(104,104,104)`), two more within 0.07 chroma, and exactly one was a colour
(`rgb(72,152,184)`). That is what a catalogue of UI screen recordings looks like: the largest
block of pixels is the white or black background of the app being demonstrated. Fed to
`hsla(${hue}, …)`, `rgb(248,248,248)` yields hue 0 and would tint 240-odd tiles red. The hue
has to come from the coloured minority of the pixels, not from the majority.

## Work

The script runs once, by hand, and its output is **committed to `data/*.ts`**. It is not wired
into `build`, `postbuild` or any test. Two reasons, both binding. ADR-0003 makes an Asset path
identify specific bytes and never be reused, so a measurement keyed on an Asset path is
permanently valid — a re-recorded Demo arrives under a new path with no measurement beside it,
and a stale measurement is impossible by construction. And the run costs 554 remote reads
(`allEntries.length` is 277, `allAssetPaths.length` is 554); a single `ffprobe` against
`https://cdn.rnui.dev` returned in 0.486s wall, so paying that on every deploy would be absurd
for numbers that cannot change. This is the same rule `scripts/generate-posters.ts:19-24`
already states for Posters.

1. **`package.json`** gains `"assets:measure": "tsx scripts/measure-demos.ts"` beside
   `assets:paths`, `assets:publish` and `posters:generate` (`package.json:12-14`). It goes
   nowhere near `build` (`package.json:7`) or `postbuild` (`package.json:18`).

2. **`lib/poster-hue.ts`**, a new module holding the one piece of non-obvious arithmetic, so it
   can be unit-tested without executing the script. `lib/asset-path.ts` is the precedent: it is a
   `lib/` module whose consumers are mostly scripts (`scripts/generate-posters.ts:32`,
   `scripts/asset-paths.ts:13`). It exports

   ```ts
   export function dominantHue(rgb: Buffer): number | null
   ```

   taking a raw 3-channel RGB buffer and returning integer degrees in `[0, 360)`, or `null`.
   The algorithm, stated exactly because "the dominant colour" is what does not work:

   - For each pixel compute `max`, `min` and chroma `c = max - min` on the 0–1 scale.
   - **Skip any pixel with `c < 0.08`.** That is the greyscale of the app chrome — white sheets,
     black backgrounds, grey text — which is most of every Poster in this catalogue.
   - For the rest, hue in degrees by the usual sextant formula, accumulated into 36 bins of 10°,
     each pixel weighted by its own chroma `c`. Accumulate `sumC[bin] += c`,
     `sumX[bin] += c * cos(h)`, `sumY[bin] += c * sin(h)`.
   - **If `Σ sumC < 0.005 × pixelCount`, return `null`.** A Poster whose entire colour content is
     half a percent of its area has no colour worth glowing in, and a hue derived from a dozen
     anti-aliased pixels is noise that would be committed to the repo for ever.
   - Otherwise take the heaviest bin and return
     `Math.round(((atan2(sumY[b], sumX[b]) * 180 / Math.PI) + 360) % 360)` — the chroma-weighted
     circular mean inside that bin, not the bin's centre, so the committed values are real
     numbers rather than a set of multiples of ten.

   On the sixteen-Poster sample above this yields a hue for eight and `null` for eight.

3. **`scripts/measure-demos.ts`**, a new script following the shape of
   `scripts/generate-posters.ts` — read the catalogue, not the filesystem; skip what is already
   done; name the failures rather than counting them; exit non-zero when any remain.

   1. Load the environment before anything else, because there is nothing to read without it:

      ```ts
      for (const f of [".env.local", ".env"]) try { process.loadEnvFile(f) } catch {}
      ```

      `process.loadEnvFile` is stdlib on the Node this repo runs (v22.23.1 locally), and this is
      the same pair of files, in the same order, that `scripts/check-video-codecs.sh:230` greps.
      Then read `process.env.NEXT_PUBLIC_CDN_URL`, strip a trailing slash as
      `scripts/check-video-codecs.sh:236` does, and exit 1 with
      `NEXT_PUBLIC_CDN_URL is not set — cannot measure Assets that only exist on the CDN.` when
      it is empty.

      **Do not import `getCdnUrl` from `lib/cdn.ts`.** `lib/cdn.ts:12` captures the variable in a
      module-scope `const`, and static imports are evaluated before the first statement of this
      file runs, so the helper would be initialised with the empty string and then quietly return
      relative paths that `fetch` rejects, 554 times. Joining `${base}/${path}` here is one
      template string and is what `scripts/check-video-codecs.sh:248` already does.

   2. Iterate `allRecordings` from `../data/catalogue` (`scripts/generate-posters.ts:31` imports the
      same array, and `scripts/check-video-codecs.sh:24-27` says why the catalogue and never the
      filesystem: `public/demo/` and `public/thumbnails/` are gitignored — `.gitignore:8-9` — so a
      fresh clone and CI have no Assets on disk, and ADR-0001 says there will never be a second
      origin to read them from).

   3. **Skip any Recording that already has `durationMs`.** Same rule and same reason as
      `scripts/generate-posters.ts:20-24`: what is missing and what is new are the same set. To
      re-measure a Recording, delete its three fields and run again — say so in the file header,
      rather than building a `--force` flag for a command that is run once a year.

   4. Duration and aspect, one `execFile("ffprobe", …)` per Demo with `timeout: 60_000` so a
      stalled read cannot hang a 277-Recording run (`scripts/check-video-codecs.sh:247` bounds the
      same risk with `curl --max-time 120`):

      ```
      -v error -select_streams v:0
      -show_entries stream=width,height,sample_aspect_ratio:format=duration
      -of json <CDN URL of demoPath>
      ```

      ffprobe reads the URL directly — it range-requests the header rather than downloading the
      file, which is what makes 0.486s possible on a 29-second Demo. `ffprobe` is already a hard
      requirement of this repo (`scripts/check-video-codecs.sh:72-75`,
      `scripts/generate-posters.ts:130`), so no new tool is being introduced.

      - `durationMs = Math.round(Number(format.duration) * 1000)`.
      - `aspect = Number((width / height).toFixed(4))`, four decimals being finer than one pixel
        on the widest media box the mock draws (414px, `assets/new-ui/Detail.dc.html:132`).
      - Non-square pixels: multiply by the sample aspect ratio **only when it is present and
        differs from 1 by more than 1%**. Of three Demos checked, one reported `N/A`, one `1:1`
        and one `47197:47196` — that last is 1.00002, an encoder rounding artefact, and honouring
        it literally would put a meaningless fifth decimal in the data. A genuinely anamorphic
        Demo would otherwise render squashed with nothing to catch it, which is why the guard
        exists at all rather than the ratio simply being ignored.

   5. Hue, per Poster: `fetch` the Published Asset, and on a non-200 record the failure and move
      on. On 200, hand the bytes to sharp and then to `dominantHue`:

      ```ts
      const { data } = await sharp(buf)
        .resize(64, 64, { fit: "inside" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      ```

      64px on the long edge is at most 4,096 pixels per Poster, which is ample for a histogram and
      keeps 277 decodes cheap. Emit `hue` only when `dominantHue` returns a number.

   6. Concurrency 8, matching the `xargs -P 8` that `scripts/check-video-codecs.sh:169` and
      `:245` already use against the same origin.

   7. **Write-back.** Group the results by `CATEGORIES[recording.category].file`
      (`data/categories.ts:20-28`; `tests/data-integrity.test.ts:191-193` reads the same field to
      locate a Category's file), read `data/<file>.ts` once, apply every insertion in memory, and
      write the file once at the end — never incrementally, so a crash mid-run cannot leave a
      half-written data file.

      The anchor is the Recording's own `posterPath: "…"` line, matched as a whole trimmed line.
      That is safe because `tests/data-integrity.test.ts:76-79` already asserts no two Recordings
      share a Poster path, and `:34-41` asserts every Recording has one. **If any anchor matches
      zero times or more than once, write nothing at all and exit 1** naming the Recording — a
      textual edit that silently lands in the wrong object is worse than no measurement, and 554
      committed lines cannot be reviewed by reading.

      Insert the new fields immediately after the anchor line, at the anchor's own indentation.
      `data/pickers.ts:4-16` becomes:

      ```ts
      {
        id: "01G8YVZ8XY1G8VZ8XY1G8VZ8XY", // Replace with a valid ULID
        caption: "Flash Cards",
        demoPath: "demo/pickers/pickers_konstantinos_efkarpidis.mp4",
        posterPath: "thumbnails/pickers/pickers_konstantinos_efkarpidis.avif",
        durationMs: 29100,
        aspect: 0.4758,
        hue: 200,
        contributor: "Konstantinos Efkarpidis",
        …
      }
      ```

      Omit `hue` entirely when there is none. Absent means "no colour to glow in", which is
      exactly what the mock's `e.hue == null` branch is for.

   8. **Failure reporting.** Print `+ <id>` per Recording measured, and at the end
      `N measured, N already recorded, N failed`, then a named list of failures in the form
      `<id> — <demoPath|posterPath> — <reason>` and `process.exit(1)`, following
      `scripts/generate-posters.ts:110-133`. The three fields are independent: a Demo that probes
      cleanly still gets `durationMs` and `aspect` when its Poster 404s. Because the skip
      predicate keys on `durationMs`, that Recording will not be revisited by a later run — which
      is correct, since a missing hue renders as the designed fallback rather than as a defect,
      and the 404 was reported loudly and failed the run at the time.

4. **`data/recording.ts`** gains three optional fields on the `Recording` type, beside
   `posterPath`:

   ```ts
   /** Written by pnpm assets:measure from the Published Demo. Absent until measured. */
   durationMs?: number
   /** Demo width ÷ height, from the Published Demo. Absent until measured. */
   aspect?: number
   /** Dominant hue of the Poster in degrees, 0–359. Absent when the Poster has no colour. */
   hue?: number
   ```

   Optional, not required: a newly submitted Recording has none of the three until someone runs
   the command, and `tests/data-integrity.test.ts:34-41` must keep listing exactly the seven
   fields it lists today, or every future submission fails the suite before its Assets are even
   published.

5. **Tests.**

   - `tests/poster-hue.test.ts`, against `dominantHue` directly: a buffer of pure grey returns
     `null`; a buffer that is 99.9% white with a handful of red pixels returns `null` (below the
     0.005 coverage floor); a buffer half `rgb(255,0,0)` and half white returns a hue within 2° of
     0; a buffer half `rgb(0,128,255)` and half black returns a hue within 2° of 210.
   - In `tests/data-integrity.test.ts`, one case asserting that where the fields are present they
     are sane: `durationMs` an integer greater than 0, `aspect` between 0.2 and 5, `hue` an
     integer in `[0, 360)`. This is what catches a write-back that landed a value in the wrong
     object or a hue formula that regressed.

6. **Run it once and commit the data with the code.** The commit message says how many Recordings
   were measured and how many have no hue.

**Handover to tickets 07 and 09.** They consume these fields; this ticket does not change any
component. Three fallbacks are theirs to implement, and all three already exist in the mock:

- No `hue` → 175, exactly as `assets/new-ui/Tile.dc.html:75` writes it.
- No `aspect` → 0.5625, the mock's own box (`assets/new-ui/Tile.dc.html:95`, and 414×736 at
  `assets/new-ui/Detail.dc.html:132-133`).
- No `durationMs` → the Detail chrome drops that segment rather than printing `4S LOOP`
  (`assets/new-ui/Detail.dc.html:39`).

And one thing they must decide rather than inherit: **the drawn string `9:16` is wrong for every
Recording measured above**, so a tile that prints it while showing a 458×270 Demo lies, against
spec decision 2. The measured `aspect` is what the label has to come from. Flagging it here
rather than deciding it here, because it is drawn copy and belongs with the tile.

**One fact for the maintainer at checkpoint 5.** On the sixteen-Poster sample, half yielded no
hue. If that holds across 277, roughly half the catalogue will glow at the fallback 175 and the
grid will read as "half the tiles are teal" rather than as the mock's field of colours. That is a
property of the catalogue — UI recordings on white and black backgrounds — and not of the
algorithm; loosening the chroma floor buys hues derived from a few dozen anti-aliased pixels.
Report the real split in `## Comments` once the run is done, so the decision is made on 277
Posters rather than on 16.

## Acceptance

- `pnpm assets:measure` exists in `package.json` and runs `scripts/measure-demos.ts`.
- Grepping `assets:measure` across the repo returns only `package.json`, the script's own header,
  this ticket and the ADR or commit message referencing it. In particular it appears in no
  `build`, `prebuild`, `postbuild` or test script — the numbers are committed, not derived at
  build time, because ADR-0003 makes a measurement keyed on an Asset path permanently valid.
- Every Recording in `data/*.ts` whose Demo and Poster the CDN serves carries `durationMs` and
  `aspect`; the number that carries `hue` is stated in `## Comments` alongside the number that
  does not.
- No `aspect` in the committed data equals exactly 0.5625 by default — i.e. no Recording was
  given the old hardcoded ratio because its probe failed. Absent beats wrong.
- `pnpm assets:paths` output is byte-identical before and after the run. This script writes three
  new fields and must not touch `demoPath` or `posterPath`; ADR-0003 and ADR-0004's own rename
  review both use this snapshot for the same reason.
- Re-running `pnpm assets:measure` immediately after a successful run reports
  `0 measured, 277 already recorded, 0 failed` and leaves `git status` clean.
- With `NEXT_PUBLIC_CDN_URL` unset and no `.env`/`.env.local` present, the script exits 1 with a
  message naming the variable, and writes nothing.
- Pointed at a catalogue containing one Recording whose Demo path 404s, the script exits non-zero,
  names that Recording and its Asset path in the failure list, and still writes the measurements
  of every other Recording.
- `tests/poster-hue.test.ts` passes, including the pure-grey case returning `null`.
- The `data-integrity` case asserting the ranges of `durationMs`, `aspect` and `hue` passes over
  the committed data.
- `pnpm check-types`, `pnpm test`, `pnpm format:check`, `pnpm lint` and `pnpm build` all pass.

## Depends on

**01 — the rename.** The three fields land on the `Recording` type in `data/recording.ts` and are
written into the same 277 objects that ticket 01 rewrites; the script also reads
`recording.category` to find the file each one lives in. Landing this first would mean writing
`Entry` and then renaming it, and would collide with ticket 01 in all eighteen data files at once —
`spec.md:157` records that the rename touches 57 files and 356 `author` occurrences, 279 of them
in `data/`, and its review is a byte-identical `pnpm assets:paths` snapshot. A concurrent edit to
those same files makes that review worthless.

Nothing else blocks it. It touches no component and no route, so it can run in parallel with
ticket 02. Tickets 07 and 09 depend on it, not the other way round — the spec's table already
records 07 as needing 02 and 03.

## Comments

### 2026-08-02 — Built and resolved. One run, 277 measured, 0 failed; 203 carry a hue.

**The commit.** `package.json` gains `assets:measure`; `lib/poster-hue.ts` is the testable
chroma-weighted hue function; `scripts/measure-demos.ts` follows the `generate-posters.ts`
shape (env first, catalogue not filesystem, skip what is done, name failures, exit non-zero);
`data/recording.ts` gains the three optional fields; `tests/poster-hue.test.ts` (4 cases) and a
`data-integrity` range case are added. The measured data is committed with the code — 18 category
files.

**The run, as the acceptance asks.** `pnpm assets:measure` against the CDN reported
`277 measured, 0 already recorded, 0 failed` (exit 0). A second run reported
`0 measured, 277 already recorded, 0 failed` and left the data files byte-identical.
`pnpm assets:paths` is byte-identical before and after (same `6c98ad30…694d`, 554 lines).
With `NEXT_PUBLIC_CDN_URL` unset and no env files present the script exits 1 with a message
naming the variable and writes nothing.

**The 404 acceptance, demonstrated rather than assumed.** I pointed `data/pickers.ts` at a
non-existent Demo path and ran: the script exited non-zero, named the Recording and its Asset
path in the failure list, and still wrote the measurements of every other Recording (276 that
run). The poster still measured, so that Recording got a `hue` and no `durationMs`/`aspect`;
after restoring the path, a completion run measured it (`1 measured, 276 already recorded,
0 failed`) with no duplicate fields.

**Hue split, for the maintainer at checkpoint 5.** **203 of 277 Recordings carry a hue; 74 do
not (73% / 27%).** The sixteen-Poster sample predicted "roughly half"; the real catalogue is
closer to the mock's field of colours than that sample suggested — three quarters of tiles glow
in their own measured colour, a quarter at the fallback 175. Every committed hue is a real
chroma-weighted mean (none is a bin centre or a multiple of ten). The one `aspect: 0.5625` in
the data is a real measurement (`google_gemini_hubert_ryan`, a genuine 16:9 Demo — its probe
succeeded; the run reported 0 failures), so no Recording carries a fabricated fallback ratio.

**Three defects found and fixed during the run, none of which the acceptance anticipated.**

1. **The posterPath anchor as a whole trimmed line matches 136 of 277 Recordings.** Prettier
   wraps a long path onto its own line (`posterPath:` then the value), so the letter of the
   ticket's step 7 fails for nearly half the catalogue. The anchor now matches both the one-line
   and wrapped forms, with the same zero-and-more-than-once abort.
2. **A no-colour Poster was initially counted as a failure.** The first run exited 1 naming
   roughly a quarter of the catalogue with "Poster has no colour to glow in". A missing hue is
   the designed fallback (the mock's `e.hue == null` branch), not a defect: `posterHue` now
   returns `null` and the field is simply omitted. Only HTTP and decode failures fail the run.
3. **A partial write followed by a completion run duplicated a field.** The 404 demonstration
   wrote `hue` (poster fine, Demo 404), and the next run added `hue` again — the ticket's own
   "fields are independent" claim permits exactly this. The write-back now drops any measurement
   field already sitting after the Poster path before inserting fresh ones. The data was then
   re-run from a clean checkout so the committed numbers all come from the fixed code.

**Two things the acceptance could not have predicted, recorded rather than glossed.**

- `pnpm format:check` required formatting three files ticket 02 committed unformatted
  (`app/layout.tsx`, `tailwind.config.ts`, `tests/design-tokens.test.ts` — its Comments listed
  every other check but not this one). The diff is whitespace only, and lands as a separate
  chore commit so this one stays reviewable, on ticket 02's own precedent for the sitemap.
- `grep -rn "assets:measure"` returns the command in `lib/poster-hue.ts`, `data/recording.ts`
  and both new test files as well as `package.json` and the script. That is the ticket's own
  step-4 doc-comment text; the operative clause — it appears in no `build`, `prebuild`,
  `postbuild` or test script — holds. The numbers are committed, never derived at build time.

**Checks.** `pnpm check-types`, `pnpm test` (197/197, up from 192 — the five new cases),
`pnpm lint` (0 errors, 8 pre-existing warnings in files this ticket does not touch),
`pnpm format:check`, `pnpm build` and Playwright **49/49** all pass. `public/sitemap-0.xml`
regenerates under `pnpm build` but its diff is only `lastmod` timestamps, so it was reverted
rather than committed.

**Follow-up from the code review** (committed separately, after the checks above):

- The ticket's hue formula — `Math.round(((atan2 * 180 / π) + 360) % 360)` — yields **360**
  when the chroma-weighted mean sits just below the wrap (degrees ≈ -0.4), which contradicts
  the ticket's own `[0, 360)` contract and would fail the data-integrity range case it was
  written to guard. `lib/poster-hue.ts` now rounds first and then normalises, and a regression
  case pins the wrap: `(255, 0, 1)`, hue ≈ 359.76, must return `0` — the old formula returned
  `360` for it. No committed value changed: none of the 203 hues sat in the affected window.
- The Poster `fetch` in `posterHue` gained the same `AbortSignal.timeout(60_000)` stall guard
  the ticket's rationale demanded for ffprobe — "a stalled read cannot hang a 277-Recording run"
  applies to the poster fetches identically.

With that, all checks are 198/198.
