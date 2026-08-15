# Give the signup form double opt-in and a disclosure block

Status: ready-for-human
Type: task
Blocked by: 04

## Question

Every address collected from today must carry provable consent, so this problem never recurs. Two
changes to one form.

**Double opt-in, and no captcha.** Confirmed opt-in is simultaneously the proof-of-consent record
that does not currently exist *and* the bot filter that does not currently exist. One mechanism,
both problems — which is why the captcha is deliberately not added. Google and Yahoo both
recommend it.

**The disclosure block.** Satisfying CASL's ECPR s.4 at the point of capture — name, mailing
address, contact method, purpose, and a statement that consent can be withdrawn — satisfies GDPR's
informed limb automatically. Ticket 04 supplies the verbatim text.

The build is small because the repo already has every pattern: `app/actions/subscribe-email.ts` is
the write, `app/api/counters-collection/route.ts` is the route-handler shape,
`lib/counters-firestore.ts` is the Firestore access. Roughly 60 lines across two files. Resist
making it more — see `/ponytail`.

Note the current copy says "new animation", which `CONTEXT.md` lists under _Avoid_. This is the
moment to fix it. Also note `studio-dark` decision 9 moves this form into a fourth footer column,
`NOTIFY`, on every route — coordinate rather than collide.

## Acceptance

- Submitting writes `confirmed: false` with an opaque token; the address is **not** a Subscriber
  and never enters the Resend audience until confirmed.
- A confirmation email sends on submit.
- A confirm route flips the flag and adds the contact to the Resend audience.
- Stored per record: the consent string shown, the form version, IP, and timestamp.
- Form copy carries ticket 04's disclosure block and links the privacy policy.
- "animation" replaced with the domain's own vocabulary.
- No captcha added.
- One runnable check covering the token path: an unconfirmed address never reaches the audience,
  and a token cannot be replayed.

## Comments

**2026-08-15 — built, and handed back as `ready-for-human`.** Six of the eight acceptance bullets
are met and verified. The two that are not are both blocked on configuration an agent cannot write,
and neither is blocked on a decision. Detail below, then the exact steps left.

### What was built

Double opt-in across two halves. The write half is `app/actions/subscribe-email.ts`: a submit now
stores a *pending address*, not a Subscriber — `confirmed: false`, the consent record
(`consentText`, `formVersion`, `ip`, `createdAt`), and an opaque token. The confirm half is
`app/api/confirm-subscription/route.ts` over `lib/subscription-consent.ts`, which flips the flag and
only then calls `addContact`.

Ticket 04's "put these in one module and import them" is `lib/sender-identity.ts`. It owns the
identity, both disclosure strings and `IDENTITY_BLOCK_HTML`, and the form, the confirmation email and
`scripts/resend-broadcast.ts` all import from it — the script's pasted copy of the address is gone.

`lib/resend.ts` is `resendRequest`/`ensureAudience`/`addContact` lifted out of the ticket 05 script
so the app can reach them, plus `sendEmail` for the confirmation. The script kept only what a script
does. Net effect on that file is a **deletion** of 66 lines.

### The decisive finding: Firestore rules deny every read on the signup collection

**The confirm route could not work, and this was found by running it rather than by reading it.**
`GET /api/confirm-subscription` against the live dev project logs:

```
confirm-subscription: confirming failed [FirebaseError: Missing or insufficient permissions.]
  code: 'permission-denied'
```

The collection is **create-only**: `setDoc` succeeds (the Playwright suite writes on every run, 25/25
pass, zero write failures) and every read is refused. Both a `list` and a `get` were tried; both are
denied. So the rules must change before any confirm link works — that is not avoidable by any code.

**What the code change bought is that the rule now needed is a safe one.** The first implementation
found the record with `where("token", "==", …)`, and a Firestore query is a `list` operation. There
is no rule that grants `list` only to a client that filtered on the right token, so that design
needed the collection listable — which publishes every Subscriber's address. **The token is now the
document id**, so the confirm read is a `get`, and a `get` already requires holding the 122-bit
secret that was mailed to the address. `allow list` stays `false` forever.

The rule to add (names relative to the collection in `NEXT_PUBLIC_FIRESTORE_EMAIL_COLLECTION` —
`emails-dev` and `emails`):

```
match /emails/{token} {
  // The document id IS the confirmation token: 122 bits from a CSPRNG, so a get
  // already requires holding the secret that was mailed to the address.
  allow get: if true;
  // Never. Listing this collection publishes every Subscriber's address.
  allow list: if false;
  allow create: if true;
  // Confirmation only — the flag and its timestamp, nothing else.
  allow update: if request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['confirmed', 'confirmedAt'])
                 && request.resource.data.confirmed == true;
  allow delete: if false;
}
```

`allow update` is unverified — the probe never got past the read, so whether updates are currently
permitted is unknown. Assume it needs adding.

**One consequence to record, because it cuts against something `HANDOFF.md` states.** That file says
"Everything committed is keyed by Firestore document id, which identifies nobody." For records
created from now on the id is a *capability*, not just an identifier: anyone holding it can confirm
that one pending address. It still names nobody, and it is inert once `confirmed` is true, but a
list of new document ids is no longer as harmless as ticket 03's survivor ids. Do not commit one.

### Bullet by bullet

| # | Bullet | State |
|---|---|---|
| 1 | pending write, never in the audience until confirmed | **met** — `addContact` has exactly two callers, the confirm path and ticket 05's own test send |
| 2 | confirmation email sends on submit | **implemented, cannot deliver** — see below |
| 3 | confirm route flips the flag and adds the contact | **implemented, blocked on the rules above** |
| 4 | consent string, form version, IP, timestamp stored | **met** |
| 5 | disclosure block + privacy policy link | **met** — verbatim from 04, at both capture points, `/privacypolicy` |
| 6 | "animation" replaced | **met** in the copy this ticket owns; the word survives 3× in `app/privacypolicy/page.tsx`, which **ticket 07 rewrites wholesale** |
| 7 | no captcha added | **met** — the only occurrence is a comment saying why not |
| 8 | one runnable check on the token path | **met** — `tests/subscription-consent.test.ts`, 16 tests |

Bullet 2 is blocked on the same thing ticket 05 is: `mail.rnui.dev` still reads `pending` in Resend.
Probed directly rather than assumed — `POST /emails` returns
`403 "The mail.rnui.dev domain is not verified."`, which also proves the payload is well-formed and
reaches domain validation. Nothing was delivered.

### Two guards that are deliberate

**Reserved names never get a confirmation.** `isUndeliverableByDefinition` refuses RFC 2606/6761
names (`example.com`, `.test`, `.invalid`, `localhost`). Not theoretical: the Playwright suite
submits `subscriber@example.com` on every run and `.env.local` holds a live `RESEND_API_KEY`, so
without it a test run hard-bounces a sending domain that has not sent its first Digest. The pending
record is still written; only the send is skipped.

**The confirmation link's origin is pinned, not taken from `Host`.** `Host` is whatever the client
sent, so trusting it lets a forged request make rnui.dev mail a real person a link to somebody
else's domain over rnui.dev's own authenticated sender — a phishing primitive, not just a wrong URL.
`confirmOrigin` prefers `NEXT_PUBLIC_SITE_ORIGIN` and falls back to the header only for local
development. **Each deploy must set it**, and the two deploys differ deliberately: `https://rnui.dev`
and `https://preview.rnui.dev`.

### From the two-axis review

Applied: the assembled identity block was duplicated between the confirmation email and the
broadcast script, so it became `IDENTITY_BLOCK_HTML` — the review's point being that
`sender-identity.ts` exists to stop exactly that drift, and shipping two copies of the *assembled*
block reintroduced it one level up. `api` became `resendRequest` now that it is a public export;
`Audience` stopped being exported; and the claim that a token "cannot" be replayed was softened to
what the code actually guarantees — `findPending` and `confirm` are not atomic, two racing clicks can
both pass, and the only consequence is a second `addContact` that Resend answers with a 409 the
helper already treats as a no-op.

Not applied, with the reason: the spec axis wanted the `ConsentStore` seam cut as a one-implementation
interface. Kept, because bullet 8 asks for a check that *an unconfirmed address never reaches the
audience* — that is a claim about ordering and about a call not happening, which needs the audience
write observable. It is also the split `lib/counters.ts` / `lib/counters-firestore.ts` already makes.

### Left, and who does it

1. **Maintainer, Firebase console** — publish the rule above. Until then every confirmation link
   lands on `/subscribe?confirmed=no`. This is the only thing between the code and a working flow.
2. **Maintainer, each deploy** — set `NEXT_PUBLIC_SITE_ORIGIN`.
3. **Unattended, then an agent** — when Resend flips `mail.rnui.dev` to `verified`, bullet 2 can be
   confirmed against a real delivered message. Same gate as ticket 05.
4. **Worth deciding before the first real send, not now**: the confirm link is a `GET` that mutates,
   so an inbox link-scanner (Outlook SafeLinks and similar) can confirm an address nobody clicked,
   which weakens the very consent proof this ticket exists to create. The fix is a landing page with
   a POST button. Not built — it is a second page for a risk that is real but unquantified at 29
   addresses, and it is cheaper to decide once bullet 3 is unblocked and the flow can be watched.
