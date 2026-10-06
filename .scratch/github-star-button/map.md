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

- **This map is done, and so is the plan built from it.** [`spec.md`](spec.md) is published
  2026-10-05 with `Status: ready-for-agent`, and the implementation tickets are at
  [`build/issues/`](build/issues/) — **four of them, not three.** They live in `build/issues/` rather
  than beside this map's nine decision tickets so the two numbering schemes never collide; **an
  `/implement` run must work `build/issues/`, not `issues/`.**

  | # | Subject | Blocked by |
  |---|---|---|
  | 01 | Star count comes from a weekly committed file | — |
  | 02 | One spelling of the repository address | — |
  | 03 | The `Saved` chip announces one name at every width | — |
  | 04 | The header's star control | 01, 03 |

  **The frontier is three tickets wide**, not one: 01, 02 and 03 gate nothing and can run in
  parallel. **02 gates nothing** despite being worth landing early — the star control writes the
  canonical address whether or not the four stale sites are fixed yet, so no edge is drawn.
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
- **The header breaks at 768–880 today, and this feature is half the cause of that band.** Measured
  2026-10-05 with no star control present: `◆ Saved` wraps to 46px and the mode toggle to 49px at 768
  and 820. `site-header.tsx:90-92` already records that the md-to-lg band does not fit. **Ticket 07
  split this in half and the map records it rather than smoothing it:** PR1's word drop makes the band
  **clean** (≈123px of 128px), and PR2's star chip **re-breaks it** (≈191px of 128px) to fit a control
  nobody asked for. So the breakage is not inherited, it is partly reintroduced — accepted, priced at
  1.1% of traffic, and Out of scope below. The arithmetic lives in ticket 07's answer; the root cause
  is that the two `flex-1` side columns (`:97`, `:116`) split free space 50/50 to centre the search bar,
  which caps the right column at half the row and leaves ≈66px idling on the left.
- **The count's source is settled, and it is not the source ticket 02 chose.** Read
  [What may a stale count be allowed to say](issues/03-what-may-a-stale-count-be-allowed-to-say.md)
  before writing any code — it **supersedes ticket 02's mechanism**. The count is a **committed file
  holding only the star count**, refreshed weekly, and it **always renders with no expiry and no
  date**. The bound is on the refresh (fail if the file is more than 7 days old), not on the render.
  GitHub is never in a visitor's request path. **Ticket 08 then settled the shape around it**, and its
  two figures differ from ticket 03's, so read it too: the file is **`scripts/star-count.json`**
  (`{"stars": N, "generated_at": "YYYY-MM-DD"}`), the writer is **`.github/workflows/star-count.yml`**
  — shell-only, **no toolchain**, no `setup-node`, no `pnpm/action-setup`, no install — and the
  threshold is **9 days**, not 7. Ticket 08 **decided the deletion** of `metrics/weekly.json`,
  `scripts/metrics-update.ts`, `metrics:update` and `metrics-update.yml`, and **PR0 carries it out**.
  Verified 2026-10-05: **all four are still on disk** — this map plans, nothing is built — so **PR0 is
  seven subjects, three additions and four deletions**, not three.
- **The map's CI-repair boundary has closed, and `metrics-update.yml` is no longer a repair.** Ticket 03
  pulled `metrics-update.yml` into this effort because the chosen design *was* that workflow. **Ticket 08
  then decided its deletion** rather than repairing it, so the one-line `version: 9` fix this map
  inherited is
  **moot — the job that carried   the pin no longer exists.** `.github/workflows/ci.yml` still carries
  the identical `version: 10` pin against the same `packageManager` field and is **still out of
  scope**, unchanged and still red. Do not "fix both together"; there is nothing left to fix together.
- **One thing about the alert cannot be verified from this repo:** GitHub only emails on a failed
  workflow if Actions email notifications are enabled in the maintainer's account settings. If they are
  off, the 7-day assertion becomes the *only* defence and nothing would announce that it had fired.
- **`preview.rnui.dev` is a redirect, and "the Preview" is a dead word.** Measured 2026-10-05: `/` and
  a deep path both 308 to `www.rnui.dev`. There is no Preview build. What replaced it as a live public
  surface is **every `rnui-dev-git-*.vercel.app` branch alias**, each carrying the Preview
  environment's variables — which is why a branch deployment compiles the retired PostHog project
  559028's key while `www` and `old` compile 117415's. ADR-0010 says no deployed build compiles it;
  that is true of anything serving a hostname and **false of branch aliases**, and this map amends the
  sentence. Say **branch deployment**, not "the Preview" — `preview` is already `_Avoid:` on `CONTEXT.md`
  for a Demo, and `CONTEXT.md` has no term for this surface at all.
- **The spec must verify the surface gate rather than trust it.** `NEXT_PUBLIC_VERCEL_ENV` is documented
  by Vercel but has never been read in this repo, so there is no in-repo evidence it is populated. The
  implementer's first check is to grep a built preview chunk against production — the same check that
  caught the ADR-0010 error. It also **fails open** (absent ⇒ shown), deliberately, so local `next dev`
  still builds the control; that is why it needs a test pinning its truth table and not inspection.

- **`main`'s CI is red right now** (6 consecutive failures, both jobs, `Multiple versions of pnpm
  specified`) and the weekly metrics job has failed 18 runs out of 18. Both were the same class of
  mistake — `pnpm/action-setup` pinned with `version:` against a `packageManager` field. **The two are
  no longer on opposite sides of a scope line, because one of them stopped existing:** ticket 08
  deleted the weekly metrics workflow rather than repairing it, so `main`'s remaining redness is
  `ci.yml`'s alone and stays out of this effort.
- **Standing preference:** prototypes go through `/prototype` and are throwaway. Rough is correct;
  high fidelity spent before the direction is chosen is waste. Prototype work lands on a
  `prototype/<name>` branch, never `main`.
- **The build is three PRs, not two, and ticket 08 added the one that goes first.** Ticket 07 fixed
  PR1 (the `Saved` chip's accessible name) and PR2 (the star control, sequential after PR1). **PR0 is
  the count's source** — the new `star-count.yml`, the seeded `scripts/star-count.json`, and the four
  deletions — and it merges **before PR1**, because inside PR2 it would make that PR a three-subject
  PR, and because it is the only work in this map verifiable **without touching the header at all**
  (a green Actions run and a committed diff). It also starts the weekly cadence early, so PR2 lands on
  a mechanism with a history. PR1 → PR2 remains strictly sequential.
- **Two traps in PR0 are recorded because an implementer gets both wrong by default.** The staleness
  assertion must read the age **captured before the write** — an assertion placed after the write that
  re-reads the file reads the copy the fetch step just made, is always 0 days old, and never fires,
  while looking entirely correct. And the file's `generated_at` **must stay**, or an unmoved star
  count means no diff, the commit step takes its "No changes to commit" branch, and the run **passes
  having written nothing** — the precise failure ticket 03 exists to prevent.
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
- [What the control is called, and does it say anything](issues/05-what-the-control-is-called-and-does-it-say-anything.md) —
  **One spoken string at every width: "Star {count} stars on GitHub"**, new tab with the footer's `↗`,
  44px phone hit target by the `✕`'s transparent-`::before` method, and one PostHog event `star_clicked`
  carrying only `stars_shown`. Found and fixed on the way: **the phone `Saved` chip has no accessible name
  today** — it announces a bare "12" — so the star control's phone shape would have inherited the fault.
Desktop chips stay under 44; not this ticket's business. Bound on ticket 07: the `Saved` accessible
   name must survive its word drop.
- [Does the Saved chip's word drop ship with the star control, or separately](issues/07-does-the-saved-chips-word-drop-ship-with-this.md) —
  **Bundled in this spec, shipped as two PRs; the 768–880 repair in scope only as far as F requires.**
  PR1 = "the `Saved` chip announces one name at every width" (both `aria-label`s + the word going
  visual-only below `lg`, which **fully repairs** the 768–880 band); PR2 = the star control, moving that
  word `lg` → `xl`. The build is sequential. All four alternative width sources ruled out with the
  arithmetic behind them: the right column is capped at **half** the row's free space (128px at 768,
  because two `flex-1`s split it 50/50 to centre the search bar), and star + toggle + Saved need ≈191px
  — so every alternative shifts *which* control breaks, not whether one does. **Corrected mid-ticket:**
  the residual toggle wrap is **introduced, not inherited** — PR1 repairs it and PR2 puts it back to
  fit a control nobody asked for, which is a different sentence from the one this map first assumed.
  Price stated: ≈58px from a 128px column, 1.1% of pageviews, on top of F's own 860–890 band. PR1's
  proof is a Playwright assertion on the `Saved` chip alone, **deliberately not** on the toggle, because
  a test covering both goes green-to-red on PR2's accepted cost. `:134-138`'s no-width-reservation rule
  survives, re-examined against the row's second count.
- [Which surfaces carry the control](issues/06-which-surfaces-carry-the-control.md) —
  **The live site only, gated on `NEXT_PUBLIC_VERCEL_ENV !== "preview"` — one predicate, read by both
  layouts.** The ticket's premise was stale, and correcting it is most of the answer:
  **`preview.rnui.dev` 308s to `www` and serves no build at all**, so there was nothing to exclude
  there. The surface that *can* carry the control is **every Vercel branch deployment of `rnui-dev`** —
  public, because Authentication is off, and compiling the **retired** PostHog project 559028's key.
  Smaller than it looked: branch URLs only travel to people already inside this work. What it would
  really have cost is ticket 05's `star_clicked` landing in a drawer nobody opens, on the one surface
  where a click is easiest to test. The Archive is out **by structure, not by a check** — `old` is a
  separate Vercel project and `origin/old` has no `site-header.tsx` at all, and it already carries
  its **own** star ask at `top-nav-bar.tsx:63-76` pointing at the old alias. Left alone; divergence
  recorded. Found on the way: **ADR-0010's "no deployed build compiles `phc_oFZiXjSi…`" is false** —
  branch aliases do — so that one sentence is amended here, as its own commit.
- [Does the star file get its own workflow, or ride with the existing one](issues/08-does-the-star-file-get-its-own-workflow.md) —
  **Its own workflow, shell-only with no toolchain, weekly, with a 9-day refresh-time assertion — and
  `metrics/weekly.json` plus everything that wrote it are deleted.** The headline question turned out
  to be **derived, not chosen**: extending a workflow means adding a job to it, so deleting the five
  unread numbers leaves nothing to extend. The job is **no toolchain at all** — no `setup-node`, no
  `pnpm/action-setup`, no install — which is the strongest available argument, because today's run
  died at `pnpm` **before any of its five API calls**, making the failure surface 100% toolchain and
  0% GitHub. The file is **`scripts/star-count.json`**, chosen by existing precedent rather than
  preference: `scripts/lastCommitDate.json` is already a committed JSON written by automation and
  imported by a component. Two traps named because an implementer gets both wrong by default — the
  assertion must read the age **captured before the write** (re-reading the file reads the copy just
  written and never fires), and **the date field must stay** (without it an unmoved star count means
  no diff, the commit step passes, and nothing is written — the exact failure ticket 03 exists to
  prevent). Threshold 9 days on a 7-day period = **two consecutive failures before the email**, ≈14
  days' worst-case silence; against the real history it would have fired **2026-06-15, 112 days ago**,
  and it costs nothing in accuracy (0.4 stars/week ⇒ even 14 days is ≈0.8 behind, inside the 0–1
  ticket 03 priced). **This becomes PR0 and goes first** — three subjects in PR2 otherwise, and it is
  the only work in this map verifiable without touching the header. Email-only alerting accepted with
  the unverifiable Actions-notification setting carried as a **precondition**. The old workflow's
  `version: 9` fix is now **moot**: the job that carried the pin is gone.
- [Does anything acknowledge the press](issues/09-does-anything-acknowledge-the-press.md) —
  **Nothing. The site narrates nothing**, and ticket 03's "no date anywhere" is **absolute**. The only
  truthful words available for the returning visitor were about the date, so closing the date closed the
  acknowledgement; a "thanks for starring" toast is out on truth grounds, and `★ 350` → `★ Starred` was
  out twice over — it claims something about the visitor's GitHub account from one outbound click (the
  `newsletterSubscribed` defect in miniature) and it **spends the count** to do it. Reframed by a fact
  the ticket got wrong: **`sonner` is mounted at `app/layout.tsx:116` and has zero call sites**, so its
  cost argument — *"it costs width in a header that already wraps"* — was false, and the only real
  constraint left was truthfulness, not width. **Detection of a rendered-versus-actual discrepancy moves
  to the git history of `scripts/star-count.json`**, which is dated ground truth the workflow already
  possesses, and it **weakens ticket 05's claim for `stars_shown`** — `onClick` samples clickers, never
  viewers. The control is **stateless**: no toast call, no `sonner` import, no new stored browser key, and
  PR2 unchanged in size — bought with **one negative assertion** pinning that no `title` and no
  `generated_at` reach the DOM, since "nothing" is otherwise the path of least resistance.

## Not yet specified

_Nothing. The fog is discharged — its three patches are now ruled out of scope below, with the reasoning
and their substance recorded intact._

## Out of scope

- **Everything beyond the header itself.** The map's last three fog patches were all ripe and all
  deliberately left unticketed, and this is the session the patch itself named: *"a session with the
  destination's edge in view should decide whether these are in it at all before asking them."* The
  destination is **a build-ready spec for a star control in the site header**, all three patches reach
  past the header, and the maintainer had already narrowed twice toward it — 768–880 out over fully in,
  then the residual wrap accepted over buying its width. Graduating them now would be the opposite of
  the direction just given, so they are ruled out of this effort rather than left as fog that can never
  clear. Recorded here whole, so a future effort picks them up rather than re-derives them.
  - **Whether the footer should carry the star count at all.** The footer's CONTRIBUTE column and
    `/aboutus` were the two places a count would also belong. Charting's premise was wrong and is
    settled: `/aboutus` links the maintainer's four *other* repos and carries no link to this one in
    either spelling, so there is no alias to clean there, and ticket 04 fixed the footer's only alias.
  - **How the star control interacts with `/submit` and `/subscribe`.** Ticket 09 sharpened this into
    being **spatial rather than tonal**: with nothing said, the control has no message that could compete
    with the two conversion paths it sits beside. `recording-card-grid.tsx:327` — "Add your own recording
    on GitHub ↗" — remains the legacy drive-by ask the footer's `/submit` link replaced; ticket 04
    corrected its address and deliberately left its wording and its existence alone.
- **The residual 768–880 header breakage, once PR1 has fixed what it can.** Ruled out by
  [Does the Saved chip's word drop ship with the star control, or separately](issues/07-does-the-saved-chips-word-drop-ship-with-this.md),
  and stated here because it is **introduced rather than inherited** — the sentence this map first
  assumed and the ticket falsified. PR1's word drop makes 768–880 clean (≈123px against a 128px
  column); PR2's star chip re-wraps the theme toggle across roughly that band (≈191px against 128px).
  Accepted at **1.1% of pageviews** (76 pageviews / 90 days) on top of variant F's already-accepted
  860–890 band. What was weighed and declined is recorded in the ticket: the only remaining width
  source is the theme toggle's own word below `xl` (≈34px), which would leave the control that changes
  the theme announcing nothing but "Toggle theme" while looking like the star chip's glyph. **The root
  cause, for whoever takes this next:** the two `flex-1` side columns split free space 50/50 to centre
  the search bar (`site-header.tsx:97`, `:116`), which caps the right column at **half** the row's free
  space — 128px at 768 — while ≈66px idles on the left holding only the wordmark. That cap is what no
  arrangement of three controls fits inside.
- **Repairing `.github/workflows/ci.yml`.** Still out of scope, and **narrower still than it was**:
  `metrics-update.yml` first moved into this effort when the maintainer chose it as the count's
  mechanism, and ticket 08 then **decided its deletion instead of repairing it**, so nothing on this
  path shares
  the defect any more. `ci.yml` carries the same `pnpm/action-setup` pin against the same
  `packageManager` field and has been red on `main` since 2026-09-25, but **nothing the star control
  does runs through it**. Fixing it belongs in a build-and-delivery effort, and bundling it into a PR
  whose subject is a star button is how a one-line fix gets reviewed as four.
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
- **Correcting the Archive's own star link.** `origin/old:components/nav/top-nav-bar.tsx:63-76` carries
  `☆ Star us on GitHub` → `awesome-react-native-ui`, the alias ticket 04 corrected in four places on
  `main`. **Left alone deliberately, and recorded so it is never read as drift this map left behind.**
  Not "frozen is frozen" hand-waving: the Archive's promise is that it shows the previous Design *as it
  was*, and a link repointed at today's repository would be a false claim about the past. ADR-0010
  already rules backporting out; this adds no new ruling, only the record.