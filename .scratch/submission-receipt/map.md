# Submission Receipt

Wayfinder map. Charted 2026-09-25 with the maintainer, in one `/wayfinder` session.

## Destination

**Three messages about a Submission, two of them templated.** The person who sent a Demo is told:
(1) it arrived, (2) it is published, with the link, or (3) something went wrong, in the maintainer's own
words. That reverses **decision 8** of [Public Submissions](../public-submissions/map.md), which is why
it is its own effort rather than a ticket in that one.

Redrawn twice on 2026-09-25, both times by the maintainer's own answer. It was "a receipt" when this map
was charted; the first answer made it two messages, and the next added the third and made it hand
written. [What survives of "no receipt"?](issues/01-what-survives-of-no-receipt.md) is the record of
both.

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
- **The third message is not templated at all.** It is the maintainer typing the reason, which makes it
  a tooling question rather than a copy question:
  [How does a hand-typed outcome message get sent?](issues/13-how-does-a-hand-typed-outcome-message-get-sent.md)
  exists because a message whose text does not exist until somebody writes it cannot be built the way
  the other two are. The option most likely to be right is that it is a reply to the notification,
  which needs no tool at all.
- **Deliberate deviation, recorded:** charting skipped the `/grilling` framing session.
  The destination is the maintainer's own sentence, "send the user's email a
  confirmation message that I have received the animation demo", and the constraint
  space was already loaded from having just built the notification. Ticket
  [What survives of "no receipt"?](issues/01-what-survives-of-no-receipt.md) is where
  the framing that a grilling would have done actually lands.

## Decisions so far

<!-- the index, one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [What survives of "no receipt"?](issues/01-what-survives-of-no-receipt.md): redrawn twice by the maintainer's own answers, so the effort is **three messages**, not one and not two. "We have your Demo" on arrival, "it is live" with the link on publication, and a hand-typed message when something went wrong. Decision 8's absolute dies, and what survives it is **no promise of publication** (the arrival message may say "if it is published you will hear", never "we will publish it"), **three messages maximum**, and one structural consequence per extra message: the second fires from publication, a local act with no server in the path, and the third is not templated at all, because its text does not exist until somebody writes it.
- [What does the receipt say?](issues/02-what-does-the-receipt-say.md): subject `We have your Demo`, and a body that makes the **"either way" promise** the maintainer asked for. It names the caption and the Category, restates the disclosure's own promises back to the Contributor (credit under that name, and deletion within 30 days if unpublished), and asks for nothing. The caption stays out of the subject on purpose: it is visitor text with no length limit, and a subject line is the expensive place to put one. Rejected: "we will publish it if it fits the catalogue", which would contradict the words the Contributor actually consented to.
- [Will a first-contact receipt actually arrive?](issues/03-first-contact-deliverability.md), Nothing in the DNS needs fixing; the finding is that `_dmarc.rnui.dev` is **`p=none`**, which Resend documents as "allow all email" rather than protection. No provider publishes a link-count or body-length threshold, **Gmail's 102 KB clip** is the one hard number a long body could hit, and a link from `mail.rnui.dev` to the apex is on the passing side of every documented rule. Two useful negatives: `Reply-To` is **not** documented to affect placement, so ticket 04 can decide it on what a reply should do; and **the notification's `delivered` is not a precedent**, because it was rnui.dev talking to rnui.dev. Placement in a stranger's inbox is not determinable without a real send, and the file lists the seven things the first real one must watch.

- [Where does a reply go, and does the receipt invite one?](issues/04-where-does-a-reply-go.md): **"nowhere"**, meaning the receipt is one-way in tone and must not look answerable, which the wording already satisfies with "Nothing is needed from you". Literal nowhere is **not implemented**, for three reasons recorded there: `sendEmail` hardcodes `reply_to`, `IDENTITY_BLOCK_HTML` prints `hello@rnui.dev` regardless, and a bounced reply is worse than one that arrives. So no change to `lib/resend.ts`, none to the identity block, none to the wording, and a reply that happens anyway reaches the maintainer.

- [Does the disclosure or the privacy policy have to change?](issues/05-does-the-policy-change.md): the **disclosure does not**, because "used only to reach you about this Submission" already covers arrival, publication and the error message, and it forbids more than an enumerated clause would. The **policy does**, twice: it now says what the address is for and that it never reaches the Digest list, and the Resend processor entry now names every message the site sends. That second edit closed a gap that predates this effort, because the Submission notification had been going through Resend unlisted. Policy 1.4 to 1.5; `SUBMISSION_FORM_VERSION` unchanged.

- [What does a failed receipt do to the Submission?](issues/06-what-does-a-failed-receipt-do.md): the handler still answers `ok: true`, because the object and the record exist either way and a failed request invites a duplicate. What is new is **`notified`**, and the branch it drives runs on the **maintainer's** knowledge rather than the Contributor's, because the copy's one promise is about the outcome message, which the maintainer sends by hand. Two answers follow. A **failed receipt changes nothing on screen**, since the outcome message still arrives and the promise is therefore kept. And the **receipt is skipped when the notification failed**, which is the compounding case answered as a rule rather than a tie-break: two silent failures are coherent, nobody was told and nobody was promised anything, whereas a receipt with no notification is a promise nobody knows to keep. Also fixed here, and independently of the decision: the success sentence claiming the visitor would hear back "through one of the handles you gave", false since the form began asking for an email address.

- [Where does the publication notice's address come from?](issues/09-where-does-the-publication-address-come-from.md): **the maintainer's inbox**, pasted into the script, because that is the only source that adds no read path to the consent collection and leaves its 42-case rules verifier untouched. Rejected: relaxing `firestore.rules` even to a read-by-id-only path, which would make an address reachable by anybody holding a key. The trigger is a standalone **`pnpm submissions:notify`**, called by a new final step in `add-recording` and given the address and the submission key as arguments, so nothing is looked up. The guard against a second send is a sent-log keyed by the submission key, which is a ULID and therefore carries no address, making it legal to commit in a public repo; the printed address before sending is the layer that catches a repeat. **Both links**, the Recording's page and the Contributor's filtered catalogue, are read from the row that was just written so neither can land on an empty page. A missing address **skips the notice loudly and never blocks the publish**. No change to `firestore.rules` and none to the consent record's shape.

## Not yet specified

- **What happens to a file the error message says cannot be used.** The disclosure promises deletion
  within 30 days if a Submission is not published, and the lifecycle rule enforces that regardless. But
  an error message is not always a rejection: it might ask for a resend, or explain that a codec was
  wrong. So whether a Submission that has been told *no* should have its file deleted early, left to
  the rule, or kept in case they send a replacement, is undecided. It is small and it touches somebody's
  work, which is exactly the combination that should be decided rather than assumed.
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
- **Nothing tells the maintainer that a receipt failed.** Ticket 06 made a failed receipt harmless
  to the promise, but not visible: the notification went out, so the maintainer has no reason to look
  for a receipt they do not know should exist, while a Contributor who heard nothing may resubmit,
  which stores a second object and writes a second consent record for the same Demo. Whether that is
  worth a signal, and where such a signal would live, is undecided rather than absent.

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
