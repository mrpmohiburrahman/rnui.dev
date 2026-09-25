# Build the publication notice

Status: resolved
Type: task
Blocked by: 09, 10

## Question

Write the code for the second message. It is a **different animal** from the receipt, and the
difference is the whole reason this is not a clause in ticket 07:

- It is triggered by a **local act** (publication) rather than by an HTTP request, so its home is
  beside the publish flow, not in `app/api/submit/route.ts`. Ticket 09 says which shape that takes.
- It has **no consent record to write** and nothing to roll back. Publishing has already happened, so
  a failed notice cannot undo anything and must not try.
- It links to a live page, so it has **2 URLs to get right** rather than none.

Deliver:

- **A pure builder**, exporting something shaped like `publicationNotice(recording) -> { subject,
  html }`. Pure, so ticket 10's sentences are pinned by tests, and importable without Firestore.
- **One `sendEmail` call** at the trigger ticket 09 named: a standalone `pnpm submissions:notify`
  invoked by a new final step in `add-recording`, taking the address and the submission key as
  arguments because nothing is looked up. The guard against a second send is ticket 09's sent-log at
  `.scratch/submission-receipt/notices/<submission-key>.json`, which carries no address because the
  key is a ULID, and refuses a repeat unless `--again` is passed. Its second layer is that the script
  prints the address and the Recording before sending.
- **The plain-text decision applied here too**, consistent with what ticket 07 chose for the receipt,
  so the two messages do not disagree about whether they have a text part.
- **HTML escaping and a single-line subject**, exactly as the receipt does and for the same reasons.
- **Comments** recording why this is not in the route handler, and what the double-send guard is for,
  so neither is tidied away later.
- **Tests**: one per sentence of ticket 10's wording, one for the escaping, one for the subject
  shape, and one proving the guard refuses a second send.

**It must not touch the Resend audience**, same as the receipt. A published Contributor is still not
a Subscriber.

## Acceptance

- The builder is pure and importable without a network, a secret or Firestore.
- Exactly one notice per Recording, with a test for the guard.
- A failed notice changes nothing about the published page and does not retry blindly.
- Nothing in the send path touches the Resend audience.
- Every interpolated value is escaped, with a test that would fail if it were not.
- Links are absolute, because a relative href in an inbox resolves against the mail client.
- `pnpm check-types`, `pnpm lint` and `pnpm test` all exit 0.
- No em dashes anywhere in the added code, strings or comments.

## Not in this ticket

Sending it. The **SENDING HOLD** covers this effort, so the build stops at a dry run.

## Comments

Built, and dry-run against the real catalogue. Ticket 12 does the real send.

### What was built

- **`lib/publication-notice.ts`**, a pure builder. `publicationNotice({contributor, caption,
  category, recordingId})` returns `{subject, html}`, and it exports `recordingUrl`,
  `contributorUrl` and `SITE_ORIGIN` because ticket 12 has to fetch what it produced.
- **`scripts/notify-submission.ts`**, registered as `pnpm submissions:notify`. It reads the
  Recording out of `data/catalogue` by id, so the name, the caption and the Category are the
  row's rather than typed, which is ticket 09's requirement.
- **`.claude/skills/add-recording/SKILL.md`**, a new **Step 10** that runs it and is skipped
  for a Recording that did not arrive through `/submit`. A failure mode line was added too,
  because "skipping Step 10" is exactly the kind of omission a skill's own list should catch.
- **`tests/publication-notice.test.ts`**, 21 cases.
- **`package.json`**, one script beside `submissions:open`.

### Four things the code changed about the plan

**The skip is requested, not inferred.** Ticket 09 said a missing address skips the notice
loudly. Taking that literally means `--emial` is indistinguishable from "the address could not
be found", and the misspelling would print the reassuring path. So the skip needs
`--no-address`, and a missing `--email` without it is a usage error. The loudest case is no
longer the one that looks most like success.

**The origin is its own constant, and `www`.** `SITE_ORIGIN` rather than `defaultUrl`, because
that constant resolves to `http://localhost:3000` when `VERCEL_URL` is unset and this script
runs from a local shell: importing it would put localhost links in a stranger's inbox the first
time somebody sent a notice outside a Vercel build. And `www` rather than the apex, which
ticket 10 measured as a 307. Both are in the module with the reason.

**The confirmation prompt, because a print is not a guard.** Ticket 09's answer was that
printing the address "catches a repeat", which is only true if somebody reads it. So the
sent-log is the mechanical guard and the prompt is the human one: the send happens after a
`send it? [y/N]`, and `--yes` exists for a scripted run rather than for a habit.

**Top-level await is not available here.** The package's tsx output is CommonJS, so the async
tail is a `main(input)` taking the values the guards narrowed rather than closing over them,
because TypeScript does not carry a narrowing across a function boundary. Both are recorded at
the call site.

### The four paths, run for real

```
--dry-run   to + recording + subject printed, then the full body, nothing sent
--no-address  NO NOTICE SENT for <key>: the address could not be found (exit 1)
no arguments  usage, listing every flag (exit 1)
unknown id    no Recording with id "nosuchid" in the catalogue (exit 1)
```

The dry run used a real row, `01JFF8MZX970G22KKR06AEM9K3` (Dynamic Accordion by Hewad
Mubariz, Accordions), read out of the catalogue rather than invented, and it produced:

```
Your Demo is live on rnui.dev.
Dynamic Accordion (Accordions)
See it:             https://www.rnui.dev/recording/01JFF8MZX970G22KKR06AEM9K3
Everything of yours: https://www.rnui.dev/products?contributor=Hewad+Mubariz
```

### One test caught a real mistake in itself rather than in the code

The non-Latin round trip first asserted `decodeURIComponent(url.split("=")[1])`, which leaves
the `+` that `URLSearchParams` writes for a space, so it failed while the URL was correct. It
now reads the query back with `URLSearchParams`, the same way `app/products/page.tsx` does.

### Gates

`pnpm check-types` 0, `pnpm lint` 0 errors, `pnpm test` **438 passing across 25 files**. No em
dashes anywhere added.

### What ticket 12 inherits

The real trigger, which is a publish, and the reason that is not this ticket's: the notice fires
from the maintainer's machine and cannot be fired by a test without putting a fake Recording in
the catalogue. Ticket 12's second question, proving nothing was sent at receipt time or twice, is
already answerable from `GET /emails` plus the sent-log this writes.
