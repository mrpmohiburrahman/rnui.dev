# 08 — Reader suppression memory end-to-end

**What to build:** A Reader's subscribe-popup answer is remembered against their account. Give the D1 store a place to keep that answer, put reading it within the saved-Demos response that the header already makes on every page, write it through a dedicated authenticated route, and mark it `subscribed` whenever the subscribe action succeeds for a signed-in Reader. This closes the loop needed for cross-device suppression even though the popup itself arrives later.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] A new `reader_prefs` D1 migration creates exactly one row per Reader, keyed by the verified Firebase `sub`, with `popup_suppressed_at` and a reason constrained to `subscribed` or `dismissed`; it has no email column.
- [ ] A D1 data module owns every `reader_prefs` statement, takes the Reader identifier first, round-trips through one primary-key point lookup for a read, and refuses an empty Reader identifier before reaching D1.
- [ ] The reader read returns the suppression state without forcing a route to distinguish an absent row from no suppression in a way that could fail open silently; the state is represented for the route exactly as `subscribed`, `dismissed`, or absent.
- [ ] The write is one atomic statement. A first `dismissed` answer writes the row, a later `subscribed` answer upgrades it, and an already-`subscribed` row is never downgraded; a second dismissal does not rewrite the timestamp.
- [ ] `GET /api/saved-demos` responds with the Reader's saved Recording identifiers and `popupSuppressed` in the same verified-token request. An unknown, missing, or unverifiable token is rejected without touching D1.
- [ ] A new authenticated `POST /api/reader-prefs` accepts only the suppression decision in the body and scopes every write to the verified `sub`; a body naming another account cannot write for that account, and an unsigned request touches nothing.
- [ ] The popup client can obtain `popupSuppressed` from the same client pathway the header uses for saved Demos without adding a second authenticated read; the existing saved-Demos client contract and behavior remain intact.
- [ ] When `subscribeEmail` succeeds and a current Firebase Reader token is available, the same action writes `subscribed`; when no Reader is signed in, the existing pending-subscription, double-opt-in, consent, and undeliverable behavior remain unchanged.
- [ ] Route tests use real signed Firebase-shaped tokens verified against a stubbed JWKS and an in-memory D1 keyed by the bound Reader identifier. They prove cross-account reads and writes touch only the verified Reader's row, invalid tokens touch nothing, the read still costs the one Reader-scoped lookup, and first-dismiss → subscribe upgrades while subscribe → dismiss does not downgrade.
- [ ] Data-module tests prove the read and write send bound parameters only, an empty Reader identifier fails before D1 is contacted, and a second dismissal does not rewrite `popup_suppressed_at`.
