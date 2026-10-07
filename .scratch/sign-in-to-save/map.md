# Sign in to save

## Destination

A visitor can sign in from the top nav with Google or another social provider — no email,
no password, no Google Cloud project of ours — and only a signed-in **Reader** can save a Demo.
Their saved Demos persist across devices in Cloudflare D1, the saved Demos already sitting in
their browser merge into their account on first sign-in, and the domain language and ADRs say
so rather than staying silent about a change this significant.

This effort **carries its own execution**. The maintainer asked to implement the feature, not
to receive a spec, so implementation tickets live on this map alongside the decision tickets.

## Notes

- Read `CONTEXT.md` and `docs/adr/` before touching code. The domain is **Recording**,
  **Contributor** and **Reader**, never Entry or author. `user` is on Contributor's *avoid* list.
- Skills every session should consult: `/grilling`, `/domain-modeling`.
- Read `docs/agents/issue-tracker.md` for how tickets, blocking and the frontier work here.
- Ticket 03 settled the vocabulary; it is in `CONTEXT.md` and ADR-0013, not here.

### Settled at charting

Six decisions, all made by the maintainer against researched options. They bind the tickets.

1. **Firebase Authentication is the identity provider.** Google is available without a Google
   Cloud project of ours, which Clerk and Supabase both require for production instances. Clerk
   Hobby remains usable and free (50,000 MRU, no credit card) and needs no Firebase, so this is
   revisited only if ticket 01 disqualifies Firebase.
2. **Base Firebase Auth only. Never enable Identity Platform.** Enabling it drops the Spark plan
   from unlimited users to 3,000 daily active users. Nothing this feature needs requires it.
3. **Cloudflare D1 stores saved Demos, verified by Firebase ID token against Google's public
   JWKS.** Chosen over Firestore because Spark *refuses* operations past 50,000 reads/day rather
   than throttling them, so one viral day breaks saving sitewide until midnight UTC. D1's free
   tier is roughly 100× plausible peak. The cost is hand-written token verification, treated as
   security-sensitive code with tests.
4. **Existing local bookmarks merge on first sign-in.** Nobody loses what they saved. This is the
   only option that loses nothing; the alternative splits one person's saved set in two.
5. **Voting stays anonymous and browser-local.** Out of scope. Touching it would widen into the
   paused `posthog-expansion` effort.
6. **Saving requires sign-in.** Anonymous visitors cannot save, by the maintainer's decision.

### Settled at ticket 03

Decided by grilling on 2026-10-06, recorded in `CONTEXT.md` and ADR-0013. These bind the tickets
that follow and are not reopened without a reason.

7. **The signed-in person is a `Reader`.** Not a `user`, not a `member`, not an `account`. `visitor`
   is left as the informal word for someone not signed in. A Reader is not a Contributor and one
   human may be both.
8. **`Remembered set` keeps its current meaning and now covers voting alone.** Its definition was
   already exactly right for `votedItems`, so it was not redefined to straddle two things.
9. **No new noun for the saved collection.** Prose says "saved Demos". `Library` was proposed and
   declined as glossary bloat.
10. **Both providers ship, and accounts must link across them.** With Firebase's "one account per
    email address" off by default, one human using Google on one device and GitHub on another gets
    two saved-Demos lists — which presents to them as silent data loss. **Ticket 08 closed this:**
    the setting is now on (`signIn.allowDuplicateEmails: false`, read back after first proving the
    API omits a `false`), and the credential Firebase hands back on refusal is cached and linked
    through the other door. The map's fallback — one provider only — was not needed.
11. **"Never enable Identity Platform" is now checkable, not just written down.** `subtype` on the
    config reads `FIREBASE_AUTH`, and it is `readOnly`, so no API call can change it. Ticket 06
    turned an instruction into a fact a future agent can verify in one request.
12. **The pending credential is a type, not a rule.** `pendingLinkCache().consume` takes
    `{ linked: true }`, so the failure path that discards a Reader's only route back to their
    other Demos is `TS2322` rather than a review question. Do not widen that parameter.

### Constraints

- **"One account per email address" is ON and stays on.** `signIn.allowDuplicateEmails: false`.
  It is off by default in Firebase, one toggle in the console turns it off again, and turning it
  off re-opens the split this map closed: one human, two providers, two uids, two saved-Demos
  lists, and no way for the site to know. Ticket 08.
- No email and password sign-in. Not a preference to defer — leave Firebase's email provider off.
- No Google Cloud project, no OAuth client of ours, no consent screen, no Google verification.
- Free tier only. Any move past it is a maintainer decision, not an agent's.
- **Never enable Identity Platform** (decision 2).
- The stored browser key `"bookmarkedItems"` keeps its exact spelling — renaming it silently
  discards every bookmark a visitor has already made (ADR-0008).
- A saved-demo read is **one document read per visitor**, never one per Recording. This is the
  decision that keeps D1 cheap and would be expensive to retrofit; see ticket 03.

## Decisions so far

<!-- one line per closed ticket -->

- [Does Firebase's shared Google client show an unverified-app warning?](issues/01-does-firebase-google-show-unverified-warning.md) — it does not, because the warning is triggered by *sensitive scopes* and Firebase requests only `openid`/`email`/`profile`. The real cost of the no-GCP-project constraint is that our name and logo cannot appear on Google's consent screen.
- [How is a Firebase ID token verified on the way to D1?](issues/02-verify-firebase-id-token-for-d1.md) — with `jose` against Google's public JWKS, ~30 lines, no service-account credential in our stack. Revocation is not checkable without a per-request round trip, and that limitation is accepted and recorded rather than papered over.
- [Name the signed-in visitor and saved set](issues/03-name-the-signed-in-visitor-and-saved-set.md) — the signed-in person is a **Reader**, explicitly not a Contributor. `Remembered set` keeps its meaning and now covers voting alone, so "nothing on the server can read one" stays true rather than going stale. No new noun was invented for the saved collection. Written to `CONTEXT.md` and ADR-0013.
- [Sign-in UI and pressing Save while signed out](issues/04-sign-in-ui-and-press-save-while-signed-out.md) — a **hybrid** of two prototype variants, and the asymmetry is the point: a "Sign in" chip with a person glyph when signed out, a bare avatar circle with the Reader's initial when signed in. Pressing Save while signed out opens a provider sheet **in place and saves the Demo on return**, rather than losing the click.
- [Stand up D1, its schema, and the read discipline](issues/05-stand-up-d1-schema-and-read-discipline.md) — **one row per Reader** holding a JSON array, measured: a Reader who saved all 298 Demos costs **1 row read** against 596 for the row-per-save shape. All D1 SQL lives in `lib/saved-demos.ts` with `d1Query` module-private, so the discipline is structural rather than a rule to remember. Two corrections worth carrying: **D1 on the Free plan refuses at the daily cap just as Firestore on Spark does**, so the case for D1 is headroom (100×), not behaviour; and **writes, not reads, are the binding ceiling** at 100,000/day. Deployed: the database is live and its three Vercel variables are set, with a D1-only token minted for it that cannot read R2.
- [Enable Firebase Auth, the social providers, and the nav button](issues/06-enable-firebase-auth-and-nav-sign-in.md) — Firebase Auth was **never provisioned** before this: the config returned `CONFIGURATION_NOT_FOUND`, so every provider sat at its default and Identity Platform was off by absence rather than by decision. Both social providers are now on and API-verified, Email/Password and Anonymous are absent from `signIn`, all seven authorised domains are set, and the consent screen's public-facing name moved off `project-851418164301` to `rnui.dev`. **The provider toggles are console-only** — the Identity Toolkit v2 API is the Identity Platform surface and refuses them — but the same API is what proves the read-only claims, and `subtype: FIREBASE_AUTH` turns map decision 2 from an instruction into a checkable fact.
- [Link a Reader's accounts across providers](issues/08-link-reader-accounts-across-providers.md) — **the silent-data-loss defect is closed.** "One account per email address" is on, so Firebase now refuses a second account for one human and hands back the credential it was about to use; that is cached and linked through the other door, which is the path ticket 06's copy pointed at and could not reach. Two findings from reading @firebase/auth's source rather than trusting its docs: `OAuthProvider.credential` does not exist on the modular SDK, and `pendingToken` **alone** cannot rebuild a credential — `fromJSON` only honours it inside an `idToken || accessToken` branch — so the whole serialised credential rides along, opaque to the pure module. The credential can only ever be discarded by handing `consume` a `{ linked: true }`, which is why no failure path in the code can lose a Reader's route back to their Demos.

## Not yet specified

- **Whether the pending-save intent should also survive a *closed* tab.** Ticket 04 chose
  `sessionStorage` deliberately, so it dies with the tab. Ticket 08 inherits the same choice for
  the pending credential and now for the same reason — but the Reader who closes the tab mid-join
  is a real person who will come back and find nothing. Ticket 07 is where this has to be
  answered, because it is the first ticket that can actually lose a Demo to a closed tab.
- What a signed-in Reader sees on `/bookmarks` that an anonymous visitor cannot, beyond the list
  itself.
- Whether sign-in can be triggered from anywhere besides the nav button — for instance by
  pressing Save itself while signed out. Largely answered by ticket 04's prototype.
- Whether D1 needs a scheduled cleanup for saved ids whose Recording has since left the
  catalogue.
- What happens to the merge if a Reader signs in on a second device before ever signing in on
  the first. Probably nothing, but it is unasked.
- **A periodic sweep deleting saved Demos belonging to accounts deleted from Firebase.** The
  ADR-0013 limitation is that a deleted account's token stays valid for up to an hour, so rows
  outlive their owner by that much. Accepted for now; a stored `lastSeenAt` and a scheduled job
  would close it properly, and it only matters if the feature grows toward anything sensitive.
  Ticket 05 deliberately did **not** add the column: nothing reads or writes it yet, and a nullable
  `ALTER TABLE` when the sweep is built costs one migration.

## Out of scope

- Voting, and any change to the `votedItems` Remembered set. Decision 5.
- Any change to `view_count` / `vote_count` field names or the `/products` and `?category=`
  public spellings (ADR-0008's frozen boundary).
- The Archive at `old.rnui.dev`. It is frozen and takes no further changes.
- Profiles, avatars uploaded by users, social posting, or any sharing of a saved set.
- Migrating existing anonymous bookmarks proactively. They merge on sign-in, not before.