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
- 2026-10-27: The maintainer approved each step for the Custom back-history menu Recording (`01M5YZ0P52Y07KKY7215ZV6GAR`), R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-27: Catalogue commit `5e33fbe` added the Recording and set `durationMs` to 11400 and `aspect` to 0.46. The neutral Poster has no dominant hue.
- 2026-10-27: The CDN Demo is 201,609 bytes. The CDN Poster is 9,447 bytes. The live page returns 200. The staging Demo comes from the trimmed take, and both have 342 frames.
- 2026-10-27: The maintainer approved capture, catalogue addition, R2 upload and deployment for the Emoji pop Recording (`01M5ZPEPBEQJAKGKHCGVMT706Y`). This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-27: Catalogue commit `47df41d` added the Recording and set `durationMs` to 6000 and `aspect` to 0.46. The neutral Poster has no dominant hue.
- 2026-10-27: The CDN Demo is 75,602 bytes. The CDN Poster is 8,602 bytes. The live page returns 200. The Demo is a single encode of the take, so it has 180 frames.
- 2026-10-27: The maintainer approved capture, catalogue addition, R2 upload and deployment for the Gesture speed and lock control Recording (`01M5ZR2DC9FQ8KKPK6GF5WKBPJ`). This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-27: Catalogue commit `3191498` added the Recording and set `durationMs` to 5800 and `aspect` to 0.46. The neutral Poster has no dominant hue.
- 2026-10-27: The CDN Demo is 58,689 bytes. The CDN Poster is 5,258 bytes. The live page returns 200. The Demo is a single encode of the take, so it has 174 frames.
- 2026-10-27: The maintainer approved capture, catalogue addition, R2 upload and deployment for the Grok sidebar Recording (`01M5ZV4C5M3VFHXXNXYBJGE514`). This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-27: Catalogue commit `ccab130` added the Recording and set `durationMs` to 7500 and `aspect` to 0.46. The neutral Poster has no dominant hue.
- 2026-10-27: The CDN Demo is 250,515 bytes. The CDN Poster is 21,714 bytes. The live page returns 200. The Demo joins two segments of the take and has 225 frames.
- 2026-10-28: The maintainer approved publication of the Custom status bar and drawing canvas Recording (`01M600HA5TXV1QMN3M9WH4ZBR9`), R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. `research/capture-permissions.md` does not exist yet. The status stays `ready-for-agent`.
- 2026-10-28: Catalogue commit `d2868fd` added the Recording with `durationMs` 9867 and `aspect` 0.46. The neutral Poster has no dominant hue.
- 2026-10-28: The CDN Demo is 94,239 bytes. The CDN Poster is 8,358 bytes. The live page returns 200.
- 2026-10-28: The maintainer approved publication of the Twitter-style collapsing profile Recording (`01M6040R6SB6FD9SZVC7MYTMJJ`), R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. `research/capture-permissions.md` does not exist yet. The status stays `ready-for-agent`.
- 2026-10-28: Catalogue commit `30227b3` added the Recording with `durationMs` 12900 and `aspect` 0.46. The neutral Poster has no dominant hue.
- 2026-10-28: The CDN Demo is 211,325 bytes. The CDN Poster is 17,678 bytes. The live page returns 200.
- 2026-10-28: The maintainer approved publication of the iOS liquid-glass curved bottom tabs Recording (`01M609NKWW217NVTKT796M12Z2`), R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-28: The maintainer approved publication of the iOS motion bottom tabs popovers Recording (`01M60C12W8NNN1J5CYRB5CD10W`), R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-28: Catalogue commit `23fc0b2` added the Recording. Measure commit `2155d20` set `durationMs` to 10667, `aspect` to 0.46 and `hue` to 36.
- 2026-10-28: The CDN Demo is 1,488,552 bytes. The CDN Poster is 105,719 bytes. The live page returns 200. The staging Demo comes from the trimmed take and has 320 frames.
- 2026-10-28: The maintainer directed the completion of the Stacked bottom sheets Recording (`01M60F37CY3FZNWHXDSXR76AA9`), capture, R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-28: Catalogue commit `34dcbc8` added the Recording. Measure commit `6a0affb` set `durationMs` to 7700 and `aspect` to 0.46. The neutral Poster has no dominant hue, so the script omits `hue`.
- 2026-10-28: The CDN Demo is 616,551 bytes. The CDN Poster is 20,179 bytes. The live page returns 200. Deploy commit `6a0affb` serves `Search 367 recordings` and the Bottom Sheets filter lists 8 Recordings.
- 2026-10-28: The maintainer directed the completion of the Telegram-style avatar dynamic island scroll-collapse Recording (`01M60JFGAYN5V538REEJHM1DQ7`), capture, R2 upload and deployment included. This decision covers one clip. It does not resolve this ticket. The status stays `ready-for-agent`.
- 2026-10-28: Catalogue commit `4be100f` added the Recording. Measure commit `f915213` set `durationMs` to 9401, `aspect` to 0.46 and `hue` to 218.
- 2026-10-28: The CDN Demo is 944,298 bytes. The CDN Poster is 48,545 bytes. The live page returns 200. The staging Demo has 382 frames, the same count as the local take.
- 2026-10-28: Deploy commit `f915213` serves `Search 368 recordings` and the Headers filter lists 4 Recordings.
- 2026-10-28: The maintainer approved the full workflow for Native paste inputs (`01M60PCYPCKE04WSJR8TZHW6N6`), including capture, catalogue addition, R2 upload and production deployment. This exception covers one Recording. It does not establish Contributor permission or resolve this ticket. `research/capture-permissions.md` remains absent. The status stays `ready-for-agent`.
- 2026-10-28: The first Release build failed because a dependency targeted iOS 9.0. The agent stopped, and the maintainer approved the target change. The retry used `IPHONEOS_DEPLOYMENT_TARGET=15.1`. Generated native files contain the iOS 27 scene lifecycle adaptations. The Contributor's component and native module have no changes.
- 2026-10-28: The capture uses three original landscape images as clipboard fixtures. It does not use unrelated Photos content or the Expo Demo file.
- 2026-10-28: Catalogue commit `a7ce625` added the Recording. Measure commit `2ddd27b` set `durationMs` to 15103, `aspect` to 0.46 and `hue` to 26.
- 2026-10-28: R2 publication uploaded two new Assets without overwrites. The CDN Demo is 7,663,410 bytes. The CDN Poster is 19,535 bytes. Production codec checks passed, including immutable cache headers.
- 2026-10-28: A clean export of commit `2ddd27b` supplied the production deployment. The live page returns 200, shows the Poster and pinned source link, and plays the Demo without media errors. Home shows `Search 369 recordings`. Misc shows 223 Recordings. The Contributor filter shows 17 of 17 and includes Native paste inputs.
