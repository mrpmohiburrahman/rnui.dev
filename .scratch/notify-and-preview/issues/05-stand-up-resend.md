# Stand up Resend on mail.rnui.dev

Status: ready-for-agent
Type: task
Blocked by: 04

## Question

Provision the sending channel. Decision 12 chose Resend: free at this size, no import review gate
to clear with an aged list, and `List-Unsubscribe` plus `List-Unsubscribe-Post:
List-Unsubscribe=One-Click` are emitted automatically on Broadcasts — RFC 8058 without writing it.

**Send from `mail.rnui.dev`, never the root domain.** Two DNS records, and it is the single
highest-value deliverability decision available: a reputation problem on a sending subdomain does
not take the apex with it.

Part of this is HITL — DNS access is the maintainer's.

## Acceptance

- `mail.rnui.dev` configured with SPF, DKIM (2048-bit) and DMARC `p=none` with a `rua=`. DMARC is
  not contractually forced at 48 recipients; publish it anyway.
- `From:` aligned to SPF or DKIM.
- API key in the environment, not committed. Free-tier limits recorded in Comments — **3,000/month
  and 100/day**; the daily cap is what actually binds a single-batch Digest.
- Broadcasts created **via the API**, not the dashboard — Resend cannot send a dashboard-drafted
  broadcast programmatically, and ticket 11 depends on firing one from CI.
- A test broadcast sent to the maintainer, and **the one-click unsubscribe POST verified to
  actually remove the address.** Verified, not assumed — ticket 08 depends on knowing exactly what
  it removes it from.
- Google Postmaster Tools registered, accepting it will show nothing at this volume.

## Comments

**2026-08-14 — DNS reconnaissance only, from ticket 04's session. Nothing implemented, ticket not
claimed.** Recorded so it is not re-derived. All of it is `dig` output against live DNS:

```
NS      rnui.dev   harleigh.ns.cloudflare.com / keaton.ns.cloudflare.com
MX      rnui.dev   route1|route2|route3.mx.cloudflare.net
TXT     rnui.dev   v=spf1 include:amazonses.com include:_spf.mx.cloudflare.net ~all
TXT     _dmarc.rnui.dev   (none)
MX/TXT  mail.rnui.dev     (none)
```

Four things follow, and two of them change what this ticket has to do:

1. **DNS is Cloudflare, and Cloudflare Email Routing is already switched on** for the apex — those
   `route*.mx.cloudflare.net` records and the `_spf.mx.cloudflare.net` SPF include are its
   signature. So the `hello@rnui.dev` receiving obligation that ticket 04 left unowned is a
   dashboard rule, not an infrastructure project: Cloudflare → Email → Email Routing → add a custom
   address forwarding to an existing inbox. Free, and no DNS edit needed because the MX is already
   there. **This is the cheapest place to discharge it** — hence 04's suggestion of one more bullet
   here.
2. **There is no DMARC record at all.** This ticket's first acceptance bullet asks for DMARC
   `p=none` with a `rua=` on `mail.rnui.dev`, which stands — but note the apex is also unprotected
   today, and `_dmarc` is inherited by subdomains unless overridden. Publishing at the apex covers
   both; publishing only at `mail.` leaves the apex bare. Worth deciding deliberately rather than by
   accident.
3. **Something already sends as rnui.dev via Amazon SES** — `include:amazonses.com` in the apex SPF.
   Probably the contact form. It is not a conflict, but it means the apex already carries sending
   reputation, which is a second reason for map decision 8's "never send the Digest from the root
   domain", not just a theoretical one.
4. **`mail.rnui.dev` does not exist yet** — no MX, no TXT. Greenfield, as this ticket assumes.

None of this is verified beyond DNS: whether a Resend account exists, and who holds the Cloudflare
login, are unknown from here.
