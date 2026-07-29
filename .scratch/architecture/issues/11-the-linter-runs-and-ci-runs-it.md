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

**Status:** resolved

- [x] The lint command runs the linter over the repository instead of exiting on an unknown subcommand
- [x] The transitive resolution failure is pinned so the shared config loads, with the pin recorded where the package manager in use will read it
- [x] The unused direct dependency that collides with that pin is dropped in the same commit
- [x] The output of the first successful run is recorded on this ticket, clean or not, before any rule is added
- [x] A rule forbids debug logging in the application tree, scoped by path, with the scripts exempt and a one-line reason saying their output is the product
- [x] The declared rule set passes, or each exception carries a reason rather than being silenced wholesale
- [~] CI runs the linter, and a scratch branch adding one debug log fails the job — the rule is proven locally, the branch is not pushed; see below
- [x] The contributing guide and the pull-request template describe a command that works
- [x] Build passes against the regenerated lockfile

Two things are deliberately left out. The formatting check is not wired in — it
fails on many files today for a line-ending reason unrelated to their content, and
untangling that is its own job. And the eight other direct dependencies that nothing
in the tree imports are not swept: several are generated component dependencies that
need judging one at a time, which is a different ticket with a different risk.

## Comments

**Implemented 2026-07-30.**

### Not two failures but four

The ticket named two. Each fix uncovered the next, so the count only became
knowable by running it.

**1. `next lint` is gone.** Next 16 removed the subcommand, so `next` reads `lint`
as a positional argument: `Invalid project directory provided, no such directory:
…/rnui.dev/lint`. The script is now `eslint .`.

**2. The `/v4` resolution failure.** `eslint-plugin-react-hooks@7.0.1`, a
transitive dependency of `eslint-config-next`, imports `zod-validation-error/v4`
and accepts `^3.5.0 || ^4.0.0`. pnpm resolved the 3.x branch — 3.5.4 — and 3.5.4
ships a `v4` directory in `files` but declares only `"."` in its `exports` map, so
the subpath import fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` and the shared config
never loads. The root's own unused `zod-validation-error: ^3.4.0` is what biased
the resolution to 3.x; it is dropped, and `overrides` pins `^4.0.0`, which
resolves 4.0.2.

The pin is in **`pnpm-workspace.yaml`**, not `package.json`, because pnpm told us
so: `[WARN] The "pnpm" field in package.json is no longer read by pnpm. The
following keys were ignored: "pnpm.overrides".` That warning is the whole reason
the first attempt at this pin silently did nothing — the install succeeded and the
resolution did not move. Vercel pins pnpm 9, which cannot read overrides from that
file; it installs `--frozen-lockfile`, and the lockfile now carries
`overrides: zod-validation-error: ^4.0.0`, so the resolution travels with it.
`pnpm install --frozen-lockfile` was run to confirm CI will not choke on it.

**3. FlatCompat was the wrong wrapper.** With the plugin resolvable, the config
crashed one layer deeper: `TypeError: Converting circular structure to JSON` inside
`@eslint/eslintrc`'s config validator. `eslint-config-next` 16 exports flat
configs — `Linter.Config[]` — and `FlatCompat` is the shim for the *legacy* eslintrc
format. It tried to schema-validate a flat array and then crashed formatting its own
error message, which is why the real problem was invisible. Fixed by importing
`eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` and
spreading them. `@eslint/eslintrc` had no other importer and is dropped.

**4. The overrides block matched too much.** `TypeError: Key "rules": Key
"react/no-unescaped-entities": Could not find plugin "react".` The shared config
scopes its plugins to `**/*.{js,jsx,mjs,ts,tsx,mts,cts}` — no `cjs` — and the repo
has `prettier.config.cjs`. An unscoped rules block matched it and configured a rule
from a plugin that was not registered there. The block now declares the same glob.

### The first successful run

39 problems: **8 errors, 31 warnings**. Verbatim summary of the errors:

```
components/entry-card.tsx:53      error  react-hooks/set-state-in-effect
hooks/use-bookmarks.ts:20         error  react-hooks/set-state-in-effect
hooks/use-sorted-data.ts:24       error  react-hooks/set-state-in-effect
hooks/use-votes.ts:28             error  react-hooks/set-state-in-effect
scripts/updateLastCommitDate.js:2 error  @typescript-eslint/no-require-imports
scripts/updateLastCommitDate.js:3 error  @typescript-eslint/no-require-imports
tailwind.config.ts:4              error  @typescript-eslint/no-require-imports
tailwind.config.ts:118            error  @typescript-eslint/no-require-imports
```

The 31 warnings are unused imports (`components/hero.tsx` alone has seven),
`no-explicit-any`, `prefer-const` and one `no-img-element`. They are advisory and
left alone — `eslint` exits 0 on warnings, so the job passes. Sweeping them is its
own ticket, and it is the kind of ticket that only exists once a first run has
happened.

**Two of the four hook errors were real and are fixed.** `useSortedData` held the
sorted list in state and wrote it from an effect, so it painted the unsorted list
and corrected it a tick later; it is a `useMemo` now, and the commented-out
`recent` branch went with it — `getEntriesWithCounts` already returns the catalogue
newest-first. And the count reseed ticket 10 had just added to `entry-card.tsx` was
an effect calling `setState`; it now adjusts during render, comparing the Entry's
counts against the ones it last seeded from, which is the pattern React documents
for exactly this.

**Two are exceptions with a reason at the line.** `use-bookmarks.ts` and
`use-votes.ts` read localStorage on mount and set state from it. There is no
version of that without the effect: a lazy `useState` initialiser runs on the server
too, where there is no localStorage, so the server would render an empty set and the
client a full one and React would report a hydration mismatch. Two
`eslint-disable-next-line` comments, each with the reason above it. They collapse to
one when ticket 13 merges the hooks.

A note on the shape of those directives, because the first attempt failed silently:
the reason cannot be written as continuation lines of the directive comment.
`eslint-disable-next-line` disables the line immediately following, and if that line
is another comment it disables the comment. Prose first, directive last, statement
under it.

**The four `require()` errors are a scoped `off`.** `tailwind.config.ts` loads its
plugins with `require()`, which is how Tailwind's own documentation spells it, and
`scripts/updateLastCommitDate.js` is a plain node script a git hook runs. Two file
paths, one rule, one reason — not a wholesale silence.

### The rule

```js
files: ["app/**", "components/**", "hooks/**", "lib/**", "data/**", "utils/**", "middleware.ts"]
rules: { "no-console": ["error", { allow: ["error", "warn"] }] }
```

`scripts/` is exempt by omission rather than by exception, which is the point: a
repository-wide ban would need twenty-three `eslint-disable` lines in a directory
whose output is the product.

**Proven both ways by hand.** A `console.log` appended to `components/hero.tsx`
turns the run red — `69:1 error Unexpected console statement no-console`, exit 1 —
and the same line appended to `scripts/asset-paths.ts` reports nothing. Both files
were restored and the run is back to exit 0.

**The last criterion is only half done.** CI now runs `pnpm lint` in the `quality`
job, between `check-types` and `test`. The scratch branch that proves the *job*
fails was not pushed: that needs a push to the remote, which is the maintainer's
call, not something to do unasked. The rule's behaviour is proven locally, above,
and the CI step is a plain `pnpm lint`, so the remaining risk is not in the rule but
in whether the workflow file is wired correctly — visible in the diff.

Verified: `pnpm lint` (0 errors, 31 warnings), `pnpm check-types`, `pnpm test`
(74 passed), `pnpm build`, `pnpm exec playwright test` (6 passed),
`pnpm install --frozen-lockfile`.
