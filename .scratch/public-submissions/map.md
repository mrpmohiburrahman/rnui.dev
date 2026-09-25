# Public Submissions

Wayfinder map. Charted 2026-09-25 with the maintainer, in one `/wayfinder` session.

## Destination

**A public submission pipeline.** Any visitor can send rnui.dev their own work — a
Contributor name, profile handles, and a Demo of no more than **5 MB** — which is
compressed, stored temporarily, and handed to the maintainer, who is **notified by email**
and publishes it by hand through the existing `add-recording` skill.

Reached when `/submit` is live on rnui.dev, a real outside person has submitted
successfully, the Demo landed in storage under a cap the system actually enforces, and the
notification reached the maintainer's inbox — with **no recurring cost of any kind**.

## Notes

**This map carries execution.** Wayfinder's default is planning only. That default is
overridden here, the same way `notify-and-preview` overrides it: the destination is a
working pipeline, not a decision, so most tickets are `task` with an `## Acceptance` block
and are `/implement`-compatible in the ordinary way this repo works.

**Domain.** `CONTEXT.md` is binding, and this effort needs a term the glossary does not yet
have. `Recording` is a *catalogue* record — published, vetted, in `data/<category>.ts`. What
arrives at `/submit` is not that: it is unvetted, unreviewed, and may never be published.
Calling it a Recording is how a ticket ends up writing an unvetted thing into the catalogue.
Ticket 01 settles the word. Until it does, prose here says "a Submission" as a placeholder,
never as settled vocabulary. Note also that `CONTEXT.md` lists *submitter* and *user* under
`Contributor`'s _Avoid_ — the person who submits is a Contributor once published, and the
naming has to survive that.

**Skills every session should consult.** `/grilling` and `/domain-modeling` for any decision
ticket; `/implement` to take one; `/research` for anything in the `research/` folder that
needs extending.

**Research already done — do not redo.** `research/r2-presigned-uploads.md` (2026-09-25)
answers the whole R2 upload question and is cited below. It is the reason this map chose the
architecture it did; read it before reopening decision 3.

**The five limits that shape every ticket.** Verified 2026-09-25 from primary sources:

| Limit | Value | Source |
| --- | --- | --- |
| Vercel Function request body | **4.5 MB**, else `413 FUNCTION_PAYLOAD_TOO_LARGE` | `vercel.com/docs/errors/FUNCTION_PAYLOAD_TOO_LARGE` |
| Next.js Server Action body | 1 MB default, raised via `experimental.serverActions.bodySizeLimit` | `nextjs.org/docs` |
| R2 free tier | 10 GB-month, 1 M Class A ops, 10 M Class B ops, **egress free** | `developers.cloudflare.com/r2/pricing` |
| Cloudflare Workers free plan CPU | **10 ms per request** | `developers.cloudflare.com/workers/platform/limits` |
| Vercel Hobby CPU | **4 CPU-hours per month**, total | `vercel.com/docs/plans/hobby` |

The last two are why **no transcoding happens on a server in this effort.** A video
transcode is seconds of CPU; the free tiers give milliseconds. The browser is the only free
place to do it, and it is also the fastest — the bytes never leave the visitor's device.

**Research that must not be lost.** The catalogue's own Demos average **25–83 KB** for clips
of 2–28 seconds (`cdn.rnui.dev`, sampled 2026-09-25). A 5 MB cap is therefore roughly 60×
more headroom than the largest Demo ever published. The cap exists to bound what a visitor
may hand us and to keep the browser's compression step small — **not** because the pipeline
needs 5 MB.

## Settled at charting

Thirteen decisions, taken with the maintainer before any ticket existed. They bind every
ticket here. Decisions 3 and 7 are the ones a reader is most likely to want to overturn;
each says what overturning it would cost.

| # | Decision |
| --- | --- |
| 1 | **The destination is a live pipeline, not a spec.** The map carries execution; tickets are `/implement`-able. |
| 2 | **A Submission is an inbox item.** It does not appear in Firestore as catalogue data, does not auto-publish, and is not visible on the site. Publication stays the manual `add-recording` path, which already owns compression, posters, Asset paths and immutability (ADR-0003). A review queue with state is a different effort. |
| 3 | **Uploaded size is capped at 5 MB, and the cap is real.** The form refuses a file over 5 MB before any work starts, and Vercel's **4.5 MB** request-body wall backs it — stricter than the rule, platform-level, and unfreeable. *Overturning this* means accepting files the free tier cannot bound, which is the mechanism by which a £0 pipeline becomes a billed one. |
| 4 | **The cap is checked on the file the visitor picks, and compression happens in the browser — after the check, before the upload.** Only the smaller file travels, so nothing is paid for compute. **Amended by ticket 02.** The promise is *a smaller file*, **never a size guarantee**: `compress-demo.sh`'s own CRF 20 **grew** two 5 MB inputs to 7.64 MB and 9.76 MB, because CRF sets quality rather than size, while UI-shaped footage came back at 66–82 KB. The single-threaded `@ffmpeg/core` (10.18 MB gzipped) is the only usable build — `core-mt` needs COOP/COEP, which would break every Demo served from `cdn.rnui.dev`. |
| 5 | **Only vendors rnui.dev already runs.** Cloudflare R2 for storage (already live on `cdn.rnui.dev`), Cloudflare Turnstile for abuse, Resend for the notification. **No new accounts** — the constraint is £0, and no free vendor beats one already installed. |
| 6 | **The notification sends from `mail.rnui.dev`** — the identity `lib/sender-identity.ts` already uses — through the existing `lib/resend.ts` `sendEmail`, unchanged. **Verified live 2026-09-25:** `GET /domains` returns `mail.rnui.dev` as `verified` with `capabilities.sending: "enabled"`, `send.mail.rnui.dev` carries `v=spf1 include:amazonses.com ~all`, and `_dmarc.rnui.dev` is published. This **supersedes an earlier draft of this decision** that sent from the apex, on the belief that `mail.rnui.dev` was `pending`; that belief came from `CLAUDE.md` and `notify-and-preview` ticket 05 and is now stale. The apex does not appear in this key's domain list, so the apex would probably not have sent at all. Sending from `mail.rnui.dev` also preserves map decision 8's subdomain separation for free. |
| 7 | **Abuse is controlled by Turnstile — validated server-side — plus the 4.5 MB wall. Deliberately no rate limiter.** **Amended by ticket 03.** Turnstile Free is $0 with no published cap, and it does stop blind POSTs and replay (single-use, `timeout-or-duplicate`) — but **not a solver**, since a solved token is unbound to the payload and carries no per-IP cadence. Vercel Hobby *does* include one WAF rate-limit rule per project (not Pro-only since 2025-05-23); it is unused because it is machinery that does not close the gap Turnstile leaves. `userFeedback` remains an open write path with visible bot junk, and that defect class stays recorded in `notify-and-preview`'s *Not yet specified*. |
| 8 | **The submitter gets an on-page confirmation only.** No receipt email — it would double the email dependency and its DKIM problem for a benefit nobody asked for. |
| 9 | **A Submission carries a consent record**, mirroring `lib/sender-identity.ts` and `app/actions/subscribe-email.ts`: the disclosure as rendered, a form version, IP and timestamp. The privacy policy gets an edit. Being inconsistent about "what somebody agreed to" is the anomaly in this repo. |
| 10 | **`/submit` is linked from the footer and the Contributors page, not the header rail.** The rail is the catalogue's facet navigation; adding an action to it changes what it means. |
| 11 | **"Temporary" means 30 days, enforced by an R2 lifecycle rule**, with deletion on publish or reject as the intent. A lifecycle rule is the only thing that works unattended. |
| 12 | **The notification carries the object key and a copy-pasteable `pnpm submissions:open <key>` command** — not a bare URL, and not an attachment. **Amended by ticket 04:** a presigned GET dies at **7 days** while the object lives 30, so a bare link would be dead by the time the maintainer acts on it. The command reuses the `CLOUDFLARE_R2_TOKEN` already held; presigning instead would need a new read-only token. |
| 13 | **The 5 MB cap is a UX guardrail, not a storage saving.** Recorded so nobody later "optimises" it downward citing bytes, when its real job is bounding the visitor's wait. |

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [Storage layout, credentials and the lifecycle rule](issues/08-storage-layout-and-credentials.md) — **`rnui-submissions` exists and is private**: no custom domain, `r2.dev` managed domain disabled, proven by 401/404 on anonymous reads against 200 authenticated. 30-day lifecycle applied, the default multipart rule carried over, **`rnui-assets` untouched**. Key scheme `<ulid>.mp4`. **No new credential** — the existing token writes to it. `pnpm submissions:open` built and tested. The ticket's "needs a human" premise was wrong: the credentials were already in the shell.
- [What is a Submission called?](issues/01-what-is-a-submission-called.md) — It is a **Submission**: sent, unreviewed, not in `data/<category>.ts`, file deleted after 30 days. The person is a **Contributor** from the moment they submit, so *submitter* stays an avoided word. Both are now in `CONTEXT.md`, and this unblocked 07 and 10.
- [Can the browser compress a Demo for free?](issues/02-browser-compression.md) — Yes, but it **cannot promise a size**. Only the single-threaded core is usable (10.18 MB gz); `core-mt` needs COOP/COEP, which would break every `cdn.rnui.dev` Demo. Decisively: `compress-demo.sh`'s own CRF 20 **grew** two 5 MB inputs to 7.64 MB and 9.76 MB — CRF sets quality, not size. UI-shaped footage returned 66–82 KB. **Decision 4 amended** to promise a smaller file, never "under 1 MB".
- [Turnstile and rate limiting on a Vercel route handler](issues/03-turnstile-and-rate-limiting.md) — Turnstile Free is $0 with no published cap, and stops blind POSTs and replay, but **not a solver**. Vercel **Hobby does include one WAF rate-limit rule** (not Pro-only since 2025-05-23), and it is deliberately unused. **Decision 7 amended** to Turnstile-plus-the-4.5 MB-wall, no rate limiter.
- [How does the maintainer open a stored Submission?](issues/04-how-the-maintainer-opens-a-submission.md) — **A `submissions/` prefix inside `rnui-assets` would be public by construction**: public access is a bucket-level setting with no per-prefix exclusion, so the object would be world-readable on `cdn.rnui.dev`. Use a **second private bucket**. Presigned GETs die at **7 days** against a 30-day object, so the email carries the key plus a `pnpm submissions:open <key>` command. No new credential.
- [The `/submit` page](issues/05-the-submit-page.md) — The form ships. Rules live in `lib/submission-form.ts` as a pure function so each message is pinned by a test (17 cases), not buried in JSX. **Two orderings are load-bearing:** the 5 MB check runs the moment a file is picked — before the Turnstile widget is even rendered — because ticket 02 measured compression in *minutes*, and the widget renders only once a file is accepted because a token dies at 300s. Verified on a production build: `/submit` 200, 19 Category options derived from `data/categories.ts`, **zero `turnstile` mentions in the served HTML**, `/` links to it nowhere (ticket 11). A submission today ends in `NOT SENT` — the endpoint is ticket 07's, and the bytes are ticket 06's.
- [The submit endpoint](issues/07-the-submit-endpoint.md) — `app/api/submit/route.ts` ships and needs **no new credential and no S3 client**: Cloudflare's *Upload objects* page never mentions a token-authenticated upload, but a Bearer `PUT .../r2/buckets/{bucket}/objects/{key}` returns 200, measured against the live bucket. Server-side validation is the *same* `validateSubmission` the browser ran, over field names single-sourced in `SUBMISSION_FIELD`. **Three claims elsewhere were false and are now fixed:** the `submissions` rules had **never been deployed** (live ruleset dated 2026-08-15, so `/submit` would have failed at its last step in production — and `rules:verify` could not catch it, because `:test` evaluates a file you hand it rather than the live one; deployed now, 45 lines added and none removed); `validateSubmissionConsent` used `hasAll` while its comment claimed a closed field list, proven at the rules engine that `hasAll` ALLOWS an extra `confirmed: true` and `hasOnly` DENIES it (now `hasOnly`; verifier 39 → 41); and Cloudflare's dummy Turnstile pair **cannot exercise this endpoint at all**, returning `hostname: example.com` and no `action`. A real token solved in a browser has still never traversed the route.
- [The consent record and the privacy policy](issues/10-the-consent-record.md) — The disclosure (`lib/submission-consent.ts`) says the three things a submitter would otherwise assume wrong: **publication is not guaranteed**, an unpublished Demo is **deleted within 30 days**, and send only your own work. The record is locked down — `submissions` denies every read, verified **39/39** against Firebase's own rules engine. Privacy policy 1.2 → 1.3. The Terms of Service carries **no submitter warranty** — recorded rather than edited. **Amended 2026-09-25:** the 39/39 measured the rules *file*, not the deployed set, which still lacked the block entirely — see ticket 07. Its `hasAll` also did not deliver the closed field list this ticket's comment claimed; now `hasOnly`, 41/41.

## Not yet specified

- **Whether the cap should rise, or fall, once real submissions arrive.** 5 MB is ~60× the
  largest Demo ever published, so it may be pure friction — or it may be the thing that stops
  someone handing us an unusable 40 MB phone export. Notably, a raw phone recording of a
  component *is* 5–40 MB, so the cap as written rejects most unedited screen recordings. That
  is decision 3 working as intended, but it is a real cost to real submitters and wants
  watching rather than assuming.
- **Whether notification volume needs its own ceiling.** The notification is what converts
  submission volume into email volume, and Resend's free tier is **100/day**. A flood — abuse, or
  a link going viral — would exhaust the daily cap and put a burst of mail on
  `mail.rnui.dev`'s reputation. Turnstile (decision 7) bounds *submissions* only — ticket 03
  confirmed it does **not** bound notifications, naming unbounded Resend sends as an explicit gap.
  Whether notifications additionally need a per-hour cap, batching, or a separate alerting
  threshold is a decision this map has not taken, and ticket 09 should not invent one.
- **Whether a minutes-long browser compression is acceptable to a real submitter.** Ticket 02
  measured the single-threaded core in **minutes, not seconds**, and the faster multi-threaded
  build is out of scope for a reason that will not change. A submitter who waits three minutes on
  a phone may simply leave. Whether that needs a link-paste escape hatch, a warning before they
  start, or a different default preset is undecided — and ticket 06 must not invent it.
- **What the submitter is told when a Submission is rejected or ignored.** Decision 8 says no
  receipt; silence is not the same as a decision, and this gets decided once there is a
  rejection to write.
- **Whether a Submission ever becomes a visible queue with state** — decision 2's rejected
  road. It needs a domain term, a Firestore collection and a review surface, so it is a fresh
  effort rather than a resumption, and only if the inbox proves to be a bottleneck.
- **How submission volume is measured.** No PostHog event is specified here. The notify effort
  has a dashboard convention; whether `/submit` needs one is unknown until it has traffic.
- **Whether `compress-demo.sh` retires.** If every Demo now arrives pre-compressed from a
  browser, the publish path may be able to trust incoming bytes. It will not be deleted on
  that theory alone — the script is deterministic and the browser is not.

## Out of scope

- **Auto-publishing, and any self-serve write into the catalogue.** Ruled out by decision 2.
  A Submission is not a Recording, and the distance between them is the maintainer's judgement.
- **Server-side or edge transcoding.** Cloudflare's free Workers get 10 ms of CPU per request;
  Vercel Hobby gives 4 CPU-hours a month. Both are orders of magnitude short of a transcode, so
  any server-side compression is a paid feature. Decision 4 is the free version of the same
  outcome.
- **A presigned direct-to-R2 upload path.** Researched in full
  (`research/r2-presigned-uploads.md`) and ruled out on two independent grounds: R2 has no
  POST-form upload, so **a maximum size cannot be enforced** on a presigned PUT — the exact
  property decision 3 requires — and presigning never works on a custom domain, so it would
  also need a second bucket-scoped credential beside the one `publish-assets.ts` uses.
- **The multi-threaded `ffmpeg.wasm` build (`core-mt`).** Ruled out by ticket 02: it requires
  `Cross-Origin-Embedder-Policy: require-corp`, and `cdn.rnui.dev` serves every Demo without a
  CORP or ACAO header — so enabling it would break the whole catalogue's media in order to speed
  up one visitor's compression step. The single-threaded core costs ~10 MB and breaks nothing.
- **Accounts, sign-in and sync.** A standing `studio-dark` non-goal, unchanged.
- **Repairing `mail.rnui.dev`'s DKIM.** Owned by `notify-and-preview` ticket 05, which records
  that the record is byte-correct and the fault is Resend-side. Touching that DNS makes things
  worse, not better.
- **The `userFeedback` bot-junk defect.** The same defect class as decision 7, but it is an
  existing surface and its fix is a separate question this effort only re-exposes.
