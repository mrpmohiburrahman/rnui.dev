# Standalone repo demo inventory

Inspection date: 2026-10-22 UTC.

This report covers only the six requested GitHub repos.
The Expo labels come from [the existing inventory](expo-inventory.md), rows 12 through 16 and row 20.
I used `gh api` for all GitHub access.
I read each complete recursive tree, package manifest, app entry point, route registry, and relevant implementation at the commit below.
Every GitHub file link below names a path that exists in that commit's recursive tree.
I also read each linked source file through the contents API at that commit.

No installations, builds, recordings, or media downloads occurred.
I did not inspect X links or other repos.
I made no duplicate decisions and changed no branches or commits.
The parent owns the map and tickets.

## Snapshot and counts

HEAD means the default branch commit at inspection time.
The tree flag comes from `GET /repos/{owner}/{repo}/git/trees/{HEAD}?recursive=1`.
A candidate means a distinct demonstration reachable through the committed app, without a source change.
This is source evidence, not a successful runtime test.

| Repo | Default branch | Full HEAD SHA | Inspection date UTC | Tree truncated | Expo-listed candidates | Extra runnable candidates | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rit3zh/expo-curved-bottom-tabs | main | `62654b86b27601af2a67506b5b5df179ca508f36` | 2026-10-22 | false | 1 | 0 | 1 |
| rit3zh/expo-motion-tabs | main | `9a95ea9fa9839c6627bf15860797a208663369b4` | 2026-10-22 | false | 1 | 0 | 1 |
| rit3zh/expo-stack-bottom-sheet | main | `9e2cc750f809ae5bd7eba986ed529adae3e4a581` | 2026-10-22 | false | 1 | 0 | 1 |
| rit3zh/expo-meatball-animation | main | `11fefeb91964d548081bf24d49a5c3d6e205cbac` | 2026-10-22 | false | 1 | 0 | 1 |
| arunabhverma/expo-paste-input | main | `1f3e3b34ea99250c68e483c71f1217307874f12a` | 2026-10-22 | false | 1 | 0 | 1 |
| SchroederNathan/linear-tab-bar | main | `829f2778ee8a10b1076951edf5c2d7c7796de41a` | 2026-10-22 | false | 1 | 0 | 1 |

Total: six candidates, all Expo-listed.
No Expo-listed demo for these six repos is absent from native source at HEAD.
The paste-input web app does not demonstrate native paste behavior.

## Group rule

A route count is not a demo count.
One interaction can span several routes, components, panels, or content fixtures.
Those parts form one candidate when the app presents them as one demonstration.
A component without a mounted example or selector does not count as a runnable extra.
Ordinary sample content, native controls, image-load fades, and scrolling do not form separate candidates here.
The sections below identify those exclusions, including unused animation code.
These groups describe each repo internally and do not decide catalogue duplicates.

## rit3zh/expo-curved-bottom-tabs

### Candidate

| Name | Expo-listed or extra | Exact file/folder GitHub link | App entry point / route / selector | Source-based constraints |
| --- | --- | --- | --- | --- |
| iOS liquid-glass curved bottom tabs | Expo-listed | [src/components/curved-tabs.tsx][c-effect] | `expo-router/entry` → `src/app/_layout.tsx`. Home route `/index`. Tabs select `/search`, `/apps`, `/library`, and `/profile`. Tap or drag the pill. | Expo `~56.0.9`, React Native `0.85.3`, Reanimated `4.3.1`, and Worklets `0.8.3`. Native glass depends on `isLiquidGlassAvailable()`. The root waits for local fonts. Gallery images use remote URLs. |

### Evidence and grouping

[package.json][c-package] declares `expo-router/entry`, the SDK versions, and platform scripts.
[app.json][c-config] declares the portrait app and the `expocurvedbottomtabs` scheme.
[src/app/_layout.tsx][c-routes] registers five tabs and mounts `CurvedTabBar` inside `GestureHandlerRootView`.
Each tab folder contains one stack layout and one content route.
[src/constants/tab-bar.ts][c-tab-constants] maps those same five route names to icons.

[src/components/tab-bar.tsx][c-bar] composes one `CurvedTabs` instance with triggers and one indicator.
[src/components/curved-tabs.tsx][c-effect] connects the indicator, icons, surface, navigation, and pan gesture.
[use-pill-animation.ts][c-animation] drives the indicator edges through different springs.
[use-pill-gesture.ts][c-gesture] snaps the indicator to a tab after a drag.
These effects form one tab-bar candidate, not five screen candidates.

The active [tab-bar-surface.tsx][c-surface] uses SVG paths and conditional native glass beads.
The [README](https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/README.md) describes a Skia surface, but the mounted surface does not import Skia.
Glass availability changes the surface and pill styling, not the candidate count.
[src/constants/fonts.ts][c-fonts] names the three font files that the root loads.
The empty `regular.ttf` tree entry is not among those imports.

### Other source and exclusions

| Source | Reachability and reason for exclusion |
| --- | --- |
| [src/app/index/index.tsx][c-home] and [gallery-screen.tsx][c-gallery] | Home gallery content and header toolbar surround the tab-bar demonstration. Toolbar buttons have no action callbacks. |
| [src/app/apps/index.tsx][c-apps] and [src/app/search/index.tsx][c-search] | Category cards, image grids, and a native search bar supply tab content. They do not select another demonstration. |
| [src/app/library/index.tsx][c-library], [src/app/profile/index.tsx][c-profile], and [native-segmented.tsx][c-segmented] | Saved/Liked and Posts/Saved/Tagged change gallery content through a SwiftUI segmented Picker on iOS. Other platforms use Pressables. These are sample content controls. |
| [native-menu-list.tsx][c-menu] | Profile mounts a SwiftUI settings list and a Notifications Toggle on iOS. Menu rows have no supplied actions. The non-iOS fallback omits the Toggle. These are sample settings controls. |
| [gallery-footer.tsx][c-footer], [collection-section.tsx][c-collection], and [photo-grid.tsx][c-grid] | Horizontal gallery scrolling, card press styles, and image-load transitions support the gallery content. No separate animation selector exists. |
| [glass-view.tsx][c-unused-glass] and [demo-screen.tsx][c-unused-screen] | The route graph does not mount these components. Their existence does not add a runnable demo. |

Count: one Expo-listed candidate, zero extra runnable candidates.
Expo-listed absence at HEAD: none.
The complete [recursive tree][c-tree] contains no other app routes or example app.

## rit3zh/expo-motion-tabs

### Candidate

| Name | Expo-listed or extra | Exact file/folder GitHub link | App entry point / route / selector | Source-based constraints |
| --- | --- | --- | --- | --- |
| iOS motion bottom tabs popovers | Expo-listed | [src/motion-tabs/animated-tab-bar.tsx][m-effect] | `expo-router/entry` → `/` redirects to `/home`. `src/app/(tabs)/_layout.tsx` mounts the bar. Tap Home, Search, or Profile to select a route and toggle its panel. Tap the same tab or the backdrop to close. | Expo `~55.0.24`, React Native `0.83.6`, Reanimated `4.2.1`, and Worklets `0.7.4`. The bar mounts `GlassView` directly. Panel transitions use iOS blur or Android filters. Android runtime behavior remains untested. |

### Evidence and grouping

[package.json][m-package] declares the router entry and runtime versions.
[app.json][m-config] declares the portrait app and the `expomotiontabs` scheme.
[src/app/index.tsx][m-entry] redirects to `/home`.
[The tab registry][m-routes] registers `home`, `search`, and `profile` and supplies `ExamplePopupBody`.
The three nested stack layouts wrap content screens, not separate demos.

[src/components/animated-tab-bar.tsx][m-export] only re-exports the implementation from `src/motion-tabs`.
It is not a second tab-bar implementation.
[animated-tab-bar.tsx][m-effect] combines one glass card, the panel stack, and the tab toolbar.
[use-view-transition.ts][m-transition] toggles the selected panel and records the direction between panels.
[use-card-morph.ts][m-morph] changes the card dimensions.
[use-morph-tab-motion.ts][m-tab-motion] changes tab width, label visibility, and press deformation.
[use-panel-motion.ts][m-panel-motion] changes panel opacity, position, scale, and blur.
All these changes belong to the same tab-to-popover demonstration.

[example-popup-body.tsx][m-popup-selector] selects three content bodies by route name.
[Home][m-home-popup], [Search][m-search-popup], and [Profile][m-profile-popup] contain different content, not independent animation engines.
The Search example uses placeholder text, not the editable input from the fallback body.
Home playback and menu rows do not implement real playback or navigation.
The root theme stays dark, but the bar reads the device color scheme for its own palette.

### Other source and exclusions

| Source | Reachability and reason for exclusion |
| --- | --- |
| [src/reacticx-components/accordion/index.tsx][m-accordion] | Extra animation code exists. It implements expanding content, blur, rotating chevrons, and alternate icons. No app route or mounted component imports it. HEAD has no accordion example or selector. It does not count as runnable. |
| [src/motion-tabs/components/popup-body.tsx][m-fallback] and [use-popup-renderer.tsx][m-popup-hook] | Fallback menu bodies exist, including an editable search input. The app explicitly supplies `ExamplePopupBody`, so the fallback is not an app-selectable extra. |
| [src/app/(tabs)/home/index.tsx][m-home] and [podcast-horizontal-list.tsx][m-podcasts] | Podcast cards and snapping lists supply background content. Playback pills show fixed progress. They do not run a separate animation demo. |
| [src/app/(tabs)/search/index.tsx][m-search] and [src/app/(tabs)/profile/index.tsx][m-profile] | Search and settings screens contain sample content, native headers, and press styles. They remain content routes inside the tab demonstration. |
| [src/components/progress-indicator+background-pill.tsx][m-progress] | The component draws progress from props. It has no progress animation or playback handler. |

[useSfProFont.ts][m-fonts] loads three committed font files.
Sample artwork uses remote URLs, but this inspection did not request them.
Several files import `@expo/vector-icons`, but the root manifest does not declare it directly.
This source fact does not establish a build failure.

Count: one Expo-listed candidate, zero extra runnable candidates.
Expo-listed absence at HEAD: none.
The complete [recursive tree][m-tree] contains no second app or demo registry.

## rit3zh/expo-stack-bottom-sheet

### Candidate

| Name | Expo-listed or extra | Exact file/folder GitHub link | App entry point / route / selector | Source-based constraints |
| --- | --- | --- | --- | --- |
| Stacked bottom sheets | Expo-listed | [components/BottomSheet.tsx][s-effect] | `expo-router/entry` → `app/index.tsx`, route `/`. Tasks or New Task opens Task. Options opens another sheet. A settings row adds another sheet. Complete opens a success sheet. Projects and Meetings/Schedule show other content fixtures. | Expo `~53.0.20`, React Native `0.79.5`, and Reanimated `~3.17.4`. The route forces dark mode. Screen height determines sheet sizes. Only the top sheet accepts the dismissal drag. The Task success fixture closes after 2000 ms. |

### Evidence and grouping

[package.json][s-package] declares the router entry, SDK versions, and platform scripts.
[app.json][s-config] enables the new architecture and declares the `expostackbottomsheet` scheme.
[app/_layout.tsx][s-layout] mounts a Stack.
[app/index.tsx][s-route] is the only content route.
It supplies Task, Calendar, Projects, Success, and Settings content to the same `BottomSheet.show` API.

[components/index.tsx][s-controller] mounts the provider, controller, and viewport.
[context/index.tsx][s-state] stores all sheets in one array.
[BottomSheetViewPort.tsx][s-viewport] mounts each sheet and reverses its stack index.
[BottomSheet.tsx][s-effect] animates position, opacity, and scale from that index.
It also handles backdrop dismissal and downward drags.

Task → Options → a settings row demonstrates nested stacking.
Projects → Show Tasks reaches the same Task content through another path.
Projects → View All adds a text-only sheet.
Calendar uses the same sheet engine with different content.
Complete uses a small sheet, including one timed-dismissal fixture.
These are states and fixtures of one stacked-sheet candidate, not five separate demos.

The component API also supports `full` size and imperative update/dismiss methods.
The committed dashboard supplies no separate selector for those API features.
`@gorhom/bottom-sheet` appears in the manifest, but the mounted implementation is the local component.
The [README](https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/README.md) clone command names a different repo spelling.
This report follows the requested repo and its actual [recursive tree][s-tree].

Count: one Expo-listed candidate, zero extra runnable candidates.
Expo-listed absence at HEAD: none.

## rit3zh/expo-meatball-animation

### Candidate

| Name | Expo-listed or extra | Exact file/folder GitHub link | App entry point / route / selector | Source-based constraints |
| --- | --- | --- | --- | --- |
| Telegram-style avatar dynamic island scroll-collapse | Expo-listed | [app/profile.tsx][b-route] | `expo-router/entry` → `/`. The link opens `/profile`. Scroll the profile to collapse the avatar and reveal the header. The back button returns to `/`. | Expo `~53.0.20`, React Native `0.79.5`, Reanimated `~3.17.4`, and Skia `v2.0.0-next.4`. The avatar uses a remote URL. The island is a drawn 110×28 shape. Scroll values use `MAX_SCROLL_Y = 70`. No real Dynamic Island API appears. |

### Evidence and grouping

[package.json][b-package] declares the router entry and Skia prerelease dependency.
The manifest and [app.json][b-config] call the app `expo-telegram-scroll-animation`.
That name difference does not indicate missing source.
[app/_layout.tsx][b-layout] registers `index` and `profile`.
[app/index.tsx][b-entry] contains only the link to the profile.
It is a link screen, not another demo.

[app/profile.tsx][b-route] connects scroll position to the canvas and header.
[components/canvas/AnimatedCanvas.tsx][b-canvas] combines an avatar, blur, a color matrix, and the island rectangle.
[hooks/useAnimationValues.ts][b-values] derives avatar size, position, blur, tint, and header opacity from scroll position.
[hooks/useAnimatedCanvasStyle.ts][b-style] collapses the canvas container.
[components/header/AnimatedHeader.tsx][b-header] uses the same header-opacity value.
These parts form one continuous scroll-collapse candidate.

### Other source and exclusions

[screens/SettingsScreen.tsx][b-settings] supplies the scrollable settings content and native switches.
Its navigation rows only log a message.
Its account actions show standard alerts.
A toggle also changes `headerScale`, but the returned JSX never applies `headerAnimatedStyle`.
That unused spring does not create another visible animation.
`sectionOpacity` stays at 1.
The settings content is not a separately registered route.

[constants/index.ts][b-constants] contains the remote avatar URL and the drawing dimensions.
The synthetic island does not require hardware with an actual Dynamic Island.
Source inspection does not establish platform compatibility or image availability.
The [README](https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/README.md) clone command uses `metaball`, while the requested repo uses `meatball`.
All links here use paths from the requested repo's complete [recursive tree][b-tree].

Count: one Expo-listed candidate, zero extra runnable candidates.
Expo-listed absence at HEAD: none.

## arunabhverma/expo-paste-input

### Candidate

| Name | Expo-listed or extra | Exact file/folder GitHub link | App entry point / route / selector | Source-based constraints |
| --- | --- | --- | --- | --- |
| Native paste inputs | Expo-listed | [example/App.tsx][p-demo] | App root is `example/`, not the package root. `example/package.json` selects `index`. `example/index.tsx` registers App. Paste images, GIFs, or supported stickers into the message field. Remove attachments through their close buttons. No route selector exists. | Example uses Expo `~54.0.33`, React Native `0.81.5`, Reanimated `^4.2.1`, and keyboard-controller `^1.20.7`. Native code requires a native build, not Expo Go. Clipboard content is necessary. Web paste is a no-op. The send button has no handler. |

### Evidence and grouping

[The root manifest][p-package] describes a native module package, version `0.2.2`.
Its main path is `build/index.js`, not an app entry point.
The complete [recursive tree][p-tree] contains no committed `build/` output.
Local package preparation remains untested.
[expo-module.config.json][p-module] registers Apple and Android modules and declares web support.

[example/package.json][p-example-package] declares the runnable example and links `expo-paste-input` to `../`.
It also sets `nativeModulesDir` to `..`.
[example/index.tsx][p-entry] mounts keyboard, theme, and safe-area providers around App.
[example/app.json][p-config] declares the portrait example and enables the new architecture.

[example/App.tsx][p-demo] mounts one message composer.
Its `onPaste` appends image URIs to one attachments array.
Attachment insertion, removal, toolbar height, and horizontal layout use Reanimated transitions.
The image and GIF cases share that array and UI.
Multiple attachments and keyboard movement are states of the same composer, not separate demos.

[src/TextInputWrapperView.tsx][p-wrapper] loads the native `ExpoPasteInput` view.
[ios/ExpoPasteInputView.swift][p-ios] handles clipboard media and native text-input hooks.
Its adaptive image glyph path requires iOS 18 or later.
[ios/ExpoPasteInput.podspec][p-pod] declares iOS 15.1 as the module minimum.
[The Android implementation][p-android] uses clipboard/content APIs and saves attachment files to cache.
Its receive-content listener requires API 31, with a separate ActionMode path for paste.
[android/build.gradle][p-gradle] defaults to minimum SDK 24.
The [README][p-readme] explicitly excludes Expo Go because the package contains native code.

### Other source and exclusions

| Source | Reachability and reason for exclusion |
| --- | --- |
| [example/App.web.tsx][p-web-demo] and [example/index.web.tsx][p-web-entry] | The web app shows the same composer layout without the native wrapper. Its attachments array starts empty and has no insertion path. It cannot demonstrate pasted attachments at HEAD. |
| [src/TextInputWrapperView.web.tsx][p-web-wrapper] | The web wrapper discards `onPaste` and renders a View. It is a compatibility stub, not another demo. |
| [src/index.ts][p-exports] | `TextInputWrapper` and `TextInputWrapperView` export the same component. They are not two demos. |
| [README.md][p-readme] | SwiftUI TextField support is a package capability claim. The tree contains no second SwiftUI example app or selector. Clipboard format variants do not add candidates. |

Count: one Expo-listed native candidate, zero extra runnable candidates.
Expo-listed absence at HEAD: none in native source.
The attachment-paste behavior is absent from the web example.

## SchroederNathan/linear-tab-bar

### Candidate

| Name | Expo-listed or extra | Exact file/folder GitHub link | App entry point / route / selector | Source-based constraints |
| --- | --- | --- | --- | --- |
| Linear Tab Bar | Expo-listed | [src/components/TabBar/index.tsx][l-effect] | `index.ts` registers `App.tsx`. Tap or drag across the first three tab icons. Tap the fourth icon, or drag upward beyond the menu threshold, to open the menu. Tap Search to open the input. The close control restores the tabs. | Expo `~55.0.8`, React Native `0.83.2`, Reanimated `4.2.1`, Worklets `0.7.2`, and keyboard-controller `1.20.7`. The app uses a dark design. Glass uses BlurView, gradients, and MaskedView. Menu rows have no actions. Search has no results logic. |

### Evidence and grouping

[package.json][l-package] selects `index.ts` and declares the runtime dependencies.
Its native scripts use `expo run:ios` and `expo run:android`.
[app.json][l-config] enables the new architecture and fixes the app design to dark.
[index.ts][l-entry] registers App directly.
[App.tsx][l-app] mounts one TabBar and one PlaceholderScreen inside the gesture, safe-area, and keyboard providers.
There is no router or second app.

[src/components/TabBar/index.tsx][l-effect] owns tab, menu, and search state.
The search and menu toggles prevent simultaneous opening.
[TabBarPill.tsx][l-pill] mounts the icons and menu inside the same morphing surface.
[MenuPanel.tsx][l-menu] supplies staggered menu rows.
[SearchBar.tsx][l-search] supplies the expanding input, close control, and touch glow.
[GlassMaterial.tsx][l-glass] supplies blur, gradients, and the masked border.
These are three states of one tab-bar demonstration, not three candidates.

[constants.ts][l-constants] limits switchable tabs to indices 0 through 2.
The fourth icon opens the menu instead of selecting a Settings page.
[PlaceholderScreen.tsx][l-placeholder] contains Projects, Discover, Favorites, and Settings labels only.
Its Settings label does not establish a fourth reachable content demo.
The menu rows are Views, not buttons that open further demos.
Search accepts text but does not query or filter content.

The [README](https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/README.md) contains an Expo Go badge, but the app imports native keyboard-controller code.
No runtime test resolved that compatibility question.
The complete [recursive tree][l-tree] contains no other screens, routes, or example apps.
Neither X-linked Expo demo falls within this repo inspection.

Count: one Expo-listed candidate, zero extra runnable candidates.
Expo-listed absence at HEAD: none.

## Execution limits

These counts describe source groups, not successful builds or publish decisions.
A later build can expose missing dependencies or platform constraints.
This report makes no claim about runtime appearance or current remote image availability.
This report does not infer source links for either X-only Expo demo.

## Pinned source links

### Curved tabs

[c-tree]: https://api.github.com/repos/rit3zh/expo-curved-bottom-tabs/git/trees/62654b86b27601af2a67506b5b5df179ca508f36?recursive=1
[c-package]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/package.json
[c-config]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/app.json
[c-routes]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/app/_layout.tsx
[c-tab-constants]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/constants/tab-bar.ts
[c-bar]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/tab-bar.tsx
[c-effect]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/curved-tabs.tsx
[c-animation]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/hooks/use-pill-animation.ts
[c-gesture]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/hooks/use-pill-gesture.ts
[c-surface]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/tab-bar-surface.tsx
[c-fonts]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/constants/fonts.ts
[c-home]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/app/index/index.tsx
[c-gallery]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/gallery-screen.tsx
[c-apps]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/app/apps/index.tsx
[c-search]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/app/search/index.tsx
[c-library]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/app/library/index.tsx
[c-profile]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/app/profile/index.tsx
[c-segmented]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/native-segmented.tsx
[c-menu]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/native-menu-list.tsx
[c-footer]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/gallery-footer.tsx
[c-collection]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/collection-section.tsx
[c-grid]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/photo-grid.tsx
[c-unused-glass]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/glass-view.tsx
[c-unused-screen]: https://github.com/rit3zh/expo-curved-bottom-tabs/blob/62654b86b27601af2a67506b5b5df179ca508f36/src/components/demo-screen.tsx

### Motion tabs

[m-tree]: https://api.github.com/repos/rit3zh/expo-motion-tabs/git/trees/9a95ea9fa9839c6627bf15860797a208663369b4?recursive=1
[m-package]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/package.json
[m-config]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/app.json
[m-entry]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/app/index.tsx
[m-routes]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/app/%28tabs%29/_layout.tsx
[m-export]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/components/animated-tab-bar.tsx
[m-effect]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/animated-tab-bar.tsx
[m-transition]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/hooks/use-view-transition.ts
[m-morph]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/hooks/use-card-morph.ts
[m-tab-motion]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/hooks/use-morph-tab-motion.ts
[m-panel-motion]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/hooks/use-panel-motion.ts
[m-popup-selector]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/examples/example-popup-body.tsx
[m-home-popup]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/examples/home-popup-body.tsx
[m-search-popup]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/examples/search-popup-body.tsx
[m-profile-popup]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/examples/profile-popup-body.tsx
[m-accordion]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/reacticx-components/accordion/index.tsx
[m-fallback]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/components/popup-body.tsx
[m-popup-hook]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/motion-tabs/hooks/use-popup-renderer.tsx
[m-home]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/app/%28tabs%29/home/index.tsx
[m-search]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/app/%28tabs%29/search/index.tsx
[m-profile]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/app/%28tabs%29/profile/index.tsx
[m-podcasts]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/components/podcast-horizontal-list.tsx
[m-progress]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/components/progress-indicator+background-pill.tsx
[m-fonts]: https://github.com/rit3zh/expo-motion-tabs/blob/9a95ea9fa9839c6627bf15860797a208663369b4/src/hooks/useSfProFont.ts

### Stacked sheets

[s-tree]: https://api.github.com/repos/rit3zh/expo-stack-bottom-sheet/git/trees/9e2cc750f809ae5bd7eba986ed529adae3e4a581?recursive=1
[s-package]: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/package.json
[s-config]: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/app.json
[s-layout]: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/app/_layout.tsx
[s-route]: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/app/index.tsx
[s-controller]: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/components/index.tsx
[s-state]: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/context/index.tsx
[s-viewport]: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/components/BottomSheetViewPort.tsx
[s-effect]: https://github.com/rit3zh/expo-stack-bottom-sheet/blob/9e2cc750f809ae5bd7eba986ed529adae3e4a581/components/BottomSheet.tsx

### Avatar collapse

[b-tree]: https://api.github.com/repos/rit3zh/expo-meatball-animation/git/trees/11fefeb91964d548081bf24d49a5c3d6e205cbac?recursive=1
[b-package]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/package.json
[b-config]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/app.json
[b-layout]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/app/_layout.tsx
[b-entry]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/app/index.tsx
[b-route]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/app/profile.tsx
[b-canvas]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/components/canvas/AnimatedCanvas.tsx
[b-values]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/hooks/useAnimationValues.ts
[b-style]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/hooks/useAnimatedCanvasStyle.ts
[b-header]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/components/header/AnimatedHeader.tsx
[b-settings]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/screens/SettingsScreen.tsx
[b-constants]: https://github.com/rit3zh/expo-meatball-animation/blob/11fefeb91964d548081bf24d49a5c3d6e205cbac/constants/index.ts

### Paste input

[p-tree]: https://api.github.com/repos/arunabhverma/expo-paste-input/git/trees/1f3e3b34ea99250c68e483c71f1217307874f12a?recursive=1
[p-package]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/package.json
[p-module]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/expo-module.config.json
[p-example-package]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/example/package.json
[p-config]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/example/app.json
[p-entry]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/example/index.tsx
[p-demo]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/example/App.tsx
[p-wrapper]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/src/TextInputWrapperView.tsx
[p-ios]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/ios/ExpoPasteInputView.swift
[p-pod]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/ios/ExpoPasteInput.podspec
[p-android]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/android/src/main/java/expo/modules/pasteinput/ExpoPasteInputView.kt
[p-gradle]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/android/build.gradle
[p-readme]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/README.md
[p-web-demo]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/example/App.web.tsx
[p-web-entry]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/example/index.web.tsx
[p-web-wrapper]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/src/TextInputWrapperView.web.tsx
[p-exports]: https://github.com/arunabhverma/expo-paste-input/blob/1f3e3b34ea99250c68e483c71f1217307874f12a/src/index.ts

### Linear tabs

[l-tree]: https://api.github.com/repos/SchroederNathan/linear-tab-bar/git/trees/829f2778ee8a10b1076951edf5c2d7c7796de41a?recursive=1
[l-package]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/package.json
[l-config]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/app.json
[l-entry]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/index.ts
[l-app]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/App.tsx
[l-effect]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/TabBar/index.tsx
[l-pill]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/TabBar/TabBarPill.tsx
[l-menu]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/TabBar/MenuPanel.tsx
[l-search]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/TabBar/SearchBar.tsx
[l-glass]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/TabBar/GlassMaterial.tsx
[l-constants]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/TabBar/constants.ts
[l-placeholder]: https://github.com/SchroederNathan/linear-tab-bar/blob/829f2778ee8a10b1076951edf5c2d7c7796de41a/src/components/Screens/PlaceholderScreen.tsx
