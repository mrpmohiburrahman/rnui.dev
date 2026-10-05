# Does the Saved chip's word drop ship with the star control, or separately

Status: resolved
Type: grilling
Blocked by:

## Notes

**From ticket 05, and binding on the decision below however it lands.** Ticket 05 settled that a chip's
accessible name is **one string spoken at every width**, and it fixed the phone `Saved` chip's missing
word as part of that — so both layouts announce "Saved {count}" today. Ticket 01's word drop removes the
*visible* word below `xl`. If the accessible name goes with it, the desktop bar announces a bare number
between `md` and `xl`, which is the exact fault the phone chip had and the reason 05's rule exists.

So whatever is decided about shipping the word drop, and about which widths drop it: **the accessible
name must stay "Saved {count}" at every width.** The word becomes visual-only from `xl`, exactly as
ticket 05 made it for the star control. This constrains the decision; it does not make it.

## Question

**The chosen direction costs a change to a component the star control was never meant to touch.**

[Five directions for the star control](#01) resolved to **variant F**: A's chip shape at every desktop
width, with the words "Saved" *and* "Star" appearing only from `xl`. That only works because the
existing `Saved` chip gives up its word below `xl` — and it can, because the phone header at
`site-header.tsx:175` already draws `◆ 0` with no word at all. But shipping it means editing a
component that is not the star button.

Underneath that is a finding, not a preference. Measured on 2026-10-05 against the real site with no
star control present: **the `Saved` chip already wraps to 46px and the mode toggle to 49px at 768 and
820.** That is broken in production today, on the band `site-header.tsx:90-92` already says does not
fit. Adding a third control to that band without a fix is what clips the theme toggle off-screen.

So decide, explicitly:

- **Does the `Saved` word drop below `xl` ship as part of this feature, or as its own fix?** Both are
  defensible. Bundling it means the star button's PR also repairs a layout bug, and the diff touches
  a component with its own history. Splitting it means the star button is blocked on a fix that has
  nothing to do with stars — and until that fix lands, the star button cannot be F, so it would have
  to be A (clips at 768) or B (no chip at all).
- **Is the 768–880 breakage in scope for this map at all?** The map's destination is a spec for a star
  control. A pre-existing header bug is arguably the map's **Out of scope** — but if F is chosen, the
  map cannot be done without answering the scope question, so it cannot simply be ruled out and
  forgotten.
- **If the Saved word does not drop, does F survive some other way?** Worth ruling in or out rather
  than leaving implicit: the alternative is buying the width from somewhere else — the star chip's own
  word only (leaves `Saved` still wrapping at 768, which the baseline already does), or the search
  field's fixed `w-[424px]` shrinking between `md` and `xl`, which is a much larger change to the
  header's centring logic and would move the search bar's midpoint. The prototype did not test the
  search-width option; it is named here so it is visibly weighed rather than overlooked.

**The answer is one of: bundled / split, plus whether 768–880 is in scope or out of it** — tight
enough that the spec can state which files it touches.

## Answer

Resolved 2026-10-05. **Bundled in this spec, shipped as two PRs; the 768–880 repair is in scope only
as far as variant F requires; and every alternative width source is ruled out.** Variant F stands.

### The split: two PRs, one spec

The `Saved` word drop ships **inside this feature**, in **two PRs** rather than one:

| PR | Subject | Contents |
|---|---|---|
| **PR1** | The `Saved` chip announces one name at every width | Phone `aria-label="Saved {count}"`; desktop `aria-label="Saved {count}"`; the desktop word becomes visual-only below `lg` |
| **PR2** | Add the star control | The star chip itself, plus the `Saved` word's breakpoint moving `lg` → `xl` |

PR2 cannot merge until PR1 does, so **this map's build is sequential, not parallel.** That is the
price of B and it is accepted.

**Ticket 05's phone `aria-label` rides with PR1, not PR2.** PR1's subject is already "the `Saved`
chip's accessible name"; the phone fix is not the star button's subject, and putting it in PR2 would
have made PR2 the two-subject PR that B exists to prevent.

**PR1 must add the *desktop* `aria-label` too, and this is not optional.** Dropping the visible word
without it would ship exactly the fault ticket 05's rule exists to prevent — a bare number announced
between `md` and `xl`. It is the binding note at the top of this ticket, and it is what makes PR1
safe to land alone.

### The arithmetic that decided it

The desktop row is `px-[26px]` + `md:gap-[18px]` × 2 + a `flex-shrink-0` `w-[424px]` centre column +
two `flex-1` side columns (`:93`, `:97`, `:107`, `:116`). The `flex-1` pair splits free space **50/50
regardless of content**, which is what centres the search bar (`:105-106`) and what caps the right
column:

```
768 − 52 (px-[26px] ×2) − 36 (gap ×2) − 424 (centre) = 256 free  →  128px per side column
```

| state | right column needs | fits 128px? |
|---|---|---|
| today, word-bearing `◆ Saved` | ≈103 + 10 + 64 = **177px** | **no** — chip wraps to 46px, toggle to 49px |
| PR1 alone, wordless | ≈49 + 10 + 64 = **123px** | **yes** — both controls single-line |
| PR2, wordless + star chip | ≈49 + 10 + 58 + 10 + 64 = **191px** | **no** — toggle wraps |

The toggle is ≈64px because it draws `◑ Light` at 12.5px with `px-[9px]` (`app/providers.tsx:55-74`).

**So PR1 alone fully repairs 768–880.** Ticket 01's own table corroborates the cap from the other
side: under F at 768 the two chips plus gaps total ≈127px and still the toggle wraps, because
191 > 128.

### The residual breakage is introduced, not inherited

This is the part Q2 got wrong when it was decided, and it is recorded as a correction rather than
quietly absorbed. The toggle wrap at 768 is **not** a pre-existing fault the star control failed to
fix — **PR1 repairs it and PR2 puts it back**, to fit a control nobody asked for.

**Accepted, with the price stated:** PR2's star chip takes ≈58px out of a 128px column; the theme
toggle re-wraps across roughly the 768–880 band; the weight is **1.1% of pageviews** (76 pageviews,
90 days, PostHog project 117415, `$host = www.rnui.dev`, `$virt_traffic_type = 'Regular'`), on top of
variant F's own already-accepted 860–890 regression band. A future header effort inherits a measured,
explained state rather than rediscovering one.

**Why PR2 does not buy the width instead.** Reopening the question leaves exactly one candidate — the
theme toggle's own word, glyph-only below `xl`, saving ≈34px — and it is a bad trade: the toggle is
how a visitor changes the theme, and glyph-only would leave it announcing nothing but "Toggle theme"
while looking like the star chip's glyph. Trading one control's clarity for ≈34px in a 1.1% band is
thoroughness that costs more than it returns.

### Alternatives ruled out, with reasons

All four were weighed rather than left implicit. None of them makes 768 clean; each shifts *which*
control breaks, not *whether* one does.

1. **Star chip's word only, `Saved` keeps its word.** Zero additional cost, and zero additional
   repair — the chip that breaks is simply not the one being fixed.
2. **Narrow the centre column below `xl`.** `w-[424px]` → ≈340 frees ≈84px, so each side column
   reaches ≈170px against a ≈191px need: **≈21px short at 768.** Also moves the search bar's midpoint,
   which `:105-106` exists specifically to prevent. The prototype never tested this; it is rejected on
   the arithmetic, not on a preference.
3. **Put the star chip in the left column.** *Not named in the question — added during this ticket.*
   Structurally different from 1 and 2: both side columns stay `flex-1`, so the search bar stays
   exactly centred, and the star spends the ≈66px the left column **idles at 768** (it holds only
   `rnui.dev`, ≈62px). Needs ≈130px in a 128px column — marginal, roughly a wash — and costs reading
   order, the star being announced before `Saved`. Rejected because the headroom it spends is smaller
   than the chip it must hold.
4. **Nothing buys 768.** The right column is structurally capped at half the row's free space, and the
   star control plus the theme toggle plus the `Saved` chip do not fit inside half.

**This is what makes the word drop a necessity rather than a preference:** it is the only option that
measurably improves 768 at all.

### PR1's breakpoint: `lg`, and PR2 moves it to `xl`

Ticket 01 settled `xl` for both words, but it measured variant F **with the star chip present**. PR1
has no star chip and its arithmetic differs.

- **PR1 uses `lg` (1024).** Word present at 1024+, where the baseline is already clean per ticket 01's
  table; dropped at 768–1023. This makes PR1 a **complete** repair of the band the bug lives at.
- **PR2 moves it to `xl` (1280)**, which is variant F and ticket 01's settled breakpoint.

One class string, changed twice. The `lg` → `xl` diff is honest churn in service of a correct
intermediate state: PR1 is genuinely reviewable as a bug fix and revertible on its own, which is what
B was chosen for. A `xl`-in-both PR1 would be a half-measure — it repairs the chips at 768 while the
toggle still wraps — and would be **strictly worse** at exactly the widths the bug exists at.

### PR1's definition of done — a test PR2 does not invalidate

**A Playwright regression test asserting the `Saved` chip is single-line (≤44px tall) at 768 and 820.
Nothing asserted about the theme toggle.**

The trap this avoids: a test asserting *both* controls are ≤44px at 768 **passes on PR1 and fails
after PR2 merges**, because PR2 reintroduces the toggle wrap that Q6 accepted. Whoever built this
naively would hit a green-to-red test on a deliberate decision. The alternative — amending the test in
PR2 to assert the toggle *does* wrap — pins an accepted defect as expected behaviour in a test that
outlives this effort.

The surviving assertion is exactly the one that catches a regression from PR2's `lg` → `xl` move.
The toggle's state is covered by a **manual measurement note in each PR body**, the same way ticket 01
measured. Height assertions are house style (`recording-route.spec.ts:640`, and
`nav-empty-states-layout.spec.ts`).

**No existing test breaks.** `tests/e2e/remembered-set.spec.ts:78` locates the chip by
`header a[href="/bookmarks"]` and asserts `toContainText("0")`, which a wordless chip still satisfies;
`accessibility-gate.spec.ts` makes no assertion about the header chip. Nothing pins the visible word.

### The no-width-reservation rule is unchanged

`site-header.tsx:134-138` records a deliberate reversal — `min-w-[2ch]` was **removed** so a 0 → 3
change could not shove the mode toggle sideways, because the mock reserves nothing, with the bound
"the reflow is one character wide at 3 → 10."

**That rule stands.** Its scope was one chip shoving the toggle at widths where the row has room, and
89% of pageviews are at ≥`xl` where that remains true. Below `xl` the counts are the only thing in the
chips. Resurrecting `min-w-[2ch]` would return something the mock does not have, for a band carrying
1.1% of traffic, with no measurement in hand saying anything is actually displaced.

**What is new is the count of counts, not the rule.** PR2's changelog notes that the row now carries
two counts and no reservation, and leaves the recorded decision alone.

### Files this touches, for the spec

- `components/site-header.tsx` — the desktop chip's `aria-label` and word visibility (PR1), the phone
  chip's `aria-label` (PR1), the `lg` → `xl` move (PR2), and the star chip (PR2).
- `tests/e2e/` — one new regression spec asserting the `Saved` chip's height at 768 and 820 (PR1).

Nothing else. Ticket 05's `starClicked` and ticket 06's surface predicate are PR2's business and are
already specified.

### Open, carried to no later ticket

None. This was the last question standing between the map and a writable spec, and nothing it
surfaced needs another decision.

## Comments
