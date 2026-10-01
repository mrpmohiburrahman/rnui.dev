# Close the four items the 2026-08-04 QA pass left open

Work in `/Users/mrp/Documents/1-Projects/OpenSource/awesome-react-native-ui/rnui.dev`, on branch
`feat/studio-dark`. Read `CLAUDE.md`, `.scratch/studio-dark/spec.md` and
`.scratch/posthog-expansion/spec.md` before you touch anything — their Goals, Non-goals,
Constraints and Checkpoints bind this work.

A full QA pass ran on 2026-08-04 and landed as commit `0bf8b85` ("fix(qa): nine defects found
testing the two efforts"). It fixed nine defects and left four items open because each needed
either a deploy or a decision. This prompt closes all four, as far as an agent honestly can.

## Facts already established — do not re-derive these

Verified during the QA pass. Check them if you like; do not spend a subagent rediscovering them.

| Fact | Evidence |
|---|---|
| Branch is 60 commits ahead of `main` | `git rev-list --count main..HEAD` |
| **Deploy A's SHA is `76651a3`** | `4a663a5` is the first Studio Dark *code* commit ("put the Studio Dark design system in Tailwind"); its parent is `76651a3`, which carries the `ui-ux-overhaul` behaviour, the 13 PostHog events and the rename, with no restyle |
| `checkpoint-13-gate.md` says no such ancestor exists | Its *Does not prove (hand-offs)* section claims `feat/studio-dark` is "a single linear Studio Dark build with no pre-Studio-Dark ancestor to diff against". That is false, and steps 10–12's whole hand-off rests on it |
| Counter collection falls back to production | `lib/counters-firestore.ts:27` — `process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION \|\| "rnui"`, with a startup `console.warn` at `:32-36` that says so |
| The e2e suite writes real votes | `tests/e2e/vote.spec.ts` and `tests/e2e/posthog-events.spec.ts` click the real Vote control, which runs the server action |
| Measured damage | `vote_count` on Recording `01KAY9B2AMN590C8YP5WTNDTHQ` ("Wheel Picker") went **402 → 419** across one session of test runs |
| `NEXT_PUBLIC_*` is inlined at build time | So setting the variable only in the test process changes nothing about what a already-built server writes |
| Hero copy now reads "Each one is a silent screen recording…" | `components/hero.tsx`, changed in `0bf8b85`. Ticket 06's Open question 1 asked for exactly this decision and is still written as open |
| The footer's twin sentence was already decided | `components/site-footer.tsx:25-27` carries the comment recording it |
| Two contrast pairs fail | `● LIVE` dark and `NEW` dark, both **1.22:1** against a light Poster. Table and method in `.scratch/studio-dark/checkpoint-13-gate.md`; reproducible via `pnpm exec tsx scripts/checkpoint-13-contrast.ts` |
| Green baseline | 246 unit tests and 270 Playwright tests pass at `0bf8b85` |

**The build trap.** Every build and every Playwright run in this repo must carry
`NEXT_PUBLIC_CDN_URL="http://localhost:3000"`, or the Assets 404 and the tiles are blank boxes:

```
NEXT_PUBLIC_CDN_URL="http://localhost:3000" pnpm build
NEXT_PUBLIC_CDN_URL="http://localhost:3000" pnpm start          # background
pnpm test
NEXT_PUBLIC_CDN_URL="http://localhost:3000" npx playwright test
pnpm exec node scripts/visual-qa.mjs                            # 40-capture contact sheet
```

Use `pnpm exec node`, not bare `node` — bare `node` hits an nvm shell-function error in this
environment.

## Non-negotiables

1. **Do not deploy, merge, push, or open a PR.** Task 1 ends in a hand-back. Deploying is the
   maintainer's, and `spec.md` treats it as such.
2. **Do not write to Firestore to "repair" the 17 inflated votes.** Adjusting production counters
   is a data mutation the maintainer authorises, not a cleanup an agent performs. Report the
   number; leave the data alone.
3. **Do not repaint the two failing contrast colours in place.** Decision 2 says the mock ships as
   drawn and `checkpoint-13-gate.md` records the repaint as the maintainer's call. Task 4 produces
   a costed proposal and an appliable patch, not a change to the shipped palette.
4. `spec.md`'s Constraints hold: `api_host` stays `https://us.i.posthog.com`; Firebase
   (`lib/counters-firestore.ts`) owns view and vote counts; `/products`, `?category=`,
   `view_count` and `vote_count` keep their public spelling; the three stored browser keys
   `"bookmarkedItems"`, `"votedItems"` and `"viewedEntryIds"` keep their exact strings; the domain
   is **Recording** and **Contributor**, never Entry or author (ADR-0008).
5. `Status: resolved` only when every one of a ticket's `## Acceptance` bullets is actually met.
   Anything waiting on a deploy, data that does not exist yet, or a person's judgement is
   `ready-for-human`, and you name what is left and who does it.
6. Leave the suite green. 246 unit and ≥270 Playwright tests passing, and any test you add must
   fail if its fix is reverted — check that by actually reverting it once.

## How to run this — parallel, on cheap models

Four tasks. Tasks 1–4 below are independent in their *investigation*, but **two of them write to
`.scratch/studio-dark/checkpoint-13-gate.md`**, so the writes are serialised deliberately.

Phase 1 — three agents in parallel, `sonnet`, each returning findings rather than editing the gate
doc:

- **A** → Task 2 (the Firestore fix). The only task that changes application or test code.
- **B** → Task 4 (contrast candidates + patch + rendered proof).
- **C** → Task 3 (record the hero decision) and the ticket/spec cross-references from Task 1.

Phase 2 — one agent, `sonnet`, serial: fold B's and C's findings plus Task 1's correction into
`checkpoint-13-gate.md` in a single pass, so the two edits cannot conflict.

Phase 3 — one agent, `haiku`: run the verification commands and report pass/fail verbatim. It
verifies, it does not fix; anything red comes back to whoever wrote it.

Use `haiku` for any pure lookup (find a line number, list files, read a status line). Do not put
`opus` on any of this — every task here is small and well-specified.

---

## Task 1 — Unblock deploy A, and correct the record that says it is blocked

The gate doc's claim that this branch has no pre-Studio-Dark ancestor is false, and it has
consequences beyond one sentence: `checkpoint-13-gate.md` hands steps 10–12 (the LCP/CLS/INP
before-and-after) to the maintainer *because* it believed no "before" SHA existed. `76651a3` is
that SHA.

Do:

1. Confirm `76651a3` independently — that `4a663a5` is the first commit touching Studio Dark
   styling, and that `76651a3` contains the rename, the 13 events and the behaviour work. Say how
   you confirmed it.
2. Verify `76651a3` still builds and its tests pass, in a **`git worktree`** so the working tree is
   untouched. Build it with the `NEXT_PUBLIC_CDN_URL` trap above. Remove the worktree afterwards.
   If it does not build, stop and report that — it changes the whole plan.
3. Correct `checkpoint-13-gate.md`'s *Does not prove* section: name `76651a3`, say the before-arm
   is runnable on this machine after all, and keep the correction dated and additive in the style
   the rest of that file already uses. **Hand this text to the Phase 2 agent; do not edit the file
   from Task 1.**
4. Check every other file that repeats the "no ancestor" claim — at minimum grep `.scratch/` and
   `docs/` for it — and list them for Phase 2.
5. Write the hand-back the maintainer needs, into
   `.scratch/studio-dark/deploy-a-handback.md`: the exact SHA, the exact commands to cut and
   deploy it, the PostHog annotation text and the project it belongs to (117415), and which
   `posthog-expansion` tickets come unblocked the moment it lands (read their `Status:` and
   `Blocked by:` lines rather than trusting this prompt's count).

Acceptance: `76651a3` is confirmed and proven to build; the false claim is queued for correction
with every one of its copies listed; `deploy-a-handback.md` exists and a person could follow it
without reading anything else.

## Task 2 — Stop the e2e suite writing to the production Firestore collection

The suite already refuses to bill views and pageviews — `beforeEach` aborts `**/demo/**` and
`**/*posthog.com/**`, with comments saying "a CI run is not a site visit". Votes were the hole in
that rule, and they went to the live collection.

The requirement, not the implementation:

> After this change, running the Playwright suite must not be able to increment a counter in the
> `rnui` collection — **including when a server is already running on port 3000 that was built
> without the variable set.** `playwright.config.ts` currently has
> `reuseExistingServer: !process.env.CI`, so "the developer already had `pnpm start` up" is the
> normal case, not the edge case.

Pick the approach yourself; the trap to design around is that `NEXT_PUBLIC_FIRESTORE_COLLECTION`
is inlined at build, so a test-process environment variable does not describe what the running
server will do. Whatever you choose has to *fail loudly* rather than silently write to production.

Leave one runnable check behind that fails if the guard is removed. Do not weaken the two vote
specs into not exercising the real control — the behaviour they pin is real and worth keeping.

Do not change the production default at `lib/counters-firestore.ts:27` or delete its warning:
an unset variable meaning production is deliberate, and the warning is the only thing that made
this findable.

Acceptance: the suite passes; a run provably cannot touch `rnui`; the guard has a test; the
measured 402 → 419 damage is written into the commit message so the reason survives.

## Task 3 — Close ticket 06's Open question 1

`.scratch/studio-dark/issues/06-hero-stats-and-headings.md` Open question 1 asks whether the hero
sub-line ships the mock's `Every entry…` or applies the rename, and notes that applying it "would
need rewriting rather than substituting" because `Every recording is a silent screen recording`
repeats the word. The question also says the footer's twin is ticket 04's and to "decide both at
once" — and ticket 04 already decided it, in the direction of the rename.

Commit `0bf8b85` shipped the rewrite as `Each one is a silent screen recording of a real phone,
and a link to the repo that made it.`

Do: record that in the ticket — the question, what shipped, the two things that decided it
(spec.md decision 3, and `site-footer.tsx:25-27` having already gone that way), and the fact that
the *wording* is still the maintainer's to change even though the *direction* is settled. Dated,
in `## Comments`, in that file's existing style. Then check whether ticket 04 and ticket 09 point
at this open question and need a line saying it is answered.

Do not change the string. Do not mark anything `resolved` that is not.

Acceptance: a reader of ticket 06 alone can see the question is answered, by what, and what is
still open about it.

## Task 4 — Cost the two failing contrast pairs, and make the fix one command away

`● LIVE` dark and `NEW` dark sit at **1.22:1** over a light Poster — the bound, not a real Poster,
but a real Poster can approach it. `scripts/checkpoint-13-contrast.ts` already composites the
`rgba()` layers over `#000000` and `#FFFFFF` and takes the worse; reuse it rather than writing a
second compositor.

Do:

1. Find candidate colours for both chips that clear **4.5:1 at both bounds**, staying inside the
   Specimen's palette family — these are Studio Dark's own accent and amber, and a candidate that
   clears the ratio by abandoning the hue is not a candidate. Prefer raising the fill's opacity or
   darkening the text over inventing a new hue; say which lever you pulled and why.
2. Prove each candidate with the existing script — the same worse-of-two-bounds method, printed as
   a table in the same shape as the one already in the gate doc.
3. Render it: capture the tile in dark mode with the current colours and with the candidates, over
   a genuinely light Poster, and write both images next to the proposal so the cost is visible and
   not only arithmetic. `scripts/visual-qa.mjs` shows the capture pattern.
4. Produce the change as a patch file, not as an edit: `.scratch/studio-dark/contrast-repaint.patch`,
   appliable with `git apply`, touching only the token values.
5. Hand Phase 2 the proposal text for the gate doc, including the honest counter-argument —
   decision 2 says the mock ships as drawn, and repainting makes the built site differ from
   `Tile.dc.html`.

Acceptance: a table proving both candidates clear 4.5:1 at both bounds; two rendered images; a
patch that applies cleanly to `0bf8b85` or later; the shipped palette unchanged.

---

## Verification, before any commit

```
pnpm check-types
pnpm test
NEXT_PUBLIC_CDN_URL="http://localhost:3000" pnpm build
NEXT_PUBLIC_CDN_URL="http://localhost:3000" pnpm start          # background
NEXT_PUBLIC_CDN_URL="http://localhost:3000" npx playwright test
pnpm exec node scripts/visual-qa.mjs
```

Report the counts verbatim. `pnpm lint` has three pre-existing warnings in
`placeholders-and-vanish-input.tsx` and `input.tsx` that predate this work — do not fix them here,
but do not let the count grow either.

`scripts/visual-qa.mjs` writes 21MB into `.scratch/studio-dark/visual-qa/`, which is gitignored.
Do not commit it. To look at the sheet: `python3 -m http.server 8099 --bind 127.0.0.1` from that
directory.

## Committing

One commit per task, each standing alone and revertable, in the repo's existing style — a
lowercase Conventional Commits subject under 50 characters, and a body that says *why* rather than
restating the diff. Commit the ticket or doc edit together with the code it describes. No AI
attribution or co-author trailers.

## Report back

For each of the four tasks: what you did, what you proved and how, and what is left for the
maintainer with their name on it. Be explicit that Task 1 ends in a hand-back and that Tasks 3 and
4 end in decisions that are still theirs — a task that finished its agent-executable half is not a
task that is done, and saying otherwise is how the remainder gets lost.
