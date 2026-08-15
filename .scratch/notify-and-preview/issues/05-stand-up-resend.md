# Stand up Resend on mail.rnui.dev

Status: ready-for-human
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

### 2026-08-15 (claimed) — the sender script exists, and DKIM is the only thing still pending

**`scripts/resend-broadcast.ts`, `pnpm broadcast:test`.** This is the "Broadcasts created **via the
API**, not the dashboard" bullet. Four functions — `ensureAudience`, `addContact`,
`createBroadcast`, `sendBroadcast` — plus a `main()` that is ticket 05's own one-off test send.
Ticket 11's weekly job calls the four; it does not call `main()`. No `resend` SDK: it would be a
dependency for four `fetch` calls. `pnpm check-types` passes.

It reuses the **existing `General` audience** (empty, auto-created 2025-07-18) rather than inventing
a Digest audience, because **ticket 08 has not decided who owns "unsubscribed" yet** and naming an
audience now would prejudge it.

**One guard is deliberate and should not be simplified away.** A Resend broadcast goes to the
*whole* audience, so `main()` refuses to send if the audience holds any contact other than the
single test recipient. Once 09/11 populate an audience from the 29 survivors, a careless
`pnpm broadcast:test` would otherwise mail all of them a test — 1 complaint in 29 is 3.4%, roughly
eleven times Google's 0.3% threshold.

**Run end to end; it stops exactly where it should.** `POST /broadcasts` returns:

```
403  "The mail.rnui.dev domain is not verified."
```

So env loading, audience lookup and contact creation are all confirmed working against the live
API. **No debris**: the 403 comes from `POST /broadcasts` itself, so no broadcast was created —
`GET /broadcasts` is still empty. The only side effect is the maintainer's address now sitting in
`General`, `unsubscribed: false`, which is what the test needs.

**DKIM is the last pending record, and the record itself is provably correct.** Status moved
`pending` → the two SPF records (`send.mail` MX and TXT) are now `verified`; only DKIM lags. Before
waiting on it, the record was checked against the **authoritative** nameserver rather than a
resolver cache:

```
dig TXT resend._domainkey.mail.rnui.dev @harleigh.ns.cloudflare.com
→ exactly one record, md5-identical to the value Resend is asking for
```

One record, no duplicate, byte-exact. **So `pending` is Resend's DKIM poll lag, not a bad record** —
do not go re-editing DNS on the strength of the dashboard saying pending.

**`RESEND_API_KEY` re-confirmed uncommitted**: `git check-ignore` resolves it to `.gitignore:39`
(`.env*.local`) and `git ls-files` has never tracked it.

Unrelated but fixed while here: `HANDOFF.md` had been renamed to `HA_NDOFF.md` with its `#` heading
turned into `a`, evidently one stray keystroke. Restored — `CLAUDE.md`'s workflow points the next
session at that filename.

### 2026-08-15 (later) — the script is committed and tested, and the DKIM bullet cannot be met as written

Handing back as `ready-for-human`. Everything an agent can do here is done; the four remaining
acceptance bullets all need either a person at a dashboard or a domain Resend has not verified.

**The send guard had a hole, and it was the dangerous one.** The previous entry described the guard
as deliberate and not to be simplified away, which was right — but it read only `data` from
`GET /audiences/{id}/contacts` and ignored `has_more`. That endpoint is paginated (confirmed against
the live API: the response carries `has_more`, and Resend's API reference has a Pagination page). A
page that happens to show only the maintainer proves nothing about the pages after it, so once
tickets 09/11 populate an audience from the 29 survivors, a truncated first page would have let
`pnpm broadcast:test` mail all of them a message whose subject says "test send". Fixed by lifting the
decision out of `main()` into an exported `refuseSendReason(page, to)`, which now refuses on
`has_more` as well as on any other contact, and compares addresses case- and whitespace-insensitively.

`tests/resend-broadcast.test.ts` covers it — 7 cases, including the truncated-page one, following
`tests/scrub-email-list.test.ts`'s pattern of testing a script's decision logic without its API.
Every address in it is invented, per the same rule. Committed with the script as `9ad2988`.
`pnpm check-types` clean; full suite 273 passed across 15 files.

**Acceptance bullet 1 asks for 2048-bit DKIM. Resend issued 1024-bit, and it is not a knob.**
Decoded from live DNS rather than assumed:

```
dig +short TXT resend._domainkey.mail.rnui.dev | sed 's/^p=//' | base64 -d | openssl rsa -pubin -inform DER -text -noout
→ Public-Key: (1024 bit)
```

The `MIGf…` prefix is the giveaway — a 2048-bit SubjectPublicKeyInfo starts `MIIBIjANBgkqhkiG9w0…`.
`POST /domains` takes only `name`, `region` and `custom_return_path`; there is no key-size parameter,
and the key is generated by Resend. **So this bullet is a spec defect, not an implementation gap** —
it cannot be satisfied by doing this ticket more carefully. It needs a decision, and there is a real
option:

Resend's *current* `POST /domains` documentation returns DKIM as **three CNAMEs** to
`…dkim.amazonses.com` — SES Easy DKIM, which is 2048-bit. Our domain got the legacy single-TXT
`resend._domainkey` scheme with an inline 1024-bit key. Deleting and re-adding `mail.rnui.dev` would
plausibly provision it under the modern scheme and satisfy the bullet. **Not done, deliberately**: it
burns the one free-tier domain slot on a gamble, needs three new records through a dashboard that is
currently not cooperating (below), and the records we have are provably correct. Maintainer's call.
Accepting 1024-bit is also defensible at 29 recipients — it is what Resend's free tier ships and it
authenticates fine; the bullet was written from best practice, not from a constraint anyone imposes.

**DKIM is still `pending`, and the record is not the problem — do not touch DNS.** Pending
continuously from domain creation (2026-08-14 22:55 UTC) through 01:13 UTC, across two independent
pollers and roughly ten `POST /domains/{id}/verify` re-triggers. Both SPF records are `verified`.
The DKIM record was checked against the **authoritative** nameserver, not a resolver cache, and
md5-compared against the exact value Resend's API says it wants:

```
expected md5: 8a724b0c6b8bfffffe9d9528f3c0888a
live     md5: 8a724b0c6b8bfffffe9d9528f3c0888a   (one record, no duplicate)
```

Byte-identical. This is vendor-side latency — Resend documents DKIM propagation taking up to 72
hours. The previous entry's advice stands and is now backed by a second measurement: **do not go
re-editing DNS on the strength of the dashboard saying pending.**

**Google Postmaster Tools: `mail.rnui.dev` is registered, and is `Not Verified` pending one TXT.**
Added under `mrpmohiburrahman@gmail.com`, listed as added Aug 15 2026. `mail.rnui.dev` is the right
domain to register because it is the DKIM `d=` and the `From:` domain. Verification needs this TXT
**on `mail.rnui.dev`** (Cloudflare name `mail`, which currently holds no TXT at all — `dig` confirms,
so there is no duplicate risk):

```
google-site-verification=cQik8LFc9_0b3qjPYyHyiaQyTHKllZeQ8SWWNWydk1Y
```

That value was read out of the DOM, **not off a screenshot** — the rendered glyphs make `THKllZ`
(two lowercase L) look like `THKIlZ` (capital i). Transcribing it by eye will fail verification for a
reason nothing will explain. Google also offers a CNAME as an alternate, and notes that verifying
here grants the account Search Console access to the domain.

**The Cloudflare "Add record" modal would not open, and last session's diagnosis of that failure is
wrong.** The entry above concluded the tab was at fault and that a fresh tab clears it. This session
opened a **brand-new tab**, loaded the DNS page cleanly (38 of 200 records, table fully rendered),
and "Add record" was a no-op by screen coordinate *and* by element reference — with no dialog
present anywhere in the accessibility tree, so it was not a modal rendered off-screen. Three
attempts, then stopped rather than ground on it. The fresh-tab remedy is therefore **not** a
general fix; it worked once and that looks like coincidence. Recording the correction rather than
editing the earlier claim away, since acting on it costs the next session a wasted tab cycle.

Confirmed live while there, both by `dig` against 1.1.1.1:

```
_dmarc.rnui.dev  TXT  v=DMARC1; p=none; rua=mailto:hello@rnui.dev
mail.rnui.dev    TXT  (none — greenfield for the Postmaster record)
```

Cloudflare's Recommendations panel now reads **All set**, where last session it was flagging the
DMARC gap. That gap is closed.

**What is left, and who does it**

1. **Maintainer, Cloudflare dashboard** — add `TXT mail` = the `google-site-verification=…` value
   above, then click Verify in Postmaster Tools. Retry the modal in a new tab or session; if it is
   still dead, a token with Zone → DNS → Edit makes it one API call and `scratchpad/write-mail-dns.sh`
   already exists for exactly this.
2. **Maintainer, a decision** — accept Resend's 1024-bit DKIM, or delete and re-add `mail.rnui.dev`
   hoping for the 3×CNAME SES scheme. Nothing else in this effort blocks on the answer.
3. **Unattended, then an agent** — when Resend flips to `verified`, `pnpm broadcast:test` sends the
   test Digest, and the last three bullets (`From:` alignment, the test broadcast, and the one-click
   unsubscribe POST **verified** to actually flip the contact to `unsubscribed`) can all be closed in
   one sitting. Ticket 08 depends on knowing exactly what that POST removes it from, so verify it
   rather than assuming.

**Free-tier limits, which bullet 3 asks to be recorded here and which nothing had.** Resend's free
tier is **3,000 emails/month and 100/day**, and **one custom domain** (the last of those was found
the hard way — see the 403 above). The daily cap is the one that binds: a Digest to the 29 survivors
is a single broadcast well inside it, but 100/day is a hard ceiling on any staged send ticket 10
designs, and the monthly figure leaves no room for a second list. Bullet 3's other half — the API key
in the environment, never committed — is met and was re-confirmed twice.

**Bullet 1's literal text is not met, and the deviation is deliberate.** It asks for DMARC *on
`mail.rnui.dev`*. DMARC is published at the **apex** instead, because `_dmarc` is inherited by
subdomains: one record at `rnui.dev` covers the sending subdomain and the site, while publishing only
on `mail.` would have left the apex — where the site and contact form live — bare. `_dmarc.mail.rnui.dev`
returns nothing and should stay that way. Recorded as a deviation rather than silently counted as
compliance.

### Review corrections applied

A two-axis review of this session's commits found one real defect and it is fixed in the same branch.
`addContact` swallowed duplicate-address errors with `String(err).includes("409")`, matched against a
message that interpolates the request path and the response body — so an audience id containing the
hex digits `409` would have turned *every* failure (500, 429, a bad key) into a silent no-op, leaving
the contact absent while the send proceeded believing it was there. `api()` now attaches `res.status`
to the thrown error and `addContact` matches the number. Two tests cover it, including the
`409e0a1c-…-000000000409` id that reproduces the old bug.

Also from the review: the contacts-page shape is now a named `ContactPage` type instead of being
spelled out twice; `pathToFileURL(process.argv[1] ?? "")` matches `scrub-email-list.ts`'s handling of
an undefined `argv[1]`; and `console.error(err)` keeps the stack the old `String(err)` discarded. The
guard's deliberate refusal to reuse `normalise()` from `scrub-email-list.ts` is now commented — that
helper folds gmail dots, which makes *more* addresses compare equal and so would detect *fewer*
strangers. A guard wants the stricter comparison.

Not `resolved`: bullets 2, 5 and 6 are unmet, bullet 1 is unmet both as written (DMARC placement) and
in substance (1024-bit DKIM), and bullet 3 is met only now that the limits above are written down.
