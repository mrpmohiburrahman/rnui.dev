# Star control in the site header

Status: ready-for-agent

Spec synthesised from the wayfinder map at `.scratch/github-star-button/map.md` and its nine resolved
decision tickets. Every decision below traces to one of those tickets; the ticket name is given so a
reader can zoom to the reasoning and the measurements. Where this spec and a ticket disagree, the
ticket is right and this spec is stale.

Domain vocabulary is `CONTEXT.md`. The domain is **Recording** and **Contributor** (ADR-0008) — never
"entry" or "author". A star count is chrome, not a domain object, and **no term is added to
`CONTEXT.md`**. ADR-0008's rule still binds the one event this ships: `entry_id` and `entry_opened`
must never be emitted.

## Problem Statement

A visitor who wants to support rnui.dev has no way to star the repository from the site. The only
outbound links to it are the footer's small "Repository ↗" and a legacy drive-by line inside the
catalogue grid — neither is discoverable by someone who has not gone looking, and neither shows how
many people have already starred it. Meanwhile the site's most prominent shared number, the count of
Recordings, sits in the header, so the header is already where this site's counts live.

Adding a star control is easy. Adding one that a visitor can *check* is not, and the reasons compound:

- A star count is a number that will be wrong. The repository gained 7 stars in 123 days — 0.4 per
  week — so any refresh cadence has a window in which the number a visitor sees is behind reality.
- The site cannot observe a star. Starring is an authenticated action taken by the visitor in their own
  GitHub session, on GitHub. The site learns only that a link was followed, if anything.
- The header has almost no width to give. Its three columns are laid out so two equal flexible columns
  centre a fixed-width search bar, which caps the right-hand column at **half** the row's free space —
  128px at a 768px viewport. A third control does not fit inside that, and the header **already wraps
  there today**: measured against the live site, the `Saved` chip breaks onto two lines at 768 and 820,
  as does the theme toggle.
- Two spellings of the repository's address are in shipped code, and a third control would make three.

A visitor who stars the repository, comes back, and finds the number they caused to move has not moved
is a small, specific embarrassment sitting exactly on the feature's own promise. It is the failure this
spec is mostly about not shipping.

## Solution

A star chip in the header's right-hand column, sibling to the existing `Saved` chip, showing the
repository's star count and linking to it in a new tab.

The number comes from **a committed JSON file refreshed weekly by a dedicated GitHub Actions workflow**,
not from a fetch. GitHub is never in a visitor's request path. The number **always renders, with no
date and no expiry**, because the maintainer's decision is that the number is *checked* against GitHub
rather than glanced at, and a number that is checked needs to be right rather than decorated.

Because "always render" leaves a known window in which the number is 0–1 behind, the defence sits at
the other end of the pipe: **the weekly workflow asserts, at the start of each run, that its own output
file is no more than 9 days old, and fails the run if it is.** That failure is the email. A threshold
that fires on the first hiccup trains a maintainer to ignore it, so 9 days against a 7-day schedule
means two consecutive failed runs before anyone is told — ≈14 days' worst-case silence, which at
0.4 stars/week still leaves the rendered number only ≈0.8 behind.

Three accessibility obligations come with a control that leaves the site and the build fixes two faults
in its neighbours: one spoken accessible name at every width on both layouts, a 44px hit target on the
phone, and — found on the way — the phone `Saved` chip has **no accessible name today** and announces a
bare number, which the new control's shape would have inherited.

The work ships as **three sequential pull requests**, ordered so that each is independently reviewable
and the first touches no header code at all.

## User Stories

1. As a visitor on a desktop browser, I want the repository's star count visible in the header, so that
   I can see the project has support before deciding whether to star it.
2. As a visitor on a desktop browser, I want the star control to sit beside the other header controls,
   so that I look in one place for the site's chrome.
3. As a visitor on a desktop browser at 1280px or wider, I want to see the word "Star" beside the count,
   so that I know what the control does without having to infer it from a glyph.
4. As a visitor on a desktop browser between 768px and 1279px, I want the control to stay on one line
   and the theme toggle to remain reachable, so that the header is usable on a laptop or tablet.
5. As a visitor on a phone, I want the star control present in the phone header, so that the same
   action is available without widening my window.
6. As a visitor on a phone, I want the control's tap target to be at least 44px, so that I can hit it
   without aiming.
7. As a visitor on a phone at 320px, I want the header to fit without horizontal scrolling, so that
   nothing is pushed off screen.
8. As a visitor who follows the star control, I want it to open GitHub in a new tab, so that I keep my
   place on the catalogue.
9. As a visitor who follows the star control, I want to see an arrow telling me it leaves the site, so
   that I am not surprised.
10. As a screen-reader user, I want the star control announced as "Star 350 stars on GitHub", so that I
    know both what it does and how many people have done it.
11. As a screen-reader user on a phone, I want that same announcement, so that the phone layout does not
    reduce the control to a bare number.
12. As a screen-reader user, I want the `Saved` control announced as "Saved 12" on **both** the desktop
    bar and the phone header, so that the same control does not announce itself two different ways
    depending on my screen.
13. As a screen-reader user at a narrow desktop width, I want the `Saved` control to still announce
    "Saved 12" even though the visible word is hidden, so that hiding a word never removes a name.
14. As a keyboard user, I want to reach the star control by tabbing and activate it with a key, so that I
    do not need a pointer.
15. As a keyboard user, I want a visible focus indicator on the star control, so that I know where I am.
16. As a visitor, I want the star count to always be present rather than appearing a moment after the
    page loads, so that the header never reflows under me.
17. As a visitor on a slow connection, I want the header to arrive with its count already in it, so that
    nothing extra is fetched to draw it.
18. As a visitor, I want the number GitHub shows and the number this site shows to be close, so that I
    do not conclude the site is careless.
19. As a visitor who starred the repository yesterday, I want to understand any gap between the count here
    and the count on GitHub, so that I do not think my star did not register.
20. As a visitor, I want the site never to claim it knows whether I have starred the repository, so that
    nothing it says can be untrue.
21. As a visitor, I want the site never to thank me for starring, so that no message overstates what the
    site can actually observe.
22. As a visitor, I want no toast, banner or pop-up after following the star link, so that leaving for
    GitHub is not interrupted by something I did not ask for.
23. As a visitor, I want the star control to be hidden on branch deployments of the site, so that a
    throwaway preview of a pull request does not appear to ask me for a star.
24. As a visitor on the live site, I want the star control present on every route, so that it is not
    missing from the pages I happen to land on.
25. As a visitor, I want the star control to link to the repository's current address rather than a
    renamed alias, so that I do not follow a redirect.
26. As a maintainer, I want the star count refreshed automatically once a week, so that I never hand-edit
    it.
27. As a maintainer, I want to be emailed if the refresh stops working, so that a silently wrong number is
    not what I discover.
28. As a maintainer, I want the staleness check to tolerate a single missed or delayed run, so that one
    cancelled run does not train me to ignore the alert.
29. As a maintainer, I want the alert to tell me how old the count is and since when it has been stale,
    so that I know whether this is one bad cycle or a broken schedule.
30. As a maintainer, I want the refresh job to depend on as little as possible, so that it cannot fail
    for reasons unrelated to the star count.
31. As a maintainer, I want the count's own commit history to show what the number was and when, so that
    I can audit its accuracy without asking the site.
32. As a maintainer, I want to know when someone follows the star link and what number they were looking
    at, so that I can see whether the number visitors see matches reality.
33. As a maintainer, I want one event for the press rather than a general "repository clicked" event,
    so that outbound intent from the header is distinguishable from a Recording's source link.
34. As a maintainer, I want no repository link to be spelled two ways in shipped code, so that I stop
    finding the old address.
35. As a maintainer, I want the five stale GitHub numbers nothing reads to be deleted, so that the
    repository stops carrying a file whose whole job is to be right about one number and is not.
36. As a maintainer, I want the weekly job to keep writing its date even when the star count has not
    moved, so that a run can never pass having written nothing.
37. As a contributor, I want the project's repository, homepage and issue tracker declared in the
    package manifest, so that I do not have to guess where the code lives.
38. As a contributor, I want this change split into three reviewable pull requests, so that a layout fix
    is not reviewed as part of a button.
39. As a contributor, I want the count's mechanism to land before the control that reads it, so that the
    control is not reviewed alongside the machinery that feeds it.
40. As a reviewer, I want the first pull request to touch no header code, so that I can verify the
    mechanism on its own.
41. As a reviewer, I want the width regression the star control causes to be written down rather than
    encoded as a passing test, so that an accepted defect is not pinned as expected behaviour.
42. As a maintainer, I want the `Saved` chip's existing broken layout repaired in its own right, so that
    the header works at 768px whether or not a star button was ever added.
43. As a maintainer, I want the star control to be absent from the archived previous Design, so that the
    Archive keeps showing the past as it was.

## Implementation Decisions

### The count's source — lands first, touches no header

- **The count is a committed JSON file holding only the star count and its own date**, imported directly
  by the header component. The shape is exactly two keys:

  ```json
  { "stars": 350, "generated_at": "2026-10-05" }
  ```

  `generated_at` keeps the exact key name the file it replaces used, so existing prose stays literally
  true and no rename is introduced that nobody asked for.

- **The file lives beside the other automation-written committed data**, not in a data directory and not
  in the metrics directory this change empties. Precedent, not preference: the repository already keeps
  a committed JSON written by automation and imported by a component — the last-commit-date file. JSON
  module resolution is already enabled, so the import needs no config change.

- **A dedicated weekly workflow replaces the existing weekly metrics workflow entirely.** It is
  **shell-only with no toolchain at all**: no Node setup, no pnpm setup, no install step. This is the
  strongest available argument for the shape — the job being replaced has failed 18 runs out of 18,
  dying at a missing `pnpm` binary **before any of its GitHub calls**, so its failure surface is
  entirely toolchain and not at all GitHub.

- **Step order is load-bearing.** Four steps: check out at default shallow depth; **capture the age of
  the file as checked out**; fetch, write, commit and push; then assert on the captured age.

- **Two traps, both of which produce a workflow that looks correct and does nothing.**

  1. **The assertion must read the age captured before the write.** An assertion placed after the write
     that re-reads the file reads the copy the fetch step just made, is always zero days old, and never
     fires. This is the single most likely way to ship this broken.
  2. **The file must keep its date field.** With the date retained the file always differs week to
     week, so the commit always fires. A file holding only a number, whose value happened not to move,
     would take the "no changes to commit" branch and the run would **pass having written nothing** —
     the exact failure this design exists to prevent.

- **The assertion runs even when the fetch did not**, guarded to scheduled runs so a manual dispatch
  cannot fail on it. It compares whole days in UTC as integers and fails with the age and the date in
  the message. Threshold **9 days** against an unchanged weekly Monday schedule.

- **What the assertion catches, stated plainly:** a failed refresh, **one cycle late**. Ordinary exit
  codes catch a green run that wrote nothing, given the retained date; the date assertion adds the
  cross-run check, and it is the only thing in the system that can say *the refresh has been broken
  since date X*. **It cannot detect its own non-execution** — a workflow that never runs fires no
  step. No threshold changes that; only a second, differently-scheduled checker would, and that cost was
  declined.

- **The number's accuracy cost of the 9-day slack is nil.** At the measured growth of 0.4 stars/week,
  even a full 14-day silence leaves the rendered number ≈0.8 behind — inside the 0–1 already accepted.

- **This is a build-time read, and that is a consequence to state rather than discover.** The count is
  inlined when the site builds, so the rendered number changes when the weekly commit's **deploy** lands,
  not when the commit lands. That is how the last-commit-date file already works. On a branch
  deployment the count is whatever was committed when the branch was cut — consistent with the surface
  decision below.

- **Deleted as part of the same change:** the weekly metrics workflow, the committed metrics file, the
  script that wrote it, the now-empty metrics directory, and the npm script entry that ran it. All five
  are removed together because the five numbers they carried are read by nothing, and `open_issues`
  among them moves on its own clock — anyone filing an issue changes it — so a weekly snapshot of it is
  wrong most of the time and nobody would notice.

- **The one-line CI defect this feature inherited is moot.** The job that carried the pinned pnpm action
  version no longer exists. The sibling CI workflow carries an identical pin, stays red, and is **out of
  scope** — see below.

### The count's render policy

- **The number always renders. There is no branch, no fallback state, no empty case, no expiry, no
  date, no tooltip, no qualifier.** Whatever integer is in the file is what renders. A visitor cannot
  see a numberless chip, so the shape that was measured needs no second rendering.

- **The staleness disclosure is permanently closed.** The one truthful thing the site could say to a
  returning visitor is that the number is a snapshot from a given date — and that is exactly what was
  ruled out. It stays ruled out: a date in the UI is a standing claim that this number is good enough to
  date, which would turn the 9-day failure into a number the page has publicly committed to and visibly
  broken. The alert goes to the maintainer, which is the right place for it.

- **No acknowledgement of any kind.** No toast, no banner, no one-line note, no changed chip copy, and no
  return-visit state. "Thanks for starring" claims an observation the site cannot make; changing the
  chip to a "Starred"-style state both claims something about the visitor's GitHub account on the
  evidence of one outbound click and spends the count, which is the entire social proof.

- **A discrepancy is detected from the committed file's own history.** Every weekly commit is a dated
  before-and-after diff of the number, and the workflow that writes the file already knows the true
  value because it is what fetches it. That is ground truth, dated, diffed, and already in the
  repository's history — stronger than any sampled event and costing nothing.

### The control's shape

- **The chosen direction is the one that pays for its width out of two words rather than out of
  structure.** It takes the existing chip's shape at every desktop width, with the words "Saved" and
  "Star" appearing only from the widest breakpoint.

- **Placement: the right-hand column of the desktop bar, between the `Saved` chip and the theme
  toggle.** Third chip, sibling to `Saved`, same rounded-chip / hairline-border / secondary-text
  treatment, because that is the vocabulary the header already speaks.

- **Rendered forms:** `★ Star 350` at the widest breakpoint, `★ 350` below it, and `★ 350` on the phone
  beside the existing `◆ 0` chip. Every candidate direction fitted the phone down to 320px, so the
  phone needed no direction of its own beyond sizing.

- **The visible word becomes visual-only below the breakpoint, never removed from the accessible
  name.** The header already contains this exact pattern: the theme toggle draws its glyph
  `aria-hidden` and hides its word in compact mode while an `sr-only` label carries the name.

- **Width budget, and why the arrangement is forced.** The row is gutters plus a fixed-width centre
  column plus two equal flexible columns that exist to centre the search bar. The flexible pair splits
  free space **50/50 regardless of content**, which caps the right column at half the row's free space —
  128px at 768px — while ≈66px idles in the left column holding only the wordmark. Today's word-bearing
  `Saved` chip needs ≈177px of that 128px and breaks. The wordless form needs ≈123px and fits. Adding
  the star chip needs ≈191px and does not. **Every alternative shifts which control breaks, not whether
  one does** — this is structural, not a preference.

- **The residual breakage is introduced, not inherited, and it is accepted with its price stated.** The
  star chip re-wraps the theme toggle across roughly the 768–880 band, a band carrying **1.1% of real
  pageviews**, on top of the chosen direction's own accepted 860–890 regression. The only remaining
  width source — the theme toggle's own word, ≈34px — was rejected because it would leave the control
  that changes the theme announcing nothing but "Toggle theme" while looking like the star chip's
  glyph. **That accepted regression is recorded in each pull request's body as a manual measurement,
  never as a passing test**, so it does not become expected behaviour in a suite that outlives this
  effort.

- **The header's deliberate no-width-reservation rule on its counts stands.** It was removed once before
  so a count changing from one digit to another could not shove the toggle sideways, and it stays
  removed. What is new is that the row now carries two counts with no reservation, which the change log
  notes rather than the recorded rule reopens.

### The control's three obligations

- **Accessible name: one string, spoken on every layout — "Star {count} stars on GitHub."** The word is
  hidden visually below the breakpoint and never removed from the name. Matching each layout to what it
  draws was rejected precisely because the phone form would announce a bare "350".

- **The phone `Saved` chip gains the accessible name it has never had.** It announces a bare number
  today, which the new control's shape would otherwise inherit. Both layouts announce "Saved {count}"
  afterwards. The fix adds no visible word, only the spoken one — and it lands with the accessibility
  change, not with the star control, so no pull request becomes the two-subject pull request the split
  exists to prevent.

- **Exit behaviour: a new tab**, carrying the `noopener noreferrer` relationship and a trailing
  `aria-hidden` arrow, matching the footer's existing convention where the arrow means "leaves the
  site". A new tab is also the reliable choice: a same-tab link would race the page unload.

- **Hit target: 44×44 on the phone**, reached by a transparent pseudo-element expanding a smaller
  glyph — the treatment and the reason the phone's facet-remove button already uses, and the reason the
  painted chip does not move in the layout. The desktop chips are left alone; they measure ≈33px today
  and raising them is a different piece of work in a band with zero headroom.

### Analytics

- **One new event, through a named export beside the existing reporters, carrying exactly one property:
  the count that was on screen.** Called from the control's click handler in both layouts through one
  shared function, so the desktop bar and the phone header cannot drift apart the way the two `Saved`
  spellings did.

- **No staleness property, and there is no such state to send.** The file carries a date; the render
  deliberately keeps it out, and leaking it into analytics would reintroduce the one thing that was
  decided against.

- **Not named for the repository link that already exists.** That event means *a Recording's outbound
  source link was followed* and carries the Recording's facts — it is the naming rule's own example of a
  name that means something specific. The star control has no Recording behind it, so reuse would either
  require null Recording fields or quietly give an existing event a second meaning.

- **A naming collision is accepted rather than avoided.** The site already has a vote event for rating
  a Recording, so "star" is now two kinds of approval — one toward a Recording, one toward the
  repository. They are separate events with separate names, so nothing collides in the data.

- **Two notes for whoever reads the dashboard.** Autocapture is on, so these clicks also land in
  PostHog's own autocapture stream — count on the named event, do not add the two. And this is the
  site's first tracked chrome link, so there is no baseline for outbound header clicks to compare
  against.

### Which surfaces carry it

- **The live site only, gated on one predicate: the Vercel system environment variable is not the
  preview environment.** One predicate, evaluated once, read by both layouts. The variable is a Vercel
  **system** variable, so nothing new has to be set on Vercel and it cannot be set wrongly; it is
  inlined at build time, which is what makes it readable from a client component.

- **The predicate fails open** — absent means shown — deliberately, so a local dev server still builds
  the control. That is precisely why it needs a test pinning its truth table rather than inspection.

- **The Archive is excluded by structure, not by a check.** It is a separate Vercel project and its
  branch has no header component at all, so there is nothing to gate.

- **The premise that there was a Preview to exclude was stale, and correcting it is most of the answer.**
  The Preview hostname 308-redirects to the live site and serves no build. The surface that genuinely
  can carry the control is **every branch deployment**, which is public because deployment protection is
  off, and which compiles a retired analytics project's key. Branch URLs only travel to people already
  inside this work, so the cost would be a tracked event landing in a dashboard nobody opens — on the
  one surface where a click is easiest to test. Hence the gate.

- **One existing architectural record is amended as its own commit.** A decision record states that no
  deployed build compiles the retired analytics key. That is true of anything serving a hostname and
  **false of branch aliases**, which carry the preview environment's variables. The amendment lands
  here rather than being left to drift.

### The repository address

- **`github.com/mrpmohiburrahman/rnui.dev` is canonical.** It matches the domain, the social card, the
  metrics job, every readme badge, and the git remote. The old spelling's only advocate was the package
  manifest's name field, which nothing in the app reads. GitHub renamed the repository; the code was
  lagging. GitHub confirms both paths answer with the same full name — this is a redirect alias, not a
  second repository.

- **All four places carrying the alias are corrected, and they are not two.** Two are shipped links and
  **two are end-to-end tests that pin the alias as a string.** Those tests assert *that the served HTML
  carries a repository link*, not *which* repository link, so the assertion stays and only the expected
  string changes. Correcting the links without the tests fails the suite; correcting the tests alone is
  not a change at all.

- **This is its own commit, not its own effort.** The star control writes this exact string, so unlike
  the out-of-scope CI fix, the drift is on-topic here.

- **The manifest is fixed fully.** Renamed to match, and given the missing repository, homepage and
  issue-tracker fields. The rename removes the stale value that is the probable source of the drift; the
  repository field is what stops a future contributor hardcoding a guess. The lockfile does not
  reference the root package name, so the rename touches nothing else.

- **No shared constant for the address.** It goes in as a literal, as it does everywhere today. A single
  exported constant is the tidier shape and there is precedent for one, but it is an implementation
  choice inside a spec and was declined. If the same drift ever reappears, that is when.

### Build sequence — three pull requests, strictly ordered

| PR | Subject | Touches the header? |
|---|---|---|
| **PR0** | The star count's source: new workflow, seeded file, delete the five dead things | **no** |
| **PR1** | The `Saved` chip announces one name at every width | yes |
| **PR2** | Add the star control | yes |

- **PR0 first**, for three reasons. Left inside PR2 it would make that pull request a three-subject pull
  request — count source, star chip, and a breakpoint move. It is the only work in this feature
  verifiable **without touching the header at all**: a green run and a committed diff, which typecheck,
  lint and unit tests neither pass nor fail on. And it starts the weekly cadence early, so the count is
  correct and the assertion has been observed for real before anything renders it.

- **PR1's breakpoint differs from PR2's, deliberately.** PR1 has no star chip and its arithmetic differs.
  It uses the middle breakpoint, where the baseline is already clean, and drops the word below it — which
  makes PR1 a **complete** repair of the band the bug lives at, and genuinely reviewable and revertible on
  its own as a bug fix. PR2 then moves the breakpoint one step wider, which is the chosen direction.
  Using the wider breakpoint in both would be strictly worse at exactly the widths the bug exists at. One
  class string, changed twice; the churn is honest and in service of a correct intermediate state.

- **PR1 must add the desktop accessible name too, or it is not safe to land alone.** Dropping the visible
  word without it would ship the exact fault the name rule exists to prevent.

## Testing Decisions

**What makes a good test here:** assert what a visitor or a maintainer can observe, never how the
component is built. Height and hit-target claims are **hit-tested rather than measured** — the border box
is not the touchable area — and are asserted through the browser's own hit testing at real viewport
widths, because the whole feature is a width-budget problem that cannot be checked by reading the class
strings. Every assertion here is one that fails for exactly one reason.

Four seams, three of which already exist. The preference throughout is the highest seam that can carry
the claim.

**1. Served HTML — the existing served-document spec, extended. This is the highest seam and it carries
the feature's central architectural claim.**

Asserting the star count **appears in the served document** is the proof that GitHub is never in a
visitor's request path: if the number is in the HTML the server sent, it was inlined at build time from
the committed file. This seam also rides the header's existing Suspense fallback, which is the mechanism
that puts the whole control set into the served document — so an assertion here catches the control
being absent from the fallback, which is a failure mode the header's own comments single out. Prior art
for both halves exists in the same file: assertions on served-HTML substrings from the header's fallback,
and a served-HTML assertion that a link is present at all.

This seam carries four assertions:

- the star control's markup is in the served document, with its accessible name, its canonical
  repository address, its new-tab relationship and its arrow;
- **the rendered number equals the number in the committed file** — the build-time-inlining proof;
- the file's date is **absent** from the served document, which is the no-disclosure policy enforced at
  the point the policy lives rather than in the DOM after hydration;
- the control carries no title attribute.

The last two together are what make "the site says nothing about staleness" a **decision rather than the
path of least resistance.** Without them a future contributor adds a date to the tooltip, every test
still passes, and a settled decision is silently reversed by someone who never read it.

**2. The rendered page — layout and measurement only.** Prior art for both shapes exists: bounding-box
assertions in the headings and recording-route specs, and the hit-test-not-measure rule in the
accessibility gate.

- **`Saved` chip is single-line at 768 and 820** — PR1's regression test. **Nothing is asserted about
  the theme toggle, deliberately.** A test covering both controls passes on PR1 and goes red after PR2
  merges, because PR2 reintroduces the toggle wrap that was accepted on purpose. Whoever writes it
  naively hits a green-to-red test on a deliberate decision; the alternative — amending the test in PR2
  to assert the toggle *does* wrap — pins an accepted defect as expected behaviour in a suite that
  outlives this effort. The toggle's state is a manual measurement note in each pull request body, the
  same way the direction was chosen.
- **The phone star control is at least 44×44**, hit-tested at a phone viewport.
- **The accessible name is identical at every width and on both layouts** — desktop above and below the
  breakpoint, and the phone. This is the assertion that catches the word drop taking the name with it,
  which is the specific trap PR1 has to avoid.

**3. The analytics seam — the existing capture spy, reused verbatim, plus the existing reporter unit
suite.** The e2e suite already installs an init script that wraps the analytics client's capture call and
records every event and property pair with no network leaving the page; the assertion is deterministic
because the events read only fire on interactions the test drives. Extend it to assert the star event
fires from **both** layouts with the count as its only property — one test, because a handler shared by
both layouts is the mechanism that stops them drifting.

The reporter itself gets a unit test in the existing suite, alongside the fourteen reporters already
tested there. That suite's stated purpose is that no event carries visitor-entered text and that property
names are right — which is exactly the claim this event makes, being the site's first tracked chrome
link carrying plain numbers with no Recording behind it.

**4. The surface predicate's truth table — the one new seam, and it requires one interface change.**
The gate reads a build-time-inlined variable, so in the unit suite it is an ordinary runtime read and is
testable **only if the predicate is a function of an argument**. A module-level constant inside the
header component cannot be reached, and the policy that matters here — fails open, so a local dev server
still builds the control — is exactly the kind that fails silently. So the predicate is **extracted to a
small client-safe library module**, matching the existing precedent for such a module in the codebase.
Its truth table is asserted directly: preview hides, production shows, absent shows.

**Deliberately untested, with the reasons:**

- **The workflow's staleness assertion.** It is shell inside a YAML workflow; the unit runner cannot
  reach it and the linter does not lint YAML. The accepted mitigation is that the comparison is
  deliberately trivial and auditable by reading — two epoch values, integer division, one integer
  compare. Its verification is a manual dispatch plus a green run.
- **The 768–880 regression after PR2**, for the reason given above.
- **The surface gate as built.** The unit test pins the truth table; whether the deployed build actually
  inlined the expected value is an operational check on a built chunk, and is recorded as such rather
  than pretended at by a test.

## Out of Scope

- **The residual 768–880 header breakage, once the accessibility fix has repaired what it can.** Ruled
  out by the ticket that decided the split. The theme toggle re-wraps across roughly that band to fit a
  control nobody asked for; accepted at 1.1% of pageviews. **For whoever takes this next, the root
  cause is recorded:** the two equal flexible side columns split free space 50/50 to centre the search
  bar, which caps the right column at half the row's free space while ≈66px idles on the left. That cap
  is what no arrangement of three controls fits inside. Fixing it means changing the header's centring
  logic, which moves the search bar's midpoint — which the existing layout exists specifically to
  prevent.
- **Repairing the sibling CI workflow's pinned pnpm action version.** It carries the identical defect
  against the same manifest field and has been red since 2026-09-25, but nothing this feature does runs
  through it. Bundling a one-line delivery fix into a pull request whose subject is a star button is how
  a one-line fix gets reviewed as four. The workflow this feature *did* inherit that pin no longer
  exists, so there is nothing left to fix together.
- **Fetching the star count at runtime, and any token to do it with.** The number comes from a committed
  file, so GitHub is never in a visitor's request path. This also rules out an incremental-revalidation
  window and any usage of the platform's own token in the deployment environment.
- **Actually starring the repository from the site.** Impossible without the visitor's GitHub session.
  This is a constraint, not a work item, and the destination was drawn around it.
- **Sponsorship, pricing and any other star-adjacent monetisation.** Already researched elsewhere in the
  repository, citing the 350 stars. This feature must not duplicate or reopen it.
- **The public submissions flow.** A separate effort owns the form; nothing here touches it.
- **A shared constant for the repository address.** Declined as an implementation choice inside a spec.
- **Correcting the archived previous Design's own star link.** It points at the old alias, which this
  spec corrects in four places on the current site. Left alone deliberately, and recorded so it is never
  read as drift this feature left behind. Not "frozen is frozen": the Archive's promise is that it shows
  the previous Design *as it was*, and a link repointed at today's repository would be a false claim
  about the past.
- **Whether the footer should carry the star count**, and **how the star control interacts with the
  site's two conversion paths.** Both were ripe and both reach past the header, which is the destination;
  they are recorded in the map's out-of-scope section with their substance intact so a later effort picks
  them up rather than re-derives them.

## Further Notes

- **The spec's own source is nine decision tickets, and one of them is worth reading before any code
  changes:** the count-policy ticket. It settles that the number is meant to be *checked* against
  GitHub, which is what makes the no-disclosure policy a deliberate choice rather than an oversight, and
  it prices the consequence at 0–1 stars behind.
- **Preconditions on the maintainer, not the code.** Two things cannot be verified from this repository
  and both are recorded rather than assumed. GitHub emails on a failed workflow only if Actions email
  notifications are enabled in the maintainer's account settings; if they are off, the 9-day assertion
  becomes the only defence and nothing announces that it fired. And the environment variable the surface
  gate reads is documented by the platform but has never been read in this repository, so the
  implementer's first check is to grep a built preview chunk against production.
- **A weekly bot commit lands on the main branch, forever.** That is the mechanism working, not noise.
- **The direction was chosen by measurement, not taste.** Six directions were built and measured against
  the live site at real viewport widths; the winner is the one that pays for its width out of two words
  rather than out of the layout's structure. The prototype lives on a throwaway branch and is not to be
  merged.
- **Three costs are stated here rather than left to be discovered**, because each is a thing that will
  otherwise look like a bug: the theme toggle re-wraps at 768–880 and the direction's own arrangement
  regresses 860–890; the rendered number can be 0–1 behind GitHub at any moment; and the star count can
  sit unchanged for up to two cycles before anyone is emailed.
- **Nothing in this feature adds a term to the domain glossary.** The domain is Recording and
  Contributor. A star count, a workflow, and a chip are chrome.
