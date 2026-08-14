# Draft the first Digest

Status: ready-for-agent
Type: prototype
Blocked by: 03, 05, 06, 07, 08

## Question

What does the first Digest actually say? Everything upstream exists to make this message sendable;
this ticket decides what is in it. It is a draft to react to, not a decision to reason out — write
it, show it, change it.

Three things make it unlike every Digest after it:

**It covers 20 months, not a week.** "Recordings added since the last Digest" is meaningless when
there was no last Digest. Pick a window and say so plainly in the message.

**It carries the disclosures the signup form never did** — who you are, when and where they signed
up, and how to leave. The opening line should state when and where they signed up; that single
sentence is what turns "who is this?" into "oh, right" and is worth more than any subject-line
craft.

**It carries the survey ask, second.** Decision 2 and the consent research both put this after the
Digest content, never as the message's purpose. That ordering is also what keeps CAN-SPAM's
primary-purpose test on the right side. The ask links to `preview.rnui.dev`; the survey itself
fires there (ticket 13), not in the email.

What it must not be: a request for permission to email. See the map — that is the email that got
Flybe and Honda fined.

## Acceptance

- A full draft, in the repo, reviewed by the maintainer before ticket 10 sends anything.
- Opening line states when and where they signed up.
- Ticket 04's identity block and postal address in the footer.
- Visible one-click unsubscribe link in the body, not only in headers.
- Survey ask present, after the content, linking to `preview.rnui.dev`.
- Honest subject line — no "re:", no fake thread, no urgency.
- Recording count and window stated match what ticket 03's surviving list will actually receive.
