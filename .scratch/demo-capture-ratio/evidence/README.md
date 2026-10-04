# Evidence — Demo capture ratio

The measurements behind [the map's standing decisions](../map.md), so they can be checked rather than
taken on trust. Everything here was produced on 2026-10-04 on the maintainer's Mac.

## What settles it

**`iphone-18-pro-recording.mp4` is 1206×2622 — aspect 0.459954.** That is the number the standard
names, and it comes from an actual `simctl io recordVideo` output rather than from a screenshot or
from arithmetic. `iphone-18-pro-screenshot.png` measures identically, which is the cross-check: the
screenshot path and the recording path agree.

Both are **the device screen only**. No Simulator window, no title bar, no bezel — which is the
maintainer's original requirement, and the thing worth eyeballing in these files rather than taking
on faith. Open `iphone-18-pro-screenshot.png` and look at the edges: the Dynamic Island is at the top
and the home indicator at the bottom, with nothing outside them.

`iphone-18-pro-recording-frame.png` is frame 6 lifted out of the MP4, for viewing in a file browser
that will not play video. GitHub does not preview the MP4 inline.

## How each file was made

```sh
# boot and wait for the device to actually finish starting
xcrun simctl boot 94273D2F-EA9C-4833-8437-107B507EDE71
xcrun simctl bootstatus 94273D2F-EA9C-4833-8437-107B507EDE71 -b

# the screenshot
xcrun simctl io 94273D2F-EA9C-4833-8437-107B507EDE71 screenshot iphone-18-pro-screenshot.png

# the recording — runs until SIGINT, so it needs a background job
xcrun simctl io 94273D2F-EA9C-4833-8437-107B507EDE71 \
  recordVideo --codec=h264 --force iphone-18-pro-recording.mp4 &
RECPID=$!
#   ... interact with the simulator ...
kill -INT $RECPID

# the measurement
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,codec_name,r_frame_rate,nb_frames \
  iphone-18-pro-recording.mp4
```

`ffprobe` reads the stream header only, which is what `scripts/measure-demos.ts` does over the CDN
and why a probe costs about half a second rather than a download.

## The six-device table

Every iPhone on this machine, measured the same way. This is what shows the ratio barely moves, and
that the chosen device is not an arbitrary pick.

| Device | Runtime | UDID | Pixels | w ÷ h |
| --- | --- | --- | --- | --- |
| **iPhone 18 Pro** | iOS 27.0 | `94273D2F-EA9C-4833-8437-107B507EDE71` | 1206×2622 | **0.459954** |
| iPhone 17 | iOS 27.0 | `6CBBBF7E-77D4-46EA-9112-EC350C36DE3C` | 1206×2622 | 0.459954 |
| iPhone 17 Pro | iOS 26.5 | `D626C0C7-0017-4AF8-A14B-C025949852B3` | 1206×2622 | 0.459954 |
| iPhone 18 Pro Max | iOS 27.0 | `054F2927-8536-4335-8997-5FB490F49B9B` | 1320×2868 | 0.460251 |
| iPhone Air | iOS 27.0 | `8779B174-98DE-473A-B957-70E680CFD4F8` | 1260×2736 | 0.460526 |
| iPhone 17e | iOS 27.0 | `FF0A08FC-74FA-4CF5-AAB9-A3770D9668A5` | 1170×2532 | 0.462085 |

The whole range spans **0.46%**. Three devices on two runtimes produce byte-identical geometry
(1206×2622), so the standard is not an artefact of one generation.

## Against the catalogue

All 280 Recordings carry a measured `aspect`, written by `pnpm assets:measure`. The closest values to
the standard:

| Demos | ratio | difference from 0.459954 |
| --- | --- | --- |
| 3 | 0.4600 | +0.01% |
| 1 | 0.4609 | +0.21% |
| **88** | **0.4611** | **+0.25%** |
| 3 | 0.4615 | +0.34% |
| 19 | 0.4583 | −0.36% |
| 2 | 0.4624 | +0.53% |

**114 of 280** are within ±0.5% of the standard and **122** within ±1%. The mode, 0.4611, sits 0.25%
away — and `formatAspect()` in `components/recording-detail.tsx:38` renders 0.459954, 0.4611 and
0.4583 all as the same label, **`6:13`**, so the difference is invisible in the site's chrome.

That is why no existing Demo needs re-recording and no tile needs changing. The full distribution is
in [the map](../map.md).

## One thing to know before recording a real Demo

The test recording is `codec=h264, 1206×2622, r_frame_rate=5/2, nb_frames=12, duration=3.56s` —
despite about eleven seconds of wall-clock recording. **`simctl io recordVideo` captures a frame only
when the screen changes**, so a mostly-static screen yields a low frame rate and a short duration.

For a real Demo with continuous motion this is fine, and it is a bonus for file size. But it means a
recorded Demo's wall-clock length is not its video duration, and a static screen records almost
nothing at all. `pnpm assets:measure` stores `durationMs` from the file, so what lands in
`Recording.durationMs` is the motion, not the time you spent holding still.
