# The maintainer's handoff: from Submission to Recording

Status: resolved
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

## Answer

**The existing skill gains a Submission entry point. No sibling.** The reasons, in order of weight:

- **Steps 2, 3, 4 and 9 are identical for both origins.** A sibling would carry a second copy of
  them, and this repo has already ruled on that shape once, in `hooks/use-remembered-set.ts`: "Every
  bug in them had two homes and every fix needed applying twice."
- **The skill already branches on Submission origin.** Step 10 exists only for a Submission and says
  so in its own heading. A sibling would split one decision across two documents while the branch
  that made it necessary stayed in the first.
- The ticket asks for completion criteria "as explicit as the existing ones", which is easier to
  keep in one document than to negotiate between two.

### What was edited

**Step 1** now asks the origin as well as the location, and gains a *From a Submission* branch naming
the exact command: `pnpm submissions:open <key>`, run from the repo root, with `--list` for the case
where the email is not to hand. Its done-criterion is `ffprobe` reporting `h264`, and it says what to
do when it does not: stop, and use `pnpm submissions:outcome`. It also records that the fetched file
lands in the repo root, which is gitignored for `/*.mp4`.

**Step 3** says the notification email already carries the name, the handles, the caption, the
Category and the source, because the form requires them, so the user confirms a set rather than
answering five questions again. That is what the form's field list was built for.

**Step 5** is the one the ticket asked to be explicit about, and the answer is that
**`compress-demo.sh` still runs**. Three reasons are written into the skill rather than left as folk
knowledge: the script is deterministic and a browser is not; nothing has verified that the browser's
output is H.264, because `/submit` has no `ffprobe` equivalent; and the script's invariants
(`yuv420p`, even dimensions, `+faststart`) are the ones the site depends on, with ADR-0003 making the
bytes immutable once published. The cost is stated too, so it is not a surprise: the browser's file
is CRF 28 and the script is CRF 20, so the published Asset becomes cleaner in container but no better
in detail. **Whether the script retires altogether is left where the map put it** and the skill says
so, so the next reader does not read this decision as that one.

**Failure modes** gained two, and the list now names the guard the ticket asked for by name:
*"Treating a Submission as already legitimate"* — unreviewed by definition, transcoded by a browser
and verified by nothing, with a Category the sender chose and a URL the sender typed — plus skipping
Step 5 for that reason. The existing Contributor-fuzziness entry was amended rather than duplicated:
a Submission is the case where a near-match is the *expected* shape of the mistake, because the name
came out of a text box a stranger filled in.

**Nothing else was touched.** `docs/agents/issue-tracker.md` and `CLAUDE.md` were left alone, which
is what this ticket's last bullet asks for when no new effort is created: this edits an existing
skill rather than starting one.
