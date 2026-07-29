# 11 — The linter runs, and CI runs it

**What to build:** A contributor who follows the contributing guide gets a linter
instead of an error, and a pull request that reintroduces debug logging fails before
anyone reads it.

There is no working linter in this repository at all. The lint command still invokes
a framework subcommand that was removed a major version ago, so it exits complaining
that a directory named after the subcommand does not exist. Invoking the linter
directly fails too, and earlier: a transitive plugin imports a subpath that the
pinned major of a validation helper does not export, so the shared config cannot
load. Both failures have to be fixed before either is visible.

That is why twenty-four debug logs reached ordinary user paths. The rules to stop
them have existed the whole time and nothing has ever executed them.

One thing about the rule needs deciding inside the ticket rather than after it.
Running the linter over the repository covers the scripts directory for the first
time, and the scripts hold twenty-three deliberate console calls whose output is the
entire point of a command-line tool. A repository-wide ban would need twenty-three
exceptions, which is worse than no rule. The rule is scoped by path to the tree a
visitor's browser and the server actually render, and the scripts are exempt with
one line saying why.

The linter's own repair and its wiring into CI are one ticket rather than two,
because the cost of the second is unknowable until the first has run once. Whatever
the first clean run reports is what the rest of the ticket is.

**Blocked by:** 06, because both tickets edit the package manifest and regenerate the
lockfile, and whichever lands second would otherwise rebase through the other. And
08, because a rule forbidding debug logging goes red the moment it is switched on
unless the logs are already gone.

**Status:** ready-for-agent

- [ ] The lint command runs the linter over the repository instead of exiting on an unknown subcommand
- [ ] The transitive resolution failure is pinned so the shared config loads, with the pin recorded where the package manager in use will read it
- [ ] The unused direct dependency that collides with that pin is dropped in the same commit
- [ ] The output of the first successful run is recorded on this ticket, clean or not, before any rule is added
- [ ] A rule forbids debug logging in the application tree, scoped by path, with the scripts exempt and a one-line reason saying their output is the product
- [ ] The declared rule set passes, or each exception carries a reason rather than being silenced wholesale
- [ ] CI runs the linter, and a scratch branch adding one debug log fails the job
- [ ] The contributing guide and the pull-request template describe a command that works
- [ ] Build passes against the regenerated lockfile

Two things are deliberately left out. The formatting check is not wired in — it
fails on many files today for a line-ending reason unrelated to their content, and
untangling that is its own job. And the eight other direct dependencies that nothing
in the tree imports are not swept: several are generated component dependencies that
need judging one at a time, which is a different ticket with a different risk.
