#!/usr/bin/env python3
"""Generate index.html + compositions/poster.html from tools/layers.json.

Run:  python3 tools/build_composition.py
Every layer becomes one timed <img> clip with a stable id, so Studio can
select, move, scale, hide, or replace each layer on its own.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
meta = json.load(open(os.path.join(HERE, "layers.json")))
W, H = meta["width"], meta["height"]
CW, CH, DUR = 1920, 1080, 5
S = CW / W

LABELS = {
    "background": "Kitchen background (rebuilt plate)",
    "person": "Person: body, hands, eggs (face removed)",
    "face": "FACE - swap this layer with your own photo",
    "pan": "Frying pan and handle",
    "icon-eq": "App icon: audio equalizer card",
    "icon-remote": "App icon: dark remote strip",
    "icon-wave-magenta": "App icon: magenta waveform card",
    "icon-wave-teal": "App icon: teal waveform card",
    "icon-wave-blue": "App icon: blue waveform card",
    "icon-trim": "App icon: yellow trim marker",
    "icon-symbol": "App icon: magenta symbol",
    "icon-ruler": "App icon: timeline ruler",
    "icon-fx": "App icon: fx script",
    "icon-wheel": "App icon: color wheel card",
    "icon-capcut": "App icon: CapCut card",
    "icon-blobs": "App icon: color blobs card",
    "icon-photo": "App icon: photo diamond",
    "icon-pr": "App icon: Premiere Pro card",
    "icon-mic": "App icon: microphone",
    "icon-sliders": "App icon: temperature sliders card",
}

imgs = []
for i, L in enumerate(meta["layers"]):
    x, y = round(L["x"] * S, 2), round(L["y"] * S, 2)
    w, h = round(L["w"] * S, 2), round(L["h"] * S, 2)
    var = ' data-var-src="face-src"' if L["id"] == "face" else ""
    imgs.append(
        f'      <img id="{L["id"]}" class="clip layer" src="assets/{L["id"]}.png"{var}\n'
        f'        alt="{LABELS.get(L["id"], L["id"])}"\n'
        f'        data-start="0" data-duration="{DUR}" data-track-index="{i}"\n'
        f'        style="left: {x}px; top: {y}px; width: {w}px; height: {h}px; z-index: {i + 1};" />'
    )

poster = f"""<template>
  <style>
    #root {{
      position: absolute;
      inset: 0;
      overflow: hidden;
    }}
    .layer {{
      position: absolute;
      object-fit: fill;
    }}
    /* Any photo dropped into the face layer gets the same soft oval crop. */
    #face {{
      -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 60%, rgba(0, 0, 0, 0) 76%);
      mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 60%, rgba(0, 0, 0, 0) 76%);
    }}
  </style>
  <div id="root" data-composition-id="poster" data-width="{CW}" data-height="{CH}" data-no-timeline>
{chr(10).join(imgs)}
  </div>
</template>
"""

index = f"""<html
  data-composition-variables='[
    {{"id": "face-src", "type": "string", "label": "Face photo (your face)", "default": "assets/face.png"}}
  ]'
>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="{DUR}"
      data-width="{CW}"
      data-height="{CH}"
      data-no-timeline
    >
      <div
        id="poster"
        data-composition-id="poster"
        data-composition-src="compositions/poster.html"
        data-start="0"
        data-duration="{DUR}"
        data-track-index="0"
        data-track-kind="graphics"
        data-width="{CW}"
        data-height="{CH}"
      ></div>
    </div>
  </body>
</html>
"""

os.makedirs(os.path.join(PROJ, "compositions"), exist_ok=True)
open(os.path.join(PROJ, "compositions", "poster.html"), "w").write(poster)
open(os.path.join(PROJ, "index.html"), "w").write(index)
print("wrote index.html + compositions/poster.html with", len(imgs), "layers")