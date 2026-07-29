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

**Status:** resolved

- [x] One module backs both bookmarks and votes, taking the stored key as its only parameter
- [x] Both keys keep their exact current spellings, and a comment on each records that renaming it silently discards bookmarks and votes visitors have already made
- [x] The half of each hook's returned surface that no consumer uses is gone
- [x] The fallback for corrupt stored state and the hydration guard exist once
- [x] The parse-and-serialise pair are plain functions covered by a test in the existing test environment, with no new dependency
- [x] The returned toggle keeps a stable identity across renders
- [x] Bookmarks and votes stored by the current build still load unchanged after the swap, checked in a browser holding existing state — automated rather than by hand, see below
- [x] Type check, test suite, build and end-to-end tests all pass

One thing this does not achieve, despite appearances. The card's memo comparator
skips five props it never compares; this ticket stabilises two of them. The third is
the modal opener, which comes from a hook this ticket does not touch and stays both
unstable and uncompared. The comparator is one prop less dishonest, not honest.

No browser test environment is introduced, and the module is not given a name from
outside the glossary — if the collapsed page module's term does not cover it, the
term for a remembered set of Entry ids is added the same way ticket 12 adds its own.

## Comments

**Implemented 2026-07-30.**

**The term was needed.** *Catalogue page* did not cover it, so `CONTEXT.md` gains
**Remembered set** in the section ticket 12 opened:

> **Remembered set**: Entry ids held in one visitor's own browser — the Entries they
> bookmarked, or the ones they voted on. Two exist, one per stored key. The key is a
> record in somebody's browser rather than an identifier, so it is never renamed:
> renaming it discards what they saved. Nothing on the server can read a Remembered
> set.
> _Avoid_: favourites, likes, saved items, selection, local state

`hooks/use-remembered-set.ts`, `useRememberedSet(storedKey)`.
`hooks/use-bookmarks.ts` and `hooks/use-votes.ts` are deleted.

**The returned surface went from five to two.** Both hooks returned
`{ ids, toggle, is<X>, add<X>, remove<X> }`; the only consumer used the first two.
The other three were dead in both files, so six exported functions became none.

**Both keys live in the new module**, one exported constant each, so the comment
recording what a rename destroys sits on the key rather than near it:
`BOOKMARKS_KEY = "bookmarkedItems"`, `VOTED_ITEMS_KEY = "votedItems"`. Unchanged
spellings.

**The pure pair.** `parseRememberedIds(raw)` returns
`{ ids, problem: "not-an-array" | "unreadable" | null }`. The `problem` field is
what lets the branchy part be pure and still keep the reporting ticket 08 preserved:
the hook reads it and calls `console.warn` or `console.error`, so a visitor whose
saved state was just silently reset is still told. `serialiseRememberedIds` is
`JSON.stringify` under a name, which earns its place only because the test can then
hold both halves of the round trip — including an assertion that the written shape is
still `'["a","b"]'`, since anything else makes every set already in a visitor's
browser unreadable.

`tests/remembered-set.test.ts`, 8 assertions in the existing node environment, no
new dependency. One case the old code got right by accident and is now explicit:
`localStorage.getItem` returns `null` for a key nobody wrote, so an empty string is
a key somebody wrote *badly* and counts as unreadable, not as absent.

**The toggle is a `useCallback` with no dependencies**, using the updater form so it
never needs to close over the current set. The old versions read `is<X>(id)` from the
render's state and then called `add`/`remove`; the updater form is equivalent and has
one less thing to get wrong.

**The by-hand browser check is automated instead.**
`tests/e2e/remembered-set.spec.ts` seeds `localStorage` through
`addInitScript` — the two keys as string literals, deliberately, because importing
the constants would make the test agree with the code rather than with what is
already in visitors' browsers — then loads `/bookmarks` and asserts exactly the one
seeded Entry renders, with both labels flipped to "Remove Bookmark" and "Unvote", so
both sets hydrated rather than only one. It also pins ticket 12's decision:
un-bookmarking drops the card immediately, which two copies of the set would not do.

That test needed one thing that is not obvious. The bookmark button carries
`pointer-events-none group-hover:pointer-events-auto`, so it is never hit-testable
until the pointer is over the card, and a plain `click()` waits out its timeout
against a resolved, visible element. The card's heading is hovered first.

**What this still does not fix**, as the ticket said: the card's memo comparator
skips five props. This stabilises `toggleBookmark` and `toggleVote`. `openModal`
comes from `useModal`, which this ticket does not touch, and is still both unstable
and uncompared.

Verified: `pnpm check-types`, `pnpm lint` (0 errors), `pnpm test` (82 passed, up from
74), `pnpm build`, `pnpm exec playwright test` (7 passed).
