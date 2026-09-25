# Submission Receipt

Wayfinder map. Charted 2026-09-25 with the maintainer, in one `/wayfinder` session.

## Destination

**A receipt for a Submission.** The person who sent a Demo gets one message at the
address they gave, so they know it arrived. That reverses **decision 8** of
[Public Submissions](../public-submissions/map.md) — which is why it is its own
effort rather than a ticket in that one.

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
- **Deliberate deviation, recorded:** charting skipped the `/grilling` framing session.
  The destination is the maintainer's own sentence — "send the user's email a
  confirmation message that I have received the animation demo" — and the constraint
  space was already loaded from having just built the notification. Ticket
  [What survives of "no receipt"?](issues/01-what-survives-of-no-receipt.md) is where
  the framing that a grilling would have done actually lands.

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [Will a first-contact receipt actually arrive?](issues/03-first-contact-deliverability.md) — Nothing in the DNS needs fixing; the finding is that `_dmarc.rnui.dev` is **`p=none`**, which Resend documents as "allow all email" rather than protection. No provider publishes a link-count or body-length threshold, **Gmail's 102 KB clip** is the one hard number a long body could hit, and a link from `mail.rnui.dev` to the apex is on the passing side of every documented rule. Two useful negatives: `Reply-To` is **not** documented to affect placement, so ticket 04 can decide it on what a reply should do; and **the notification's `delivered` is not a precedent**, because it was rnui.dev talking to rnui.dev. Placement in a stranger's inbox is not determinable without a real send, and the file lists the seven things the first real one must watch.

## Not yet specified

- **Whether a rejection notice ever follows.** Decision 8's argument was about not
  promising, and a receipt answers "did it arrive" without answering "will it be
  published". A message that says *no* is a different decision with a different tone,
  and it is deliberately not in this map — see **Out of scope** for the half that is.
- **What the receipt establishes about the address.** It is currently stored as part of
  the consent record and used for nothing else. Whether a receipt turns it into a
  contact the site may use again is undecided, and the answer constrains the wording.
- **Whether anything is measured.** A receipt is the first message this pipeline sends
  *to* a Contributor, so it is a delivery signal that could be a PostHog event. Nothing
  here says whether to, and `notify-and-preview`'s dashboard convention may have a view.
- **How the address's second use interacts with erasure.** The privacy policy promises
  withdrawal of consent deletes the Demo and its record. A receipt is already sent and
  cannot be unsent, so whether anything needs saying is unclear rather than absent.

## Out of scope

- **A Subscriber relationship.** The receipt is transactional: one message, replying to
  something the person just did. It must not add the address to the Resend audience,
  mark it subscribed, or carry an unsubscribe link for a subscription that does not
  exist. Somebody who wants the Digest uses the signup form, which is a separate consent
  under CASL's ECPR s.4 — see `lib/sender-identity.ts` on why the two disclosures are
  not one.
- **Any promise about publication.** Reversing decision 8 does not reopen decision 2
  (no auto-publishing) or the disclosure's "publication is not guaranteed".
- **Editing `mail.rnui.dev`'s DNS.** Unchanged from the other effort: the records are
  correct and verified, and every edit there makes things worse.
- **A receipt for a Subscription or a vote.** Different surfaces, different consents.
