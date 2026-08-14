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
- The 3 duplicates collapsed, keeping the **earliest** `createdAt` of each.
- `createdAt` preserved on every surviving record — several providers reserve the right to demand
  per-contact proof of opt-in, and this is it.
- **Surviving count recorded in Comments.** Ticket 09 needs it and ticket 10 sends to it.

## Comments

**2026-08-14 — scrubbed. 29 survive, provisionally.** Seven of the eight acceptance bullets are
met; the verifier bullet is not, and cannot be by an agent. Full working in
`research/scrub-2026-08-14.md`, consent evidence in `research/consent-evidence-form-copy.md`,
re-runnable as `pnpm scrub:emails` (`scripts/scrub-email-list.ts`, 14 unit tests in
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

**Run a bulk verifier over the 29 in `scrub-result.local.json`** (ZeroBounce, Kickbox,
NeverBounce, Emailable — all need an account and a card, which is why this is not an agent's).
Drop whatever comes back undeliverable or spamtrap, then correct the count here and in
`research/scrub-2026-08-14.md`. Two survivors are specifically flagged there as worth the
verifier's opinion.

Do not substitute an SMTP `RCPT TO` probe: gmail accepts every recipient and bounces later, so it
would say nothing about 44 of the 48, and probing from an unaccredited IP is itself a way to get
blocklisted — the exact outcome this bullet exists to prevent.

**Treat 29 as provisional until then.** `scrub-result.local.json` carries `"verified": false` so
ticket 10 cannot mistake it for a cleared list.
