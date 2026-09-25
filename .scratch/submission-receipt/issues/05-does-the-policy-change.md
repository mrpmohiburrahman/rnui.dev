# Does the disclosure or the privacy policy have to change?

Status: resolved
Type: task
Blocked by: 02

## Question

Collecting the address was already a privacy-policy change: version 1.4 added it to the
collected list and to the "when you send one, the following is recorded" list. What it
did **not** have to decide was whether the site may *send* to that address.

The wording of the disclosure is now: "The email address is used only to reach you about
this Submission." Read against the receipt that ticket 02 produces and answer:

1. **Does the existing sentence already authorise a receipt?** Taken literally, a receipt
   is reaching them about this Submission, so probably yes. "Probably" is not a
   compliance position, so say which it is and quote both texts side by side.

2. **If it does not, what changes?** Either the disclosure, which means bumping
   `SUBMISSION_FORM_VERSION` in `lib/submission-consent.ts` and saying which version each
   cohort agreed to, or the policy, which means a `POLICY_VERSION` bump and a new entry
   in the changelog comment at the top of `app/privacypolicy/page.tsx`.

3. **What the policy says about a second use of the address.** The receipt is the first
   time it is used for anything the person did not directly ask for at the moment they
   typed it. Whether that needs naming, and in which of the two documents, is the actual
   question here.

Do not edit the disclosure for tidiness. If it already covers the receipt, the answer is
"no change" and that is a finding, not a non-event.

## Acceptance

- Both texts quoted, with the answer to whether the receipt is already authorised.
- If anything changes: the edit made, the version bumped, and the reason each was needed.
- If nothing changes: recorded as a deliberate finding, with what would have required a
  change.
- No em dashes in any text added.

## Answer

Resolved 2026-09-25. **The disclosure needs no change. The privacy policy does, in two places, and one
of them is a gap that predates this effort.**

### The disclosure already authorises all three messages

`lib/submission-consent.ts` says:

> The email address is used only to reach you about this Submission.

Every message this effort adds is about this Submission: it arrived, it is published, or something went
wrong with it. So the sentence covers all three without amendment. It is also **stricter** than the
policy, because "only" forbids the Digest and everything else. Rewriting it to enumerate the three
messages would replace a clause that forbids arbitrary use with one that permits listed use, which is a
weaker promise, so it is left alone and `SUBMISSION_FORM_VERSION` stays at `2026-09-25.2`.

That is a finding rather than a non-event. The cheap answer here was to bolt a clause onto the
disclosure, and the reason not to is that the clause already there is better than the one that would
replace it.

### The policy did need changing, in two places

**1. It never said what the address is for, in either direction.** It read "an email address to reply
to", which does not say who replies. Now:

> It records the name you want credited, an email address we use to contact you about it, ...
> That address is used to tell you the Demo arrived, and then to tell you what happened to it. It is
> not used for anything else, and it is never added to the Digest list.

The last sentence is new and it is the one that carries weight: it makes the isolation from the Digest
list explicit, the way the contact form's own paragraph already does for its address.

**2. The Resend processor entry was already incomplete, and this effort would have made it worse.** It
read:

> Resend, sends the confirmation email and the Digest, and holds the list of confirmed addresses.

But the Submission notification has been going through Resend since ticket 09 of the other effort, and
it carries the Contributor's name, handles and email address. The section's own preamble says "these
are the service providers that handle any of it, and there are no others", so an unlisted path was a
real omission rather than a difference of wording. It now reads:

> Resend, sends every email this site produces: the confirmation email, the Digest, the internal notice
> when a Demo arrives, and the messages to the person who sent it...

**This is the part worth carrying forward.** The gap was found by asking what the *new* messages needed,
not by reading the policy for its own sake. A processor list that enumerates messages goes stale the
moment somebody adds one, and nothing tests it.

### The version, and why the disclosure's did not move

`POLICY_VERSION` went **1.4 to 1.5**, with an entry in the changelog comment at the top of
`app/privacypolicy/page.tsx` recording both edits, that no processor was added, and that no storage
region changed. `SUBMISSION_FORM_VERSION` stayed put, for the reason above: the disclosure's words did
not change, so the version that proves which words a Contributor agreed to must not either.

### Not decided here

The fog item about a second use of the address surviving an erasure request is untouched. This ticket
decided what the documents *say*. That item is about what deletion *does*, and it stays in the map's
**Not yet specified** rather than being answered in passing.
