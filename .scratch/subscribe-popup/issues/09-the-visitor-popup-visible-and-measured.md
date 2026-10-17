# 09 — The visitor popup, visible and measured

**What to build:** A centered subscribe popup can appear on the two listing routes after a visitor both scrolls 350px and dwells for 5 seconds. It uses the sign-in modal shell at 400px, asks with the shipped `SIGNUP_PROMISE`, disclosure, button, and success copy, and remembers an answer in the correct place for a Reader or a signed-out visitor. When the screen is crowded, it gets out of the way instead of competing with a Recording or the sign-in modal.

**Blocked by:** 08 — Reader suppression memory end-to-end

**Status:** ready-for-agent

- [ ] A pure decision seam returns `show`, `stay-hidden`, or `close-and-count-as-shown` from the route, scroll depth, dwell, browser keys, Reader suppression state, and whether the sign-in modal or a Recording is open; exhaustive tests cover each route and each trigger, suppression, dismissal, and stacking input.
- [ ] The popup mounts only on `/` and `/products`, including the catalogue narrowed by category or search. It does not mount on `/subscribe`, a Recording's own page, `/bookmarks`, or another route.
- [ ] The popup never appears until the visitor has both scrolled at least 350px and remained on the route for at least 5 seconds; neither condition alone may fire it.
- [ ] The centered modal uses the sign-in modal's scrim, layering, radius, border, background, shadow, and focus ring at 400px, with the email field and button stacked and the disclosure readable at 11.5px. It creates no bottom-sheet variant and no new visual tokens.
- [ ] The promise line is the shared `SIGNUP_PROMISE` and appears above the field; the shipped disclosure and `Subscribe` button are used, and a successful submission shows the shipped success line telling the visitor to check their inbox and that the Digest starts once they confirm.
- [ ] A signed-out visitor who closes the popup writes only the new dismissal browser key, while an existing submitted-address key continues to suppress the popup and is never renamed, repurposed, or cleared. Clearing browser storage or using a new browser may show the popup again.
- [ ] A Reader whose flag says `subscribed` or `dismissed` never sees the popup. If the flag is unknown, signed out, still resolving, or the read has failed, the popup may appear according to the local rules.
- [ ] If an open popup later learns that the Reader is suppressed, it closes and counts as shown. A late failure is not treated as a saved-Demos-empty account.
- [ ] If the trigger would fire while a Recording or the sign-in modal is open, the popup stays away for the rest of the visit instead of queuing behind the more important surface. If the popup is already open when either appears, it closes at once and counts as shown.
- [ ] Reduced motion fades the popup in and out without translation or scale, using the site's existing reduced-motion handling.
- [ ] Submission uses the existing double-opt-in subscribe action, sends exactly one analytics event carrying the route and never the address, and sets no cookie.
- [ ] A visitor can dismiss the prompt with its close control or Escape, and keyboard focus remains visibly identifiable while the modal is open.
