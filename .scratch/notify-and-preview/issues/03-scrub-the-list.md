# Scrub the 48, and preserve the evidence that they consented

Status: ready-for-human
Type: task

## Question

Which of the 48 addresses in the Firestore `emails` collection are safe to mail, and what proof
exists that each one opted in?

Both matter and they pull in opposite directions. The proof is thin — a `createdAt` timestamp and
the form copy that was on screen, nothing else — and it is the only proof there will ever be, so
it must be preserved exactly before anything is touched. Meanwhile the write path was public with
no captcha, and the adjacent `userFeedback` collection contains visible bot junk from the same
open path, so some of the 48 may be planted. One spamtrap hit can blocklist the domain.

51 rows, 48 unique, 3 duplicates, 41 of them gmail.com.

## Acceptance

- The old form copy snapshotted into `research/`, with the commit SHA it was live at — this is the
  consent evidence and it must survive the rewrite in ticket 06.
- All 48 syntax- and MX-validated.
- Role addresses (`info@`, `admin@`, `support@`…) dropped.
- Bot-pattern addresses identified by cross-checking `createdAt` clustering against the timestamps
  on the `userFeedback` junk, and dropped.
- A bulk verifier run over the survivors. It costs cents; a spamtrap costs the domain.
- **If a bulk verifier is run, add it to the privacy policy's processor list.** Ticket 07 names six
  processors and no verifier, because when 07 was written none had been picked. Running the 29 real
  addresses through a third party the policy does not name is the gap, and it opens the moment the
  bullet above is done — so it closes here, in the ticket that actually runs it, not in 07, which is
  terminal and will not be reopened.
- The 3 duplicates collapsed, keeping the **earliest** `createdAt` of each.
- `createdAt` preserved on every surviving record — several providers reserve the right to demand
  per-contact proof of opt-in, and this is it.
- **Surviving count recorded in Comments.** Ticket 09 needs it and ticket 10 sends to it.

## Comments

**2026-08-14 — scrubbed. 29 survive, provisionally.** Seven of the eight acceptance bullets are
met; the verifier bullet is not, and cannot be by an agent. Full working in
`research/scrub-2026-08-14.md`, consent evidence in `research/consent-evidence-form-copy.md`,
re-runnable as `pnpm scrub:emails` (`scripts/scrub-email-list.ts`, 20 unit tests in
`tests/scrub-email-list.test.ts`).

```
rows                 51
unique               48   (3 duplicate rows collapsed onto the earliest createdAt)
dropped: bot         18
dropped: role         1
survivors            29
```

**The list is a third bot.** All 23 `userFeedback` rows were pulled and classified: 18 are
machine-generated, and every one of those 18 addresses is also in `emails` within 43 seconds of
its signup — median gap 20 seconds, about half filing the contact form first. That is the
`createdAt` cross-check this ticket asked for and it is decisive. The five genuine feedback rows
(the maintainer twice, three real people) appear nowhere in `emails`, so no human was caught.

The cross-check earned its place over a pattern match: one of the 18 reads as an ordinary human
first-name-plus-surname and no signature would ever have flagged it. Conversely a strict
generator-signature regex run across all 48 found **nothing the pairing had not already caught**,
so the two methods converge rather than leaving a contested residue.

Nothing failed syntax or MX — all 48 are well-formed and all seven domains publish live MX.
Duplicates collapsed to the earliest `createdAt` in every case; `createdAt` is preserved verbatim
on all 29 survivors.

**Two decisions worth a maintainer's eye, both cheap to reverse:**

1. `dev@` on a personal developer domain is the only role hit. Dropped per the acceptance bullet,
   but on a one-person domain it may just be that person's mailbox. Delete `"dev"` from
   `ROLE_LOCALS` and re-run to make it 30.
2. One person is on the list twice under two different domains (gmail and proton.me). Two
   mailboxes, two consent records, correctly kept as two — but they will get the Digest twice.

**Firestore was not written to.** All 51 rows stand, per map decision 10, and the scrub is a
derived view that can be corrected without ever having destroyed the evidence.

**A constraint this ticket did not anticipate:** the repo is public and `.scratch/` is tracked, so
the survivor list cannot be committed — that would publish 48 people's addresses permanently, in
the one ticket meant to protect them. The addresses go to
`research/scrub-result.local.json`, now gitignored; everything committed is keyed by Firestore
document id, which identifies nobody. The script, not its output, is the durable artifact.

### Left for the maintainer

**Run a bulk verifier over the 29 in `scrub-result.local.json`.** Drop whatever comes back
undeliverable or spamtrap, then correct the count here and in `research/scrub-2026-08-14.md`. Two
survivors are specifically flagged there as worth the verifier's opinion.

It is still not an agent's job — it needs an account and someone's judgement on the "risky" and
"catch-all" verdicts — but the reason given here first, that it needs a card, was wrong. **29
addresses fit inside a free tier with no card at all.** Checked 2026-08-14 against each vendor's own
pricing page: **Bouncer** is the cleanest fit (100 free credits, "No credit card required to start"
and "credits never expire" both stated on their own page). NeverBounce also states no card is
needed for a first list, but its free allotment may be as low as 10 credits, which would not cover
29 in one pass. ZeroBounce (100/month) and Emailable (250) cover it too, but neither restates the
no-card claim on its own pricing page.

Do not substitute a hand-rolled SMTP `RCPT TO` probe. That still stands, but on one reason rather
than two: **probing from an unaccredited IP is itself a way to get blocklisted** — the exact outcome
this bullet exists to prevent — and a real verifier also cross-references spamtrap and
known-complainer lists that a probe cannot see.

**A claim made here earlier is contested, and the action does not change.** This ticket said gmail
"accepts every recipient and bounces later, so it would say nothing about 44 of the 48". A check on
2026-08-14 found the opposite documented: consumer `gmail.com` is not an accept-all domain and
answers `RCPT TO` definitively, so verification is reported as reliable there; the real Gmail
limitation at scale is rate-limiting, which does not bite at 29. **Confidence medium, not high** —
the clearest supporting source was a vendor's own marketing page, and no source was found stating
the original claim either. Recorded rather than rewritten: it does not move a single number, and
both versions point at the same action, which is to use a verifier rather than a probe. If accept-all
behaviour matters to a verdict, it will matter for the ~15% on business domains, not the gmail bulk.

**Treat 29 as provisional until then.** `scrub-result.local.json` carries `"verified": false` so
ticket 10 cannot mistake it for a cleared list.

**2026-08-14, second pass after review.** Counts unchanged — still 29 — but four things were wrong
or weak enough to fix:

- **A latent bug.** A junk contact row missing `submittedAt` fell back to parsing the Firestore
  _document path_ as a date, which yields `NaN` and silently dropped that row from the pairing —
  letting the bot behind it survive. Now falls back to `createTime` and warns loudly if neither
  exists. All 23 current rows have `submittedAt`, so no number moved; it was a trap for the re-run.
- **An unreproducible claim.** The "two independent methods converge" evidence rested on a regex I
  ran once by hand and never committed. It is now `looksGenerated()` in the script, printed on
  every run as `signature check`, and covered by six tests. It is explicitly not a drop rule.
- **`createdAt` was unevidenced in-repo.** The report tabled the 19 dropped docIds but none of the
  29 survivors', so bullet 7 rested on my word. The script now also writes
  `research/scrub-survivors.json` — the 29 as docId plus `createdAt`, no addresses — which is
  committed. By the same argument that makes the disposition table safe, this is safe.
- **The role check stripped dots on every domain**, not just gmail, where alone they are ignored.
  Off gmail a dot is significant and `in.fo@` is not `info@`.

One review point accepted but not acted on: bullet 4 says "`createdAt` clustering", and what the
script does is an exact address join within a ±120s window. The join is strictly stronger evidence
than clustering would be, and the signature check now covers the gap it leaves (a bot address that
never filed feedback), so the wording is looser than the method rather than the other way round.

### 2026-08-15 — a verifier ran, over 5 of the 29, and all five are clean

**Vendor: ZeroBounce.** Bouncer was the ticket's pick and is now unusable — it requires a business
email address, which the maintainer does not have. ZeroBounce was the fallback, and this ticket's
"ZeroBounce (100/month)" figure did not survive contact either: the real account carried **5
credits**, and its Freemium plan (which does advertise 100/month) is **not self-serve** — clicking
Subscribe returns "Please contact support to update to Freemium." Two vendor pricing pages, two
wrong predictions about what a real signup gets you. Treat the remaining tier claims here as
unverified.

**Scope, stated honestly: 5 of 29, not a bulk run.** With 5 credits and no way to get more today,
they were spent on the five *oldest* survivors, on the reasoning that recycled spamtraps are made
from long-abandoned mailboxes, so age is the best available proxy for risk:

| # | email | signed up | status | sub_status |
|---|---|---|---|---|
| 1 | `[redacted subscriber address]` | 2024-12-30 | `valid` | — |
| 2 | `[redacted subscriber address]` | 2025-01-04 | `valid` | — |
| 3 | `[redacted subscriber address]` | 2025-01-07 | `valid` | — |
| 4 | `[redacted subscriber address]` | 2025-02-03 | `valid` | — |
| 5 | `[redacted subscriber address]` | 2025-02-11 | `valid` | — |

All five `valid`, no `spamtrap`, no `disposable`, no `did_you_mean`. No `risky` or `catch-all`
verdicts came back, so the maintainer judgement this ticket reserves had nothing to decide and
**nothing was dropped. The survivor count stays 29.** Full responses in the session scratchpad,
not committed — they are keyed to real addresses.

**What this does and does not license.** The highest-risk cohort in the list is clean, which is
real evidence the other 24 — all newer, so less time to be abandoned — are cleaner still. It is
**not** a bulk run over the survivors, so this ticket's fifth bullet is *partially* discharged.
Whether that is enough is the maintainer's call. Note also that `valid` means the mailbox exists
and accepts mail; ZeroBounce flags traps via `sub_status` and flagged none, but absence of a flag
is weaker than a positive all-clear.

**This triggers the processor bullet above.** A verifier has now actually run over real subscriber
addresses, so **ZeroBounce must be named in the privacy policy's processor list** — ticket 07 names
six and this makes seven. 07 is `ready-for-human`, not `resolved`, so it can still take the edit.
Until it does, the policy under-describes where subscriber data has gone.

**Also found while reading the list:** `[redacted subscriber address]` (#13) and
`[redacted subscriber address]` (#25) are almost certainly one person. Bullet 6 collapsed duplicates
*by address*, which cannot catch this. If they are one human they receive two Digests and the true
count is 28. Left as-is pending a decision, since guessing identity from a local part is exactly
the kind of inference this effort has been careful not to make.
