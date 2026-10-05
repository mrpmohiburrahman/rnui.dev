# Which repository URL is canonical, and what happens to the legacy alias

Status: resolved
Type: grilling
Blocked by:

## Question

**The codebase already links to this repo two different ways, and a third button makes it three.**
Measured on 2026-10-05:

- `mrpmohiburrahman/rnui.dev` — used by `scripts/metrics-update.ts:15`, the README's stars and
  last-commit badges, and `app/opengraph-image.tsx:62`. 350 stars, not a fork, homepage
  `https://rnui.dev`.
- `mrpmohiburrahman/awesome-react-native-ui` — used by `components/site-footer.tsx:53` (the
  footer's "Repository ↗") and `components/recording-card-grid.tsx:327`.

`gh api` answers **both** paths with `full_name: mrpmohiburrahman/rnui.dev`, so the second is a rename
alias that GitHub redirects. `package.json` still carries the old `name`, which is probably why.

Nothing is broken. That is exactly why it needs a decision rather than a shrug: the star button is the
most prominent link to the repo the site will ever ship, and it should not be the third spelling.

Decide:

- **The canonical URL** for the star control, and why that one. `rnui.dev` matches the domain, the
  OG image and the metrics job; the alias matches `package.json` and two shipped links. Neither
  argument is wrong on its own.
- **Whether the existing two legacy links are corrected in this effort or a separate one.** They are
  user-visible and they work, so this is a scope judgement, not a bug fix. Correcting them is a
  two-line diff that is arguably in-scope cleanup; leaving them is defensible because the destination
  is a spec for a *new* control. The map's Out of scope can carry the answer either way — but it has
  to be a choice, not an omission.
- **Whether the alias gets retired everywhere, including `package.json`'s `name` field**, or only on
  the paths this control touches. `package.json`'s name is load-bearing for nothing here, but it is
  the probable source of the drift, and leaving it guarantees the fourth link will be written someday.

**The answer is one canonical URL plus a stated disposition for the two existing aliases.** The star
control cannot be specified without the first; the second is a one-line scope ruling this map records
rather than leaves open.

## Answer

Resolved 2026-10-05.

### The canonical URL

**`https://github.com/mrpmohiburrahman/rnui.dev`**

It matches the domain, `opengraph-image.tsx:62`, `scripts/metrics-update.ts:15`, `metrics/weekly.json`,
every README badge, the git remote, and the prototype from ticket 01 — which had already made this call
in throwaway code. The old spelling's only advocate was `package.json`'s `name`, which nothing in the
app reads. GitHub renamed the repo; the code was the thing lagging.

`gh api` confirms both paths answer with `full_name: mrpmohiburrahman/rnui.dev` — 350 stars, not a fork,
not archived. The old path is a redirect alias, not a second repository.

### This ticket's own measurement was wrong

It claimed two places. There are **four**, and the last two are e2e tests that pin the alias as a string:

| Where | What |
|---|---|
| `components/site-footer.tsx:53` | "Repository ↗" |
| `components/recording-card-grid.tsx:327` | "Add your own recording on GitHub ↗" |
| `tests/e2e/theme.spec.ts:181` | asserts served HTML **contains** the alias |
| `tests/e2e/pagination.spec.ts:95` | asserts that link's `href` **is** the alias |

So "a two-line diff" was four lines, two of them tests written on purpose. `theme.spec.ts:168-176`
records why it exists: the footer link once went missing, server-side, before hydration, and it fails
silently. Correcting the links without the tests fails the suite; correcting the tests alone is not a
change at all.

### All four are corrected, and each test keeps its purpose

The tests assert *that the served HTML carries a repository link*, not *which* repository link. The
assertion stays; the expected string becomes `rnui.dev`. That is what makes the correction safe rather
than a deletion of someone's deliberate pin.

This is deliberately **not** bundled into the star control's own diff. It is its own commit. The map
already ruled `ci.yml`'s one-line fix out of scope precisely so a one-line fix does not get reviewed as
four; that reasoning does not transfer here, because the star control writes this exact string, so the
drift is on-topic. Separate commit, not separate effort.

### `package.json` is fixed, fully

Rename `name` to `rnui.dev`, and add the missing `repository`, `homepage`, and `bugs`. The lockfile does
not reference the root package name, so the rename touches nothing else.

Both halves matter and for different reasons: the rename removes the stale value the ticket names as the
probable source of the drift, and `repository` is the field that tells a future contributor where the
code lives instead of letting them hardcode a guess. `package.json` had no `repository`, `homepage`, or
`bugs` field at all before this.

### Parked, not needed to ship

Both were put to the maintainer and both were declined as beyond this destination. Neither changes what a
visitor sees.

- **No shared constant for the URL.** The address goes in as literals, as it does everywhere else today.
  A single exported constant in `lib/` is the tidier shape and `lib/cdn.ts` and
  `lib/publication-notice.ts`'s `SITE_ORIGIN` are the precedent — but it is an implementation choice
  inside a spec, and the maintainer declined it. If the same drift ever reappears, that is when.
- **The "Add your own recording on GitHub ↗" link keeps its wording and its existence.** Only its
  address is corrected here. Whether that link should still exist — the site has a real form at
  `/submit` — belongs to the map's fog about the conversion paths, not to this ticket.

## Comments