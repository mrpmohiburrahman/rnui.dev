# Why `dotfiles-symlink-guard` reports a repair every session

Recorded 2026-07-29. This is a note about the maintainer's local Claude Code
environment, not about rnui.dev. It lives here only because the message shows up
at the top of every session started in this repo, and looks like it belongs to
this repo. It does not.

## The message

```
[dotfiles-symlink-guard] ~/.claude wiring to the dotfiles repo changed.
  repaired: plugins/known_marketplaces.json (link was overwritten; live copy saved to repo, relinked)
Mention this to the user; repaired files show up as uncommitted changes in ~/dotfilesOSX.
```

## Where it comes from

`~/.claude/hooks/dotfiles-symlink-guard.sh`, wired as a `SessionStart` hook. It
runs in **every** project, because it guards `~/.claude` — the Claude Code
config directory — and never looks at the working directory. Seeing it inside
rnui.dev carries no information about rnui.dev.

Everything in `~/.claude` that matters is a GNU Stow symlink into
`~/dotfilesOSX/claude/.claude`, so editing the live file edits the repo. The
hook walks `~/dotfilesOSX/claude/.claude/symlinks.txt` and repairs any entry
that has stopped being a symlink.

## Why it fires every time

`plugins/known_marketplaces.json` was listed in `symlinks.txt`, but it
is not config — it is application state that Claude Code rewrites on its own
schedule. It writes it the safe way: new file, then rename over the old path.
A rename replaces the symlink with a regular file.

That produces a loop with no exit:

1. Claude Code refreshes marketplace state and renames a new file over the link.
2. `known_marketplaces.json` is now a regular file. The dotfiles repo has
   silently stopped tracking it.
3. Next session start, the hook notices, copies the live contents into the repo,
   recreates the link, and reports the repair.
4. Claude Code refreshes again. Back to step 1.

Observed directly: at the session start on 2026-07-29 the hook repaired the
link; twenty minutes later the same path was a regular file again (mode `644`,
no `->` in `ls -la`), alongside a `known_marketplaces.json.bak-clobbered`
sibling the hook had left behind.

The hook is behaving exactly as designed. The design assumes files change when a
human changes them.

## What actually differs

The entire uncommitted diff the hook creates in `~/dotfilesOSX`:

```diff
-    "lastUpdated": "2026-07-28T22:26:41.821Z"
+    "lastUpdated": "2026-07-29T03:12:15.416Z"
...
-    "lastUpdated": "2026-07-28T23:31:23.736Z"
+    "lastUpdated": "2026-07-29T03:12:55.327Z"
```

Two timestamps. The marketplace list, the source URLs, and every other field are
unchanged. A file whose only recurring delta is a clock reading is being version
controlled and symlink-guarded.

## Fix

Stop tracking the file. It is generated state, like a lock file for a cache.

This is the plan as written before any of it was done, so the line numbers refer
to the pre-fix files. See "## Applied" below for what actually happened.

```bash
cd ~/dotfilesOSX

# 1. drop line 22 from the manifest
#    claude/.claude/symlinks.txt:22   plugins/known_marketplaces.json

# 2. untrack it, keeping the working copy
git rm --cached claude/.claude/plugins/known_marketplaces.json

# 3. ignore it. Patterns in claude/.gitignore are relative to claude/, so the
#    existing `plugins/*` block anchored to claude/plugins/ and never matched
#    anything. Re-anchor it and drop the known_marketplaces negation:
#      .claude/plugins/*
#      !.claude/plugins/installed_plugins.json
#      !.claude/plugins/blocklist.json

# 4. break the link so Claude Code owns the real file
rm ~/.claude/plugins/known_marketplaces.json
cp claude/.claude/plugins/known_marketplaces.json ~/.claude/plugins/known_marketplaces.json

# 5. clean up what the loop left behind
rm -f ~/.claude/plugins/known_marketplaces.json.bak-clobbered
rm -f ~/.claude/plugins/installed_plugins.json.bak \
      ~/.claude/plugins/installed_plugins.json.bak-presymlink
```

`plugins/blocklist.json` and `plugins/installed_plugins.json` stay in the
manifest. Those record decisions — which plugins are installed, which are
blocked — and are worth carrying to a new machine. `known_marketplaces.json` is
rebuilt from the marketplace sources on first run.

Do this on a branch other than `feat/delegate-free-harness`, which currently
carries six modified and four untracked files unrelated to this.

## The general rule

Anything the harness rewrites on its own schedule does not belong in
`symlinks.txt`. Stow's model is "the repo owns this file"; an application that
saves by rename asserts the opposite. When both are true of one path, the guard
reports a repair forever and the git diff is noise.

Worth auditing the rest of the manifest against the same question: *does anything
other than a human write this file?*

## Applied

Done 2026-07-30, on `fix/untrack-known-marketplaces` in `~/dotfilesOSX` (commit
`fa236db`), branched off `feat/delegate-free-harness` so its five other modified
and four untracked files stayed uncommitted. The `.gitignore` change was staged as a
single hunk; the unrelated `delegate/toolbox/` lines already in that file were
left in the working tree.

Two things came out differently from the plan above:

- Step 3 originally read `echo 'claude/.claude/plugins/known_marketplaces.json'
  >> claude/.gitignore`. That would have added a second dead pattern, for the
  same anchoring reason the existing `plugins/*` block was already dead. The
  step above is the corrected version; this is the command it replaced.
- The repo copy at `claude/.claude/plugins/known_marketplaces.json` was deleted
  after step 4 copied it out, rather than left untracked. An untracked copy of a
  file the harness now owns is the next reader's confusion.

Verified by running the hook twice in a row: no output either time, and
`~/.claude/plugins/known_marketplaces.json` was still a regular file afterwards.

The audit the section above asks for found nothing that has broken *yet*, which
is a narrower result than the question deserves. The hook writes a
`.bak-clobbered` sibling every time it repairs a clobbered link, and none are
left anywhere under `~/.claude`; the three surviving `.bak-presymlink` files date
from the original stow migration. Every entry in the manifest is currently a
correct symlink.

But the question was *does anything other than a human write this file?*, and for
`settings.json` the answer is yes — Claude Code rewrites it whenever config
changes. It stays in the manifest because it has never been clobbered, so it
evidently edits in place rather than saving by rename. That is a fact about the
current implementation, not a guarantee. If this message ever comes back naming
`settings.json`, this is why, and the answer will not be to untrack it: unlike
the marketplace list, it holds real decisions.

Two leftovers were not touched, being outside what step 5 named:
`~/.claude/plugins/known_marketplaces.json.bak` and
`known_marketplaces.json.bak-presymlink`. Both are dead now that the path is no
longer stow-managed.
