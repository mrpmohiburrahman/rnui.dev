# Demo Capture Ratio

Wayfinder map. Charted 2026-10-04. **Collapsed the same day** — the destination turned out to be one
line, and five of the seven charted tickets were answered by measurement rather than by being worked.

## Destination

**One ratio for every Demo on the site: the iPhone 18 Pro simulator's, 0.459954.** It governs how
Demos are recorded from now on, and how every tile presents them — the ones already published and the
ones yet to be made.

## Notes

- **Domain is `CONTEXT.md`.** A **Demo**, its **Poster**, a **Recording**, the binary an **Asset**.
  Never "video", "clip", "thumbnail", "entry" (ADR-0008).
- **ADR-0003** — an Asset path names specific bytes and is never reused. This is why no existing Demo
  can be converted, only presented.
- **`.scratch/studio-dark/spec.md` binds any change to the site.** Its **checkpoint 4** is un-cleared
  and stops an agent from restyling anything `ui-ux-overhaul` shipped for a recorded reason. Ticket 02
  is gated on it.
- **The standard is written down** in `.claude/skills/add-recording/SKILL.md`, *Before Step 1*. It
  applies **only** to a Demo the maintainer records — never to a Submission, whose bytes came from the
  Contributor's own device.
- **Evidence:** [`evidence/`](evidence/README.md) — the screenshots, the recording, the six-device
  table, and the exact commands. Every number below is measured there.

## Decisions so far

- **The capture device is the iPhone 18 Pro simulator, iOS 27.0** — measured at 1206×2622, ratio
  **0.459954**, from a real `simctl io recordVideo` output rather than a screenshot or an assumption.
  Chosen because it is the modal point of the modern range: iPhone 17 and iPhone 17 Pro produce
  byte-identical 1206×2622, and the whole six-device spread is 0.46%.
- **Device screen only, and that is already free.** `simctl io` reads the CoreSimulator framebuffer
  directly, so neither it nor Device Hub can capture a Simulator window. `ffprobe` will not catch a
  bad capture, so the first frame has to be eyeballed.
- **Tolerance is ±0.5% on the ratio**, and 0.5% is not arbitrary — the catalogue's commonest ratio is
  0.4611, 0.25% away, so a tighter band would reject the Demos already published.
- **Step 5 preserves it.** `compress-demo.sh` scales by `trunc(iw/2)*2:trunc(ih/2)*2`; both 1206 and
  2622 are already even, so the Demo is not rescaled and the ratio reaches the CDN intact.
- **Xcode 27 has no Simulator.app.** Apple replaced it with Device Hub
  (`Xcode.app/Contents/Applications/DeviceHub.app`), which runs standalone. The dangling
  `/Applications/Simulator.app` symlink is a leftover from a previous Xcode. This is why the GUI is
  `Device Hub` and why `simctl` remains necessary — it is the only route with no window at all.
- **`simctl io recordVideo` writes a frame only when the screen changes**, so a mostly-still Demo
  records a short, low-frame-rate file. `Recording.durationMs` measures motion, not wall clock.
- **Nothing existing is re-recorded and no byte is rewritten.** See *Out of scope* — this is
  structural, not a preference.

## What the measurement changed

The request was "find a simulator whose ratio matches each existing Demo". Measurement dissolved it:
the 171 phone-shaped Demos are not one ratio, they are a **continuum** spanning 0.44–0.50, and the
capture ratio sits inside it. There was never a per-Demo mismatch to solve.

What *did* surface is the opposite finding, and it is what ticket 02 is about:

> **Today's `9/16` tile is cutting ~22% off the height of every one of those 171 Demos** — top and
> bottom, status bars and all. At 0.459954 that falls to roughly zero, because the box finally
> matches the shape of the thing inside it.

The tile was cropping the majority in order to be uniform with a minority that no iPhone produces.

## Open tickets

- **[Put the tile on the capture ratio](issues/02-put-the-tile-on-the-capture-ratio.md)** — the
  maintainer's direction, gated on `studio-dark` checkpoint 4. Reverses Q1, fixes the 22% crop, costs
  an 18% taller grid and a worse crop for the 108 outliers.
- **[What happens when the device or the runtime changes](issues/01-what-happens-when-the-device-or-the-runtime-changes.md)**
  — blocked by the above. A standard that names a device expires; whether it expires on a shape change
  or a runtime bump is undecided, and it decides what the standard's sentence even says.

## Out of scope

- **Re-recording the existing Demos on an iPhone 18 Pro.** Impossible: the originals were shot on ~40
  Contributors' own devices and were never kept. Only the compressed Published MP4s exist.
- **Re-encoding existing Demos to 0.459954.** Destruction, not conversion — a 16:9 Demo becomes a 26%
  sliver or gains letterbox bars, either way permanently. And ADR-0003 makes it a 280-row migration:
  280 new Asset paths, 280 new Posters, 280 `data/*.ts` edits, and a full R2 re-upload. "Every Demo at
  the capture ratio" is therefore achievable as **presentation** — which is what ticket 02 does — and
  not as bytes.
- **Restoring Simulator.app.** Apple removed it in Xcode 27; Device Hub replaces it. Not a fault and
  not repairable.
- **The four untracked probe files** (`app/probe-q1`, `app/probe-q3`, `.tmp-grab.mts`, `.tmp-q3.mts`).
  Deleted. Their one surviving conclusion — Q1, the uniform 9/16 box — is reversed by ticket 02, and
  their crop measurement is what made the case for reversing it.
