# Handoff — notify-and-preview

Written 2026-08-14 at the end of a `/implement` session. Branch `feat/studio-dark`, 4 commits added
(`daf24c5`, `f6cd0fa`, `518b22e`, `0d664cc`), all documentation. **No application code was changed
this session.**

This repo is public and `.scratch/` is tracked. Nothing here names any of the 29 people. Keep it that
way — see *Landmines* below.

## Read these first, in this order

1. `map.md` — the frozen artifact. Its **Settled at charting** table (twelve decisions), **The three
   sending verdicts**, **Notes → Domain**, and **Out of scope** bind exactly as a spec's Constraints
   would.
2. `../../CONTEXT.md` — the domain is **Recording** and **Contributor**. Never entry, item,
   animation, component, video, author or user. `map.md` adds three terms: **Subscriber** (a
   *confirmed* address only), **Digest**, **Preview**.
3. `../../CLAUDE.md` — the ticket workflow, and which efforts are closed.
4. The ticket you're taking. Its `## Acceptance` is the definition of done.

**Do not redo the research.** `research/research-consent-and-deliverability.md` and
`research/research-email-service.md` are both cited throughout and are not to be re-derived.

## State at a glance

| # | Ticket | Status | Really blocked by |
|---|---|---|---|
| 01 | rename the branch | `resolved` | — |
| 02 | merge deploy A | `ready-for-human` | **the maintainer** — this is a checkpoint, not agent work |
| 03 | scrub the list | `ready-for-human` | a verifier run (see below) |
| 04 | postal + sender identity | `resolved` | — |
| 05 | stand up Resend | `ready-for-human` | a DNS write, and Resend's DKIM poll — see its Comments |
| 06 | double opt-in + disclosure | `ready-for-human` | **nothing a human does** — only Resend's DKIM poll |
| 07 | rewrite privacy policy | `ready-for-agent` | nothing |
| 08–13 | | `ready-for-agent` | genuine dependencies, see each `Blocked by:` |

`/implement` with no ticket named now takes **06** (lowest available); 07 is the smaller of the two
and equally unblocked. **05 went as far as an agent can** — the script is built, tested and
committed, but its last four bullets need a person at a Cloudflare dashboard or a domain Resend has
not verified yet. Its `## Comments` are the current truth for anything email-related; this file's
*Gotchas* below are older than they are.

## What was settled this session (ticket 04, now `resolved`)

These are final and three tickets paste them:

```
From:      rnui.dev <digest@mail.rnui.dev>
Reply-To:  hello@rnui.dev
Postal:    Halima Nagar, Cumilla 3502, Bangladesh
```

- The postal decision **reversed mid-session**. A rented PO box was chosen first on reversibility
  grounds; the maintainer then supplied their home postal locality and, shown that this shares the
  home address's one-way property, confirmed it. Ticket 04 records both answers and why. Don't
  "correct" it back.
- Spelling is **Cumilla** (official since 2018), not Comilla. Pick one and never vary it — the
  identity block must be byte-identical in the form, the policy and the footer.
- Postcode 3502 was confirmed by the maintainer.
- Both disclosure blocks are written verbatim in ticket 04, ready to paste. **They do different
  legal jobs and must not be swapped**: the signup block is a consent request (CASL ECPR s.4 binds
  it); the Digest footer is *not* and cannot become one (it carries CAN-SPAM's postal address and
  cures CASL s.6(2)). Reading the footer as a consent request is one step from the re-permission
  email `map.md` forbids outright.

## Next agent work, and what it actually needs

**05 — stand up Resend.** Takeable, but its own text says "Part of this is HITL — DNS access is the
maintainer's". An agent cannot: create the Resend account, add `mail.rnui.dev` to it, write DNS
records, supply the API key, or register Google Postmaster Tools. An agent *can* write the
broadcast-creation script (ticket 11 needs one firing from CI anyway) ahead of the key existing.
**Reconnaissance is already in 05's `## Comments`** — read it before touching DNS, it changes two of
the acceptance bullets.

**06 and 07 are fully agent-takeable now** and neither needs credentials. 07 is the smaller of the
two. If 05 stalls waiting on the maintainer, take 06 or 07 rather than idling.

## Firestore rules now live in the repo

`firestore.rules` + `firebase.json`, deployed. Before ticket 06 the deployed ruleset denied **all**
reads and updates on the signup collection, so nothing could ever have confirmed. Two things to know
before touching them:

- **This Firebase project is shared with an unrelated "car-seats" app.** Leave those match blocks
  alone; `pnpm rules:verify` asserts they are unchanged.
- **`allow get` on the signup collection is conditional on the record being pending, and that is
  load-bearing.** 29 legacy document ids are published in `research/scrub-survivors.json` in this
  public repo. An unconditional `allow get` hands anyone who reads the repo 29 real addresses.

`pnpm rules:verify` runs 30 cases against Firebase's own engine **without deploying**; `pnpm
rules:deploy` chains verify-then-deploy. Run verify before changing anything.

## Open items owned by the maintainer

1. ~~**`hello@rnui.dev` does not receive mail yet.**~~ **Done on 2026-08-15** — the Cloudflare Email
   Routing rule is Active and the address forwards to the verified Gmail. That discharges the CASL
   s.6(2)/(3) and s.11 obligation `map.md` had logged under **Not yet specified**, and it is what
   makes ticket 05's DMARC `rua=mailto:hello@rnui.dev` deliverable. Details in 05's Comments.
2. **A bulk verifier over the 29** — ticket 03's last unmet bullet. Bouncer is the pick: 100 free
   credits, "No credit card required to start" and "credits never expire", all on their own pricing
   page, so 29 costs nothing. An agent cannot sign up (no account creation), but *can* run the
   batch, apply the drops and correct the counts once an API key exists.
3. **Deploy A (ticket 02).** Gates the entire Preview half of this effort plus all six
   `posthog-expansion` tickets. `studio-dark/spec.md` checkpoint 2 makes it the maintainer's to
   authorise.

## Gotchas found this session

- **The Cloudflare token in the environment is useless here.** `CLOUDFLARE_API_TOKEN_WORKER_AI`
  verifies as active but returns an **empty zone list** — it has no permission on rnui.dev. A token
  with Zone → Email Routing Rules → Edit is needed. `wrangler` is not installed and does not manage
  routing rules regardless.
- **DNS facts** (full detail in 05's `## Comments`, which supersede this bullet): DNS is Cloudflare
  and Email Routing is enabled on the apex. Two claims here have since been overtaken — **DMARC now
  exists**, at the apex, `p=none` with `rua=mailto:hello@rnui.dev`; and the apex
  `include:amazonses.com` turned out to be **Resend itself**, not the contact form, from an account
  that had been sitting idle since 2026-05-15. `mail.rnui.dev` is no longer greenfield either: its
  three Resend records are live and its two SPF records verified.
- **Two legal citations were wrong in an earlier commit and are now fixed.** ECPR s.4 binds the
  consent request, not the message. CAN-SPAM's non-commercial carve-out belongs to the survey, not
  the Digest — the research puts the Digest inside the regime, "fine with postal address + opt-out".
  If you find either claim restated anywhere, it's stale.
- **A contested claim is flagged, not resolved,** in ticket 03: it says gmail accepts every recipient
  and bounces later. What is documented is the opposite — consumer `gmail.com` is not accept-all and
  answers `RCPT TO` definitively. Confidence only medium (best source was vendor marketing), and it
  moves no number, so it was recorded rather than rewritten. The advice not to hand-roll an SMTP
  probe stands on its other reason: probing from an unaccredited IP invites a blocklisting.
- **Ticket 07 should name the verifier as a data processor**, alongside Resend, if one is ever run
  over the 29.

## Landmines

- **Never commit the 29 addresses.** They live in `research/scrub-result.local.json`, which is
  gitignored. Everything committed is keyed by Firestore document id, which identifies nobody.
  **Ticket 06 narrowed that last claim for records created after it**: their document id *is* the
  confirmation token, so it is a capability as well as an identifier — anyone holding one can confirm
  that pending address. It still names nobody and is inert once `confirmed` is true, but do not
  commit a list of new document ids the way ticket 03's survivor ids were committed.
  `research/scrub-survivors.json` (docId + `createdAt`, no addresses) is safe and is committed.
- **Firestore has not been written to.** All 51 original rows stand, per decision 10. The scrub is a
  derived view. Keep it that way.
- **`{{SIGNUP_DATE}}` is still a live token** in the Digest footer, by design — ticket 09 fills it
  per-recipient from each survivor's `createdAt`. If it renders literally, the Digest ships a
  placeholder in the line telling someone when they consented. Worth a grep in 09's check.
- **Do not send a re-permission email.** `map.md` forbids it outright; asking "may we email you?" is
  itself marketing.
- `testdisk.log` in the repo root is untracked and unrelated to this effort. It predates the session.

## Suggested opening move for the new session

> Read `.scratch/notify-and-preview/HANDOFF.md`, then `map.md` and `CONTEXT.md`. Take ticket 07 —
> it needs no credentials and nothing blocks it.

Or `/implement` with no argument, which will take 05 — fine, provided you read 05's `## Comments`
first and expect to hand most of it back.
