# Verify the publication notice end to end

Status: resolved
Type: task
Blocked by: 11

## Question

Prove the second message arrives, and that it arrives **when it should and not before**. The receipt
is verified by [Verify it end to end](08-verify-it-end-to-end.md); this is the other half, and it has
a failure mode the receipt does not.

1. **Publish something, for real, and watch the notice.** The receipt could be tested by submitting
   through the deployed form. This one fires from the maintainer's machine, so verification means
   doing an actual publish, or the closest thing to one that does not put a fake Recording in the
   catalogue. Say which was done and why.

2. **Prove it did not fire earlier.** The notice existing at the right moment is only half of it. What
   matters just as much is that nothing was sent at receipt time, and that nothing is sent twice.
   Check the send history rather than the code: `GET /emails` is the record.

3. **Read the notice back from Resend**, as ticket 08 does for the receipt: recipient, subject, body,
   `last_event`. Pull the links out of the body and fetch them, because a notice whose link 404s is
   worse than no notice.

4. **Try the case ticket 09 worried about.** Publish a Submission whose consent record is more than 30
   days old, or simulate it, so the missing-address path is exercised rather than assumed. Whatever
   ticket 09 decided, this is where it is checked.

**The SENDING HOLD gates this ticket** exactly as it gates ticket 08. Set `Status: ready-for-human`
and name the hold if it still stands.

## Acceptance

- The real trigger exercised, or the closest safe equivalent, with the choice justified.
- `GET /emails` showing the notice, and **not** showing a second one for the same Recording.
- Recipient, subject, body and `last_event` recorded from Resend's side.
- Every link in the body fetched, with its status.
- The missing-address path exercised, with what happened.
- The audience checked directly and unchanged.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and `pnpm rules:verify` all exit 0, and a build.
- `Status: ready-for-human` with the hold named, if the hold still stands when this runs.

## Comments

**Resolved.** The hold was lifted by the maintainer on 2026-09-25, so this ran for real rather
than ending `ready-for-human` naming a gate.

### 1. The trigger: the real command, a real Recording, and the maintainer's own address

A full publish was **not** done, and the reason is the one this ticket anticipates: publishing
would put a fake Recording in the catalogue, and the catalogue is the product. So the closest safe
equivalent was used, and it is close rather than token:

- **The real command**, `pnpm submissions:notify`, not a script written for the test.
- **The real builder**, against a **real published Recording** read out of `data/catalogue`:
  `01JFF8MZX970G22KKR06AEM9K3`, Dynamic Accordion by Hewad Mubariz.
- **A real send** through `lib/resend.ts`, with the production `RESEND_API_KEY`.
- Sent to **`hello@rnui.dev`**, which is the one address that proves delivery without mailing a
  stranger, and it is the maintainer's own inbox rather than a new one.

What that cannot prove is placement in a stranger's mailbox, which ticket 03 already recorded as
indeterminable without sending to a stranger. What it does prove is everything else.

The sent-log key is `VERIFY-publication-notice` rather than a real submission key, so the entry is
unmistakably a verification rather than a notice for somebody's actual Demo.

### 2. Resend's record

```
id            01a0d8d9-79ae-7516-9be0-50f66f9cf336
from          rnui.dev <digest@mail.rnui.dev>
to            ['hello@rnui.dev']
subject       Your Demo is live: Dynamic Accordion
last_event    delivered
created_at    2026-09-25 13:55:26.427+00
```

The body, read back from `GET /emails/{id}` rather than from the builder:

```
Hello Hewad Mubariz,

Your Demo is live on rnui.dev.

Dynamic Accordion (Accordions)

See it:
https://www.rnui.dev/recording/01JFF8MZX970G22KKR06AEM9K3

Everything of yours on the site:
https://www.rnui.dev/products?contributor=Hewad+Mubariz

Nothing is needed from you.

rnui.dev, MD. MOHIBUR RAHMAN

Halima Nagar, Cumilla 3502, Bangladesh

hello@rnui.dev
```

### 3. Nothing was sent at receipt time, and nothing twice

`GET /emails` is the record, and this is the whole of it after the send:

```
total: 2
  notices (subject starting "Your Demo is live"): 1
  for that Recording, duplicates:                1
```

The other message is the notification from the earlier Submission. So the notice did not fire at
receipt time, and the second run was refused rather than sent:

```
a notice for VERIFY-publication-notice has already been logged at
.scratch/submission-receipt/notices/VERIFY-publication-notice.json.
Nothing was sent. This message cannot be unsent, so a second one is a deliberate act:
pass --again if you mean it.
```

### 4. Every link fetched, and both work

```
https://www.rnui.dev/products?contributor=Hewad+Mubariz                200  no redirect
https://www.rnui.dev/recording/01JFF8MZX970G22KKR06AEM9K3              200  no redirect
```

And they are not merely 200: the Recording page's own title is
`Dynamic Accordion — Hewad Mubariz`, and the Contributor page contains both the caption and the
name. The `www` correction ticket 10 found is what makes "no redirect" true.

### 5. The missing-address path, exercised

```
NO NOTICE SENT for VERIFY-publication-notice: the address could not be found.

The consent record denies every read by design, so the address lives in one of two
places: the notification email's Reply to row, or the Firebase console.
The Submission's object is VERIFY-publication-notice in rnui-submissions, and the
lifecycle rule deletes it 30 days after it arrived.
```

Exit 1, nothing sent, and the key named so the address can be found again. That is ticket 09's
"skips loudly" rather than a silent return.

### 6. The audience, checked directly

```
audiences: 1  (General, created 2025-07-18)
contacts:  2  ticket06-probe@rnui.example, mrpmohiburrahman@gmail.com
```

Both contacts predate this effort, and **neither recipient of this send appears in them**. So
nothing in the send path touched the audience, which is the transactional promise the receipt and
the notice both make.

### 7. Gates

`pnpm check-types` 0, `pnpm lint` 0 errors, `pnpm test` 452 passing across 26 files,
`pnpm rules:verify` 42/42, and a clean `pnpm build`.

### 8. What this ticket leaves open

Placement in a stranger's inbox. Ticket 03's list of what the first real one should watch is
unchanged, and this send does not discharge it, because the recipient was rnui.dev.
