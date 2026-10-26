# Solarin and iOS patterns: repository inventory

## Scope and method

Inspection date: 2026-10-22 UTC. Tree confirmation time: 07:56:25 UTC.

This report covers only `Solarin-Johnson/my-app` and `tchayen/ios-in-expo`.
The local [Expo inventory](expo-inventory.md) supplies the showcase names and the Expo-listed classification.
GitHub access used `gh api` only.
The inspection read recursive trees, manifests, route registries, all demo route bodies, and relevant component implementations.
All GitHub source links below use the inspected commit SHA.

A candidate is one independent example reachable through the app router at this SHA.
A route and its detail screens, settings, controls, and state variants form one candidate when they demonstrate one interaction.
A separate screen can qualify when it demonstrates a distinct interface, even if another demo contains its navigation link.
This rule separates Personal Hotspot from Settings, but groups Health's tabs into one example.

Here, route-connected means that source supplies an entry point.
It does not mean that the app builds or runs successfully.
The inspection installed no dependencies and did not build, start, or record an app.
The inspection used no external videos and did no catalogue duplicate matching.
No branch, map, or ticket changed.

## Snapshot and counts

| Repository | Default branch | Full HEAD SHA | HEAD commit date | Recursive tree | Candidates |
| --- | --- | --- | --- | --- | --- |
| [Solarin-Johnson/my-app][S-meta] | `main` | `7ebfc82c7cc8dad634f28b9f005ca6b800580c71` | 2026-09-25T18:11:13Z ([commit][S-commit]) | 351 entries, 277 blobs, `truncated: false` ([API tree][S-tree]) | 28: three Expo-listed, 25 extra |
| [tchayen/ios-in-expo][I-meta] | `main` | `8e0991d15647f98dce2f781547b952ce03d006e2` | 2026-06-11T16:06:47Z ([commit][I-commit]) | 77 entries, 63 blobs, `truncated: false` ([API tree][I-tree]) | Seven: expansions of one Expo-listed showcase |

Total: 35 route-connected candidates from four Expo inventory rows.
Solarin also contains ten archived experiment folders outside the active router.
Those folders do not enter the 28-candidate count.
The complete [Solarin tree][S-tree] and [iOS tree][I-tree] confirm every candidate source path below at its stated SHA.
Each tree contains one `package.json` and no additional package manifest.

## Solarin-Johnson/my-app

### App entry and common constraints

The [manifest][S-package] sets `main` to `expo-router/entry`.
The [root router][S-router] registers 28 demo folders and hides the home route from the drawer list.
The [home screen][S-home] opens that drawer through `Start Exploring`.
Every candidate below uses this root router and manifest.
The route column gives the route beneath that common entry point.

The [README][S-readme] requires a development client and explicitly excludes Expo Go.
The manifest declares Expo `^58.0.0-preview.7`, React Native `0.88.0-rc.1`, and Reanimated `4.7.0`.
It also declares native drawing, audio, glass, gesture, keyboard, and screen-transition dependencies.
The [app configuration][S-config] enables portrait orientation and configures the audio module's microphone permission message.
These declarations do not establish platform compatibility or build success.

### Candidate table

Each source folder contains the route file named in its route column.
Component links support constraints that the route delegates to another module.

| Name | Expo-listed or extra | Exact GitHub file/folder link | App entry point / route / selector | Source-based constraints |
| --- | --- | --- | --- | --- |
| 3D card scrolling | Extra | [app/3d-card-scrolling][S01] | `/3d-card-scrolling`, `index.tsx`, drawer `3D Card Scrolling` | Five glass cards rotate from scroll position. The route uses `GlassView` directly. |
| 3D delivery and signature card | Extra | [app/3d-rotate][S02] | `/3d-rotate`, `index.tsx` imports `default.tsx`, drawer `3D Rotate` | A slider and Next/Back control one card flip. The reverse contains `expo-drawpad`. `default.tsx` is not a second candidate. |
| Button keyboard | Extra | [app/button-keyboard][S03] | `/button-keyboard`, `index.tsx`, drawer `Button Keyboard` | The local layout supplies its provider. The [keypad][S-keypad] supports repeated taps, long presses, and case modes. No system keyboard replacement API appears. |
| Mood selector | Extra | [app/change-mood][S04] | `/change-mood`, `index.tsx`, drawer `Change Mood` | Five choices share one selector. The [container][S-mood-container] handles swipes. The [items][S-mood-item] use glass views and animated dimensions. |
| Custom back-history menu | Extra | [app/custom-back][S05] | `/custom-back`, then `/custom-back/100` or another ID, drawer `Custom Back` | The [layout][S-back-layout] wraps the stack in [CustomBack][S-back-component]. Long press expands history after navigation. IDs supply history, not separate demos. |
| Emoji pop | Extra | [app/emoji-pop][S06] | `/emoji-pop`, `index.tsx`, drawer `Emoji Pop` | Tap sends a bubble. Hold enlarges the current [bubble][S-bubble] until it bursts. The [composer][S-emoji-composer] uses glass views. |
| Fancy text | Extra | [app/fancy-text-demo][S07] | `/fancy-text-demo`, `index.tsx`, drawer `Fancy Text Demo` | Tap cycles three text strings. iOS opens `/fancy-text-demo/customize`. The [layout][S-fancy-layout] shares state with that settings sheet. |
| Floating gesture menu | Extra | [app/floating-menu][S08] | `/floating-menu`, `index.tsx`, drawer `Floating Menu` | One floating menu contains seven contacts and a Manage List action. Contact images use remote DiceBear URLs. Actions show alerts. |
| Freeform drawing and native toolbars | Extra | [app/freeform][S09] | `/freeform`, select a card or compose button, then `/freeform/001` | The [detail screen][S-freeform-detail] supplies drawing, undo, replay, SVG copy, brush, and line-weight controls. It requests a remote SVG icon. |
| Pull-down gesture navigation | Extra | [app/gesture-nav][S10] | `/gesture-nav`, `index.tsx`, drawer `Gesture Navigation` | A pan moves the content and supplies movement to `TopBar`. Release springs the content back. The screen supplies no navigation destination. |
| Gesture speed and lock control | Extra | [app/gesture-speed][S11] | `/gesture-speed`, `index.tsx`, drawer `Gesture Speed` | The [control][S-speed-component] activates after a 300 ms hold. Sideways movement selects 1–3x. Downward movement locks it. No media player appears. |
| Grok sidebar | Extra | [app/grok-sidebar][S12] | `/grok-sidebar`, `index.tsx`, drawer `Grok Sidebar`, then its menu button | Drawer progress drives translation and blur. The root router supplies special drawer options. Chat and suggestion controls contain no service integration. |
| Expandable in-app notification | Extra | [app/in-app-notif][S13] | `/in-app-notif`, `index.tsx`, drawer `In-App Notification`, Send Normal / Send Expandable | Both buttons use one [notification system][S-notify]. The [banner][S-banner] supports expansion and dismissal. Its [card][S-notify-card] requests a remote placeholder image. |
| iOS camera-style control | Extra | [app/ios-camera][S14] | `/ios-camera`, `index.tsx`, drawer `iOS Camera` | The [control][S-camera-component] animates tap, drag, lock, and pause affordances. It uses glass directly. It contains no camera capture API. |
| Keyboard-aware search window | Extra | [app/keyboard-ctrl][S15] | `/keyboard-ctrl`, `index.tsx`, drawer `Keyboard Controller`, Search button | [BottomBar][S-bottom-bar] opens an autofocus input and keyboard-aware window. Content rows are mock blocks. It includes interactive keyboard dismissal. |
| Online pulse | Extra | [app/online-pulse][S16] | `/online-pulse`, `index.tsx`, drawer `Online Pulse`, power button | Local state selects online/offline variants of [OnlinePulse][S-pulse-component]. The component uses `react-native-ease`. No network status API appears. |
| Drawing CAPTCHA interaction | Extra | [app/re-captcha][S17] | `/re-captcha`, `index.tsx`, drawer `reCAPTCHA`, checkbox then `Verify` | The [tray][S-captcha-tray] uses DrawPad and a 1500 ms success timer. The [card][S-captcha-card] requests a remote logo. This is not CAPTCHA verification. |
| Voice-message cancel gesture | Extra | [app/record-voice][S18] | `/record-voice`, `index.tsx`, drawer `Record Voice`, hold microphone then drag left | The route simulates time, microphone motion, and deletion. Cancellation uses a 150-point threshold. This route does not import the actual audio recorder. |
| Shimmer text | Extra | [app/shimmer-text-demo][S19] | `/shimmer-text-demo`, `index.tsx`, drawer `Shimmer Text Demo` | The [text component][S-shimmer-component] masks an animated gradient. iOS opens the customization sheet. Platform-specific customization files configure the same example. |
| Slack glass header menu | Extra | [app/slack-liquid-glass][S20] | `/slack-liquid-glass`, Open Chat, then `/slack-liquid-glass/chat`, tap header | The [iOS header][S-slack-header] opens a modal [glass island][S-slack-island]. Android re-exports the iOS launcher, but uses a generic header without that interaction. |
| iOS video progress slider | Expo-listed, inventory row 8 | [app/slider-demo][S21] | `/slider-demo`, `index.tsx`, drawer `Slider Demo`, drag progress thumb | [PlaybackControl][S-playback] uses a simulated 30000 ms duration. Scrubbing expands controls. Glass has an availability fallback. No video asset or player appears. |
| Stacked action buttons and draw input | Expo-listed, inventory row 7 | [app/stacked-button][S22] | `/stacked-button`, Sign, then `/stacked-button/sheet` | The [sheet][S-signature-sheet] combines DrawPad with reset/confirm button expansion. The [layout][S-signature-layout] sets a half-height form sheet. The launcher uses glass directly. |
| Stacked invitation inputs | Extra | [app/stacked-input][S23] | `/stacked-input`, `index.tsx`, drawer `Stacked Input`, Next / Back | Name, email, and reminder controls share one staged input sequence. The screen uses keyboard-controller and animated blur. It contains no invitation service. |
| Custom status bar and drawing canvas | Extra | [app/status-bar][S24] | `/status-bar`, `index.tsx`, drawer `Status Bar`, tap time or battery | The [status component][S-status-component] hides the system bar. Taps change time format and battery style. It reads battery state but renders a fixed `0.64` level. |
| Threads pull-to-refresh stroke | Extra | [app/threads-pull-refresh][S25] | `/threads-pull-refresh`, `index.tsx`, drawer `Threads Pull Refresh`, pull downward | [RefreshLogo][S-refresh-component] animates SVG stroke offsets from negative scroll position. The screen has no refresh request or content reload. |
| iOS-style bottom activity toast | Expo-listed, inventory row 6 | [app/toast-demo][S26] | `/toast-demo`, `index.tsx`, drawer `Toast Demo`, Start Download, then hold toast | The [demo wrapper][S-toast-wrapper] simulates six seconds of progress. The [toast][S-toast-component] expands after a 200 ms hold. No download occurs. |
| Twitter-style collapsing profile | Extra | [app/twitter-profile][S27] | `/twitter-profile`, `index.tsx`, drawer `Twitter Profile`, scroll vertically | Scroll position drives header blur, cover scale, avatar scale, and title position. Avatar and cover images use remote URLs. Toolbar actions have no handlers. |
| Untitled project and pull-down audio recorder | Extra | [app/untitled][S28] | `/untitled`, select a project, then `/untitled/1`, pull down or press Record | The [detail screen][S-untitled-detail] reveals the recorder. The [native layout][S-untitled-layout] supplies horizontal transitions. The [audio module][S-audio] requests microphone permission and writes local audio. |

### Expo mapping and source presence

The inventory names three Solarin showcases.
All three have source and active entry points at the inspected SHA.
No Solarin Expo-linked showcase is absent from HEAD.
This conclusion compares captions and source, not external footage.

| Expo showcase | Candidate | Evidence |
| --- | --- | --- |
| iOS-style bottom activity toast | iOS-style bottom activity toast | [Route][S26], [wrapper][S-toast-wrapper], [toast][S-toast-component], [root router][S-router], [manifest][S-package] |
| Stacked action buttons and draw input | Stacked action buttons and draw input | [Route folder][S22], [signature sheet][S-signature-sheet], [local router][S-signature-layout], [root router][S-router], [manifest][S-package] |
| iOS video progress slider | iOS video progress slider | [Route][S21], [playback component][S-playback], [root router][S-router], [manifest][S-package] |

The stacked-button showcase is one integrated signature workflow.
Its drawpad and button confirmations share one screen and state.
The unused `StackedButtonExample` in its launcher does not create another candidate.
The separate `/stacked-input` route demonstrates invitation inputs, not that signature workflow.
Sources: [launcher][S-signature-launcher], [sheet][S-signature-sheet], and [stacked inputs][S23].

### Nested screens and variants

The following groups explain why route count does not equal candidate count:

- `custom-back/[id]` supplies repeated navigation history for Custom Back, not different demos. Sources: [route folder][S05] and [layout][S-back-layout].
- `fancy-text-demo/customize` changes Fancy Text state. Sources: [route folder][S07] and [layout][S-fancy-layout].
- `shimmer-text-demo/customize.tsx` and `customize.ios.tsx` configure Shimmer Text. Source: [route folder][S19].
- `freeform/[id]` supplies the drawing destination for Freeform's cards and compose button. Sources: [route folder][S09] and [detail][S-freeform-detail].
- `stacked-button/sheet` supplies the signature interaction behind Sign. Sources: [launcher][S-signature-launcher] and [local router][S-signature-layout].
- `slack-liquid-glass/chat` supplies the destination behind Open Chat. Sources: [route folder][S20] and [iOS header][S-slack-header].
- `untitled/[id]` supplies project details and the recorder behind project selection. Sources: [route folder][S28] and [detail][S-untitled-detail].
- `3d-rotate/default.tsx` supplies the card used by `index.tsx`. Sources: [route folder][S02] and [rotation component][S-rotate-component].
- Toast states, notification variants, mood choices, and pulse states remain within their respective examples. Sources: [toast wrapper][S-toast-wrapper], [notifications][S13], [moods][S04], and [pulse][S16].

### Archived experiments outside the active router

The [recursive tree][S-tree] places these ten folders under `archive/`, not `app/`.
The [root router][S-router] supplies no active route for them.
Its Onboard and Mail App declarations occur only inside a commented block.
Neither the [manifest][S-package] nor [app configuration][S-config] redirects the router to `archive/`.
These examples remain source evidence, not runnable candidates through the current app entry point.
Their former route strings below do not establish active routes.

| Retained experiment | Exact GitHub folder | Source entry / former selector | Exclusion or constraint |
| --- | --- | --- | --- |
| Accordion | [archive/accordion][SA01] | `index.tsx` | Three instances share one accordion. The [item][S-accordion-item] changes Expanded/Collapsed text. No active route exists. |
| Gesture menu | [archive/gesture-menu][SA02] | `index.tsx` | Three menu options share one selector. No active route exists. |
| Mail-style list and toolbar | [archive/mail-app][SA03] | `index.tsx` and `_layout.tsx` | A mail list shares search and toolbar controls. Most handlers are absent or empty. No active route exists. |
| Onboarding phone mockup | [archive/onboard][SA04] | `index.tsx` | One remote screenshot supplies the mockup. The [screen][S-onboard-screen] supplies a static frame. No active route exists. |
| Open gift card | [archive/open-gift][SA05] | `index.tsx` | A flip connects gift artwork and a drawing surface. It uses the shared rotation helper. No active route exists. |
| Safari-style collapsing bar | [archive/safari-bar][SA06] | `index.tsx` | Article scroll position drives the bar. No active route exists. |
| Shared music-app options | [archive/shared-option][SA07] | `index.tsx` → former `/shared-option/expanded` | The carousel and expanded logos share transition tags. Five app records remain one example. No active route exists. |
| WhatsApp-style status pages | [archive/wa-status][SA08] | `index.ios.tsx` → former `/wa-status/page` → `/wa-status/notes` | Generic index returns null. Android re-exports iOS. Notes is empty. No active route exists. |
| Wheel number input | [archive/wheel-input][SA09] | `index.tsx`, EDIT button | One numeric input changes edit state. No active route exists. |
| Image zoom transition | [archive/zoom-trans][SA10] | `index.tsx` → former `/zoom-trans/detail` | Trigger and detail form one transition. The folder supplies its own stack layout. No active route exists. |

### Other exclusions

The [home screen][S-home] is the selector shell, not an independent demo.
It imports `Demo` and `HoverPad`, but does not render either component.
A source comment contains its `<Demo />` expression.
[Demo.tsx][S-orphan-demo] contains a complete SwiftUI confirmation-dialog example without an active selector.
The [HoverPad module][S-hover-pad] supplies reusable components without a mounted example in the inspected routes.
Neither enters the candidate count.

Theme wrappers, icons, providers, DrawPad wrappers, and shared UI primitives do not supply additional independent route examples.
The [component tree][S-components] and the route sources above show those support modules.
The [recorder module][S-audio] belongs to Untitled's recorder, not a second app route.
The standalone Record Voice route instead implements its own simulated gesture sequence.
Sources: [Untitled detail][S-untitled-detail], [recorder UI][S-untitled-recorder], and [Record Voice][S18].

## tchayen/ios-in-expo

### App entry and common constraints

The [manifest][I-package] sets `main` to `expo-router/entry`.
It declares Expo `~56.0.9`, React Native `0.85.3`, `@expo/ui` `~56.0.16`, and Expo Router `~56.2.9`.
The [home selector][I-home] contains six links.
The [root stack][I-router] registers these destinations and Personal Hotspot.
The [Settings screen][I01] supplies the link to Personal Hotspot.
Every candidate below uses this manifest and root stack.

The [README][I-readme] identifies the app as native iOS patterns through Expo Router and SwiftUI views.
The candidate sources import `@expo/ui/swift-ui`, use SF Symbols, and use native iOS system colors.
The [configuration][I-config] sets portrait orientation and also contains Android and web settings.
Those settings do not establish equivalent Android or web behavior.
The source does not establish a tested OS minimum, an Expo Go result, or build success.

### Expo showcase expansion

Inventory row 17 names `Native iOS interface patterns with Swift UI` and links to this repository root.
That umbrella expands into the seven independent examples below.
`Expo-listed expansion` means source beneath that umbrella, not seven separately named Expo inventory rows.
No additional route-backed independent example falls outside that umbrella.
No source for the named umbrella is absent from HEAD.
This mapping uses the [inventory](expo-inventory.md), [selector][I-home], [root stack][I-router], and candidate sources.

| Name | Expo-listed or extra | Exact GitHub file/folder link | App entry point / route / selector | Source-based constraints |
| --- | --- | --- | --- | --- |
| Settings form | Expo-listed expansion, Native iOS interface patterns with Swift UI | [src/app/settings.tsx][I01] | Home → Settings → `/settings` | Airplane Mode changes local state. Account and promotion rows open `/placeholder`. Personal Hotspot opens its own example. No device settings API appears. |
| Personal Hotspot form | Expo-listed expansion, Native iOS interface patterns with Swift UI | [src/app/personal-hotspot.tsx][I02] | Home → Settings → Personal Hotspot → `/personal-hotspot` | Two toggles change local state. Password and Data Usage open `/placeholder`. This screen does not create a hotspot. |
| Health Summary and native tabs | Expo-listed expansion, Native iOS interface patterns with Swift UI | [src/app/health][I03] | Home → Health Summary → `/health/summary`, then Summary / Sharing / Search tabs | The [tab router][I-health-tabs] uses `unstable-native-tabs`. The [summary][I-summary] draws fixed chart data. Sharing and Search show empty-state views. No HealthKit query appears. |
| TestFlight onboarding modal | Expo-listed expansion, Native iOS interface patterns with Swift UI | [src/app/tf-onboarding.tsx][I04] | Home → TestFlight Onboarding → `/tf-onboarding` | The root stack presents a modal. Continue calls `router.back()`. Feature rows and privacy text are static. The button uses `glassProminent`. |
| New Event form sheet | Expo-listed expansion, Native iOS interface patterns with Swift UI | [src/app/new-event.tsx][I05] | Home → New Event → `/new-event` | The root stack sets a full-height form sheet. Date and menu controls use local state. The [header][I-event-header] disables its confirmation button. No event save occurs. |
| Sign-in modal | Expo-listed expansion, Native iOS interface patterns with Swift UI | [src/app/sign-in.tsx][I06] | Home → Sign In → `/sign-in` | Email input reveals a secure password field. Sign In and Cancel both dismiss the modal. No authentication request appears. |
| View Options form sheet | Expo-listed expansion, Native iOS interface patterns with Swift UI | [src/app/view-options.tsx][I07] | Home → View Options → `/view-options`, Done in native toolbar | The root stack sets a 0.6-height form sheet. Sort, group, size, and extension controls change local state only. Done dismisses the sheet. |

### Grouping and exclusions

Personal Hotspot is a separate candidate because it supplies a distinct form and two independent state controls.
Its nested position in Settings does not make it a helper or a parameterized repeat.
Sources: [Settings][I01], [Personal Hotspot][I02], and [root stack][I-router].

Health is one integrated native-tab example.
Its [Summary stack][I-health-stack] supplies the large transparent header above the [summary screen][I-summary].
Its [Sharing][I-health-sharing] and [Search][I-health-search] screens each contain one `ContentUnavailableView`.
They supply tab destinations, not independent flows or additional chart demos.
The four summary cards share one scroll screen and fixed datasets.
They do not create four candidates.

The [generic placeholder][I-placeholder] contains only a Form, Section, and `Placeholder` text.
Settings, Hotspot, and New Event link to it for unfinished destinations.
It is not another example.
Sources: [Settings][I01], [Hotspot][I02], and [New Event][I05].

The [New Event header][I-event-header] belongs to the form sheet.
Its Event/Reminder segment changes header state only and does not select a second screen.
The date pickers and Travel Time, Repeat, and Alert menus belong to the same form.
Sources: [header][I-event-header], [form][I05], and [root stack][I-router].

The [home screen][I-home], [LinkRow][I-link-row], and [component folder][I-components] supply navigation and shared presentation.
They do not create more independent examples.
The complete [recursive tree][I-tree] contains no other app package or demo route family.

## Planning caveats

The counts measure source-backed candidates, not completed Recordings or verified runnable builds.
Solarin's ten archived folders and unused confirmation dialog remain visible exclusions for a later maintainer decision.
Several candidates simulate downloads, playback, network status, authentication, or device settings.
The tables identify those limits so execution does not mistake UI behavior for a service integration.
Native glass, audio permission, external images, and platform-specific screens need later runtime tests.
This report does not authorize upstream fixes or choose candidates for publication.

## Source links

[S-meta]: https://api.github.com/repos/Solarin-Johnson/my-app
[S-commit]: https://github.com/Solarin-Johnson/my-app/commit/7ebfc82c7cc8dad634f28b9f005ca6b800580c71
[S-tree]: https://api.github.com/repos/Solarin-Johnson/my-app/git/trees/7ebfc82c7cc8dad634f28b9f005ca6b800580c71?recursive=1
[S-package]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/package.json
[S-router]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/_layout.tsx
[S-home]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/index.tsx
[S-readme]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/README.md
[S-config]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app.json
[S-components]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components
[S01]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/3d-card-scrolling
[S02]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/3d-rotate
[S03]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/button-keyboard
[S04]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/change-mood
[S05]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/custom-back
[S06]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/emoji-pop
[S07]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/fancy-text-demo
[S08]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/floating-menu
[S09]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/freeform
[S10]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/gesture-nav
[S11]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/gesture-speed
[S12]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/grok-sidebar
[S13]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/in-app-notif
[S14]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/ios-camera
[S15]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/keyboard-ctrl
[S16]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/online-pulse
[S17]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/re-captcha
[S18]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/record-voice
[S19]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/shimmer-text-demo
[S20]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/slack-liquid-glass
[S21]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/slider-demo
[S22]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/stacked-button
[S23]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/stacked-input
[S24]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/status-bar
[S25]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/threads-pull-refresh
[S26]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/toast-demo
[S27]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/twitter-profile
[S28]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/untitled
[S-keypad]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/button-keyboard/pad.tsx
[S-mood-container]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/change-mood/container.tsx
[S-mood-item]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/change-mood/item.tsx
[S-back-layout]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/custom-back/_layout.tsx
[S-back-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/custom-back/index.tsx
[S-bubble]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/emoji-pop/bubble.tsx
[S-emoji-composer]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/emoji-pop/message-box.tsx
[S-fancy-layout]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/fancy-text-demo/_layout.tsx
[S-freeform-detail]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/freeform/%5Bid%5D.tsx
[S-speed-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/gesture-speed/index.tsx
[S-notify]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/notify/index.tsx
[S-banner]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/notify/banner.tsx
[S-notify-card]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/notify/card.tsx
[S-camera-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/iOSCameraControl.tsx
[S-bottom-bar]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/BottomBar.tsx
[S-pulse-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/OnlinePulse.tsx
[S-captcha-tray]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/re-captcha/tray.tsx
[S-captcha-card]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/re-captcha/card.tsx
[S-shimmer-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/ui/ShimmeringText.tsx
[S-slack-header]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/slack/header.ios.tsx
[S-slack-island]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/slack/island.tsx
[S-playback]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/PlaybackControl.tsx
[S-signature-sheet]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/stacked-button/sheet.tsx
[S-signature-layout]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/stacked-button/_layout.tsx
[S-signature-launcher]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/stacked-button/index.tsx
[S-status-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/status-bar-ui/index.tsx
[S-refresh-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/RefreshLogo.tsx
[S-toast-wrapper]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/DynamicToast.tsx
[S-toast-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/dynamic-toast/toast.tsx
[S-untitled-detail]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/untitled/%5Bid%5D.tsx
[S-untitled-layout]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/app/untitled/_layout.native.tsx
[S-untitled-recorder]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/untitled/record.tsx
[S-audio]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/recorder/Record.tsx
[S-rotate-component]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/3dRotate.tsx
[SA01]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/accordion
[SA02]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/gesture-menu
[SA03]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/mail-app
[SA04]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/onboard
[SA05]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/open-gift
[SA06]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/safari-bar
[SA07]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/shared-option
[SA08]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/wa-status
[SA09]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/wheel-input
[SA10]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/archive/zoom-trans
[S-accordion-item]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/accordion/item.tsx
[S-onboard-screen]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/onboard/screen.tsx
[S-orphan-demo]: https://github.com/Solarin-Johnson/my-app/blob/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/Demo.tsx
[S-hover-pad]: https://github.com/Solarin-Johnson/my-app/tree/7ebfc82c7cc8dad634f28b9f005ca6b800580c71/components/hover-pad
[I-meta]: https://api.github.com/repos/tchayen/ios-in-expo
[I-commit]: https://github.com/tchayen/ios-in-expo/commit/8e0991d15647f98dce2f781547b952ce03d006e2
[I-tree]: https://api.github.com/repos/tchayen/ios-in-expo/git/trees/8e0991d15647f98dce2f781547b952ce03d006e2?recursive=1
[I-package]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/package.json
[I-router]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/_layout.tsx
[I-home]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/index.tsx
[I-readme]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/README.md
[I-config]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/app.json
[I01]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/settings.tsx
[I02]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/personal-hotspot.tsx
[I03]: https://github.com/tchayen/ios-in-expo/tree/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/health
[I04]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/tf-onboarding.tsx
[I05]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/new-event.tsx
[I06]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/sign-in.tsx
[I07]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/view-options.tsx
[I-health-tabs]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/health/_layout.tsx
[I-health-stack]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/health/summary/_layout.tsx
[I-summary]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/health/summary/index.tsx
[I-health-search]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/health/search.tsx
[I-health-sharing]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/health/sharing.tsx
[I-placeholder]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/app/placeholder.tsx
[I-event-header]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/components/new-event-header.tsx
[I-link-row]: https://github.com/tchayen/ios-in-expo/blob/8e0991d15647f98dce2f781547b952ce03d006e2/src/components/link-row.tsx
[I-components]: https://github.com/tchayen/ios-in-expo/tree/8e0991d15647f98dce2f781547b952ce03d006e2/src/components
