# Handoff: Expo Demos verdict work

## Purpose

This file hands the Expo Demos work to a new session.
The old agent workspace can go away after you read this file.
The work lives in `.scratch/expo-demos/`.
Ticket 04 in `.scratch/expo-demos/issues/` holds all verdicts.

## Read first

1. Read `.scratch/expo-demos/map.md`.
2. Read `CONTEXT.md` at the repo root.
3. Read `.scratch/expo-demos/issues/04-near-duplicate-verdicts.md`.
4. Read `.scratch/expo-demos/research/repos-standalone.md`.
5. Read `.scratch/expo-demos/research/expo-inventory.md`.
6. Read `.scratch/expo-demos/recording-checklist.md`. It lists the 40 demos to build and record, and the seven steps for each demo.

Ticket 04 has Status `claimed`.
Do not set ticket 04 to `resolved`.
The maintainer did not close ticket 04.

## Rules that bind the work

- One Demo at a time.
- Show the Demo in the simulator before you ask for a verdict.
- Ask one plain-text question only.
- Give a recommended answer in that question.
- Do not use the interactive question tool.
- Record a verdict only after the maintainer gives it.
- A different Contributor means a New candidate.
- The same Contributor with a near match needs a maintainer verdict.
- Verdicts do not set a Category.
- Verdicts do not permit capture or publication.
- Do not use Expo media as a published Asset.
- Do not edit the catalogue in `data/*.ts` for this ticket.
- Do not commit work without an instruction from the maintainer.

## State now

- The inventory lists 31 Expo Demos and 10 Contributors.
- The research lists 191 candidates from 13 repositories.
- The catalogue in `data/*.ts` holds 348 Recordings.
- Ticket 03 records 120 exact duplicates and 26 near matches.
- Ticket 03 also records 45 provisional New candidates.
- Ticket 04 records verdicts for all 26 near matches.
- Five near matches have verdict New.
- Twenty-one near matches have verdict Duplicate.
- Ticket 04 records seven New verdicts for `tchayen/ios-in-expo`.
- Ticket 04 records New verdicts for six Solarin Johnson extras.
- The maintainer skipped the Untitled example.
- Do not ask about Untitled again.
- No session edited the catalogue.
- No session published an Asset.
- No session made a commit for this work.

## Last three verdicts

### Curved bottom tabs

- Verdict: New.
- Repository: `rit3zh/expo-curved-bottom-tabs`.
- Commit: `62654b86b27601af2a67506b5b5df179ca508f36`.
- Entry: `expo-router/entry` to `src/app/_layout.tsx`.
- Effect file: `src/components/curved-tabs.tsx`.
- The simulator showed five tabs and a drag on the pill.
- Bundle ID: `com.mrpmohibur.expo-curved-bottom-tabs`.

### Motion tabs

- Verdict: New.
- Repository: `rit3zh/expo-motion-tabs`.
- Commit: `9a95ea9fa9839c6627bf15860797a208663369b4`.
- Entry: `expo-router/entry` to `src/app/(tabs)/_layout.tsx`.
- Effect file: `src/motion-tabs/animated-tab-bar.tsx`.
- The simulator showed three tabs.
- A tap opens a blurred panel above the glass bar.
- Bundle ID: `com.mrpmohibur.expo-motion-tabs`.

### Stack bottom sheets

- Verdict: New.
- Repository: `rit3zh/expo-stack-bottom-sheet`.
- Commit: `9e2cc750f809ae5bd7eba986ed529adae3e4a581`.
- Entry: `expo-router/entry` to `app/index.tsx`.
- Effect file: `components/BottomSheet.tsx`.
- Closest Recording: Stacked Bottom Sheet `01KAY9B0A43NFXW3MNYDNQ0ATF`.
- That Recording names Enzo Manuel Mangano as Contributor.
- The Release build succeeded.
- Bundle ID: `com.mrpmohibur.expo-stack-bottom-sheet`.
- The app does not render in the simulator yet.
- The simulator showed the home screen only.
- Cause: the app has no scene lifecycle.
- Ticket 09 must fix this app before capture.

## Next candidate

Name: Telegram-style avatar dynamic island scroll-collapse.
Repository: `rit3zh/expo-meatball-animation`.
Commit: `11fefeb91964d548081bf24d49a5c3d6e205cbac`.
Entry: `expo-router/entry` to `app/profile.tsx`.
Route `/` holds one link to `/profile`.
A scroll on the profile collapses the avatar.
The collapse shows a drawn island shape and the header.
Expo version: approximately 53.0.20.
React Native version: 0.79.5.
Skia version: v2.0.0-next.4.
The avatar uses a remote URL.
No verdict exists for this candidate.
No build result exists for this candidate.
The maintainer stopped the first build for time.
The old checkout sat in a temp folder.
That temp folder no longer exists.
Clone the repository again and apply the patches again.

## First question for the new session

Builds cost 10 to 20 minutes per Demo on this machine.
The maintainer did not accept or refuse background builds yet.
Ask the maintainer this question before you start a build.
Question: run builds in the background, or decide from source evidence only?
Recommended answer: run builds in the background.
Do not start the meatball build before the maintainer answers.

## Build recipe

Use this recipe for one Expo candidate at a time.

1. Clone the repository into the session temp folder.
2. Check out the pinned commit from the research file.
3. Run `bun install` in the repository root.
4. Run `bunx expo prebuild --platform ios --no-install`.
5. Add the deployment-target block to the Podfile `post_install` hook.
6. Run `pod install` in the `ios` folder.
7. Set `FMT_USE_CONSTEVAL` to 0 in `ios/Pods/fmt/include/fmt/base.h`.
8. Change `IPHONEOS_DEPLOYMENT_TARGET` from 15.1 to 16.4 in the app `project.pbxproj`.
9. Apply the scene patch from the next section.
10. Build with `xcodebuild` in Release configuration.
11. Install the `.app` product with `xcrun simctl install`.
12. Start the app with `xcrun simctl launch`.
13. Take a screenshot with `xcrun simctl io screenshot`.
14. Read the screenshot and make sure the app content shows.
15. Stop the app before you start the next candidate.

The Podfile block sets `IPHONEOS_DEPLOYMENT_TARGET` to `16.4` for all pod targets.
The fmt change fixes a consteval error from fmt 11.0.2 and Xcode 27 Clang.
The pbxproj change fixes the app target only.
`pnpm` fails on this machine with `MODULE_NOT_FOUND`.
Use `bun` for installs.

## Scene patch

iOS 27 kills an app that has no scene lifecycle.
Such an app gets a process ID and then dies.
The simulator shows the home screen only.
Apply this patch when `AppDelegate.swift` starts React Native in `didFinishLaunchingWithOptions`.

1. Remove the `window = UIWindow(frame:)` block from `didFinishLaunchingWithOptions`.
2. Remove the `factory.startReactNative(...)` call from that block.
3. Keep the factory setup and the delegate setup.
4. Add a `SceneDelegate` class in the same file.
5. Give the class a `window` property of type `UIWindow?`.
6. In `scene(_:willConnectTo:options:)`, make a `UIWindow` from the window scene.
7. Assign that window to `appDelegate.window`.
8. Call `startReactNative` with module name `main` on that window.
9. Add `UIApplicationSceneManifest` to `Info.plist`.
10. Set `UIApplicationSupportsMultipleScenes` to false in that manifest.
11. Add one `UIWindowSceneSessionRoleApplication` configuration.
12. Set `UISceneDelegateClassName` to `<module>.SceneDelegate`.

Motion tabs and Curved bottom tabs already run with this patch.
Stack bottom sheets still needs this patch.
Meatball needs this patch after a fresh clone.

## Simulator reference

- Device: iPhone 18 Pro.
- System: iOS 27.0.
- UDID: `94273D2F-EA9C-4833-8437-107B507EDE71`.
- Screen: 1206 by 2622 pixels.
- Build command: `xcodebuild -workspace <name>.xcworkspace -scheme <name> -configuration Release -destination 'platform=iOS Simulator,id=94273D2F-EA9C-4833-8437-107B507EDE71' -derivedDataPath ./build build`.
- Stop an app: `xcrun simctl terminate <UDID> <bundleId>`.
- Route an app: `xcrun simctl openurl <UDID> <url>`.
- Screenshot: `xcrun simctl io <UDID> screenshot <file>.png`.

Apps on the simulator now:

- `com.solarin.myapp.dev`
- `com.tomekexpo.iosdesignpatterns`
- `com.mrpmohibur.expo-curved-bottom-tabs`
- `com.mrpmohibur.expo-motion-tabs`
- `com.mrpmohibur.expo-stack-bottom-sheet`

## Open items

- Nathan Schroeder has no repository for Media Gallery Carousel.
- Nathan Schroeder has no repository for Radial Menu.
- Ticket 07 waits for the maintainer on those links.
- Ticket 05 waits for Category decisions.
- Ticket 06 waits for Contributor confirmation.
- Ticket 11 waits on inactive and non-visual examples.
- Ticket 12 waits on capture and publication permissions.
- Ticket 09 waits for tickets 04, 05, 06, 07, 08, 11, and 12.
- The Expo CDN answers HTTP 403 for direct playback.
- Embedded Contributor players work.

## Files

- `.scratch/expo-demos/map.md` holds scope and decision rules.
- `.scratch/expo-demos/issues/04-near-duplicate-verdicts.md` holds all verdicts.
- `.scratch/expo-demos/research/repos-standalone.md` holds pins and entries.
- `.scratch/expo-demos/research/expo-inventory.md` holds the 31 Demo rows.
- `.scratch/expo-demos/research/duplicate-match.md` holds the match counts.
- `data/tabbars.ts` holds the nearest tab bar Recordings.
- `data/bottomsheets.ts` and `data/lists.ts` hold the nearest sheet Recordings.
- `ste-lint.py` sits at `/Users/mrp/.agents/skills/asd-ste100/scripts/ste-lint.py`.
- Run that script on ticket 04 after each verdict edit.

## Do not touch

- Do not touch `components/site-header.tsx`.
- Do not touch `tests/e2e/*.spec.ts`.
- Do not merge into the `old` branch.
- Do not reuse port numbers or preview URLs from old sessions.
