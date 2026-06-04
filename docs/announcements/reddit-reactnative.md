# Reddit — r/reactnative Post

> Do NOT post until user confirms. Draft only.

---

## Title

**I rebuilt rnui.dev with AI-assisted submissions and semantic search — 343+ React Native animations, fully open source**

---

## Body

Hey r/reactnative,

I've been maintaining [rnui.dev](https://rnui.dev) — a curated catalog of React Native UI animations and components — for a couple of years. It went dormant for a while, but I've spent the last month doing a proper revival. Here's what's new:

### What rnui.dev is

A searchable catalog of 343+ React Native animations across:
- **Reanimated** (shared element transitions, gesture-driven UIs, physics)
- **Skia** (canvas-based effects)
- **Moti** (declarative animations)
- **Gesture Handler** (swipe, pinch, drag)
- **Lottie** (vector animations)

Every entry links back to the original author's repo/Snack/gist with full attribution.

### What's new

**1. AI-assisted submissions (Codex ingest)**

```bash
npm run codex:ingest -- https://github.com/<author>/<repo>
```

This calls OpenAI to extract `title`, `author`, `category`, `description`, and `tags` from the repo README, validates the schema, and opens a PR automatically. If you've built something cool and want it cataloged, this is a one-command contribution.

**2. Natural-language search**

[rnui.dev/search](https://rnui.dev/search) — type "swipeable card" or "skeleton loader reanimated" and get semantically ranked results, not just keyword matches. Powered by OpenAI embeddings.

**3. Automated PR triage**

Every submission PR gets a Codex review checking schema compliance, duplicate IDs, and description quality before a human looks at it.

### Contribute

- Easiest: [open an issue](https://github.com/mrpmohiburrahman/rnui.dev/issues/new/choose) with the Animation Submission template.
- Power user: `npm run codex:ingest -- <url>` and the PR opens itself.
- Manual: fork, add to `data/<category>.ts`, run `npm test`, open PR.

Repo: https://github.com/mrpmohiburrahman/rnui.dev

Happy to answer questions about the Codex integration — it was an interesting build.

---

## Subreddit targets

- r/reactnative (primary)
- r/expo (if Expo-specific features highlighted)
- r/javascript / r/webdev (lighter touch, lead with the open-source angle)

## Notes

- Do not post the same text verbatim to multiple subreddits on the same day — adjust tone.
- r/reactnative generally responds well to "here's how I built X" posts, so consider adding a short technical section on the Codex pipeline.
- Best times: Tuesday–Thursday, 9–11am UTC.
