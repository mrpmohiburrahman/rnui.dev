# What does the sign-in entry point look like, and what happens when Save is pressed while signed out?

Type: prototype
Status: resolved
Blocked by: 03

## Question

Two questions the maintainer can only answer by reacting to something concrete.

**The nav entry point.** A button on the right of the top nav, per the original ask. What does it
show signed-out versus signed-in? Options worth sketching: a "Sign in" button; a provider-branded
button that goes straight to Google; a modal with Google and GitHub side by side; Clerk's
account-portal-style menu with an avatar, a name and a sign-out. Note the existing right-hand
cluster already holds a Saved chip, a GitHub star control and a mode toggle
(`components/site-header.tsx`), so space is genuinely tight and there are desktop and phone
layouts to satisfy.

**The Save-while-signed-out moment.** This is the one the map's decisions make interesting.
Option 4 says an anonymous visitor *cannot* save. So what does pressing Save on a Demo card do?

- Open the sign-in modal in place, and save the Demo once they return signed in.
- Do nothing visible but flash the nav button.
- Send them to a full sign-in page and lose their place.
- Show a small inline prompt on the card.

The first is clearly best UX and costs real complexity: a pending-save intent that survives the
OAuth round trip. Whether that complexity is worth it is a maintainer's call, and it is the
single biggest UX decision in this effort.

Build a rough artifact — a throwaway route or a static story is fine — and get a reaction. Do not
build this into the real nav yet; ticket 03's vocabulary has to land first.

## Notes

Invoke `/prototype`. This is "how should it feel", which no amount of reasoning substitutes for.
## Answer — part 1: the nav control (decided)

`/prototype/sign-in?variant=W` is the winner. It is a **hybrid of two variants**, and the
asymmetry between its two states is the point rather than a compromise:

- **Signed out** — a person outline glyph and the word **"Sign in"**, inside a chip matching the
  Saved and Star chips. From variant A.
- **Signed in** — the **avatar circle alone**, showing the Reader's first letter, with no word at
  any width and no border. From variant C.

Why the two halves differ: an anonymous visitor has to be told what the control does, and a chip
carries that word for free. A signed-in Reader recognises their own initial and needs no label, so
a chip sized for a word is wasted around it. Signing in *shrinks* the control rather than growing
it — which is also the honest signal that the site now knows who they are.

The avatar's letter is `displayName.charAt(0)`. That string is provider-owned and **not stable**
(CONTEXT.md, ticket 03), so it is display-only: never a key, never matched on, never persisted.
A Google account whose name changes changes the letter, which is correct.

Rejected, and why:

- **B (branded, one click to Google)** — rejected despite being the fastest path. Ticket 01
  established that Google's consent screen will show the **Firebase project ID**, not `rnui.dev`,
  so a Google-branded button would lead a Reader into a stranger's consent screen. Putting our
  mark on that button would misrepresent what is behind it.
- **C signed-out** — a bare person glyph with no word is not recognisable as sign-in.
- **D (provider sheet)** — rejected for the nav entry point because the provider sheet is better
  spent on the Save gate (part 2), where a Reader has just been told "you cannot do this" and will
  read a provider choice as the reason why. In the nav it is a menu nobody asked for.

Note on placement: this is a **fourth** control in a right-hand cluster that already holds Saved,
Star and the mode toggle, and that cluster wraps at 768–880px today. The signed-out word is hidden
below `lg` for the same reason the Saved chip hides its own — the live prototype readout reports
overflow, and it should be checked at 768 before this ships. The signed-in state's circle is
narrow enough that it is unlikely to be the thing that wraps.

## Answer — part 2: pressing Save while signed out (decided)

**Option 1 — the provider sheet opens in place, and the Demo saves itself once the Reader is
back.** `/prototype/sign-in` gate `1`.

The alternative the Reader actually took loses the click. Option 2's nudge ("Sign in to save",
nothing saved) requires signing in, navigating back, and pressing Save a second time — and a
Reader who abandons that halfway is indistinguishable from one whose save silently failed, which
is the worst possible failure mode for a feature whose whole promise is not losing saves.
Option 3 was included as the floor to beat.

### What this commits us to

- **The pending-save intent must survive a full OAuth redirect.** One `sessionStorage` key,
  written before the redirect opens and read once on return. Not localStorage (it would outlive
  the flow and re-save days later), not a query parameter (it would leak the intent into the
  Provider's redirect URI and into browser history).
- **The key names the Recording, so at most one save is pending at a time.** If a Reader presses
  Save on three Demos before completing sign-in, the last one wins and the other two are
  forgotten. That is acceptable and should be accepted deliberately: the alternative is a queue
  with its own semantics, for a flow that takes about five seconds. Do not let a later reader
  "fix" this into a queue without re-deciding it.
- **Dismissal is not an error.** Closing the sheet, or failing sign-in, leaves the key in place
  but unconsumed. It must not resurrect the save on some later unrelated sign-in — so the key is
  cleared on read *and* carries a timestamp that is checked, or the intent is deleted when the
  flow is dismissed.
- **The save happens after sign-in, not during it.** The merge in ticket 07 reads the same
  `sessionStorage` area on return, so both write one small helper rather than each reaching for
  storage directly.

### The failure this design still has

If the Reader closes the tab mid-flow, the Demo is never saved and nothing tells them. That is a
genuine gap and it is the price of the best available option, not a solved problem. The mitigation
is the undo affordance on a successful save, which ticket 06's nav work does not currently cover —
if the maintainer wants it, it is a small addition and worth raising rather than assuming.

### Prototype

`components/prototype/sign-in-prototype.tsx` and `app/prototype/sign-in/page.tsx`. **Throwaway and
not committed** — it exists to settle this ticket, and its variants (W, A, B, C, D and the three
gates) are the primary source for the decision above. The winner is W. The skill's normal
instruction is to commit the prototype to a throwaway branch out of main; that has not been done
because no commit has been requested. Leaving it in the working tree until the maintainer decides
its fate.
