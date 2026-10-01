# 08 — A `$host` filter on every surviving insight

Status: ready-for-agent
Blocked by: 04

## Problem

`studio-dark` ticket 15 owns an inventory nobody has read out of PostHog: every saved insight
and heatmap that is **autocapture-based rather than custom-event-based**, each marked retire,
rebuild, or knowingly-accept-broken. That inventory does not exist.

Two separate filters are needed and they are not the same one.

**Every insight on the project now needs `$host`,** live or Archive — because both hosts
report to 117415 and nothing else separates them. `bookmark_added` and `vote_cast` from the
Archive are byte-identical to live ones; `bookmark_added` is what the "most saved" sort reads.
posthog-js attaches `$host` automatically, so this is pure discipline, not plumbing.

**Every surviving insight also needs rebuilding** where it keys on DOM position, element
text or CSS selector — the restyle invalidated all of those at once. The thirteen custom
events are the exception and are the reason deploy A and deploy B are comparable at all.

## Work

1. Read the inventory out of PostHog. Do not guess it — a tile nobody claims is a tile that
   gets believed.
2. For each autocapture-based insight: mark **retire**, **rebuild after the restyle**, or
   **accept-broken**, with the reason.
3. Add a `$host = www.rnui.dev` filter to every insight that will survive. Record which ones
   got it, so the next person knows the filter is deliberate rather than forgotten.
4. Rebuild what was marked rebuild, against the new DOM.
5. Write the whole inventory into `.scratch/studio-dark/checkpoint-13-gate.md` under a
   "what deploy B resets" heading, with the thirteen custom events listed separately as
   surviving, and the reason they survive.

## Acceptance

- The inventory is in `checkpoint-13-gate.md`, every entry marked, none guessed.
- Every surviving insight on the project filters `$host`. Spot-check three in PostHog and
  record the check.
- The thirteen custom events are listed as surviving, with `$host` noted as the property
  that now separates the two hosts.
