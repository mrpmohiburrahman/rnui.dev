# Motion Lab and Enzo repository expansion

## Scope and method

This report covers only `hewad-mubariz/react-native-motion-lab` and `enzomanuelmangano/demos`.
The inspection date is 2026-10-22 UTC.
The inspection timestamp is 2026-10-22T07:58:10Z.
All GitHub requests used `gh api`.
All source links below use the inspected commit SHA.

The inspection covered recursive trees, package manifests, app routes, demo registries, screen sources, and relevant helpers.
Every candidate path exists in its recursive tree at the inspected SHA.
The inspection also read every registered entry module.
Thin entry modules required further source inspection.

A candidate means a distinct demo that the app exposes through a route or registry.
It does not mean a tested executable.
No dependency installation, build, app execution, or video capture occurred.
This report makes no buildability claims.
No Expo media downloads occurred.
No catalogue duplicate checks occurred.
The parent agent owns the planning ticket and map.

Expo labels come from [the existing inventory](expo-inventory.md), rows 3 to 5 and 9 to 11.
The report does not recheck the Expo website.
"Extra" means absent from those six inventory rows, not absent from the catalogue.

## Reproducibility and counts

| Repository | Default branch | Inspected HEAD SHA | Commit date, UTC | Recursive tree | Candidates | Expo-listed | Extra |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hewad-mubariz/react-native-motion-lab | `main` | `ba9b8e4872dfef26c2b34902f966e9c3e4511a00` | 2026-07-28T09:31:37Z | 162 entries. `truncated: false`. | 8 | 3 | 5 |
| enzomanuelmangano/demos | `main` | `884c9f8f969fd3fd24319da9ffcd9e54c0735445` | 2026-10-22T02:39:31Z | 2,055 entries. `truncated: false`. | 124 | 3 | 121 |

The repository metadata supplied each default branch.
The commit endpoints supplied each HEAD SHA and commit date.
The following API paths reproduce the source snapshots:

- `repos/hewad-mubariz/react-native-motion-lab/commits/ba9b8e4872dfef26c2b34902f966e9c3e4511a00`
- `repos/hewad-mubariz/react-native-motion-lab/git/trees/ba9b8e4872dfef26c2b34902f966e9c3e4511a00?recursive=1`
- `repos/enzomanuelmangano/demos/commits/884c9f8f969fd3fd24319da9ffcd9e54c0735445`
- `repos/enzomanuelmangano/demos/git/trees/884c9f8f969fd3fd24319da9ffcd9e54c0735445?recursive=1`.

Both tree responses report `truncated: false`.
The counts cover the complete trees at these SHAs, not repository history or other branches.

## Motion Lab

### Entry points and shared constraints

The [package manifest][m-package] sets `main` to `expo-router/entry`.
It declares Expo `~55.0.23`, React Native `0.83.6`, Reanimated `4.4.0`, and `react-native-wgpu` `^0.5.11`.
It also declares Skia `2.6.4`, Gesture Handler, Expo Sensors, and `@expo/ui`.
The [app configuration][m-config] specifies portrait orientation.
The manifest declares dependencies, not runtime support.

The [root route][m-root] opens `HubScreen`.
The [hub][m-hub] has eight scene buttons.
The [stack layout][m-layout] registers the same eight demo routes and the hub route.
The recursive tree contains no other demo route files.
The hub itself is a selector, not a ninth candidate.

The shared [WebGPU hook][m-webgpu] requests a native WebGPU canvas context and device.
It calls `navigator.gpu.getPreferredCanvasFormat()` and `context.present()`.
The applicable rows below require that native GPU path.
The Card flip row uses a different renderer.

### Candidates

| Name | Expo-listed or extra | Exact GitHub file/folder link | App entry point / route / selection | Source-based constraints |
| --- | --- | --- | --- | --- |
| WebGPU 3D model product viewer / Furniture showcase | Expo-listed | [FurnitureShowcaseScreen.tsx](https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/FurnitureShowcaseScreen.tsx) | `src/app/furniture-showcase.tsx` → `/furniture-showcase`. Select Furniture showcase. Drag, pinch, or change products. | Uses native WebGPU and bundled GLB models. Five products share one viewer. The [product list][m-products] gives the exact model paths. |
| WebGPU bank card shimmer / Card flip | Expo-listed | [CardFlipScreen/](https://github.com/hewad-mubariz/react-native-motion-lab/tree/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/CardFlipScreen) | `src/app/card-flip.tsx` → `/card-flip`. Select Card flip. Tap to flip or drag to inspect. | The current [face shader][m-card-shader] uses Skia, not `react-native-wgpu`. DeviceMotion controls light. The source includes the number font. |
| WebGPU bird flock murmuration | Expo-listed | [BirdsScreen.tsx](https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/BirdsScreen.tsx) | `src/app/birds.tsx` → `/birds`. Select Murmuration. Tap to disturb. Use the toolbar for formations. | Uses native WebGPU. Heart, star, moon, text, and sky presets are variants. The [toolbar][m-toolbar] gates its glass appearance on iOS API availability. |
| Art gallery corridor | Extra | [GalleryScreen.tsx](https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/GalleryScreen.tsx) | `src/app/gallery.tsx` → `/gallery`. Select Art gallery. Hold to walk, drag to rotate, or tap a painting. | Uses native WebGPU. The [gallery hook][m-gallery-hook] loads artworks through the [Art Institute service][m-artic]. Artwork metadata and images require network access. |
| Salon / cinema seat selection | Extra | [SalonSelectionScreen.tsx](https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/SalonSelectionScreen.tsx) | `src/app/salon-selection.tsx` → `/salon-selection`. Select Salon selection. Pan, pinch, select seats, or book the selection. | Uses native WebGPU and direct `@expo/ui/swift-ui` text imports. The [hook][m-salon-hook] generates seats and changes local reservation state. |
| Football stadium seat selection | Extra | [StadiumSelectionScreen.tsx](https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/StadiumSelectionScreen.tsx) | `src/app/stadium-selection.tsx` → `/stadium-selection`. Select Football stadium. Pan, pinch, select seats, or clear the selection. | Uses native WebGPU. Its [NativeAnimatedText][m-native-text] imports SwiftUI directly. The [hook][m-stadium-hook] generates local seat data. No cross-platform fallback appears there. |
| Pixel explosion / Tiger reform | Extra | [PixelExplosionScreen.tsx](https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/PixelExplosionScreen.tsx) | `src/app/pixel-explosion.tsx` → `/pixel-explosion`. Select Pixel explosion. Use the slider, double tap, or hold. | Uses native WebGPU through [useTigerParticlesScene][m-tiger-hook]. It loads bundled `assets/images/tiger.png`. Explosion, shatter, rain, and reform share one screen. |
| Bar chart / Voxel city morph | Extra | [BarChartScreen.tsx](https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/charts/BarChartScreen.tsx) | `src/app/bar-chart.tsx` → `/bar-chart`. Select Bar chart. Toggle city or night, change metrics, or select a building. | Uses native WebGPU. The [constants][m-chart-data] contain six categories and three metrics. The detail overlay belongs to the same chart. |

### Variants and exclusions

The five furniture products are content variants, not five separate demos.
The same screen handles model selection and camera gestures.
The [product list][m-products] contains the table, desk, two chairs, and sofa.

The bird formations and sky presets share `BirdsScreen` and one scene controller.
The [formation source][m-formations] dispatches heart, star, moon, and text targets.
The toolbar and its text editor are controls for that demo.

The card front and back share `CardFlipScreen`.
`FrontContent`, `BackContent`, `ChipView`, and `FaceShader` are parts of the card, not independent demos.
The pixel controls also change one shared scene.
The chart metrics, night mode, city mode, and building details remain one candidate.

`src/scenes/pixel-explosion/scene.ts` and `usePixelExplosionScene.ts` contain another implementation path.
The [scene exports][m-pixel-exports] expose both implementations.
The active screen imports `useTigerParticlesScene`, not `usePixelExplosionScene`.
No separate route exposes the older implementation, so it adds no candidate.

The scene folders, hooks, geometry tests, text components, asset loaders, and theme files support these eight screens.
They have no additional app entry points.
Salon and stadium remain separate candidates because each has its own route, screen, and scene controller.

### Expo match and caveats

All three Expo-listed demos have source matches.
The model viewer maps to Furniture showcase.
The bank card maps to Card flip.
The bird flock maps to Murmuration.
No Expo-listed demo is missing from this snapshot.

The bank card's Expo label says WebGPU, but its current shader source imports Skia.
The report preserves the inventory label without asserting that the implementation still uses WebGPU.
The tree contains no license file.
That absence does not establish permission to reuse code or publish a capture.

## Enzo demos

### Entry points and shared constraints

The [package manifest][e-package] sets `main` to `expo-router/entry`.
It declares Expo `~57.0.26`, React Native `0.86.3`, Reanimated `4.5.1`, and `react-native-webgpu` `0.10.4`.
It declares `react-native-skia` `3.0.1` and a local compatibility package for the old Skia name.
The [compatibility manifest][e-skia-shim] points the old name to Skia 3.
The package also declares native modules and dependency patches.
These declarations do not prove that a build succeeds.

The [app configuration][e-config] specifies portrait orientation and disables iPad support.
It configures native Nitro integration and experimental React Native release levels.
It also configures Android packaging for the shared Dawn library.
The [README][e-readme] describes a native prebuild workflow.
This session did not execute it.
The package's `dev` script references `scripts/start-with-animation.js`, which the inspected tree does not contain.
Do not treat that script as a verified selection path.

The [registry][e-registry] contains 124 distinct component keys and 124 metadata entries.
Every registry import resolves to an entry module in the inspected tree.
The component keys, not metadata `route` strings, form the URL slugs.
Three important aliases are `shared-transitions` → `shared-transition/`, `qr-code-generator` → `qrcode/`, and `empty-qr-code` → `empty-qrcode/`.
`scroll-transition-3d` resolves to `3d-scroll-transition/`.

The [home list][e-home-list] derives its candidates from `getAllAnimations()`.
The [home route][e-home] opens the selected demo through the [launch route][e-launch].
The [dynamic route][e-route] also accepts `/animations/<slug>`.
Both routes use [DemoScreen][e-demo-screen] to resolve the component through the registry.
The table gives that exact URL slug for every candidate.
The URLs describe source wiring, not tested navigation.

Four registry entries have `alert: true`: Shared Transitions, Grid Visualizer, Time Machine, and iOS Home Bouncy.
The [filter state][e-filter] defaults Show Unstable to false.
The home list therefore contains 120 entries by default and 124 when that setting is true.
The [General tray][e-general] exposes that setting.
The dynamic route does not apply the home-list filter.

### Candidates

Each source link below identifies the exact implementation folder at the inspected SHA.
The registry and route sources above establish the entry mapping for every row.
The final column records source constraints or sample behavior, not runtime verification.

| Name | Expo-listed or extra | Exact GitHub file/folder link | App entry point / route / selection | Source-based constraints |
| --- | --- | --- | --- | --- |
| Mobile Input | Extra | [mobile-input/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/mobile-input) | `/animations/mobile-input`. Use the numeric keypad. | The entry renders LockScreen. The face, PIN dots, and error motion form one local input demo. |
| Swipe Cards | Extra | [swipe-cards/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/swipe-cards) | `/animations/swipe-cards`. Swipe, use action buttons, or reset. | Uses Reanimated and bundled card images. No remote card feed appears in the entry. |
| Spiral | Extra | [spiral/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/spiral) | `/animations/spiral`. Tap the full-screen press target. | Uses Skia paths and a local spring array. The spiral configurations share one component. |
| Scroll Progress | Extra | [scroll-progress/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/scroll-progress) | `/animations/scroll-progress`. Scroll the sections. | SectionContentList receives local section data. The bottom progress control belongs to the list. |
| Animated Grid List | Extra | [animated-grid-list/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/animated-grid-list) | `/animations/animated-grid-list`. Toggle grid or list. | Uses Reanimated layout changes. The [sample constants][e-grid-data] reference remote Picsum images. |
| Floating Bottom Bar | Extra | [floating-bottom-bar/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/floating-bottom-bar) | `/animations/floating-bottom-bar`. Select bottom tabs. | Uses an independent React Navigation tree. Tab screens are placeholder Views, not separate demos. |
| Animated Clip Box | Extra | [animated-clip-box/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/animated-clip-box) | `/animations/animated-clip-box`. Press either card. | Two ClipBoxButton instances differ in color and text. They are variants of one clipping interaction. |
| Theme Canvas Animation | Extra | [theme-canvas-animation/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/theme-canvas-animation) | `/animations/theme-canvas-animation`. Select a color square. | Uses Skia, a bundled font, and `react-native-skia-gesture`. The circular theme reveal shares one canvas. |
| Add to Cart | Extra | [add-to-cart/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/add-to-cart) | `/animations/add-to-cart`. Select a product, then press the cart action. | Uses a measured layout, backdrop, and sheet. Product state is local. The entry references a remote Unsplash image. |
| BottomBarSkia | Extra | [bottom-bar-skia/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/bottom-bar-skia) | `/animations/bottom-bar-skia`. Select a bottom tab. | Uses a custom Skia tab bar within an independent navigator. The destination screen is a placeholder. |
| Cuberto Slider | Extra | [cuberto-slider/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/cuberto-slider) | `/animations/cuberto-slider`. Drag the slider. | The entry supplies a GestureHandlerRootView and one Slider component. |
| Metaball | Extra | [metaball/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/metaball) | `/animations/metaball`. Drag the circles. | Uses Skia blur, a color matrix, and `react-native-skia-gesture`. Both circles belong to one effect. |
| Shared Transitions | Extra | [shared-transition/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/shared-transition) | `/animations/shared-transitions`. Enable Show Unstable or use the direct route. Select an image. | Registry alert. The [home source][e-shared-home] and [detail source][e-shared-detail] comment out `sharedTransitionTag`. Do not promise a shared-element effect. |
| Story List | Extra | [story-list/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/story-list) | `/animations/story-list`. Scroll the stories. | Uses a local image set and a shared StoryList renderer. Repeated images are content variants. |
| Dynamic Tab Indicator | Extra | [dynamic-tab-indicator/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/dynamic-tab-indicator) | `/animations/dynamic-tab-indicator`. Select an indicator tab. | The entry supplies local data to DynamicTabIndicator. It is not an app-level route collection. |
| Blur Circles | Extra | [blur-circles/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/blur-circles) | `/animations/blur-circles`. Open the demo. | Uses a shared animation clock, clipped Skia circles, gradients, and blur. |
| Smooth Dropdown | Extra | [smooth-dropdown/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/smooth-dropdown) | `/animations/smooth-dropdown`. Open the menu and select an option. | Uses local Dropdown options and Expo icons. Options are states of one menu. |
| Skia BottomSheet | Extra | [skia-bottom-sheet/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/skia-bottom-sheet) | `/animations/skia-bottom-sheet`. Interact with the sheet. | Uses `react-native-skia-gesture` and a remote Picsum background. The sheet receives that image as its backdrop. |
| Floating Modal | Extra | [floating-modal/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/floating-modal) | `/animations/floating-modal`. Open or close the floating control. | FloatingModal owns its backdrop and content. Its nested Modal component is not another candidate. |
| AudioPlayer | Extra | [audio-player/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/audio-player) | `/animations/audio-player`. Drag the waveform. | The entry supplies static waveform samples to WaveformScrubber. This source establishes a scrubber, not actual audio playback. |
| Color Carousel | Extra | [color-carousel/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/color-carousel) | `/animations/color-carousel`. Scroll the carousel. | Uses local color data and a Skia radial background. No image feed is necessary for this entry. |
| Animated 3D Parallax | Extra | [animated-3d-parallax/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/animated-3d-parallax) | `/animations/animated-3d-parallax`. Drag across the card. | Uses touch coordinates, Reanimated transforms, and a bundled logo. The 3D effect does not require WebGPU. |
| Fluid Slider | Extra | [fluid-slider/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/fluid-slider) | `/animations/fluid-slider`. Drag the fluid control. | The entry sets the width from window dimensions and renders one FluidSlider. |
| Animated Indicator List | Extra | [animated-indicator-list/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/animated-indicator-list) | `/animations/animated-indicator-list`. Scroll or select a section header. | Uses measured header layouts and a shared scroll offset. Headers and list sections are one interaction. |
| Radar Chart | Extra | [radar-chart/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/radar-chart) | `/animations/radar-chart`. Press Shuffle. | Uses Skia, a bundled Outfit font, and random local chart data. |
| Image Cropper | Extra | [image-cropper/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/image-cropper) | `/animations/image-cropper`. Adjust the crop, then press Crop. | Loads a remote Unsplash image through Skia. The crop-result modal is part of the same demo. |
| Selectable Grid List | Extra | [selectable-grid-list/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/selectable-grid-list) | `/animations/selectable-grid-list`. Tap cells, drag across a range, or reset. | Uses 50 local cells in four columns. Gesture Handler and Reanimated control selection, automatic scroll, and the selected count. |
| Animated Count Text | Extra | [animated-count-text/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/animated-count-text) | `/animations/animated-count-text`. Press the shuffle button. | Changes a random local number through AnimatedCount. Number values are not independent demos. |
| QR Code Generator | Extra | [qrcode/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/qrcode) | `/animations/qr-code-generator`. Edit the text or deviation slider. | Uses `react-native-qrcode-skia` and Skia path effects. This is separate from the tree, avatar, and empty-QR demos. |
| Popup Handler | Extra | [popup-handler/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/popup-handler) | `/animations/popup-handler`. Move the trigger and select a popup direction. | Uses a BlurredPopupProvider and a remote Unsplash background. Four directions are variants of one popup. |
| Twitter Tab Bar | Extra | [twitter-tab-bar/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/twitter-tab-bar) | `/animations/twitter-tab-bar`. Select a bottom tab. | Uses local theme and active-tab providers. Several destination screens are placeholder Views. |
| Circular Carousel | Extra | [circular-carousel/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/circular-carousel) | `/animations/circular-carousel`. Scroll and toggle Scale. | Loads remote Unsplash images. Scale on and off are variants of the same circular list. |
| Split Button | Extra | [split-button/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/split-button) | `/animations/split-button`. Interact with the two-part button. | Uses local Apple and Google icon content. The entry does not establish a real authentication flow. |
| Telegram Theme Switch | Extra | [telegram-theme-switch/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/telegram-theme-switch) | `/animations/telegram-theme-switch`. Use the theme control and bottom tabs. | Uses theme and switch providers. Home and Search belong to the same theme-transition demo. |
| Fourier Visualizer | Extra | [fourier-visualizer/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/fourier-visualizer) | `/animations/fourier-visualizer`. Draw a path, then clear it. | Uses Gesture Handler, Skia paths, and a local Fourier visualizer. The package declares `fft.js`. |
| GitHub Onboarding | Extra | [github-onboarding/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/github-onboarding) | `/animations/github-onboarding`. Move through onboarding pages. | Supplies four bundled images to ColorfulOnboarding. Pages are content states, not separate demos. |
| Loading Button | Extra | [loading-button/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/loading-button) | `/animations/loading-button`. Press the button. | Uses a simulated mutation and local timers. Idle, loading, success, and error are variants. |
| Scrollable Bottom Sheet | Extra | [scrollable-bottom-sheet/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/scrollable-bottom-sheet) | `/animations/scrollable-bottom-sheet`. Open the sheet and move through its pages. | Three BottomSheetPage instances share one sheet controller. They are not independent routes. |
| Skia Color Picker | Extra | [skia-color-picker/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/skia-color-picker) | `/animations/skia-color-picker`. Drag the picker. | Uses a Skia shader, hue and saturation helpers, and Gesture Handler. |
| Blurred Scroll | Extra | [blurred-scroll/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/blurred-scroll) | `/animations/blurred-scroll`. Scroll the list. | A shared content offset drives BlurredItem. Individual list items are helper components. |
| AirBnb Slider | Extra | [airbnb-slider/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/airbnb-slider) | `/animations/airbnb-slider`. Drag the price slider. | AnimatedSlider and AnimatedCount share one price value. The entry has no booking backend. |
| Steddy Graph Interaction | Extra | [steddy-graph-interaction/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/steddy-graph-interaction) | `/animations/steddy-graph-interaction`. Change the segmented selection. | Uses local scoring maps. Difficulty selections change the same graph. |
| Action Tray | Extra | [action-tray/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/action-tray) | `/animations/action-tray`. Open the tray and continue through its steps. | Three local steps change the tray height and content. They are one interaction flow. |
| Toast | Extra | [toast/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/toast) | `/animations/toast`. Press Toast. | A ToastProvider cycles local toast content. Toast labels and icons are variants. |
| Slide to Reveal | Extra | [slide-to-reveal/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/slide-to-reveal) | `/animations/slide-to-reveal`. Drag over the hidden code. | Uses Skia masks and a bundled font. The entry supplies the fixed sample code `112358`. |
| Blurred Bottom Bar | Extra | [blurred-bottom-bar/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/blurred-bottom-bar) | `/animations/blurred-bottom-bar`. Select the bottom tabs. | Uses an independent navigator and bundled background images. The four screens demonstrate one tab bar. |
| Fractal Glass | Extra | [fractal-glass/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/fractal-glass) | `/animations/fractal-glass`. Drag the circle or change the theme. | Uses Skia clipping, masks, and blur. Light and dark are variants of one effect. |
| Drag to Sort | Extra | [drag-to-sort/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/drag-to-sort) | `/animations/drag-to-sort`. Drag the list items. | Uses local ITEMS and shared item positions. SortableList and ListItem are parts of the same demo. |
| Fibonacci Shader | Extra | [fibonacci-shader/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/fibonacci-shader) | `/animations/fibonacci-shader`. Use the slider and parameter button. | Uses a Skia runtime effect and animated uniforms. This entry differs from the grid-control demo below. |
| Family Number Input | Extra | [family-number-input/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/family-number-input) | `/animations/family-number-input`. Use the numeric keypad. | NumberInput owns local numeric state. AnimatedNumber and ButtonsGrid are helper components. |
| Balance Slider | Extra | [balance-slider/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/balance-slider) | `/animations/balance-slider`. Drag the balance control. | The component reports left and right percentages. The entry adds no external data service. |
| Fibonacci Shader Grid | Extra | [fibonacci-shader-grid/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/fibonacci-shader-grid) | `/animations/fibonacci-shader-grid`. Drag across the two-axis control panel. | Uses a Skia effect with two controlled parameters. It has its own registry key and entry screen. |
| Verification Code | Extra | [verification-code/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/verification-code) | `/animations/verification-code`. Type the five-digit code. | The entry fixes `correctCode` to `11111`. This is local validation, not an authentication service. |
| Email Demo | Extra | [email-demo/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/email-demo) | `/animations/email-demo`. Delete or restore list items. | Uses local INITIAL_ITEMS and a shake animation. The source does not send email. |
| 3D Scroll Transition | Extra | [3d-scroll-transition/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/3d-scroll-transition) | `/animations/scroll-transition-3d`. Scroll the list. | Uses Reanimated, Skia, and a bundled font. The folder name differs from the URL slug. |
| Staggered Card Number | Extra | [staggered-card-number/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/staggered-card-number) | `/animations/staggered-card-number`. Open the card-number demo. | CardInfo receives a fixed sample number. This is not a payment integration. |
| Stacked Bottom Sheet | Extra | [stacked-bottom-sheet/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/stacked-bottom-sheet) | `/animations/stacked-bottom-sheet`. Press Show stacked tray. | Uses a StackedSheetProvider. Nested sheet screens belong to the same stack demonstration. |
| GL Transitions | Extra | [gl-transitions/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/gl-transitions) | `/animations/gl-transitions`. Navigate between Home and AddNote. | DirectionalWarp is active. CrossZoom, LinearBlur, and Hexagonalize require a source selection change. They are variants, not separate routes. |
| Prequel Slider | Extra | [prequel-slider/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/prequel-slider) | `/animations/prequel-slider`. Drag the image-effect slider. | Uses a remote Unsplash image, Skia, and ButterflyWaveScrawlerGL. Slider and circular progress share one effect. |
| Empty QR Code | Extra | [empty-qrcode/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/empty-qrcode) | `/animations/empty-qr-code`. Tap the QR presentation. | QRCodeShare receives a fixed URL payload. Its reveal states remain one demo. |
| Infinite Carousel | Extra | [infinite-carousel/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/infinite-carousel) | `/animations/infinite-carousel`. Scroll or select a card. | Uses local ThemeData and an animated background gradient. Cards share one infinite circular controller. |
| Twodos Slide | Extra | [twodos-slide/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/twodos-slide) | `/animations/twodos-slide`. Use Slide to Unlock. | FrictionSlider drives AnimatedSquares through shared progress. The entry has no actual device-unlock operation. |
| Wheel Picker | Extra | [wheel-picker/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/wheel-picker) | `/animations/wheel-picker`. Drag the wheel and toggle expansion. | Uses shared progress, an animated count, and haptics. Expanded and collapsed states share one picker. |
| Stacked List | Extra | [stacked-list/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/stacked-list) | `/animations/stacked-list`. Scroll the stacked rows. | A shared scroll offset drives row transforms and visibility. Rows are not separate candidates. |
| Geometry Button | Extra | [geometry-button/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/geometry-button) | `/animations/geometry-button`. Press the geometry control. | The entry renders one GeometryButtonComponent. Its callback is sample behavior. |
| Record Button | Extra | [record-button/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/record-button) | `/animations/record-button`. Use the button or paged list. | Shared scroll progress drives the button transition. The source does not establish camera recording. |
| Grid Visualizer | Extra | [grid-visualizer/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/grid-visualizer) | `/animations/grid-visualizer`. Enable Show Unstable or use the direct route. Tap the grid. | Registry alert. Uses Skia and a bundled font. Text changes drive the grid effect. |
| iMessageStack | Extra | [imessage-stack/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/imessage-stack) | `/animations/imessage-stack`. Scroll the card stack. | A shared list offset drives Card components. The cards use local sample data. |
| Atlas Button | Extra | [atlas-button/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/atlas-button) | `/animations/atlas-button`. Press the atlas button. | Uses Skia Atlas, Float32Array color data, and a bundled SVG logo. |
| Atlas Sphere | Extra | [atlas-sphere/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/atlas-sphere) | `/animations/atlas-sphere`. Drag across the field. | Uses a Skia Atlas texture and touch-dependent sprite transforms. No WebGPU canvas appears in this component. |
| Checkbox Interactions | Extra | [checkbox-interactions/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/checkbox-interactions) | `/animations/checkbox-interactions`. Select cuisine checkboxes. | A local cuisine hook supplies selection state. Each checkbox is one instance of the same interaction. |
| Interaction Appearance | Extra | [interaction-appearance/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/interaction-appearance) | `/animations/interaction-appearance`. Use the appearance control on the movie screen. | Renders one MovieDetail through a ThemeProvider. The supplied poster URL is remote. |
| Dot Sheet | Extra | [dot-sheet/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/dot-sheet) | `/animations/dot-sheet`. Press the primary button. | CardInput owns the sheet interaction. The surrounding screen and input are one demo. |
| Coverflow Carousel | Extra | [coverflow-carousel/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/coverflow-carousel) | `/animations/coverflow-carousel`. Scroll the coverflow. | The [image constants][e-coverflow-data] contain remote Unsplash URLs. CoverFlowCarousel owns all cards. |
| Paper Folding | Extra | [paper-folding/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/paper-folding) | `/animations/paper-folding`. Press the paper control. | A shared spring controls the fold. The haptic helper returns early on Android. |
| Miles Bar Chart | Extra | [miles-bar-chart/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/miles-bar-chart) | `/animations/miles-bar-chart`. Scroll between week labels. | Uses local weekly data and a shared scroll index. Weeks are variants of one chart. |
| Steps | Extra | [steps/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/steps) | `/animations/steps`. Use forward or back controls. | Three local steps share Dots and StepButtons. They are not three independent screens. |
| Pomodoro Timer | Extra | [pomodoro-timer/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/pomodoro-timer) | `/animations/pomodoro-timer`. Drag the circular control and use its toggle. | Uses a circular slider, animated count, and haptics. The wrapper supplies Gesture Handler context. |
| Exclusion Tabs | Extra | [exclusion-tabs/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/exclusion-tabs) | `/animations/exclusion-tabs`. Select a tab. | A local activeTabIndex drives one ExclusionTabs component. |
| Clerk Toast | Extra | [clerk-toast/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/clerk-toast) | `/animations/clerk-toast`. Press the sample toast controls. | Uses a StackedToastProvider and local demo content. Individual toast screens are not app routes. |
| Duration Slider | Extra | [duration-slider/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/duration-slider) | `/animations/duration-slider`. Drag the circular slider. | Uses Skia font loading and haptics. The entry waits for its bundled font. |
| Alert Drawer | Extra | [alert-drawer/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/alert-drawer) | `/animations/alert-drawer`. Interact with the drawer control. | The entry supplies one AlertDrawer component with sample properties. |
| Motion Blur | Extra | [motion-blur/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/motion-blur) | `/animations/motion-blur`. Press the add button. | The initial list is empty. New random items feed BlurredList. |
| Delete Button | Extra | [delete-button/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/delete-button) | `/animations/delete-button`. Interact with the delete control. | The entry supplies one local DeleteButton. The sample does not establish deletion from a service. |
| Dynamic Blur Tabs | Extra | [dynamic-blur-tabs/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/dynamic-blur-tabs) | `/animations/dynamic-blur-tabs`. Select tabs and scroll their content. | Uses an independent navigator and ScrollableGradients screens. The shared bar remains one candidate. |
| Snake | Extra | [snake/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/snake) | `/animations/snake`. Play the board and restart after game over. | Uses a local SnakeBoard, score state, and haptics. No network game appears in the entry. |
| Expandable Mini Player | Extra | [expandable-mini-player/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/expandable-mini-player) | `/animations/expandable-mini-player`. Expand the player above the tabs. | The entry reexports its independent Navigation component. Placeholder tab screens and the expanded sheet belong to one player demo. |
| Bezier Curve Outline | Extra | [bezier-curve-outline/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/bezier-curve-outline) | `/animations/bezier-curve-outline`. Use the square and outline controls. | Uses a Skia path, an animated square, and an animated blur view. Outline mode is a variant. |
| Tab Navigation | Extra | [tab-navigation/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/tab-navigation) | `/animations/tab-navigation`. Select a tab. | TABS_DATA and activeTabIndex feed a local Tabs component. This differs from the app launcher. |
| MNIST | Extra | [mnist/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/mnist) | `/animations/mnist`. Draw a digit or clear the grid. | Uses bundled model weights and a local neural network. No remote inference endpoint appears in the screen. |
| Stacked Modals | Extra | [stacked-modals/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/stacked-modals) | `/animations/stacked-modals`. Press the plus button. | Uses a StackedModalProvider and demo hook. The modal stack is one candidate. |
| Linear Sensors | Extra | [linear-sensors/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/linear-sensors) | `/animations/linear-sensors`. Change device orientation. | Reads Reanimated rotation and gravity sensors. The Skia light and shadow depend on those values. |
| Verification Code Face | Extra | [verification-code-face/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/verification-code-face) | `/animations/verification-code-face`. Type the four-digit code. | The entry fixes `correctCode` to `1111`. It has a separate screen and registry key from Verification Code. |
| Everybody Can Cook | Extra | [everybody-can-cook/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/everybody-can-cook) | `/animations/everybody-can-cook`. Tap the text area. | Two StaggeredText refs form one text animation. They are not separate candidates. |
| Threads Holo Ticket | Extra | [threads-holo-ticket/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/threads-holo-ticket) | `/animations/threads-holo-ticket`. Interact with the ticket and change device orientation. | Registry imports `src/index.tsx` directly. The [tilt hook][e-ticket-tilt] reads rotation sensors. Front and back share one ticket. |
| Fluid Tab Interaction | Extra | [fluid-tab-interaction/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/fluid-tab-interaction) | `/animations/fluid-tab-interaction`. Select a segment. | Local icon data and selected state feed one SegmentedControl. |
| Shake to Delete | Extra | [shake-to-delete/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/shake-to-delete) | `/animations/shake-to-delete`. Interact with the AppsList. | A dedicated AppsList and its hooks own the deletion effect. This has its own registry entry. |
| Composable Text | Extra | [composable-text/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/composable-text) | `/animations/composable-text`. Tap the text button. | Alternates local base and active text variants through one ComposableText component. |
| Card Shader Reflections | Extra | [card-shader-reflections/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/card-shader-reflections) | `/animations/card-shader-reflections`. Scroll the card carousel. | The wrapper renders CardCarousel with local card data. Cards are instances of one reflection demo. |
| Clock Time Picker | Extra | [clock-time-picker/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/clock-time-picker) | `/animations/clock-time-picker`. Select a time in TimeRange. | Uses 20 local half-hour slots and a shared Clock value. The source adjusts the date's timezone offset. |
| Sudoku | Extra | [sudoku/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/sudoku) | `/animations/sudoku`. Open the puzzle, enter values, or reset. | Uses local puzzle generation, haptics, and `react-native-fast-confetti`. Completion effects belong to the game. |
| Particles Button | Extra | [particles-button/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/particles-button) | `/animations/particles-button`. Press the circular button. | CircularButton owns the blast effect. BlastEffect is a helper, not an extra route. |
| Magnet Spring | Extra | [magnet-spring/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/magnet-spring) | `/animations/magnet-spring`. Drag the object near magnets. | Uses Gesture Handler and shared positions to select the nearest magnet. No GPU renderer is necessary in this component. |
| iOS Home Grid | Extra | [ios-home-grid/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/ios-home-grid) | `/animations/ios-home-grid`. Select an app tile, then close its detail. | Uses an independent native stack and ExpansionProvider. AppDetail is the destination of the same expansion interaction. |
| Time Machine | Extra | [time-machine/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/time-machine) | `/animations/time-machine`. Enable Show Unstable or use the direct route. Use the history gesture. | Registry alert. Uses local Jotai history, a background canvas, and a history list. Nested sort components support this flow. |
| iOS Home Bouncy | Extra | [ios-home-bouncy/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/ios-home-bouncy) | `/animations/ios-home-bouncy`. Enable Show Unstable or use the direct route. Tap, or hold for the customizer. | Registry alert. The bounce runs on mount. SpringCustomizer changes this animation rather than adding a demo. |
| Online Offline / Online-offline user status indicator | Expo-listed | [online-offline/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/online-offline) | `/animations/online-offline`. Tap the status group. | Uses local status changes and Reanimated layout transitions. Avatar URLs are remote. It does not query real presence. |
| Draggable Panel | Extra | [draggable-panel/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/draggable-panel) | `/animations/draggable-panel`. Move or collapse the panel and select a spring. | SpringAnimationPanel owns a DraggableControlPanel. Spring presets are variants of the same control panel. |
| GitHub Contributions | Extra | [github-contributions/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/github-contributions) | `/animations/github-contributions`. Tap the calendar. | The entry calls generateContributionData. It uses synthetic local data, not an authenticated GitHub query. |
| Stacked Carousel | Extra | [stacked-carousel/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/stacked-carousel) | `/animations/stacked-carousel`. Scroll the stacked cards. | The active entry renders 20 plain Views and a paginator. Its remote image examples remain comments. |
| Airbnb Flip Interaction | Extra | [airbnb-flip-interaction/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/airbnb-flip-interaction) | `/animations/airbnb-flip-interaction`. Tap the profile card. | Uses FlipCard and Expo Blur. MainPage and SecondPage are the two faces of one interaction. |
| Liquid Glass Playground | Extra | [liquid-glass-playground/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/liquid-glass-playground) | `/animations/liquid-glass-playground`. Drag the glass panel. | Uses a remote Unsplash background and Expo BlurView. The label does not establish use of native liquid-glass APIs. |
| Blur Cards | Extra | [blur-cards/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/blur-cards) | `/animations/blur-cards`. Press the blur toggle. | Uses Skia paths, BackdropBlur, and a rasterized background. Cards share one progress value. |
| Calendar Days | Extra | [calendar-days/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/calendar-days) | `/animations/calendar-days`. Drag the slider. | CalendarCard and AnimatedSlider share progress. Page changes trigger haptics. |
| Sphere Waves | Extra | [sphere-waves/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/sphere-waves) | `/animations/sphere-waves`. Tap or pinch the sphere. | Uses Skia Picture drawing and shared animation values. Tap and pinch change one sphere effect. |
| Scrollable Shapes | Extra | [scrollable-shapes/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/scrollable-shapes) | `/animations/scrollable-shapes`. Scroll horizontally between shapes. | Uses Skia Picture drawing and generated point arrays. Cube, heart, sphere, and torus are variants. |
| Notion QR Code | Extra | [notion-qrcode/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/notion-qrcode) | `/animations/notion-qrcode`. Press the toggle. | Uses Skia Picture drawing and a bundled avatar sprite. Avatar cloud and QR layout are states of one morph. |
| GitHub Terrain | Extra | [github-terrain/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/github-terrain) | `/animations/github-terrain`. Tap the terrain or change the switch. | Uses native WebGPU and local contribution-data code. Flat chart and terrain are variants, not separate demos. |
| Cherry Blossom QR / 3D QR code pixel tree | Expo-listed | [cherry-blossom-qrcode/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/cherry-blossom-qrcode) | `/animations/cherry-blossom-qrcode`. Edit the payload, tap to flatten, or hold to spawn a creeper. | Uses native WebGPU and Keyboard Controller. The [constants][e-tree-constants] cap the payload at 106 UTF-8 bytes. Tree, flat QR, and detonation share one scene. |
| Art Gallery | Extra | [art-gallery/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/art-gallery) | `/animations/art-gallery`. Select a painting, pinch, pan, or double tap. | Uses native WebGPU, native color matching, and a bundled ASTC atlas. There is no decoded atlas fallback. Refer to [renderer source][e-mosaic-renderer]. |
| Chessboard / Interactive chess board | Expo-listed | [chessboard/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/chessboard) | `/animations/chessboard`. The source runs a replay on mount. The board also has an onMove handler. | Uses the patched chessboard package. [SHOW_CHROME is false][e-chess-screen], so history and main action controls stay hidden. Checkmate effects belong to the game. |
| The Little Prince | Extra | [the-little-prince/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/the-little-prince) | `/animations/the-little-prince`. Use the text-image toggle. | Supplies bundled text and `prince.png` to TextImageMorph. The shared morph module is not a second candidate. |
| Light on Painting | Extra | [light-on-painting/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/light-on-painting) | `/animations/light-on-painting`. Drag the bulb, pinch, swipe paintings, or double tap for settings. | Uses native WebGPU and bundled depth-field binaries. Two paintings share the relight renderer. The settings sheet has an iOS-specific implementation. |
| Sculptures in Words | Extra | [sculptures-in-words/](https://github.com/enzomanuelmangano/demos/tree/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/sculptures-in-words) | `/animations/sculptures-in-words`. Scroll text, toggle the sculpture, or swipe sideways between sculptures. | Requires Skia Graphite and WebGPU device sharing. The [renderer][e-sculpture-renderer] reports missing Graphite, font, or point clouds. Three statues are variants. |

### Variants versus independent demos

Each registry key above selects a separate top-level component.
Shared technique alone does not merge distinct registered demos.
For example, Fibonacci Shader and Fibonacci Shader Grid expose different control screens.
The two verification demos use different entry modules and code lengths.
The four QR demos also expose different components: generator, empty QR, avatar morph, and tree.
The [registry][e-registry] establishes those boundaries.

States within a component do not add candidates.
The following cases are examples with explicit source evidence:

- [GL Transitions][e-gl-entry] selects DirectionalWarp in its provider. The [shader index][e-gl-shaders] exports four transition variants.
- [Animated Clip Box][e-clip-entry] renders two differently styled instances of the same ClipBoxButton.
- [Circular Carousel][e-circular-entry] controls its scale variant through one switch.
- [Scrollable Shapes][e-shapes] defines cube, heart, sphere, and torus factories for one scroll interaction.
- [Light on Painting][e-paintings] lists two paintings for one renderer.
- [Sculptures in Words][e-sculpture-readme] describes three article-to-statue variants.
- [Cherry Blossom QR][e-tree-screen] handles flat QR, tree, and creeper detonation states in one component.
- [Airbnb Flip Interaction][e-flip-entry] renders MainPage and SecondPage within the same FlipCard.

CrossZoom, LinearBlur, and Hexagonalize are present source variants.
They have no separate route or runtime selector in the current GL Transitions entry.
They require a source change to replace DirectionalWarp.
They therefore add zero independent candidates.

### Nested screens and helpers excluded from the count

The [dynamic route][e-route] and [launch route][e-launch] both select registry components.
They are two access paths to the same demos, not additional demos.
The app launcher, close control, search, feedback trays, and settings are app infrastructure.
They do not add registry candidates.

[Shared Transitions][e-shared-entry] owns Home and Details in one navigator.
The detail screen completes the image-navigation interaction.
It does not establish an independent demo.

[iOS Home Grid][e-ios-grid] owns Home and AppDetail in one navigator.
The [detail screen][e-ios-detail] receives the selected tile and reverses its expansion on close.
It belongs to the same transition.

[iOS Home Bouncy][e-bouncy-entry] opens SpringCustomizer only to change its spring settings.
That modal does not add another demo.
[GL Transitions][e-gl-entry] owns Home and AddNote as the endpoints of one shader transition.
[Image Cropper][e-cropper-entry] opens a modal for its crop result.
These destinations are parts of their parent demos.

The [mini-player navigator][e-player-nav] uses placeholder tabs and one expandable player.
The [bottom-sheet entry][e-sheet-entry] uses three pages within one sheet.
Other tab-bar, toast, sheet, modal, and game subcomponents serve the same role.
Their nested files do not create additional registry entries.

Time Machine contains nested drag-to-sort code.
Its [app component][e-time-app] exposes history selection, a canvas, and a history list as one flow.
The separately registered Drag to Sort demo still counts independently.
The nested copy adds no further candidate.

### Unregistered folders and repository tools

The tree contains 126 top-level folders under `src/animations/`.
The registry imports 124 of those folders.
Only `instagram-shared-transition` and `text-image-morph` lack registry entries.

The [Instagram folder][e-instagram] contains only a README.
That README marks the animation broken during the New Architecture transition.
There is no executable demo source or route in that folder at this SHA.
It adds no candidate.
This is an upstream status statement, not a build result from this session.

The [text-image-morph module][e-morph-index] exports a reusable component, hook, and types.
Its [component][e-morph-component] requires dimensions, an image, and paragraph content.
[The Little Prince entry][e-prince-entry] supplies those inputs.
The helper folder adds no separate demo.

The [icon-generator manifest][e-icon-package] describes a separate icon tool, not another app.
Its [AppIcon component][e-icon-component] draws icons through headless Skia.
The [Spiral Lab HTML][e-icon-lab] tunes static icon randomness and sample batches.
It is a developer helper, not another React Native demo.
Generated native bindings, patches, asset generators, and test flows also add no candidates.

### Expo match and remaining caveats

All three Expo-listed demos have source matches.
Interactive chess board maps to `chessboard`.
3D QR code pixel tree maps to `cherry-blossom-qrcode`.
Online/offline user status indicator maps to `online-offline`.
No Expo-listed demo is missing from this snapshot.

Four candidates carry upstream unstable flags.
The Shared Transitions source disables its shared-element tags.
A future build and visual check must establish the actual behavior of every candidate.
A manifest entry, route, or exported component alone does not establish execution success.

Some demos require native GPU paths, sensors, binary assets, or remote images.
Art Gallery additionally requires ASTC texture support and the native color matcher.
Sculptures in Words explicitly requires Skia Graphite.
The report does not infer universal Expo Go, simulator, Android, iOS, or web support.

The repository uses a [custom software license][e-license].
It restricts code redistribution, competing component packages, and use of the software as a product's primary value proposition.
The maintainer needs a permission review before reuse or publication.
This report records candidates, not a licensing decision.

## Source references

[m-package]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/package.json
[m-config]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/app.json
[m-root]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/app/index.tsx
[m-hub]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/HubScreen.tsx
[m-layout]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/app/_layout.tsx
[m-webgpu]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/hooks/useWebGPU.ts
[m-products]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/constants/furniture-products.ts
[m-card-shader]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/CardFlipScreen/FaceShader.tsx
[m-toolbar]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/components/birds-toolbar.tsx
[m-gallery-hook]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/hooks/useGalleryScene.ts
[m-artic]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/services/artic.ts
[m-salon-hook]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/hooks/useSalonSelectionScene.ts
[m-stadium-hook]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/hooks/useStadiumSelectionScene.ts
[m-native-text]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/components/NativeAnimatedText.tsx
[m-tiger-hook]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/hooks/useTigerParticlesScene.ts
[m-chart-data]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/screens/charts/constants.ts
[m-formations]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/scenes/birds/formations.ts
[m-pixel-exports]: https://github.com/hewad-mubariz/react-native-motion-lab/blob/ba9b8e4872dfef26c2b34902f966e9c3e4511a00/src/scenes/pixel-explosion/index.ts
[e-package]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/package.json
[e-skia-shim]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/shims/shopify-react-native-skia/package.json
[e-config]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/app.config.ts
[e-readme]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/README.md
[e-registry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/registry.ts
[e-home-list]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/navigation/home/demos.ts
[e-home]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/app/index.tsx
[e-launch]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/app/launch.tsx
[e-route]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/app/animations/%5Bslug%5D.tsx
[e-demo-screen]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/navigation/home/demo-screen.tsx
[e-filter]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/navigation/states/filters.ts
[e-general]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/trays/General.tsx
[e-grid-data]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/animated-grid-list/constants.ts
[e-shared-home]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/shared-transition/screens/home/index.tsx
[e-shared-detail]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/shared-transition/screens/details/index.tsx
[e-coverflow-data]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/coverflow-carousel/constants.ts
[e-ticket-tilt]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/threads-holo-ticket/src/hooks/use-device-tilt.ts
[e-tree-constants]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/cherry-blossom-qrcode/constants.ts
[e-tree-screen]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/cherry-blossom-qrcode/cherry-blossom-qr-code.tsx
[e-mosaic-renderer]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/art-gallery/hooks/use-webgpu-mosaic.ts
[e-chess-screen]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/chessboard/src/index.tsx
[e-sculpture-renderer]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/sculptures-in-words/hooks/use-portrait-renderer.ts
[e-gl-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/gl-transitions/src/index.tsx
[e-gl-shaders]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/gl-transitions/src/the-magic/index.tsx
[e-clip-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/animated-clip-box/index.tsx
[e-circular-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/circular-carousel/index.tsx
[e-shapes]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/scrollable-shapes/shapes/index.ts
[e-paintings]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/light-on-painting/paintings.ts
[e-sculpture-readme]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/sculptures-in-words/README.md
[e-flip-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/airbnb-flip-interaction/index.tsx
[e-shared-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/shared-transition/index.tsx
[e-ios-grid]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/ios-home-grid/index.tsx
[e-ios-detail]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/ios-home-grid/app-detail-screen.tsx
[e-bouncy-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/ios-home-bouncy/index.tsx
[e-cropper-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/image-cropper/index.tsx
[e-player-nav]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/expandable-mini-player/src/navigation/index.tsx
[e-sheet-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/scrollable-bottom-sheet/index.tsx
[e-time-app]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/time-machine/components/app.tsx
[e-instagram]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/instagram-shared-transition/README.md
[e-morph-index]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/text-image-morph/index.ts
[e-morph-component]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/text-image-morph/text-image-morph.tsx
[e-prince-entry]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/src/animations/the-little-prince/index.tsx
[e-icon-package]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/scripts/generate-app-icon/package.json
[e-icon-component]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/scripts/generate-app-icon/src/app-icon/index.tsx
[e-icon-lab]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/scripts/generate-app-icon/spiral-lab.html
[e-license]: https://github.com/enzomanuelmangano/demos/blob/884c9f8f969fd3fd24319da9ffcd9e54c0735445/LICENSE.md
