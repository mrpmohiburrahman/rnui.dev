# What postal address and sender identity does rnui.dev publish?

Status: resolved
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

**2026-08-14 — decided, with the maintainer, over two rounds.** All three sub-decisions taken and
all three acceptance bullets met. The postal question was decided twice: a PO box was chosen first,
then the maintainer supplied a home postal locality instead and, on being shown what that changes,
confirmed it. **The second answer is the decision.** The first is recorded below because the
reasoning that was used to reject the home address is the reasoning the maintainer then overrode
with their eyes open, and a record that hides that is worse than useless.

### The decision

**Option 1, in its coarsest available form: the maintainer's home postal locality.**

```
Halima Nagar, Cumilla 3502, Bangladesh
```

No box number, because no box was rented. This is the sub-post-office catchment the maintainer
lives in, published as the sender's mailing address.

**This reverses the first answer, which was a rented Bangladesh PO box (option 3).** That was
chosen on one argument: of the four options only the home address is irreversible, since an address
in 29 inboxes cannot be recalled from any of them, and the research advises against it twice
(§CAN-SPAM, §D.2). The maintainer was shown that argument explicitly, together with the fact that
this shares option 1's one-way property, and chose it anyway. **That is their call to make and it is
made.** What follows is what the choice actually costs and what genuinely blunts it — not a
re-argument.

**What it costs.** Permanence. Every other option on the list could be swapped later by editing one
footer line; this one cannot be unpublished from inboxes or archives. If it is ever regretted, the
remedy changes the address for *future* sends only.

**What genuinely blunts it, and is why this is defensible rather than merely chosen.** A Bangladeshi
sub-office is not a street address. `Halima Nagar` is Halimanagar SO, a real office in the Bangladesh
Post network whose delivery catchment runs to several square kilometres and covers multiple
mahallas. `PO, district` sits one rung above street level: it names the office that does final-mile
delivery, not a house, a road or even reliably a neighbourhood. Publishing it discloses a city and a
postal catchment, which is a genuinely smaller disclosure than the "home address" the research warns
against — the research's warning is aimed at a street address, and this is not one.

**The compliance side of the trade moves the other way, and improves.** A residential postal locality
is closer to CAN-SPAM's contemplated "street address" than a foreign PO box would have been, and it
sidesteps the open question the first decision had to accept as a risk — whether a *non-US*,
non-USPS-registered box satisfies "valid physical postal address" at all, which the research parks as
needing a real lawyer (`research/research-consent-and-deliverability.md`, *Where a real lawyer is
genuinely needed*, item 4). That question no longer has to be answered. **So this decision buys
compliance certainty with privacy, where the first bought privacy with compliance uncertainty.**
Both were coherent; they price the same trade in opposite directions.

The other two options stayed rejected, on unchanged reasoning:

- **Option 4 (publish nothing)** is not a silly position — the Digest may fall outside CASL entirely
  (s.1(2), while there is no sponsorship or affiliate link). But it does **not** get CAN-SPAM's
  non-commercial carve-out: the research grants that only to a promotion-free survey and puts the
  Digest inside the regime, "fine with postal address + opt-out". Rejected because the whole
  cure-at-send-time argument in the research's §D rests on the Digest footer carrying the
  disclosures the old form lacked; dropping the mailing address takes the postal address out of the
  one message built to carry it — CAN-SPAM's requirement directly, and CASL s.6(2)'s sender
  identification with it.
- **Option 2 (register a business)** was never seriously in play — registering a company to send 29
  people a weekly list of React Native components is the definition of the framework this effort was
  warned not to grow.

**Accepted as a risk, explicitly:** the address is permanent once sent, it identifies the
maintainer's city and postal catchment, and no later decision retracts it from a delivered message.
Accepted knowingly, by the person whose address it is, after being shown the alternative and its
cost.

**The postcode was checked, then confirmed.** `3502` was first established from four independent
compilations, internally consistent with the Cumilla Sadar cluster (Cumilla HO 3500, Cantonment
3501, Halimanagar 3502, Courtbari 3503, Suaganj 3504) — but *no* Bangladesh Post government source
was reachable, `bdpost.gov.bd` failing on a TLS certificate error, so it was recorded as
secondary-sourced rather than silently pasted. **The maintainer confirmed it on 2026-08-14.** They
live in that catchment, which is a better authority than the government page would have been.
Treated as settled.

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

For the Digest (ticket 09). Complete and ready to paste. `{{SIGNUP_DATE}}` is the only token, it is
per-recipient, and it comes from the `createdAt` ticket 03 preserved on all 29 survivors.

```
You signed up for the rnui.dev Digest at rnui.dev on {{SIGNUP_DATE}}.

rnui.dev — MD. MOHIBUR RAHMAN
Halima Nagar, Cumilla 3502, Bangladesh
hello@rnui.dev

A weekly Digest of Recordings added to rnui.dev. No sponsor mail, no third-party
marketing, and your address is never shared.

Unsubscribe · Privacy Policy
```

For the signup form's disclosure block (ticket 06). This is the research's §D.3 text with the
domain's own vocabulary — note "Recordings", not "animation", which is the `CONTEXT.md` _Avoid_
word ticket 06 was told to fix:

```
Get the weekly Digest

New Recordings added to rnui.dev, once a week. Sent by MD. MOHIBUR RAHMAN,
Halima Nagar, Cumilla 3502, Bangladesh, hello@rnui.dev. No sponsor mail, no
third-party marketing, and your address is never shared. Unsubscribe any time
— link in every email. See our Privacy Policy.
```

**These two blocks do different legal jobs, and must not be swapped or conflated.**

- **The signup block is a consent request**, so CASL's ECPR s.4 binds it: name, mailing address,
  contact method, and a statement that consent can be withdrawn — all four are in it, which carries
  ICO's four for informed consent (controller identity, purpose, processing, withdrawal) with them.
- **The Digest footer is not a consent request and cannot become one.** ECPR s.4 binds the moment of
  capture, and for the 29 that moment has passed — the research is explicit that it cannot be
  retro-fitted and that no email can fix it. What the footer does is carry CAN-SPAM's postal address
  and opt-out, and cure the live defects: ePD Art 13(4), transparency, and CASL **s.6(2)** sender
  identification with s.11's unsubscribe.

The distinction is load-bearing, not pedantry. Reading the footer as a consent request is one step
from sending a re-permission email, which map decision at *The three sending verdicts* forbids
outright — it is itself marketing, and is what the ICO fined Flybe and Honda for.

The address renders as one line and must be byte-identical in both blocks and in the privacy policy:

```
Halima Nagar, Cumilla 3502, Bangladesh
```

Spelling note, so nobody "corrects" it later: **Cumilla** is the official romanisation since 2018;
*Comilla* is the older spelling and is still widely used, including by the maintainer. Either
delivers — the postcode and office name carry the routing — but pick one and never vary it, because
an identity block that changes between the form, the policy and the footer is worse than either
spelling. This ticket picks `Cumilla`.

**Ticket 06 should put these in one module and import them**, rather than pasting into the form,
the policy and the Digest separately. Three copies of an address is three places for it to drift,
and 06 is the first consumer, so 06 owns creating it. Not built here — nothing imports it yet.

### Left for the maintainer

**~~Confirm the postcode is 3502.~~ Done — confirmed by the maintainer, 2026-08-14.**

**Make `hello@rnui.dev` receive mail.** A second maintainer task, missing from this list until
review caught it. The address is published in both blocks above and must stay reachable for **60
days after every send** (CASL s.6(2)/(3), s.11), so it is a standing obligation, not a launch step.
A forward to an existing inbox discharges it. Nothing currently owns this: ticket 05's acceptance
covers *sending* DNS on `mail.rnui.dev` and has no bullet for *receiving* on the apex. Simplest fix
is to add one there while 05 is already in DNS, rather than inventing a ticket for a single MX or
forwarding rule.

**Nothing is blocked by this ticket any more.** 05, 06 and 07 all list `Blocked by: 04`, and all
three read values that are now final:

- **05** takes the `From:` name, the sending domain and the alignment target.
- **07** takes "the contact method from ticket 04" — `hello@rnui.dev`. *(An earlier version of this
  comment called 07 blocked. That was wrong: its bullets never ask for the postal address, and the
  same test that freed 05 frees it.)* Its acceptance is the definition of done, though note the
  research's §D.2 also lists a postal address among what a privacy policy should carry — now
  available, so 07 can include it first time rather than needing a second pass.
- **06** takes the disclosure block, which is complete.

Their `Blocked by: 04` lines can all be cleared. **09** stays blocked, but on 03, 05, 06, 07 and 08
— not on anything here.

**One thing must not reach a send.** `{{SIGNUP_DATE}}` is still a token in the Digest footer, by
design — it is per-recipient and ticket 09 fills it from each survivor's `createdAt`. If 09 renders
it literally, the Digest goes out with a placeholder in the line that tells someone when they
consented, to the one audience this effort exists to treat properly. Worth one grep in 09's check.
