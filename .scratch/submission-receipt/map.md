# Submission Receipt

Wayfinder map. Charted 2026-09-25 with the maintainer, in one `/wayfinder` session.

## Destination

**Two messages about a Submission.** The person who sent a Demo gets one message when it arrives,
and one more when it is published, the second carrying the link to its page. That reverses **decision
8** of [Public Submissions](../public-submissions/map.md), which is why it is its own effort rather
than a ticket in that one.

Redrawn 2026-09-25 after the first grilling. It was "a receipt" when this map was charted, and the
maintainer's answer made it two messages fired by two different events. See
[What survives of "no receipt"?](issues/01-what-survives-of-no-receipt.md).

## Notes

- **Domain is `CONTEXT.md`.** The thing received is a **Submission**, the person is a
  **Contributor**, the file is a **Demo**, and none of it is a **Recording** until the
  maintainer publishes it. A receipt is about a Submission. Never "entry", never
  "upload", never "video" (ADR-0008, and `CONTEXT.md`'s `_Avoid_` list).
- **Read this first:** `.scratch/public-submissions/map.md`, and in it decisions **8**
  (no receipt, the one this reverses), **10** (the disclosure), **12** (the key and the
  command in the notification) and the **SENDING HOLD** in `CLAUDE.md`. Ticket 09 of
  that effort is the notification email this sits beside, and its `## Comments` section
  is the closest precedent for everything here.
- **Standing preference: this effort carries execution**, as Public Submissions did.
  So there are `task` tickets, not only decisions.
- **Reuse, do not reinvent.** `lib/resend.ts`'s `sendEmail`, `FROM`, `REPLY_TO`,
  `CONTACT_EMAIL` and `IDENTITY_BLOCK_HTML` all exist. The obvious shape is one more
  pure builder beside `lib/submission-notification.ts` and one more `sendEmail` call in
  `app/api/submit/route.ts`.
- **The SENDING HOLD applies to every ticket here.** Prepare, draft and dry-run; the
  last ticket cannot resolve until the maintainer lifts it, exactly as Public
  Submissions ticket 09 could not.
- **Two messages, two triggers, and they belong in different files.** The first fires in
  `app/api/submit/route.ts` on a request. The second fires when the maintainer publishes, which is a
  local act through `add-recording` with no server involved. So they share wording discipline and
  nothing else, and ticket [Where does the publication notice's address come from?](issues/09-where-does-the-publication-address-come-from.md)
  is the structural question that has to be answered before either is built.
- **Deliberate deviation, recorded:** charting skipped the `/grilling` framing session.
  The destination is the maintainer's own sentence, "send the user's email a
  confirmation message that I have received the animation demo", and the constraint
  space was already loaded from having just built the notification. Ticket
  [What survives of "no receipt"?](issues/01-what-survives-of-no-receipt.md) is where
  the framing that a grilling would have done actually lands.

## Decisions so far

<!-- the index, one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [What survives of "no receipt"?](issues/01-what-survives-of-no-receipt.md), The maintainer's answer makes it **two messages, not one**: "we have your Demo" on arrival, and "it is live" with the link on publication. So decision 8's absolute dies, and two things survive it: **no promise of publication** (the arrival message may say "if it is published you will hear", never "we will publish it"), and **no rejection notice**, which stays in the fog. The structural consequence is a new ticket, because the second message fires from publication, a local act with no server in the path, and needs its own answer to where the address comes from.
- [Will a first-contact receipt actually arrive?](issues/03-first-contact-deliverability.md), Nothing in the DNS needs fixing; the finding is that `_dmarc.rnui.dev` is **`p=none`**, which Resend documents as "allow all email" rather than protection. No provider publishes a link-count or body-length threshold, **Gmail's 102 KB clip** is the one hard number a long body could hit, and a link from `mail.rnui.dev` to the apex is on the passing side of every documented rule. Two useful negatives: `Reply-To` is **not** documented to affect placement, so ticket 04 can decide it on what a reply should do; and **the notification's `delivered` is not a precedent**, because it was rnui.dev talking to rnui.dev. Placement in a stranger's inbox is not determinable without a real send, and the file lists the seven things the first real one must watch.

## Not yet specified

- **Whether a rejection notice ever follows.** Now the sharpest question this map leaves open. The
  Contributor is told when their Demo arrives and when it is published, so the one outcome they will
  *not* hear about is the one where nothing happens. Decision 8's argument about not promising is
  spent for the other two messages, which makes silence here more conspicuous than it was when it was
  the only silence. Deliberately not in this destination, and it wants its own decision rather than a
  clause bolted onto [What does the publication notice say?](issues/10-what-does-the-publication-notice-say.md).
- **What the receipt establishes about the address.** It is currently stored as part of
  the consent record and used for nothing else. Whether a receipt turns it into a
  contact the site may use again is undecided, and the answer constrains the wording.
- **Whether anything is measured.** A receipt is the first message this pipeline sends
  *to* a Contributor, so it is a delivery signal that could be a PostHog event. Nothing
  here says whether to, and `notify-and-preview`'s dashboard convention may have a view.
- **How the address's second use interacts with erasure.** The privacy policy promises that
  withdrawing consent deletes the Demo and its record. The address now has to survive long enough for
  a second message sent days or weeks later, from a copy that may live only in the maintainer's inbox.
  Whether anything needs saying is unclear rather than absent.

## Out of scope

- **A Subscriber relationship.** The receipt is transactional: one message, replying to
  something the person just did. It must not add the address to the Resend audience,
  mark it subscribed, or carry an unsubscribe link for a subscription that does not
  exist. Somebody who wants the Digest uses the signup form, which is a separate consent
  under CASL's ECPR s.4, see `lib/sender-identity.ts` on why the two disclosures are
  not one.
- **Any promise about publication.** Reversing decision 8 does not reopen decision 2
  (no auto-publishing) or the disclosure's "publication is not guaranteed".
- **Editing `mail.rnui.dev`'s DNS.** Unchanged from the other effort: the records are
  correct and verified, and every edit there makes things worse.
- **A receipt for a Subscription or a vote.** Different surfaces, different consents.
