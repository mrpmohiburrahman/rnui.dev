# The submit endpoint

Status: resolved
Type: task
Blocked by: 01, 03, 08

## Question

The server half: a route handler that verifies the visitor, validates the metadata, and writes
the compressed Demo to R2. It follows the shape this repo already uses — a thin delegate over
`lib/`, as `app/actions/increment-view-count.ts` and `app/actions/subscribe-email.ts` establish.

**Use a route handler, not a Server Action.** A Server Action's body limit is 1 MB by default
and is configured through `experimental.serverActions.bodySizeLimit`, whereas a route handler
is bounded by Vercel's own **4.5 MB** platform wall — which is decision 3's backstop and the
thing that makes the cap real. Configure the Next limit and you move the wall; leave it and the
platform holds. Record that reasoning at the call site so nobody "tidies" this into an action.

## Provisioning — resolved 2026-09-25

The widget **exists**: sitekey `0x4AAAAAAFC4Sc7I0bVhAVA9`, mode Managed, created by the
maintainer. Its matching secret is in the maintainer's own secret store and in `.env.local`
(gitignored), and is deliberately written down nowhere else.

An agent still cannot read it back from the API: `CLOUDFLARE_API_TOKEN` returns **HTTP 403** on
`/accounts/{id}/challenges/widgets`, and `CLOUDFLARE_GLOBAL_API_TOKEN` is no longer valid — both
verified 2026-09-25. So the canonical `validate.sh` could not run its metadata half. That is the
tool's limitation under this token, not a defect in the widget.

### What is verified, and what is not

| Check | How | Result |
| --- | --- | --- |
| The secret is real, and Siteverify accepts it | a dummy token through Siteverify — the flow's own pass test | **pass**: `invalid-input-response`, and crucially *not* `invalid-input-secret` |
| `lib/turnstile.ts` reaches Siteverify with the real secret | the same dummy token, through this repo's verifier | **pass**: `{ok:false,reason:"invalid-input-response"}` |
| The decision logic, every branch | `tests/turnstile.test.ts`, 9 cases | **pass** |
| An unconfigured endpoint refuses rather than admitting | same file | **pass**: no secret, empty allowlist, empty token |
| A wrong secret is distinguishable from the right one | a fabricated secret | **pass**: refuses (`siteverify-http-400`) |
| The widget's sitekey, domains and clearance level | `validate.sh` metadata lookup | **could not run** — HTTP 403 |
| A **real** token, end to end | needs a browser to solve a challenge | **pending** |

**Pending, and not to be mistaken for done.** Cloudflare's step 8 asks for a fresh real token
validated through the protected backend, plus replay rejection. That needs a page rendering the
widget and a browser to solve the challenge, so it lands with ticket 05's form — the endpoint alone
cannot produce one. Also unverified: whether the widget's allowed hostnames include `localhost`. If
they do not, local development needs Cloudflare's dummy pair, which `.env.example` documents.

Siteverify: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`, body
`{ secret, response, remoteip? }`, JSON or form-encoded, always JSON back. Tokens are
**single-use** and expire after **300 seconds**, so a form that compresses before submitting must
render the widget **after** compression, not before — or the visitor's token is already dead when
they submit. That is why ticket 03's research recommended explicit rendering, and it is why
`components/turnstile-widget.tsx` renders only when its parent mounts it.

## Acceptance

- `app/api/submit/route.ts` exists and accepts `multipart/form-data`.
- The Turnstile token is verified server-side via `siteverify` per ticket 03's `## Answer`,
  validating **action, hostname and remoteip** — not merely that the challenge succeeded. A missing,
  invalid or already-used token is refused; reuse returns `timeout-or-duplicate`. The secret is read
  per call like `lib/resend.ts` reads `RESEND_API_KEY`, never inlined into a bundle. Use explicit
  rendering (`turnstile.render()`, `execution: "execute"`), which suits a form that compresses first
  within the 300-second token lifetime.
- **No rate limiter is built.** Ticket 03 recommended against one and the map records why — state that
  reasoning in a comment at the call site, so it is not later "added for safety" without the missing
  context. Note in the same comment that Hobby *does* offer one WAF rate-limit rule per project, so
  the option is known to exist and was declined on purpose.
- Every server-side field validation is repeated — a client is not a validator. A bare-slug
  handle, a non-`https` source and an out-of-table Category are all refused here too.
- The Demo is written to R2 per ticket 08's key scheme. **This ticket does not choose the
  prefix or the credential** — 08 owns both.
- The handler returns a typed result the form can render, in the style of `SubscribeResult`.
- The 4.5 MB wall is documented in a comment: what a visitor sees if they somehow exceed it,
  and why no code in this repo can raise it.
- A request that fails **after** the object was written does not leave an orphan, or says
  plainly in a comment that it does and that ticket 08's lifecycle rule is the cleanup.
- `pnpm check-types`, `pnpm lint`, `pnpm test` all exit 0.

## Answer — the write path, settled 2026-09-25

**The write is the same Bearer REST API `scripts/open-submission.ts` already reads with. No
SigV4, no new dependency, no new credential.** Cloudflare's *Upload objects* page does **not**
list a token-authenticated REST upload — it offers the dashboard, the Workers binding, the S3 API
and the CLI — which makes it look as though a Vercel route handler would have to sign SigV4
requests with an R2 key pair. It does not. Measured against the live bucket on 2026-09-25:

```
PUT https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/rnui-submissions/objects/<key>
Authorization: Bearer $CLOUDFLARE_R2_TOKEN
-> 200 {"success":true,"result":{"key":...,"size":"26","etag":...,"version":...,"uploaded":...}}
GET    same URL  -> 200, 26 bytes read back
DELETE same URL  -> 200, and the bucket listed empty again
```

So this ticket adds **no credential and no library**: it reuses `CLOUDFLARE_ACCOUNT_ID`,
`CLOUDFLARE_R2_TOKEN` and optional `R2_SUBMISSIONS_BUCKET`, exactly as ticket 08 concluded from
its own PUT probe. The probe object was deleted, so `rnui-submissions` was left clean.

**What the deployed route needs, and none of it is on Vercel yet.** The route reads its secrets
per call, so a missing one fails at the *request* rather than at boot — which means an
unconfigured deploy refuses visitors rather than failing loudly, and `lib/turnstile.ts` already
logs `not-configured` while telling the visitor nothing. Before this ticket is done,
`TURNSTILE_SECRET_KEY`, `TURNSTILE_HOSTNAMES`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_R2_TOKEN` must be set on the `rnui-dev` project. Setting
them needs a `VERCEL_TOKEN`, which is a maintainer action and not yet in the shell.

**Still pending, and not to be mistaken for done:** a real token solved in a browser, end to end.
That needs the deployed page plus the deployed route, so it lands after this ticket, not with it.

---

Resolved 2026-09-25. Built as four pieces:

| Piece | What it is |
| --- | --- |
| `app/api/submit/route.ts` | the handler: siteverify, re-validate, store, record consent |
| `lib/submission-storage.ts` | the key scheme, and the R2 PUT and DELETE |
| `lib/submission-consent-firestore.ts` | `writeSubmissionConsent`, added here because this module already owns everything Firebase-shaped |
| `tests/submit-route.test.ts`, `tests/submission-storage.test.ts` | 31 cases |

Plus three changes to files this ticket did not own, each because building it proved a claim
in them was false. Those are the part worth reading.

**The handler is a route handler, and the file says why.** A Server Action's body limit is 1 MB by
default; a route handler is bounded by Vercel's 4.5 MB platform wall, which is decision 3's
backstop. The comment records what a visitor sees when they exceed it — a 413 from the platform
*before this function runs*, so the form falls back to "The submission could not be sent." and no
code here can be politer — and that no rate limiter is built, with the note that Hobby *does* offer
one WAF rule per project and it was declined deliberately.

**"Every field validation is repeated" is achieved by not repeating it.** `parseSubmissionForm` in
`lib/submission-form.ts` reads the body into exactly the shape `validateSubmission` takes, so the
route calls the same function the browser called. Field names are single-sourced in
`SUBMISSION_FIELD`, typed `Record<WireField, string>`, so adding a field to `SubmissionFields` is a
compile error until it has a wire name or is explicitly excluded. That guard was checked by
injection rather than assumed: `text("consent")` in the page produces `error TS2345`, because
`TextWireField` is derived from the value types instead of listed — which matters, since TypeScript
happily accepts `{ ...state, [unionKey]: string }` and nothing else would have caught it.

**The consent record's document id is the object key.** That is how the record and the bytes find
each other without a fifth field — which the rule would have refused, see below.

### What is verified, and how

- **31 unit cases**, covering every refusal. The ordering claims are asserted rather than implied:
  a failed challenge stores nothing, the challenge is settled before anything is stored, and a
  consent record that cannot be written costs the object — PUT then DELETE, with the DELETE
  addressing the same key.
- **The route against real Siteverify with the real secret, on a built server.** A bogus token
  returns 403 and logs `invalid-input-response`; no token at all returns 403 with `missing-token`
  before spending a round trip; the response on the wire is the `{ ok: false, message }` the form
  renders; and the bucket held **0 objects** afterwards.
- **The consent record against the live database** — the one claim a mocked suite cannot reach.
  Accepted.
- Gates: `check-types`, `lint`, `test` (22 files, 368 passing), `pnpm build` with `ƒ /api/submit`.

### Three claims in other files that building this proved false

**1. The `submissions` rules had never been deployed.** The live ruleset was released **2026-08-15**,
5130 characters, and contained no `match /submissions/` at all; the file on disk was 7552. A
correct-shape write came back `PERMISSION_DENIED`, so **`/submit` would have failed at its last step
in production** — and `pnpm rules:verify`'s 39/39 could not have caught it, because
`projects/{p}:test` evaluates a ruleset you hand it, not the one that is live. The diff between
deployed and on-disk was **45 lines added, 0 removed**, every one of them ticket 10's block, so no
existing collection's access changed. `pnpm rules:deploy` was run; the live ruleset now carries all
three elements, released 2026-09-25.

**2. `validateSubmissionConsent` used `hasAll`, and its comment claimed `hasOnly`.** The comment
said a record "carrying an unexpected field, is refused rather than stored". `hasAll` checks only
that each key is *present*. Proven at the rules engine: the same record is **ALLOWED** by `hasAll` and **DENIED** by
`hasOnly`. The rule now uses `hasOnly`, and two cases pin it — "carrying an unexpected field
is refused" and "claiming confirmed:true is refused" — which is precisely the coverage that was
missing. The verifier went 39 → 41, all passing, and the tightened rules were deployed.

**A correction to this finding's own first draft, kept because the mistake is instructive.** It
first read "measured against the live database: a record carrying `confirmed: true` was accepted",
on the strength of a probe written to try exactly that. The probe was wrong:
`writeSubmissionConsent` builds a fresh object from four named fields, so the extra key was discarded
before Firestore ever saw it, and *both* of the probe's cases were really exercising the same
four-key write. All it established was that `setDoc` resolved. The claim is now backed by the rules
engine, which is where it belonged from the start — it is a claim about the rule, not about the
client. A green live probe of the wrong thing is harder to notice than a failing test.

The way that was found is the way it would have come back: the rule and its comment disagreed, the
comment was believed, and nothing covered the difference.

**3. Cloudflare's dummy Turnstile pair cannot exercise this endpoint.** `.env.example` claimed it
"works on any domain including localhost". It does not. The always-pass secret returns
`"hostname":"example.com"` and **no `action` field at all**, so `lib/turnstile.ts` refuses every
dummy-token submission as `action-mismatch` — correct, silent, and the visitor is told the browser
check failed with nothing saying why. A fork using the dummy pair gets a `/submit` that refuses
everyone. `.env.example` now records that, and says what local exercise actually needs: the real
secret, `localhost` in the hostname list **in a local file only**, and a browser.

Corrected in the same pass: `lib/submission-consent-firestore.ts` claimed its default collection was
"NOT the production name". It is — unset, a local run writes consent records into the live
`submissions`. `.env.local` now sets `submissions-dev`.

### Not verified, and not to be mistaken for done

**A real token solved in a browser has never traversed this route.** Every pass through its storage
path so far has been in a unit test with a stubbed challenge; the live runs above prove the
*refusals*, and the live database write was proved through the adapter rather than through a
request. Nothing can mint a real token without a deployed widget and a human. This closes the way
ticket 06's browser bullet closes — on the maintainer's machine.

**The route cannot run on Vercel yet.** `TURNSTILE_SECRET_KEY`, `TURNSTILE_HOSTNAMES`,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_R2_TOKEN` are not set on
the `rnui-dev` project, and setting them needs a `VERCEL_TOKEN` that is not in the shell. Until they
are, a deployed `/submit` refuses every visitor with the browser-check message.

**Consequences, applied to the map:** resolving this unblocks ticket **09** (blocked by 04 and 07),
and with 06 and 11 already takeable the frontier is **06, 09, 11**.
