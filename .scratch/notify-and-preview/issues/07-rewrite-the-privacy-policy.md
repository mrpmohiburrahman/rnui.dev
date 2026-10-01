# Rewrite the privacy policy to describe what actually happens

Status: ready-for-human
Type: task
Blocked by: 04

## Question

`app/privacypolicy/page.tsx` currently says an email address is collected "voluntarily" and may be
shared with "trusted third-party service providers". That is a template, and it describes neither
the Digest nor Resend nor any way to get out.

It also got **1 pageview in the last 30 days**, so nobody has read it — which is a reason to make
it correct cheaply, not a reason to skip it. It is linked from the form after ticket 06, so it
starts being load-bearing then.

## Acceptance

- Purpose stated: what the Digest is and when it sends.
- Lawful basis stated (consent), and how it is withdrawn.
- Retention stated, including the sunset rule — the map's fog notes it cannot be specified yet;
  say what is known and leave the rest out rather than inventing a period.
- **Resend named by name**, not hidden behind "trusted third-party service providers".
- Data subject rights, and the contact method from ticket 04.
- A version number and effective date, so a future change is provable.
- Linked from the signup form and the Digest footer.

## Comments

**2026-08-15 — written. Six of seven acceptance bullets met; the seventh is half 09's.**

`app/privacypolicy/page.tsx` is rewritten. The identity is imported from `lib/sender-identity.ts`
rather than pasted, so ticket 04's "byte-identical in the form, the policy and the footer" is
enforced by the module system instead of by care.

**Every claim in it is a claim about code, and is meant to be read off the code that makes it true**
— not off the research, which says what a policy *should* carry rather than what this site *does*.
That standard was not met on the first pass: review found four sentences the code contradicts, all
now fixed, and they are set out under *Review caught four false statements* below. Read that section
before trusting this one.

Four facts were not knowable from the repo at all and were read from the live APIs:

| Fact | Source | Value |
|---|---|---|
| Digest open tracking | `GET api.resend.com/domains` | `open_tracking: false` |
| Digest click tracking | same | `click_tracking: false` |
| Where Resend stores it | same | `us-east-1` |
| Where Firestore stores it | `GET firestore.googleapis.com/v1/projects/…/databases` | `nam5` (US multi-region) |

Both tracking flags being **off** is load-bearing twice over. It let the policy state plainly that
nothing reports back whether you opened the Digest — a real promise, not a hedge. And it is why the
retention section states no sunset period: the research's rule is "removed after 6 months with no
opens or clicks", and **with both flags off there is no opens-or-clicks signal to measure**. The
map's fog entry says the sunset rule needs Digests to have been sent; that is true but incomplete —
it also needs a deliberate decision to start tracking, which is itself a disclosure change. Recorded
here rather than acted on; see *What this exposed* below.

**A fourth processor was found and named.** `@vercel/analytics` is mounted at `app/layout.tsx:120`,
so Vercel is a processor, not just a host. The policy names all four — Resend, Google Firebase,
PostHog, Vercel — and says all four store in the United States. "Trusted third-party service
providers" is gone.

Also fixed while in the file: the page used **animation** twice, a `CONTEXT.md` _Avoid_ word, the
same defect ticket 06 fixed in the form copy.

### The seventh bullet, honestly

*"Linked from the signup form and the Digest footer."*

- **Signup form — done**, and it was already done by ticket 06 via `components/signup-disclosure.tsx`.
  Verified rendering on both capture points: `/subscribe` and the footer's NOTIFY form.
- **Digest footer — cannot be done here.** The Digest footer does not exist; **ticket 09 builds it**.

What this ticket did instead of claiming that bullet: exported `privacyUrl(origin)` from
`lib/sender-identity.ts`, so 09 pastes a link rather than hand-typing one. It exists because the
policy lives at `/privacypolicy` and **there is no `/privacy` route** — the research's §D.3 sample
copy links `/privacy`, which would 404 from an inbox — and because a relative href in an inbox
resolves against the mail client, not the site.

**And it fixed the live half of the same defect.** `SIGNUP_DISCLOSURE` ends "See our Privacy
Policy.", and `confirmationHtml` pasted that joined plain string — so the one email this site
actually sends today rendered that sentence as **dead text**. It is now a real absolute link. That
was ticket 06's blind spot, not a new requirement: the joined string is deliberately plain because
it doubles as the stored `consentText`, and the form's linked rendering was the only one anybody
looked at.

### Status, and why not `resolved`

`ready-for-human` because one acceptance bullet is genuinely unmet and `resolved` is terminal. To be
clear about what is left, because it is not the usual kind:

- **Nothing here waits on a person, and nothing waits on a credential.** The remainder is ticket
  09's Digest footer using `privacyUrl()`.
- **The maintainer's call is only whether that counts as 07's.** If the Digest-footer link is
  reckoned 09's to carry — which is where the code for it lives — then 07 is done and can be flipped
  to `resolved` without further work. This ticket declines to make that call for itself.

### What this exposed, owned nowhere yet

- **The sunset rule needs a tracking decision, not just time.** Above. It is a disclosure change
  (the policy currently promises no open or click tracking), so turning tracking on is not a free
  operational tweak — it bumps the policy version and changes what Subscribers were told.
- **`POLICY_VERSION` is not stored on the consent record.** Ticket 06 stores `formVersion`, which
  versions the disclosure; the policy the disclosure links to is versioned independently and is not
  captured. §D.2 wants "the policy in force at any given signup" provable. It is provable from git,
  which is probably enough at this size — not fixed, because inventing a second version field is
  exactly the framework this effort was warned not to grow.

### Review caught four false statements, and they are the real story of this ticket

`/code-review` was run before commit. The Standards axis came back mostly clean on vocabulary. **The
Spec axis found four sentences in the policy that the code contradicts.** All four are fixed. They
are recorded here rather than quietly corrected, because the pattern matters more than the fixes:

| The page said | The code says | Where |
|---|---|---|
| the already-seen list is in **local storage** | `sessionStorage`, discarded with the tab | `lib/view-signal.ts:72,88` |
| those browser lists "are **never sent to us**" | every bookmark and vote is captured as it happens | `lib/analytics.ts:174,178,187` |
| "**no record of who** viewed or voted for what" | `person_profiles: "always"` pins those events to a durable per-browser profile | `lib/posthog-provider.tsx:29` |
| **four** processors, "all in the United States" | `cdn.rnui.dev` is Cloudflare R2, so every Demo load sends an IP to a fifth; `hello@` forwards to Gmail, a sixth | `lib/cdn.ts`, ADR-0001, `map.md` |

**None of these was careless prose.** Each was a sentence that reads as obviously true, describes a
system that plausibly works that way, and was never checked against the one file that decides it.
The third is the worst of them: "there is no record of who voted for what" is exactly the kind of
promise a privacy policy exists to make, it was **false**, and it was false in the direction that
flatters the site. The claim in this ticket's own opening — "every claim was read off the code" — was
therefore not true when written, and the four above are why that sentence is now qualified.

The page header comment carries this forward as a standing warning: **every claim in the policy is a
claim about a specific file, so changing that file can make the page lie.** That is the durable
output of this review, more than the four edits.

Two consequences beyond the wording:

- **The processor list grew from four to six**, and the blanket "all store in the United States" is
  gone — it cannot be said of Cloudflare's edge. Regions are now stated per processor, only where
  actually known.
- **The suppression-list promise was withdrawn.** The page had asserted unsubscribed addresses are
  "kept on a suppression list indefinitely". Nothing implements that, and **ticket 08 is literally
  the undecided question of who owns "unsubscribed"** — so the policy was promising a mechanism its
  own effort has not designed. It now describes only what will be true (you stop receiving it; a
  record that you left is kept so an import cannot re-add you) and leaves 08's question open.

### A documented rule was misread, and that is fixed too

The Standards axis caught this ticket's *handoff* editing `CLAUDE.md` and `HANDOFF.md` to declare the
frontier was **08**, reasoning that 05's decisions are made even though its status is parked.
`docs/agents/issue-tracker.md` is explicit: "A ticket is unblocked when every file it lists is
`resolved`." 05 is `ready-for-human`. **08 is blocked, the frontier is empty, and both files now say
so.** Worth naming because the wrong version was persuasive: it would have had the next agent build
ticket 08 on a decision nobody had actually signed off.

### Not done, deliberately

- **`Subscriber`, `Digest` and `Preview` are not in `CONTEXT.md`.** They are defined only in
  `map.md`, and this ticket just shipped all three into user-facing prose. `docs/agents/domain.md`
  says a concept missing from the glossary is a signal. Left alone because promoting terms into the
  domain glossary is a domain-modelling decision with an ADR attached, not something a policy rewrite
  should do on its way past. **Flagged for the maintainer.**
- **`privacyUrl`'s trailing-slash strip is unreachable today** — `confirmOrigin` already strips one,
  so no current caller can pass it. Kept anyway: ticket 09 builds the Digest footer's origin by its
  own route, and normalising in the join is cheaper than the bug. The second unit test documents the
  case rather than claiming it happens now.
- **`POLICY_VERSION` is not stored on the consent record**, as noted above. Still git-provable.

### Checks

Re-run after the review fixes, not before:

- `pnpm check-types` clean; `pnpm test` **294 passed** (2 new, on `privacyUrl`); full Playwright run
  **273 passed, 0 failed**.
- Rendered page asserted directly: 9 `h2`, **0 break tags**, identity line byte-identical, and none
  of `trusted third-party` / `voluntarily` / `animation` / `newsletter` / `Last Updated` surviving.
- Each of the four corrected claims asserted in the served HTML: `session storage` present,
  Cloudflare and Google Gmail present as processors, the profile described as `pseudonymous` and a
  `per-browser record` — and the four false sentences confirmed **absent**.
- `pnpm format:write` was **not** used. It reformats ~20 files of pre-existing drift across the repo,
  which would have buried this diff; prettier was run on the five changed files only.
- **One existing test was changed, and it should be reviewed as a change.**
  `tests/e2e/undrawn-routes.spec.ts` asserted `h2` count **8** — the template's section count — and
  the rewrite has 9. Its sibling assertion in the same test, **zero break tags**, caught a real
  defect in the first draft of this page: the identity block used `<br />`. That one was fixed in
  the page, not in the test. Only the count moved.

### 2026-08-15 — v1.1, ZeroBounce added as a seventh processor

Ticket 03 ran a deliverability check over five of the 29 legacy signup addresses, so real
Subscriber addresses reached a provider this page did not name. The page said "these are the
service providers that handle any of it, and there are no others", which stopped being true the
moment that check ran. Added, and `POLICY_VERSION` raised `1.0` → `1.1` because this page's own
**Changes** section promises that any change raises the version.

`POLICY_EFFECTIVE` stays **15 August 2026** — it was already today's date, since v1.0 published
this morning.

Two things deliberately *not* claimed, both because the header comment's lesson is that a
true-sounding sentence nobody checked is how this page lied four times in its first draft:

- **No storage region for ZeroBounce.** The other six name one because ticket 07 verified them
  against live APIs. This one was not verified, so it says nothing rather than guessing "United
  States" from the company's headquarters.
- **The "five addresses" count is exact today and will go stale** the moment another verification
  runs. Ticket 03's new processor bullet is what should catch that.

Typecheck clean, **294/294 vitest passing**. The e2e assertions on this route are `h1` count and
`ul` non-empty; a new `<li>` moves neither.

**Left for the maintainer:** the Changes section also promises that a change *materially* affecting
Subscribers "will be said plainly in the next Digest rather than published quietly here". A new
processor that received subscriber addresses is arguably material. That is a judgement, and if it
is material then **ticket 09 must carry a line about it** in the first Digest.
