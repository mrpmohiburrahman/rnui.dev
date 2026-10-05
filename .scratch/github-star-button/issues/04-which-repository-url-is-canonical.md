# Which repository URL is canonical, and what happens to the legacy alias

Status: open
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

## Comments