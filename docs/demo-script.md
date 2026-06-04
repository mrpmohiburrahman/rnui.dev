# Demo Script — 2-Minute Loom

> Record at: https://loom.com/record  
> Target runtime: 90–120 seconds. Stay at a comfortable pace — no rushing.

---

## Setup before recording

1. `pnpm dev` running at `localhost:3000`.
2. Terminal open in repo root.
3. Browser tab open on `localhost:3000`.
4. Second terminal tab ready for commands.
5. `OPENAI_API_KEY` set in `.env.local`.

---

## Script (timestamps are approximate)

### 0:00 — Hook (10 s)

> "React Native animation references are scattered across Twitter threads, Snacks, and GitHub repos. rnui.dev centralizes over 343 of them — with AI-assisted submission and search powered by OpenAI Codex."

Show the home page briefly. Scroll through the grid.

### 0:10 — Catalog overview (15 s)

- Click a category in the left nav (e.g., Carousels).
- Click one card to show the detail view (video preview, author, repo link).
- "Every entry has a reproducible source link and attribution."

### 0:25 — Natural-language search (20 s)

- Navigate to `localhost:3000/search`.
- Type: `swipeable card animation`
- Show results appearing.
- "Powered by OpenAI embeddings and a local cosine similarity index over all catalog entries."

### 0:45 — Codex ingest (35 s)

Switch to terminal:

```bash
pnpm codex:ingest -- https://github.com/software-mansion/react-native-reanimated
```

Walk through the output:
- "Fetching repo metadata via GitHub API…"
- "Calling gpt-4o-mini to extract catalog entry…"
- Show the extracted JSON (`title`, `author`, `category`, `description`, `tags`).
- "It would then append this to `data/<category>.ts` and open a PR — I'm skipping the git push here to keep the demo clean."

### 1:20 — Codex triage workflow (20 s)

Switch to browser, open GitHub PR #4 (or any submission PR):
- "Every PR automatically gets a Codex review against the catalog schema — checking for duplicate IDs, missing fields, and description quality."
- Show the workflow YAML briefly in the editor.

### 1:40 — Wrap (10 s)

> "The grant would fund re-indexing as the catalog grows, per-PR triage at zero cost, and a planned 'explain this animation' page using Codex to annotate source code. Links in the description."

---

## After recording

1. Paste Loom URL into `APPLICATION.md` under "Demo".
2. Update `docs/codex-grant/STATUS.md` — add Loom link.
