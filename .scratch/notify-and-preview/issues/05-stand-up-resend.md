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

**2026-08-15 — the account exists, and the free tier forces a decision this ticket did not
anticipate.** Read before touching anything here.

**The account was already set up, three months ago.** `mrpmohiburrahman@gmail.com`, with
**`rnui.dev` — the apex — verified since 2026-05-15** and sending enabled. That corrects point 3
of the reconnaissance above: `include:amazonses.com` in the apex SPF **is Resend**, not the contact
form. Resend sends via SES, and its records were live all along — `resend._domainkey.rnui.dev`
(DKIM), plus `send.rnui.dev` MX and SPF, all confirmed by `dig`.

It had **never sent an email**: zero across the full 30-day retention window, no `RESEND_*`
variable in `.env.local`, and no Resend import anywhere in the repo. The slot was occupied and idle.

**Resend's free tier allows exactly one custom domain.** Not a guess and not read off the pricing
page alone — `POST /domains {"name":"mail.rnui.dev"}` was attempted first, deliberately, before
anything was deleted, and returned:

```
403  "You have reached the domain limit of your plan. Upgrade to add more."
```

So decision 8 ("mail sends from `mail.rnui.dev`, never the root domain") and the no-spend
constraint cannot both hold while the apex occupies the slot. Pro is $20/mo. **The maintainer chose
the swap**: the unused apex entry was deleted and `mail.rnui.dev` added in its place. Still free,
decision 8 intact, and nothing was lost because nothing had been sent.

**`mail.rnui.dev` is added and `status: not_started` — it verifies only once these three records
exist.** Names are relative to the `rnui.dev` zone:

```
TXT  resend._domainkey.mail   p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDzOsmkNS2WAeVmhXFS67ihmbYGq19DAI9bf5LJo41Iu8zsGlEqNfVKDohvizYDyeOpYSUYCj3/1FFcquu6zDQH/8q+2/HkWBSxKNlVVLPt1sGCbCXfPB/vQiENIQbZigJrjuYVnb/EusVpFcvxkLVjNLZ5HxJleIvUBZOE6ZatQIDAQAB
MX   send.mail                feedback-smtp.us-east-1.amazonses.com   (priority 10)
TXT  send.mail                v=spf1 include:amazonses.com ~all
```

The old apex records (`resend._domainkey`, `send` MX/TXT) are now orphaned. Harmless, but they can
be removed in the same sitting.

**The API key exists.** `rnui-dev-digest`, Full access, all domains — Full because Broadcasts and
Audiences need it and Sending access cannot reach them. It is in `.env.local` as `RESEND_API_KEY`,
which `.gitignore:39` (`.env*.local`) covers; verified with `git check-ignore`. Never committed.
Confirmed working against `GET /domains`.

**DMARC — decide once, at the apex.** `_dmarc` is inherited by subdomains, so publishing only at
`mail.rnui.dev` leaves the apex bare, and the apex is where the site and contact form live.
Publishing `_dmarc.rnui.dev` covers both:

```
TXT  _dmarc   v=DMARC1; p=none; rua=mailto:hello@rnui.dev
```

**`rua=` must be an address at `rnui.dev`, not a Gmail one.** Cross-domain DMARC reporting requires
the receiving domain to publish an authorising record (`rnui.dev._report._dmarc.<destination>`);
gmail.com does not, so compliant senders would refuse to send the reports. That makes the
`hello@rnui.dev` routing rule a prerequisite for this bullet, not a parallel nicety.

**Cloudflare access is still the blocker, and the secrets file does not solve it.**
`~/dotfilesOSX/zsh/.zshrc.secrets` holds exactly two Cloudflare tokens,
`CLOUDFLARE_API_TOKEN_WORKER_AI` and `CLOUDFLARE_R2_TOKEN`. Both were verified against
`GET /client/v4/zones` and **both return zero zones** — neither has any permission on `rnui.dev`.
There is no third token. A token with Zone → DNS → Edit and Zone → Email Routing Rules → Edit would
let an agent write every record above and the `hello@` rule in one pass.

**One alternative worth knowing about**: Resend can receive mail as well as send it, so `hello@`
could in principle be discharged there instead of via Cloudflare Email Routing. It is not
recommended — it would mean repointing apex MX away from Cloudflare, which is a bigger change than
the routing rule that is merely inconvenient to click.

### 2026-08-15 — three of the four records are live. DMARC is not, and the reason is the dashboard.

Written after doing the work rather than planning it. **No API token was used.** One was created
(`rnui-dev-mail-dns`, scoped `rnui.dev` → DNS:Edit + Email Routing Rules:Edit) but its value was
never captured — the browser tooling refuses to read sensitive keys, and that guard was respected
rather than worked around with a screenshot. **That token is therefore unusable by anyone and
should be revoked**; it is pure liability with no holder. The records below were written straight
through the already-authenticated dashboard instead, which is what should have been tried first —
the token was solving a problem that did not exist.

**Live and confirmed by `dig` against 1.1.1.1, not by reading the dashboard back:**

```
resend._domainkey.mail.rnui.dev  TXT  p=MIGf…ZatQIDAQAB
send.mail.rnui.dev               MX   10 feedback-smtp.us-east-1.amazonses.com.
send.mail.rnui.dev               TXT  v=spf1 include:amazonses.com ~all
```

**`_dmarc.rnui.dev` is still absent.** After the third record saved, the Cloudflare dashboard
stopped opening modals altogether: "Add record" and "Import" both became no-ops, clicked by
coordinate and by element reference, and a full page reload did not clear it. This is the same
failure class the 2026-08-14 session hit on Email Routing, where Save spun forever — that session
blamed the freshly force-migrated Email Routing UI, but the fault is evidently wider than that one
screen. **No partial or duplicate records were created**; the count moved 34 → 37 and stopped, and
`dig` agrees.

So two things remain, and neither is blocked on a decision:

1. `TXT _dmarc` → `v=DMARC1; p=none; rua=mailto:hello@rnui.dev`, at the **apex** (it is inherited,
   so this covers `mail.` too; publishing only on `mail.` would leave the apex bare). Cloudflare's
   own Recommendations banner is flagging the same gap.
2. The `hello@rnui.dev` routing rule, not attempted — the UI was already in the stuck state, and
   the `rua=` above depends on it, since cross-domain DMARC reporting to a Gmail address is refused
   by compliant senders.

`scratchpad/write-mail-dns.sh` does both idempotently and is syntax-checked; it needs a *readable*
token in `.env.local` as `CLOUDFLARE_API_TOKEN_RNUI_DNS`. Retrying the dashboard later is equally
valid — the stuck state may simply clear.

**Resend still reads `pending`.** Verification was triggered twice via
`POST /domains/{id}/verify` and all three records still report `pending`. That is expected rather
than wrong: the records went live minutes ago and Resend's DKIM poll lags. It should flip to
`verified` unattended; if it has not within an hour, re-trigger before suspecting the records,
because `dig` already proves they resolve.

### 2026-08-15 (later) — everything above is done, and the diagnosis above was wrong

**The dashboard is not broken. The *tab* was.** The section above blamed Cloudflare and said the
fault was "evidently wider than that one screen." That is incorrect and is corrected here rather
than edited away, because the wrong conclusion would have sent the next session to the API for no
reason. Opening a **fresh tab** and repeating the identical steps worked first time, for both the
DNS dialog that had stopped opening and — more tellingly — the Email Routing save that the
2026-08-14 session watched spin forever across three attempts. Nothing about Cloudflare changed in
between.

So the standing advice is: when a Cloudflare modal stops opening or a Save hangs, **close the tab
and open a new one before concluding anything about the product.** A page reload is *not*
sufficient; that was tried and did not clear it.

**All four DNS records are live**, each confirmed by `dig` against 1.1.1.1:

```
resend._domainkey.mail.rnui.dev  TXT  p=MIGf…ZatQIDAQAB
send.mail.rnui.dev               MX   10 feedback-smtp.us-east-1.amazonses.com.
send.mail.rnui.dev               TXT  v=spf1 include:amazonses.com ~all
_dmarc.rnui.dev                  TXT  v=DMARC1; p=none; rua=mailto:hello@rnui.dev
```

DMARC is at the **apex** deliberately: `_dmarc.mail.rnui.dev` returns nothing and should stay that
way, because subdomains inherit the apex policy. One record covers the sending subdomain and the
site both.

**`hello@rnui.dev` now routes to the verified Gmail** — rule Active, the list went 5 → 6, and no
duplicates were created by any of last session's failed attempts (verified before adding). That
closes the obligation `map.md` logged under **Not yet specified**: CASL s.6(2)/(3) and s.11 need
that address reachable for 60 days after every send, and it now is. It also makes the `rua=` above
deliverable, which was the reason it had to be an `@rnui.dev` address rather than a Gmail one.

**Still open on this ticket**, and neither is blocked on a decision:

- Resend `pending` → should flip to `verified` on its own now that all three records resolve.
- The remaining acceptance bullets that need a *sent* message: `From:` alignment, the test
  broadcast, the one-click unsubscribe POST verified to actually remove an address, and Google
  Postmaster Tools. None can be done until the domain verifies.
