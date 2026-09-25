---
name: add-recording
description: Add a Recording to rnui.dev catalogue interactively
disable-model-invocation: true
---

# Add Recording

Walk the user through adding one Recording to the catalogue, one question at a time. Never batch questions. Each step ends when its completion criterion is met - do not advance on a guess.

Vocabulary (CONTEXT.md): Recording (never animation/entry), Contributor (never author), Demo (never video), Poster (never thumbnail), Asset / Asset path, Staging copy, Published Asset, Category.

## Step 1 - Demo location

Ask: "Where is the Demo file?" Accept a local absolute path or a direct download URL.

- Done when: a readable local file exists. If given a URL, download to `/tmp/` first and confirm bytes exist.
- Verify with: `ls -lh <path>` and `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,duration -of default=noprint_wrappers=1 <path>`.
- If ffprobe fails, stop and tell the user the file is unreadable. Do not continue.

## Step 2 - Contributor: existing or new?

Ask: "Is the Contributor already in the catalogue? (yes / no)".

- Done when: the user answers yes or no.

### Step 2a - Existing (user said yes)

1. Build the live list - never hardcode it: `grep -h "contributor:" data/*.ts | sort -u`.
2. Ask via the question tool showing the full list as options so the user can arrow-key through it, and accept a prefix hint (first 2-3 letters) to narrow: e.g. user types "enz" - filter to matches and re-offer.
3. Done when: the chosen `contributor` string is byte-identical to one existing value (exact whitespace and casing). Copy the Contributor's existing `twitterId`, `linkedInId`, `githubId` from their latest Recording for reuse.

### Step 2b - New (user said no)

Ask one at a time, in this order:

1. Full display name (required - becomes `contributor` verbatim).
2. GitHub username, without `@` or URL (optional).
3. LinkedIn handle, slug only, e.g. `enzomanuelmangano` (optional).
4. X/Twitter handle, without `@` (optional).

- Done when: display name is non-empty and every handle is a bare slug (no URL, no `@`). Confirm back: "So: <name> - GitHub: <x>, LinkedIn: <y>, X: <z>. Correct?"

## Step 3 - Recording metadata (one question each)

1. Caption - short human title, e.g. "Radial FAB" (required).
2. Category - exactly one of the 18 keys in `data/categories.ts` (Accordions, Arc Sliders, Bottom Sheets, Buttons, Carousels, Charts, Circular Progress Bars, Drop Down, Full Apps, Headers, List, Loaders, Misc, Onboarding, Parallaxes, Pickers, Sliders, Tab bars). Offer as options; never accept a new Category here.
3. Source URL - `https://` link to the Contributor's code (required, must match `^https?://`).

- Done when: caption non-empty, Category is a key of `CATEGORIES`, source matches `^https?://`.

## Step 4 - Derive Asset paths (compute, do not ask)

1. Read `data/categories.ts` for the Category's `assetSlug`, and `lib/asset-path.ts` `filenameSlug()`.
2. Base = `filenameSlug(caption + " " + contributor)`, e.g. `radial_fab_hewad_mubariz`.
3. `demoPath = demo/<assetSlug>/<base>.mp4` via `demoPathFor()`. `posterPath = posterPathFor(demoPath)`.
4. Show both paths and ask for confirmation. If the Demo path already exists in `pnpm assets:paths`, stop - Published Assets are immutable (ADR-0003). New bytes always mean a new path, never reuse.
5. Staging copies live at `public/<demoPath>` and `public/<posterPath>` (gitignored, never committed).

- Done when: user confirms both paths and neither is already published.

## Step 5 - Compress to Staging

Run `./scripts/compress-demo.sh <input-from-step-1> public/<demoPath>`.

- Deterministic transcode: H.264 CRF 20 slow preset, `yuv420p`, even-dimension scale, `+faststart`. No flag judgement calls.
- Done when: script exits 0 and prints the staged size. Never copy the raw upload into `public/` - only the script output qualifies.

## Step 6 - Poster

Run `pnpm posters:generate`. Writes the AVIF frame at 2s for the new Demo only; existing Posters are left alone.

- Done when: `public/<posterPath>` exists.

## Step 7 - Data entry

1. New `id`: generate with ulid (`npx tsx -e` with `import {ulid} from 'ulid'`). Never hand-write or reuse.
2. `created_at`: current time as ISO-8601 UTC.
3. Append the Recording object to the Category's array in `data/<file>.ts` (file and export name from `CATEGORIES[category]`), fields in existing order: `id, caption, demoPath, posterPath, contributor, source, twitterId?, linkedInId?, githubId?, category, created_at`. Omit (do not empty-string) any handle the Contributor lacks, unless the file's neighbours use `""`.
4. Leave `durationMs/aspect/hue` absent. `pnpm assets:measure` fills them after publish.

- Done when: object appended with fresh ULID and valid ISO date.

## Step 8 - Verify locally

Run in order, fix failures before continuing: `pnpm check-types && pnpm lint && pnpm test && bash scripts/check-video-codecs.sh <slug-fragment>`. The codec check runs against Staging copies (no `--production` flag here).

- Done when: all four exit 0.

## Step 9 - Stage for publish (maintainer publishes)

The skill never uploads. R2 writes are maintainer-only (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_TOKEN`, `R2_BUCKET` - never committed, never requested from the user). Tell the user:

1. Commit the data change only - `public/demo/` and `public/thumbnails/` are gitignored and must not be force-added (CONTRIBUTING.md).
2. Maintainer runs `pnpm assets:publish` (refuses overwrites) then `pnpm assets:measure` to fill `durationMs/aspect/hue`, then commits those numbers.

- Done when: user confirms they understand publish is a separate maintainer step.

## Step 10 - Tell the Contributor (only when this came from a Submission)

Skip this step entirely if the Recording did not arrive through `/submit`: there is nobody to tell.

If it did, the Contributor was promised they would hear either way, so a notice that is not sent is a promise broken rather than a step missed. The address is in the notification email's `Reply to` row, and the object key is in the same message.

Ask the user for the address, then run:

```
pnpm submissions:notify --key <submission-key> --recording <id> --email <address>
```

- It prints the recipient, the Recording and the subject, and asks before sending. Add `--dry-run` to see the whole body without sending, and `--yes` to skip the question in a scripted run.
- If the address cannot be found, run it with `--no-address` instead. That says loudly that no notice went, and names the key so the address can be found again.
- It refuses a second notice for the same Submission unless `--again` is passed, because this message cannot be unsent.
- Done when: the command reports `sent, and logged at ...`, or the user has been told the notice was skipped and why.

Never invent an address, and never read it from Firestore. `firestore.rules` denies every read of the consent collection on purpose, so the address is in the inbox or in the console and nowhere a script can reach.

## If a Submission cannot be published

Some Submissions will not make it, and the Contributor was promised they would hear either way, so this is not an optional step either.

```
pnpm submissions:outcome
```

It asks for the address (the notification's `Reply to` row), the caption, and the reason, prints the whole message, and asks before sending. `pnpm submissions:outcome --help` lists the flags, and `--dry-run` shows the message without sending.

Use it rather than replying to the notification. **A reply does not reach the Contributor**: that message is sent with `to: hello@rnui.dev` and `reply_to: hello@rnui.dev`, so a reply comes straight back here. Quoting it would also put the object key and the `pnpm submissions:open` command in a stranger's inbox.

Never invent an address, and never read it from Firestore. `firestore.rules` denies every read of the consent collection on purpose, so the address is in the inbox or in the console and nowhere a script can reach.

## Failure modes

- Advancing past an unanswered question with a placeholder. Ask again instead.
- Fuzzy-matching a Contributor name instead of copying it byte-identically. Copy-paste from grep output.
- Reusing an Asset path for new bytes. New bytes always mean a new path.
- Committing anything under `public/demo/` or `public/thumbnails/`.
- Asking for R2 credentials or attempting upload. Never do either.
- Skipping Step 10 for a Submission, or inventing an address for it. Either the notice goes, or the user is told it did not.
