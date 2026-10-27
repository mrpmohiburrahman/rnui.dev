# Demo recording checklist

Last updated: 2026-10-27
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

- [ ] **Pixel explosion / Tiger reform**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/PixelExplosionScreen.tsx
  - video: published
  - status: not-started

- [ ] **Bar chart / Voxel city morph**

  - source: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/charts/BarChartScreen.tsx
  - video: published
  - status: not-started

## Enzo Manuel Mangano

- [ ] **Linear Sensors**

  - source: https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/linear-sensors
  - video: published
  - status: not-started

- [ ] **Sculptures in Words**

  - source: https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/sculptures-in-words
  - video: published
  - status: not-started

## Solarin Johnson

- [ ] **3D card scrolling**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/3d-card-scrolling
  - video: published
  - status: not-started

- [ ] **Custom back-history menu**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/custom-back
  - video: published
  - status: not-started

- [ ] **Emoji pop**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/emoji-pop
  - video: published
  - status: not-started

- [ ] **Gesture speed and lock control**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/gesture-speed
  - video: published
  - status: not-started

- [ ] **Grok sidebar**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/grok-sidebar
  - video: published
  - status: not-started

- [ ] **Custom status bar and drawing canvas**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/status-bar
  - video: published
  - status: not-started

- [ ] **Twitter-style collapsing profile**

  - source: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/twitter-profile
  - video: published
  - status: not-started

## Rit3zh

- [ ] **iOS liquid-glass curved bottom tabs**

  - source: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/curved-tabs.tsx
  - video: published
  - status: not-started

- [ ] **iOS motion bottom tabs popovers**

  - source: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/animated-tab-bar.tsx
  - video: published
  - status: not-started

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
