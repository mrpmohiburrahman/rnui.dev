# 08 — Reader suppression memory end-to-end

**What to build:** A Reader's subscribe-popup answer is remembered against their account. Give the D1 store a place to keep that answer, put reading it within the saved-Demos response that the header already makes on every page, write it through a dedicated authenticated route, and mark it `subscribed` whenever the subscribe action succeeds for a signed-in Reader. This closes the loop needed for cross-device suppression even though the popup itself arrives later.

**Blocked by:** None — can start immediately

**Status:** resolved

- [x] A new `reader_prefs` D1 migration creates exactly one row per Reader, keyed by the verified Firebase `sub`, with `popup_suppressed_at` and a reason constrained to `subscribed` or `dismissed`; it has no email column.
- [x] A D1 data module owns every `reader_prefs` statement, takes the Reader identifier first, round-trips through one primary-key point lookup for a read, and refuses an empty Reader identifier before reaching D1.
- [x] The reader read returns the suppression state without forcing a route to distinguish an absent row from no suppression in a way that could fail open silently; the state is represented for the route exactly as `subscribed`, `dismissed`, or absent.
- [x] The write is one atomic statement. A first `dismissed` answer writes the row, a later `subscribed` answer upgrades it, and an already-`subscribed` row is never downgraded; a second dismissal does not rewrite the timestamp.
- [x] `GET /api/saved-demos` responds with the Reader's saved Recording identifiers and `popupSuppressed` in the same verified-token request. An unknown, missing, or unverifiable token is rejected without touching D1.
- [x] A new authenticated `POST /api/reader-prefs` accepts only the suppression decision in the body and scopes every write to the verified `sub`; a body naming another account cannot write for that account, and an unsigned request touches nothing.
- [x] The popup client can obtain `popupSuppressed` from the same client pathway the header uses for saved Demos without adding a second authenticated read; the existing saved-Demos client contract and behavior remain intact.
- [x] When `subscribeEmail` succeeds and a current Firebase Reader token is available, the same action writes `subscribed`; when no Reader is signed in, the existing pending-subscription, double-opt-in, consent, and undeliverable behavior remain unchanged.
- [x] Route tests use real signed Firebase-shaped tokens verified against a stubbed JWKS and an in-memory D1 keyed by the bound Reader identifier. They prove cross-account reads and writes touch only the verified Reader's row, invalid tokens touch nothing, the read still costs the one Reader-scoped lookup, and first-dismiss → subscribe upgrades while subscribe → dismiss does not downgrade.
- [x] Data-module tests prove the read and write send bound parameters only, an empty Reader identifier fails before D1 is contacted, and a second dismissal does not rewrite `popup_suppressed_at`.

## Comments

### 2026-10-21 — Implementation and verification

- Added the `reader_prefs` migration and Reader-scoped data module. Bound parameters isolate each Reader. One atomic write preserves the first timestamp and prevents downgrades.
- Added authenticated preference writes. The saved-Demos response includes suppression through the existing shared request and cache.
- The subscription action verifies an optional Reader token and records suppression after success. Signed-out consent and double opt-in behavior remain unchanged.
- Added a shared suppression validator. Token acquisition checks Reader identity before and after refresh. The saved-Demos hook rejects stale results before publication.
- Tests cover the migration, bound SQL, signed tokens, route isolation, shared cache, subscription failures, and token refresh races.
- The full unit run passed 655 tests and failed one existing test. The isolated run reproduced that failure.
- `tests/view-signal.test.ts:95` assumes that Node has no `sessionStorage`. Node v26.6.0 supplies that global. The test and its dependencies match the review baseline.
- TypeScript and ESLint for all changed TypeScript files passed. Full ESLint reported one error and 167 warnings, all outside the changed files.
- The ESLint error is in the pre-existing untracked `.scratch/social-cards/probe/avif-datauri.tsx:35`. This work leaves that file unchanged.
- Standards review: zero remaining breaches or smells. Spec review: zero remaining findings. Both previous findings are resolved.
- Reviewers inspected the hook guards after network requests. Tests exercise the token helper and cache, not those hook guards directly.
- Peak RSS was 196 MiB for the full tests, 618 MiB for full ESLint, and 482 MiB for TypeScript.
- The swap-out counter remained at 34,896 during verification. Checks ran sequentially with one test worker and capped heaps.
- No build, browser test, deployment, live migration, or production write ran. Apply `migrations/0002_reader-prefs.sql` before deploying this code.
- Ticket 10 still owns token forwarding from the footer and `/subscribe` forms.
