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
