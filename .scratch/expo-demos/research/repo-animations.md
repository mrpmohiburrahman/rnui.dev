# Repository animation inventory

## Scope

This report expands the linked repositories in the [Expo inventory](expo-inventory.md).
The inspection date is 2026-10-22 UTC.
The inspection covers source code only. No app build or capture forms part of this inspection.
Each candidate names one distinct source example, not a published Recording.
Duplicate verdicts, Categories, and Contributor approval belong to later tickets.

The Expo inventory contains 29 repository links across 13 distinct repositories.
Those repositories expose 191 candidate examples through app entry points, routes, registries, or native extension registrations.
This count does not establish 191 new Recordings or 191 successful simulator builds.

Two other Expo demos lack repository links: Media Gallery Carousel and Radial Menu.
The maintainer supplies those repositories through [Missing repo links](../issues/07-missing-repo-links.md).
Their absence does not authorize a guessed source link.
A supplied repository needs the same complete source scan before its candidates enter this inventory.

## Method

- Inspect the complete repository tree, app manifests, route registrations, and implementation files.
- Record the inspected commit and use commit-specific source links as evidence.
- Give each independent example one candidate row.
- Keep helper components, navigation wrappers, and nested screens with their parent example.
- Preserve distinct effects with different triggers and outcomes inside a shared screen.
- Include examples outside the Expo list when the linked repository contains them.
- Distinguish a route in source from a successful app launch.
- Retain inactive examples separately instead of treating them as out of scope.
- Report source constraints without a claim that the app builds.

## Complete candidate lists

Each linked report contains the complete candidate table for its repositories.
Each row supplies a name, Expo association, exact implementation link, entry point, interaction selector, and source constraints.
The reports also identify wrappers, variants, inactive source, and other exclusions from the active count.
The details live in those reports, not a second copied table here.

| Repository | Candidates | Expo association and expansion | Complete list and evidence |
| --- | ---: | --- | --- |
| `giaBaoJS/folio-popup-book` | 1 | One Expo experience, with four named chapter scenes. | [Folio source report](repos-folio-crumple-and-sdk.md#giabaojsfolio-popup-book) |
| `pablogdcr/daily-crumple` | 3 | One Expo experience expands into swipe fold, edge crumple, and corner tear. | [Newspaper source report](repos-folio-crumple-and-sdk.md#pablogdcrdaily-crumple) |
| `hewad-mubariz/react-native-motion-lab` | 8 | Three Expo-listed examples and five extras. | [Motion Lab source report](repos-motion-lab-and-enzo.md#motion-lab) |
| `Solarin-Johnson/my-app` | 28 | Three Expo-listed examples and 25 extras. | [Solarin source report](repos-solarin-and-ios-patterns.md#solarin-johnsonmy-app) |
| `enzomanuelmangano/demos` | 124 | Three Expo-listed examples and 121 extras. | [Enzo source report](repos-motion-lab-and-enzo.md#enzo-demos) |
| `rit3zh/expo-curved-bottom-tabs` | 1 | One Expo-listed tab-bar experience. | [Curved tabs source report](repos-standalone.md#rit3zhexpo-curved-bottom-tabs) |
| `rit3zh/expo-motion-tabs` | 1 | One Expo-listed tab-to-popover experience. | [Motion tabs source report](repos-standalone.md#rit3zhexpo-motion-tabs) |
| `rit3zh/expo-stack-bottom-sheet` | 1 | One Expo-listed sheet-stack experience. | [Stacked sheets source report](repos-standalone.md#rit3zhexpo-stack-bottom-sheet) |
| `rit3zh/expo-meatball-animation` | 1 | One Expo-listed profile scroll-collapse experience. | [Profile source report](repos-standalone.md#rit3zhexpo-meatball-animation) |
| `arunabhverma/expo-paste-input` | 1 | One Expo-listed native paste-input example. | [Paste input source report](repos-standalone.md#arunabhvermaexpo-paste-input) |
| `tchayen/ios-in-expo` | 7 | One Expo umbrella expands into seven interface examples. | [iOS patterns source report](repos-solarin-and-ios-patterns.md#tchayenios-in-expo) |
| `SchroederNathan/linear-tab-bar` | 1 | One Expo-listed tab-bar experience. | [Linear tab bar source report](repos-standalone.md#schroedernathanlinear-tab-bar) |
| `kitten/expo-55-demos` | 14 | Eleven Expo-listed apps and three extra apps. | [SDK source report](repos-folio-crumple-and-sdk.md#kittenexpo-55-demos) |
| Total | 191 | Before catalogue duplicate decisions and build tests. | Four source reports. |

The 154 repository-only extras are not automatically new to rnui.dev.
The remaining expansion comes from the newspaper suite and the native iOS umbrella.
The next ticket compares the candidates against the current catalogue.

## Snapshot coverage

All 13 recursive tree responses report `truncated: false`.
The source reports record every default branch and full inspected commit SHA.
Daily Crumple uses `master`. The other inspected repositories use `main`.
No listed implementation is absent from the 29 repository-linked Expo rows at those snapshots.
This statement describes source matching, not visual parity with historical Expo media.

Enzo's registry contains 124 keys, but the default home list hides four unstable examples.
The report identifies their direct routes and the Show Unstable setting.
The four examples remain in the 124 count.
The Enzo `dev` script refers to an absent launcher script, so that script is not a tested entry path.

## Route-disconnected source

An inactive example remains part of this inventory when its implementation exists but the app does not expose it.
It does not count as a route-connected candidate.
This distinction does not rule the example out of scope.
[Select inactive and non-visual examples](../issues/11-inactive-and-non-visual-examples.md) records the maintainer's decision before any selector changes.

| Source group | Retained source outside the active count | Evidence |
| --- | --- | --- |
| Solarin archived examples | Accordion, Gesture menu, Mail-style list, Onboarding mockup, Gift card, Safari bar, Shared music options, WhatsApp status, Wheel input, Image zoom. | [Archive paths and former selectors](repos-solarin-and-ios-patterns.md#archived-experiments-outside-the-active-router) |
| Solarin unused example | SwiftUI confirmation dialog in `components/Demo.tsx`. | [Unmounted sources](repos-solarin-and-ios-patterns.md#other-exclusions) |
| Motion Tabs unused example | Accordion implementation with no mounted example. | [Unused accordion source](repos-standalone.md#rit3zhexpo-motion-tabs) |
| Motion Lab inactive implementation | Older pixel-explosion implementation. The active screen uses the tiger-particle implementation instead. | [Implementation boundaries](repos-motion-lab-and-enzo.md#variants-and-exclusions) |
| Enzo inactive shader variants | CrossZoom, LinearBlur, and Hexagonalize. The current GL Transitions entry selects DirectionalWarp. | [Variant source and current selector](repos-motion-lab-and-enzo.md#variants-versus-independent-demos) |

Enzo's Instagram Shared Transition folder contains only a README, not executable example code at the inspected commit.
Its reusable text-image-morph module serves The Little Prince and does not add another standalone example.
The source reports preserve these distinctions.
Build failures and absent routes are different conditions.
Neither condition authorizes a silent omission or an upstream fix.

## Capture constraints for the plan

These constraints come from source, not measured build failures:

- Folio references an iOS 27.1 hinge API and native GPU paths. Its tap fallback does not establish older SDK compilation support.
- The SDK workspace includes Android-specific Compose interfaces, a Maps-key placeholder, native sharing, widgets, and a Live Activity.
- The SDK age-range app requests data but does not render its result. It remains one of the 14 app candidates pending review.
- Several examples need native GPU support, sensors, remote images, clipboard content, or microphone permission.
- Shared Transitions carries an unstable flag and comments out its shared-element tags.
- Solarin uses preview dependencies and requires a development client according to its README.
- A repository's current implementation can differ from its Expo caption. Motion Lab's bank-card shader now uses Skia.

The standard remains the iPhone 18 Pro simulator on iOS 27.0, with device-screen capture at 1206x2622.
No source-only observation changes that standard or authorizes Android captures.
The [Build check](../issues/08-build-check.md) records actual results in a later session.
The first failed build requires a maintainer prompt under the current map rules.

## Permission questions

The Enzo repository uses a custom software license. The Motion Lab tree contains no license file.
The [Motion Lab and Enzo report](repos-motion-lab-and-enzo.md) cites that evidence.
These facts do not alone decide permission to record or host a Demo.
Software redistribution and publication of captured media are different uses.
[Check capture and publication permissions](../issues/12-capture-and-publication-permissions.md) collects the applicable terms before publication work.
This inventory grants no permission and makes no legal verdict.

## Verification

All four source reports passed the prose linter with no hard violations.
Independent validation passed: 191 candidate rows across 13 repositories.
All 510 distinct commit-specific source paths exist at the recorded commits.
The audit resolved 620 uses of those links and all 395 reference definitions.
All 343 blob links identify files. All 167 tree links identify directories.
The nine percent-encoded paths passed after decoding.
Missing paths, link-type mismatches, unresolved references, and API failures: zero.
Folio's four chapter coverage rows do not enter the 191 total.

The audit parsed the reports with `markdown_it` and matched literal URLs independently.
It decoded paths with `urllib.parse.unquote` and compared them against complete recursive trees.
For each repository and commit, it used this read-only command:

```sh
gh api --method GET \
  -H 'Accept: application/vnd.github+json' \
  'repos/{owner}/{repo}/git/trees/{40sha}?recursive=1'
```

Every tree reported `truncated: false`.

`npm run check-types` passed.
`npm run lint` found one existing error in `.scratch/social-cards/probe/avif-datauri.tsx:35` and 167 warnings.
The `pnpm` launcher failed because its installed module path is missing, so the same package scripts ran through `npm`.
No application code, catalogue rows, published Assets, or repository branches changed in this ticket.
This inspection did not download or reuse Expo demo media.
