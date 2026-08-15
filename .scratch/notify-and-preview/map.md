# Notify and Preview

Wayfinder map. Charted 2026-08-14 with the maintainer, in one `/wayfinder` session.

## Destination

Two things, in this order:

1. **A legitimate email channel.** rnui.dev can email the people who asked to be emailed —
   lawfully, deliverably, and on a trigger — and every address collected from now on carries
   provable consent.
2. **A judged redesign.** Studio Dark is visible at `preview.rnui.dev` and the friction it
   introduces is being collected, while `rnui.dev` runs deploy A undisturbed so deploy B stays
   measurable against it.

Reached when the first Digest has gone out, the weekly job runs unattended, and the Preview is
live with its survey collecting.

## Notes

**This map carries execution.** Wayfinder's default is planning only. That default is overridden
here: the twelve decisions below were settled at charting, so what remains is mostly build. Most
tickets are `task` and carry an `## Acceptance` block, which makes them `/implement`-compatible in
the ordinary way this repo works.

**Domain.** `CONTEXT.md` is binding. A catalogue record is a **Recording**, its maker a
**Contributor** — never entry, item, animation, video, author or user. Three terms are new to this
effort:

- **Subscriber** — a person who has confirmed an email address for the Digest. Distinct from a
  Contributor, who may never have given an address, and from a visitor. Only a *confirmed* address
  is a Subscriber; an unconfirmed one is a pending address.
  _Avoid_: user, member, lead, contact
- **Digest** — the weekly email listing Recordings added since the last one. Sent only when there
  is at least one. The thing the signup form has always promised.
  _Avoid_: newsletter, blast, campaign, mailer
- **Preview** — `preview.rnui.dev`, the Studio Dark build served alongside the live site. It is
  retired at deploy B, not merged.
  _Avoid_: staging, beta, new site, v2

Note the signup form's current copy says "new animation", a word `CONTEXT.md` lists under _Avoid_.
Ticket 06 rewrites that copy and is the moment to fix it.

**Skills every session should consult.** `/grilling` and `/domain-modeling` for any decision
ticket. `/ponytail` throughout — the email plumbing is where this effort is most likely to grow a
framework it does not need.

**Research already done, do not redo.** `research/research-consent-and-deliverability.md` and
`research/research-email-service.md`. Both are dated 2026-08-14 and both are cited below. Read the
relevant one before reopening any question it already answers.

## Settled at charting

Twelve decisions, taken with the maintainer before any ticket existed. They bind every ticket
here. Detail and evidence live in the two research files.

| # | Decision |
|---|---|
| 1 | "Business email" means official mail from rnui.dev — **not** ad blasts, sponsor pitches or promoting other products |
| 2 | **Site traffic judges the redesign, not the 48 addresses.** The email carries a survey ask as a secondary section, never as its purpose |
| 3 | **Deploy A merges to `main` first**, then the Preview goes up. The Preview reports to its own PostHog project so deploy A's baseline stays clean. A prompt on `rnui.dev` sends visitors to the Preview; the survey fires there |
| 4 | One effort, two phases — **the email channel is built before anything is sent about the redesign** |
| 5 | The branch becomes `feat/studio-dark`, references updated with it |
| 6 | **Studio Dark ships regardless of the survey.** At 94 visitors/week a referendum is not available; the survey is a defect detector |
| 7 | The survey is two questions: *better / same / worse*, plus one open text |
| 8 | The Preview is `preview.rnui.dev`; mail sends from `mail.rnui.dev`. Deliberately not one letter apart |
| 9 | The Digest sends if ≥1 genuinely new Recording id appeared. Re-recordings do not count. Newest 6 shown, then "and N more →" |
| 10 | **The 48 are kept, cured and scrubbed** — not deleted. Deleting costs ~19 months of collection at the real rate |
| 11 | Deploy A collects for **6 weeks, reviewed at 4**, before deploy B |
| 12 | **Resend**, with Firestore staying the source of truth for the consent record. Double opt-in is built here, ~60 lines on patterns the repo already has |

### The three sending verdicts

From `research/research-consent-and-deliverability.md`. These are the shape of the whole effort:

- **The weekly Digest — send**, once identification and one-click unsubscribe are in the message.
  It is literally what the form promised.
- **The redesign survey — only as a section inside the first Digest.** Never standalone.
- **Commercial and sponsorship mail — do not send.** Nothing in the form's copy reaches it.

**Do not send a re-permission email.** Asking "may we email you?" is itself marketing, and is what
the ICO fined Flybe £70k and Honda £13k for in March 2017. The Digest carries the missing
disclosures instead. A vendor policy elsewhere (Mailchimp's) prescribes the opposite; that is a
reason to avoid that vendor, not a reason to send the email.

## Decisions so far

<!-- one line per resolved ticket: gist, then the link -->
<!-- a ticket whose decision is final but whose acceptance still has a human step is marked
     (ready-for-human) — the decision binds now; the ticket is not closed -->

- The branch is `feat/studio-dark`, and it lives only on this machine — it was never pushed, so
  decision 5's "references updated with it" was six markdown files, not a remote rename.
  [01](issues/01-rename-the-branch.md)
- The 48 are 29 — the list was a third bot, caught by pairing signups against `userFeedback` junk
  rather than by pattern-matching addresses. (ready-for-human) [03](issues/03-scrub-the-list.md)
- rnui.dev publishes `Halima Nagar, Cumilla 3502, Bangladesh` — the maintainer's home postal
  locality, chosen over a PO box knowing it cannot be unpublished — and mails permanently as
  `rnui.dev <digest@mail.rnui.dev>` / `Reply-To: hello@rnui.dev`.
  [04](issues/04-what-address-does-rnui-publish.md)
- The sending channel is Resend on `mail.rnui.dev`, which cost the apex its slot — the free tier
  allows one custom domain and the apex was holding it, unused, having never sent a thing. DKIM and
  SPF are live, DMARC sits at the apex where subdomains inherit it, and `hello@` receives.
  (ready-for-human) [05](issues/05-stand-up-resend.md)
- Every address collected from now on is a pending address until it confirms, and the confirmation
  token is the Firestore **document id** rather than a field — a field would have to be found with a
  query, and a query is a `list`, which cannot be granted without publishing every Subscriber's
  address. Firestore currently denies *all* reads on the collection, so the confirm route needs one
  rule published before any link works. (ready-for-human)
  [06](issues/06-double-opt-in-and-the-disclosure-block.md)

## Not yet specified

- **Keeping `hello@rnui.dev` receiving.** The *setup* is done — a Cloudflare Email Routing rule
  forwards it to the maintainer's verified Gmail as of 2026-08-15, discharging what this entry
  originally logged as unowned. What remains is the standing part: CASL s.6(2)/(3) and s.11 require
  it reachable for 60 days after *every* send, so it is an obligation with no end date rather than a
  launch step. Nothing to build; it fails silently if the forward is ever removed.
- **Whether 1024-bit DKIM is accepted.** Ticket 05 asks for 2048-bit; Resend generates the key and
  issued 1024-bit, with no API parameter to change it. Either accept it, or re-provision the domain
  hoping for Resend's newer SES Easy DKIM scheme. Detail and the arithmetic in 05's Comments.
- **What is done with the survey answers.** Who reads the open text, how often, and what turns a
  complaint into a ticket. Needs at least one round of real answers before it can be specified —
  at 2–5 responses/week that is a month away.
- **The sunset rule.** The research prescribes dropping zero-engagement addresses after three
  Digests or six months. Which of the 48 are dead cannot be known until Digests have been sent.
- **`userFeedback` (23 documents) is an open write path with no captcha and visible bot junk in
  it.** Same defect class as the signup form. Whether it is fixed, replaced or removed is a
  separate question this effort only exposed.
- **Whether a marked sponsor slot inside a Digest is ever pursued.** The research says it is the
  one defensible route to monetising the channel. Not decided, not ruled out; revisit only once
  the Digest is a habit.

## Out of scope

- **Sponsorship, paid placement, and promoting other products to the 48.** Ruled out by decision 1
  and by the third sending verdict. Returns only if the list is rebuilt on consent that says so.
- **A decision-grade A/B experiment on the redesign.** Ruled out by decision 6 and the traffic
  arithmetic — 94 visitors/week cannot produce one in any useful timeframe. Deploy A vs deploy B
  in PostHog remains the real comparison; the survey is not a substitute for it.
- **The live CLS and LCP defect** (desktop CLS p75 **0.547**, more than double Google's poor
  threshold; LCP 3,576ms desktop / 4,052ms mobile). Found while pulling traffic for this map. It
  belongs to `studio-dark` ticket 13 and checkpoint 5, which already own performance. Recorded
  here so it is not lost, owned there.
- **Accounts, sign-in and sync.** A standing `studio-dark` non-goal, unchanged.
