# Make saving require sign-in, and merge the bookmarks already in the browser

Type: task
Status: open
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