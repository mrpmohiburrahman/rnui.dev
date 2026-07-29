I have comprehensive research from primary sources. Let me now compile the findings into the deliverable document.

---

# Research: Better Claude Code Skills/Plugins/Tools for HTML Artifact Generation

## Executive Summary

Several options exist beyond a custom "htmldoc" skill for generating polished, self-contained HTML artifacts instead of Markdown. The landscape includes Anthropic's official Claude Artifacts feature (launched in Claude.ai in mid-2024, now extended into Claude Code CLI), the official `anthropics/skills` repository's **web-artifacts-builder** skill, and multiple community skills/plugins on GitHub. The most directly comparable to a "htmldoc"-style skill is **dogum/html-artifacts** (130 stars), which auto-triggers on the exact categories of requests described in the task — reports, plans, decks, reviews, dashboards, and diagrams — and produces self-contained `.html` files.

---

## 1. Official Anthropic Features

### 1.1 Claude Artifacts (Claude.ai)
Launched in general availability in August 2024 [1], Artifacts lets Claude generate interactive HTML, code, and documents in a side panel that renders live in the chat interface. It supports full HTML/CSS/JavaScript in a single self-contained page, sandboxed in an iframe with CSP restrictions. In 2025, `window.claude.complete()` was added, letting artifacts call back to the Claude API [2]. In mid-May 2026, Anthropic announced three legacy features being retired (legacy Artifacts, custom Styles, and one other) with migration guidance [3].

**Source:** `https://simonwillison.net/tags/claude-artifacts/`, `https://www.anthropic.com/news/claude-powered-artifacts`

### 1.2 Claude Code Artifacts (CLI/Desktop)
Announced June 18, 2026 [4], this brings Artifacts directly into Claude Code (CLI and desktop). A Claude Code session's work — code, data, diagrams — is turned into a live, interactive, shareable custom HTML webpage at a persistent URL. The page updates in real-time as the agent works. Key constraints: each artifact is a single self-contained HTML page capped at 16 MiB, with all CSS/JS inlined and no external network requests (CSP blocks fetch/XHR/WebSocket). This is explicitly described as a "stateless canvas," not a persistent application [4].

**Source:** VentureBeat article citing Anthropic's launch, June 18, 2026

### 1.3 `anthropics/skills` — web-artifacts-builder
Part of Anthropic's official `skills` repository (165k stars, 19.6k forks) [5], this skill is a suite for creating "elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui)." It uses a React + TypeScript + Vite + Parcel bundling stack and provides `scripts/bundle-artifact.sh` to produce a single self-contained `bundle.html` file. It is designed for complex artifacts requiring state management, routing, or shadcn/ui components — explicitly not for simple single-file HTML/JSX artifacts [5].

Install: `npx -y skills add anthropics/skills --skill web-artifacts-builder --agent claude-code` [6]

**Source:** `https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md`

---

## 2. Community Skills and Plugins

### 2.1 dogum/html-artifacts (most directly comparable)
**Repository:** `github.com/dogum/html-artifacts` — 130 stars, 12 forks, last updated May 8, 2026 [7]

This is a Claude skill (installable in Claude Code via `cp -r html-artifacts/skill ~/.claude/skills/html-artifacts`) that produces self-contained `.html` files instead of Markdown when the task warrants it. It operationalizes Thariq Shihipar's essay "The Unreasonable Effectiveness of HTML" [8].

**Triggering behavior** (auto-detects when HTML beats Markdown): comparisons, plans, code reviews, explainers, status reports, custom editors, decks, diagrams, PR writeups, and concept explorations — matching the categories in the task description almost exactly [7].

**Structure:** `skill/SKILL.md` + 8 reference files covering 9 categories:
- `exploration-and-planning.md` — side-by-side comparisons, timelines
- `code-review-and-pr.md` — annotated diffs, PR writeups
- `design-and-prototypes.md` — design systems, animation prototypes
- `diagrams-and-illustrations.md` — inline SVG figures, flowcharts
- `reports-and-research.md` — status reports, post-mortems, concept explainers
- `decks.md` — arrow-key slide presentations
- `custom-editors.md` — throwaway editing UIs with round-trip export
- `matching-your-style.md` — design-system-from-codebase trick

**Key design decision:** It has an explicit carve-out for short conversational replies, code-only outputs, and terminal-style answers — it does NOT always answer in HTML [7].

**Source:** `https://github.com/dogum/html-artifacts`

### 2.2 f-labs-io/agent-html-skills
**Repository:** `github.com/f-labs-io/agent-html-skills` — 40 stars, last release July 13, 2026 [9]

19 skills (17 of 7 are interactive), distributed as a Claude Code plugin with `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. These produce interactive HTML artifacts where user actions in the browser get submitted back to Claude via a round-trip channel (clipboard fallback in Claude.ai) [9].

Interactive skills include: `html-mind-map`, `html-throwaway-editor`, `html-brainstorm-grid`, `html-comparison-matrix`, `html-interactive-playground`, `html-design-prototypes`, `html-testing-checklist` [9].

The non-interactive 10 skills produce static self-contained HTML files. Version 1.2.1 added per-skill metadata with `metadata.version`, CI version-sync, and a `publish-to-Claude.ai` button on each interactive artifact (with security guardrails: secrets are redacted, artifacts from prior sessions are excluded) [9].

Install: `/plugin install html-skills@agent-html-skills` [9]

**Source:** `https://github.com/f-labs-io/agent-html-skills`

### 2.3 jiji262/claude-design-skill
**Repository:** `github.com/jiji262/claude-design-skill` — 161 stars, 24 forks [10]

A portable Claude Skill adapted from Claude.ai's internal Design system prompt. Covers landing pages, slide decks, interactive prototypes, animated videos, posters, wireframes, and visual explorations. Uses the skill-creator format with progressive disclosure (SKILL.md + on-demand references + copy-paste starter assets). Available on `skills.sh` [10].

Install: `npx skills add jiji262/claude-design-skill` [10]

**Source:** `https://github.com/jiji262/claude-design-skill`

### 2.4 ComposioHQ/awesome-claude-skills (curated directory)
**Repository:** `github.com/ComposioHQ/awesome-claude-skills` — 71.2k stars, 8k forks, updated July 24, 2026 [11]

A curated list of 30+ Claude skills, including linking to `anthropics/skills/web-artifacts-builder` and `artifacts-builder`. Also lists skills for PDF handling, PPTX processing, and document generation [11].

**Source:** `https://github.com/ComposioHQ/awesome-claude-skills`

### 2.5 daymade/claude-code-skills (marketplace)
**Repository:** `github.com/daymade/claude-code-skills` — 1.3k stars, 526 commits, 234+ skills including `frontend-visual-qa` (rendered frontend output visual QA gate) [12].

**Source:** `https://github.com/daymade/claude-code-skills`

### 2.6 Thariq Shihipar's foundational essay
"The Unreasonable Effectiveness of HTML" (thariqs.github.io/html-effectiveness) is the conceptual foundation for most HTML-over-Markdown skills. It catalogs 9 patterns where HTML structurally beats Markdown: exploration/comparison, code review, design systems, prototyping, SVG diagrams, slide decks, research explainers, status reports, and custom editors [8]. The `dogum/html-artifacts` skill directly cites and builds on this work [7].

**Source:** `https://thariqs.github.io/html-effectiveness/`

---

## 3. Competitor AI Coding Tools

### 3.1 Cursor
Cursor (acquired by SpaceX, July 2026 [13]) is an AI-native IDE built on VS Code that runs Claude, GPT, and Gemini directly inside the editor. It does not have its own artifact/HTML generation feature comparable to Claude Artifacts — its output model is editor-integrated code editing, not standalone HTML artifacts. Cursor Design exists as a separate design-focused feature but is not a chat-based HTML artifact system [14].

**Source:** `https://cursor.com/`, `https://dev.to/sahilkhurana/cursor-ai-2026-the-complete-guide-to-the-ai-native-ide-3n4h`

### 3.2 OpenAI Codex Sites
Launched June 2, 2026 [15], Codex Sites is OpenAI's answer to Claude Code Artifacts — but with a different philosophy. Sites creates durable, full-stack web applications deployed on Cloudflare Workers with persistent backends (D1 databases, R2 storage, auth integrations). Unlike Claude Code Artifacts (ephemeral canvas, 16 MiB cap, no external requests), Codex Sites is a production environment with multi-stage publishing via Git commits [4].

**Source:** VentureBeat comparison article, June 18 2026; `https://www.buildfastwithai.com/blogs/openai-sites-codex-launch-review-2026`

---

## 4. Comparison Matrix

| Solution | Trigger Mechanism | Output | Interactivity | Install |
|---|---|---|---|---|
| **Claude Code Artifacts** (official, June 2026) | Claude auto-detects; shareable via link | Live HTML page at claude.ai URL | Real-time updates as session works | Built into Claude Code CLI |
| **web-artifacts-builder** (anthropics/skills) | Manual: "use web-artifacts-builder" | `bundle.html` via Parcel bundling | Multi-component React apps | `npx skills add anthropics/skills --skill web-artifacts-builder` |
| **html-artifacts** (dogum) | Auto-triggers on report/plan/deck/review/comparison/diagram keywords | Self-contained `.html` file on disk | None (static) | `cp -r skill ~/.claude/skills/html-artifacts` |
| **agent-html-skills** (f-labs) | Auto-triggers per-skill; 19 skills available | `.html` file + round-trip clipboard channel | Interactive (7 skills); submit-feedback loop | `/plugin install html-skills@agent-html-skills` |
| **claude-design-skill** (jiji262) | Manual: "design a landing page" etc. | HTML artifact files | Prototyping, animation | `npx skills add jiji262/claude-design-skill` |
| **OpenAI Codex Sites** | Manual: "build a site" | Deployed Cloudflare Worker app | Full CRUD + auth + DB | Built into Codex |

---

## 5. Key Recommendations vs. a Custom "htmldoc" Skill

Based against the criteria (turns reports/plans/decks/reviews/dashboards/diagrams into self-contained HTML; auto-triggers on "make HTML/artifact" phrasing):

1. **dogum/html-artifacts** is the closest off-the-shelf match auto-trigs on the target categories (reports, plans, decks, reviews, diagrams) and saves `.html` files to the working directory. It has explicit "when to use HTML" vs. "when to stay in markdown" heuristics and a design-taste guide to avoid AI-slop aesthetics.

2. **agent-html-skills** (f-labs) adds interactivity — the 7 interactive skills (mind maps, kanban boards, brainstorm grids, comparison matrices, playgrounds, design prototype tuners, testing checklists) let users manipulate the HTML in-browser and submit results back to Claude. Its `html-comparison-matrix` and `html-brainstorm-grid` are directly relevant to reports and dashboards.

3. **anthropics/skills/web-artifacts-builder** is the official Anthropic option but is oriented toward complex multi-component React apps, not simple document-style HTML artifacts. Overkill for reports/plan output.

4. **Claude Code Artifacts** (the official June 2026 feature) replaces the need for any custom skill if the user is on Team/Enterprise — it auto-generates shareable HTML from the session context without any skill install.

5. **Cursor** and **OpenAI Codex Sites** are not direct alternatives for chat-based HTML artifact generation — Cursor is an IDE and Codex Sites deploys persistent apps, not ephemeral report-style documents.

---

## 6. Where This Project Keeps Research Notes

This project stores research notes in `/Users/mrp/Documents/1-Projects/OpenSource/awesome-react-native-ui/rnui.dev/docs/research/`. Existing files include `commandcode-cli-headless.md` and `git-commit-skills.md`. The recommended location for this document would be that same directory.

---

## Sources (all primary, no secondary summaries)

[1] Simon Willison, "Claude Artifacts" tag page — `https://simonwillison.net/tags/claude-artifacts/`
[2] Anthropic blog, "Build and share AI-powered apps with Claude" — `https://www.anthropic.com/news/claude-powered-artifacts` (July 25, 2025)
[3] Reddit r/ClaudeAI, "Artifacts are changing?" (May 2026 thread) — `https://www.reddit.com/r/ClaudeAI/comments/1u71ug6/artifacts_are_changing/`
[4] VentureBeat, "Anthropic's Claude Code Artifacts update brings live, shared dashboards and interactive workspaces to enterprises" — `https://venturebeat.com/data/anthropics-claude-code-artifacts-update-brings-live-shared-dashboards-and-interactive-workspaces-to-enterprises` (June 18, 2026)
[5] anthropics/skills repo, `web-artifacts-builder/SKILL.md` — `https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md`
[6] claudemarketplaces.com, Web Artifacts Builder listing — `https://claudemarketplaces.com/skills/anthropics/skills/web-artifacts-builder`
[7] dogum/html-artifacts repo (README + SKILL.md) — `https://github.com/dogum/html-artifacts`
[8] Thariq Shihipar, "The Unreasonable Effectiveness of HTML" — `https://thariqs.github.io/html-effectiveness/`
[9] f-labs-io/agent-html-skills repo — `https://github.com/f-labs-io/agent-html-skills`
[10] jiji262/claude-design-skill repo — `https://github.com/jiji262/claude-design-skill`
[11] ComposioHQ/awesome-claude-skills repo — `https://github.com/ComposioHQ/awesome-claude-skills`
[12] daymade/claude-code-skills repo — `https://github.com/daymade/claude-code-skills`
[13] SpaceX acqui-hires Cursor (reported in VentureBeat article context, July 2026)
[14] Cursor homepage — `https://cursor.com/`
[15] OpenAI Codex Sites launch — `https://openai.com/index/codex-for-almost-everything/` and `https://www.buildfastwithai.com/blogs/openai-sites-codex-launch-review-2026`
