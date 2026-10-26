Status: claimed
Type: grilling
Blocked by: 03

## Question

For each near-duplicate pair, is the candidate a duplicate or a new Recording?

Give the maintainer one prompt per pair. Each prompt names the candidate, the existing Recording, the exact repo folder or file, and the visual likeness. The maintainer gives the verdict for that pair. Record each verdict in this ticket.

This ticket is HITL. No agent gives the verdict for the maintainer.

## Comments

2026-10-22: The maintainer requested a temporary Markdown comparison before each interactive question.
Open that file with the default application.
Include clickable Expo, exact rnui.dev Recording, and GitHub source links.
If Expo provides no individual permalink, state that limit and identify the card by its exact title.
Keep source-based observations separate from visual evidence.
A presentation request is not a duplicate verdict.

2026-10-22: Corrected the Toast comparison target before the maintainer's verdict.
The initial caption-only match selected Enzo's Toast, but `data/misc.ts` also contains Solarin Johnson's Toast.
Compare the Expo candidate with Solarin's Recording `01M4NK9KWZXZFASVT90E1PXN2H`.
The pair table now uses that Recording. This correction is not a duplicate verdict.

### Playback search for the remaining pairs

The remaining pairs are 6 through 19, 22, and 23. All compare Solarin Johnson's examples with Solarin Johnson's existing Recordings.
GitHub research found no mapped Demo links in the pinned README, its history, the complete tree, or the inspected source files.
The repository had no releases, issues, PRs, tags, or commit comments at inspection.
These findings do not establish that no playback exists elsewhere.

The source referenced [a public app](https://solarin.expo.app).
Its homepage listed 23 examples. A browser inspection found some rendered interfaces but verified no candidate motion.
[3D Rotate](https://solarin.expo.app/3d-rotate) showed a delivery form without a verified rotation or signature sequence.
Other pages showed partial interfaces, a navigation overlay, or ambiguous blank content.
These results do not prove native-only behavior or establish a duplicate verdict.
The deployed app's commit remains unknown. Live web interfaces are not prerecorded candidate Demos.

No dependency installation, app build, capture, or publication occurred.
Keep pairs without a maintainer verdict pending. Obtain explicit permission before a local build or temporary capture.

### Direct-link correction

Direct HTTP requests returned 404 for `shimmer-text-demo`, `stacked-input`, `threads-pull-refresh`, and `slack-liquid-glass`.
The first browser report did not establish reliable direct navigation.
A focused browser inspection reached Stacked Input through the homepage menu and found an invitation form.
The same inspection did not verify the Shimmer Text effect.
For further live comparisons, link the homepage and name the exact menu option.
Do not present a known 404 URL as working playback.
These results do not change any maintainer verdict already recorded.

2026-10-25: Completed the source-only verdict pass for the remaining candidates.
All 26 near-duplicate pairs now hold a verdict.
All 45 New candidates now hold a New verdict, except Untitled project, which the maintainer skipped.
The SwiftUI brightness and text-size page is New, because its Contributor differs from the Settings form Contributor.
No build, simulator, capture, catalogue edit, or publication occurred.
`ste-lint.py` exits 0 for this ticket.

## Verdicts

### Furniture showcase versus Furniture App

Verdict: New.
The maintainer selected "New (Recommended)" after the Markdown comparison opened.
Keep Furniture showcase as a distinct candidate. Preserve the existing Furniture App Recording.
The compared Recording is `01JFP0CQDZBFBRY5SE2ZNSYPEK`.
The candidate source is `react-native-motion-lab/src/screens/FurnitureShowcaseScreen.tsx` at the inspected commit.
The comparison used source behavior and the existing Poster, not a new candidate capture.

### Bank card shimmer versus Flippy Card

Verdict: New.
The maintainer selected "New (Recommended)" after the Markdown comparison opened.
Keep the shimmer card as a distinct candidate. Preserve the existing Flippy Card Recording.
The compared Recording is `01JFP17XVW8RH5YREZD6SNBY0J`.
The candidate source is the `CardFlipScreen` folder in Motion Lab at the inspected commit.
The comparison records different designs and flip controls in source, not a new candidate capture.

### Art gallery corridor versus Art Gallery

Verdict: New.
The maintainer selected "New (Recommended)" after noting the different Contributors.
Keep Hewad Mubariz's corridor as a distinct candidate. Preserve Enzo Manuel Mangano (Reactiive)'s Art Gallery Recording.
The compared Recording is `01M436JWEVBV4SRWD6532EZ0BN`.
The candidate source is `react-native-motion-lab/src/screens/GalleryScreen.tsx` at the inspected commit.
The verdict applies to this pair. It does not establish an automatic rule for all different-Contributor pairs.

### Shared Transitions versus Shared Transitions

Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the Markdown comparison opened.
Preserve Recording `01KAY9AZ48VZ54S9BT05WG48XJ`. Do not add a second Recording.
The registry maps route `shared-transitions` to folder `shared-transition` at the inspected commit.
Flag the catalogue's plural source-folder spelling for a separate correction.
This decision does not change source metadata, Recording identity, or Assets.

### MNIST versus Neural Network

Verdict: Duplicate.
The maintainer chose the first option, "Duplicate (Recommended)".
Preserve Recording `01JGKF92A010BBMHWYG4Z0ZDKY`. Do not add a second Recording for the migrated source.
The candidate import history explicitly references `enzomanuelmangano/mnist-expo`.
The comparison supplied that history, but the maintainer cannot distinguish examples from source code alone.

### Presentation requirement after MNIST

Supply playable Expo and rnui.dev Demo links before asking for another verdict.
Source links remain supporting material. They are not substitutes for Demo playback.
A repository-only extra has no Expo playback link in the inventory.
Leave such pairs pending until visual evidence exists. Do not start a build or capture without permission.
Continue with pairs that have Expo playback, one pair at a time.

### iOS video progress slider versus Slider Playback Control

Original pair: 20.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the playback comparison opened.
Preserve Recording `01M4NHJ8XFHG2FTB286QTSHAC0`. Do not add a second Recording.
The file linked Expo's named slider card and the existing rnui.dev Demo.
The direct Expo video URL returned 403, so the comparison used Expo's embedded player page.

### Stacked action buttons and draw input versus Signature

Original pair: 21.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the playback comparison opened.
Preserve Recording `01M4NK9KWZ1111WVX28P331CPK`. Do not add a second Recording.
The comparison linked the named Expo card and the existing Signature Demo.
Both examples name Solarin Johnson as Contributor.

### iOS-style bottom activity toast versus Toast

Original pair: 24.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the corrected playback comparison opened.
Preserve Solarin Johnson's Recording `01M4NK9KWZXZFASVT90E1PXN2H`. Do not add a second Recording.
The comparison linked the named Expo card and Solarin's existing Toast Demo.
Enzo's separate Toast Recording remains unchanged.

### Stacked bottom sheets versus Stacked Bottom Sheet

Original pair: 25.
Verdict: New.
The maintainer selected "New (Recommended)" after the playback comparison opened.
Keep Rit3zh's example as a separate candidate.
Preserve Enzo Manuel Mangano (Reactiive)'s Recording `01KAY9B0A43NFXW3MNYDNQ0ATF`.
The candidate source is `rit3zh/expo-stack-bottom-sheet/components/BottomSheet.tsx` at the inspected commit.
The verdict applies to this pair, not every pair with different Contributors.

### Linear Tab Bar versus Linear Tab

Original pair: 26.
Verdict: New.
The maintainer chose the first option, "New (Recommended)", after the playback comparison opened.
Keep Nathan Schroeder's example as a separate candidate.
Preserve Arunabh Verma's Recording `01JGQTNR7P58P5TNX8TBQSYAX5`.
The candidate source is `SchroederNathan/linear-tab-bar/src/components/TabBar/index.tsx` at the inspected commit.

### Standing rule after Linear Tab Bar

The maintainer set this rule for future comparisons: visually identical examples from different Contributors count as New.
A visual resemblance does not make different Contributors' examples duplicates.
Different spellings of one Contributor's name do not identify different Contributors, as CONTEXT.md specifies.
This rule supersedes the earlier restriction against a general different-Contributor rule.
Same-Contributor pairs still need individual verdicts with playback evidence.

### 3D delivery and signature card versus Card Rotate

Original pair: 6.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after clarification of the four reference links.
Preserve Recording `01M4NPZHSTQ1MCHAZC6EM68K4F`. Do not add a second Recording.
The comparison supplied the live 3D Rotate page and the existing Card Rotate Demo.
The maintainer reported that the references show the same example.
The candidate source is `Solarin-Johnson/my-app/app/3d-rotate` at the inspected commit.
The live web app's commit remains unknown. This verdict does not establish source-version equivalence.
The maintainer did not authorize a build or capture. The agent performed neither.
Future comparisons must distinguish two examples from multiple links to the same example.

### Fancy Text Demo versus Fancy Text

Original pair: 9.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the two-example comparison opened.
Preserve Recording `01M4NK9KWZQ86J8CG9234KDNE2`. Do not add a second Recording.
The comparison supplied the live Fancy Text Demo and the existing Fancy Text Demo.
Both examples name Solarin Johnson as Contributor.
The live web app's commit remains unknown. No build or capture occurred.

### In-App Notification versus Inapp Notifications

Original pair: 12.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the two-example comparison opened.
Preserve Recording `01M4NPZHST4AGK3D9K9M7966T0`. Do not add a second Recording.
The comparison supplied the live In-App Notification example and the existing Inapp Notifications Demo.
Both examples name Solarin Johnson as Contributor.
The live web app's commit remains unknown. No build or capture occurred.

### Voice-message cancel gesture versus Record Voice

Original pair: 17.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the two-example comparison opened.
Preserve Recording `01M4NK9KWZESNED4VHD5EMW8E2`. Do not add a second Recording.
The comparison supplied the live Record Voice example and the existing Record Voice Demo.
Both examples name Solarin Johnson as Contributor.
The live web app's commit remains unknown. No build or capture occurred.

### Stacked invitation inputs versus Stacked Input

Original pair: 22.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the two-example comparison opened.
Preserve Recording `01M4NPZHST4FX3NS1AKT4XEKKB`. Do not add a second Recording.
The comparison supplied homepage navigation to Stacked Input and the existing Stacked Input Demo.
Both examples name Solarin Johnson as Contributor.
The live web app's commit remains unknown. No build or capture occurred.

Progress: 26 of 26 pairs decided: five New and twenty-one Duplicate. No pair needs a verdict.

### Pending visual evidence

The maintainer resolved Button keyboard, Mood selector, Floating gesture menu, and Freeform as Duplicate after their temporary native comparisons.
The installed app remains on the simulator, so later captures need no rebuild.
Each later capture still needs its own permission.
Every same-Contributor pair now has a verdict. No pair remains pending.
All near-duplicate pairs share Solarin Johnson as Contributor. The different-Contributor rule did not resolve them.
The research found no linked recordings on the inspected GitHub surfaces.
The live web inspection was inconclusive for several examples, not proof that they cannot work.
Keep this ticket claimed until the maintainer reviews the recorded verdicts.

### Limited local preview authorization

The maintainer selected "Authorize one local preview" after the next-step document opened.
This permits dependency installation, one local build of Solarin's pinned app, and one temporary capture of Button keyboard.
Use commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71` and the configured iPhone 18 Pro simulator on iOS 27.0.
The comparison target is T9 Style Pad. Other examples remain outside this capture permission.
Inspect source and build scripts first. Stop on build failure. Do not change upstream animation code.
Make no catalogue changes and publish nothing.
This authorization is not a duplicate verdict.

### Limited preview attempt

The temporary checkout uses commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The required iPhone 18 Pro simulator exists on iOS 27.0 with UDID `94273D2F-EA9C-4833-8437-107B507EDE71`.
The host uses Xcode 27.0, build `27A266a`, and Node `v22.13.1`.
Source inspection covered the package scripts, app configuration, lockfile, root layout, and Button keyboard route.

`bun install --frozen-lockfile --ignore-scripts` installed 913 packages successfully.
The native attempt used the development bundle ID with a Release build and no Metro server:

```sh
CI=1 EXPO_NO_DOTENV=1 EXPO_NO_TELEMETRY=1 APP_VARIANT=development ./node_modules/.bin/expo run:ios --configuration Release --no-bundler --device 94273D2F-EA9C-4833-8437-107B507EDE71 --output ./build
```

CocoaPods installed 132 pods. That stage took 354 seconds.
Native compilation continued until the shell stopped the command at its 900-second limit.
The log search found no compiler error or build-success result.
A process inspection found no remaining `xcodebuild`, `expo run:ios`, or temporary-checkout process.
This attempt timed out, but the log established no upstream compiler defect. No capture existed at that point.

The checkout remains at:

```text
/var/folders/qx/f6l08vfx2xl5lbv23r5mjm380000gn/T/opencode/arena/ses_e9d494ce3ffewmQFc93JMFhmEF/solarin-preview
```

The build log remains at:

```text
/var/folders/qx/f6l08vfx2xl5lbv23r5mjm380000gn/T/opencode/arena/ses_e9d494ce3ffewmQFc93JMFhmEF/tool-output/tool_1633722c0001nb2iIWf9Smg9B4
```

Build tooling added a Yarn `packageManager` field to the temporary checkout's package.json.
The agent made no upstream animation edits, catalogue edits, or publication.
The attempt stopped before another build command.
The maintainer then selected "Resume build (Recommended)" and authorized the same cached build with a 30-minute limit.
The capture scope remains Button keyboard only. Stop on another error or timeout.

### Successful build and Button keyboard capture

The authorized cached retry succeeded within the 30-minute limit.
Its log reports zero errors and three warnings.
The app installed as `com.solarin.myapp.dev` on the specified iPhone 18 Pro simulator.
The build used the same pinned source, Release configuration, and no Metro server.
The successful build log is:

```text
/var/folders/qx/f6l08vfx2xl5lbv23r5mjm380000gn/T/opencode/arena/ses_e9d494ce3ffewmQFc93JMFhmEF/tool-output/tool_16348cfbd001aprtkifMN6iO1w
```

The first completed capture used Argent, which added a watermark.
A direct simulator capture replaced that comparison file without changes to the app.
The first direct attempt stopped when Argent's touch transport failed.
Restarting only that device's transport restored touch commands. The subsequent direct capture completed successfully.
No other example entered the capture sequence.

The comparison used this temporary file:

```text
$TMPDIR/solarin-session/button-keyboard-comparison.mp4
```

That session directory no longer exists, so the file is gone. The maintainer gave the verdict before that cleanup.
The installed app remains on the simulator, so a later capture needs no rebuild.
The build output and first build log are also gone with that directory.

`ffprobe` reports H.264, 1206x2622, and a duration of 14.011667 seconds.
The capture has a variable frame rate. Sampled frames show the device screen without a watermark or simulator border.
The touch sequence targeted letter keys, the mode row, the delete key, and Done.
Sampled frames show typed text and the dismissed keypad. These samples do not verify every control's behavior.
The capture process stopped successfully.

The existing Demo is [T9 Style Pad](https://cdn.rnui.dev/demo/buttons/t9_style_pad_solarin_johnson.mp4).
Both sampled Demos show a centered username, character count, Done button, and three-column T9 keypad.
The existing Demo also shows a floating gear control. The temporary capture does not show that control.
These observations support a Duplicate recommendation, not a verdict on the maintainer's behalf.

No upstream animation edits, catalogue edits, Asset publication, or commits occurred.

### Floating gesture menu versus Floating Menu

Original pair: 10.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the two-example comparison opened.
Preserve Recording `01M4NK9KWZ83XW5NPXEBDT5M9V`. Do not add a second Recording.
The comparison supplied a temporary native capture and the existing Floating Menu Demo.
The capture shows the plus trigger, a timed hold, the drag, the seven-contact list, an item alert, and the closed state.
The capture shows the same contact names, avatar images, and list order as the existing Demo.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/floating-menu` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The menu opens only after a 600 ms hold and a drag. A simple tap does nothing.
This verdict does not authorize a Re-record, another example's capture, or publication.

### Delegated verdicts after iOS Camera

The maintainer changed the process at iOS Camera, original pair 13.
The maintainer said to examine the other examples without a per-pair question.
The maintainer also said to ask only when an example looks not yet added.
A clear match to an existing Recording becomes a Duplicate without a question.
A likely new example still needs the maintainer's verdict.

### Shimmer text versus Shimmer Text

Original pair: 18.
Verdict: Duplicate, recorded under the delegated process.
Preserve Recording `01M4NHJ8XFQCTNFF7X53YM39C7`. Do not add a second Recording.
The live screen matched the existing Demo: the same centered "Cooking..." text with a moving highlight.
A tap on the text opened the same customization sheet with Progress, Duration, Size, and Invert.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/shimmer-text-demo` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The maintainer may reverse this verdict. This verdict does not authorize publication.

### Drawing CAPTCHA interaction versus Recaptcha

Original pair: 16.
Verdict: Duplicate, recorded under the delegated process.
Preserve Recording `01M4NPZHSTNMSCNVQSF9JFVRAT`. Do not add a second Recording.
The live screen matched the existing Demo. Both showed the same "I'm not a robot" pill and the same tick box.
The selected state opened the same dotted tray and the same "Connect the Numbers in Order" label. It also showed the same three round controls and the same blue Verify button.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/re-captcha` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The maintainer may reverse this verdict. This verdict does not authorize publication.

### Online pulse versus Online Pulse

Original pair: 15.
Verdict: Duplicate, recorded under the delegated process.
Preserve Recording `01M4NHJ8XEY8019YDH1V5ZCEWK`. Do not add a second Recording.
The live screen matched the existing Demo: "Device Status" above three concentric rings with a power glyph.
The power control changed the state from ONLINE green to OFFLINE red.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/online-pulse` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The maintainer may reverse this verdict. This verdict does not authorize publication.

### Keyboard-aware search window versus Keyboard Controller

Original pair: 14.
Verdict: Duplicate, recorded under the delegated process.
Preserve Recording `01M4NPZHSSG9YJWRJT4PA6TA83`. Do not add a second Recording.
The live screen matched the existing Demo. Both showed the same bottom bar, autofocus search field, suggestion row, and mock list rows.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/keyboard-ctrl` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The maintainer may reverse this verdict. This verdict does not authorize publication.

### iOS camera-style control versus iOS Camera

Original pair: 13.
Verdict: Duplicate.
The maintainer selected "Duplicate / already added" after the running example appeared on the simulator.
Preserve Recording `01M4NK9KX0T379R493AVB10Z8B`. Do not add a second Recording.
The live control showed the shutter, then pause, stop, and lock controls after a tap and an upward drag.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/ios-camera` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
This verdict does not authorize a Re-record, another example's capture, or publication.

### Freeform drawing and native toolbars versus Freeform

Original pair: 11.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the two-example comparison opened.
Preserve Recording `01M4NK9KWZGM8K06MKH1KVW40S`. Do not add a second Recording.
The comparison supplied a temporary native capture and the existing Freeform Demo.
The capture opens the Dotted Paper card and draws two freehand loops on the same canvas.
Both examples show the same toolbar, stroke behavior, and screen layout.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/freeform` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
This verdict does not authorize a Re-record, another example's capture, or publication.

### Mood selector versus Mood

Original pair: 8.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the two-example comparison opened.
Preserve Recording `01M4NK9KWY4R6TNT7MAJX0RQ3M`. Do not add a second Recording.
The comparison supplied a temporary native capture and the existing Mood Demo.
The capture shows the pill row, expansion, two swipe changes, and the title and ambient color change.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/change-mood` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The candidate capture lacks the floating gear control that the existing Demo shows.
This verdict does not authorize a Re-record, another example's capture, or publication.

### Slack glass header menu versus Slack Liquid Glass

Original pair: 19.
Verdict: Duplicate, recorded under the delegated process.
Preserve Recording `01M4NPZHSTKQQZRWCWZZXHTYED`. Do not add a second Recording.
The live screen matched the existing Demo. Both showed the same glass profile sheet over the chat.
Both sheets showed the same header, the same Add, Move, and Search buttons, and the same Messages, Files, and Canvas rows.
Both sheets showed the same Call and Settings rows with chevrons.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/slack-liquid-glass` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The candidate sheet opened when the chat header received a tap.
The maintainer may reverse this verdict. This verdict does not authorize publication.

### Pull-down gesture navigation versus Chrome Like Pull To Refresh Create Tab Dismiss

Verdict: Duplicate, recorded under the delegated process.
Preserve Recording `01M4NPZHSSTNAX40DTRH9GRQY4`. Do not add a second Recording.
The live screen at `myapp:///gesture-nav` matched the existing Demo. Both showed `expo.dev` in the top bar and `Pull Down` in the center.
A downward drag opened the same top action row with `New Tab`, reload, and close icons.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/gesture-nav` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The maintainer may reverse this verdict. This verdict does not authorize publication.

### Threads pull-to-refresh stroke versus Thread Pull Refresh

Original pair: 23.
Verdict: Duplicate, recorded under the delegated process.
Preserve Recording `01M4NPZHSTHB75790DZ3RER0Y8`. Do not add a second Recording.
The live screen matched the existing Demo. Both showed a white screen with one centered Threads-style glyph.
A slow pull-down drew the same stroke around the glyph. The stroke showed the same shape at the same offset.
The candidate uses `Solarin-Johnson/my-app/app/threads-pull-refresh` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
The route name is `threads-pull-refresh`, and the screen holds no other content.
The existing Demo also shows a floating gear control. The live screen did not show that control.
Both examples name Solarin Johnson as Contributor.
The maintainer may reverse this verdict. This verdict does not authorize publication.

### 3D card scrolling

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep 3D card scrolling as a distinct candidate.
The candidate uses `Solarin-Johnson/my-app/app/3d-card-scrolling` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
No Recording in `data/*.ts` uses that folder.
The live screen showed five stacked glass cards. Vertical scroll changed their X-axis rotation.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Custom back-history menu

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep Custom back-history menu as a distinct candidate.
The candidate uses `Solarin-Johnson/my-app/app/custom-back` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
No Recording in `data/*.ts` uses that folder.
The live screen showed nested pages and a long-press back button that opened the history list.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Emoji pop

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep Emoji pop as a distinct candidate.
The candidate uses `Solarin-Johnson/my-app/app/emoji-pop` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
No Recording in `data/*.ts` uses that folder.
The live screen showed a glass composer. A tap sent a small emoji bubble, and a hold grew the bubble until it burst.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Gesture speed and lock control

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep Gesture speed and lock control as a distinct candidate.
The candidate uses `Solarin-Johnson/my-app/app/gesture-speed` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
No Recording in `data/*.ts` uses that folder.
The live screen showed a speed pill after a 300 ms hold. Sideways movement changed the multiplier, and downward movement locked the pill.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Grok sidebar

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep Grok sidebar as a distinct candidate.
The candidate uses `Solarin-Johnson/my-app/app/grok-sidebar` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
No Recording in `data/*.ts` uses that folder.
The live screen showed a glass drawer that slid over the Home screen as the drawer progress advanced.
The drawer held a demo list with 28 rows, a Contributor row, and an X link beside a GitHub link.
A left swipe closed the drawer and returned the app to the Home screen of the device.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Custom status bar and drawing canvas

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep Custom status bar and drawing canvas as a distinct candidate.
The candidate uses `Solarin-Johnson/my-app/app/status-bar` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
No Recording in `data/*.ts` uses that folder.
The closest Recording is Freeform, `01M4NK9KWZGM8K06MKH1KVW40S`. The canvas and the stroke match it.
The live screen showed a status bar that the app draws over the system status bar.
The system status bar stayed visible behind the drawn bar. A test on a device must find the cause.
A tap on the top strip returned the device to the previous app. The capture does not show the time or battery style taps.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Twitter-style collapsing profile

Verdict: New.
The maintainer selected "New" after the simulator capture opened.
Keep Twitter-style collapsing profile as a distinct candidate.
The candidate uses `Solarin-Johnson/my-app/app/twitter-profile` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
No Recording in `data/*.ts` uses that folder.
The closest Recording has the caption Animated Twitter Profile, `01JFP10Y1XR01CWPYTXC7GC8RA`.
That Recording names Arnaud Dellinger as Contributor. The different-Contributor rule makes the candidate New.
The live screen showed the avatar, name, handle, bio, counts, Edit Profile, and four toolbar buttons.
The cover image area was empty. The cover and avatar images use remote URLs.
The capture did not show the scroll response. A capture for publication must show the header blur and the avatar scale.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Untitled project and pull-down audio recorder

The maintainer skipped this candidate.
The pinned build crashes on `/untitled`, and the maintainer could not save a capture.
Do not ask again. Do not record a New or Duplicate verdict.

### Settings form

The maintainer asked to skip Untitled and open the next example.
The next example is Settings form from `tchayen/ios-in-expo` at commit `8e0991d15647f98dce2f781547b952ce03d006e2`.
No Recording in `data/*.ts` names Tomek Czajecki.
The first local Release build failed. Swift rejected `JavaScriptRuntime.swift:219` in `expo-modules-jsi`.
A second failure came from iOS 27, which kills apps without scene lifecycle.
Two patches in the throwaway checkout corrected both: a branch split in that Swift file, and a scene manifest plus `SceneDelegate` in the generated template.
No upstream file changed.
The app then ran as `com.tomekexpo.iosdesignpatterns` on the iPhone 18 Pro simulator.
`settings-toggle.mp4` shows the native push into the form and the Airplane Mode toggle in both states.
Verdict: New.
The maintainer selected "New" after the live simulator capture opened.
Keep Settings form as a distinct candidate.
The live screen showed a grouped native form with an account card and a toggle card.
The Airplane Mode toggle changed local state in both directions.
This verdict does not set a Category, capture a published Demo, or publish an Asset.
Personal Hotspot, Health Summary, TestFlight onboarding, New Event, Sign In, and View Options now have verdicts below.

### Personal Hotspot form

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep Personal Hotspot form as a distinct candidate, separate from Settings form.
The candidate uses `tchayen/ios-in-expo/src/app/personal-hotspot.tsx` at commit `8e0991d15647f98dce2f781547b952ce03d006e2`.
The live screen showed Allow Others to Join and Maximize Compatibility toggles, a Wi-Fi Password row, and a Data Usage row.
Both toggles changed local state. The example does not start a hotspot.
No Recording in `data/*.ts` matched this candidate during the comparison.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Health Summary and native tabs

Verdict: New.
The maintainer selected "New" after the live Summary screenshot appeared.
Keep Health Summary and its native tabs as one distinct candidate.
The candidate uses `tchayen/ios-in-expo/src/app/health` at commit `8e0991d15647f98dce2f781547b952ce03d006e2`.
The live screen showed Heart Rate Variability, Sleep Score, Steps, and Walking + Running Distance cards.
The Summary, Sharing, and Search tabs appeared below the cards.
No Recording in `data/*.ts` names this Contributor or uses this repository.
The source uses static chart data. It does not query HealthKit.
The screenshot supports this verdict, but it does not show tab transitions or scroll behavior.
A capture for publication must show those interactions.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### TestFlight onboarding modal

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep TestFlight onboarding modal as a distinct candidate.
The candidate uses `tchayen/ios-in-expo/src/app/tf-onboarding.tsx` at commit `8e0991d15647f98dce2f781547b952ce03d006e2`.
The local comparison showed the welcome heading, three feature rows, privacy text, and a Continue button.
Continue dismissed the modal and returned to the app selector.
The two comparison captures use H.264 at 1206x2622 on the iPhone 18 Pro simulator.
No Recording in `data/*.ts` names Tomek Czajecki, uses this repository, or has TestFlight in its caption.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### New Event sheet

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep New Event sheet as a distinct candidate.
The candidate uses `tchayen/ios-in-expo/src/app/new-event.tsx` at commit `8e0991d15647f98dce2f781547b952ce03d006e2`.
The live sheet showed a glass header, an Event and Reminder segment, an All-day toggle, date pickers, and menu pickers.
All-day hid the time fields. The Reminder segment did not change the form below it.
The Done button stayed disabled. The sheet does not write to the device calendar.
No Recording in `data/*.ts` names this Contributor or uses this repository.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Sign In sheet

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep Sign In sheet as a distinct candidate.
The candidate uses `tchayen/ios-in-expo/src/app/sign-in.tsx` at commit `8e0991d15647f98dce2f781547b952ce03d006e2`.
The live modal showed a purchase sign-in heading, an email field, Forgot password text, and Sign In and Cancel buttons.
A Password field appeared after the email field received text.
Both buttons dismiss the modal. The example does not authenticate.
No Recording in `data/*.ts` names this Contributor, uses this repository, or has a sign-in caption.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### View Options sheet

Verdict: New.
The maintainer selected "New" after the simulator comparison opened.
Keep View Options sheet as a distinct candidate.
The candidate uses `tchayen/ios-in-expo/src/app/view-options.tsx` at commit `8e0991d15647f98dce2f781547b952ce03d006e2`.
The live sheet showed Sort By, Group By, and Icon and List Size menu pickers, plus a Show All Filename Extensions toggle.
Sort By changed from Name to Date. The toggle changed local state. The checkmark dismissed the sheet.
The sheet does not sort or change files.
No Recording in `data/*.ts` names this Contributor or uses this repository.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Button keyboard versus T9 Style Pad

Original pair: 7.
Verdict: Duplicate.
The maintainer selected "Duplicate (Recommended)" after the two-example Markdown comparison opened.
Preserve Recording `01M4NPZHSSJ4C5EFEARD0V2KHW`. Do not add a second Recording.
The comparison supplied the temporary native capture and the existing T9 Style Pad Demo.
Both examples name Solarin Johnson as Contributor.
The candidate uses `Solarin-Johnson/my-app/app/button-keyboard` at commit `7ebfc82c7cc8dad634f28b9f005ca6b800580c71`.
This verdict does not authorize a Re-record, another example's capture, or publication.

### Curved bottom tabs

Verdict: New.
The maintainer selected "New" after the live simulator comparison.
Keep Curved bottom tabs as a distinct candidate.
The candidate uses `rit3zh/expo-curved-bottom-tabs` at commit `62654b86b27601af2a67506b5b5df179ca508f36`.
The entry is `expo-router/entry` to `src/app/_layout.tsx`. The tab bar is `src/components/curved-tabs.tsx`.
The live app showed five tabs: Home, Search, Apps, Library, and Profile.
A white pill holds the active icon. A curved neck joins the pill to a glass bar.
A tap moved the pill to the tapped icon. A horizontal drag also moved the pill.
The nearest Recordings are Dynamic Tab Indicator `01KAY9ASQHBJ71E93SHA11EM3S` and Exclusion Tabs `01KAY9AT65Q7HYV6M6JFXN89N2`.
They also include Fluid Tab Interaction `01KAY9AV0NQW7VCDEV9JV20B5G` and Blurred Bottom Bar `01KAY9AQNRBW52J7AAXXSTP4QG`.
The rest are Floating Bottom Bar `01KAY9ATX66HE5QKYC60VRJ0VM`, Bottom Bar Skia `01KAY9ARA9G35A2CGGQMPQ218A`, Metaball `01KAY9AX8BVDX6M06FX7DC4A0F`, and Linear Tab `01JGQTNR7P58P5TNX8TBQSYAX5`.
All of them name Enzo Manuel Mangano (Reactiive) as Contributor.
The candidate names rit3zh as Contributor. The map rule makes a different Contributor a New candidate.
No Recording in `data/*.ts` names rit3zh or uses this repository.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Motion tabs

Verdict: New.
The maintainer selected "New" after the live simulator comparison.
Keep Motion tabs as a distinct candidate.
The candidate uses `rit3zh/expo-motion-tabs` at commit `9a95ea9fa9839c6627bf15860797a208663369b4`.
The entry is `expo-router/entry` to `src/app/(tabs)/_layout.tsx`. The effect is `src/motion-tabs/animated-tab-bar.tsx`.
The live app showed three tabs: Home, Search, and Profile.
A tap on a tab morphs the glass bar into a blurred panel above it.
A tap on the same tab or the backdrop closes the panel.
The nearest Recordings are Dynamic Tab Indicator `01KAY9ASQHBJ71E93SHA11EM3S` and Exclusion Tabs `01KAY9AT65Q7HYV6M6JFXN89N2`.
They also include Fluid Tab Interaction `01KAY9AV0NQW7VCDEV9JV20B5G` and Blurred Bottom Bar `01KAY9AQNRBW52J7AAXXSTP4QG`.
The rest are Floating Bottom Bar `01KAY9ATX66HE5QKYC60VRJ0VM`, Bottom Bar Skia `01KAY9ARA9G35A2CGGQMPQ218A`, Metaball `01KAY9AX8BVDX6M06FX7DC4A0F`, and Linear Tab `01JGQTNR7P58P5TNX8TBQSYAX5`.
Seven of them name Enzo Manuel Mangano (Reactiive) as Contributor. Linear Tab names Arunabh Verma.
The candidate names rit3zh as Contributor. The map rule makes a different Contributor a New candidate.
No Recording in `data/*.ts` names rit3zh or uses this repository.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Stack bottom sheets

Verdict: New.
The maintainer selected "New".
Keep Stack bottom sheets as a distinct candidate.
The candidate uses `rit3zh/expo-stack-bottom-sheet` at commit `9e2cc750f809ae5bd7eba986ed529adae3e4a581`.
The entry is `expo-router/entry` to `app/index.tsx`. The effect is `components/BottomSheet.tsx`.
The app stacks sheets from one array. Tasks or New Task opens Task. Options opens another sheet. Complete opens a success sheet.
Only the top sheet accepts the dismissal drag.
The closest match is Stacked Bottom Sheet `01KAY9B0A43NFXW3MNYDNQ0ATF`.
It names Enzo Manuel Mangano (Reactiive) as Contributor.
The other nearest Recordings are Bottom Sheet `01JFFAHZKJR3P3XAKMBYAW2DWF` and Dot Sheet `01KAY9AS0K0W5JZY100FNM2WDY`.
No Recording in `data/*.ts` names rit3zh or uses this repository.
The candidate names rit3zh as Contributor. The map rule makes a different Contributor a New candidate.
The Release build succeeded after the fmt consteval patch and the 16.4 deployment-target patches.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Telegram-style avatar dynamic island scroll-collapse

Verdict: New.
The maintainer selected "New" after the comparison file opened.
Keep Telegram-style avatar dynamic island scroll-collapse as a distinct candidate.
The candidate uses `rit3zh/expo-meatball-animation` at commit `11fefeb91964d548081bf24d49a5c3d6e205cbac`.
The entry is `expo-router/entry` to `app/profile.tsx`, and the effect is `components/canvas/AnimatedCanvas.tsx`.

The live app showed a circular avatar above a settings list.
A scroll on the profile collapsed the avatar into a black island pill and showed a compact header.
The closest Recording is Metaball `01KAY9AX8BVDX6M06FX7DC4A0F`, which names Enzo Manuel Mangano (Reactiive) as Contributor.
No Recording in `data/*.ts` names rit3zh or uses this repository.
The candidate names rit3zh as Contributor, so the map rule makes it a New candidate.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Native paste inputs

Verdict: New.
The maintainer gave this verdict after a source-only comparison.
Keep Native paste inputs as a distinct candidate.
The candidate uses `arunabhverma/expo-paste-input` at commit `1f3e3b34ea99250c68e483c71f1217307874f12a`.
The effect file is `example/App.tsx`.

The source imports `TextInputWrapper` and `PasteEventPayload` from the native module `expo-paste-input`.
A paste of a clipboard image adds an attachment to a glass composer.
That composer uses `GlassView` from `expo-glass-effect`.

Arunabh Verma is the Contributor of the candidate.
The catalogue names Arunabh Verma for two Recordings.
Text Input Inspired By X (Twitter) is `01JFP0ZD9A8T5SB3F9S4YTP7QP` and uses `arunabhverma/expo-x-input`.
Mention Input is `01JFP0ZJX7JWGPPVGV59SCAX2K` and uses `arunabhverma/expo-mention`.
No Recording in `data/*.ts` uses `arunabhverma/expo-paste-input`.
The same Contributor holds all three, so this verdict comes from a maintainer decision, not from the map rule.

The comparison gave two live links.
The Expo link is <https://expo.dev/demos/arunabh-verma>, and the card title is "Native paste inputs".
The rnui.dev links are <https://www.rnui.dev/recording/01JFP0ZD9A8T5SB3F9S4YTP7QP> and <https://www.rnui.dev/recording/01JFP0ZJX7JWGPPVGV59SCAX2K>.

This verdict does not set a Category, capture a published Demo, or publish an Asset.

### WebGPU bird flock murmuration

Verdict: New.
The maintainer gave this verdict after a source-only comparison.
Keep WebGPU bird flock murmuration as a distinct candidate.
The candidate uses `hewad-mubariz/react-native-motion-lab` at commit `ba9b8e4872dfef26c2b34902f966e9c3e4511a00`.
The effect file is `src/screens/BirdsScreen.tsx`.

The screen draws a boid flock on a `react-native-wgpu` Canvas.
A tap disturbs the flock. A double tap hides the toolbar.
The toolbar sets a text formation and a sky preset.

Hewad Mubariz is the Contributor of the candidate.
The closest Recording is Particle Dispersion `01M4MGY1QMMGBS8FTJKSV66BNX`.
That Recording names Blazej Kustra as Contributor.
No Recording in `data/*.ts` names Hewad Mubariz or uses this repository.
The Contributors differ, so the map rule makes this candidate New.

The comparison gave two live links.
The Expo link is <https://expo.dev/demos/hewad-mubariz>, and the card title is "WebGPU bird flock murmuration".
The rnui.dev link is <https://www.rnui.dev/recording/01M4MGY1QMMGBS8FTJKSV66BNX>.

This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Salon / cinema seat selection

Verdict: New.
This verdict comes from a source-only comparison, without a maintainer question.
The maintainer set a stop rule: stop only for a real duplicate.
Keep Salon / cinema seat selection as a distinct candidate.
The candidate uses `hewad-mubariz/react-native-motion-lab` at commit `ba9b8e4872dfef26c2b34902f966e9c3e4511a00`.
The effect file is `src/screens/SalonSelectionScreen.tsx`.

A WebGPU canvas shows a cinema seat map.
A pan and a pinch move the view. A tap selects a seat.
A booking panel shows the seat count, the seat strip, and the total.

The closest Recording is Selectable Grid List `01KAY9AYPXB5A229Z1VP4DJEFF`.
That Recording names Enzo Manuel Mangano (Reactiive) as Contributor.
The Recording selects cells in a flat grid, not seats in a 3D map.
No Recording in `data/*.ts` names Hewad Mubariz or uses this repository.
The Contributors differ, so the map rule makes this candidate New.
The Expo Contributor page is <https://expo.dev/demos/hewad-mubariz>, and this example has no card.
The rnui.dev link is <https://www.rnui.dev/recording/01KAY9AYPXB5A229Z1VP4DJEFF>.

This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Remaining Hewad Mubariz candidates

Verdict for these three: New.
These verdicts come from a source-only comparison, without a maintainer question.
The candidates use `hewad-mubariz/react-native-motion-lab` at commit `ba9b8e4872dfef26c2b34902f966e9c3e4511a00`.
Hewad Mubariz is the Contributor. No Recording in `data/*.ts` uses this repository except the two pair subjects.

Football stadium seat selection is an Extra example, so Expo has no card.
`StadiumSelectionScreen.tsx` draws a stadium bowl on a WebGPU Canvas.
A pan and a pinch move the view, and a tap selects a seat.
The panel shows SELECTED, CATEGORY, and TOTAL, and the button reads "Continue to payment".
The closest Recording is Selectable Grid List `01KAY9AYPXB5A229Z1VP4DJEFF`.
That Recording selects cells in a flat grid, not seats in a drawn bowl.
Expo page: <https://expo.dev/demos/hewad-mubariz>.

Pixel explosion / Tiger reform is an Extra example, so Expo has no card.
`PixelExplosionScreen.tsx` uses a `@react-native-community/slider`, a double tap, and a long press.
The controls set the explosion progress of a full-screen image.
The closest Recording is Color Pixelated `01JFP11ABHSG86RQ0DCEHRFQSQ`.
That Recording names Daehyeon Mun (문대현) as Contributor and recolors pixels.
The candidate scatters pixels in depth.
Expo page: <https://expo.dev/demos/hewad-mubariz>.

Bar chart / Voxel city morph is an Extra example, so Expo has no card.
`BarChartScreen.tsx` interpolates one shared value between a bar chart and a voxel city.
The same screen toggles night, switches metrics, and selects one building.
The closest Recording is Bar Chart `01JFP0SN7BRNV4W6MKR78P3VGC`.
That Recording names Daniel Friyia as Contributor and stays a flat chart.
No Recording in `data/*.ts` morphs a chart into a city.
Expo page: <https://expo.dev/demos/hewad-mubariz>.

### Remaining Enzo Manuel Mangano candidates

Verdict for these two: New.
The candidates use `enzomanuelmangano/demos` at commit `884c9f8f969fd3fd24319da9ffcd9e54c0735445`.

Linear Sensors is an Extra example, so Expo has no card.
`linear-sensors/react-logo.tsx` moves a Skia React logo from the device rotation sensor.
No Recording in `data/*.ts` uses a device-motion sensor as the driver.
The closest Recording is Scroll Progress `01KAY9AYJ1FWVDFDD6XJ50K39F`, and it uses scroll, not tilt.
Expo page: <https://expo.dev/demos/enzo-manuel-mangano>.

Sculptures in Words is an Extra example, so Expo has no card.
`sculptures-in-words/index.tsx` extrudes letter glyphs into a 3D sculpture and moves them with a shader.
A scroll writes the progress, and a sideways swipe changes the sculpture.
The closest Recording is Composable Text `01KAY9ART81BT8BC8Y8EVR0E6C`, which animates text on a plane.
Expo page: <https://expo.dev/demos/enzo-manuel-mangano>.

### Folio pop-up storybook

Verdict: New.
This verdict comes from a source-only comparison.
The candidate uses `giaBaoJS/folio-popup-book` at commit `f69ed6a949abd5048c5126b1bf39fd495b6da1bf`.
`src/ui/Stage.tsx` paints 3D pop-up pages on a Skia Graphite view.
A hinge module reads the device hinge angle, and a tap opens a portal.
The closest Recording is Paper Folding `01KAY9AXHXSGRY304WZND73TJA`.
That Recording names Enzo Manuel Mangano (Reactiive) as Contributor.
The Pages differ, so the map rule makes this candidate New.
Expo page: <https://expo.dev/demos/paul-nguyen>. Card title: Folio pop-up book.
rnui.dev: <https://www.rnui.dev/recording/01KAY9AXHXSGRY304WZND73TJA>.

### Newspaper shader candidates

Verdicts: New for all three.
The candidates use `pablogdcr/daily-crumple` at commit `1df1560f88c09aeb1fe3ec84794183ff1db70337`.
Pablo Giraud-Carrier is the Contributor. No Recording in `data/*.ts` uses this repository.

Newspaper swipe fold uses a crinkle shader over a snapshotted page during a horizontal drag.
The closest Recording is Paper Folding `01KAY9AXHXSGRY304WZND73TJA`.
The candidate folds paper with a shader, and the Recording folds a surface with Skia paths.

Newspaper edge stretch and crumple uses an overscroll shader at the scroll boundary.
The closest Recording is Chrome Like Pull To Refresh Create Tab Dismiss `01M4NPZHSSTNAX40DTRH9GRQY4`.
That Recording names Solarin Johnson as Contributor and pulls a tab surface.
The candidate stretches paper.

Corner tear, paper ball, and basket throw builds a paper-ball mesh and throws it on a Bezier arc.
The closest Recording is Paper Folding `01KAY9AXHXSGRY304WZND73TJA`.
No Recording in `data/*.ts` builds a mesh ball.
Expo page: <https://expo.dev/demos/pablo-giraud-carrier>. Card title: Interactive Newspaper shaders.
rnui.dev: <https://www.rnui.dev/recording/01KAY9AXHXSGRY304WZND73TJA>.

### Phil Pluckthun native API candidates

Verdicts: New for these five.
The candidates use `kitten/expo-55-demos` at commit `af5bf702a3c5397df02f0aad9f01e6808a0d3418`.
Phil Pluckthun is the Contributor. No Recording in `data/*.ts` uses this repository.

Age-range request calls `AgeRange.requestAgeRangeAsync` from `expo-age-range`.
The button opens the system age gate. No Recording in `data/*.ts` uses a system permission sheet.
This is an Extra example, so Expo has no card.

Bonjour handwriting and shimmer draws a League Script text path and moves a gradient along it.
The closest Recording is Shimmer Text `01M4NHJ8XFQCTNFF7X53YM39C7`.
That Recording shimmers text without a drawn path.
This is an Extra example, so Expo has no card.

iOS Live Activity registers a `FlightActivity` layout with `expo-widgets`.
No Recording in `data/*.ts` uses a Live Activity.
Card title: iOS Live Activity.

Sharing Intent redirects a share-extension URL in `+native-intent.ts`.
No Recording in `data/*.ts` accepts an incoming share.
Card title: Sharing Intent.

Split-view mail navigation mounts `SplitView` from `expo-router/unstable-split-view`.
No Recording in `data/*.ts` uses a split view.
This is an Extra example, so Expo has no card.

Expo page: <https://expo.dev/demos/phil-pluckthun>.

### Phil Pluckthun listed app candidates

Verdicts: New for these five.
The candidates use `kitten/expo-55-demos` at commit `af5bf702a3c5397df02f0aad9f01e6808a0d3418`.

Bottom Tab Accessory mounts `NativeTabs.BottomAccessory` above four native tabs.
The closest Recording is Dynamic Tabs `01JFP1BAPMR11CKR9ZBZ9F3HBR`, which names Hewad Mubariz as Contributor.
The candidate adds an accessory above the bar.

Material colors and Jetpack Compose UI renders a Material 3 journal page with Jetpack Compose views.
The closest Recording is Journal Cards `01JXY8S0V9TQE2D53RJFHZXG4A`, which names Thomino as Contributor.
Journal Cards animates stacked cards, and the candidate shows a static journal page.

Android form sheet footer presents a route as a `formSheet` with a footer and detents.
The closest Recording is Bottom Sheet `01JFFAHZKJR3P3XAKMBYAW2DWF`, which names Enzo Manuel Mangano (Reactiive) as Contributor.
The candidate uses native detents.

Expo Router 55 Stack API uses `Stack.Screen.Title large`, a search toolbar slot, and a watchlist route.
The closest Recording is Animated Toolbar `01JFP0Y3XN5KWA7ENF4N0SP3SW`.
That Recording names Aashu Dubey as Contributor and animates a custom toolbar.
The candidate uses native stack toolbars.

Expo Router 55 Toolbar APIs sets `Stack.Toolbar` placements, a badge, and a spacer.
The closest Recording is Animated Toolbar `01JFP0Y3XN5KWA7ENF4N0SP3SW`.
The candidate uses the native toolbar API.

Android Material tabs and colors mounts `NativeTabs` with Material icons.
The closest Recording is Dynamic Tabs `01JFP1BAPMR11CKR9ZBZ9F3HBR`.
The candidate uses native Material tabs.

Expo Router 55 iOS Zoom Transitions uses `Link.Preview` and a photo cell zoom.
The closest Recording is Instagram Shared Transition `01KAY9AWGXS2F13Z8Y6A71GEGW`.
That Recording names Enzo Manuel Mangano (Reactiive) as Contributor.
The candidate uses the native zoom transition.

iOS Lockscreen Widget registers a `DeliveryWidget` and updates its snapshot on focus.
No Recording in `data/*.ts` uses a widget.
This verdict does not set a Category, capture a published Demo, or publish an Asset.

Expo page: <https://expo.dev/demos/phil-pluckthun>.

### SwiftUI brightness and text-size page

Verdict: New.
This verdict comes from a source-only comparison, without a maintainer question.
Keep the SwiftUI settings page as a distinct candidate.
The candidate uses `kitten/expo-55-demos` at commit `af5bf702a3c5397df02f0aad9f01e6808a0d3418`.
The file is `apps/swift-ui/src/app/index.tsx`.
The page builds a brightness and text-size form with a SwiftUI `Form`.
The page holds an Appearance `Picker`, a Text Size control, a Brightness `Slider`, True Tone, and Night Shift.
No Recording in `data/*.ts` holds an iOS Settings page.

The Settings form candidate is `tchayen/ios-in-expo` at `src/app/settings.tsx`.
That candidate names Tomek Czajecki as Contributor and holds a New verdict.
This candidate names Phil Pluckthun as Contributor.
The Contributors differ, so the map rule makes this candidate New.
The two pages also differ: one shows brightness and text-size controls, and the other shows the root Settings list.

The comparison gave two live links.
The Expo links are <https://expo.dev/demos/phil-pluckthun> and <https://expo.dev/demos/tomek-czajecki>.
The card titles are `Swift UI iOS display settings page` and `Native iOS interface patterns with Swift UI`.
No rnui.dev Recording holds an iOS Settings page, so this comparison has no rnui.dev link.

This verdict does not set a Category, capture a published Demo, or publish an Asset.

### Source-only comparison rule after Telegram-style avatar dynamic island scroll-collapse

The maintainer set a new comparison process after this verdict.
Compare candidates from source code only, and do not build an app or open the simulator.
When a candidate resembles an existing Recording, supply two live links.
One link opens the Recording page at `https://www.rnui.dev/recording/<id>`.
The other link opens the Expo page for the candidate and names the exact card title.
Ask for permission before any other action.
