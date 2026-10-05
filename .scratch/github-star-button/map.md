# GitHub Star Button

Wayfinder map. Charted 2026-10-05.

## Destination

**A build-ready spec for a star control in the site header** — settled placement on both breakpoints,
an honest label, a defensible star count, an accessible name, and a decided analytics position — such
that an agent could implement it without asking a question.

When this map is done the maintainer has chosen one of five rendered directions, every open question
above it is answered, and this map's Decisions-so-far plus the chosen prototype *is* the spec. This
map **plans**; it does not build. Implementation is a separate `/implement` run.

## Notes

- **Domain is `CONTEXT.md`.** A **Recording** and its **Demo**, the person who made it a
  **Contributor**. Never "entry" or "author" (ADR-0008). Nothing here is a domain object — this is
  chrome — but the analytics ticket runs under ADR-0008's naming rule, so read `docs/adr/` before
  naming an event.
- **Read `components/site-header.tsx` before designing anything.** The right column is
  `site-header.tsx:116` — the `◆ Saved` chip and `<ModeToggle />`, in a 62px sticky row that only
  exists at `md` and up. **Below `md` a different header takes over** (`:155`), three rows, 36px
  controls, carrying its own `◆` + count and a `compact` toggle. One control, two layouts; a decision
  that only covers the desktop bar leaves the phone unbuilt.
- **The header's comments are load-bearing and unusually specific.** `:128-138` records that `◆ Saved`
  is *one* flex item on purpose and that the count reserves no width, and `:235-242` records a 44px
  hit-area fix. Any third control inherits that scrutiny — the parenthesised reasoning is the reason
  the code looks the way it does.
- **Icons are available:** `lucide-react` and `@radix-ui/react-icons` are both dependencies. The
  existing header uses glyph text (`◆`, `✕`) rather than either — do not assume an icon is the house
  style without checking.
- **Settled in charting, do not reopen:** the control **deep-links to GitHub and says so.** A site
  cannot star a repo for a visitor — starring is an authenticated `PUT /user/starred/{owner}/{repo}`
  against the signed-in user — so the button's job is to get the visitor to the Star button, and its
  label must not claim otherwise.
- **The count source charting chose did not survive its own ticket, and neither did the source its
  replacement chose.** Charting settled on `metrics/weekly.json` and flagged it as the decision most
  likely to be reopened by evidence. It was: the file's writer has never succeeded. Ticket 02 then
  replaced it with an ISR fetch, and the maintainer has now replaced *that* with a committed
  single-purpose file plus a repaired weekly workflow. Read ticket 03 for the design that is actually
  shipping; tickets 01 and 02 are history.
- **The direction is settled: variant F.** A's chip shape at every desktop width, words only from `xl`.
  Read the linked ticket's Answer before designing anything further — the full measurement table and
  the PostHog traffic split are there.
- **The header already breaks at 768–880, today, with no star control involved.** Measured on
  2026-10-05: `◆ Saved` wraps to 46px and the mode toggle to 49px at 768 and 820. `site-header.tsx:90-92`
  already records that the md-to-lg band does not fit. Any design in this map is being added to a band
  that has zero headroom, which is why measurement — not taste — settled the direction.
- **The count's source is settled, and it is not the source ticket 02 chose.** Read
  [What may a stale count be allowed to say](issues/03-what-may-a-stale-count-be-allowed-to-say.md)
  before writing any code — it **supersedes ticket 02's mechanism**. The count is a **committed file
  holding only the star count**, refreshed weekly by the repaired `metrics-update.yml` workflow, and it
  **always renders with no expiry and no date**. The bound is on the refresh (fail if the file is more
  than 7 days old), not on the render. GitHub is never in a visitor's request path.
- **The map's CI-repair boundary has moved, and only half of it.** `metrics-update.yml` is now **in
  scope** — the maintainer overrode the earlier ruling, because the chosen design *is* that workflow.
  `.github/workflows/ci.yml`'s identical `version: 10` pin is **still out of scope** and is a separate
  defect. Do not fix both together.
- **One thing about the alert cannot be verified from this repo:** GitHub only emails on a failed
  workflow if Actions email notifications are enabled in the maintainer's account settings. If they are
  off, the 7-day assertion becomes the *only* defence and nothing would announce that it had fired.

- **`main`'s CI is red right now** (6 consecutive failures, both jobs, `Multiple versions of pnpm
  specified`) and the weekly metrics job has never succeeded. Both are the same class of mistake —
  `pnpm/action-setup` pinned with `version:` against a `packageManager` field, fixed by deleting the
  pin. **The two are now on opposite sides of the scope line:** the metrics workflow's repair is in
  scope and required, `ci.yml`'s is out of scope. See the note above and Out of scope.
- **Standing preference:** prototypes go through `/prototype` and are throwaway. Rough is correct;
  high fidelity spent before the direction is chosen is waste. Prototype work lands on a
  `prototype/<name>` branch, never `main`.
- **This effort plans.** `/implement` builds it afterwards.

## Decisions so far

<!-- one line per closed ticket -->

- [Five directions for the star control](issues/01-five-directions-for-the-star-control.md) — **F**:
  A's chip shape at every desktop width, words "Saved" and "Star" only from `xl`. Chosen because the
  binding constraint is a width budget, not taste: A clips the theme toggle at 768 and the md-to-lg
  band is 1.1% of real pageviews. Also repairs a header that already wraps at 768–880 today.
- [Where does a live-enough star count come from](issues/02-where-does-a-live-enough-star-count-come-from.md) —
  **SUPERSEDED by ticket 03 — read the answer there, not here.** It chose an ISR server fetch with
  `revalidate: 21600`; the maintainer replaced that with a committed file written weekly by GitHub
  Actions. Its *research* is now load-bearing rather than superseded: the proof that the weekly workflow
  has failed 18 runs out of 18 is what makes its repair mandatory, and that workflow's documented
  one-line fix is the fix this map now depends on.
- [What may a stale count be allowed to say](issues/03-what-may-a-stale-count-be-allowed-to-say.md) —
  **Always show the number, never hide it, no date, no render-time expiry.** The staleness defence is a
  **refresh-time assertion**: the weekly workflow fails if its own output file is more than 7 days old,
  and that failure is the email. The count is meant to be **checked** against GitHub, which at 0.4
  stars/week means the rendered number runs 0–1 behind — the accepted cost, stated rather than
  discovered. Side effect: GitHub is never in a visitor's request path, so ticket 02's rate-limit,
  layout-shift and outage costs are all gone.
- [Which repository URL is canonical](issues/04-which-repository-url-is-canonical.md) —
  **`github.com/mrpmohiburrahman/rnui.dev`**, and all four places carrying the old alias are
  corrected: two shipped links plus two e2e assertions that pinned it as a string. The ticket's
  own measurement said two places; there were four, so the correction is four lines and the tests
  keep their purpose (they assert *a* repository link, not *this* one). `package.json` is renamed
  and gains `repository`/`homepage`/`bugs`. Its own commit — the star control writes this same
  string, so unlike `ci.yml`'s out-of-scope fix, the drift is on-topic here.

## Not yet specified

- **A consistency sweep beyond the header.** Now answerable enough to be worth revisiting once the
  header lands: if the header carries a count, the footer's CONTRIBUTE column and `/aboutus` are the
  two places a count would *also* belong. Still not sharp as its own question — "does it belong
  elsewhere" depends on F's final spec. **Charting got the premise wrong and it is now settled:**
  `/aboutus` links the maintainer's four *other* repos and carries no link to this one in either
  spelling, so there is no alias to clean there. Ticket 04 fixed the footer's link, and that was the
  only alias outside the catalogue's contribution link.
- **How the control interacts with the two conversion paths it now sits beside** — `/submit` and
  `/subscribe` in the footer. A star control is also a request for a favour; whether it competes with
  them or feeds them is not phrasable until its final weight in the row is known. **Ticket 04 added a
  third path here**: `recording-card-grid.tsx:327`, "Add your own recording on GitHub ↗", which is the
  legacy drive-by ask the footer's `/submit` link replaced. Ticket 04 corrected its address and
  deliberately left its wording and its existence alone — that question belongs in this patch, next to
  whether `/submit` and `/subscribe` now overlap with it.

*(The fog patch "whether anything acknowledges the press" has graduated to
[Does anything acknowledge the press](issues/09-does-anything-acknowledge-the-press.md) — the refresh
cycle made it stateable, and part of it may collapse into ticket 05.)*

## Out of scope

- **Repairing `.github/workflows/ci.yml`.** Still out of scope, and deliberately **narrower than it
  was**: `metrics-update.yml`'s repair moved *into* this effort when the maintainer chose it as the
  count's mechanism (see Notes). `ci.yml` carries the same `pnpm/action-setup` pin against the same
  `packageManager` field and has been red on `main` since 2026-09-25, but it is **not on this path** —
  nothing the star control does runs through it. Fixing it belongs in a build-and-delivery effort, and
  bundling it into a PR whose subject is a star button is how a one-line fix gets reviewed as four.
- **Runtime fetching of the star count, and any token to do it with.** Ruled out by
  [What may a stale count be allowed to say](issues/03-what-may-a-stale-count-be-allowed-to-say.md):
  the number comes from a committed file, so GitHub is never in a visitor's request path. This also
  rules out `GITHUB_TOKEN` in Vercel, and any ISR `revalidate` window.

- **Actually starring the repo from the site.** Impossible without the visitor's GitHub session —
  this is a constraint, not a work item, and the destination was drawn around it.
- **Sponsorship, pricing and any other star-adjacent monetisation.** Already researched in
  `docs/research/rnui-dev-sponsorship-on-site-pricing.md` (which cites the 350 stars). This effort
  must not duplicate or reopen it.
- **Public Submissions and the `/submit` flow.** A separate effort lives in
  `.scratch/public-submissions/`; nothing here touches the form.
- **A shared constant for the repository URL.** Put to the maintainer as part of
  [Which repository URL is canonical](issues/04-which-repository-url-is-canonical.md) and declined.
  The five literals go in as they stand. `lib/cdn.ts` and `lib/publication-notice.ts`'s `SITE_ORIGIN`
  are the precedent if the drift ever comes back — but a tidy import is an implementation choice
  inside a spec, not a decision on the route, and the destination is a spec.