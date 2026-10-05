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
- **Settled in charting:** the count comes from `metrics/weekly.json`, **subject to
  [Where does a live-enough star count come from](#02)** — the file's refresher is currently broken
  (see that ticket), so this is the one settled decision most likely to be reopened by evidence.
- **Standing preference:** prototypes go through `/prototype` and are throwaway. Rough is correct;
  high fidelity spent before the direction is chosen is waste.
- **This effort plans.** `/implement` builds it afterwards.

## Decisions so far

<!-- one line per closed ticket -->

_None yet._

## Not yet specified

- **A consistency sweep beyond the header.** If the header ends up carrying a count, the footer's
  CONTRIBUTE column and `/aboutus` are the two places a count would *also* belong — and the repo's
  legacy-alias links sit in both. Not phrasable as its own question until the header's visual grammar
  is chosen, because "does it belong elsewhere" depends on what it looks like.
- **Whether a stale count degrades visibly.** Depends on both the accuracy policy and what the count
  source can actually promise; neither is settled.
- **Whether anything acknowledges the press** — a toast, a PostHog-only signal, nothing. Depends on
  whether the Preview is in scope (see the surfaces ticket) and on whether the count can be current.
- **How the control interacts with the two conversion paths it now sits beside** — `/submit` in the
  footer, `/subscribe` in the footer's NOTIFY column. A star control is also a request for a favour;
  whether it competes with them or feeds them is not phrasable until its weight in the row is known.

## Out of scope

- **Actually starring the repo from the site.** Impossible without the visitor's GitHub session —
  this is a constraint, not a work item, and the destination was drawn around it.
- **Sponsorship, pricing and any other star-adjacent monetisation.** Already researched in
  `docs/research/rnui-dev-sponsorship-on-site-pricing.md` (which cites the 350 stars). This effort
  must not duplicate or reopen it.
- **Public Submissions and the `/submit` flow.** A separate effort lives in
  `.scratch/public-submissions/`; nothing here touches the form.