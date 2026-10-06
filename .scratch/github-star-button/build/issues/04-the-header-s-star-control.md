# 04 — The header's star control

**What to build:** A star chip in the header's right-hand column, beside the `Saved` chip, showing the
repository's star count and linking to it in a new tab — on the live site only. It carries one spoken
accessible name at every width on both layouts, a 44px tap target on the phone, and one tracked event
carrying only the number that was on screen.

The number arrives in the served HTML, inlined from the committed file by ticket 01. **GitHub is never
in a visitor's request path**, and the assertions in this ticket are what prove it.

This ticket is the largest of the four and is sized to fit one context window. If it is running long,
the count's assertions and the control's assertions are the two halves to cut along.

**Blocked by:** 01 — Star count comes from a weekly committed file; 03 — The `Saved` chip announces one
name at every width

**Status:** ready-for-agent

- [ ] A third chip in the desktop bar's right-hand column, between the `Saved` chip and the theme
      toggle, in the same rounded-chip / hairline-border / secondary-text treatment `Saved` already
      uses — because that is the vocabulary the header already speaks, not a new one.
- [ ] Rendered forms: `★ Star {count}` at the widest breakpoint, `★ {count}` below it, and `★ {count}`
      on the phone beside the existing `◆ {count}` chip. Every candidate direction fitted the phone
      down to 320px, so the phone needed no direction of its own beyond sizing.
- [ ] **One accessible name, spoken on every layout: "Star {count} stars on GitHub".** The word is
      hidden visually below the breakpoint and never removed from the name. Matching each layout to what
      it draws is rejected precisely because the phone form would announce a bare number.
- [ ] The `Saved` chip's word moves **one breakpoint wider** — this is the star control's share of the
      width budget, and it is what pays for the star chip by buying back the word drop ticket 03 made.
      Ticket 03's accessible name survives the move untouched.
- [ ] **The number comes from the committed file and always renders.** No branch, no fallback state, no
      empty case, no expiry, no date, no tooltip, no qualifier — whatever integer is in the file is what
      renders. A visitor cannot see a numberless chip.
- [ ] The file's date **never reaches the page**, and the control carries **no title attribute**. These
      two are the enforcement of the no-disclosure decision, and without them it is the path of least
      resistance: a future contributor adds a date, every other test still passes, and a settled
      decision is silently reversed by someone who never read it.
- [ ] Opens in a new tab with the `noopener noreferrer` relationship and a trailing `aria-hidden` arrow,
      matching the footer's existing convention where the arrow means "leaves the site". A new tab is
      also the reliable choice — a same-tab link races the page unload, so the click handler would not
      finish.
- [ ] **44×44 on the phone**, reached by a transparent pseudo-element expanding a smaller glyph, the
      treatment and reason the phone's facet-remove button already uses. Nothing moves in the layout.
      The desktop chips are left alone — they measure ≈33px today and raising them is different work in
      a band with no headroom.
- [ ] **The surface gate: live site only.** The predicate reads the platform's system environment
      variable and hides the control in the preview environment. It is **extracted to a small
      client-safe library module**, not a constant inside the header component — a module-level constant
      cannot be unit tested, and fails-open is exactly the kind of policy that fails silently. Evaluated
      once, read by both layouts.
- [ ] The gate **fails open** — absent means shown — deliberately, so a local dev server still builds the
      control. Its **truth table is pinned by a unit test**: preview hides, production shows, absent
      shows. Not by inspection.
- [ ] One tracked event through a named export beside the existing reporters, carrying **exactly one
      property: the count that was on screen**. Called from the click handler in both layouts through
      **one shared function**, so the desktop bar and the phone header cannot drift apart the way the
      two `Saved` spellings did.
- [ ] The event is **not** named for the existing repository-link event, which means a Recording's
      outbound source link was followed and carries that Recording's facts — the star control has no
      Recording behind it, so reuse would require null fields or quietly give an existing event a second
      meaning.
- [ ] **No staleness property is sent, and there is no such state to send.** The file carries a date; the
      render deliberately keeps it out, and leaking it into analytics would reintroduce the one thing
      that was decided against.
- [ ] The naming rule holds: the domain is Recording and Contributor, and this event emits neither
      `entry_id` nor `entry_opened` — or any retired vocabulary.
- [ ] **Served-HTML assertions** (the highest seam, and what proves the architecture): the control's
      markup is in the served document, and the number in the served document **equals the number in the
      committed file**. That equality is the proof the count is inlined at build time. It rides the
      header's existing Suspense fallback, which is the mechanism that puts the whole control set into
      the served document — so it also catches the control being absent from the fallback.
- [ ] **Layout and name assertions** at real viewport widths: the phone target hit-tests at 44×44, and
      the accessible name is identical above and below the breakpoint and on the phone. Height and
      hit-target claims are **hit-tested, not measured** — the border box is not the touchable area.
- [ ] The existing analytics capture-spy e2e approach is reused verbatim to assert the event fires from
      **both** layouts with the count as its only property, and the existing reporter unit suite gains a
      case for it — that suite's stated purpose is that no event carries visitor-entered text and that
      property names are right, which is exactly this event's claim.
- [ ] The decision record that states no deployed build compiles the retired analytics key is **amended
      in its own commit**: that is true of anything serving a hostname and false of branch aliases, which
      carry the preview environment's variables. Recorded here rather than left to drift.
- [ ] **The accepted regression is written down, not encoded as a passing test.** The star chip re-wraps
      the theme toggle across roughly 768–880, a band carrying 1.1% of real pageviews, on top of this
      direction's own accepted 860–890 band. It goes in the pull request body as a manual measurement.
- [ ] **Nothing acknowledges the press.** No toast, no banner, no one-line note, no changed chip copy,
      no return-visit state, and **no new stored browser key** — the control is stateless. "Thanks for
      starring" claims an observation the site cannot make, and a "Starred"-style chip copy both claims
      something about the visitor's account from one outbound click and spends the count, which is the
      entire social proof. Note that this site already carries an unused toast dependency and mounts it;
      adding no call is the decision, and a reviewer's first instinct will be to reach for it.
- [ ] **A discrepancy between the rendered number and the platform's is detected from the committed
      file's own history** — each weekly commit is a dated before-and-after diff, and the workflow
      already knows the true value because it is what fetches it. No additional telemetry is added for
      it. Relatedly, the tracked event's count is a sample of **clickers**, not of viewers, and is not
      to be described as though it were the latter.
