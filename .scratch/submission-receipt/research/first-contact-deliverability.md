# First contact deliverability

Resolves ticket 03 of the Submission Receipt map:
[`../issues/03-first-contact-deliverability.md`](../issues/03-first-contact-deliverability.md).

Measured 2026-09-25, between 10:48 and 10:50 UTC, on branch `feat/studio-dark`. Every value
below is as read at that moment, with the command that read it beside it. Nothing here is
recalled from an earlier ticket.

**Nothing was sent. No DNS record was changed.** `CLAUDE.md`'s SENDING HOLD (set by the
maintainer 2026-08-15, "no mail leaves this project until they lift it") is why section 4
ends the way it does. The hold also means every conclusion here is about records and
documented behaviour, never about an observed inbox.

## 1. What the signals say today

### The live reads

Sending domain, read from the API:

| Field | Value |
| --- | --- |
| `name` | `mail.rnui.dev` |
| `status` | `verified` |
| `created_at` | `2026-08-14 22:55:07.713335+00` |
| `region` | `us-east-1` |
| `capabilities` | `sending: enabled`, `receiving: disabled` |
| `open_tracking` / `click_tracking` | `false` / `false` |

Command:

```
set -a && . ./.env.local && set +a
curl -s https://api.resend.com/domains -H "Authorization: Bearer $RESEND_API_KEY"
# HTTP 200, "has_more": false, one domain in `data`
```

The apex `rnui.dev` is not in that list, so the receipt can only send as `mail.rnui.dev`
(the same conclusion Public Submissions decision 6 records, re-verified here).

`GET /domains/29154075-60c3-4f0d-bafc-98c52fa02765` returns the three records Resend
expects, and all three report `"status": "verified"`:

| `record` | `name` | `type` | value |
| --- | --- | --- | --- |
| DKIM | `resend._domainkey.mail` | TXT | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDzOsmkNS2WAeVmhXFS67ihmbYGq19DAI9bf5LJo41Iu8zsGlEqNfVKDohvizYDyeOpYSUYCj3/1FFcquu6zDQH/8q+2/HkWBSxKNlVVLPt1sGCbCXfPB/vQiENIQbZigJrjuYVnb/EusVpFcvxkLVjNLZ5HxJleIvUBZOE6ZatQIDAQAB` |
| SPF | `send.mail` | MX | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |
| SPF | `send.mail` | TXT | `v=spf1 include:amazonses.com ~all` |

DNS read live, from a public resolver and from the authoritative nameservers:

```
date -u                                   # 2026-09-25T10:48:13Z
dig +short TXT send.mail.rnui.dev @1.1.1.1
  "v=spf1 include:amazonses.com ~all"
dig +short MX send.mail.rnui.dev @1.1.1.1
  10 feedback-smtp.us-east-1.amazonses.com.
dig +short TXT resend._domainkey.mail.rnui.dev @1.1.1.1
  "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDzOsmkNS2WAeVmhXFS67ihmbYGq19DAI9bf5LJo41Iu8zsGlEqNfVKDohvizYDyeOpYSUYCj3/1FFcquu6zDQH/8q+2/HkWBSxKNlVVLPt1sGCbCXfPB/vQiENIQbZigJrjuYVnb/EusVpFcvxkLVjNLZ5HxJleIvUBZOE6ZatQIDAQAB"
dig +short TXT _dmarc.rnui.dev @1.1.1.1
  "v=DMARC1; p=none; rua=mailto:hello@rnui.dev"
dig +short TXT _dmarc.mail.rnui.dev @1.1.1.1      # (empty)
dig +short TXT mail.rnui.dev @1.1.1.1             # (empty)
dig +short MX mail.rnui.dev @1.1.1.1              # (empty)
dig +short NS rnui.dev        # harleigh.ns.cloudflare.com, keaton.ns.cloudflare.com
dig +short TXT _dmarc.rnui.dev @8.8.8.8           # same string
dig +short TXT _dmarc.rnui.dev @harleigh.ns.cloudflare.com   # same string
```

Two things worth reading off that. First, `mail.rnui.dev` itself carries no records at all:
everything that makes the sending identity work lives on `send.mail` and on
`resend._domainkey.mail`, which is Resend's documented per-domain layout
(`resend.com/docs/dashboard/domains/introduction`). Second, the DKIM key is 1024-bit, which
is measured rather than assumed:

```
dig +short TXT resend._domainkey.mail.rnui.dev @1.1.1.1 | tr -d '"' | sed 's/^p=//' | base64 -d > /tmp/dkim.der
openssl rsa -pubin -inform DER -in /tmp/dkim.der -noout -text | head -1
  Public-Key: (1024 bit)
```

Resend on that (`resend.com/docs/knowledge-base/do-i-need-2048-dkim`): "Resend signs
outbound mail with 1024-bit DKIM keys, which are RFC-compliant, accepted by every major
mailbox provider, and satisfy the bulk sender requirements". RFC 8301 section 3.2 sets 1024
bits as the minimum verifiers must support. Not a defect, and not something to fix.

SPF is cheap too, which matters because an expensive record has a hard failure mode:
`dig +short TXT amazonses.com @1.1.1.1` returns a record made only of `ip4` terms
(`v=spf1 ip4:199.255.192.0/22 ... ip4:98.77.0.0/16 -all`), so the `include:` costs 1 of the
10 DNS-lookup terms RFC 7208 section 4.6.4 allows: "SPF implementations MUST limit the total
number of those terms to 10 during SPF evaluation ... If this limit is exceeded, the
implementation MUST return `permerror`". 1 of 10, room to spare.

Domain age, which the provider docs care about, read from the registry:
`curl -s https://pubapi.registry.google/rdap/domain/rnui.dev` returns registration
`2025-01-06T02:59:45.607Z` and expiration `2027-01-06T02:59:45.607Z`. So the name is about
20 months old and the Resend sending identity is about six weeks old (created 2026-08-14).
Both matter later, because "new domain" advice is about history and the two ages are
different histories. Where a DMARC report would go: `dig +short MX rnui.dev @1.1.1.1`
returns `47 route1.mx.cloudflare.net.`, `72 route3.mx.cloudflare.net.`, `85
route2.mx.cloudflare.net.`, so `hello@rnui.dev` is a real mailbox and not a black hole.

### What the DMARC record asserts, stated flatly

`_dmarc.rnui.dev` is `v=DMARC1; p=none; rua=mailto:hello@rnui.dev`. There is no `sp`, no
`adkim`, no `aspf`.

**`p=none` is not protection.** In Resend's own words
(`resend.com/docs/dashboard/domains/dmarc`), the three policies behave like this:

| Policy | Resend's description |
| --- | --- |
| `p=none` | "Allow all email. Monitoring for DMARC failures." |
| `p=quarantine` | "Send messages that fail DMARC to the spam folder" |
| `p=reject` | "Bounce delivery of emails that fail DMARC." |

So the record asks receivers to *report* failures to `hello@rnui.dev` and to act on none of
them. It asserts no protection against anybody who forges `rnui.dev`. It is still a valid
DMARC record, it is the policy Resend tells you to start with ("we suggest starting with a
policy of `p=none;` before moving to a stricter policy"), and it is the policy Google accepts
from bulk senders ("Your DMARC enforcement policy can be set to `none`"). Resend does claim
a benefit to tightening it: quarantine "gives mailbox providers greater confidence in your
domain since your domain only allows authenticated email". That is a claim about domain
confidence, not a claim that a stricter policy makes one message arrive, and neither Resend
nor Google documents an authenticated message being placed worse because the policy is
`none`.

Which record governs a receipt from `digest@mail.rnui.dev`: there is no
`_dmarc.mail.rnui.dev`, so it is the `p=none` above, by fallback. RFC 7489 section 6.6.3
step 3: "If the set is now empty, the Mail Receiver MUST query the DNS for a DMARC TXT record
at the DNS domain matching the Organizational Domain in place of the RFC5322.From domain".
Alignment for this send, from RFC 7489 section 3.1:

- DKIM: `d=` will be `mail.rnui.dev` and the From domain is `mail.rnui.dev`, so even strict alignment passes ("only an exact match between both of the Fully Qualified Domain Names (FQDNs) is considered to produce Identifier Alignment").
- SPF: the Return-Path domain is `send.mail.rnui.dev` (the MX above is Resend's bounce record) while the From domain is `mail.rnui.dev`. Not identical, but "In relaxed mode, the [SPF]-authenticated domain and RFC5322.From domain must have the same Organizational Domain", and both are `rnui.dev`. Relaxed is what applies: `adkim` and `aspf` are absent and RFC 7489 section 6.3 gives each a default of "r".

So the receipt should pass DMARC on DKIM alone, with SPF as backup alignment, under a policy
that does nothing when it passes.

### Why there is nothing to fix in this DNS

- Every record Resend expects exists and Resend reports all three `verified`. Nothing is missing.
- `_dmarc` exists, parses, and points at a mailbox that receives.
- The DKIM key is complete and 1024-bit, the length Resend itself signs with and `RFC 8301` permits.
- SPF costs one DNS lookup against a limit of ten, so it cannot produce the `permerror` a bloated record would.
- The only arguably weak thing is the policy value, and `p=none` to `p=reject` is a change of disposition, not a repair. It cannot make the receipt arrive, the message is authenticated either way, and tightening it before anyone has read a DMARC report is the move Resend warns about: "While tightening your policy, it's important to have visibility into your DMARC failures to ensure you're not blocking legitimate email." The reports do arrive at `hello@rnui.dev`; nothing in this repo says they are read.

## 2. First contact

A receipt is one message, to one address, with no prior relationship in either direction.
The provider documentation on that case is thinner than its reputation, and it is worth
separating what is actually published from what is folklore.

### The one signal the docs say dominates

Engagement history. Resend's Gmail guide, which states it is adapted from Google's own
article (`resend.com/docs/knowledge-base/how-do-i-avoid-gmails-spam-folder`):

> Gmail monitors your sending across all Gmail inboxes to see if recipients want to receive
> your emails. This is mainly measured by their engagement with your messages (opens,
> clicks, replies). If Gmail doesn't see this engagement, they will start to move your inbox
> placement towards promotional or even spam.

A first-contact message is the definition of a message with no engagement yet. Resend's
Outlook guide says the same from the other side: "Reputation moves on real recipients
opening, replying, and moving messages out of Junk", and "Sending repeatedly to a mailbox
you own gives Outlook little to learn from."

### Young domain

Published, on the same Gmail page: "This is especially true for new domains since Gmail
doesn't have any history of trust. Sending a large volume of emails from a new domain will
likely result in poor inbox placement." Read carefully, that names volume as the risk and
history as the thing that is missing. It is not a statement that a single message from a
young domain is filtered. The measured ages are in section 1: name about 20 months, sending
identity about six weeks. The one documented "young domain" failure mode sits with corporate
filters rather than consumer Gmail, from Resend's spam troubleshooting page: "These filters
often block based on domain age, content patterns, or URL reputation." A recipient at a
company using Mimecast, Proofpoint or Barracuda is a different and less predictable test
than a personal Gmail address.

### Content shape: what is published, and what is not

Bluntly: **no provider publishes a threshold for link count, image-to-text ratio, or body
length.** There is no number to design against. What is published is qualitative, and it is
consistent across Google, Microsoft and Resend:

| Claim | Source |
| --- | --- |
| "Less is more", "Plain text over complex HTML", "Visible links that match the sending domain", "No hidden or manipulative content" | Resend's Gmail guide, adapted from Google |
| "Keep HTML simple. Heavy formatting and image-only emails are more likely to trigger filters." | `resend.com/docs/knowledge-base/why-are-my-emails-going-to-spam` |
| A Gmail banner reading "It's similar to messages that were identified as spam in the past" means "Content is triggering spam filters"; the stated fix is "Simplify your email content and remove excessive links, images, or marketing language" | same page |
| "Keep emails as close to plain text as possible, and add a sender name." | Resend's Outlook guide, adapted from Microsoft |

The only hard numbers published anywhere in this area are not ratios:

| Number | Meaning | Source |
| --- | --- | --- |
| 102 KB | "Gmail limits the size of each email message to 102 KB. Once that limit is reached, the remaining content is clipped and hidden behind a link to view the entire message." | `resend.com/docs/dashboard/emails/deliverability-insights` |
| 0.3% | "Keep spam rates reported in Postmaster Tools below 0.3%", the requirement for all senders | `support.google.com/a/answer/81126` |
| 0.08% | "your spam rate below 0.08%", Resend's own warm-up guidance | `resend.com/docs/knowledge-base/warming-up` |
| 5,000/day | The threshold above which Google's stricter rules apply | `support.google.com/a/answer/14229414` |

Two of those deserve comment. The spam rates are Postmaster Tools metrics and you only get
them at volume: "Data might be missing if the total number of messages for a given day is too
low" (`support.google.com/mail/answer/9981691`), so a pipeline sending a handful of receipts a
month cannot measure its own spam rate at all. And 5,000/day is far above this pipeline, so
Google's stricter rules do not bind it: "A bulk sender is any email sender that sends close
to 5,000 messages or more to personal Gmail accounts within a 24-hour period", and the
unsubscribe rule reads "Marketing messages and subscribed messages must support one-click
unsubscribe". A transactional receipt is neither, which matches this map's Out of scope on
unsubscribe links.

### What our own message actually looks like

The closest measured example here is the submission notification, sent 2026-09-25 and read
back from Resend:

```
curl -s "https://api.resend.com/emails/01a0d80b-883d-70db-8176-05f008e5e72d" -H "Authorization: Bearer $RESEND_API_KEY" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); h=d['html']; print(len(h.encode()), h.count('<a '), h.count('<img'))"
  2094 0 0
```

That is 2 KB of HTML, short, table-based, with zero links and zero images, which is the
shape the qualitative guidance above describes as safe. It has no measurable feature a
filter could object to under any published check. That is still not evidence it will arrive
(section 3), but it does mean the receipt's shape is not the thing to worry about.

### Links, and a bare link from a young sending domain

There is no provider documentation saying "a bare link from a young domain is treated as
X". What is documented about links is narrower and checkable:

- "Ensure that the URLs in your email match the sending domain. Mismatched URLs can trigger spam filters." Resend's Deliverability Insights, with the example "if your sending domain is `@widgets.com`, ensure links within the message point back to `https://widgets.com`".
- "Gmail's spam filters are flagging emails containing shortened YouTube links (`youtu.be`) as potential phishing attempts." Same page, so shorteners are the named risk, not bare links.
- "Change all links in your email to use your own domain (matching your sender domain)", from the page on a message that says delivered but has not arrived, which also says why the rest cannot be known: "Inbox Providers do not share any information on how the messages are later filtered."

Applied here: a link to `https://rnui.dev/...` in a message from `mail.rnui.dev` is on the
correct side of the only published link rule, because `rnui.dev` is the sending domain's own
apex, not a third party and not a shortener. Resend's subdomain guidance asks for exactly this
shape: "We recommend sending emails from a subdomain (`notifications.acme.com`) instead of your
root/apex domain (`acme.com`)"
(`resend.com/docs/knowledge-base/is-it-better-to-send-emails-from-a-subdomain-or-the-root-domain`).
Whether the receipt carries a link at all is not decided here: map decision 12 (amended by
ticket 04) says the *maintainer notification* carries the object key and a command instead of
a URL on purpose, and the receipt's wording is ticket 02's decision. If ticket 02 puts a link
in, `https://rnui.dev/[route]` is the only kind with documented support. A link to a
`resend.dev` page, a shortener, or a tracking domain would each contradict a line quoted above.

### Reply-To

No provider documentation claims that setting `Reply-To` improves inbox placement. Two
things are documented, and together they are the whole case for it:

- Replies are engagement, and engagement is the signal named at the top of this section.
- Resend runs a check called "Don't use `no-reply`": "Indicating that this is a one-way
  communication decreases trust. Some email providers use engagement (email replies) when
  deciding how to filter your email. A valid email address allows you to communicate with
  your recipients if they have questions."

So the message must not come from a `no-reply` address, and must not look answerable while
being unanswerable. `lib/resend.ts` already sends `reply_to: REPLY_TO`, and `FROM` is
`rnui.dev <digest@mail.rnui.dev>`, which is not a `no-reply` address. Whether a receipt
should invite a reply, and which address catches it, is ticket 04. Nothing here requires
changing `lib/resend.ts`.

## 3. What the alternatives cost

### A `text` part, or HTML alone

The notification was sent HTML-only: `lib/resend.ts` posts `from`, `reply_to`, `to`,
`subject`, `html` and nothing else. Resend added the text part itself, and the record of the
delivered message shows it:

```
curl -s "https://api.resend.com/emails/01a0d80b-883d-70db-8176-05f008e5e72d" -H "Authorization: Bearer $RESEND_API_KEY" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('text:', 'text' in d, len(d['text'].encode())); print(d['text'][:80])"
  text: True 647
  A Submission arrived.

  Contributorhello GitHubene LinkedInnen Xne Captionhe CategoryArc Sliders Sourcehttps://...
```

Resend's API reference: "The plain text version of the message. If not provided, the HTML
will be used to generate a plain text version. You can opt out of this behavior by setting
value to an empty string." So there are three options here and none of them is "no text
part":

1. Leave it to Resend. Costs nothing, and produces the run-together line above: the table
   lost its structure and each label merged into its value.
2. Pass `text` yourself. Costs one more string per message, with the usual risk of two
   copies of the same words drifting, which is the argument `lib/sender-identity.ts` already
   makes for the identity block.
3. `text: ""`, the documented opt-out, which fails the check below.

Resend's own checklist wants option 2. Deliverability Insights' "Include Plain Text Version"
check: "Including a plain text version of your email ensures that your message is accessible
to all recipients, including those who have email clients that do not support HTML." Ticket
02 already requires the receipt body to survive being read as plain text, so on this stack
that means a designed text string, which is ticket 07's builder to shape. The whole cost is
one string, not a deliverability mechanism.

### What Resend's guidance actually checks

Deliverability Insights is the only place Resend states message-level rules. The full list
(`resend.com/docs/dashboard/emails/deliverability-insights`): link URLs match the sending
domain, valid DMARC record, plain text version, no `no-reply`, body under Gmail's 102 KB
clip, full YouTube URLs, use a subdomain, custom subdomains for click and open tracking.
Measured against this project: subdomain yes, tracking off (`open_tracking: false`,
`click_tracking: false`), DMARC record present, 2 KB body, no `no-reply` address. A receipt
can fail only the plain text check, or the link check if ticket 02 links off-domain.

### The existing notification is not a precedent

`GET /emails` returns every message this key has ever sent. There is one:

```
{"to":["hello@rnui.dev"],"from":"rnui.dev <digest@mail.rnui.dev>",
 "created_at":"2026-09-25 10:10:29.713000+00","reply_to":["hello@rnui.dev"],"last_event":"delivered"}
```

The recipient is on the sender's own organizational domain, and its mailbox is the same
Cloudflare Email Routing read in section 1. The only delivery this identity has ever done is
rnui.dev to rnui.dev: no third-party provider, no stranger, no complaint path. It proves the
API call works and the DKIM and SPF records verify. As a precedent it is worse than none:
Resend's Outlook guidance says "Sending repeatedly to a mailbox you own gives Outlook little
to learn from", and its Gmail guidance recommends "sending regular person-to-person email"
precisely because destinations that never engage teach the filters nothing. Baseline for the
first real send, measured: `GET /suppressions` returns `{"object":"list","data":[]}`.

## 4. The honest limit

**This cannot be settled without sending a real message.** Three reasons.

1. `delivered` is not "arrived". A message "is marked as `Delivered` once the recipient server accepts it with a `250 OK` response. However, the server can then direct the email to the inbox, queue it for later, route it to the spam folder, or even discard it."
2. Placement is never disclosed: "Inbox Providers do not share any information on how the messages are later filtered", and nothing reachable from this shell (the Resend API, DNS, RDAP) observes a stranger's mailbox.
3. The only test that answers it is a send, and the SENDING HOLD forbids transmitting.

So sections 1 to 3 establish the strongest statement available without a send: the records
are in order, the message should authenticate, and it matches no published content warning.
Whether it lands is unknown, and ticket 08 is where it stops being unknown.

### What the first real send must watch for

1. **`last_event` from Resend, not from the inbox.** `GET /emails` then `GET /emails/{id}`.
   `delivered` is the only acceptable value; `bounced`, `complained` or `suppressed` is a
   finding for this ticket rather than a flake to retry.
2. **Where it landed, from the recipient's side.** Ask the Contributor which folder it was
   in and record the answer. On Outlook read the headers Resend documents: `SCL`, where
   Microsoft says "An SCL of 5 or higher generally indicates the message is considered
   bad", and `CAT` (`SPM` spam, `BULK` bulk). On Gmail, the spam banner quoted in section 2 is the diagnosis.
3. **Authentication in the received headers.** Resend: "To confirm DMARC passed, you can
   inspect the email headers and confirm there is `dmarc=pass`." This is the one place the
   policy value becomes observable, and only as pass or fail: `p=none` does not decide
   whether DMARC passes, it decides what a failure is worth. Also read `Return-Path`, which
   should be `send.mail.rnui.dev`; no API response here exposes it, only the message does.
4. **The `text` part as received**: hand-written text, or Resend's flattening of the HTML. And the HTML byte count, against Gmail's 102 KB clip.
5. **A bounce, before any retry.** A hard bounce or a complaint puts the address on the
   suppression list: "Future emails to addresses on the list will be marked as `suppressed`
   and won't be delivered until the address is removed." The recovery is remove, then send
   again. A plain retry is documented to do nothing.
6. **Not findings:** promotional-tab placement, a recipient's personal filters, a corporate quarantine. Resend cannot see them and nothing here fixes them; its advice is to ask the recipient to check the other folders and mark the message not spam.
7. **Evidence that proves nothing:** any address on `rnui.dev`, the maintainer's included. That test already exists and already proved nothing.

Two things this run could not determine, recorded so they are not mistaken for settled:
whether the DMARC reports arriving at `hello@rnui.dev` are read, without which the policy
value cannot be judged and this ticket recommends no change to it; and whether `rnui.dev`
has any Google Postmaster Tools history, since adding a domain there needs a Google account
this shell does not have.

## Sources

Live reads, 2026-09-25 between 10:48 and 10:50 UTC, `RESEND_API_KEY` from `.env.local`:
`GET /domains`, `GET /domains/{id}`, `GET /emails`, `GET /emails/{id}` and `GET
/suppressions` on `https://api.resend.com`; `dig` for `send.mail.rnui.dev`,
`resend._domainkey.mail.rnui.dev`, `_dmarc.rnui.dev`, `_dmarc.mail.rnui.dev`,
`mail.rnui.dev` and `rnui.dev` against 1.1.1.1, 8.8.8.8 and the authoritative Cloudflare
nameservers; `openssl rsa -pubin -inform DER` on the published DKIM key; and
`curl -s https://pubapi.registry.google/rdap/domain/rnui.dev`.

Documentation, each quoted above with its own URL. Resend, under
`https://resend.com/docs/`: `dashboard/domains/dmarc`, `dashboard/emails/deliverability-insights`,
`api-reference/emails/send-email`, `webhooks/emails/bounced`, and the knowledge base pages
`do-i-need-2048-dkim`, `how-do-i-avoid-gmails-spam-folder`, `how-do-i-avoid-outlooks-spam-folder`,
`why-are-my-emails-going-to-spam`, `warming-up`, `why-are-my-emails-landing-on-the-suppression-list`,
`what-if-an-email-says-delivered-but-the-recipient-has-not-received-it` and
`is-it-better-to-send-emails-from-a-subdomain-or-the-root-domain`. Google:
`support.google.com/a/answer/81126`, `support.google.com/a/answer/14229414`,
`support.google.com/mail/answer/9981691`. IETF: RFC 7489 sections 3.1, 6.3, 6.6.3; RFC 7208
section 4.6.4; RFC 8301 section 3.2.

In-repo: `lib/resend.ts`, `lib/sender-identity.ts`, `lib/submission-notification.ts`,
`app/api/submit/route.ts`, `CLAUDE.md` (SENDING HOLD), `.scratch/public-submissions/map.md`
decisions 6, 7, 8 and 12, and `.scratch/submission-receipt/map.md` (Out of scope on DNS and
on unsubscribe links).

No mail was sent. No record on `mail.rnui.dev` was changed, and none is recommended.

