# 13 — One module owns bookmarks and votes

**What to build:** The two hooks that remember which Entries a visitor bookmarked
and which they voted on become one.

They are the same file twice. The same hydration guard, the same fallback when
stored state fails to parse, the same persist-after-mount guard, the same add,
remove, toggle and membership functions — identical once the identifiers are
normalised, down to the emoji in the log prefixes. Every bug in them has two homes
and every fix needs applying twice. Roughly half of what each returns has no
consumer at all.

It also means two stored keys to protect, and only one of them currently carries the
comment recording that renaming it silently discards data already sitting in
visitors' browsers. Both keys keep their exact current spellings and both gain that
comment. This is the same boundary ticket 02 stopped at and for the same reason: the
variable names around a stored key are code, but the key itself is a record in
somebody's browser.

The branchy part — parsing stored state and falling back when it is corrupt — comes
out as plain functions and gets a test in the existing test environment. That is
deliberate: it avoids introducing a browser test environment for the sake of two
functions, which would be a new dependency and a new configuration for a job that
does not need either.

**Blocked by:** 09, which deletes the network write leaking out of the vote toggle —
the only non-cosmetic difference between the two hooks, and the thing that would
otherwise have to be preserved through the merge. And 12, because the collapse
rewrites where these hooks are consumed: after it there is one place to change
rather than three.

**Status:** ready-for-agent

- [ ] One module backs both bookmarks and votes, taking the stored key as its only parameter
- [ ] Both keys keep their exact current spellings, and a comment on each records that renaming it silently discards bookmarks and votes visitors have already made
- [ ] The half of each hook's returned surface that no consumer uses is gone
- [ ] The fallback for corrupt stored state and the hydration guard exist once
- [ ] The parse-and-serialise pair are plain functions covered by a test in the existing test environment, with no new dependency
- [ ] The returned toggle keeps a stable identity across renders
- [ ] Bookmarks and votes stored by the current build still load unchanged after the swap, checked by hand in a browser holding existing state
- [ ] Type check, test suite, build and end-to-end tests all pass

One thing this does not achieve, despite appearances. The card's memo comparator
skips five props it never compares; this ticket stabilises two of them. The third is
the modal opener, which comes from a hook this ticket does not touch and stays both
unstable and uncompared. The comparator is one prop less dishonest, not honest.

No browser test environment is introduced, and the module is not given a name from
outside the glossary — if the collapsed page module's term does not cover it, the
term for a remembered set of Entry ids is added the same way ticket 12 adds its own.
