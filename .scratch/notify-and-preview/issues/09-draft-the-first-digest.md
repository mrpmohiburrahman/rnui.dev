# Draft the first Digest

Status: resolved
Type: prototype
Blocked by: 03, 05, 06, 07, 08

## Question

What does the first Digest actually say? Everything upstream exists to make this message sendable;
this ticket decides what is in it. It is a draft to react to, not a decision to reason out — write
it, show it, change it.

Three things make it unlike every Digest after it:

**It covers 20 months, not a week.** "Recordings added since the last Digest" is meaningless when
there was no last Digest. Pick a window and say so plainly in the message.

**It carries the disclosures the signup form never did** — who you are, when and where they signed
up, and how to leave. The opening line should state when and where they signed up; that single
sentence is what turns "who is this?" into "oh, right" and is worth more than any subject-line
craft.

**It carries the survey ask, second.** Decision 2 and the consent research both put this after the
Digest content, never as the message's purpose. That ordering is also what keeps CAN-SPAM's
primary-purpose test on the right side. The ask links to `preview.rnui.dev`; the survey itself
fires there (ticket 13), not in the email.

What it must not be: a request for permission to email. See the map — that is the email that got
Flybe and Honda fined.

## Acceptance

- A full draft, in the repo, reviewed by the maintainer before ticket 10 sends anything.
- Opening line states when and where they signed up.
- Ticket 04's identity block and postal address in the footer.
- Visible one-click unsubscribe link in the body, not only in headers.
- Survey ask present, after the content, linking to `preview.rnui.dev`.
- Honest subject line — no "re:", no fake thread, no urgency.
- Recording count and window stated match what ticket 03's surviving list will actually receive.
- **`{{SIGNUP_DATE}}` filled per-recipient from each survivor's `createdAt`, and grepped for before
  sending.** It is a live token in the footer by design and this ticket is what fills it. If it
  renders literally, the Digest ships the string `{{SIGNUP_DATE}}` inside the very sentence that
  tells someone when they consented — the one line that has to be true.
- **The privacy policy linked from the footer.** Ticket 07 met every other bullet and left
  `privacyUrl(origin)` in `lib/sender-identity.ts` for exactly this; 07's last bullet is unsatisfiable
  until this footer exists, so the link is owned here.

## Comments

**2026-10-22 — drafted. Seven of nine bullets are met. Two are left: the maintainer's read
of the draft, and the survey ask, which describes a host that no longer exists.**

The draft is `.scratch/notify-and-preview/digest-first-draft.html`, rendered per recipient by
`lib/digest.ts` and regenerated with `pnpm digest:draft` (`scripts/draft-digest.ts`). The file
committed here is one recipient's copy, the oldest consent on the survivor list
(`2024-12-30`), because that is the widest window and the least today-like date. Nothing was
sent. The list, the audience and Firestore were not touched.

### The message

Subject, as built:

```
The first rnui.dev Digest: 348 Recordings
```

Body, with the recipient's own date interpolated:

```
Hello,

You signed up for the rnui.dev Digest at rnui.dev on 30 December 2024. This is the first
one, so it covers the whole catalogue rather than a week: 348 Recordings added between
23 November 2024 and 11 October 2026.

Newest first:

  Card Rotate · Misc · Solarin Johnson
  Recaptcha · Misc · Solarin Johnson
  Slack Liquid Glass · Misc · Solarin Johnson
  Thread Pull Refresh · Misc · Solarin Johnson
  Stacked Input · Misc · Solarin Johnson
  Inapp Notifications · Misc · Solarin Johnson

and 342 more → https://www.rnui.dev/products

One more thing, and it is not what this email is for. The site was redrawn in October
2026. If a page on rnui.dev is worse than it was, reply to this email and say which one.
I read every reply.

rnui.dev, MD. MOHIBUR RAHMAN
Halima Nagar, Cumilla 3502, Bangladesh
hello@rnui.dev

A Digest of the Recordings added to the rnui.dev catalogue. No sponsor mail, no
third-party marketing, and your address is never shared.

Unsubscribe · Privacy Policy
```

Each of the six names is a link to its own `/recording/<id>` page. `Unsubscribe` is
`{{{RESEND_UNSUBSCRIBE_URL}}}` and `Privacy Policy` is
`https://www.rnui.dev/privacypolicy` (from `privacyUrl(origin)` in `lib/sender-identity.ts`,
which ticket 07 left for this footer). All four link shapes were fetched live on 2026-10-22:
the two sampled Recording pages, `/products` and `/privacypolicy` all answer 200 on `www`.

### The window, and why it is the whole catalogue

Decision 9 measures "new" from the last Digest. The first one has no last one, so the window
is the catalogue's own life, and **both ends are read from `created_at` rather than typed**:
`2024-11-23T06:01:11.148Z` to `2026-10-11T14:48:28.218Z`. That is 348 distinct ids, 342 of
them behind the link after decision 9's newest six.

The alternative was to start at the earliest survivor's signup (`2024-12-30`, 215
Recordings). Rejected because the start would then depend on a list that is still moving:
drop one survivor and the window and the stated count change. A catalogue-wide window is a
fact about `data/`, is the same for all 28 mailable addresses, and nobody is told they are
receiving only what arrived after they signed up. Ticket 03's count is untouched by it —
the message states no recipient count at all.

`tests/digest.test.ts` pins the subject and the body to one computed figure, so they cannot
drift from each other or from `data/catalogue.ts`.

### `{{SIGNUP_DATE}}`

Filled by construction, not by a template pass: `renderDigest` interpolates
`formatDigestDate(signupDate)` into ticket 04's sentence, read in UTC so a 23:59 consent
does not slip a day. The token is not emitted anywhere, so `{{SIGNUP_DATE}}` cannot ship.
The grep the acceptance asks for runs inside `renderDigest`: it refuses to return a body
holding any `{{…}}` token except Resend's unsubscribe URL, checked on the rendered bytes
rather than the source, so a token arriving through the identity block or a later template
fails before anything is sent. `scripts/draft-digest.ts` writes only what that guard passed.

### Two deviations, both deliberate

**1. "A weekly Digest" is not in the footer.** Ticket 04's block says it. Ticket 01 and the
2026-10-09 edit removed "weekly" from `SIGNUP_DISCLOSURE_BODY`, `SIGNUP_HEADING` and
`app/subscribe/layout.tsx`'s description, because the cadence is undecided and a
fixed-frequency promise is broken by any ad-hoc send. A footer that re-makes the promise is
the same lie in the message that outlives the page, so the description reads "A Digest of the
Recordings added to the rnui.dev catalogue", which is the description already on
`/subscribe`. `tests/digest.test.ts` pins that the body never says "weekly".

**2. The ask does not link to `preview.rnui.dev`, because that host is gone.** This is the
unmet bullet. Measured on 2026-10-22:

```
https://preview.rnui.dev          308 -> https://www.rnui.dev/
survey 01a00821 "Try the Preview" end_date 2026-10-02T01:51:38Z, targeted flag inactive
```

Two-designs ticket 05 stopped that survey on purpose and two-designs ticket 04 turned the
Preview into a redirect, because the Design it advertised became the live one. So the
ticket's bullet now asks for a link that redirects to the page the reader is already on,
promising two questions that are not there. That is the "nothing on screen lies" rule this
whole effort is built on, in the one message that cannot be recalled.

What the draft carries instead is an ask in the same position — after the content, never as
the message's purpose, per map decision 2 and the primary-purpose test — with a mechanism
that exists today: reply to the email, which reaches `hello@rnui.dev` through the Cloudflare
forward ticket 05 stood up, and is `Reply-To` already. The only other live survey,
`019fbc46`, is an in-page popover on `/products` with no URL that opens it, so there is
nothing to link a stranger to.

The reasoning is recorded here rather than acted on unilaterally because it changes what the
email asks for. **The maintainer picks:** keep the reply ask (the draft's state); drop the
section; or relaunch a reachable survey and give this ticket a URL in a follow-up.

### Two things ticket 10 inherits, both load-bearing

- **A broadcast has one body for the whole audience, so it cannot carry 28 different signup
  dates.** A per-recipient `/emails` send can, but then Resend's
  `{{{RESEND_UNSUBSCRIBE_URL}}}` is not rewritten and there is no `/unsubscribe` route in
  this repo for it to point at. `renderDigest` takes `unsubscribeUrl` as a **required**
  parameter and deliberately has no default, so ticket 10 has to choose rather than inherit a
  token that would ship literally. The draft passes the broadcast token, which is what a
  broadcast needs.
- **The newest six are one day's import.** 43 Recordings carry `2026-10-11`, nine of them
  with an identical `created_at` to the millisecond, and decision 9's "newest 6" therefore
  reads as six rows from one Contributor under one Category. The list is correct; it is a
  question about whether the first Digest should look like that, and it is exactly the sort
  of thing this draft exists to be reacted to.

### What is left, and who does it

The maintainer reads the draft and decides the ask. Nothing else is outstanding: the copy,
the count, the window, the footer, the token fill and the privacy link are built and pinned,
and `npx vitest run` is 720/720. Ticket 10 stays blocked until this is closed.

**2026-10-22 — resolved. The maintainer read the draft and kept the reply ask.**

The reading is done and the ask is settled: the draft ships as it stands, with the reply to
`hello@rnui.dev` in place of the survey link. So the fifth acceptance bullet is met in
substance and not in letter — the ask is present and after the content, but it points at a
mailbox rather than at `preview.rnui.dev`, because that host is a 308 redirect and the
survey behind it ended on 2026-10-02. Recording the substitution here is the point: a future
reader comparing the bullet to the message should find the reason beside it rather than
conclude the bullet was skipped.

The other eight bullets are met as the 2026-10-22 comment above sets out. Ticket 10 is
unblocked and is the next thing, and it is the ticket that picks the send path — which is
what decides whether a recipient gets a per-recipient signup date or the broadcast's
unsubscribe token, as recorded above.
