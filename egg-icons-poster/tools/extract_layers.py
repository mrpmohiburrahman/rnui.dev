#!/usr/bin/env python3
"""Cut the source photo into editable layers for the HyperFrames poster.

Run:  python3 tools/extract_layers.py
Writes PNG layers + tools/layers.json (bounding boxes in source pixels).
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from rembg import new_session, remove

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
SRC = "/Users/mrp/Documents/0-Inbox/eabf472297d44c2f45bda190438edc8a.jpg"
ASSETS = os.path.join(PROJ, "assets")
os.makedirs(ASSETS, exist_ok=True)

im = Image.open(SRC).convert("RGB")
W, H = im.size
rgb = np.asarray(im).astype(np.float32)

# ---------------------------------------------------------------- polygons
# Source-pixel polygons, back-to-front paint order.
ICONS = [
    ("icon-eq",        [(271, 180), (306, 172), (313, 238), (277, 246)]),
    ("icon-remote",    [(441, 152), (463, 147), (472, 210), (450, 215)]),
    ("icon-wave-magenta", [(232, 180), (252, 170), (288, 252), (265, 266)]),
    ("icon-wave-teal", [(455, 157), (505, 178), (473, 283), (421, 262)]),
    ("icon-wave-blue", [(296, 252), (322, 243), (341, 288), (313, 297)]),
    ("icon-trim",      [(389, 268), (417, 262), (420, 286), (392, 292)]),
    ("icon-symbol",    [(270, 278), (290, 270), (297, 296), (276, 303)]),
    ("icon-ruler",     [(238, 292), (256, 282), (263, 296), (320, 310), (317, 323), (238, 306)]),
    ("icon-fx",        [(336, 290), (352, 282), (366, 308), (348, 318)]),
    ("icon-wheel",     [(405, 285), (455, 277), (472, 322), (420, 332)]),
    ("icon-capcut",    [(212, 318), (283, 310), (302, 382), (228, 396)]),
    ("icon-blobs",     [(327, 300), (400, 312), (416, 380), (330, 392), (308, 345)]),
    ("icon-photo",     [(283, 325), (312, 318), (322, 362), (292, 372)]),
    ("icon-pr",        [(425, 310), (492, 303), (517, 382), (445, 398)]),
    ("icon-mic",       [(405, 340), (425, 332), (436, 364), (414, 372)]),
    ("icon-sliders",   [(280, 372), (400, 362), (412, 392), (290, 402)]),
]
PAN = [
    [(118, 372), (160, 352), (260, 340), (420, 338), (540, 348),
     (600, 362), (612, 378), (600, 414), (140, 414)],
    [(598, 368), (660, 352), (736, 344), (736, 392), (660, 398), (606, 392)],
]
FACE_CX, FACE_CY, FACE_RX, FACE_RY = 372, 140, 100, 122


def poly_mask(polys, size=(W, H), ss=4):
    """Anti-aliased polygon mask via supersampled rendering."""
    m = Image.new("L", (size[0] * ss, size[1] * ss), 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([(x * ss, y * ss) for x, y in p], fill=255)
    return np.asarray(m.resize(size, Image.LANCZOS)).astype(np.float32) / 255.0


def ellipse_mask(cx, cy, rx, ry, feather=12):
    m = Image.new("L", (W * 4, H * 4), 0)
    d = ImageDraw.Draw(m)
    d.ellipse([(cx - rx) * 4, (cy - ry) * 4, (cx + rx) * 4, (cy + ry) * 4], fill=255)
    m = m.resize((W, H), Image.LANCZOS)
    m = m.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(m).astype(np.float32) / 255.0


def dilate(mask, px=2):
    m = Image.fromarray((mask * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(2 * px + 1))
    return np.asarray(m).astype(np.float32) / 255.0


def diffuse_fill(img, mask, iters=400):
    """Fill masked pixels by heat diffusion from the surrounding pixels."""
    small = np.asarray(
        Image.fromarray(img.astype(np.uint8)).resize((W // 4, H // 4), Image.LANCZOS)
    ).astype(np.float32)
    sm = np.asarray(
        Image.fromarray((mask * 255).astype(np.uint8)).resize((W // 4, H // 4), Image.LANCZOS)
    ) > 127
    for _ in range(300):
        nb = (np.roll(small, 1, 0) + np.roll(small, -1, 0)
              + np.roll(small, 1, 1) + np.roll(small, -1, 1)) / 4.0
        small[sm] = nb[sm]
    out = np.asarray(
        Image.fromarray(small.astype(np.uint8)).resize((W, H), Image.BILINEAR)
    ).astype(np.float32)
    out[mask <= 0.5] = img[mask <= 0.5]
    m = mask > 0.5
    for _ in range(iters):
        nb = (np.roll(out, 1, 0) + np.roll(out, -1, 0)
              + np.roll(out, 1, 1) + np.roll(out, -1, 1)) / 4.0
        out[m] = nb[m]
    return out


def save_layer(name, alpha, source=None):
    src = rgb if source is None else source
    a = np.clip(alpha, 0, 1)
    ys, xs = np.where(a > 0.02)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    rgba = np.dstack([src[y0:y1, x0:x1], (a[y0:y1, x0:x1] * 255)]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(ASSETS, name + ".png"))
    return {"id": name, "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}


# ---------------------------------------------------------------- person
print("rembg: segmenting person ...")
session = new_session("u2net")
person_mask = np.asarray(
    remove(im, session=session, only_mask=True).convert("L")
).astype(np.float32) / 255.0

icon_union = np.zeros((H, W), np.float32)
for _, poly in ICONS:
    icon_union = np.maximum(icon_union, poly_mask([poly]))
pan_mask = poly_mask(PAN)
face_mask = ellipse_mask(FACE_CX, FACE_CY, FACE_RX, FACE_RY)

# Exact (un-dilated) occluders: layer alphas partition the source pixels,
# so the default composite reproduces the photo without seams or gap rings.
occluders = np.maximum(icon_union, pan_mask)
person_alpha = person_mask * (1 - occluders)

# The person layer keeps the original face; the face layer above it is the
# swappable crop. Identical pixels under identical pixels = no visible seam.
layers = [save_layer("person", person_alpha)]

# ---------------------------------------------------------------- background
print("diffusion: rebuilding kitchen background ...")
hole = np.maximum(dilate(person_mask, 3), np.maximum(dilate(icon_union, 2), dilate(pan_mask, 2)))
bg_rgb = diffuse_fill(rgb, hole, iters=500)
Image.fromarray(bg_rgb.astype(np.uint8)).save(os.path.join(ASSETS, "background.png"))
layers.insert(0, {"id": "background", "x": 0, "y": 0, "w": W, "h": H})

# ---------------------------------------------------------------- face + pan + icons
layers.append(save_layer("face", face_mask * person_mask * (1 - occluders)))
layers.append(save_layer("pan", pan_mask * (1 - icon_union)))
for name, poly in ICONS:
    layers.append(save_layer(name, poly_mask([poly])))

with open(os.path.join(HERE, "layers.json"), "w") as f:
    json.dump({"width": W, "height": H, "layers": layers}, f, indent=2)
print("done:", len(layers), "layers")