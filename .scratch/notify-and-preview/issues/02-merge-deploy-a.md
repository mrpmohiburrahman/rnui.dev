# Merge deploy A and start the clock

Status: ready-for-agent
Type: task
Blocked by: 01

## Question

Deploy A — the rename plus `ui-ux-overhaul`'s behaviour work plus 13 PostHog events — is written,
tested and has never been in production. Merging it starts the six-week collection window that
decision 11 committed to, and everything else in this map that touches the live site waits behind
it.

**The deploy itself is the maintainer's to authorise**, not an agent's. `studio-dark/spec.md`
checkpoint 2 says so explicitly. An agent prepares it; a person ships it.

Also unblocks the six `ready-for-human` tickets in `.scratch/posthog-expansion/`, every one of
which has been waiting on exactly this merge.

## Acceptance

- Branch merged to `main` and deployed.
- A PostHog annotation created at the deploy timestamp, naming it deploy A.
- The `recording_id` property migration run, per `studio-dark/spec.md` — the day after, as that
  spec sequences it.
- The 277 `/recording/[id]` addresses serving, and the legacy redirects `middleware.ts` owns still
  alive.
- **The collection start date recorded in this ticket's Comments.** Decision 11's six-week window
  and its four-week review are both measured from it, and nothing else records it.
