# Will a first-contact receipt actually arrive?

Status: resolved
Type: research

## Question

This would be the first time rnui.dev sends mail **to a stranger who did not ask for
mail**. The Contributor handed over an address so they could be reached and one message
is exactly that, but no prior relationship exists in either direction. Establish, from
primary sources, whether that message will land.

1. **What the signals say today.** `mail.rnui.dev` is verified and sending, SPF is on
   `send.mail.rnui.dev`, DKIM is published, and `_dmarc.rnui.dev` exists. Read the live
   values rather than trusting a previous ticket, and state what policy `_dmarc`
   actually asserts, a `p=none` is not the protection a `p=reject` is.

2. **First contact.** What makes a transactional message to a recipient with no history
   arrive rather than filter: content shape, link count, image-to-text ratio, whether
   `Reply-To` matters, and what a bare link to a young sending domain looks like to a
   filter. Cite provider documentation, not folklore.

3. **What the alternatives cost.** A `text` part alongside the HTML versus HTML alone.
   What Resend's own guidance says. And whether the existing notification is evidence of
   anything at all, given its recipient is the domain that sends, which may be why it
   arrives, and would make it useless as a precedent.

4. **The honest limit.** Whether this is settleable without sending a real message, given
   the **SENDING HOLD**. If it is not, say so plainly and name what the first real send
   has to watch for, so the verification ticket is not waiting on a mystery.

Deliver `research/first-contact-deliverability.md`, every claim citing its source.

## Acceptance

- Every claim cites a primary source: provider documentation, a live API, or a
  measurement taken here with the command that took it.
- The live DNS and domain state is recorded as of the run, with how it was read.
- The "this cannot be settled without a real send" case is stated explicitly rather than
  papered over with a recommendation.
- Says what the verification ticket must look at, so its failure modes are known before
  it runs.
- Does not recommend any change to `mail.rnui.dev`'s DNS, and says why there is nothing
  there to fix.

## Answer

Resolved 2026-09-25. Full findings, every claim sourced, in
[`../research/first-contact-deliverability.md`](../research/first-contact-deliverability.md).

**Nothing in this DNS needs fixing, and the one real finding is that `p=none` is not
protection.**

- **The live state, read rather than remembered.** `GET /domains` returns exactly one
  domain, `mail.rnui.dev`, `verified`, sending enabled, both trackings off. The apex is
  absent, so a receipt can only send from `mail.rnui.dev`. Resend's three records (DKIM
  TXT, SPF MX, SPF TXT) are all reported verified and all confirmed by `dig`. The DKIM key
  is 1024-bit, measured by decoding the published `p=` and reading it with `openssl`.
- **`_dmarc.rnui.dev` is `v=DMARC1; p=none; rua=mailto:hello@rnui.dev`**, identically from
  three resolvers. `p=none` means "allow all email", against quarantine and reject, so a
  receipt that failed DMARC would still be delivered and the failure would only surface in
  aggregate reports. This one passes on DKIM by exact match and on SPF by relaxed
  alignment, so it is not at risk. Moving to `p=reject` is a change of disposition rather
  than a repair, and is not recommended here.
- **No provider publishes a threshold** for link count, body length or image-to-text
  ratio, and the file says so rather than inventing one. What is published: engagement
  history, volume as the young-domain risk (this pipeline sends single messages, far under
  every published line), qualitative content rules, and four hard numbers, of which
  Gmail's 102 KB clip is the one a long body could actually hit. A link to the apex from
  `mail.rnui.dev` is on the passing side of every documented link rule.
- **`Reply-To` is not documented to affect placement**, which is what ticket 04 needed to
  know: it can be decided on what a reply should do, not on deliverability. What is
  documented is that replies count as engagement, and that a `no-reply` sender is a
  flagged check.
- **The existing notification is not evidence of anything.** `GET /emails` shows exactly
  one message ever sent, to `hello@rnui.dev`, from `digest@mail.rnui.dev`. That is
  rnui.dev talking to rnui.dev, which Resend's own guidance says teaches filters nothing.
  So its `delivered` is not a precedent for a stranger's inbox.
- **Resend auto-generated a text part** for the HTML-only notification, and the file
  measured it as lossy (labels run into their values). So the real choice for the receipt
  is auto-flatten, hand-write one string, or opt out of a check Resend itself flags.
- **The honest limit, stated as the conclusion rather than a hedge:** whether the receipt
  reaches a stranger's inbox cannot be determined without a real send, because providers do
  not disclose placement and the SENDING HOLD forbids the one test that would answer it.
  `delivered` means a 250 OK, not an inbox. The file lists the seven things the first real
  send must watch.

**This resolves the research, not the worry.** [Verify it end to end](08-verify-it-end-to-end.md)
is where the placement question is actually answered, and its failure modes are now known
before it runs.
