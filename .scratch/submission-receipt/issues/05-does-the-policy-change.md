# Does the disclosure or the privacy policy have to change?

Status: ready-for-agent
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
