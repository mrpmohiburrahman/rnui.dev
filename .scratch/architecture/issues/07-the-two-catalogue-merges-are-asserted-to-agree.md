# 07 — The two catalogue merges are asserted to agree

**What to build:** Adding a Category to one of the two catalogue merges and not the
other stops being a silent failure.

Two modules perform the identical eighteen-way merge of the Category data files, in
the same order, from the same imports. Diffing the two spread lists returns one
hunk: the name of the exported constant. One feeds the site, the tooling and the
data suite; the other feeds only search. Nothing asserts they agree.

The data suite already covers half of this. It walks every row of the Category
table, imports that Category's data file, and asserts every Entry in it reached the
merged catalogue — the test that exists because forgetting a merge line makes a
Category's Entries vanish with no error and nothing failing. That guard covers one
merge. The second has none, so a nineteenth Category added correctly to the first
passes the entire suite while disappearing from the other.

This is deliberately the guard and not the collapse. Collapsing the two into one
module is gated on whether search ships at all, because search is the only consumer
of the second merge — and if search is cut, the module is deleted rather than
merged, making the collapse work thrown away. The assertion survives either answer:
if search is cut it is deleted alongside the module, and if search ships it was
mandatory anyway. The two merges are byte-identical today, so it passes on the tree
as it stands and pins them from here.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The data suite asserts that the two merges hold exactly the same set of Entry ids
- [ ] The assertion lives beside the existing catalogue-wiring guard, since it is the same class of silent failure
- [ ] Its failure message names which Entries are missing from which merge, in the shape the suite's other assertions use
- [ ] Removing one Category's spread from the second merge turns the assertion red, checked by hand before the ticket closes
- [ ] Test suite and type check pass

The two merges are not collapsed into one. That is gated on the search decision and
is recorded separately.
