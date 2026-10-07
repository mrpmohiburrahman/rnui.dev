# Enable Firebase Auth, the social providers, and the nav sign-in button

Type: task
Status: resolved
Blocked by: 01, 03, 04

## Question

Turn on the identity provider and put a working sign-in in the nav.

Console work, which the maintainer may need to do or may delegate:

- In the Firebase console, enable Google sign-in for the project. **Leave the Email/Password
  provider off** — map constraint, not a preference to revisit.
- **Rename the Firebase project's display name to `rnui.dev`, then empirically confirm what the
  Google consent screen shows** (ticket 01's finding). The shared client displays the *project ID*,
  which reads as an untrustworthy stranger asking for an email address. If the rename does not
  propagate, lead with GitHub rather than Google in the provider UI — a UI ordering change, not a
  provider change. Do not create a Google Cloud project to fix this; the branding is not worth it.
- Confirm the authorised domains list covers `www.rnui.dev`, `old.rnui.dev`, `preview.rnui.dev`
  and `localhost`. Two Designs are live and both must keep working; see `CONTEXT.md` on the
  `$host` boundary.
- Enable GitHub alongside Google. GitHub OAuth needs no verification and no Google Cloud project,
  which makes it the dependable fallback if ticket 01 finds a warning on Google's side.
- **Confirm Identity Platform is off**, and leave it off. Enabling it drops Spark to 3,000 daily
  active users (map decision 2).
- Record the Firebase web config keys, and note which Vercel environments need them. Per the
  `public-submissions` precedent, `.env` values are not in the shell — so the maintainer sets them
  and this ticket cannot close until they are set in every environment.

Code work:

- Initialise the Firebase client once, in one module, and have the nav render a signed-out and a
  signed-in state per ticket 04's prototype.
- Fit the right-hand nav cluster without breaking the existing Saved chip, star control and mode
  toggle, at both desktop and phone widths.

Do not wire saving here. That is 07.

## Notes

The environment-variables step is HITL and is the usual reason a ticket of this shape ends
`ready-for-human` rather than resolved. Name that outcome rather than claiming `resolved` early.

## Answer — resolved 2026-10-06

Both halves are done: the code is built and verified, and the console work is complete and
API-verified. The `ready-for-human` stage this ticket passed through was real but did not
outlast the session — one step (GitHub's client secret) needed a sudo re-authentication
that only the maintainer could perform, and it did.

One thing is verified that was not before: the ticket assumed the environment-variable step
was the reason a ticket of this shape stalls. It was not. All six `NEXT_PUBLIC_FIREBASE_*`
and `FIREBASE_PROJECT_ID` were already set on every Vercel environment, and the actual
blocker was console configuration that no agent had yet touched.

### What was built

| Thing | Where |
| --- | --- |
| Single Firebase init + Auth + both providers | `lib/firebase.js` (extended; still the only `initializeApp`) |
| Reader state, redirect flow, error copy | `hooks/use-reader.ts` (new) |
| Nav control, both states, provider sheet, account panel | `components/sign-in-control.tsx` (new) |
| Control mounted in both header layouts | `components/site-header.tsx` (desktop + phone clusters) |
| The six public keys, targets, and console constraints | `.env.example` (new Firebase Auth section) |
| Provider order, avatar rule, failure copy, vocabulary | `tests/sign-in-control.test.ts` (9 tests) |

Decisions, all from the tickets this one is blocked by:

- **Variant W** (ticket 04): signed out, a person glyph + "Sign in" chip matching
  Saved/Star, word hidden below `lg`; signed in, the 26px avatar circle alone.
  One component for both layouts — the breakpoint does the work, so there is no
  phone spelling to drift. Wording kept verbatim from the decided prototype,
  including "Account menu" for the widget (not the person, who is a Reader).
- **Redirect, not popup** (`signInWithRedirect` + `getRedirectResult`): ticket
  04's pending-save design and ticket 08's linking design both assume redirect
  mode, so the nav establishes it now rather than making 07 migrate a popup.
- **GitHub first** (`READER_PROVIDERS`): ticket 01's finding — Google's consent
  screen shows the project id until the rename check below passes; GitHub has
  neither problem. Reordering that one array is the whole fallback.
- **No `addScope`, no `EmailAuthProvider` reference anywhere**: requesting a
  sensitive scope would trigger the warning ticket 01 cleared us of.
- **`auth/account-exists-with-different-credential` is kept as message state**,
  pointing at the other door. Ticket 08 owns the `linkWithCredential` path;
  until it lands, a dead end with an error toast would be the regression that
  ticket exists to prevent.
- Saving is **not** wired here. `getReaderToken()` exists for ticket 07's
  routes; nothing calls it yet.

Verified: `tsc`, `eslint`, full suite 36 files / 568 tests green, `next build`
compiles, and the served HTML carries the signed-out control in both layouts
(smoke-checked against `pnpm dev`: `aria-label="Sign in to save Demos"` in the
document, provider buttons absent until opened as designed). The served copy is
the real button, not a placeholder — the header's "served HTML carries the
whole control set" rule.

Environment state already confirmed, no action needed:

- All six `NEXT_PUBLIC_FIREBASE_*` are set on Vercel on all environments, and
  `FIREBASE_PROJECT_ID` (`rnui-pixellog-d1008`) is set — so the usual
  env-variable reason this ticket shape stalls does not apply. Local `.env`
  holds the same project's web config.

### Console work: done, 2026-10-06

Project `rnui-pixellog-d1008`. Auth had never been provisioned — the Identity Toolkit
config returned `CONFIGURATION_NOT_FOUND`, so every provider was at its default and
Identity Platform was, by that alone, provably off.

**Verified against the API, not the console's own UI:**

| Step | How | Verified state |
| --- | --- | --- |
| 1. Google on, Email/Password off | console | `defaultSupportedIdpConfigs/google.com` → `enabled: true`; `signIn.email` **absent** |
| 2. GitHub on | console | `defaultSupportedIdpConfigs/github.com` → `enabled: true` |
| 3. Consent-screen branding | console | public-facing name `project-851418164301` → `rnui.dev`; support email set |
| 4. Authorised domains | API | `localhost`, `rnui.dev`, `www.rnui.dev`, `preview.rnui.dev`, `old.rnui.dev`, both Firebase defaults |
| 5. Identity Platform off | API | `subtype: FIREBASE_AUTH`, `mfa.state: DISABLED`; OIDC and SAML still Upgrade-gated |

Beyond the checklist, the API confirms **`signIn.phoneNumber` and `signIn.anonymous` are
also absent** — both off. Anonymous in particular matters: `lib/firebase-token.ts` promises
no anonymous fallback, and now no anonymous account can be minted to contradict it.

The GitHub OAuth app `rnui.dev` lives on the maintainer's account, callback
`https://rnui-pixellog-d1008.firebaseapp.com/__/auth/handler`, which Firebase's own form
independently confirmed as the expected value. Its client secret was entered directly into
Firebase and **written to no file in this repo**. Minting it needed a sudo re-auth on
GitHub, which GitHub offers no API for.

### Three corrections to what this ticket assumed

**The provider toggles are not reachable from the CLI.** The Identity Toolkit v2 admin
API can read and write `authorizedDomains` and `signIn`, but it is the *Identity Platform*
surface: `defaultSupportedIdpConfigs` rejects a Google entry with no `clientId`, and
`oauthIdpConfigs` accepts only generic `oidc.*` ids — `github.com` is refused. Both
toggles therefore had to go through the console. The upside is that the same API is what
*proves* the read-only claims above, which is better evidence than the console's UI. The
cost is that a console save and a repainted page disagree: the page still showed the
GitHub form after a successful save, so the state was confirmed by API read instead.

**Ticket 01's finding was right but understated.** The consent screen showed
`project-851418164301`, not a Firebase-shaped project id — `project-<projectNumber>`, which
reads as machine-generated. Setting the public-facing name to `rnui.dev` is the fix the
ticket prescribed, and it applied without touching a Google Cloud project. What is still
unobserved is whether `rnui.dev` is what the consent screen now *renders*; the field is
set, the rendered screen has not been seen.

**Firebase's shared Google client id is derived, not fixed.** It is
`851418164301-fb2e9073a4nl9oqm17ee7p1m0f5nenci.apps.googleusercontent.com` — the project
number as prefix. Worth recording because it explains why the API refused to create the
provider without it, and why guessing one would have been the wrong instinct.

### Redirect → popup, 2026-10-07 (re-decision, measured in the maintainer's own browser)

This ticket chose redirect. Redirect is broken for every visitor whose browser blocks
third-party storage — Chrome's default: the full OAuth round trip completes, the handler
stores `firebase:redirectEvent` in its own origin's sessionStorage, the app consumes its
`firebase:pendingRedirect` flag, and then nothing. The `signInViaRedirect` event reaches the
page only through the gapi iframe, which reads the handler's storage as a third party;
blocked, it stays silent forever, `getRedirectResult` never settles, and there is no error
to show. Both providers failed identically, which is what pointed at the shared return path
rather than any provider. Sign-in is `signInWithPopup` now: the popup tab is first-party, so
it posts its result straight back and the class of failure is gone. Ticket 04's intent and
ticket 08's credential cache keep their sessionStorage design — with no navigation both now
survive trivially instead of critically.

### Photo avatar + last-used door, 2026-10-07 (maintainer's change of heart)
The signed-in control shows the session provider's photo (`currentUser.photoURL`), falling
back to the initial-letter glyph when the provider gives none — so the glyph path stays.
Presentational only: never persisted, never matched on, `no-referrer`, same 26px/30px
circles. For a linked Reader (ticket 08) the photo is whichever door they used this
session, by explicit decision against a fixed priority. The sheet also marks the last-used
door with LAST USED (`rnui:last-provider` in localStorage, written on every popup success
and bootstrapped from single-provider accounts): a hint, never a gate — both doors stay
clickable. Photo rendering is browser-verified only up to sign-in (the click is the
maintainer's); the badge was verified rendered in-browser against a seeded value.

### Centered gate modal, fresh badge, wider sheet, 2026-10-07 (maintainer feedback)

Three follow-ups from looking at it in the browser. (1) A Save press opens a centered
modal with a scrim instead of the nav's dropdown — the press happens mid-page, so the
answer belongs mid-page; it names the Demo the press was on. One provider-choice body in
two shells. Mounted once in the root layout: the header renders the control twice and
two modals hide each other with `aria-hidden` (found by test, fixed by structure). This
also covers routes with no sign-in control, where a gated press previously stashed an
intent nobody answered. (2) The badge read once at mount and went stale across a
login+logout; both surfaces read it fresh on every render now. (3) The sheet widens
248px → 284px whenever either door can carry LAST USED, and the label holds one line.