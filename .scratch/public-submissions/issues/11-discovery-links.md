# Discovery: how a visitor finds `/submit`

Status: resolved
Type: task
Blocked by: 05

## Question

A form nobody can find collects nothing. Map decision 10 puts two links in, and keeps one out.

**In:** `components/site-footer.tsx` and `app/contributors/page.tsx`.
**Out:** the header rail (`components/nav/nav-side-bar.tsx`). That rail is the catalogue's *facet*
navigation — Categories and Contributors with their whole-catalogue counts
(`categoriesWithCounts()` and `contributorsByCount()` in `data/recording.ts`). Adding an action
to it changes what the rail means, and every count in it would then sit beside an item that has
no count.

Before editing, read `components/newsletter-form.tsx`. It records the decision about where
"CONTRIBUTE" belongs and why, and it is the closest precedent for adding a call to action to
existing chrome. Follow it rather than inventing a second convention.

## Acceptance

- The footer links to `/submit`, in the footer's existing link styles, and the copy uses ticket
  01's vocabulary — never "upload", "video", "animation" or "entry" (`CONTEXT.md` `_Avoid_`
  lists all four).
- `/contributors` links to `/submit` where a Contributor who is not yet in the catalogue would
  plausibly look. Say in a comment why that spot, so it is not moved by taste later.
- The header rail is unchanged. `tests/e2e/` assertions over the rail still pass.
- `/submit` is absent from `next-sitemap`'s output or explicitly included, one or the other,
  decided rather than left to chance. What `next-sitemap.config.js` does and why is under
  `## Comments`.
- Neither link is rendered on the phone bottom sheet unless decision 10's own reasoning says it
  should be; if the sheet and the rail share a source, this is a conflict, raised under
  `## Comments`.
- `pnpm check-types`, `pnpm lint`, `pnpm test` all exit 0, and the Playwright suite passes.

## Answer

### The three entrances

**The footer** already linked here, landed with ticket 05: `components/site-footer.tsx`, in the
footer's own link style, labelled `Submit a recording`. It replaced the GitHub issues list, and the
`↗` came off with it, because that arrow means "leaves the site" and this stopped leaving it.

**`app/contributors/page.tsx`** gained a line at the **foot of the page**, after the rows. At the foot
rather than above them because the search that ends there is a scan for one's own name: a visitor who
has just read all the names and did not find themselves has finished that scan, and that is where it
stops. Above the rows it would be read by people already listed and skipped by the one person who
needs it. The reason is in the source, so it is not moved by taste later.

**The header rail is untouched**, which the Playwright suite re-checks rather than this ticket
asserting it.

### The sitemap, which was the real decision

`next-sitemap.config.js` has **no `exclude`**, and that is a decision now rather than an omission:
next-sitemap lists every route in the build's manifest unless it is named there, so `/submit` is
included by default and the question was whether to keep it. It is kept, with the reasons written into
the config beside the `siteUrl` line:

- it is the front door for Contributors, and this ticket's own premise is that a form nobody can find
  collects nothing;
- `/contactus` and `/subscribe` are listed already, so excluding a third form would be the
  inconsistency needing justification;
- what bounds abuse is Turnstile and the 5 MB cap, not being unlisted.

Two things make that decision checkable rather than a comment. `tests/sitemap.test.ts` asserts the
committed artifact lists `https://www.rnui.dev/submit`, so a future `exclude` fails a test instead of
quietly de-listing the form; and the same file pins that every URL names the www host, because the
apex answers 307 and a sitemap of apex URLs sends every crawler through a redirect.

**It had arrived by accident**, which is worth recording: a build swept `/submit` into the committed
`public/sitemap-0.xml` before anyone had decided, and this ticket's Comments already said so. The
decision makes it deliberate; the file needed no edit beyond the regeneration that was already
committed.

**And the preview hosts are noindexed outright** by the `x-robots-tag` rule in `next.config.ts`, so
none of this reaches a crawler until the work is on `rnui.dev`.

### The phone sheet, which the acceptance asked to be raised

**The sheet and the rail do share a source, and the honest answer is that this is a latent conflict
rather than a live one.** `components/filter-dock.tsx` takes `categories` and `contributors` as
`FacetCount[]` props and imports `facetHref` from `./nav/catalogue-nav`, the same module the rail
uses. So a link added to the rail would not appear in the dock automatically: the dock renders facet
links from `facetHref` calls, not from the rail's item list. The two share the *facet model*, not a
list of links.

Nothing was added to either, so nothing is inconsistent today. What is now recorded is the shape of
the trap: decision 10's reasoning is that every rail item carries a whole-catalogue count, and if
anyone ever adds an action there, the count-less item they create has a mirror in the phone sheet
that they will not have thought about.

### Gates

`pnpm check-types` 0, `pnpm lint` 0, `pnpm test` 28 files / 471 passing, `pnpm build` OK with
`○ /submit` and `○ /contributors`. The Playwright suite is run by the client that took this ticket;
`tests/e2e/contributors.spec.ts` counts rows as `main` list items, and the added line is a `<p>`, so
the row counts in that spec are unaffected.

## Comments

**Superseded in part by the Answer above, and kept because it is the measurement the decision rests
on. The sitemap question already had a default, and it was "included".** Measured 2026-09-25 while

building ticket 05: `pnpm build` ran `next-sitemap`, and `public/sitemap-0.xml` gained
`<url><loc>https://www.rnui.dev/submit</loc>…` — it was **not** in the committed file before that
build, and it appeared with no edit to `next-sitemap.config.js`. So `/submit` is picked up from
the route tree automatically, and the acceptance's "or explicitly included — decided, not left to
chance" is currently satisfied **by accident rather than by a decision**. Ticket 05 reverted that
generated file, because regenerating it is a chore the repo commits on its own (`639c31b`), and
because the discovery decision is this ticket's.

That leaves a real choice, and it is not cosmetic: a form in the sitemap is a form search engines
will send strangers to from day one, before anyone has decided the endpoint is ready for traffic.
**Ticket 11 must either list `/submit` deliberately or exclude it** — and if it excludes it, say
until when and what changes at that point. Either answer is fine; leaving it unstated is not.
