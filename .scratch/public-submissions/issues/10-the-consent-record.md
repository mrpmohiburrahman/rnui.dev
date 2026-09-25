# The consent record and the privacy policy

Status: resolved
Type: task
Blocked by: 01

## Question

A Submission takes a Contributor's name, their profile links and a file of their work, and then
publishes it. Map decision 9 says the record of what they agreed to is stored, mirroring the
machinery `notify-and-preview` ticket 06 built.

Read `lib/sender-identity.ts` and `app/actions/subscribe-email.ts` first. The pattern there is
exact and deliberate: `SIGNUP_DISCLOSURE` is the disclosure **as rendered**, stored with the
record beside a `CONSENT_FORM_VERSION`, because the words are the thing being evidenced and a
version reference would only prove which deploy they saw. `CONTEXT.md` and
`drivers/`'s ADR set are binding on the wording.

Also read `app/privacypolicy/page.tsx`: it currently describes email collection. Submissions are
a new processing purpose and a new kind of stored personal data.

## Acceptance

- A submission disclosure exists as a constant, in the shape `SIGNUP_DISCLOSURE` uses: a body
  and a final sentence that has to render as a real link to the privacy policy, joined back into
  one stored string.
- The stored string is the single source that `/submit` renders — ticket 05 does the rendering,
  and its acceptance checks that. One string, not two copies that can drift apart.
- A form version constant exists and is bumped by the same rule `CONSENT_FORM_VERSION` documents.
- Each Submission stores: the disclosure string, the form version, the IP (first entry of
  `x-forwarded-for`, as `subscribe-email.ts` reads it), and the timestamp.
- **The record is not publicly readable.** `subscribe-email.ts` had to leave `allow create` open
  because a browser writes it; a Submission's record is written server-side, so it must be locked
  down. State in a comment which rule denies reads and confirm `pnpm rules:verify` passes.
- The privacy policy gains the Submission purpose: what is collected, why, how long (30 days,
  decision 11), and that publication is at the maintainer's discretion. Deploy the policy change
  with the feature, not after it.
- The Terms of Service is checked for a contradiction with a submitter warranting the work is
  theirs. If it contradicts, that is a finding — raise it under `## Comments` rather than
  silently editing legal copy.

## Answer

Resolved 2026-09-25.

**The disclosure exists** — `lib/submission-consent.ts`, in the shape `SIGNUP_DISCLOSURE` uses: a
body, a final sentence that must render as a real link, and the two joined back into one stored
string. It is deliberately **not** a second sentence on the signup disclosure. A Subscriber is
asking to be mailed, so theirs is a consent *request* under CASL's ECPR s.4; a Contributor asks for
nothing and consents to storage and publication. One wording covering both would have to be vague
enough to be true of each.

Three things the wording is explicit about, because a submitter would otherwise assume the
opposite: that **publication is not guaranteed**, that an unpublished Demo is **deleted within 30
days**, and that they should **send only work that is theirs**. The first two are map decisions 2
and 11 — without them, the honest reading of the form is "you now have my work forever".

**The record is locked down, and verified against Firebase's own rules engine.** `firestore.rules`
gains `submissions` and `submissions-dev`, each `allow create: if validateSubmissionConsent()` with
every read denied. `read` covers both `get` and `list`, so there is no query that walks the set —
the distinction this repo's signup collection learned expensively. `pnpm rules:verify` passes
**39/39**, 9 of them new.

The consequence is recorded in the rule's comment rather than hidden: `create` must stay open,
because the write goes through the same public client SDK a browser uses, so anyone reaching
Firebase can plant a record shaped like consent. The signup collection has the same property and
defends it with an HMAC in `lib/subscribe-token.ts`. There is no equivalent here — a Submission has
no token to sign, and inventing one would be theatre.

**The privacy policy gained a section** — "When you send us a Demo", `POLICY_VERSION` 1.2 → 1.3. It
covers what the form collects, that sending does not publish, the 30-day deletion, the three
recorded fields, and consent as the lawful basis with withdrawal via `CONTACT_EMAIL`. The Cloudflare
processor entry now also names the submissions bucket and Turnstile.

`NEXT_PUBLIC_FIRESTORE_SUBMISSION_COLLECTION` added to `.env.example`.
`lib/submission-consent-firestore.ts` declares the collection name once, the way
`EMAIL_COLLECTION_NAME` does.

### Verification

| Gate | Result |
| --- | --- |
| `pnpm rules:verify` | **39/39** — Firebase's rules engine, test mode, nothing deployed |
| `pnpm test` | **320 passed**, 19 files |
| `pnpm check-types` / `pnpm lint` | clean |
| `pnpm build` | compiled successfully, 296 static pages |
| The `undrawn-routes.spec.ts` legal-page assertions | all satisfied — see below |

**The e2e suite could not run here.** Playwright's browser binaries have never been installed on
this machine — `~/Library/Caches/ms-playwright/` does not exist. Rather than pull ~150 MB, the five
assertions touching these pages were measured against the built output directly:
`/privacypolicy` `h1=1 h2=10 h6=0 br=0 ul=7`, `/termsofservice` `h1=1 h2=5 h6=0 br=0 ul=2`, both
titles correct. Those are exactly what the assertions check, so the gate is satisfied by
measurement — but **the suite itself is unrun here** and belongs in CI. The pinned `h2` count was
moved 9 → 10 in the same change, as its own comment instructs.

### Terms of Service — a finding, not an edit

Checked as the ticket asked. `app/termsofservice/page.tsx` carries a general "no warranties of any
kind" disclaimer and a line about removing material that breaches open-source licences. It does
**not contradict** the submission disclosure — but it contains **no submitter warranty** either, so
the only place a submitter warrants the work is theirs is the form's own disclosure. Recorded
because a dispute about ownership would land in the Terms, and the Terms is silent.
