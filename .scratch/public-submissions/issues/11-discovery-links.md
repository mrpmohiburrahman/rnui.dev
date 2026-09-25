# Discovery: how a visitor finds `/submit`

Status: ready-for-agent
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
- **`/submit` is absent from `next-sitemap`'s output or explicitly included — one or the other,
## Comments

**The sitemap question already has a default, and it is "included".** Measured 2026-09-25 while
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

  decided, not left to chance.** Check `next-sitemap.config.js` and say what it does and why.
- Neither link is rendered on the phone bottom sheet unless decision 10's own reasoning says it
  should be; if the sheet and the rail share a source, this is a conflict — raise it under
  `## Comments`.
- `pnpm check-types`, `pnpm lint`, `pnpm test` all exit 0, and the Playwright suite passes.
