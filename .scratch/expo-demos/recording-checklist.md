# Demo recording checklist

Last updated: 2026-10-28
Demo list: `app/preview-new-demos/candidates.ts`
Local preview: `http://localhost:63038/preview-new-demos`
Recording standard: `.claude/skills/add-recording/SKILL.md`

## How to use this file

1. Open a new session and read this file first.
2. Take the first unchecked demo.
3. Do the seven steps below in order.
4. Update the `status:` line after each step.
5. Tick the box only when all seven steps are complete.
6. Do not skip a demo and do not reorder the list without telling the maintainer.

Status values: `not-started`, `built`, `recorded`, `awaiting-approval`, `approved`, `published`.

## Gate before step 6

Ticket 12 (`.scratch/expo-demos/issues/12-capture-and-publication-permissions.md`) must be `resolved` before any clip goes to the catalogue. Until then, steps 1 to 5 can run, and step 6 must stop. The report lives in `research/capture-permissions.md`. Do not contact a Contributor and do not accept terms for the maintainer.

Gate decision, 2026-10-27: the maintainer approved publication of the Football stadium seat selection clip, R2 upload included. Ticket 12 stays open, and `research/capture-permissions.md` still does not exist. The Birds, Art gallery and Salon Recordings went out the same way.

Gate decision, 2026-10-27: the maintainer approved publication of the Pixel explosion / Tiger reform clip, R2 upload included. Ticket 12 stays open. The live page is https://www.rnui.dev/recording/01M5YBQKC59KXBND7P3KSV2J0P.

Gate decision, 2026-10-27: the maintainer approved publication of the Bar chart / Voxel city morph clip, R2 upload included. Ticket 12 stays open. The live page is https://www.rnui.dev/recording/01M5YFDVTEAMF4SN2TYRPKMHCN.

## The seven steps for each demo

1. **Build the app.** Clone the source link at the pinned commit. Install its dependencies. Start it on the iOS simulator.
2. **Record the screen.** Use the device screen only. Follow the standard in `.claude/skills/add-recording/SKILL.md` for the simulator model, the resolution and the frame check.
3. **Record the video.** Stop the recording. Run `ffprobe` on the file. Check the width, the height and the duration. Open the first frame and look for a bezel or a title bar.
4. **Open the video in the default app.** Run `open <file>` on macOS. Look at the motion and the pacing.
5. **Wait for approval.** Send the file path to the maintainer. Do not continue until the maintainer approves the clip.
6. **Add the Recording to rnui.dev.** Use the `add-recording` skill in this repo. Stage the Demo, make the Poster, set the Contributor, the Category and the source URL, then commit.
7. **Tip the other side.** Send the other agent or session the demo name, the status and the commit.

## Notes that change this list

- **Pablo Giraud-Carrier:** the three published captions are one animation. The swipe fold, the edge stretch and the corner tear are three parts of one `daily-crumple` flow. Treat them as one item and record one continuous clip.
- **Tomek Czajecki:** the seven published captions are one animation of the full app. Treat them as one item and record one walkthrough of `ios-in-expo`.
- **Phil Pluckthun:** three demos have no published video: `Age-range request`, `Bonjour handwriting and shimmer` and `Split-view mail navigation`. Their clips must come from a new recording.
- **Already published:** 38 of the 41 items below already have a published video. The other 3 are the Phil Pluckthun items above. Record a new clip only when the published one is missing or rejected.

## Hewad Mubariz

- [ ] **WebGPU 3D model product viewer**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/FurnitureShowcaseScreen.tsx
  - video: published
  - status: published
  - catalogue: `01M5VYA960RD9FFGB03VRXFSR2`
  - commit: `e0ab99ad0458cbf97145081f3fd10e2ce56c05bd`
  - measure commit: `df8f009`
  - asset publish: done on 2026-10-26. The CDN serves the Demo and the Poster.
  - live: https://www.rnui.dev/recording/01M5VYA960RD9FFGB03VRXFSR2
  - recording: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793012022888.mp4`
  - rejected: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793009770101.mp4` (one item only)
  - verified: H.264, 1206 by 2622 pixels, 30 fps, 26.900000 seconds, 807 frames
  - frame check: device screen only, no watermark, no touch markers, first motion before 1 second
  - content: all 5 furniture items, rotate and pinch on each, Next between items, ends on Accent Chair

- [ ] **WebGPU bank card shimmer**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/tree/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/CardFlipScreen
  - video: published
  - status: published
  - catalogue: `01M5W1PM4YGN1Q0GZDS2KXCC8N`
  - commit: `9d3ab09`
  - measure commit: `df8f009`
  - asset publish: done on 2026-10-26. The CDN serves the Demo and the Poster.
  - live: https://www.rnui.dev/recording/01M5W1PM4YGN1Q0GZDS2KXCC8N
  - recording: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793014180662.mp4`
  - verified: H.264, 1206 by 2622 pixels, yuv420p, 10.343333 seconds, 1403 frames
  - frame check: device screen only, no watermark, no touch markers, first motion before 1 second (shimmer frames at 0.2 s and 0.7 s differ)
  - content: front face with idle shimmer, drag tilts the card, tap flips to the back face, second tap returns to the front

- [ ] **WebGPU bird flock murmuration**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/BirdsScreen.tsx
  - video: published
  - status: published
  - catalogue: `01M5W957BEPMJB2BBGJTBJZ1C3`
  - commit: `d073f42ddf77e79ddbe6905411404ffa9032f417`
  - measure commit: `8f1e13711c0028f2c2f90de4910f0f1b50b784fb`
  - asset publish: done on 2026-10-26. The CDN serves the Demo and the Poster.
  - live: https://www.rnui.dev/recording/01M5W957BEPMJB2BBGJTBJZ1C3
  - recording: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793021602616.mp4`
  - verified: H.264, 1206 by 2622 pixels, yuvj420p, 30 fps, 40.033333 seconds, 1201 frames
  - frame check: device screen only. No bezel, title bar or touch markers. First motion before 1 second.
  - content: free flock on the Dusk sky, then two taps that scatter it. Heart, star and moon formations follow. The sky changes to Mist, Day and Lake. The clip ends on a heart over the Lake sky.

- [x] **Art gallery corridor**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/GalleryScreen.tsx
  - video: published
  - status: published
  - catalogue: `01M5XM7QMSMRZJMMAAMNEA2PC7`
  - commit: `ce79b5f`
  - measure commit: `352ace0`
  - asset publish: done on 2026-10-27. The CDN serves the Demo and the Poster.
  - live: https://www.rnui.dev/recording/01M5XM7QMSMRZJMMAAMNEA2PC7
  - recording: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793069166018.mp4`
  - verified: H.264, 1206 by 2622 pixels, yuvj420p, 30 fps, 45.000000 seconds, 1350 frames
  - frame check: device screen only. No bezel, title bar or touch markers. First motion before 1 second.
  - content: held presses walk the corridor, side swipes turn the view to both walls. 80 Artic artworks hang in gold frames. The clip ends on the left wall.
  - note: the artworks come from a local mirror of the Artic API and IIIF images, because artic.edu answers 403 to this machine's TLS fingerprint. The screen output is the app's own render.

- [x] **Salon / cinema seat selection**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/SalonSelectionScreen.tsx
  - video: published
  - status: published
  - catalogue: `01M5XVT0FZZHQVS2Y8ABRTWBFN`
  - commit: `e215fbb`
  - live: https://www.rnui.dev/recording/01M5XVT0FZZHQVS2Y8ABRTWBFN

- [x] **Football stadium seat selection**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/StadiumSelectionScreen.tsx
  - video: published
  - status: published
  - catalogue: `01M5Y6EHJSAHAR22WK2HC03W6W`
  - commit: `a15ba51`
  - measure commit: `5b4a38a`
  - asset publish: done on 2026-10-27. The CDN serves the Demo (7,724,079 bytes) and the Poster (40,214 bytes).
  - live: https://www.rnui.dev/recording/01M5Y6EHJSAHAR22WK2HC03W6W
  - approval: the maintainer approved the Football clip and its publication on 2026-10-27, R2 upload included.
  - re-take: the approved file `football-stadium-1793084016583.mp4` was not in this worktree. A new take of the same screen with the same procedure replaced it. The published bytes come from the new take.
  - recording: `.argent/recordings/football-stadium-1793088212029.mp4`, trimmed to `.argent/recordings/football-stadium-1793088212029-trim.mp4` (start cut at 0.9 seconds)
  - verified: H.264, 1206 by 2622 pixels, yuv420p, 35.700264 seconds after trim. The native capture uses variable frame rate.
  - frame check: device screen only. No bezel, title bar or touch markers. First motion before 0.5 seconds after trim.
  - content: pan, pinch zoom in and out, section tap and seat fly-in, two seats selected, deselection, payment button, clear, pinch out to the bowl and a pan across the upper deck.
  - earlier take: `.argent/recordings/football-stadium-1793088060275.mp4` was rejected as too sparse. It is not published.

- [x] **Pixel explosion / Tiger reform**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/PixelExplosionScreen.tsx
  - video: published
  - status: published
  - catalogue: `01M5YBQKC59KXBND7P3KSV2J0P`
  - commit: `2fcea38`
  - measure commit: `6dfa0eb`
  - asset publish: done on 2026-10-27. The CDN serves the Demo (28,468,511 bytes) and the Poster (332,035 bytes).
  - live: https://www.rnui.dev/recording/01M5YBQKC59KXBND7P3KSV2J0P
  - approval: the maintainer approved this clip and its publication on 2026-10-27, R2 upload included. Ticket 12 stays open.
  - local take: `.argent/recordings/pixel-explosion-1793089832529.mp4`
  - local probe: H.264, 1206 by 2622 pixels, yuv420p, 17.966667 seconds, 48,601,546 bytes
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 25 fps, 650 frames, 26.000000 seconds, 28,468,511 bytes
  - lineage: the local take and the staging Demo do not match. A frame at 2 seconds has a different MD5. `scripts/compress-demo.sh` uses `-fps_mode passthrough`. Do not treat the 18-second file as the source of the published bytes.
  - deploy: production alias `https://www.rnui.dev` from commit `6dfa0eb`. Home shows `Search 355 recordings` and `Hewad Mubariz`.

- [x] **Bar chart / Voxel city morph**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/charts/BarChartScreen.tsx
  - video: published
  - status: published
  - catalogue: `01M5YFDVTEAMF4SN2TYRPKMHCN`
  - commit: `916aa88`
  - measure commit: `884ee80`
  - asset publish: done on 2026-10-27. The CDN serves the Demo (2,104,449 bytes) and the Poster (20,990 bytes).
  - live: https://www.rnui.dev/recording/01M5YFDVTEAMF4SN2TYRPKMHCN
  - approval: the maintainer approved this clip and its publication on 2026-10-27, R2 upload included. Ticket 12 stays open.
  - local take: `.argent/recordings/bar-chart-1793097314000.mp4`, 37.35 seconds, 23,711,497 bytes
  - trimmed take: `.argent/recordings/bar-chart-1793097314000-trim.mp4`, 2.2 seconds cut from the head, H.264, 1206 by 2622 pixels, yuv420p, 1329 frames, 34.850639 seconds
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 1329 frames, 34.824416 seconds, 2,104,449 bytes
  - lineage: the staging Demo comes from the trimmed take. The two files have the same frame count.
  - content: Volume and Digital tabs, Wait, Build the city, the Permits and Tax office detail cards, night mode, day mode and Flatten. The last frame matches the first frame.
  - poster: Volume tab frame, AVIF, 1206 by 2622 pixels
  - deploy: production alias `https://www.rnui.dev` from commit `884ee80`. Home shows `Search 356 recordings`.

## Enzo Manuel Mangano

- [ ] **Linear Sensors**

  - source: https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/linear-sensors
  - video: published
  - status: built
  - authorization: the maintainer accepted the pinned custom license on 2026-10-27. The maintainer authorized the build, local capture, publication and deployment.
  - source verification: HEAD matches the pinned commit. The tracked source, package manifest and lockfile have no changes.
  - checks: the frozen dependency install and TypeScript check passed. ESLint passed with 26 upstream warnings.
  - native setup: Expo prebuild passed. CocoaPods installed 141 pods from 134 dependencies.
  - initial failure: `RNIMenuActionItem.swift:186` uses `UIAction.subtitle` with an iOS 15.1 target. The API requires iOS 16.0.
  - build authorization: after that failure, the maintainer authorized all necessary build work without further questions.
  - build: passed with `IPHONEOS_DEPLOYMENT_TARGET=16.4`, Debug, arm64 simulator, Xcode 27.0, two parallel jobs.
  - native lifecycle: iOS 27 rejected the generated legacy app lifecycle. The generated AppDelegate now uses Expo's existing `ExpoReactNativeFactoryProvider` and `EXExpoAppSceneDelegate`.
  - change scope: only gitignored native files changed. The Demo source and its sensor inputs have no changes.
  - runtime: version 0.3.1, bundle `com.reactiive.app`, opened `/animations/linear-sensors` on the iPhone 18 Pro simulator, iOS 27.0.
  - capture blocker: live React hook inspection reports `isAvailable: false` for both ROTATION and GRAVITY. All sensor values stay zero.
  - visual test: portrait and landscape screenshots have 0% pixel difference. Landscape-left, landscape-right and upside-down orientation controls produce no sensor motion.
  - rejected take: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793104755841.mp4`. This diagnostic take shows no sensor motion. It is not a publishable Demo.
  - diagnostic probe: H.264, 1206 by 2622 pixels, yuvj420p, 18 frames, 0.600000 seconds, 38,599 bytes.
  - site checks: TypeScript and all 798 tests passed. ESLint reports the existing `no-require-imports` error at `.scratch/social-cards/probe/avif-datauri.tsx:35`.
  - capture requirement: a genuine motion capture needs a physical iPhone and an exception to the simulator-only capture rule.
  - maintainer decision: on 2026-10-27, the maintainer selected "Keep this blocked". The simulator-only capture rule stays unchanged. Linear Sensors stays blocked and unpublished.
  - publication: no catalogue addition, Asset upload or deployment followed. The agent did not substitute the Expo Demo or fabricate sensor inputs.

- [x] **Sculptures in Words**

  - source: https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/sculptures-in-words
  - video: published
  - status: published
  - catalogue: `01M5YRWEWS4V101MS7JERYDRMY`
  - commit: `263e4cf`
  - measure commit: `b22f8bf`
  - category: Misc. The maintainer selected it on 2026-10-27.
  - contributor: the existing spelling `Enzo Manuel Mangano (Reactiive)`, with the existing handles.
  - approval: the maintainer approved each step on 2026-10-27, R2 upload and deployment included. Ticket 12 stays open.
  - environment: the earlier clone was gone. The agent cloned the pinned commit again to `~/.cache/rnui-tmp/enzo-demos` and ran a frozen install. The installed 0.3.1 app loaded the new bundle with no native rebuild.
  - runtime: Skia Graphite and WebGPU render on the iPhone 18 Pro simulator, iOS 27.0.
  - local take: `.argent/recordings/sculptures-in-words-1793107102553.mp4`, H.264, 1206 by 2622 pixels, full-range yuvj420p, 32.433333 seconds, no touch markers
  - trimmed take: `.argent/recordings/sculptures-in-words-1793107102553-trim.mp4`. The trim cuts 1.6 seconds from the head, a 1.7-second still text hold and the 1.9-second tail. It converts full range to standard-range yuv420p.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 816 frames, 27.200000 seconds, 30,322,719 bytes
  - lineage: the staging Demo comes from the trimmed take. The two files have the same frame count.
  - content: an article scroll and the morph from text to the Venus de Milo. Swipes then show the Victory of Samothrace and the Thinker. The take ends with the morph back to text and a last scroll.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 179,858 bytes. The frame shows the article text.
  - measure: `durationMs` 27200 and `aspect` 0.46. The grayscale Poster has no dominant hue, so the script omits `hue`.
  - asset publish: done on 2026-10-27. The CDN serves the Demo (30,322,719 bytes) and the Poster (179,858 bytes).
  - live: https://www.rnui.dev/recording/01M5YRWEWS4V101MS7JERYDRMY
  - deploy: production alias `https://www.rnui.dev` from commit `b22f8bf`. Home shows `Search 357 recordings`.

## Solarin Johnson

- [x] **3D card scrolling**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/3d-card-scrolling
  - video: published
  - status: recorded
  - id: `01M5YX7TZPYTFVM4MGKD6WS1K8`
  - category: `Misc`
  - demoPath: `demo/misc/3d_card_scrolling_solarin_johnson.mp4`
  - posterPath: `thumbnails/misc/3d_card_scrolling_solarin_johnson.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-27.
  - environment: `com.solarin.myapp.dev` ran on the iPhone 18 Pro simulator, iOS 27.0, from commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
  - local take: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793112209656.mp4`, H.264, 1206 by 2622 pixels, full-range yuvj420p, 12.766667 seconds, no touch markers
  - trimmed take: `/Users/mrp/.cache/rnui-tmp/3d_card_scrolling_clean.mp4`. The trim keeps the first 11.5 seconds and converts full range to standard-range yuv420p.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 345 frames, 11.500000 seconds, 964,802 bytes
  - lineage: the staging Demo comes from the trimmed take. Both files have 345 frames.
  - content: the stack of five cards scrolls down and up with rubber-band overscroll. Each card tilts from -80 degrees to -60 degrees around the X axis.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 11,103 bytes. The frame shows the tilted glass card stack.
  - measure: `durationMs` 11500 and `aspect` 0.46. The neutral Poster has no dominant hue, so the script omits `hue`.
  - asset publish: done on 2026-10-27. The CDN serves the Demo (964,802 bytes) and the Poster (11,103 bytes).
  - live: https://www.rnui.dev/recording/01M5YX7TZPYTFVM4MGKD6WS1K8
  - deploy: production alias `https://www.rnui.dev` from commit `3bc6c48`. Home shows `Search 358 recordings`.

- [x] **Custom back-history menu**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/custom-back
  - video: published
  - status: recorded
  - id: `01M5YZ0P52Y07KKY7215ZV6GAR`
  - category: `Misc`
  - demoPath: `demo/misc/custom_back_history_menu_solarin_johnson.mp4`
  - posterPath: `thumbnails/misc/custom_back_history_menu_solarin_johnson.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-27.
  - environment: `com.solarin.myapp.dev` ran on the iPhone 18 Pro simulator, iOS 27.0, from commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
  - local take: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793114128226.mp4`, H.264, 1206 by 2622 pixels, full-range yuvj420p, 14.292 seconds, no touch markers
  - trimmed take: `/Users/mrp/.cache/rnui-tmp/backtake2/final_intermediate.mp4`. The trim keeps 1.60 seconds through 13.00 seconds and converts full range to standard-range yuv420p.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 342 frames, 11.400000 seconds, 201,609 bytes
  - lineage: the staging Demo comes from the trimmed take. Both files have 342 frames.
  - content: the app opens a nested page. Four forward taps deepen the stack. A long-press on the back button opens the back-history list. Tapping a history row returns to an earlier page.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 9,447 bytes. The frame shows the back-history list with its page rows.
  - measure: `durationMs` 11400 and `aspect` 0.46. The neutral Poster has no dominant hue, so the script omits `hue`.
  - asset publish: done on 2026-10-27. The CDN serves the Demo (201,609 bytes) and the Poster (9,447 bytes). The first measurement run returned 404 for both, because the CDN needed time to serve the new keys.
  - live: https://www.rnui.dev/recording/01M5YZ0P52Y07KKY7215ZV6GAR
  - deploy: production alias `https://www.rnui.dev` from commit `5e33fbe`. Home shows `Search 359 recordings`.

- [x] **Emoji pop**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/emoji-pop
  - video: published
  - status: recorded
  - id: `01M5ZPEPBEQJAKGKHCGVMT706Y`
  - category: `Misc`
  - demoPath: `demo/misc/emoji_pop_solarin_johnson.mp4`
  - posterPath: `thumbnails/misc/emoji_pop_solarin_johnson.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-27.
  - environment: `com.solarin.myapp.dev` ran on the iPhone 18 Pro simulator, iOS 27.0, from commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
  - local take: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793138570469.mp4`, H.264, 1206 by 2622 pixels, full-range yuvj420p, 7.700 seconds, no touch markers
  - staging Demo: one encode from the take. It keeps 1.70 seconds through 7.70 seconds and converts full range to standard-range yuv420p. It sets the sRGB transfer function and the P3 primaries, which matches the published Demos.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 180 frames, 6.000000 seconds, 75,602 bytes
  - content: a tap sends a small emoji bubble. A long press grows the current bubble until it bursts. The composer stays visible at the bottom.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 8,602 bytes. The frame shows one large bubble and one small bubble above the composer.
  - measure: `durationMs` 6000 and `aspect` 0.46. The neutral Poster has no dominant hue, so the script omits `hue`.
  - asset publish: done on 2026-10-27. The CDN serves the Demo (75,602 bytes) and the Poster (8,602 bytes).
  - live: https://www.rnui.dev/recording/01M5ZPEPBEQJAKGKHCGVMT706Y
  - deploy: production alias `https://www.rnui.dev` from commit `47df41d`. Home shows `Search 360 recordings`.

- [x] **Gesture speed and lock control**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/gesture-speed
  - video: published
  - status: recorded
  - id: `01M5ZR2DC9FQ8KKPK6GF5WKBPJ`
  - category: `Misc`
  - demoPath: `demo/misc/gesture_speed_and_lock_control_solarin_johnson.mp4`
  - posterPath: `thumbnails/misc/gesture_speed_and_lock_control_solarin_johnson.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-27.
  - environment: `com.solarin.myapp.dev` ran on the iPhone 18 Pro simulator, iOS 27.0, from commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
  - local take: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793140371129.mp4`, H.264, 1206 by 2622 pixels, full-range yuvj420p, 11.100 seconds, no touch markers
  - staging Demo: one encode from the take. It keeps 5.00 seconds through 10.80 seconds and converts full range to standard-range yuv420p. It sets the sRGB transfer function and the P3 primaries, which matches the published Demos.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 174 frames, 5.800000 seconds, 58,689 bytes
  - content: a 300 ms hold makes the speed pill appear. A sideways drag sets 3.0x. A downward drag locks it and the helper reads "Now release". A release springs the locked pill to the top.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 5,258 bytes. The frame shows the locked pill at 3.0x.
  - measure: `durationMs` 5800 and `aspect` 0.46. The neutral Poster has no dominant hue, so the script omits `hue`.
  - asset publish: done on 2026-10-27. The CDN serves the Demo (58,689 bytes) and the Poster (5,258 bytes).
  - live: https://www.rnui.dev/recording/01M5ZR2DC9FQ8KKPK6GF5WKBPJ
  - deploy: production alias `https://www.rnui.dev` from commit `3191498`. Home shows `Search 361 recordings`.

- [x] **Grok sidebar**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/grok-sidebar
  - video: published
  - status: recorded
  - id: `01M5ZV4C5M3VFHXXNXYBJGE514`
  - category: `Misc`
  - demoPath: `demo/misc/grok_sidebar_solarin_johnson.mp4`
  - posterPath: `thumbnails/misc/grok_sidebar_solarin_johnson.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-27.
  - environment: `com.solarin.myapp.dev` ran on the iPhone 18 Pro simulator, iOS 27.0, from commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
  - local take: `.argent/recordings/screen-recording-94273D2F-EA9C-4833-8437-107B507EDE71-1793143614012.mp4`, H.264, 1206 by 2622 pixels, full-range yuvj420p, 19.800 seconds, no touch markers
  - staging Demo: two segments joined. The first keeps 1.70 through 6.30 seconds. The second keeps 15.40 through 18.30 seconds. Both convert full range to standard-range yuv420p with the sRGB transfer function and P3 primaries.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 225 frames, 7.500000 seconds, 250,515 bytes
  - content: the hamburger opens the full-width drawer. A vertical swipe scrolls the list to Grok sidebar. A tap on that row closes the drawer without navigation. A close-by-swipe aborts the app, so the Demo uses the row tap.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 21,714 bytes. The frame shows the open drawer with the Grok sidebar row focused.
  - measure: `durationMs` 7500 and `aspect` 0.46. The neutral Poster has no dominant hue, so the script omits `hue`.
  - asset publish: done on 2026-10-27. The CDN serves the Demo (250,515 bytes) and the Poster (21,714 bytes).
  - live: https://www.rnui.dev/recording/01M5ZV4C5M3VFHXXNXYBJGE514
  - deploy: production alias `https://www.rnui.dev` from commit `ccab130`. Home shows `Search 362 recordings`.

- [x] **Custom status bar and drawing canvas**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/status-bar
  - video: published
  - status: recorded
  - id: `01M600HA5TXV1QMN3M9WH4ZBR9`
  - category: `Misc`
  - demoPath: `demo/misc/custom_status_bar_and_drawing_canvas_solarin_johnson.mp4`
  - posterPath: `thumbnails/misc/custom_status_bar_and_drawing_canvas_solarin_johnson.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-28. Ticket 12 stays open.
  - environment: `com.solarin.myapp.dev` ran on the iPhone 18 Pro simulator, iOS 27.0, from commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
  - local take: `final_take.mp4` from `xcrun simctl io recordVideo`, H.264, 1206 by 2622 pixels, 353 frames, 12.178333 seconds, no touch markers.
  - staging Demo: one H.264 encode from the take at 30 fps. It sets the sRGB transfer function and the P3 primaries, which matches the published Demos.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 296 frames, 9.866667 seconds, 94,239 bytes
  - content: three drags draw a wave, a spiral and a zigzag on the dotted grid. A tap on the clock changes 06:45 to 6:45. A tap on the battery fills the outline.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 8,358 bytes. The frame shows the wave stroke and the clock readout.
  - measure: `durationMs` 9867 and `aspect` 0.46. The neutral Poster has no dominant hue, so the script omits `hue`.
  - asset publish: done on 2026-10-28. The CDN serves the Demo (94,239 bytes) and the Poster (8,358 bytes).
  - live: https://www.rnui.dev/recording/01M600HA5TXV1QMN3M9WH4ZBR9
  - deploy: production alias `https://www.rnui.dev` from commit `d2868fd`. Home shows `Search 363 recordings`.

- [x] **Twitter-style collapsing profile**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/twitter-profile
  - video: published
  - status: recorded
  - id: `01M6040R6SB6FD9SZVC7MYTMJJ`
  - category: `Misc`
  - demoPath: `demo/misc/twitter_style_collapsing_profile_solarin_johnson.mp4`
  - posterPath: `thumbnails/misc/twitter_style_collapsing_profile_solarin_johnson.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-28. Ticket 12 stays open.
  - environment: `com.solarin.myapp.dev` ran on the iPhone 18 Pro simulator, iOS 27.0, from commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
  - local take: take 2 from `xcrun simctl io recordVideo`, H.264, 1206 by 2622 pixels, 421 frames, 19.716667 seconds, no touch markers. Take 1 used drags that were too large and held blank collapsed frames.
  - staging Demo: one H.264 encode from the take at 30 fps, trimmed to 1.0-13.8 seconds. It sets the sRGB transfer function and the P3 primaries, which matches the published Demos.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 387 frames, 12.9 seconds, 211,325 bytes
  - content: small drags collapse the header and shrink the avatar from full size to 0.6 scale. Reverse drags expand the header back to the top. A final pull shows the overscroll state.
  - upstream defect: the source cover image URL returns 404 at every size, so the cover area renders white. The recording shows the source as-is. The avatar image loads.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 17,678 bytes. The frame shows the shrunken avatar and the profile text.
  - measure: `durationMs` 12900 and `aspect` 0.46. The neutral Poster has no dominant hue, so the script omits `hue`.
  - asset publish: done on 2026-10-28. The CDN serves the Demo (211,325 bytes) and the Poster (17,678 bytes).
  - live: https://www.rnui.dev/recording/01M6040R6SB6FD9SZVC7MYTMJJ
  - deploy: production alias `https://www.rnui.dev` from commit `30227b3`. Home shows `Search 364 recordings`.

## Rit3zh

- [x] **iOS liquid-glass curved bottom tabs**

  - source: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/curved-tabs.tsx
  - video: published
  - status: recorded
  - id: `01M609NKWW217NVTKT796M12Z2`
  - category: `Tab bars`
  - demoPath: `demo/tabbars/curved_bottom_tabs_rit3zh.mp4`
  - posterPath: `thumbnails/tabbars/curved_bottom_tabs_rit3zh.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-28. Ticket 12 stays open.
  - environment: `com.mrpmohibur.expo-curved-bottom-tabs` ran on the iPhone 18 Pro simulator, iOS 27.0, from commit `62654b86b27601af2a67506b5b5df179ca508f36`.
  - local take: `take1.mp4` from `xcrun simctl io recordVideo`, H.264, 1206 by 2622 pixels, 518 frames, 11.146667 seconds, no touch markers.
  - staging Demo: one H.264 encode from the take at 30 fps, trimmed to 0 to 10.6 seconds. It sets the sRGB transfer function and the P3 primaries, which matches the published Demos.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 320 frames, 10.666667 seconds, 1,488,552 bytes
  - content: taps on the glass bar move the white pill between Home, Explore, Shots, Library and Profile. Each tab opens its own screen. The bar keeps its curve and glass blur over the photos.
  - poster: the 2-second frame from `pnpm posters:generate`, AVIF, 1206 by 2622 pixels, 105,719 bytes. The frame shows the Home feed and the glass bar.
  - measure: `durationMs` 10667, `aspect` 0.46 and `hue` 36.
  - asset publish: done on 2026-10-28. The CDN serves the Demo (1,488,552 bytes) and the Poster (105,719 bytes).
  - live: https://www.rnui.dev/recording/01M609NKWW217NVTKT796M12Z2
  - deploy: production alias `https://www.rnui.dev` from commit `2155d20`. Home shows `Search 365 recordings`. The Tab bars filter lists 20 Recordings.

- [x] **iOS motion bottom tabs popovers**

  - source: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/animated-tab-bar.tsx
  - video: published
  - status: recorded
  - id: `01M60C12W8NNN1J5CYRB5CD10W`
  - category: `Tab bars`
  - demoPath: `demo/tabbars/motion_bottom_tabs_popovers_rit3zh.mp4`
  - posterPath: `thumbnails/tabbars/motion_bottom_tabs_popovers_rit3zh.avif`
  - permission: the maintainer approved capture, catalogue addition, R2 upload and production deployment on 2026-10-28. Ticket 12 stays open.
  - environment: `com.mrpmohibur.expo-motion-tabs` ran on the iPhone 18 Pro simulator, iOS 27.0, in dark appearance. The release bundle contains the strings that commit `83bf634` added. Later commits change only the README, so the build is equal to the pinned source.
  - local take: `take1.mp4` from `xcrun simctl io recordVideo`, H.264, 1206 by 2622 pixels, 419 frames, 13.256667 seconds, no touch markers.
  - staging Demo: one H.264 encode from the take at 30 fps, trimmed to 0.7 to 13.0 seconds after the fps filter. It sets the sRGB transfer function and the P3 primaries, which matches the published Demos.
  - staging probe: H.264, 1206 by 2622 pixels, yuv420p, 369 frames, 12.300000 seconds, 978,603 bytes
  - content: a tap on each tab opens its popover above the bar. Home shows Continue Listening and a menu. Search and Profile show their own popovers. A tap outside closes the popover. The last tap opens and closes Home.
  - poster: the 2-second frame from `scripts/generate-posters.ts`, AVIF, 1206 by 2622 pixels, 51,772 bytes. The frame shows the Home popover. The Homebrew ffmpeg has no AV1 encoder, so run the script with `~/.local/bin/ffmpeg` first on the PATH.
  - measure: `durationMs` 12300, `aspect` 0.46 and `hue` 51.
  - asset publish: done on 2026-10-28. The CDN serves the Demo (978,603 bytes) and the Poster (51,772 bytes).
  - live: https://www.rnui.dev/recording/01M60C12W8NNN1J5CYRB5CD10W
  - deploy: production alias `https://www.rnui.dev` from commit `d2da675`. Home shows `Search 366 recordings`. The Tab bars filter lists 21 Recordings.

- [ ] **Stacked bottom sheets**

  - source: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/components/BottomSheet.tsx
  - video: published
  - status: not-started

- [ ] **Telegram-style avatar dynamic island scroll-collapse**

  - source: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/app/profile.tsx
  - video: published
  - status: not-started

## Arunabh Verma

- [ ] **Native paste inputs**
  - source: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/example/App.tsx
  - video: published
  - status: not-started

## Nathan Schroeder

- [ ] **Linear Tab Bar**
  - source: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/TabBar/index.tsx
  - video: published
  - status: not-started

## Paul Nguyen

- [ ] **Folio pop-up storybook**
  - source: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/ui/Stage.tsx
  - video: published
  - status: not-started

## Pablo Giraud-Carrier

- [ ] **Daily Crumple: swipe fold, edge stretch and corner tear (one animation)**
  - source: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/CrinkleOverlay.tsx
  - source: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/OverscrollOverlay.tsx
  - source: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/CrumpleOverlay.tsx
  - video: published (three clips joined into one flow)
  - status: not-started

## Tomek Czajecki

- [ ] **iOS in Expo: full app walkthrough (one animation)**
  - source: https://github.com/tchayen/ios-in-expo/tree/8e0991d15647f98dce2f781547b952ce03d006e2/src/app
  - screens: settings, personal hotspot, health summary, TestFlight onboarding, new event, sign in, view options
  - video: published (seven clips joined into one walkthrough)
  - status: not-started

## Phil Pluckthun

- [ ] **Bottom Tab Accessory**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/src/app/(tabs)/_layout.tsx
  - video: published
  - status: not-started

- [ ] **Material colors and Jetpack Compose UI**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/compose-colors/src/app/index.tsx
  - video: published
  - status: not-started

- [ ] **Android form sheet footer**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/formsheet-footer/src/app/_layout.tsx
  - video: published
  - status: not-started

- [ ] **iOS Live Activity**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/live-activity/src/live-activity.tsx
  - video: published
  - status: not-started

- [ ] **Sharing Intent**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/sharing-intent/src/app/+native-intent.ts
  - video: published
  - status: not-started

- [ ] **Expo Router 55 Stack API**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/stack-api/src/app/index.tsx
  - video: published
  - status: not-started

- [ ] **SwiftUI settings page**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/swift-ui/src/app/index.tsx
  - video: published
  - status: not-started

- [ ] **Android Material tabs and colors**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/tabs-colors/src/app/_layout.tsx
  - video: published
  - status: not-started

- [ ] **Expo Router 55 Toolbar APIs**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/toolbars/src/app/index.tsx
  - video: published
  - status: not-started

- [ ] **iOS Lockscreen Widget**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/widget/src/delivery-widget.tsx
  - video: published
  - status: not-started

- [ ] **Expo Router 55 iOS Zoom Transitions**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/zoom-transitions/src/components/photo-cell.tsx
  - video: published
  - status: not-started

- [ ] **Age-range request**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/age-range/src/app/index.tsx
  - video: none, must record
  - status: not-started

- [ ] **Bonjour handwriting and shimmer**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bonjour/src/app/index.tsx
  - video: none, must record
  - status: not-started

- [ ] **Split-view mail navigation**

  - source: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/split-view/src/app/_layout.tsx
  - video: none, must record
  - status: not-started

## Not on this list

- `Untitled project and pull-down audio recorder`. The verdict ticket marks it Skipped. Do not build it and do not record it.
- `Pull-down gesture navigation`. The verdict ticket marks it Duplicate. Do not build it.

## Count

- Items to build and record: 40
- Items with a published video for reference: 37
- Items with no published video: 3
- Rows in `candidates.ts`: 49
- Merged rows: the 3 Pablo rows become 1 item, the 7 Tomek rows become 1 item
- Skipped rows: 1

## Publish record

- 2026-10-26: `scripts/compress-demo.sh` rebuilt both Staging Demos.
- 2026-10-26: `pnpm posters:generate` rebuilt both Posters.
- 2026-10-26: `pnpm assets:publish webgpu` uploaded 4 Assets (4.2 MB).
- 2026-10-26: All four Asset URLs answer 200 on `https://cdn.rnui.dev`.
- 2026-10-26: `pnpm assets:measure` wrote `durationMs`, `aspect` and `hue` for both Recordings.
- 2026-10-26: The measure commit is `df8f009`.
- 2026-10-26: `vercel --prod` deployed merge commit `ad5ad3d` from a clean `git archive` export.
- 2026-10-26: `www.rnui.dev` serves `Search 350 recordings` and lists `Hewad Mubariz` under Misc.
- 2026-10-26: Both live Recording pages answer 200 and show the correct caption.
- 2026-10-26: The maintainer overrode the ticket 12 gate for the bird flock Recording.
- 2026-10-26: `scripts/compress-demo.sh` built the bird flock Staging Demo (45.3 MB).
- 2026-10-26: `pnpm posters:generate` built the bird flock Poster.
- 2026-10-26: `pnpm assets:publish webgpu_bird_flock` uploaded the Demo and the Poster.
- 2026-10-26: Both new Asset URLs answer 200 on `https://cdn.rnui.dev`.
- 2026-10-26: `pnpm assets:measure` wrote `durationMs` 40033, `aspect` 0.46 and `hue` 16.
- 2026-10-26: The data commit is `d073f42` and the measure commit is `8f1e137`.
- 2026-10-26: `vercel --prod` deployed commit `8f1e137` from a clean `git archive` export.
- 2026-10-26: `www.rnui.dev` serves `Search 351 recordings`.
- 2026-10-26: The live bird flock Recording page answers 200 and shows the correct caption.
- 2026-10-27: Catalogue commit `2fcea38` added the Pixel explosion / Tiger reform Recording.
- 2026-10-27: Measure commit `6dfa0eb` wrote `durationMs` 26000, `aspect` 0.46 and `hue` 25.
- 2026-10-27: `pnpm assets:publish` uploaded the Demo (28,468,511 bytes) and the Poster (332,035 bytes).
- 2026-10-27: Both CDN URLs answer 200 on `https://cdn.rnui.dev`.
- 2026-10-27: `vercel --prod` deployed commit `6dfa0eb`. `www.rnui.dev` serves `Search 355 recordings`.
- 2026-10-27: The live Pixel explosion page answers 200 and shows the caption.
- 2026-10-27: The local take is 17.966667 seconds. The staging Demo is 26.000000 seconds. The two files do not match.
- 2026-10-27: Catalogue commit `916aa88` added the Bar chart / Voxel city morph Recording.
- 2026-10-27: Measure commit `884ee80` wrote `durationMs` 34824, `aspect` 0.46 and `hue` 334.
- 2026-10-27: `pnpm assets:publish` uploaded the Demo (2,104,449 bytes) and the Poster (20,990 bytes).
- 2026-10-27: Both CDN URLs answer 200 on `https://cdn.rnui.dev`.
- 2026-10-27: `vercel --prod` deployed commit `884ee80`. `www.rnui.dev` serves `Search 356 recordings`.
- 2026-10-27: The live Bar chart page answers 200 and shows the caption.
- 2026-10-27: Catalogue commit `263e4cf` added the Sculptures in Words Recording.
- 2026-10-27: Measure commit `b22f8bf` wrote `durationMs` 27200 and `aspect` 0.46.
- 2026-10-27: `pnpm assets:publish` uploaded the Demo (30,322,719 bytes) and the Poster (179,858 bytes).
- 2026-10-27: Both CDN URLs answer 200 on `https://cdn.rnui.dev`.
- 2026-10-27: `vercel --prod` deployed commit `b22f8bf`. `www.rnui.dev` serves `Search 357 recordings`.
- 2026-10-27: The live Sculptures in Words page answers 200 and shows the caption.
