# Scrub the 48, and preserve the evidence that they consented

Status: ready-for-agent
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
