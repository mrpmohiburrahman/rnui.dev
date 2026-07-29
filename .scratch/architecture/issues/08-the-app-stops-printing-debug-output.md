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

**Status:** ready-for-agent

- [ ] No debug log fires on a catalogue render, a navigation render, a vote, a bookmark toggle, a view increment or a newsletter signup
- [ ] No log serialises the catalogue, the author list, or a visitor's stored id list
- [ ] Every catch still reports its error, and the corrupt-stored-state warnings are untouched
- [ ] A search of the application tree finds only error and warning reporting left
- [ ] Type check, test suite, build and end-to-end tests all pass

No rule is added to keep them out. Nothing in this repository executes a linter
yet, so a rule would be decoration. Ticket 11 adds it once there is something to run.
