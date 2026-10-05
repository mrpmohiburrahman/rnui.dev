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
- **The count source charting chose did not survive its own ticket.** Charting settled on
  `metrics/weekly.json` and flagged it as the decision most likely to be reopened by evidence. It was:
  the file's writer has never succeeded. See Decisions so far.
- **The direction is settled: variant F.** A's chip shape at every desktop width, words only from `xl`.
  Read the linked ticket's Answer before designing anything further — the full measurement table and
  the PostHog traffic split are there.
- **The header already breaks at 768–880, today, with no star control involved.** Measured on
  2026-10-05: `◆ Saved` wraps to 46px and the mode toggle to 49px at 768 and 820. `site-header.tsx:90-92`
  already records that the md-to-lg band does not fit. Any design in this map is being added to a band
  that has zero headroom, which is why measurement — not taste — settled the direction.
- **The count's source is settled: an ISR server fetch, ≤ 6 hours old, with the committed JSON as
  fallback only.** Read the linked ticket before writing any code — it carries the verified rate-limit
  headers, the corrected root cause, and the one framework behaviour it could not exercise.
- **`main`'s CI is red right now** (6 consecutive failures, both jobs, `Multiple versions of pnpm
  specified`) and the weekly metrics job has never succeeded. Both are the same class of mistake —
  `pnpm/action-setup` pinned with `version:` against a `packageManager` field. Repair is out of scope
  here (see Out of scope) but the star control does not wait on it, by design.
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
  **ISR server fetch of `api.github.com` with `revalidate: 21600`, falling back to
  `metrics/weekly.json`.** Bound: ≤ 6 hours, enforced by the framework. The committed file is
  **demoted to fallback** — its writer has never succeeded (18 runs, 18 failures, since it was added).

## Not yet specified

- **A consistency sweep beyond the header.** Now answerable enough to be worth revisiting once the
  header lands: if the header carries a count, the footer's CONTRIBUTE column and `/aboutus` are the
  two places a count would *also* belong, and the legacy-alias repo links sit in both. Still not sharp
  as its own question — "does it belong elsewhere" depends on F's final spec.
- **Whether anything acknowledges the press** — a toast, a PostHog-only signal, nothing. Depends on
  whether the Preview is in scope (the surfaces ticket) and on whether the count can be current.
- **How the control interacts with the two conversion paths it now sits beside** — `/submit` and
  `/subscribe` in the footer. A star control is also a request for a favour; whether it competes with
  them or feeds them is not phrasable until its final weight in the row is known.

## Out of scope

- **Repairing `.github/workflows/ci.yml` and `metrics-update.yml`.** Found by
  [Where does a live-enough star count come from](issues/02-where-does-a-live-enough-star-count-come-from.md)
  and **not this map's job**: `main`'s CI has been red since 2026-09-25 (both jobs,
  `Multiple versions of pnpm specified`) and the metrics job has failed all 18 runs it has ever had.
  Both are the same mistake — `pnpm/action-setup` pinned with `version:` against `packageManager:
  pnpm@11.15.1` — and the fix is to drop the pin, per the action's own README. It needs its own effort
  because it is a build-and-delivery defect, not a header feature, and because it should not be
  bundled into a PR whose subject is a star button.
- **Actually starring the repo from the site.** Impossible without the visitor's GitHub session —
  this is a constraint, not a work item, and the destination was drawn around it.
- **Sponsorship, pricing and any other star-adjacent monetisation.** Already researched in
  `docs/research/rnui-dev-sponsorship-on-site-pricing.md` (which cites the 350 stars). This effort
  must not duplicate or reopen it.
- **Public Submissions and the `/submit` flow.** A separate effort lives in
  `.scratch/public-submissions/`; nothing here touches the form.