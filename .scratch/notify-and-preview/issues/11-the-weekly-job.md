# The weekly job that usually does nothing

Status: needs-triage
Type: task
Blocked by: 08

## PARKED — not being built, 2026-09-27

**The maintainer has set this aside: the weekly job is not being worked on now.** This is a pause,
not a rejection, and nothing about the ticket changed — 08 cleared its blocker on 2026-09-26 and the
spec below is still the spec.

`Status: needs-triage` is the tracker's word for *the maintainer owns the next move*, which is why it
is not `resolved`. `resolved` is terminal, and this ticket is not built: no diff over `data/*.ts`, no
schedule, no suppression check, no heartbeat. Marking it done would take it out of the record and
lose the one reminder that the Digest does not exist yet.

**To resume:** set `Status: ready-for-agent` and delete this block. `CLAUDE.md`'s
notify-and-preview paragraph says the frontier is empty until then, so `/implement` will not take it
by accident.

## Question

Every week: did any new Recording appear? If yes, send a Digest. If no, send nothing.

The check is a git diff — Recordings live in `data/*.ts` in the repo, so "what is new since the
last Digest" is answerable without any new infrastructure or any database. Decision 9 fixes the
rules: **≥1 genuinely new Recording id triggers a send; re-recordings do not count** (a new Asset
path on an existing Recording is invisible to a Subscriber, and silently swapping a Demo is not
news); **the newest 6 are shown, then "and N more →"**.

The interesting failure is silence. A job whose correct behaviour is usually "do nothing" is
indistinguishable from a job that is broken, and you would find out months later when someone asks
why they stopped hearing from you. It has to be observable when it does nothing.

Suppression is checked here, per whatever ticket 08 decided. That check is the difference between a
working channel and a spam complaint.

## Acceptance

- Diffs `data/*.ts` against the commit the last Digest was cut from; that commit is recorded
  somewhere durable, not inferred.
- New Recording **ids** trigger; changed Asset paths on existing ids do not.
- Newest 6 rendered, "and N more →" when there are more.
- Sends nothing at all when there is nothing new — no empty Digest, no "nothing this week" note.
- Suppression checked immediately before send, per ticket 08.
- Runs on a schedule without a person.
- **Observable on a quiet week** — a log line, a heartbeat, something that distinguishes "ran, found
  nothing" from "did not run". Cheapest thing that works.
- One runnable check over the diff logic: a new id triggers, a changed Asset path on an existing id
  does not, an empty diff sends nothing.
