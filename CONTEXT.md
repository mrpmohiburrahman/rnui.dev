# rnui.dev

A catalogue of React Native UI components, each shown as a short screen recording. The site is metadata plus media: the metadata lives in the repo, the media does not.

## Language

### The catalogue

**Entry**:
One catalogue record — an author, a caption, source links, a category, and the paths to its Demo and Poster. Entries live in `data/<category>.ts`.
_Avoid_: item, card, component, animation

**Category**:
The UI kind an Entry belongs to (Buttons, Sliders, Tabbars…). One `data/` file per Category. Its display name is the canonical form — the lowercase spellings that appear in URLs and Asset paths are derived from it, never the other way round.
_Avoid_: section, group, tag

**Demo**:
The screen recording of one component in motion. Every Entry has exactly one.
_Avoid_: video, clip, preview

**Poster**:
The still frame shown in place of a Demo before it plays. Every Demo has exactly one.
_Avoid_: thumbnail, placeholder, cover

### The site

**Catalogue page**:
The client module that renders a set of Entries: the sort controls, the grid of
cards, and whichever Entry the visitor has opened. Three routes render one —
the home page, a Category listing and the bookmarks page — and they differ only
in their heading and where their Entries come from. It never fetches; it is handed
the Entries it renders.
_Avoid_: directory, listing, index, feed, results

### Media

**Asset**:
A Demo or a Poster — the binary files the catalogue points at, as opposed to the Entry metadata that points at them.
_Avoid_: media, file, resource

**Asset path**:
The string in an Entry that locates an Asset, e.g. `demo/buttons/split_button_hewad_mubariz.mp4`. An Asset path identifies **specific bytes**, not a Demo: re-recording a Demo yields a new Asset path, and a path is never reused for different bytes.
_Avoid_: src, url, filename

**Staging copy**:
The local, unpublished copy of an Asset. Not part of the repo and not deployed; the thing a Demo is recorded into and checked before it is published.
_Avoid_: local copy, original, working file

**Published Asset**:
The copy served to users. The only origin the production site reads from — there is no second origin to fall back to.
_Avoid_: CDN copy, remote, mirror
