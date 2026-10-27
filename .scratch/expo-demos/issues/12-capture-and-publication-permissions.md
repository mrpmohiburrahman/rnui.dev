# Check capture and publication permissions

Status: ready-for-agent
Type: research
Blocked by: 02

## Question

What terms and existing permissions apply to local builds, recordings, and public hosting of the candidate Demos?

The [repository inventory](../research/repo-animations.md) identifies a custom Enzo software license and no license file in Motion Lab.
Those facts do not alone establish permission or prohibition for captured media.

First inspect existing repository records for prior Contributor permission or an applicable publication policy.
Then inspect the first-party terms at each recorded source snapshot.
Distinguish local execution, source redistribution, recorded media, attribution, and third-party artwork.
Do not equate a software redistribution restriction with a ban on screen recordings without supporting terms.

Cover the 13 known repositories.
Any new repository supplied through Missing repo links requires the same review before publication.
Cite exact terms and their scope.
Report uncertainty explicitly and identify any permission that only the maintainer or Contributor can supply.
Do not contact Contributors or accept terms for the maintainer.

Save a cited report in `research/capture-permissions.md` within this effort.
Use a research subagent.
If a necessary permission remains unresolved, set `Status: ready-for-human` and name the maintainer decision.
A report alone does not clear unresolved publication permission.

## Completion

- List applicable evidence for each known repository.
- Identify attribution obligations and any existing permission records.
- Separate clear terms from unresolved permission questions.
- Preserve unresolved questions for a maintainer decision before public publication.

## Comments

- 2026-10-27: The maintainer approved publication of the Football stadium seat selection Recording (`01M5Y6EHJSAHAR22WK2HC03W6W`), R2 upload included. This is a maintainer decision for one clip. It does not resolve this ticket. `research/capture-permissions.md` does not exist yet. The status stays as it is.
- 2026-10-27: The maintainer approved publication of the Pixel explosion / Tiger reform Recording (`01M5YBQKC59KXBND7P3KSV2J0P`), R2 upload included. This decision covers one clip. It does not resolve this ticket. `research/capture-permissions.md` does not exist yet. The status stays `ready-for-agent`.
- 2026-10-27: Catalogue commit `2fcea38` added the Recording. Measure commit `6dfa0eb` set `durationMs` to 26000, `aspect` to 0.46 and `hue` to 25.
- 2026-10-27: The CDN Demo is 28,468,511 bytes. The CDN Poster is 332,035 bytes. The live page returns 200.
- 2026-10-27: The local take is 17.966667 seconds. The staging Demo is 26.000000 seconds. The two files do not match. Do not treat the local take as the source of the published bytes.
- 2026-10-27: The maintainer approved publication of the Bar chart / Voxel city morph Recording (`01M5YFDVTEAMF4SN2TYRPKMHCN`), R2 upload included. This decision covers one clip. It does not resolve this ticket. `research/capture-permissions.md` does not exist yet. The status stays `ready-for-agent`.
- 2026-10-27: Catalogue commit `916aa88` added the Recording. Measure commit `884ee80` set `durationMs` to 34824, `aspect` to 0.46 and `hue` to 334.
- 2026-10-27: The CDN Demo is 2,104,449 bytes. The CDN Poster is 20,990 bytes. The live page returns 200. The staging Demo comes from the trimmed take, and both have 1329 frames.
- 2026-10-27: The maintainer reviewed and accepted Enzo's custom license at commit `884c9f8f969fd3fd24319da9ffcd9e54c0735445`. The agent did not accept terms for the maintainer.
- 2026-10-27: The maintainer authorized the Linear Sensors build, local capture, catalogue addition, Asset publication and deployment without further routine questions. This decision covers this Recording. It does not resolve the review of all repositories. The ticket stays `ready-for-agent`.
- 2026-10-27: Native compilation failed in `RNIMenuActionItem.swift:186`. The dependency uses `UIAction.subtitle` with an iOS 15.1 target, but the API requires iOS 16.0. The agent stopped under the map's failed-build rule. No new Recording or Asset reached production.
- 2026-10-27: The maintainer then authorized all necessary build work. The build passed with `IPHONEOS_DEPLOYMENT_TARGET=16.4`.
- 2026-10-27: iOS 27 rejected the generated legacy app lifecycle. The agent connected Expo's existing scene delegate in the gitignored native files. Version 0.3.1 then opened Linear Sensors. The tracked source, manifest and lockfile have no changes.
- 2026-10-27: Both live sensor hooks report `isAvailable: false`. ROTATION and GRAVITY values stay zero. Orientation controls produced no sensor motion, and the screenshot comparison reports 0% pixel difference.
- 2026-10-27: The diagnostic take is not a publishable Demo. A genuine motion capture needs a physical iPhone and an exception to the simulator-only rule. No catalogue addition, Asset upload or deployment followed.
- 2026-10-27: The maintainer selected "Keep this blocked". The simulator-only capture rule stays unchanged. Linear Sensors stays blocked and unpublished. This decision does not resolve the review of all repositories.
- 2026-10-27: The maintainer approved each step for the Sculptures in Words Recording (`01M5YRWEWS4V101MS7JERYDRMY`), R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-27: Catalogue commit `263e4cf` added the Recording. Measure commit `b22f8bf` set `durationMs` to 27200 and `aspect` to 0.46. The grayscale Poster has no dominant hue.
- 2026-10-27: The CDN Demo is 30,322,719 bytes. The CDN Poster is 179,858 bytes. The live page returns 200. The staging Demo comes from the trimmed take, and both have 816 frames.
- 2026-10-27: The maintainer approved each step for the 3D card scrolling Recording (`01M5YX7TZPYTFVM4MGKD6WS1K8`), R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-27: Catalogue commit `ac87f39` added the Recording. Measure commit `3bc6c48` set `durationMs` to 11500 and `aspect` to 0.46. The neutral Poster has no dominant hue.
- 2026-10-27: The CDN Demo is 964,802 bytes. The CDN Poster is 11,103 bytes. The live page returns 200. The staging Demo comes from the trimmed take, and both have 345 frames.
