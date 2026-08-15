# rnui.dev

## Agent skills

### Issue tracker

Local markdown — issues and specs live as files under `.scratch/<feature>/`, not in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name, recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Implementing without a named ticket

`/implement` with no ticket named means **take the frontier** of the active effort. Do not ask which one, and do not re-plan — the spec is frozen.

Active effort: `.scratch/notify-and-preview/`. **It has no agent-takeable ticket left** as of 2026-08-15, when 12 went `ready-for-human`. 01, 02 and 04 are `resolved`; 03, 05, 06, 07 and 12 are `ready-for-human`; 08, 09, 10, 11 and 13 are `ready-for-agent` but every one of them is blocked — 08 by 05, 09 through 11 transitively, and 13 by 12. `/implement` should take none of them; say so and stop rather than reaching for the lowest number. An earlier version of this paragraph said ticket 12 "needs no Resend, no verifier and no DNS" — the last third was wrong, and it is what made 12 look agent-completable: the Preview needs a `preview` CNAME at Cloudflare, a Vercel domain-to-branch assignment and a new PostHog project, and no connector in this session can reach any of the three. What an agent *could* do there is built and committed. A ticket is available only when its `Status:` is `ready-for-agent` **and every number on its `Blocked by:` line is `resolved`** — `ready-for-human` is not `resolved`, and reading it as "near enough" is how a ticket gets built on a decision nobody made. What unblocks the effort is the maintainer discharging 05 (Resend's DKIM poll — every DNS record it asks for is already published and `dig`-confirmed, and the two SPF entries read `verified`, so nothing is left to *write*) and 03 (a bulk verifier run). 02 is `resolved`: its deploy shipped on 2026-08-15, and its last bullet — the PostHog property migration — was closed **not-applicable** by the maintainer, who accepted the single legacy `entry_opened` row rather than migrate it. That decision accepts one historical event and does **not** reopen ADR-0008's naming; `entry_id` and `entry_opened` must still never be emitted. It was charted by `/wayfinder`, so its frozen artifact is `map.md` rather than a `spec.md` — the twelve decisions under **Settled at charting** bind exactly as a spec's Constraints would, and `research/` holds two reports (consent/deliverability, and email service selection) that are not to be redone.

**SENDING HOLD, set by the maintainer 2026-08-15: no mail leaves this project until they lift it and every open issue in the effort is fixed.** It covers every outbound message — the staged Digest sends in ticket 10 *including the first one to the maintainer*, `pnpm broadcast:test` in ticket 05, and the live form submit in ticket 06, all three of which transmit real email. Prepare, stage, draft and dry-run freely; transmit nothing. A green DKIM check or a cleared blocker does **not** lift the hold — only the maintainer does. Full text in ticket 10.

`.scratch/studio-dark/` is still open but has **no agent-takeable work left**: 7 tickets are `resolved` and the remaining 8 are all `ready-for-human`, waiting on the maintainer rather than on an agent. Do not take one of these from `/implement`. Its `spec.md` Goals, Non-goals and Constraints still bind any code that touches the site, and its checkpoints still stop an agent.

1. Read that directory's `spec.md` first — or its `map.md`, for an effort charted by `/wayfinder`. Its Goals, Non-goals and Constraints, or a map's **Settled at charting** and **Out of scope**, are binding — in particular `api_host` stays `https://us.i.posthog.com`, Firebase not PostHog owns view and vote counts, `/products`, `?category=`, `view_count` and `vote_count` keep their public spelling, and the three stored browser keys `"bookmarkedItems"`, `"votedItems"` and `"viewedEntryIds"` keep their exact strings. Also read `CONTEXT.md` — the domain is **Recording** and **Contributor**, never Entry or author (ADR-0008).
2. Scan `issues/`. A ticket is available when its `Status:` is `ready-for-agent` and every number on its `Blocked by:` line is `resolved`. Lowest number wins. No `Blocked by:` line means nothing blocks it. **If `spec.md` names a ticket to take first, that beats the lowest number** — some orderings are about a data-collection clock rather than a dependency, and cannot be written as `Blocked by:` without lying.
3. Set that ticket's `Status:` to `claimed` and save before writing any code.
4. Implement only that ticket. Its `## Acceptance` is the definition of done.
5. On finish: append what you did under `## Comments`, and commit the code and the ticket together. Set `Status: resolved` only when every `## Acceptance` bullet is actually met. If one needs a deploy, a person's judgement, or data that does not exist yet, set `ready-for-human` instead and name what is left and who does it — `resolved` is terminal, and claiming it early is how the remainder gets lost.

Stop and hand back to the maintainer at the checkpoints listed in `spec.md`.

Finished efforts, not to be reopened: `.scratch/ui-ux-overhaul/` — all 14 tickets `resolved` as of 2026-07-31. Its one outstanding checkpoint, `posthog-expansion` ticket 09 steps 2 to 4, is discharged: the dashboard exists and the success criteria were agreed on 2026-08-01, before deploy A and before any redesign data.

Paused effort: `.scratch/posthog-expansion/`. Three tickets are `resolved`, five are `ready-for-human`, and two — 08 and 11 — are `needs-triage` and want a maintainer decision, not an agent. Their old blocker is spent: **deploy A shipped on 2026-08-15T00:45:37Z**, production `3d479be`, aliased to `rnui.dev`. What 02, 03, 04 and 09 now wait on is *traffic accumulating*, not a deploy. Re-read a ticket's own `Status:` before taking it. `.scratch/studio-dark/spec.md`'s Sequence is the authority on the order.

**Deploy A is not the merge of `feat/studio-dark`, and conflating them is a live hazard.** Deploy A was cut from `76651a3` and *deliberately held the Studio Dark commits back*; merging `feat/studio-dark` into `main` is **deploy B**, which `studio-dark`'s checkpoint 13 gates. An earlier version of this file described deploy A as "the merge of `feat/studio-dark` to `main`, which has not happened" — both halves were wrong, and an agent acting on it would ship deploy B past its gate while believing it was doing deploy A. Note also that `origin/main` is **not** an ancestor of `feat/studio-dark`: `main` carries a pnpm lockfile fix the branch never received, so deploy B is a real merge, not a fast-forward.
