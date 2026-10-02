# two-designs

Charted 2026-10-02 from a `/grilling` session. There is no `spec.md` — this effort was
charted by interview, not derived from one, so **Settled at charting** below binds the same
way a spec's Constraints would.

## Destination

`www.rnui.dev` serves the studio-dark design and `old.rnui.dev` serves the design it
replaced. Both are live, both are public, both are noindexed-by-neither — the Archive is
noindexed, the live site is indexed as it always has been — and both report to PostHog
project 117415, separable on `$host`. `preview.rnui.dev` 301s to the root.

The maintainer's phrase for it: *"the site should now completely online with the current
branch's design."*

## Settled at charting

Twenty-two decisions. Every one was asked and answered; none is a default.

### Branch topology

1. `main` is re-cut from `feat/studio-dark`, so `main` keeps meaning "what visitors see"
   in every spec that references it. The merge is real, not a fast-forward: `main` was not
   an ancestor (merge-base `3d479be`, 2 behind, 114 ahead).
2. The previous design's branch is named **`old`**, matching the hostname and the glossary.
3. `feat/studio-dark` is deleted once `main` is re-cut. A `feat/` branch whose work is
   merged reads as unmerged work in every future `git branch` listing.

### Hosting

4. **Two Vercel projects**, `rnui-dev` and `rnui-dev-archive`. Not two branches of one:
   Vercel scopes environment variables to *environments*, not branches, so a branch
   deployment always receives the Preview set — the Archive would get the wrong PostHog
   project and the wrong Turnstile hostnames, and neither is correctable per-branch.
5. `www.rnui.dev` → `rnui-dev`, Production branch = studio-dark.
6. `old.rnui.dev` → `rnui-dev-archive`, Production branch = `old`.
7. `preview.rnui.dev` 301s to `www.rnui.dev` after the swap. It is already noindexed, and
   `lib/preview-survey.ts`'s silencing argument depended on this 301 existing.
8. The Archive is frozen permanently. If it drifts it stops being the reference point the
   comparison is measured against, which is the only reason it gets its own project.
9. The Archive's `NEXT_PUBLIC_SITE_ORIGIN` is pinned to `https://old.rnui.dev`.
   `app/actions/subscribe-email.ts` otherwise falls back to the attacker-controlled `Host`
   header, which that file's own comment calls a phishing primitive.

### The Archive's behaviour

10. Noindexed, with `rel=canonical` to `www`. Otherwise it serves all 277 Recordings as
    indexable duplicate content while `next-sitemap.config.js` claims the same canonical
    URLs for both.
11. `/submit` 404s. Turnstile's hostnames are scoped per environment and `old.rnui.dev` is
    in none of them, so the form would refuse every visitor anyway.
12. `/subscribe` and `/contactus` keep working — the Archive is read-only as a catalogue,
    not as a form target.
13. The Remembered set is per-origin, so a visitor who bookmarked on `www` sees an empty one
    on the Archive. Accepted silently; telling them would need the Archive to know a host it
    is not.

### Analytics

14. Both hosts report to **project 117415**, the one holding deploy A's five weeks, dashboard
    `1937576`, and both surveys. The live site does **not** inherit 559028 — splitting the
    attribution is what the whole two-annotation mechanism exists to prevent.
15. **No `$host` plumbing is needed.** posthog-js attaches `$host` to every capture from the
    client's own `location`. Sharing one project is a filter, not a blend. What sharing costs
    is discipline: every surviving insight needs a `$host` filter, and `person_profiles:
    "always"` makes one browser one person across both hosts.
16. The Archive fires all fourteen events and `$pageview`. It is a frozen design, not a dead
    one, and the question worth asking about it is answered by `$pageview` alone.
17. The deploy-B annotation is created on dashboard `1937576` at the host boundary. With
    both hosts in one project and no deploy in between, it is the only thing separating
    deploy A's numbers from deploy B's.
18. Survey `01a00821` "Try the Preview" is **stopped**. It tells visitors a redesign exists
    elsewhere; on the Archive it is false, and on `www` it is absurd.
19. Survey `019fbc46` "Didn't find what you were looking for?" is anchored away from
    `old.rnui.dev`. `/products` is served by both hosts and `icontains` matches both.

### Surveys and gates

20. `components/preview-survey.tsx` is **deleted**, not re-gated. It was the only survey
    getting answers, and its first question is unanswerable once the previous design is a
    real link rather than a description.
21. `studio-dark` checkpoint 5 is overridden by the maintainer. Contrast, keyboard and
    reduced-motion verification and the LCP/CLS/INP measurement are outstanding. ADR-0011
    exists so the repo never reads as though the gate had been met.
22. The keyboard-parity specs ticket 15 reported failing are **green, 3/3** — the failure was
    real on 2026-08-04 and was fixed by the provider assigning `window.posthog` at init.

## Domain

`CONTEXT.md` gains **Design**, **previous design** and **Archive**. The retired vocabulary —
`Studio Dark`, `deploy A`, `deploy B`, `the old rnui.dev`, `legacy` — is recorded under
`_Avoid:` rather than left to be rediscovered.

## Out of scope

- **Backporting anything to the Archive.** Frozen is frozen, including fixes.
- **Migrating or merging PostHog projects.** 559028 keeps whatever it already holds.
- **Changing what a view is.** ADR-0007 stands, on both hosts.
- **Moving view or vote counts off Firebase.** `lib/counters-firestore.ts` still owns them.
- **Re-opening the eight `ready-for-human` studio-dark tickets.** They stay as they are.
- **Authenticating either host.** Both are public content. `CLAUDE.md`'s standing warning
  that Vercel Authentication is off stands and is not resolved by this effort.

## Tickets

| # | Ticket | Status |
|---|---|---|
| 01 | re-cut `main` from `feat/studio-dark` | ready-for-agent |
| 02 | the `old` branch, and the three Archive-side code changes | ready-for-agent |
| 03 | `rnui-dev-archive`: create, link, env, assign `old.rnui.dev` | ready-for-agent |
| 04 | `www.rnui.dev` → studio-dark, and retire `preview.rnui.dev` | ready-for-human |
| 05 | stop survey `01a00821` | blocked on PostHog MCP auth |
| 06 | anchor survey `019fbc46` away from the Archive | blocked on PostHog MCP auth |
| 07 | the deploy-B annotation on dashboard `1937576` | blocked on PostHog MCP auth |
| 08 | `$host` filter on every surviving insight | blocked on PostHog MCP auth |
| 09 | replace the deploy-A/B vocabulary in `CLAUDE.md` and four specs | ready-for-agent |

04 is the maintainer's because it is the outward-facing, hard-to-reverse cut: it is the
moment visitors see the new design. 05–08 are blocked on one action — `opencode mcp auth
posthog` — and not on judgement.
## Closed 2026-10-02

All nine tickets resolved. Nothing outstanding except what belongs to a person.

| # | Ticket | Outcome |
|---|---|---|
| 01 | re-cut `main` from `feat/studio-dark` | `36921ef`, 118 commits. `CLAUDE.md`'s claim that `main` carried a lockfile fix the branch never received was **false** — `main` changed nothing in `package.json` since the merge-base. |
| 02 | the `old` branch | `539f042` + four commits. `noindex` on all three Archive hosts. |
| 03 | `rnui-dev-archive` | live at `old.rnui.dev`, env SHA-verified against `.env.local`. |
| 04 | the cut | `www` serves the current Design, `preview` 308s to it. |
| 05 | stop survey `01a00821` | stopped; description records why. |
| 06 | anchor survey `019fbc46` | `regex` on `^https://(www\.)?rnui\.dev/products`, tested against 8 URLs first. |
| 07 | the annotation | `471250` at `2026-10-02T01:40:25Z` — the deployment's *ready* time. |
| 08 | `$host` filter | dashboard-level, on all three dashboards rather than 24 queries. |
| 09 | retire the vocabulary | `CLAUDE.md` rewritten; four closed `.scratch/` records given dated supersession notes rather than rewritten. |

`feat/studio-dark` deleted from local and `origin` once `main` carried it. Two live branches:
`main` and `old`.

### Three things that were true when charted and stopped being true

**The `$host` filter needs no code.** Decision 15 assumed plumbing. posthog-js 1.409 already
attaches `$host` to every capture from the client's own `location`, so decision 15 was free —
what it costs is discipline, and it is now applied at the dashboard level on all three
dashboards instead of by editing 24 queries.

**`/submit` never existed on the previous Design.** Decision 11 said to take the form down on
the Archive. There was no form to take down; the route is current-Design-only. Decision 12 —
keeping `/subscribe` and `/contactus` — is what actually had work, and both work.

**Ticket 15's keyboard-parity specs were already green.** They were reported 3/3 failing on
2026-08-04 and were fixed by the provider assigning `window.posthog` at init. Re-running a
ticket's recorded failure is cheaper than believing it.

### What belongs to a person

- **`studio-dark`'s eight `ready-for-human` tickets**, unchanged and deliberately not taken.
  Checkpoint 5 — contrast, keyboard, reduced-motion, and the LCP/CLS/INP measurement — remains
  outstanding. ADR-0011 records that the Design shipped anyway.

### What was closed afterwards

**2026-10-02 — the retired project's name.** Project 559028 was `rnui.dev Preview`, which
stopped being true the moment `preview.rnui.dev` began 308-ing to `www`. Renamed
**`rnui.dev old`**, with a `product_description` recording what it does and does not hold,
because the trap is real: its data is the *current* Design's behaviour during its preview
era, not the previous Design's numbers. Those are in 117415, as are the Archive's. Nothing
writes to it any more — verified by compiling the key out of both live builds rather than by
trusting the env var. ADR-0010 carries the reasoning.

Project 117415 keeps its name, `rnui.dev dashboard`. It is now the only project any Design's
traffic has gone to, live or archived, so the name is thinner than it was rather than wrong.
