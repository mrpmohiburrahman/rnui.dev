# How is "never show again" remembered for Readers vs visitors?

Status: resolved
Type: grilling
Blocked by: 02

## Question

The maintainer's rule is settled: a signed-in Reader who subscribes or dismisses is recorded server-side and never sees the popup again on any device; a signed-out visitor is remembered in the browser only (new device or cleared cache shows it again).

Decide the sharp remainder once the vendor verdict (ticket 02) lands: where the Reader-level flag physically lives (account store vs Firestore vs other), its exact key/shape, expiry (permanent vs timed), how it interacts with the existing `newsletterSubscribed` browser key and the footer form, and what dismissal writes vs what subscribing writes. No cross-device tracking beyond the signed-in flag — visitors stay browser-local.

Note (from 02, now resolved): a subscribed Reader is already a Resend contact via the confirmation route's `subscribeContact` — no new store needed for that half. The open store question is only the Reader who dismisses *without* subscribing, since no address exists to hang a contact on.

## Answer

**Settled 2026-10-09 with the maintainer. Readers: Cloudflare D1, `reader_prefs`, one row per Reader, permanent one-way suppression. Visitors: the existing `newsletterSubscribed` key plus one new dismissal-only key, no cookie.**

**Where the Reader flag lives.** A new D1 table `reader_prefs`, keyed by the verified Firebase `sub` exactly as `saved_demos` is — not an account store, not Firestore. Firestore was rejected because `request.auth` appears nowhere in `firestore.rules` today: an owner-scoped document would be the first auth-scoped rule in the repo, and the popup would then depend on a rules deployment being correct. Resend's audience was rejected as the store for the subscribed half even though ticket 02 established a subscribed Reader is already a contact there, because it splits the answer across two sources of truth, puts a third-party call in the popup's path, and only works when the account email is `emailVerified`.

```
migrations/000N_reader-prefs.sql
CREATE TABLE reader_prefs (
  reader_uid            TEXT PRIMARY KEY NOT NULL,
  popup_suppressed_at   TEXT NOT NULL,
  popup_suppressed_reason TEXT NOT NULL
    CHECK (popup_suppressed_reason IN ('subscribed','dismissed'))
) STRICT;
```

ISO-8601 UTC, matching `saved_demos`'s `updated_at` spelling. The table is per-Reader, not per-feature, so a second flag later is an `ALTER` rather than a second table keyed by the same Reader. **No `email` column** — the `saved_demos` migration already ruled that out and the rule holds. **No `updated_at`** — the row is written once and never rewritten, so a second timestamp would be a column that lies about being maintained; `popup_suppressed_at` is the timestamp.

**The read piggybacks the Save route; the write gets its own.** `SiteHeader` calls `useSavedDemos()` and `SiteHeader` is mounted in `app/layout.tsx:103`, so `/api/saved-demos` GET already fires on **every page, for every signed-in Reader** — including both pages the popup can appear on. Adding `popupSuppressed` to that response costs one indexed point lookup and zero new round-trips; a dedicated `GET /api/reader-prefs` would have added a second Bearer-authenticated request to a load that already happens. Writes go to a new `POST /api/reader-prefs`, authenticated by the same `verifyReader` bearer path as the rest of the Reader-scoped API.

**One row, one write path, a one-way door.** `dismissed` upgrades to `subscribed`; it never downgrades. A Reader who dismisses on their phone and subscribes from the footer a week later ends up recorded as `subscribed`, which is the answer worth having. Two nullable columns would record a distinction no query asks for; a row per action is the per-Reader-read-cost trap `migrations/0001_saved-demos.sql` warns about at length.

**Fails toward showing.** If the flag is unknown — signed out, auth still resolving, or the load failed — the popup fires as ticket 03 says it should. If a late read arrives saying suppressed, it closes and counts as shown (ticket 03's stacking rule). A Reader who dismissed on one device may therefore see it once on another; that is the accepted cost of not stranding a signup on a Cloudflare blip, and it matches the existing `hooks/use-saved-demos.ts` stance that "a failure is not an empty account."

**Permanent, both reasons.** No expiry. `popup_suppressed_at` is written for observability and nothing reads it as a TTL; changing that later is a read-path decision, not a migration.

**Subscribing writes the flag from every surface.** One call inside `subscribeEmail` (`app/actions/subscribe-email.ts`), so the footer form, `/subscribe`, and the popup all behave identically. The alternative — the popup's own submit writing and nothing else — would let a Reader who subscribed from the footer get asked again on another device, which is a contradiction they can see. For a signed-out visitor, subscribing writes no new key: `newsletterSubscribed` is already the "this browser submitted an address" record and needs no companion.

**Visitors stay browser-local, one new key.** `newsletterSubscribed` is read, never repurposed, never renamed, never cleared — its stored meaning is deliberately "submitted an address", not "is a Subscriber". The one new key, `rnui:popup-dismissed`, is written on **close only**. It follows the `hooks/use-remembered-set.ts` localStorage convention; no `useLocalStorage` helper exists. **No cookie** — this repo has zero cookies and no consent banner, so a cookie would be the only new privacy surface the whole feature introduces.

**Only a close spends the visitor's cross-visit budget; a crowding loss does not.** A visitor who closes the modal wrote "don't ask again". A visitor whose popup died to the Save gate never saw it, and losing that race must not permanently remove them from the audience — on `/` and `/products` the gate is a first-visit event for exactly the audience the popup targets. Within a page load, both die for the visit per ticket 03; the difference is only what reaches storage.

**No reset surface.** There is no "show it again" affordance and no DELETE route. A Reader's remedy is one D1 statement (`DELETE FROM reader_prefs WHERE reader_uid = ?`), so the cost of a wrong dismissal is a minute with a SQL client, not a shipped feature. Accepted trade: a Reader who dismisses by accident is never asked again on any device.

**Recorded on the record, since it was accepted on recommendation rather than chosen:** the maintainer deferred the UX-facing calls in this ticket. The two with lasting user-visible consequences are the permanent dismissal above and the once-on-another-device re-show under fail-toward-showing. Both are recorded here as accepted, not as settled by preference, so a later session can revisit them without re-litigating the storage design.
