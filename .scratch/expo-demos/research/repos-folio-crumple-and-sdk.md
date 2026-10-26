# Folio, Daily Crumple, and SDK demo sources

## Scope and count rules

Inspection date: 2026-10-22 UTC.

This report covers only giaBaoJS/folio-popup-book, pablogdcr/daily-crumple, and kitten/expo-55-demos.
The Expo labels come from [the existing inventory](expo-inventory.md), rows 1, 2, and 21 through 31.
All GitHub reads used `gh api`.
All GitHub source links below use the inspected commit SHA.

These counts describe source access, not successful builds or runtime tests.
No dependency install, build, recording, media fetch, branch change, or commit occurred.
This report does not compare sources against existing catalogue Recordings.
The parent retains the ticket and map decisions.

A demo counts when source supplies an app entry or a reachable, distinct interaction.
A wrapper, generated asset, debug tool, or destination screen does not count as another demo.
Independent gestures can count separately inside one app.
Chapter scenes, display families, and alternate toolbar states remain explicit coverage within their parent experience.

- Folio: 1 storybook experience, with 4 chapter scenes and several different motion systems. No separate extra app.
- Daily Crumple: 3 independent gesture effects in 1 newspaper experience. Expo lists the experience, not individual effect names.
- SDK demos: 14 app experiences. Expo lists 11 app folders. The other 3 apps are extras.

These totals use the stated boundaries, not a uniform count of folders or screens.
The detailed sections preserve the smaller patterns and their selectors.

## giaBaoJS/folio-popup-book

### Inspection record

- Default branch: `main`.
- Full HEAD SHA: `f69ed6a949abd5048c5126b1bf39fd495b6da1bf`.
- Inspection date: 2026-10-22 UTC.
- Recursive tree: 102 entries, including 85 blobs.
- Tree `truncated`: `false`.
- Evidence: [branch ref][f-ref], [commit][f-commit], and [recursive tree][f-tree].

### Entry, registry, and manifest

The [package manifest][f-package] uses `index.ts` as its entry point.
The [root registration][f-index] loads [App.tsx][f-app], which renders [Stage][f-stage].
Stage is the only app screen.
The [scene registry][f-registry] contains exactly `woods`, `attic`, `lantern`, and `deep`, in that order.
The [world director][f-world] connects their portals in a cycle.

The manifest declares Expo `~57.0.27`, React Native `0.86.3`, `react-native-skia` `3.1.0`, and WebGPU `0.13.0`.
It also declares Reanimated `4.7.1` and Worklets `0.13.0`.
The [app configuration][f-config] declares only the iOS platform.
Stage imports the Skia native GPU device into WebGPU and uses `SkiaGraphiteView`.
These are native GPU requirements, not evidence of Expo Go or web support.

The [hinge module][f-hinge] uses `UIHingeInteraction` behind an iOS 27.1 availability test.
The [module bridge][f-hinge-bridge] treats the native module as optional.
The director supplies a tap-to-open fallback when no hinge is available.
The source still references the hinge API, so the runtime availability test does not establish compatibility with older Xcode SDKs.

### Demo inventory

| name | Expo-listed or extra | exact source link | app entry point / route / selector | source-based constraints |
| --- | --- | --- | --- | --- |
| Folio pop-up storybook | Expo-listed. Inventory row 1. | [Stage][f-stage], [book rig][f-rig], [world director][f-world] | `index.ts` → `App` → `Stage`. Tap the cover or use the hinge. Tap a portal or spread two fingers. | Native Skia Graphite and WebGPU. iOS configuration. Hinge API needs iOS 27.1. A tap fallback exists. |

### Chapter coverage within the same demo

These are distinct scene compositions, not four copies of one asset.
Each scene has its own source definition and camera.
Three scenes also supply separate actor-animation functions.
They remain chapters of one cyclic story, not four independent apps or extra demo counts.

The [startup flags][f-flags] read `chapter` from native Settings.
Stage maps `-chapter 0` through `-chapter 3` to the registry and opens the book immediately.
The flags are source selectors only. This inspection did not use them.

| name | Expo-listed or extra | exact source link | app entry point / route / selector | source-based constraints |
| --- | --- | --- | --- | --- |
| The Lantern House | Expo-listed experience, chapter I. | [Woods scene][f-woods], [rig][f-rig], [look][f-looks] | Normal cover opening or `-chapter 0`. House portal leads to the attic. | The rig folds pages, curves the spine, and raises paper pieces with springs. Shared particles and material effects supplement the rig. |
| The Reading Room | Expo-listed experience, chapter II. No separate Expo title. | [Attic scene][f-attic] | First portal or `-chapter 1`. Lantern portal leads to the paper sea. | `animateAttic` controls page turns, eye blinks, glances, fox motion, suspended stars, and light flicker. These actors share one scene. |
| The Sky in the Lantern | Expo-listed experience, chapter III. No separate Expo title. | [Lantern scene][f-lantern] | Second portal or `-chapter 2`. Reflection portal leads underwater. | `animateLantern` controls layered waves, boats, the lighthouse beam, fish leaps, splashes, and suspended objects. |
| Under the Paper Sea | Expo-listed experience, chapter IV. No separate Expo title. | [Deep scene][f-deep] | Third portal or `-chapter 3`. Book portal returns to chapter I. | `animateDeep` controls the whale path, articulated fins, jellyfish pulses, fish schools, bubble streams, and light motes. |

### Motion boundaries

The [rig][f-rig] and [world director][f-world] implement different motion systems.
Book opening drives page hinges and staged paper springs.
Portal navigation instead blends cameras and renders the next scene inside the current portal.
Both require coverage within the single storybook experience.

One-finger drag changes camera orbit.
Release restores the camera with a spring.
Portal pinch can complete or cancel a transition.
A back control reverses a completed chapter transition.
These controls belong to the [same director][f-world] and [gesture screen][f-stage], not separate routes.

The [overlay implementation][f-overlay] supplies another visible pattern.
Chapter cards slide into view and reveal text through an ink mask.
Tapping a card changes its expanded state.
The director also collapses the card after its initial dwell.
This pattern remains part of the chapter interface, but coverage must not omit it.

The [renderer][f-render] combines scene passes, shadows, particles, bloom, and the final composite.
Those passes do not expose separate demo selectors.
The [showreel controller][f-showreel] automates the same chapter cycle.
The [headless tool][f-headless] renders states from the same registry.
Neither tool adds another demo.

The tree also contains scene builders, atlas painters, generated meshes, audio, and README media.
These are support sources or assets, not additional app entries.
The [README][f-readme] describes the same four-chapter experience.

### Expo reconciliation

The listed Folio repo still contains the pop-up storybook implementation.
No listed demo is missing at this SHA.
The current source uses four story chapters.
This report does not establish visual parity with the historical Expo caption or its media.

## pablogdcr/daily-crumple

### Inspection record

- Default branch: `master`.
- Full HEAD SHA: `1df1560f88c09aeb1fe3ec84794183ff1db70337`.
- Inspection date: 2026-10-22 UTC.
- Recursive tree: 51 entries, including 40 blobs.
- Tree `truncated`: `false`.
- Evidence: [branch ref][c-ref], [commit][c-commit], and [recursive tree][c-tree].

### Entry, registry, and manifest

The [manifest][c-package] uses `index.ts` as its entry point.
The [root registration][c-index] loads [App][c-app].
App waits for fonts before it renders [NewsStack][c-stack].
NewsStack is the interaction registry. It mounts all three effects and connects their distinct inputs.
There is no route menu or second app.

The manifest declares Expo `~57.0.1`, React Native `0.86.0`, Skia `2.6.2`, and Reanimated `4.5.0`.
The [app configuration][c-config] specifies portrait orientation and disables tablet support on iOS.
It also contains Android and web settings.
Scripts alone do not establish that every effect supports those platforms.

The effects depend on [view snapshots][c-snapshot], native gestures, and UI-thread shared values.
The source imports `react-native-worklets`, but the root manifest does not declare that package directly.
This is a dependency declaration caveat, not a measured build failure.
The [README][c-readme] names a native iOS prebuild path and states no Expo Go support.
No build result here confirms or rejects that statement.

### Demo inventory

All three rows belong to Expo inventory row 2, "Interactive Newspaper shaders".
The inventory supplies a repo-root link and no per-effect names.
"Expo-listed suite member" records that association, not a claim that Expo media includes each effect.
None of these effects is an extra standalone app.

| name | Expo-listed or extra | exact source link | app entry point / route / selector | source-based constraints |
| --- | --- | --- | --- | --- |
| Newspaper swipe fold | Expo-listed suite member. No separate Expo effect title. | [CrinkleOverlay][c-crinkle], [crinkle shader][c-crinkle-shader], [page gestures][c-page-gestures] | `index.ts` → `App` → `NewsStack`. Drag horizontally across the page to change articles. | Snapshot-based SkSL deformation. Grab position changes the folds. Commit needs progress above 0.35 or speed above 800. Deck boundaries prevent a page change. |
| Newspaper edge stretch and crumple | Expo-listed suite member. No separate Expo effect title. | [OverscrollOverlay][c-overscroll], [overscroll shader][c-overscroll-shader], [ArticlePage][c-article] | Same screen. Drag beyond the top or bottom scroll boundary, or let momentum reach that boundary. | Needs an out-of-range native scroll offset and a valid snapshot. Release uses its own spring. Top and bottom are variants of one signed-offset effect. |
| Corner tear, paper ball, and basket throw | Expo-listed suite member. No separate Expo effect title. | [CrumpleOverlay][c-crumple], [paper mesh][c-mesh], [delete gesture][c-delete-gesture] | Same screen. Drag the top-right "TEAR HERE" corner toward the center. Release beyond progress 0.6. | An 80-triangle mesh folds into a ball. The ball follows a throw arc into a rising basket. Deletion stops when one article remains. |

### Motion boundaries

The swipe fold changes the article index.
The edge effect deforms the current page without changing its identity.
The corner gesture deletes an article.
These different triggers, state machines, and outcomes justify three effect rows despite the shared screen.

The corner peel, gather, ball rotation, basket rise, landing pulse, and basket descent form one delete sequence.
The [delete gesture][c-delete-gesture], [ball overlay][c-crumple], and [basket implementation][c-bin] connect those stages.
No separate selector starts a basket-only or throw-only demo.
They therefore do not add more rows.

The [article array][c-articles] contains seven content records.
Their pages reuse the same effects.
The [PageHolder][c-holder] component hides the live page while an effect draws its snapshot.
Article content, font setup, page wrappers, the FPS counter, and the touch indicator do not add independent demos.

### Expo reconciliation

The newspaper experience exists at HEAD.
No listed demo is missing.
The inspection exposes three effects behind the single Expo caption.
The source does not establish which effects the Expo media includes.

## kitten/expo-55-demos

### Inspection record

- Default branch: `main`.
- Full HEAD SHA: `af5bf702a3c5397df02f0aad9f01e6808a0d3418`.
- Inspection date: 2026-10-22 UTC.
- Recursive tree: 365 entries.
- Tree `truncated`: `false`.
- Evidence: [branch ref][k-ref], [commit][k-commit], and [recursive tree][k-tree].

### Workspace, routes, and common constraints

The [root manifest][k-package] contains no app entry or scripts.
The [workspace registry][k-workspace] selects `apps/*`.
The complete tree contains 14 app directories.
This inspection read all 14 package manifests, all 14 app configurations, and all 51 files under their `src/app` directories.
It also read their supporting UI components and data registries.
No other app or demo registry appears outside `apps/`.

Every app manifest uses `expo-router/entry`.
The file-based routes and `_layout.tsx` components define the reachable screens.
The manifest list below cites every package and its root route registry.
There is no shared runtime selector for these 14 apps.

Every app declares Expo `~55.0.0-preview.11`, Expo Router `~55.0.0-preview.8`, React `19.2.0`, and React Native `0.83.2`.
Several apps also use `@expo/ui` `55.0.0-preview.7`.
The repository name does not imply stable SDK dependencies.
The iOS, Android, and web scripts do not prove cross-platform support.
The implementation imports identify the native UI constraints below.

### Demo inventory

The count is 14 app experiences, not 14 unrelated animation mechanisms.
Several experiences contain static controls or API demonstrations rather than custom motion.
They remain in the inventory because the task includes demos as well as animations.
The three extras are complete app sources, not generated starter screens.

| name | Expo-listed or extra | exact source link | app entry point / route / selector | source-based constraints |
| --- | --- | --- | --- | --- |
| Age-range request | Extra. `apps/age-range`. | [Age Gate implementation][k-age-index] | `apps/age-range`, `/`. Press "Age Gate". | Calls `requestAgeRangeAsync` with thresholds 10, 13, and 18. [Configuration][k-age-config] declares the iOS age-range entitlement. The result stays in state without visible output. No custom animation. |
| Bonjour handwriting and shimmer | Extra. `apps/bonjour`. | [Skia path implementation][k-bonjour-index] | `apps/bonjour`, `/`. The effect starts when the font loads. | Skia converts the League Script font into contours. A seven-second stroke reveal and repeating gradient share one text composition. Reanimated and Worklets are dependencies. |
| Bottom Tab Accessory | Expo-listed. Inventory row 21. | [Accessory registration][k-bottom-tabs], [MiniPlayer][k-mini], [modal][k-now] | `apps/bottom-accessory`, tabs `(home)`, `browse`, `radio`, `library`, and `search`. Tap the accessory for `/now-playing`. | Uses `NativeTabs.BottomAccessory`, SF Symbols, and iOS colors. Handles inline and other accessory placements. Artwork uses remote URLs. Controls do not implement audio playback. |
| Material colors and Jetpack Compose UI | Expo-listed. Inventory row 22. | [Journal implementation][k-compose-index] | `apps/compose-colors`, `/`. Scroll the journal. | Uses `@expo/ui/jetpack-compose` and `Color.android.dynamic`. Android-specific UI. Mood and goal values are static. Chips and buttons supply no state-change handlers. |
| Android form sheet footer | Expo-listed. Inventory row 23. | [Sheet registry][k-form-layout], [sheet][k-form-sheet], [footer][k-form-footer] | `apps/formsheet-footer`, `/` automatically pushes `/sheet` when focused. Drag between detents 0.1, 0.4, and 1. | Uses Google Maps and `unstable_sheetFooter`. [Configuration][k-form-config] contains a `<replace-me>` Maps key. Android colors, location permissions, and native maps constrain setup. |
| iOS Live Activity | Expo-listed. Inventory row 24. | [Activity registration and layouts][k-live-layout], [controller][k-live-index] | `apps/live-activity`, `/`. The binoculars toolbar button starts or ends `FlightActivity`. | Uses SwiftUI and `expo-widgets` `55.0.0-alpha.8`. Banner and Dynamic Island layouts need the native activity context. Flight values are static. The layout ignores supplied status and ETA props. |
| Sharing Intent | Expo-listed. Inventory row 25. | [Native redirect][k-share-redirect], [share screen][k-share-screen] | `apps/sharing-intent`. Incoming host `expo-sharing` redirects to `/expo-sharing`. `/` gives instructions only. | Needs an incoming image share and native extension or intent setup. [Configuration][k-share-config] allows one iOS image and Android image MIME types. Only the first resolved payload renders. |
| Expo Router 55 Stack API | Expo-listed. Inventory row 26. | [Movies screen][k-stack-index], [movie link][k-movie-card], [watchlist toolbar][k-watchlist] | `apps/stack-api`, `/` → `/[id]` through a movie. Bookmark toolbar opens `/watchlist`. Edit and Done select toolbar modes. | Uses compositional Stack title, search, back-button, and toolbar APIs. Movie links also use Apple zoom, preview, and menus. Posters use remote TMDB URLs. Search and most actions are placeholders. |
| SwiftUI display settings | Expo-listed. Inventory row 27. | [Display and brightness implementation][k-swift-index] | `apps/swift-ui`, `/`. Use the appearance picker, toggles, and brightness slider. | Uses `@expo/ui/swift-ui`, iOS colors, and SF Symbols. Controls change local React state. No source changes actual system brightness or appearance. Other rows have no destination handlers. |
| Android Material tabs and colors | Expo-listed. Inventory row 28. | [Native tab registry][k-tabs-layout], [home][k-tabs-home], [library][k-tabs-library], [search][k-tabs-search] | `apps/tabs-colors`. Native tabs select `(home)`, `/library`, and `/search`. | Bodies use Jetpack Compose and Android dynamic colors. Book cover URLs are remote. Reading progress and lists are static. Tab state supplies the principal interaction. |
| Expo Router 55 Toolbar APIs | Expo-listed. Inventory row 29. | [Composer and toolbar implementation][k-tool-index] | `apps/toolbars`, `/`. Done changes the bottom toolbar. The pencil restores it. Alignment and formatting controls change state. | Uses native Stack toolbars, a badge, custom avatar, palette menus, and variable spacers. Text input works locally. Formatting flags do not change text style. Several actions do nothing. |
| iOS Lockscreen Widget | Expo-listed. Inventory row 30. | [Widget registration and families][k-widget-layout], [snapshot controller][k-widget-index] | `apps/widget`, `/`. Source registers `DeliveryWidget` and updates its snapshot on focus. Widget placement selects its family. | Uses SwiftUI and alpha `expo-widgets`. [Configuration][k-widget-config] lists two system families and two accessory families. Native widget placement occurs outside the app. Delivery values are static. |
| Expo Router 55 iOS Zoom Transitions | Expo-listed. Inventory row 31. | [Photo link and preview][k-photo-cell], [zoom target][k-photo-detail] | `apps/zoom-transitions`, `/` → `/photo/[id]`. Tap a photo, or use its preview and menu. | Uses `Link.Trigger withAppleZoom` and `Link.AppleZoomTarget`. Data generates 100 remote image seeds. Full images prefetch. Share and Delete labels have no handlers. |
| Split-view mail navigation | Extra. `apps/split-view`. | [SplitView implementation][k-split-layout], [message selector][k-message-list], [detail][k-message-detail] | `apps/split-view`, `/` → `/message/[id]`. Selecting the current message again restores `/`. | Uses `expo-router/unstable-split-view` and iOS colors. [Configuration][k-split-config] enables tablets and omits a portrait lock. Native split-view behavior needs suitable screen geometry. Mail data is local. |

### Manifests and route registries

These links support the package entry points and the complete app count.
Each route folder also contains the nested destinations discussed below.

- `age-range`: [manifest][k-age-package], [root layout][k-age-root], [app configuration][k-age-config].
- `bonjour`: [manifest][k-bonjour-package], [root layout][k-bonjour-root], [app configuration][k-bonjour-config].
- `bottom-accessory`: [manifest][k-bottom-package], [root stack][k-bottom-root], [tab registry][k-bottom-tabs], [app configuration][k-bottom-config].
- `compose-colors`: [manifest][k-compose-package], [root layout][k-compose-root], [app configuration][k-compose-config].
- `formsheet-footer`: [manifest][k-form-package], [sheet registry][k-form-layout], [app configuration][k-form-config].
- `live-activity`: [manifest][k-live-package], [root layout][k-live-root], [activity registry][k-live-layout], [app configuration][k-live-config].
- `sharing-intent`: [manifest][k-share-package], [root layout][k-share-root], [native route redirect][k-share-redirect], [app configuration][k-share-config].
- `split-view`: [manifest][k-split-package], [split registry][k-split-layout], [app configuration][k-split-config].
- `stack-api`: [manifest][k-stack-package], [root layout][k-stack-root], [app configuration][k-stack-config].
- `swift-ui`: [manifest][k-swift-package], [root layout][k-swift-root], [app configuration][k-swift-config].
- `tabs-colors`: [manifest][k-tabs-package], [tab registry][k-tabs-layout], [app configuration][k-tabs-config].
- `toolbars`: [manifest][k-tool-package], [root layout][k-tool-root], [app configuration][k-tool-config].
- `widget`: [manifest][k-widget-package], [root layout][k-widget-root], [widget registry][k-widget-layout], [app configuration][k-widget-config].
- `zoom-transitions`: [manifest][k-zoom-package], [root layout][k-zoom-root], [app configuration][k-zoom-config].

### Boundaries and smaller patterns

The following boundaries prevent screen counts from replacing demo counts.
They also preserve patterns that one app-level row could otherwise hide.

#### Bottom accessory

The five tabs present music content under one [accessory registry][k-bottom-tabs].
Their nested stacks are not five more demos.
The [now-playing modal][k-now] is the destination of the same accessory interaction.
It adds a repeating progress-bar animation, not a separate app or demo selector.

The [mini-player][k-mini] has inline and non-inline layouts.
It computes a progress style but never renders that style.
The modal renders the animated width, but its timestamp labels remain fixed.
Neither source connects its transport controls to audio playback.
The [music registry][k-music] supplies remote artwork and fixed track data.

#### Stack API and toolbars

[Stack API][k-stack-index] includes a movie grid, Apple zoom and preview, header search, and contextual menus.
The [watchlist route][k-watchlist] adds a separate toolbar interaction inside that experience.
Edit replaces one toolbar configuration with another.
Its palette, nested Share menu, and Done control need explicit coverage.
Watchlist is not another demo merely because it has a route.

The [Toolbar APIs app][k-tool-index] is independently selectable and uses a different composer composition.
It includes a custom avatar view, a header badge, bottom-toolbar replacement, variable spacer width, and stateful palette actions.
These patterns remain in its row, not hidden under the Stack API title.
They are toolbar modes, not separate app counts.

Apple zoom appears in both [movie links][k-movie-card] and [photo links][k-photo-cell].
The 14-app total therefore does not mean 14 unique API mechanisms.
The two implementations remain separate app experiences.
This distinction does not decide catalogue duplication.

#### SwiftUI and Compose controls

The [SwiftUI form][k-swift-index] contains a segmented picker, toggles, a slider, and labeled rows.
They form one display-settings composition.
They do not expose independent demonstration screens.
Its appearance state does not drive the root theme, which follows the system color scheme.

The [Compose journal][k-compose-index] contains cards, chips, buttons, lists, and dynamic color roles.
Its data is static, and its buttons have no handlers.
This is a native UI demo, not evidence of separate button or chip animations.
The [Material tabs app][k-tabs-layout] remains separate because it supplies its own tab navigation and book composition.
Its three content routes are destinations of that same tab demo.

#### Sharing, split view, and form sheet

The [Sharing Intent root screen][k-share-index] is an instructional empty state.
The [share destination][k-share-screen] handles payload resolution, errors, captions, and a selectable filter strip.
Filter selection changes borders and opacity, not image processing.
The Share button only returns to the previous route or root.
Those states belong to one incoming-share workflow.

The [SplitView root][k-split-layout] declares two columns and a shared mail provider.
Its [index screen][k-split-index] supplies an empty detail state.
The [message route][k-message-detail] supplies the selected detail.
Neither destination counts again.
The source does not expose a mailbox selector, despite multiple mailboxes in its data.

The [map screen][k-form-index] automatically presents the sheet.
The [sheet registry][k-form-layout] fixes the footer through `unstable_sheetFooter`.
The map, sheet contents, and footer form one compound demo.
The footer is a visual search field without text input.
A missing Maps key is a setup constraint, not a measured failure.

#### Widget and activity surfaces

The [DeliveryWidget registry][k-widget-layout] has four family branches.
`systemSmall` and the default `systemMedium` branch supply home-screen layouts.
`accessoryCircular` and `accessoryRectangular` supply lock-screen layouts.
These are four surfaces of one registered widget, not four independent demos.
Both the plugin configuration and widget implementation include the two system families beyond the Expo lock-screen caption.

The [FlightActivity registry][k-live-layout] supplies a banner, compact leading and trailing regions, a minimal region, and three expanded regions.
Those regions belong to one native Live Activity.
They are not independent apps or activities.
The controller starts and ends the activity, but it does not update its flight values.

The workspace applies an [expo-widgets patch][k-widget-patch] to native bundle setup and Metro resolution.
Native widget setup must preserve that repository context.
A normal in-app route alone cannot demonstrate the widget or every Live Activity surface.
No runtime inspection here establishes simulator support or native permissions.

#### Extras and support sources

[Bonjour][k-bonjour-index] combines contour tracing, glow, and gradient motion on one word.
The two Skia path layers share the same progress.
They therefore count as one extra demo, not separate handwriting and shimmer apps.

[Age Range][k-age-index] is an API request demo, not an animation.
Its manifest incorrectly repeats the Stack API package name.
Its folder and [app configuration][k-age-config] still identify a separate app.
Directory paths, not package-name uniqueness, establish the 14-app count.

The [workspace registry][k-workspace] also names package patches.
The tree includes Xcode support scripts and shared lockfile data.
These support native setup and do not add demo entries.

### Expo reconciliation

All 11 Expo-linked folders exist at the inspected SHA.
Every linked folder contains an implementation and `expo-router/entry` manifest.
No listed SDK demo is missing at HEAD.

The full app tree also contains `age-range`, `bonjour`, and `split-view`.
They do not appear among inventory rows 21 through 31.
The widget implementation adds home-screen families beyond the lock-screen caption.
The activity implementation adds Dynamic Island regions alongside the banner.
These extra surfaces remain explicit coverage, without inflating the app count.

## Planning caveats

This inventory establishes source presence and source selectors only.
It does not establish successful compilation, app startup, animation quality, or compatibility with the required capture device.
Folio targets a newer SDK and a hinge API than its Expo caption alone identifies.
Daily Crumple depends on snapshot capture and native scroll behavior.
The SDK workspace contains Android-only UI, iOS-specific UI, native extensions, and one Maps-key placeholder.
Those constraints require later execution decisions from the parent.

[f-ref]: https://api.github.com/repos/giaBaoJS/folio-popup-book/git/ref/heads/main
[f-commit]: https://github.com/giaBaoJS/folio-popup-book/commit/f69ed6a949abd5048c5126b1bf39fd495b6da1bf
[f-tree]: https://api.github.com/repos/giaBaoJS/folio-popup-book/git/trees/f69ed6a949abd5048c5126b1bf39fd495b6da1bf?recursive=1
[f-package]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/package.json
[f-config]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/app.json
[f-index]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/index.ts
[f-app]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/App.tsx
[f-stage]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/ui/Stage.tsx
[f-registry]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/story/registry.ts
[f-world]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/director/world.ts
[f-rig]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/story/rig.ts
[f-flags]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/flags.ts
[f-woods]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/story/scene_woods.ts
[f-attic]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/story/scene_attic.ts
[f-lantern]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/story/scene_lantern.ts
[f-deep]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/story/scene_deep.ts
[f-looks]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/story/looks.ts
[f-overlay]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/ui/overlay.ts
[f-render]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/engine/render.ts
[f-showreel]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/src/director/showreel.ts
[f-headless]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/tools/headless.ts
[f-hinge]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/modules/folio-hinge/ios/FolioHingeModule.swift
[f-hinge-bridge]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/modules/folio-hinge/index.ts
[f-readme]: https://github.com/giaBaoJS/folio-popup-book/blob/f69ed6a949abd5048c5126b1bf39fd495b6da1bf/README.md
[c-ref]: https://api.github.com/repos/pablogdcr/daily-crumple/git/ref/heads/master
[c-commit]: https://github.com/pablogdcr/daily-crumple/commit/1df1560f88c09aeb1fe3ec84794183ff1db70337
[c-tree]: https://api.github.com/repos/pablogdcr/daily-crumple/git/trees/1df1560f88c09aeb1fe3ec84794183ff1db70337?recursive=1
[c-package]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/package.json
[c-config]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/app.json
[c-index]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/index.ts
[c-app]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/App.tsx
[c-stack]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/screens/NewsStack.tsx
[c-crinkle]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/CrinkleOverlay.tsx
[c-crinkle-shader]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/crinkleShader.ts
[c-page-gestures]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/engine/usePageGestures.ts
[c-overscroll]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/OverscrollOverlay.tsx
[c-overscroll-shader]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/overscrollShader.ts
[c-article]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/components/ArticlePage.tsx
[c-crumple]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/CrumpleOverlay.tsx
[c-mesh]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/effects/paperBallMesh.ts
[c-delete-gesture]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/engine/useCrumpleGesture.ts
[c-bin]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/components/TrashBin.tsx
[c-snapshot]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/engine/useSnapshot.ts
[c-holder]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/components/PageHolder.tsx
[c-articles]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/src/data/articles.ts
[c-readme]: https://github.com/pablogdcr/daily-crumple/blob/1df1560f88c09aeb1fe3ec84794183ff1db70337/README.md
[k-ref]: https://api.github.com/repos/kitten/expo-55-demos/git/ref/heads/main
[k-commit]: https://github.com/kitten/expo-55-demos/commit/af5bf702a3c5397df02f0aad9f01e6808a0d3418
[k-tree]: https://api.github.com/repos/kitten/expo-55-demos/git/trees/af5bf702a3c5397df02f0aad9f01e6808a0d3418?recursive=1
[k-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/package.json
[k-workspace]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/pnpm-workspace.yaml
[k-age-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/age-range/package.json
[k-age-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/age-range/app.json
[k-age-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/age-range/src/app/_layout.tsx
[k-age-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/age-range/src/app/index.tsx
[k-bonjour-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bonjour/package.json
[k-bonjour-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bonjour/app.json
[k-bonjour-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bonjour/src/app/_layout.tsx
[k-bonjour-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bonjour/src/app/index.tsx
[k-bottom-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/package.json
[k-bottom-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/app.json
[k-bottom-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/src/app/_layout.tsx
[k-bottom-tabs]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/src/app/(tabs)/_layout.tsx
[k-mini]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/src/components/mini-player.tsx
[k-now]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/src/app/now-playing.tsx
[k-music]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/bottom-accessory/src/data/music.ts
[k-compose-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/compose-colors/package.json
[k-compose-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/compose-colors/app.json
[k-compose-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/compose-colors/src/app/_layout.tsx
[k-compose-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/compose-colors/src/app/index.tsx
[k-form-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/formsheet-footer/package.json
[k-form-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/formsheet-footer/app.json
[k-form-layout]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/formsheet-footer/src/app/_layout.tsx
[k-form-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/formsheet-footer/src/app/index.tsx
[k-form-sheet]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/formsheet-footer/src/app/sheet.tsx
[k-form-footer]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/formsheet-footer/src/components/SheetFooter.tsx
[k-live-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/live-activity/package.json
[k-live-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/live-activity/app.json
[k-live-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/live-activity/src/app/_layout.tsx
[k-live-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/live-activity/src/app/index.tsx
[k-live-layout]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/live-activity/src/live-activity.tsx
[k-share-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/sharing-intent/package.json
[k-share-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/sharing-intent/app.json
[k-share-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/sharing-intent/src/app/_layout.tsx
[k-share-redirect]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/sharing-intent/src/app/+native-intent.ts
[k-share-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/sharing-intent/src/app/index.tsx
[k-share-screen]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/sharing-intent/src/app/expo-sharing.tsx
[k-split-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/split-view/package.json
[k-split-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/split-view/app.json
[k-split-layout]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/split-view/src/app/_layout.tsx
[k-split-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/split-view/src/app/index.tsx
[k-message-list]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/split-view/src/components/message-list.tsx
[k-message-detail]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/split-view/src/app/message/%5Bid%5D.tsx
[k-stack-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/stack-api/package.json
[k-stack-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/stack-api/app.json
[k-stack-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/stack-api/src/app/_layout.tsx
[k-stack-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/stack-api/src/app/index.tsx
[k-movie-card]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/stack-api/src/components/movie-card.tsx
[k-watchlist]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/stack-api/src/app/watchlist.tsx
[k-swift-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/swift-ui/package.json
[k-swift-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/swift-ui/app.json
[k-swift-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/swift-ui/src/app/_layout.tsx
[k-swift-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/swift-ui/src/app/index.tsx
[k-tabs-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/tabs-colors/package.json
[k-tabs-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/tabs-colors/app.json
[k-tabs-layout]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/tabs-colors/src/app/_layout.tsx
[k-tabs-home]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/tabs-colors/src/app/(home)/index.tsx
[k-tabs-library]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/tabs-colors/src/app/library/index.tsx
[k-tabs-search]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/tabs-colors/src/app/search/index.tsx
[k-tool-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/toolbars/package.json
[k-tool-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/toolbars/app.json
[k-tool-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/toolbars/src/app/_layout.tsx
[k-tool-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/toolbars/src/app/index.tsx
[k-widget-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/widget/package.json
[k-widget-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/widget/app.json
[k-widget-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/widget/src/app/_layout.tsx
[k-widget-index]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/widget/src/app/index.tsx
[k-widget-layout]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/widget/src/delivery-widget.tsx
[k-widget-patch]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/patches/expo-widgets.patch
[k-zoom-package]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/zoom-transitions/package.json
[k-zoom-config]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/zoom-transitions/app.json
[k-zoom-root]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/zoom-transitions/src/app/_layout.tsx
[k-photo-cell]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/zoom-transitions/src/components/photo-cell.tsx
[k-photo-detail]: https://github.com/kitten/expo-55-demos/blob/af5bf702a3c5397df02f0aad9f01e6808a0d3418/apps/zoom-transitions/src/app/photo/%5Bid%5D.tsx
