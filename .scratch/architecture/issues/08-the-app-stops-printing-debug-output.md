# 08 — The app stops printing debug output on normal paths

**What to build:** A visitor's browser console stops carrying their bookmark and
vote lists, and the server log stops carrying the catalogue.

Twenty-four debug logs live in the application tree, across eleven files, and
almost all of them fire on ordinary paths rather than on error. The two worst are
not the loudest but the largest. One server action serialises the **entire filtered
catalogue** into the log on every fetch. The navigation dumps the whole author list
on every render — so on every page, not only the catalogue ones. Below those, both
stored-set hooks log a visitor's complete id list on mount and again on every
toggle, and the collection name is printed twice per view increment and once per
catalogue render.

They go before the three module tickets rather than after. Sixteen of the twenty-four
lines live in files that tickets 12, 13 and 14 rewrite or delete outright, so
landing this first costs those tickets nothing and landing it last means porting
noise into new modules and then removing it again. It also has to precede the lint
ticket, because a rule forbidding this goes red the moment it is switched on.

Error and warning reporting is not touched. Neither are the warnings that fire when
a visitor's stored state fails to parse — those are the only signal that somebody's
bookmarks were silently reset, and they are the opposite of noise.

**Blocked by:** 06. Three of the twenty-four lines live inside a module 06 deletes
outright, and this ticket's last criterion cannot be met while that module exists.

**Status:** resolved

- [x] No debug log fires on a catalogue render, a navigation render, a vote, a bookmark toggle, a view increment or a newsletter signup
- [x] No log serialises the catalogue, the author list, or a visitor's stored id list
- [x] Every catch still reports its error, and the corrupt-stored-state warnings are untouched
- [x] A search of the application tree finds only error and warning reporting left
- [x] Type check, test suite, build and end-to-end tests all pass

No rule is added to keep them out. Nothing in this repository executes a linter
yet, so a rule would be decoration. Ticket 11 adds it once there is something to run.

## Comments

**Implemented 2026-07-30.**

Twenty-two lines gone across ten files — nineteen live `console.log` calls plus
three already commented out. The three commented ones counted because of the
fourth criterion: a `grep` for `console.` in the application tree has to come back
holding only error and warning reporting, and a commented-out log still answers
that search. They were `components/nav/catalogue-nav.tsx` (the author-list dump)
and two lines in `app/actions/get-entries.ts`, one of which serialised the whole
filtered catalogue.

Where they were: `hooks/use-bookmarks.ts` 6, `hooks/use-votes.ts` 6,
`app/actions/increment-view-count.ts` 2, `app/actions/get-entries.ts` 2, and one
each in `app/actions/increment-vote-count.ts`,
`app/actions/decrement-vote-count.ts`, `data/entry.ts`,
`components/newsletter-form.ts`, `app/subscribe/page.tsx` and
`components/nav/catalogue-nav.tsx`.

The ticket's count was twenty-four minus the three inside the module 06 deleted,
so twenty-one expected against twenty-two found. The survey counted live calls
only; the extra one is a commented line it did not tally.

Two `const updated = …` bindings in each stored-set hook went with them. They
existed only to be passed to the log — once the log is gone the reducer returns the
new array directly. That is the whole reason the deletion had to precede ticket 13
rather than follow it: the merged hook would otherwise have inherited the binding
and the reader would have had to work out why it was there.

Kept, deliberately: all twenty-seven `console.error` and `console.warn` calls,
including the two "Stored bookmarks are not an array" / "Stored voted items are not
an array" warnings. Those fire only when a visitor's stored state fails to parse
and are the only signal that somebody's bookmarks were silently reset.

Verified: `pnpm check-types`, `pnpm test` (74 passed), `pnpm build`,
`pnpm exec playwright test` (3 passed).
