# Expo Demos Import

## Destination

A spec that execution can follow today. The spec adds each new Demo from expo.dev/demos as a Recording. The spec also adds each other distinct animation in a linked repo. Each Recording gets an exact folder or file source link, a locally recorded Demo, and a full publish.

Planning sessions inspect source and resolve decisions. They do not build an app or record a Demo without explicit permission.

The maintainer authorized one exception during [Near-duplicate verdicts](issues/04-near-duplicate-verdicts.md): build Solarin's pinned app and capture Button keyboard for comparison.
That exception permits dependency installation but no other captures, catalogue changes, or publication. A build failure stops the attempt.

## Notes

- Domain words come from CONTEXT.md. Use Recording, Contributor, Demo, Poster, Category, Asset, and Asset path. Do not use entry, animation as a Recording name, or video.
- The catalogue holds 348 Recordings. Count the `id` values in `data/*.ts` to check this count. CONTEXT.md says 280 Recordings, and that number is stale.
- The Expo page lists 31 Demos from 10 Contributors at chart time. Ticket "Inventory the Expo Demos and their repos" verifies this list.
- Consult the `add-recording` skill before any record or publish step. Record on the iPhone 18 Pro simulator, iOS 27.0, device screen only, 1206x2622. Do not use the Expo Demo file.
- Duplicate rule: compare repo, name, Category, Contributor, and visual likeness. Different Contributors mean New, even when the examples look identical. The maintainer set this rule during [Near-duplicate verdicts](issues/04-near-duplicate-verdicts.md). Different spellings of one Contributor's name do not count as different Contributors. For same-Contributor near-duplicates, present one pair per prompt with playback evidence. The maintainer gives each verdict.
- Publish to R2 is a maintainer step. Execution plans the full publish for today, and the maintainer runs `pnpm assets:publish`.
- This effort carries execution into the map. The tickets after the decision tickets are build and record tasks, not only decisions.

## Decisions so far

- [Inventory the Expo Demos and their repos](issues/01-inventory-expo-demos.md) — 31 Demos from 10 Contributors. 29 Demos link to a repo. 2 Nathan Schroeder Demos link to X posts. Full list sits in `research/expo-inventory.md`.

- [Expand repos to animations](issues/02-expand-repos-to-animations.md) — 191 candidates across 13 repositories, before duplicate decisions. All 510 pinned source paths passed validation.

- [Match duplicates](issues/03-match-duplicates.md) — 120 exact duplicates, 26 near-duplicates, and 45 new candidates. The pair table sits in `research/duplicate-match.md`.

## Not yet specified

- The final execution batches and a feasible completion date after duplicate decisions, permission decisions, and actual build results.
- The capture sequences and timing for examples whose behavior needs runtime inspection.

The repo scan graduated into its source report. Missing links, Categories, build tests, inactive examples, and permission review now have tickets.

## Out of scope

- Use of the Expo Demo file as a published Asset. The maintainer ruled this out. Each Demo comes from a local build and a local record.
- A new Category. The maintainer maps each Demo to one of the 18 current Categories and decides from the Expo tag.
- A fix to upstream animation code. A failed build stops execution and prompts the maintainer.
- A second Recording for the same animation. A duplicate with a maintainer verdict adds no Recording. A duplicate can still get a Re-record only by a separate maintainer decision.
