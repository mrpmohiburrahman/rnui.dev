# rnui.dev mailing list — consent scope, staleness, deliverability

Research date: 2026-08-14. Primary sources only (ICO, EUR-Lex, FTC, CRTC/Justice Laws Canada, Google, Yahoo, IETF).

**Not legal advice.** Points that genuinely need a lawyer are flagged inline as **[LAWYER]**. Everything else is a practical call you can make yourself.

---

## The three verdicts

### 1. Weekly digest of newly added catalogue items — **SEND, after the fixes in §D**

The copy said "Get notified when new animation is being added" and the digest is exactly that. Typing an address and clicking Sign up under that sentence is an unambiguous affirmative act, and the purpose limb of GDPR Art 4(11) is the one part of this that is actually well specified. What is missing is the *informed* limb — no controller identity at the point of capture, no privacy link, no mention of withdrawal (ICO: consent must specifically cover the controller's identity, the purposes, and the right to withdraw) — plus the standing breach of ePrivacy Art 13(4) / PECR reg 23, which prohibits marketing email sent "without a valid address to which the recipient may send a request that such communications cease". Both of those are curable *at send time* by identifying yourself and adding a working unsubscribe. Under CAN-SPAM this is fine either way (opt-out regime) provided the message carries a postal address and a working opt-out. Under CASL it is the weakest link: express consent under s.10(1) + ECPR s.4 requires the consent request to have carried the sender's name, mailing address, a contact method, and a statement that consent can be withdrawn — yours carried none of those, so CASL express consent is formally defective and s.13 puts the burden of proving consent on you. In practice the risk of a complaint over a digest sent to someone who typed their address under that exact sentence is close to nil, and CASL may not bite at all while the site is genuinely non-commercial. Send it — but only with the §D fixes, and send it *as* the first issue, not as a request for permission.

### 2. One-off "we redesigned — which do you prefer?" survey — **SEND ONLY AS A SECTION INSIDE THE FIRST DIGEST. Do not send it standalone.**

Standalone it is the worst message you could pick for first contact: it is off-purpose (they signed up for new-animation notices, not product research), it arrives up to 20 months cold, and it is the one send with no consent story at all. Legally it is grey rather than clearly barred — ICO is explicit that "contacting people to conduct genuine market research is not direct marketing", so PECR reg 22 does not bite on a survey with zero promotional content; but GDPR still does, and because the data was collected on consent you cannot lean on the Art 6(4) compatibility test to repurpose it — you would need fresh consent or a separate lawful basis **[LAWYER]**. Under CAN-SPAM a pure survey is not a "commercial message" and is largely exempt, but a survey whose whole point is to drive people to look at the redesigned site edges into "advertises or promotes… content on a website operated for a commercial purpose". Under CASL a survey hyperlinking to a monetised site is a CEM on the face of s.1(2) ("having regard to… the hyperlinks in the message to content on a website"). Folding it into the digest solves all of this at once: one message, one consent basis (the one you actually have), one unsubscribe, one deliverability event instead of two. Put the digest content first and the survey ask second — that ordering also matters under CAN-SPAM's primary-purpose test.

### 3. Commercial / sponsorship pitches, promoting other products, paid placements — **DON'T SEND**

Nothing in "Get notified when new animation is being added" reaches this, and under GDPR consent for one purpose does not extend to another — ICO is explicit that a consent request must specifically cover all purposes and must name any third-party controllers relying on it. Under CASL these are unambiguously CEMs with no valid express consent and no implied-consent route (no existing business relationship, no conspicuous publication). CAN-SPAM alone would permit it, since the US is opt-out and consent is irrelevant there — but "legal in one of four regimes" is not a reason to do it, and this is precisely the content that generates the spam complaints described in §C. These addresses only become mailable for commercial content if the person later opts into a separate, explicitly labelled list.

**The adjacent case worth naming:** a clearly-marked sponsor slot *inside* a digest people opted into is a different thing from a standalone sponsorship pitch, and is normal newsletter practice — you remain the sender and the controller, the message is still the consented content, and the sponsor gets no data. That is defensible. Exporting or sharing the 48 addresses with any sponsor is not, in any regime.

---

## A. Consent scope, regime by regime

### GDPR + ePrivacy Directive (EU)

- **ePrivacy Art 13(1)**: email for direct marketing requires *prior consent*. Art 13(2)'s soft opt-in is unavailable — it applies only where details were obtained "in the context of the sale of a product or a service", and nobody bought anything.
- **Art 13(4)** independently prohibits marketing email that conceals the sender or lacks "a valid address to which the recipient may send a request that such communications cease". With no unsubscribe existing anywhere, *any* marketing send today breaches this regardless of consent quality. This is the single most clear-cut defect and it is also the cheapest to fix.
- **GDPR Art 4(11)/7**: freely given, specific, informed, unambiguous, demonstrable. You pass on unambiguous (affirmative act), pass on specific (the purpose sentence is narrow), and fail on informed (no controller identity, no privacy information, no withdrawal right at the point of capture). You partially pass on demonstrable: you have who and when, but ICO's record standard also wants *what they were told* — a versioned copy of the form copy in force at that timestamp. If you still have the exact copy for the whole 2024-12-30 → 2026-08-11 window, snapshot it now and store it with the list; that is the evidence that makes the digest defensible.
- **Territorial scope**: an individual in Bangladesh with no EU establishment is only caught by Art 3(2) if the site is "offering goods or services… to data subjects in the Union" (free counts) with apparent targeting, or monitoring behaviour. A global English-language dev resource with no EU-specific targeting is a weak hook. **[LAWYER]** — but the standard is the right design target anyway, so this is not worth much effort.
- **Purpose limitation (Art 5(1)(b))**: the digest is the collected purpose. The survey is a different purpose. Commercial mail is a different purpose *and* a different lawful basis problem.

### UK GDPR + PECR

Substantively identical (PECR reg 22 = ePD Art 13; ICO's own summary: "you must not send marketing emails or texts to individuals without specific consent", plus a soft opt-in for previous *customers* only). Two UK-specific points carry real weight:

- **Market research is carved out.** ICO: "Contacting people to conduct genuine market research is not direct marketing. However, if your market research messages include promotional material, or if the research is ultimately being carried out for you or others to send direct marketing to the people involved, then this is direct marketing" (sugging). So the survey escapes PECR only if it is promotion-free and the answers are not used to market back to respondents.
- **A request for consent is itself marketing.** See §B — this is the decisive point for the whole staleness question.

### CAN-SPAM (US)

Opt-out, not opt-in, so the consent history is legally irrelevant here; what matters is the message. If the primary purpose is commercial (which includes "email that promotes content on commercial websites"), every send needs: truthful headers, non-deceptive subject, clear disclosure that it is an ad, **a valid physical postal address**, a clear opt-out mechanism, honoured within 10 business days, with the mechanism live for at least 30 days after the send. A promotion-free survey is "other"/non-commercial content and largely exempt. Penalties are per-email, up to $53,088 each.

The postal-address requirement is the awkward one for a solo operator in Bangladesh: the FTC contemplates a street address, a USPS-registered PO box, or a CMRA mailbox. Publishing a home address is a bad idea for other reasons. Use a business/mail-forwarding address. **[LAWYER]** on what satisfies this for a non-US sender.

### CASL (Canada)

The strictest, and the one that catches the most here. CASL applies whenever "a computer system located in Canada is used to send or access the electronic message" (s.12(1)) — a Canadian opening Gmail is enough — and s.13 puts the onus of proving consent on **you**.

- **s.1(2)**: a CEM is any message where it is reasonable to conclude that one of its purposes is to encourage participation in a commercial activity, judged on content, **hyperlinks to a website**, and contact information. A digest for a genuinely non-commercial free catalogue may fall outside CASL entirely. The moment there is sponsorship, affiliate links, or paid placement, it is inside.
- **s.10(1)(a)** requires the consent request to set out the purpose(s) — you did this, and it is the one thing you got right.
- **ECPR (SOR/2012-36) s.4** additionally requires the consent request to carry: the sender's name / business name, a mailing address plus one of phone, email or web address, and **a statement that consent can be withdrawn**. Your form carried none of these, so express consent is formally defective for all three sends.
- **Implied consent (s.10(9))**: no existing business relationship, and the "conspicuously published"/"disclosed the address" limbs both require the message to be relevant to the person's *business, role or duties in a business or official capacity*. There is a colourable argument that a React Native catalogue digest is relevant to a developer's professional role — but 41 of 48 are personal gmail addresses and the burden of proof is yours. Available as an argument, not something to rely on.
- **s.6(2)/(3) + s.11**: every CEM needs sender identification, contact info valid for 60 days after the send, and an unsubscribe mechanism that works by the same electronic means, is free, requires no further action from the user, stays valid 60 days, and is honoured within 10 business days.

### Where each send lands

| | GDPR + ePD | UK GDPR + PECR | CAN-SPAM | CASL |
|---|---|---|---|---|
| Weekly digest | grey → OK once identified + unsubscribable | same | fine with postal address + opt-out | grey; consent formally defective, low real risk while non-commercial |
| One-off survey (standalone) | grey — new purpose off consent-collected data | outside PECR if promotion-free; GDPR issue remains | largely exempt if promotion-free | likely a CEM via hyperlinks; no valid consent |
| Commercial / sponsorship | **no** | **no** | permitted if fully compliant | **no** |

---

## B. The staleness problem

**The counter-intuitive core finding: a re-permission email is legally *worse* than the digest, not safer.**

The ICO fined Flybe £70,000 and Honda £13,000 in March 2017 for exactly the email people reach for in this situation. Honda's facts are yours: it sent 289,790 emails to clarify marketing preferences, believed they were service messages, and could not produce evidence the recipients had ever consented. ICO Head of Enforcement Steve Eckersley: *"Both companies sent emails asking for consent to future marketing. In doing so they broke the law. Sending emails to determine whether people want to receive marketing without the right consent, is still marketing and it is against the law."* ICO's current guidance repeats it as a worked example — a hotel emailing past guests to ask if they would like to consent to offers "is still sending it for direct marketing purposes". CASL codifies the same rule in statute: s.1(3) — "An electronic message that contains a request for consent to send a message described in subsection (2) is also considered to be a commercial electronic message."

So: **do not send a "may we email you?" email.** It needs the consent it is asking for. The way out is the opposite move — send the message they actually asked for.

**What to do instead.** Send the first digest. It is in scope of the stated purpose, so it needs no new consent. Open it with the transparency that was missing at capture — who you are, that they signed up at rnui.dev on `<createdAt date>` to be notified about new animations, what the email is and how often it comes — and give a prominent unsubscribe. That is not a consent request; it is the consented content with the missing disclosures retro-fitted, and it doubles as re-engagement. Add a low-key "stay subscribed" link as a secondary element if you want an engagement signal, but the digest must be the message, not the wrapper.

**How stale is 20 months?** No regime sets an expiry. ICO: "The UK GDPR does not set a specific time limit for consent. Consent is likely to degrade over time… If in doubt about whether the consent is still valid, you should refresh it," and its default recommendation where you are not in regular contact is **to consider refreshing every two years**. Your oldest address is 20 months, so you are just inside — but never having mailed at all is worse than stale, because expectations were never set and nobody has ever seen your From: address.

**Sunset policy.** Both Google and Yahoo tell you to do this in their own words — Google: "Consider unsubscribing recipients who don't open or read your messages"; Yahoo: "Monitor hard and soft bounces as well as inactive recipients… Remove invalid recipients from your list promptly" and "Consider sending a reconfirmation email to inactive subscribers periodically." Concretely:

1. **Before the first send**, drop: anything that fails syntax/MX validation, role addresses (`info@`, `admin@`, `support@`, `contact@`), anything whose `createdAt` clusters with the junk on the adjacent form (same minute, same burst — check for the pattern), anything with an obviously synthetic local part. Run all 48 through a bulk verifier; at this size it costs cents and a single spamtrap hit costs far more.
2. **On the first send**, drop every hard bounce immediately.
3. **After three issues**, drop anyone with zero opens and zero clicks.
4. **Standing rule going forward**, drop at 6 months of no engagement.

**When to just delete the whole thing.** 48 addresses, never mailed, 85% gmail, no captcha on a site with demonstrated bot submissions, and no record of what was consented to beyond one sentence. The list is worth roughly nothing; the domain you want to run a weekly digest from for years is worth a lot. Deleting all 48 and restarting with a compliant double-opt-in form is a completely defensible choice and costs you almost nothing. If you are hesitating at any point in §D, take that option instead.

---

## C. Deliverability — what actually applies to 48 addresses

### Threshold-gated (5,000+/day to Gmail; Yahoo "bulk"; Microsoft 5,000+/day since 2025-05-05) — **does NOT apply to you**

- SPF **and** DKIM (both), plus a DMARC record at minimum `p=none`
- DMARC alignment: the From: organisational domain must align with the SPF or the DKIM domain
- One-click unsubscribe per RFC 8058 on marketing and subscribed messages, plus a visible unsubscribe link in the body
- Unsubscribes honoured within 2 days (Yahoo) / 48h recommended (Google)

Note for later: Google counts the 5,000 at the **primary domain** level across subdomains, and "senders who meet the above criteria at least once are permanently considered bulk senders" — status never expires. Not a live concern at 48/week, but it is a one-way door.

### Applies at **any** volume, including yours

- SPF **or** DKIM at minimum (Google and Yahoo both)
- Valid forward and reverse DNS (PTR) for the sending IP, with the PTR hostname resolving back to the same IP
- TLS for transmission
- **Spam rate below 0.3%** — Google lists this in the all-senders block, and separately advises keeping it below 0.10% and never reaching 0.30%
- RFC 5322 formatting (RFC 5321 too, per Yahoo), valid Message-ID, single-instance headers
- No Gmail From: header impersonation
- Google, Nov 2025: "Gmail is ramping up its enforcement on non-compliant traffic. Messages that fail to meet the email sender requirements will experience disruptions, including temporary and permanent rejections."

### The arithmetic that actually decides this

**One spam complaint out of 41 gmail recipients is a 2.4% spam rate — eight times the 0.3% threshold and twenty-four times the 0.1% target. Two complaints is 4.9%.** A cold first-contact email to a 20-month-old list, from a From: address nobody has ever seen, with no unsubscribe, is a one-or-two-complaint message by construction.

And **you will not be able to see it happen.** Google: "Data might be missing if the total number of messages for a given day is too low. This is to protect users' privacy." At 48 messages Postmaster Tools shows you nothing. You get no spam-rate number, no reputation reading, no feedback — just silence and, later, unexplained spam foldering.

### Can the survey poison the channel? Yes — but understand the actual mechanism

The domain-wide reputation hit from 48 messages is more likely to be small than catastrophic, because Gmail's reputation model is aggregate and 48 messages is statistical noise. The real damage is concentrated and three-part:

1. **Per-recipient.** Google, plainly: "Don't send messages to people who didn't sign up to get messages from you. These recipients might mark your messages as spam, and **future messages to these recipients will be marked as spam**." Complain once, and that person never sees your digest again. On a 48-person list that is the whole point of the exercise gone.
2. **Spamtraps.** This is the tail risk that is genuinely disproportionate to volume. An adjacent form on the same site has visible bot junk and there is no captcha, so some of these addresses may have been planted rather than typed. One recycled-spamtrap hit can get the sending domain or IP onto a blocklist, which affects everything you send, forever, from a single send of 48.
3. **Your ESP.** If you send through a shared-IP provider, complaints and trap hits get *their* abuse team's attention long before Google's. Account suspension for mailing an unmailed 20-month-old list is a routine outcome and is governed by the provider's AUP, not by any of the four laws above.

Google is explicit that reports accumulate: "Over time, user spam reports can lower your domain's reputation." So the asymmetry is what settles it — near-zero upside (48 addresses) against a domain you intend to send from weekly for years.

**Structural fix, and it is the highest-value item in this whole document:** send the digest from a **subdomain** (`news.rnui.dev` or `mail.rnui.dev`) with its own DKIM `d=` and its own SPF, never from the root domain. Yahoo: "Don't send bulk/marketing email from the same IPs you use to send user mail, transactional mail, alerts… Each IP and DKIM domain has a reputation." Google says the same in different words. If the digest ever goes wrong, the damage stays off `rnui.dev` and away from your personal and transactional mail. This costs two DNS records.

**Warm-up.** Do not fire 48 at once from a domain with no sending history. Google: "Start with a low sending volume to engaged users, and slowly increase the volume over time… Avoid introducing sudden volume spikes if you do not have a history of sending large volumes." Send to yourself, then 5, then 10, then the rest, over several days.

**Use an ESP, don't self-host.** At 48 addresses this is free-tier territory (Resend, Postmark, Buttondown, Mailgun, SES + Listmonk). You get RFC 8058 headers, DKIM signing, PTR, TLS, bounce and complaint handling, and Yahoo CFL processing without writing any of it. Self-hosting an SMTP server to send 48 emails a week is the definition of a job not worth doing.

---

## D. The fixes — what must exist before any send

### 1. Unsubscribe

Not threshold-gated in *your* case as a matter of Gmail policy, but required by ePrivacy Art 13(4), PECR reg 23, CAN-SPAM and CASL s.11 regardless of volume — and it is the mechanism that converts would-be spam complaints into harmless unsubscribes, which is exactly what a 41-gmail list cannot afford to skip.

**Header (RFC 8058):**
```
List-Unsubscribe: <https://news.rnui.dev/u/8f3a…>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```
Per RFC 8058 §3.1 and §4, this is only valid if:
- the `List-Unsubscribe` field contains one **HTTPS** URI (a `mailto:` may be included as well, but `mailto:` alone does not satisfy Gmail);
- the URI carries enough per-recipient information to complete the removal with no further interaction, and **SHOULD include an opaque, hard-to-forge token** rather than a plaintext address, which the server validates;
- the message carries a valid **DKIM signature covering both List-Unsubscribe headers** — one-click is meaningless without it;
- the endpoint accepts `POST` with body `List-Unsubscribe=One-Click`, as `multipart/form-data` or `application/x-www-form-urlencoded`, and **must not** redirect, require cookies, or require HTTP auth.

**Body link:** a visible plain-language unsubscribe link as well, near the bottom, working on a single click with no login, no reason required, and no data entry beyond the token already in the URL. It may go to a preferences page (Google explicitly permits this for the *body* link, but not for the header URI).

**Timing:** honour within 48 hours (Google's recommendation and Yahoo's 2-day requirement). CASL allows 10 business days and CAN-SPAM 10 business days — ignore both and do it instantly; suppression is a database write. Keep the endpoint live at least 60 days after each send (CASL s.11(2); CAN-SPAM's floor is 30 days) — in practice, keep it live forever.

**Suppression list:** a permanent, never-purged table of unsubscribed addresses, checked before every send. CAN-SPAM additionally bars you from selling or transferring an address once someone has opted out.

### 2. Privacy policy

The current one — "we collect an email address voluntarily" and "share with trusted third-party service providers" — is not sufficient for a mailing list. It must add:

- **Who you are**: name, and a contact address including a **postal address** (needed independently by CAN-SPAM and CASL ECPR s.2(1)(d), so you need one regardless — use a business or mail-forwarding address, not your home).
- **What is collected**: email address, signup timestamp, the consent text in force at signup, and any open/click tracking — if you use open tracking, say so here.
- **Why, and on what basis**: to send a periodic email digest of new entries added to the catalogue; consent (GDPR Art 6(1)(a)) plus ePrivacy Art 13 / PECR reg 22. Say that the list is not used for sponsorship pitches or third-party marketing, and that addresses are never sold, rented or shared with sponsors.
- **Withdrawal**: consent may be withdrawn at any time via the unsubscribe link in every email or by writing to `<address>`; withdrawal does not affect the lawfulness of prior processing.
- **Retention**: how long you keep addresses, and the sunset rule stated concretely ("removed after 6 months with no opens or clicks").
- **Processors, by name**: name the ESP — "trusted third-party service providers" is not a disclosure. Name the country the data goes to.
- **Rights**: access, rectification, erasure, objection, portability, and the right to complain to a supervisory authority.
- **Version and effective date**, so the policy in force at any given signup is provable.

### 3. Signup form copy, going forward

Replace the bare sentence with something that satisfies the strictest regime (CASL ECPR s.4), which automatically satisfies GDPR "informed":

> **Get the weekly digest**
> New animations and components added to rnui.dev, once a week. Sent by `<Name>`, `<postal address>`, `<email>`. No sponsor mail, no third-party marketing, and your address is never shared. Unsubscribe any time — link in every email. See our [Privacy Policy](/privacy).
> `[ youremail@email.com ]` `[ Sign up → ]`

That block contains all four things CASL requires in a consent request (name, mailing address, contact method, statement that consent can be withdrawn) plus the purpose, and all four things ICO requires for informed consent (controller identity, purposes, processing activities, withdrawal right).

A separate unticked checkbox is not strictly required when the form does one thing only — submitting an address under an unambiguous statement is a clear affirmative action, and Google warns against pre-checked boxes rather than requiring boxes. Skip the checkbox; spend the effort on the record instead.

**Store per signup:** email, timestamp, IP, the exact consent string, and a form/policy version ID — that is ICO's record standard (who, when, **what they were told**, how, whether withdrawn). It is four extra columns.

**Double opt-in, and skip the captcha.** Both Google ("Confirm each recipient's email address before subscribing them") and Yahoo ("send them an email asking them to click to confirm their opt-in… won't sign up accidentally or get signed up maliciously… won't contain uninterested people, fake email addresses, or most robots") recommend confirmed opt-in. For this site it solves *two* problems with one mechanism: it is the proof-of-consent record you currently lack, and it filters the bot submissions that the missing captcha lets through. Adding a captcha solves only the second. Do the double opt-in; do not add a captcha.

### 4. Can the existing 48 be fixed retroactively?

**No — and no email can fix it either.** You cannot retro-fit "informed at the point of capture"; that moment has passed. Specifically:

- **A re-permission email cannot fix it.** It is itself marketing requiring the consent it asks for (ICO/Flybe/Honda; CASL s.1(3)). Sending one is a new breach layered on the old one.
- **What *can* be done** is narrower and sufficient: send the digest, which is in scope of the stated purpose, and carry inside it every disclosure that was missing at capture — sender identity, postal address, a reminder of when and where they signed up, what the email is, and a working one-click unsubscribe. That cures the live defects (ePD Art 13(4), transparency, CASL s.6(2)) even though it cannot improve the original capture record. Preserve a snapshot of the old form copy alongside the list as your evidence of what was consented to.
- **The clean option remains available and is genuinely reasonable here**: delete all 48, ship the new form with double opt-in, and rebuild. 48 addresses is about three weeks of a functioning signup form.

---

## Pre-send checklist

Everything below must be true before the first email leaves.

**Infrastructure**
- [ ] Sending from a **subdomain** (`news.rnui.dev`), never the root domain
- [ ] SPF record published for the sending subdomain, including the ESP
- [ ] DKIM enabled, **key ≥ 1024 bits** (Google requires this for personal Gmail; use 2048)
- [ ] DMARC record published at `p=none` with a `rua=` address (not required at your volume — publish it anyway; it is one DNS record and you will want the history before you ever grow)
- [ ] From: domain aligns with the SPF or DKIM domain
- [ ] Valid PTR for the sending IP, resolving forward to the same IP (your ESP handles this — verify it)
- [ ] TLS on transmission (ESP default)
- [ ] Sending through an ESP, not a self-hosted SMTP server
- [ ] Postmaster Tools registered for the subdomain — accepting that it will show no data at this volume

**Message**
- [ ] `List-Unsubscribe:` with one HTTPS URI carrying a per-recipient opaque token
- [ ] `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- [ ] DKIM signature covers both List-Unsubscribe headers
- [ ] POST endpoint live: no redirect, no cookies, no auth, validates the token, removes instantly, returns 200
- [ ] Visible unsubscribe link in the body, one click, no login
- [ ] Valid physical **postal address** in the footer
- [ ] Sender clearly identified — real name and/or rnui.dev, consistent From: address, no emoji or content in the display name
- [ ] Opening line names when and where they signed up and what this email is
- [ ] Honest subject line; From: contains exactly one address; valid Message-ID; RFC 5322-clean
- [ ] Digest content first, survey ask second (primary-purpose test)

**List**
- [ ] Old form copy snapshotted and stored with the list as consent evidence
- [ ] All 48 syntax/MX validated; failures dropped
- [ ] Role addresses dropped
- [ ] Bot-pattern addresses dropped (cross-check `createdAt` clustering against the junk on the adjacent form)
- [ ] Bulk verification run; risky and unknown addresses dropped
- [ ] Permanent suppression table exists and is checked at send time

**Site**
- [ ] Privacy policy rewritten per §D.2 and published, with a version and effective date
- [ ] Signup form copy replaced per §D.3
- [ ] Double opt-in wired for all new signups; confirmation timestamp stored
- [ ] Consent record columns added: consent string, form version, IP, timestamp

**Send sequence**
- [ ] Send to yourself first; verify the one-click POST actually removes you
- [ ] Then 5 addresses, then 10, then the remainder, spread over several days
- [ ] Drop hard bounces immediately
- [ ] After three issues, drop zero-engagement addresses
- [ ] Never send a "may we email you?" email — not now, not later

**Do not send at all**
- [ ] Standalone survey email — fold it into the first digest instead
- [ ] Sponsorship pitches, other-product promotion, paid placements to this list
- [ ] Any export or sharing of these 48 addresses with a sponsor or third party

---

## Where a real lawyer is genuinely needed

1. Whether GDPR Art 3(2) reaches a Bangladesh-based individual running a free, globally-targeted dev resource with no EU-specific targeting.
2. Whether a digest for a non-commercial open-source catalogue is "direct marketing" under PECR at all, and whether it is a "commercial electronic message" under CASL — both answers flip once sponsorship or affiliate links appear.
3. Whether a product survey can ride on legitimate interests when the underlying data was collected on consent (Art 6(4) does not offer a compatibility route out of consent).
4. What satisfies CAN-SPAM's "valid physical postal address" for a non-US individual sender.
5. Obligations under Bangladesh's Personal Data Protection Act 2026 — reported as passed in April 2026 with enforcement mechanisms delayed to roughly May 2027, but that timing comes from secondary sources and needs checking against the gazette.

---

## Sources

**EU / UK**
- ePrivacy Directive 2002/58/EC, Art 13 — https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32002L0058
- ICO, Electronic mail marketing (Guide to PECR) — https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/
- ICO, Identify direct marketing (market research carve-out; service messages) — https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/identify-direct-marketing/
- ICO, What is valid consent? (specific/informed; how long consent lasts) — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/what-is-valid-consent/
- ICO, How should we obtain, record and manage consent? (record standard; two-year refresh) — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/how-should-we-obtain-record-and-manage-consent/
- ICO press release, Flybe and Honda fines, 27 Mar 2017 — https://www.wired-gov.net/wg/news.nsf/articles/ICO+warns+UK+firms+to+respect+customers+data+wishes+as+it+fines+Flybe+and+Honda+27032017142000 (ICO's own 2017 news page has since been removed under its website retention policy; enforcement pages: https://ico.org.uk/action-weve-taken/enforcement/flybe-limited/ , https://ico.org.uk/action-weve-taken/enforcement/honda-motor-europe-limited/)

**US**
- FTC, CAN-SPAM Act: A Compliance Guide for Business — https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business

**Canada**
- CASL (S.C. 2010, c. 23), ss. 1(2)-(3), 6, 10, 11, 12, 13 — https://laws-lois.justice.gc.ca/eng/acts/E-1.6/page-1.html and /page-2.html
- Electronic Commerce Protection Regulations (CRTC), SOR/2012-36, ss. 2-4 — https://laws-lois.justice.gc.ca/eng/regulations/SOR-2012-36/page-1.html
- ISED, Canada's anti-spam legislation — https://fightspam.gc.ca/eic/site/030.nsf/eng/00304.html

**Deliverability**
- Google, Email sender guidelines — https://support.google.com/a/answer/81126
- Google, Email sender guidelines FAQ (bulk definition, Nov 2025 enforcement, one-click detail) — https://support.google.com/a/answer/14229414
- Google, Postmaster Tools (low-volume data suppression) — https://support.google.com/mail/answer/9981691
- Yahoo Sender Hub, best practices — https://senders.yahooinc.com/best-practices/
- RFC 8058, Signaling One-Click Functionality for List Email Headers — https://www.rfc-editor.org/rfc/rfc8058
- Microsoft Outlook high-volume sender requirements (5,000+/day, from 5 May 2025) — https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%e2%80%99s-new-requirements-for-high%e2%80%90volume-senders/4399730
