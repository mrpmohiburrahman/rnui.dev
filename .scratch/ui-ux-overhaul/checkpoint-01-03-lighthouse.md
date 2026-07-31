# Checkpoint — Lighthouse after 01, 02 and 03

Run 2026-07-31, after `15b1d24`. The checkpoint in `spec.md` asks whether the three
performance tickets moved the numbers, or whether the diagnosis was wrong.

## How it was measured

Lighthouse 12, headless Chrome, same machine, same run, mobile preset, `/products`:

- **before** — `https://www.rnui.dev/products`, the deployed site, which is the code as it
  stood before ticket 01.
- **after** — `pnpm build && pnpm start` on `localhost:3111`.

| | before (live) | after (local build) |
|---|---|---|
| Performance | 48 | 84 |
| LCP | 7.2s | 3.4s |
| TBT | 880ms | 340ms |
| Speed Index | 7.7s | 0.9s |
| CLS | 0 | 0 |
| DOM elements | 11,328 | 2,295 |
| Total bytes | 4.34MB | 0.51MB |
| Requests | 302 | 29 |
| Image requests | 277 | 5 |

Desktop, same local build: 100, LCP 0.8s, TBT 0ms, CLS 0.

## What this does and does not prove

**Not comparable:** LCP, Speed Index and the score itself. The "after" column is served from
localhost with no network in the way; the "before" column crosses a CDN. Some of that gap is
the loopback interface, not the work.

**Comparable, because they do not depend on the network:** DOM elements 11,328 → 2,295
(ticket 02, 48 Entries rather than 277), image requests 277 → 5 (ticket 01, lazy Posters),
requests 302 → 29, bytes 4.34MB → 0.51MB.

Those four are the mechanism the three tickets were written against, and all four moved by
roughly the predicted factor. The diagnosis held. The remaining tickets build on it.

## Corrections to the baseline in `spec.md`

- **CLS is 0 on the live site**, measured by mobile Lighthouse today — not the 0.511 recorded
  in the baseline. Consistent with the correction already noted under decision 16: the card
  mount animation moves cards with a transform, and CLS excludes transform-driven movement.
  Nothing in this effort should be justified by a CLS number.
- **277 image requests on the live site, not 232.** Matches the ticket authors' count, not
  Lighthouse's recorded one.

Raw reports are not committed; re-run with the commands above to reproduce.
