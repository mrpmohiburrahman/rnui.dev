# The maintainer's handoff: from Submission to Recording

Status: ready-for-agent
Type: task
Blocked by: 09

## Question

The last mile. A Submission arrives in the maintainer's inbox and they publish it. Today that
path is `.claude/skills/add-recording/SKILL.md`, which assumes the maintainer starts from a local
video file and walks nine steps.

Decide and implement whether that skill **gains a Submission entry point** or whether this effort
adds a sibling. Read the whole skill before choosing — it has a deterministic sequence, explicit
completion criteria per step, and a "Failure modes" list that a careless edit will weaken.

At least three of its steps change when the Demo comes from a Submission:

- **Step 1 (Demo location)** — the file is in R2, and a browser compressed it, so it is not the
  raw capture the step assumes.
- **Step 5 (compress to Staging)** — `./scripts/compress-demo.sh` may now be redundant, because
  the browser already produced H.264/`yuv420p`/faststart. It must **not** be removed on that
  theory alone: the script is deterministic and a browser is not, so the skill has to say which
  bytes are trusted and why.
- **Step 9 (publish)** — unchanged, including that R2 writes stay maintainer-only and the skill
  never uploads.

`research/opening-a-submission.md` (ticket 04) says how the file is fetched. The map's *Not yet
specified* holds the open question of whether `compress-demo.sh` retires — do not settle it here.

## Acceptance

- The chosen entry point is edited or created, and its steps have completion criteria as explicit
  as the existing ones' — no step that advances on a guess.
- The skill states where the Demo comes from and how it is fetched, naming the exact command.
- The skill states whether `compress-demo.sh` runs, and **if it is skipped, the reason is written
  into the skill** rather than left as folk knowledge.
- The existing "Failure modes" list gains any new one this path introduces — at minimum, treating
  a Submission as already legitimate, and reusing an Asset path for new bytes (ADR-0003, the
  failure the current list already guards).
- The reuse rule holds: a Contributor who already exists is copied byte-identically from
  `grep -h "contributor:" data/*.ts`, never fuzzy-matched. A Submission is an untrusted source of
  a Contributor's name, so this matters more here than it did for a maintainer-supplied file.
- `docs/agents/issue-tracker.md` and `CLAUDE.md` are updated only if this creates a new active
  effort an agent should be told about; otherwise leave them alone.
