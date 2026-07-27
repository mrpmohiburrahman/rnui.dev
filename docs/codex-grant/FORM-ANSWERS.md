# Codex for Open Source — Form Field Answers

> Paste these into https://openai.com/form/codex-for-oss/
> Fields already pre-filled on form: First name, Last name, Email, GitHub username, GitHub repo URL, Primary maintainer role.

---

## Why does this repository qualify?

```
rnui.dev is a curated catalog of React Native animations. 343 stars, 343+ entries, 19 categories — Reanimated, Skia, Moti, Gesture Handler, Lottie. Pretty much all of it built by one person: 98.8% of 250 commits, including 13 in the last seven days.

Traffic sits around 229 unique visitors a week, ~200 WAU as of June 2026 per PostHog.

Codex is already wired in. Paste a GitHub URL and it opens a schema-valid PR. Triage runs automatically. Search uses embeddings so you can describe what you're looking for instead of guessing the right keyword.
```

---

## How will you use API credits for your project?

```
The credits go toward keeping the whole thing running without anyone babysitting it.

That means re-indexing the catalog as it grows (343+ entries now, using text-embedding-3-small), automated PR triage through codex-triage.yml so new submissions don't pile up waiting on a maintainer, and the codex-ingest.ts pipeline that takes a GitHub URL and spits out a schema-valid catalog entry ready to merge.

There's also a planned "explain this animation" page — annotated source code, inline, so people can actually understand what they're looking at instead of just copying it.

If that works the way I think it will, 200+ community submissions in 12 months is realistic.
```

---

## Anything else we should know?

```
The Codex integration is live on main — not just planned. scripts/codex-ingest.ts, .github/workflows/codex-triage.yml, and /search with OpenAI embeddings are committed and tested.
The project was quiet for about six months. Then May hit and things moved fast — 13 commits in the last seven days. Organic traffic started showing up from chatgpt.com and r/reactnative, which is the kind of thing you don't really plan for.
```

---

## Checkboxes

- [ ] Codex Security
- [x] API credits for my project

## OpenAI Organization ID

```
org-SGHEIGRYoCJtkE9IKR9YJTpf
```
