# 05 — The documented Poster workflow produces a valid Poster

**What to build:** A contributor runs the command the tooling tells them to run and ends up with a Poster that passes the test suite.

Right now they cannot. The Poster generator writes JPG. The catalogue and its test require AVIF. The converter that used to bridge the two was removed as unreachable code — correctly, it was unreachable — but it was the only bridge. So the printed instructions produce a file the suite rejects, and nothing anywhere tells the contributor what to do next.

Make the generator write AVIF directly. The project's ffmpeg dependency already carries an AV1 encoder, so this is one step with no intermediate file and no converter to reinstate. The generator asks the Asset path module where each Poster belongs rather than replacing the file extension itself.

Then close the loop at the only seam that can verify it: the codec checker already confirms every Demo is H.264 and every referenced Asset has a Staging copy on disk. Add the matching fact for Posters. Format is a property of the bytes, so no data test can establish it.

Accepted cost: AVIF encoding takes seconds per image rather than being instantaneous. The generator runs once per new recording, so it sits on no hot path.

**Blocked by:** 04. The generator derives each Poster's destination through the Asset path module.

**Status:** resolved

- [x] The Poster generator writes AVIF directly, with no intermediate file and no separate converter
- [x] It asks the Asset path module where each Poster goes rather than manipulating the extension itself
- [x] A Poster produced by the documented command passes the data suite unmodified
- [x] The codec checker asserts that every Poster present is genuinely AVIF
- [x] That assertion fails naming the offending files, and its message says how to re-encode them
- [x] The contributor instructions printed by the ingest script, and the maintainer checklist on a submission pull request, describe what the tooling actually does
- [x] Type check, test suite and build all pass, and the codec checker passes against Staging copies

## Comments

**2026-07-29 — resolved.** `scripts/generateThumbnails.ts` became
`scripts/generate-posters.ts`, behind `pnpm posters:generate`. It was rewritten
rather than edited: the old script walked `public/demo` for five video
extensions, built its own `public/thumbnails` paths, wrote JPG, and logged
failures while exiting 0.

One ffmpeg pass per Poster — `-ss 00:00:02 -frames:v 1 -c:v libaom-av1
-still-picture 1 -crf 30 -cpu-used 6` — writing AVIF straight out. Roughly a
quarter of a second per Poster on this machine, not the "seconds" the ticket
budgeted for, and 2–3 KB out.

Two rules it now asks rather than restates. Where a Poster goes comes from
`posterPathFor` in `lib/asset-path.ts`, which retires that module's last
holdout. Which Demos exist comes from `allEntries`, not from a filesystem walk —
the same rule `check-video-codecs.sh` follows, and the reason it gives applies
here too. A consequence worth naming: a `.mp4` sitting in `public/demo` that no
Entry references gets no Poster now, where before it got an unreferenced JPG.
Nothing publishes or displays such a file, so this is the correct set.

Existing Posters are skipped, which is what makes the command usable after a
single new recording. That is not a heuristic: an Asset path names specific
bytes and is never reused (ADR-0003), so a re-recorded Demo arrives under a new
path with no Poster beside it. "Missing" and "new" are the same set.

**The seam.** The codec checker, as the spec's Testing Decisions require — a
Poster's format is a property of its bytes, so no data test can reach it. The
new assertion shares a `wrong_codec` helper with the existing H.264 one, since
they differ only in the codec name and the advice. Its message points at
`pnpm posters:generate` instead of repeating the encoder flags, which would be
a restatement that diverges silently rather than loudly.

### Verified

| Check | Result |
| --- | --- |
| `pnpm check-types` | clean |
| `pnpm test` | 73 passed |
| `pnpm build` | clean |
| `pnpm check:videos` | 277 Demos H.264, 277 Posters present and AVIF |
| A JPG written under a Poster path | `mjpeg  thumbnails/misc/steps_…avif`, exit 1 |
| A text file written under a Poster path | `unreadable  thumbnails/misc/steps_…avif`, exit 1 |
| An HEVC Demo and a JPG Poster together | both reported in one run, exit 1 |
| Deleting a Poster, then `pnpm posters:generate` | 1 written, 276 present; the result probes `av1` and passes the checker |
| Moving a Demo aside | named in the output, not merely counted |
| `check-video-codecs.sh --paths-from` | the publish gate's mode still green over a two-path list |

The one Staging Poster used for those experiments was restored from its
Published Asset and is byte-identical to it (`e832d6da…`).

**One thing the change flushed out.** Making the generator a module broke
`pnpm check-types`, in a file the diff had not touched. `scripts/add-created-at.ts`
is a *script* file, and so was `generateThumbnails.ts`: a top-level `const` in a
`.ts` file with no imports or exports is a **global** declaration, so
`add-created-at.ts` had been resolving `fs` and `path` against the Poster
generator's globals — while its own two `require`s sat commented out. That is
how a script that throws on its first line type-checked for months. Its requires
are uncommented and it gained `export {}`, so it is a module and cannot donate
globals in turn. Ticket 02 deferred that script's real fix and this does not
claim it; it removes a trap the diff would otherwise have re-laid.

**From the review.** Six fixes. `CONTRIBUTING.md` said
`public/demo/<category>/…`, reintroducing the exact `Bottom Sheets` placeholder
ADR-0005 exists about — now `<slug>`, spelled out. `.github/PULL_REQUEST_TEMPLATE.md`
still asked for a "thumbnail generated" and was the half of "the maintainer
checklist on a submission pull request" that had been missed. The workflow was
stated twice in `codex-ingest.ts` in two different orders; both renderings now
come off one `steps` array. The two shell codec probes became one helper. The
poster failure message stopped restating the encoder flags. And `--dry-run`,
which nothing asked for, is gone.
