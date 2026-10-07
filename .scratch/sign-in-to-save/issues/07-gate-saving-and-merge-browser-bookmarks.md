# Make saving require sign-in, and merge the bookmarks already in the browser

Type: task
Status: resolved
Blocked by: 05, 06, 08

## Question

The feature itself. An anonymous visitor can no longer save, a signed-in one's saves reach D1, and
the Demos they had already saved in this browser merge into their account on first sign-in.

Work:

- **Gate the save action.** Pressing Save while signed out follows ticket 04's decided behaviour.
  If that is the pending-save-then-resume path, the intent has to survive a full OAuth round trip
  and a page navigation, which is the fiddly part: it can live in `sessionStorage` or a query
  parameter, and the choice matters for whether it survives the redirect.
- **Write and delete through the D1 module from ticket 05**, authenticated. Both are per-visitor
  writes and neither may touch another account's saved Demos.
- **Merge on first sign-in.** Read the existing `"bookmarkedItems"` value, upload what is not
  already saved, and decide what happens to the local copy afterwards. **Keep it.** Verification
  fails closed when Google's JWKS endpoint is unreachable (ticket 02), so a merge that deletes the
  local copy on success can lose a visitor's only copy if the very next call fails. Keeping it is
  also harmless: a repeated merge is idempotent.
- **Keep the stored key spelling.** `"bookmarkedItems"` exactly. Renaming it silently discards
  every bookmark a visitor has already made, and this is the one piece of data the server has
  never seen (ADR-0008).
- **`/bookmarks` reads from D1 now.** That route currently fetches the whole catalogue and filters
  client-side (`app/bookmarks/page.tsx`), which cannot work against a server-side saved set.
  Check that its `Suspense` boundary reasoning still applies, since that comment is specifically
  about the set being browser-local and will now be wrong.
- **Preserve the analytics.** `bookmark_added` and `bookmark_removed` are existing PostHog events
  and must keep their exact names (ADR-0008). Firing them from the new path is not optional.
- **`"bookmarkedItems"` is merge input only.** Per ADR-0013 and the glossary, the key survives so
  a browser's existing list can be merged once and is never written to again. Leave the stored
  string exactly as it is — renaming it is what this ticket must not do.

Tests: the merge, the gate, the cross-account denial, and the read-count discipline from map
decision 6 — including that a page showing 280 Recordings does not issue 280 reads.

## Notes

This is where "works on my machine" is most likely. The merge especially has no visible failure
when broken; it just quietly starts someone's saved list from empty.

## Answer — resolved 2026-10-07

Anonymous visitors can no longer save, signed-in Readers save to D1, and a browser's existing
bookmarks merge on first sign-in. Every bullet of the ticket is done.

### What was built

| Thing | Where |
| --- | --- |
| Pending-save intent + gate bus | `lib/pending-save.ts` (new) |
| Authenticated saved-Demos routes | `app/api/saved-demos/route.ts` (new: GET/POST/DELETE) |
| Browser API client, one GET per page | `lib/saved-demos-client.ts` (new) |
| Save state, gate, merge, resume | `hooks/use-saved-demos.ts` (new) |
| Gate subscription, merge-retry panel | `components/sign-in-control.tsx` (gate bus + `merge-unconfirmed` retry) |
| Merge phase publishers | `hooks/use-reader.ts` (`reportMergeUnconfirmed/Confirmed`, sign-out phase reset, `linkPhase` in return) |
| Save wiring | `components/catalogue-page.tsx`, `recording-card.tsx`, `recording-card-grid.tsx`, `recording-overlay.tsx`, `recording-detail.tsx`, `app/recording/[id]/recording-body.tsx`, `components/site-header.tsx`, `components/catalogue-empty.tsx` |
| `/bookmarks` on D1 | `app/bookmarks/page.tsx` (rewritten comments + dynamic heading) |
| Tests | `tests/pending-save.test.ts`, `tests/saved-demos-route.test.ts` (16), `tests/saved-demos-client.test.ts` |

Verified: `tsc` clean, `eslint` clean except the pre-existing `require()` in
`.scratch/social-cards/probe/avif-datauri.tsx` (another effort's untracked file, noted in 08),
40 files / 626 tests green, `next build` 319 pages, served HTML carries the signed-out control
in both layouts and the `/bookmarks` fallback `h1`, unsigned `GET /api/saved-demos` 401s live,
and the rewritten e2e specs pass against the production build (remembered-set, keyboard,
recording-route S/V, nav-empty-states, posthog-events, served-html).

### The gate

Pressing Save while signed out stashes one intent in `sessionStorage`
(`rnui:pending-save`: recording id + the facts `bookmark_added` will report + timestamp) and
publishes a gate request the nav control subscribes to — the provider sheet opens in place, no
navigation. Last press wins (ticket 04's decision, kept deliberately: no queue). `consume`
clears on read so a save fires exactly once; dismissal leaves the key in place but the 30-minute
TTL bounds it, so it cannot resurrect on an unrelated sign-in. Nothing is written anywhere on a
gated press — local or otherwise — and the analytics events fire only on a confirmed write, never
on the press: an abandoned sign-in is not a save. On return the merge consumes the intent into
the same POST and fires `bookmark_added` with the stashed facts.

### Writes and reads through ticket 05's module

The routes verify with `verifyReader` and scope by the verified `sub` — never a body field —
so no request can name another Reader's list. Anything unverifiable is a 401 that touches no D1,
including the JWKS-unreachable outage (tested: cold cache + dead network refuses). POST reads
first and writes only what is not already saved: a 40-id merge costs 1 read + 1 write, and an
already-merged re-merge costs 1 read and no write (writes are the binding ceiling). POST answers
the merged list from the read it already did, so the browser converges without a second GET. The
browser loads once per Reader per page load (in-flight-deduped, module-cached): 280 Recordings,
one GET, one D1 row read.

### The merge, and what happens to the local copy

`saveDemos` union, order stable (account's order, then the browser's additions). **The local copy
is kept** — verified by the fail-closed test above: deleting on success would lose the only copy
the next time Google is unreachable. `"bookmarkedItems"` is read as merge input
(`readMergeInput`) and never written: no production module writes it (prototypes read it
read-only), and the spelling is pinned by test. Signed-out visitors still *see* their browser
list (header count, `/bookmarks`); they just cannot add to it.

### `/bookmarks` and the copy that lied

Reads from D1 while signed in (heading "Saved Demos"), from the browser while signed out
(heading "Saved on this device" — still true there, still the served fallback). The Suspense
boundary stays (useSearchParams, no server component above) but its reasoning is rewritten: the
old comment said the set was browser-local, which is now the smaller half. Three sentences that
claimed no account exists were replaced: the detail note (votes stay local, saves need sign-in
and follow the account), and the empty panel, which now invites sign-in while signed out and
names the account's empty list while signed in.

### The closed-tab question (map's open item 1)

Answered as a gap, not fixed: a tab closed mid-flow loses the pending save. `sessionStorage`
stands per ticket 04's deliberate choice — a `localStorage` intent with the same TTL would
survive the tab, but that durability is what 04 rejected, and re-deciding it here without the
maintainer would be the wrong kind of thorough. Everything *already saved* in the browser is
covered regardless: the kept local copy merges on the next sign-in from any tab.

### `merge-unconfirmed` is published now

Ticket 08 declared the phase and the copy but reached neither. A D1 merge failure while
`linkPhase` is `"linked"` publishes it (a failed merge is not a failed link — the copy stays
ticket 08's, single-sourced through `decideLinkAction`); any verified merge walks it back.
It renders only in the account panel, the one surface a signed-in Reader can reach, with a retry
that re-runs the merge. A sign-out resets the phase so a link from a previous session cannot
mislabel an ordinary merge failure. Signing out also keeps the cached credential untouched.

### One bug this ticket's own e2e caught

The first version read the merge input from `sessionStorage` — the intent's home, not the
bookmarks' — so a seeded browser list rendered as empty. `readMergeInput` defaults to
`localStorage` now (`defaultLocalStorage`, beside the intent's `defaultSessionStorage`), and the
seeded-list e2e that caught it passes.

### What is still not proven

The signed-in browser paths — confirmed-save analytics, the merge against Google's real JWKS,
and whether `OAuthCredential.fromJSON` accepts a rebuilt credential (ticket 08's open item) —
are exercised by nothing here: a node runner cannot sign in, and e2e cannot complete real
OAuth. The first real proof is a Reader signing in after deploy: press Save signed out, sign in,
see the Demo saved; sign in with a non-empty browser list, see the union. The unit halves on
both sides of that flow are pinned; the redirect between them is not.