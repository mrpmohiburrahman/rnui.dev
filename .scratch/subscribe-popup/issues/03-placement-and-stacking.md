# Where may the popup fire, and what wins a crowded screen?

Status: resolved
Type: grilling

## Question

The maintainer asked for a simpler explanation, so here it is in plain terms:

- The popup should appear on listing pages (home, Category pages). It should never cover an open Recording, and it should never fight the Save gate's sign-in modal.
- If two things want the screen at once, only one shows. The Save gate (sign-in) always wins. This popup waits or skips.

Decide the sharp leftovers with the maintainer: the exact scroll depth + time delay (e.g. ~300px and a few seconds), whether the bookmarks page is a listing for this purpose, mobile behaviour (full centered modal or a smaller sheet), and reduced-motion handling. Keep it to listing pages unless the maintainer says otherwise on the record.

## Answer

**Fire on `/` + `/products` only; 350px + 5s both-required once-per-browser; centered Save-gate modal on all widths; fade-only under reduced motion; Skip both ways on crowding.**

1. Trigger: 350px scroll depth AND 5s dwell, once per browser behind the existing `newsletterSubscribed` gate. Unblocks ticket 05 memory wiring.
2. Routes: `/` and `/products` (incl. filtered `?category=` / `?search=` views). `/bookmarks` excluded — client-fetched, usually empty on first visit. `/subscribe`, standalone `/recording/[id]`, and all other routes excluded.
3. Mobile: same centered modal shell as `GateModal` (`rounded-card border-line2 bg-header shadow-2xl`, `max-w-[calc(100vw-48px)]`). No sheet variant, no new tokens.
4. Reduced motion: honor existing `MotionConfig reducedMotion="user"` — fade-only (240 in / 160 out, overlay figures), zero translate/scale.
5. Stacking (maintainer let agent pick): Skip both ways. Trigger firing while a Recording (`z-50`) or the Save gate (`z-70/71`) is open dies for the visit — no queue, no re-arm nag. Popup open + Recording opened or gate tripped → popup closes at once and counts as shown. Save gate always wins; Recording second; popup last. This unblocks ticket 04 prototype shell.
