# rnui.dev

A catalogue of React Native UI components, each shown as a short screen recording. The site is metadata plus media: the metadata lives in the repo, the media does not.

## Language

### The catalogue

**Recording**:
One catalogue record — a Contributor, a caption, source links, a Category, and the paths to its Demo and Poster. Recordings live in `data/<category>.ts`.
_Avoid_: entry, item, card, component, animation

**Contributor**:
The person whose work a Recording shows, and the value of a Recording's `contributor` field. Contributors are public catalogue data: their name and their profile links are published, and 23 of them account for all 277 Recordings.
_Avoid_: author, creator, owner, submitter, user

**Category**:
The UI kind a Recording belongs to (Buttons, Sliders, Tabbars…). One `data/` file per Category. Its display name is the canonical form — the lowercase spellings that appear in URLs and Asset paths are derived from it, never the other way round.
_Avoid_: section, group, tag

**Demo**:
The screen recording of one component in motion. Every Recording has exactly one.
_Avoid_: video, clip, preview

**Poster**:
The still frame shown in place of a Demo before it plays. Every Demo has exactly one.
_Avoid_: thumbnail, placeholder, cover

### The site

**Catalogue page**:
The client module that renders a set of Recordings: the sort controls, the grid of
cards, and whichever Recording the visitor has opened. Three routes render one —
the home page, a Category listing and the bookmarks page — and they differ only
in their heading and where their Recordings come from. It never fetches; it is handed
the Recordings it renders.
_Avoid_: directory, listing, index, feed, results

**Remembered set**:
Recording ids held in one visitor's own browser — the Recordings they bookmarked, or the
ones they voted on. Two exist, one per stored key. The key is a record in somebody's
browser rather than an identifier, so it is never renamed: renaming it discards what
they saved. This survived the rename to Recording — the constants moved, the stored
strings `"bookmarkedItems"` and `"votedItems"` did not. Nothing on the server can read
a Remembered set.
_Avoid_: favourites, likes, saved items, selection, local state

### Media

**Asset**:
A Demo or a Poster — the binary files the catalogue points at, as opposed to the Recording metadata that points at them.
_Avoid_: media, file, resource

**Asset path**:
The string in a Recording that locates an Asset, e.g. `demo/buttons/split_button_hewad_mubariz.mp4`. An Asset path identifies **specific bytes**, not a Demo: re-recording a Demo yields a new Asset path, and a path is never reused for different bytes.
_Avoid_: src, url, filename

**Staging copy**:
The local, unpublished copy of an Asset. Not part of the repo and not deployed; the thing a Demo is recorded into and checked before it is published.
_Avoid_: local copy, original, working file

**Published Asset**:
The copy served to users. The only origin the production site reads from — there is no second origin to fall back to.
_Avoid_: CDN copy, remote, mirror
