# What postal address and sender identity does rnui.dev publish?

Status: ready-for-human
Type: grilling

## Question

This is the one decision the charting grill could not default, and three tickets wait on it.

Every regime wants an identity attached to the mail. CAN-SPAM requires a **valid physical postal
address** in the message. CASL's ECPR s.4 required the consent request itself to carry a name, a
mailing address and a contact method — which is exactly what the old form lacked. GDPR's informed
limb wants the controller identified.

rnui.dev is run by one person. Publishing a home address to a mailing list, in a footer that will
sit in strangers' inboxes indefinitely and in an archive, is a real and irreversible privacy cost —
and it is not the kind of thing that can be walked back after the first send.

The options, and none is obviously right:

1. **The maintainer's home address.** Compliant everywhere, free, and unretractable.
2. **A registered business address.** Compliant and separable from the home, but means registering
   something.
3. **A PO box or virtual mailbox.** The usual answer for solo operators. Small annual cost. Check
   it is accepted as a "valid physical postal address" — some virtual-office services are not.
4. **Publish no postal address**, on the argument that a Digest of new Recordings is not commercial
   email and CAN-SPAM's requirement therefore does not attach. Cheapest, and the weakest position
   if it is ever tested.

Decide alongside it: the **From: name and address** the Digest sends under. It must be consistent
forever — changing it later resets whatever sender reputation has accrued.

## Acceptance

- One of the four chosen, with the reasoning recorded, including what was accepted as a risk.
- The exact footer identity block written out verbatim, ready for tickets 06, 07 and 09 to paste.
- The From: name and address fixed.

## Comments

**2026-08-14 — decided, with the maintainer, in one round.** All three sub-decisions taken.
Two of the three acceptance bullets are met outright; the second is met in every part except one
token, because the thing it names does not exist yet. Details below, then what is left.

### The decision

**Option 3, in its PO box form: a Bangladesh post-office box.** Not the home address, not a
registered business, not silence.

Reasoning, and what was weighed against what:

- **Option 1 is the only irreversible one on the list.** A home address sent to 29 inboxes cannot
  be recalled from any of them, and the research advises against it twice (§CAN-SPAM, §D.2). Every
  other option can be swapped later by editing one footer line. That asymmetry decided it before
  cost did.
- **Option 4 was the real competitor**, and it is not a silly position — a digest of new Recordings
  from a free, non-commercial catalogue may well fall outside CAN-SPAM's "commercial" primary
  purpose, and may fall outside CASL entirely (s.1(2), while there is no sponsorship or affiliate
  link). It was rejected because the whole cure-at-send-time argument in the research's §D rests on
  the Digest footer carrying the disclosures the old form lacked. Dropping the mailing address
  drops one of the four things CASL's ECPR s.4 wanted, in the one message built to supply them. It
  saves a trip to the post office and costs the argument its load-bearing member.
- **Option 2 was not seriously in play** — registering a company to send 29 people a weekly list of
  React Native components is the definition of the framework this effort was warned not to grow.
- **Between a BD PO box and a US virtual mailbox / CMRA**, the CMRA is the literally-compliant one
  and costs $120–240/year against a site with no revenue. The box is a few hundred BDT.

**Accepted as a risk, explicitly:** a Bangladesh PO box is *not* one of the three things the FTC's
guidance names. It contemplates a street address, a **USPS-registered** PO box, or a CMRA. Ours is
a real physical postal facility that receives mail addressed to it, which is the substance of the
requirement, but the literal text is not satisfied and nothing here pretends otherwise. This is
accepted because the exposure is 29 recipients of a non-commercial digest, and because it is the
question the research already parked as needing a real lawyer and never got one for — see
`research/research-consent-and-deliverability.md`, *Where a real lawyer is genuinely needed*, item
4. If that opinion is ever obtained and comes back unfavourable, the upgrade is a CMRA
subscription and one edited line. **That is the whole reason this option beat the home address:
being wrong here is cheap, and being wrong on option 1 is permanent.**

### The From:, fixed

```
From: rnui.dev <digest@mail.rnui.dev>
Reply-To: hello@rnui.dev
```

Brand in the display name rather than a person's, so the reputation accrues to the site and
survives the site changing hands; local part says what the mail is. `mail.rnui.dev`, never the
apex, per ticket 05 and map decision 8. Sender *identification* — the thing CASL s.6(2) actually
requires — is carried in full by the footer block below, so the display name does not have to
carry it.

**This is now permanent.** Changing it later resets accrued sender reputation, which is the one
asset a 29-address list spends months building.

**`hello@rnui.dev` must exist, receive, and keep receiving.** CASL s.6(2)/(3) and s.11 require the
contact method to stay valid for **60 days after every send**, so this is a standing obligation,
not a launch task. It is on the root domain deliberately: it outlives any change of email vendor,
which nothing at `mail.rnui.dev` would. Forwarding to an existing inbox satisfies it — ticket 05
is already in DNS and is the cheapest place to land the route.

### The footer identity block, verbatim

For the Digest (ticket 09). `{{POSTAL_ADDRESS}}` is the one unfilled token; `{{SIGNUP_DATE}}` is
per-recipient and comes from the `createdAt` ticket 03 preserved on all 29 survivors.

```
You signed up for the rnui.dev Digest at rnui.dev on {{SIGNUP_DATE}}.

rnui.dev — MD. MOHIBUR RAHMAN
{{POSTAL_ADDRESS}}
hello@rnui.dev

A weekly Digest of Recordings added to rnui.dev. No sponsor mail, no third-party
marketing, and your address is never sold or shared.

Unsubscribe · Privacy Policy
```

For the signup form's disclosure block (ticket 06). This is the research's §D.3 text with the
domain's own vocabulary — note "Recordings", not "animation", which is the `CONTEXT.md` _Avoid_
word ticket 06 was told to fix:

```
Get the weekly Digest

New Recordings added to rnui.dev, once a week. Sent by MD. MOHIBUR RAHMAN,
{{POSTAL_ADDRESS}}, hello@rnui.dev. No sponsor mail, no third-party marketing, and
your address is never shared. Unsubscribe any time — link in every email.
See our Privacy Policy.
```

Between them these carry all four things CASL's ECPR s.4 wants in a consent request (name, mailing
address, contact method, withdrawal statement), all four ICO wants for informed consent (controller
identity, purpose, processing, withdrawal), and CAN-SPAM's postal address plus opt-out.

`{{POSTAL_ADDRESS}}` renders as a single line, and should read:

```
PO Box <number>, <post office>, <city> <postcode>, Bangladesh
```

**Ticket 06 should put these in one module and import them**, rather than pasting into the form,
the policy and the Digest separately. Three copies of an address is three places for it to drift,
and 06 is the first consumer, so 06 owns creating it. Not built here — nothing imports it yet.

### Left for the maintainer

**Rent the box, then replace `{{POSTAL_ADDRESS}}` above.** Nobody but you can do this; it is a
trip to a post office and a small annual fee. Until then it is `ready-for-human` rather than
`resolved`, because a block with a blank in it is not "ready to paste" and tickets 06, 07 and 09
would paste the blank.

**Ticket 05 does not have to wait for the box.** It lists `Blocked by: 04`, but everything 05 reads
from this ticket — the `From:` name, the sending domain, the alignment target — is final as of
today; its acceptance bullets never mention a postal address. If you want the DNS and the test
broadcast moving while the box is being arranged, clear 05's `Blocked by:` line and it is takeable.
**06 and 07 genuinely are blocked** — both paste `{{POSTAL_ADDRESS}}` — and 09 behind them.

**Do not let the token reach a send.** If ticket 09 renders `{{POSTAL_ADDRESS}}` literally, the
Digest goes out with a placeholder where the compliance disclosure should be, to the one audience
this whole effort exists to treat properly. Worth one grep in 09's own check.
