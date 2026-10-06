# Does anything acknowledge the press

Status: resolved
Type: grilling
Blocked by: 03

## Question

**A visitor stars the repo, comes back, and the number they caused to move has not moved — for up to
a week. Is anything said about that?**

This graduated out of the map's fog once
[What may a stale count be allowed to say](#03) settled the refresh cycle. The fog patch had said the
question "depends on whether the Preview is in scope and on whether the count can be current"; neither
holds any more. The count is current by construction (weekly, and now alerted), and the surface
question is [Which surfaces carry the control](#06)'s, not this one's.

The situation is now precisely stateable and it is the one thing the design cannot fix by being
accurate:

- The number is **checked**, not glanced at — the maintainer's own word. So the returning visitor is
  primed to look at it.
- The number is **refreshed weekly**, at 0.4 stars per week, so the typical window where a new star is
  not yet visible is **most of a week**.
- The number is **always shown** and carries **no date**, so nothing on the page says why it has not
  moved.

Nothing here is a data problem. It is a question about whether the site says anything at all about an
action the visitor took somewhere else, on another site, which the site cannot observe.

The options are genuinely different in kind, which is why this was fog and is now a ticket:

- **Nothing.** The header is a static mirror and does not narrate. Cheapest, and consistent with a
  number that is "checked" rather than transactional.
- **A PostHog-only signal** — the star control records that it was clicked, so the maintainer can see
  the outbound intent even though no star is ever observed. No visitor-facing change at all, and it
  folds naturally into whatever [What the control is called, and does it say anything](#05) decides
  about the analytics position. **This may not be a separate decision at all** — check 05 before
  treating it as one, and if 05 already puts a click event on the control, say so and fold this into
  it rather than opening a second analytics decision.
- **A visible acknowledgement** — a toast, or a one-line note. This is the only option the visitor
  sees, and it is the one that costs width in a header that already wraps between 860 and 890 under
  variant F. If this is chosen, it has to say something that is *true* — a toast that says "thanks for
  starring" claims an observation the site cannot make.

Also settle the boundary with [Which surfaces carry the control](#06): on `old.rnui.dev` and the
Preview, the same situation exists with a number nothing will ever refresh. If nothing is said
anywhere, that is consistent; if a visible acknowledgement is added, it is a claim made by two frozen
Deployments and a Preview that will never learn it was wrong.

**The answer is whether the site narrates an action it cannot observe** — and if the answer is yes,
the exact words, plus whether they are the same words on every surface.

## Notes

- Grilling. This is short, and part of it may collapse into ticket 05 — check 05's Answer first.
- **Both dependencies named in the Question are now answered. Do not re-open them.**
  - **05 already put the PostHog-only signal on the control.** It settled `star_clicked` carrying
    `stars_shown`, called from `onClick` in both layouts through one shared handler. So the Question's
    second bullet — "this may not be a separate decision at all" — is answered: **it is not one.** Fold
    it into 05's event and do not open a second analytics decision.
  - **The surface boundary does not exist.** 06 resolved this ticket's `old`-and-Preview worry:
    `preview.rnui.dev` **308s and serves no build**, and the Archive is out **by structure** — `old` is
    a separate Vercel project, `origin/old` has no `site-header.tsx`, and the control is gated to the
    live site. So a visible acknowledgement, if chosen, exists on **exactly one** surface and cannot be
    contradicted by a second frozen Deployment. That removes the reason 06 had to be consulted.

  What is left is the question this ticket was really asking, and it is unchanged: **does the live site
  narrate an action it cannot observe?** Nothing / a visible acknowledgement. If the latter, it must say
  something *true* — a toast thanking a visitor for starring claims an observation the site cannot make.

## Answer

Resolved 2026-10-05. **No. The site narrates nothing.** Two decisions, both taken as recommended, and
three facts found on the way that reframed the question before it could be asked.

### 1. Ticket 03's "no date anywhere" is absolute

Reopening it was the only route to a truthful acknowledgement, and it is closed. The returning visitor's
one truthful set of words is *"this number is a snapshot from Sunday"* — words about the date, which 03
ruled out and 05 then declined to leak into PostHog for the same reason. Reopening would re-litigate two
settled decisions to serve one predicted embarrassment, and it would buy something unbounded: a date in
the UI is a standing claim that this number is good enough to date, so 03's 9-day failure — two missed
weekly runs, ≈14 days' silence — becomes a number the page has publicly committed to and visibly broken.
The alert goes to the maintainer, which is the right place for it.

### 2. Nothing visitor-facing, and the remaining options fall on their own terms

- **(c) a toast thanking the visitor** is out on truth grounds regardless of decision 1. "Thanks for
  starring" asserts an observation the site never made.
- **(d) `★ 350` → `★ Starred` for a returning clicker** is the only zero-width option, and the only one
  with an honesty problem left once the date is gone: it claims something about the visitor's GitHub
  account on the evidence of one outbound click. It also **spends the count**, which 03 called "the
  entire social proof", to buy the acknowledgement.
- **(b) a toast that instructs — "On GitHub, tap Star"** is true and free, and was rejected because it
  is redundant: a visitor who clicked a `★ 350` chip and landed on a GitHub repo page is already looking
  at the largest button on that page.

So: `★ 350` renders, and nothing else renders, ever.

### Three facts that reframed the question

- **The ticket's width premise was false.** A visible acknowledgement was costed as *"width in a header
  that already wraps"*, which holds only for copy placed in the header row. `sonner` is already a
  dependency, already mounted at `app/layout.tsx:116` with `richColors`, theme-aware through
  `components/ui/sonner.tsx` — and has **zero call sites in the repo**. A toast is an overlay and costs
  no header width at all.
- **The mechanism for acknowledging a returning visitor already exists, in the footer.**
  `newsletterSubscribed` is written on submit success (`components/newsletter-form.tsx:55`) and read on
  mount (`:38`) to swap the form for *"Check your inbox — the Digest starts once you confirm."* That copy
  was **rewritten** when double opt-in landed, because *"you are on the list"* stopped being true. The
  precedent is really a warning: this repo has already been bitten by an acknowledgement that outran its
  evidence, and fixed it by making the words describe what happened.
- **The binding constraint had never been restated here** — see decision 1.

### 3. A discrepancy is now detected from the file's own git history

Settling "nothing" weakens ticket 05's claim that `stars_shown` is "how a rendered-versus-actual
discrepancy would be noticed": `star_clicked` fires on `onClick`, so `stars_shown` is the number as
**clickers** saw it, never as **viewers**.

**The detection channel is the git history of `scripts/star-count.json`.** Every weekly commit is a
dated before→after diff of the stars, and the workflow that writes the file already knows the true
number because it *is* what fetches it — so ground truth is in the repo, diffed and dated, with no
visitor telemetry at all. This is stronger than any sampled event rather than a fallback, and it costs
nothing. `star_clicked.stars_shown` remains as a secondary signal, correctly narrowed.

### 4. "Nothing" is pinned by one negative assertion

Without it, "nothing" is the path of least resistance: a future contributor adds
`title="as of {generated_at}"` because it seemed helpful, every existing test passes, and 03's decision
is silently reversed by someone who never read 03. **One assertion in PR2's test file** — the control
renders no `title`, and `generated_at` never reaches the DOM — by the same reasoning that already put a
truth-table test on the surface gate.

### Domain modelling

**No term added to `CONTEXT.md`.** The control is **stateless** — no localStorage key, no
sessionStorage key. Nothing here renames or reshapes the vocabulary.

### What this removes from the build

No `toast()` call anywhere; no `sonner` import; no acknowledgement component; no return-visit state;
no new stored browser key. PR2 is unchanged in size, and `star-count.json`'s `generated_at` stays
write-only.

### What it costs, stated rather than discovered

- The returning visitor who starred and comes back to an unmoved number **gets nothing**. The site
  cannot do otherwise: the only truthful words are the date, and decision 1 closed the date.
- The discrepancy is invisible from **both** ends — no acknowledgement to the visitor, and
  `star_clicked` fires only for clickers.

Accepted because the truth lives in the repo (the file's history plus the weekly assertion), not because
the embarrassment is unreal. It is real and predictable; it is answered by an alert to the maintainer
rather than by the page.

### The ticket's two named dependencies, confirmed collapsed

- **05's PostHog signal already existed.** The ticket predicted "this may not be a separate decision at
  all" — it was not one. Folded into `star_clicked`; **no second analytics decision was opened.**
- **06's surface boundary did not exist.** `preview.rnui.dev` 308s and serves no build; the Archive is
  out by structure. So the ticket's *"the same words on every surface"* is moot — there is exactly one
  surface, and it says nothing.

## Comments

- 2026-10-05 — Grilling ran as two rounds of two questions; the maintainer accepted all four
  recommendations. The deciding fact was not in the ticket: **`sonner` is mounted and unused**, which
  made the ticket's own cost argument ("it costs width in a header that already wraps") false, and left
  the real constraint — which is not width but **truthfulness** — as the only thing standing.
- 2026-10-05 — **Correcting the map, found while verifying this ticket.** The map's Notes said ticket 08
  "deleted" `metrics/weekly.json`, `scripts/metrics-update.ts`, `metrics:update` and
  `metrics-update.yml`, and that "none of them exists any more". **All four are still on disk**
  (verified 2026-10-05): `metrics/weekly.json` (416 B, `generated_at` 2026-06-04, stars 343),
  `scripts/metrics-update.ts`, `.github/workflows/metrics-update.yml`, and `"metrics:update"` at
  `package.json:24`. `scripts/star-count.json` and `.github/workflows/star-count.yml` do not exist
  either. Nothing in this map has been implemented — the map is a plan. An `/implement` session reading
  the map as written would skip PR0's four deletions and ship it as three subjects instead of seven.
  Corrected in `map.md`.
- 2026-10-05 — **Out-of-map finding, not acted on.** `CLAUDE.md` records "the three stored browser keys
  `"bookmarkedItems"`, `"votedItems"` and `"viewedEntryIds"`". `viewedEntryIds` is **sessionStorage**, and
  `lib/view-signal.ts:71-72` says so deliberately ("Deliberately not a Remembered set… those are
  localStorage"), so it is not one of the two Remembered sets the sentence groups it with. And there is a
  **fourth** localStorage key the sentence omits: `newsletterSubscribed`. Left alone — `CLAUDE.md` is
  outside this map's destination and carries a standing constraint, so the correction is the
  maintainer's call. It is load-bearing only as evidence for this ticket, and this ticket's answer adds
  no key of its own.

