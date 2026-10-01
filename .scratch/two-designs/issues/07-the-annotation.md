# 07 — The deploy-B annotation on dashboard `1937576`

Status: ready-for-agent
Blocked by: 04

## Problem

Dashboard `1937576` exists to attribute a change to a cause. It carries deploy A's
annotation; deploy B's was named in `studio-dark`'s Sequence and in no ticket's acceptance.

That gap is now **wider**, not narrower. There is no deploy between deploy A and deploy B —
`www` and `old` are two hosts in one PostHog project with no cut between them. The annotation
is therefore the *only* thing that separates the previous design's numbers from the current
design's. Without it every chart crossing the boundary reads as one continuous trend, and a
40% drop looks like a normal Tuesday.

## Work

1. Create the annotation on dashboard `1937576` at the moment of the host split.
2. The body names: the sha `main` was deployed at, that `www.rnui.dev` moved to the
   studio-dark Design, that `old.rnui.dev` serves the previous Design, and that the boundary
   is a **host** boundary rather than a deploy one.
3. Add one line nobody has to guess: **every insight on this dashboard should filter
   `$host` to `www.rnui.dev`**, and why — both hosts share the project, and the Archive's
   counters are stale.
4. The annotation must sit at the deploy time, not at the time this ticket was written.
   Ticket 04's deploy timestamp is the reference; do not use `now` as a substitute.

## Acceptance

- The annotation exists on dashboard `1937576`, carries the deployed sha, and is timestamped
  at the cut rather than at the moment of writing.
- Its body names both hosts and the `$host` filter.
- Deploy A's annotation is untouched.
