# Egg-Icons Poster — editable layer recreation

This project recreates the source thumbnail (`assets/source-reference.jpg`) as 20 separate layers.
Every layer is one timed `<img>` clip in `compositions/poster.html`.
Studio selects, moves, scales, hides, and replaces each layer on its own.
The composition is a still: the root carries `data-no-timeline`, and every clip spans the full 5 s slot.

## Replace the face with your own

1. Open the Studio preview and select the layer named `face`.
2. Put your photo in `assets/` (for example `assets/my-face.jpg`).
3. Set the variable `face-src` to that path in the Variables panel, or edit `data-var-src` on `#face`.
4. Move and scale the `face` layer until the oval sits over the face.
   A CSS oval mask crops any replacement photo with a soft edge.
   The `person` layer keeps the original hair, ears, and neck under the swap.

## Layer stack (bottom to top)

| id | content |
| --- | --- |
| background | kitchen plate, rebuilt by diffusion where layers cover it |
| person | body, hands, eggs; original face stays under the face layer |
| face | swappable face crop with soft oval mask |
| pan | frying pan and handle |
| icon-eq … icon-sliders | 16 app-icon cards, each cut from the photo |

The layer alphas partition the source pixels.
With the default face, the composite reproduces the photo (mean pixel error ≈ 2/255).
Move a layer and the rebuilt background shows through the gap.

## Rebuild the layers

```bash
python3 tools/extract_layers.py     # cuts PNG layers + tools/layers.json
python3 tools/build_composition.py  # writes index.html + compositions/poster.html
npm run check                       # lint + runtime + layout + contrast
```

`tools/extract_layers.py` holds the polygon coordinates.
Edit them there, then rerun both scripts to adjust a cut.

## Notes

- The lint warning `timeline_track_too_dense` is intentional: a flat 20-lane stack mirrors a layer panel.
- The source photo is low resolution (736×414). The 1920×1080 canvas upscales it; no detail is added.