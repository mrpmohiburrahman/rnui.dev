# 09 — The visitor popup, visible and measured

**What to build:** A centered subscribe popup can appear on the two listing routes after a visitor both scrolls 350px and dwells for 5 seconds. It uses the sign-in modal shell at 400px, asks with the shipped `SIGNUP_PROMISE`, disclosure, button, and success copy, and remembers an answer in the correct place for a Reader or a signed-out visitor. When the screen is crowded, it gets out of the way instead of competing with a Recording or the sign-in modal.

**Blocked by:** 08 — Reader suppression memory end-to-end

**Status:** ready-for-human

- [x] A pure decision seam returns `show`, `stay-hidden`, or `close-and-count-as-shown` from the route, scroll depth, dwell, browser keys, Reader suppression state, and whether the sign-in modal or a Recording is open; exhaustive tests cover each route and each trigger, suppression, dismissal, and stacking input.
- [x] The popup mounts only on `/` and `/products`, including the catalogue narrowed by category or search. It does not mount on `/subscribe`, a Recording's own page, `/bookmarks`, or another route.
- [x] The popup never appears until the visitor has both scrolled at least 350px and remained on the route for at least 5 seconds; neither condition alone may fire it.
- [ ] The centered modal uses the sign-in modal's scrim, layering, radius, border, background, shadow, and focus ring at 400px, with the email field and button stacked and the disclosure readable at 11.5px. It creates no bottom-sheet variant and no new visual tokens.
- [x] The promise line is the shared `SIGNUP_PROMISE` and appears above the field; the shipped disclosure and `Subscribe` button are used, and a successful submission shows the shipped success line telling the visitor to check their inbox and that the Digest starts once they confirm.
- [x] A signed-out visitor who closes the popup writes only the new dismissal browser key, while an existing submitted-address key continues to suppress the popup and is never renamed, repurposed, or cleared. Clearing browser storage or using a new browser may show the popup again.
- [x] A Reader whose flag says `subscribed` or `dismissed` never sees the popup. If the flag is unknown, signed out, still resolving, or the read has failed, the popup may appear according to the local rules.
- [ ] If an open popup later learns that the Reader is suppressed, it closes and counts as shown. A late failure is not treated as a saved-Demos-empty account.
- [ ] If the trigger would fire while a Recording or the sign-in modal is open, the popup stays away for the rest of the visit instead of queuing behind the more important surface. If the popup is already open when either appears, it closes at once and counts as shown.
- [ ] Reduced motion fades the popup in and out without translation or scale, using the site's existing reduced-motion handling.
- [x] Submission uses the existing double-opt-in subscribe action, sends exactly one analytics event carrying the route and never the address, and sets no cookie.
- [ ] A visitor can dismiss the prompt with its close control or Escape, and keyboard focus remains visibly identifiable while the modal is open.

## Comments

### 2026-10-21 — Implementation and verification

- `lib/subscribe-popup.ts` owns the pure decision and the browser-memory, dismissal, and submission controller.
- `components/subscribe-popup.tsx` reuses the sign-in modal shell and shared copy. `components/sign-in-control.tsx` supplies the sign-in stacking signal.
- A shared predicate controls eligible routes. One constant defines the dwell threshold.
- Reader dismissals use the authenticated preference route. Successful subscriptions forward the current Reader token to the existing subscription action.
- Signed-out dismissals write only `rnui:popup-dismissed`. Crowding suppresses the popup for the current visit without a permanent write.
- Successful submissions preserve `newsletterSubscribed` and emit one route-only analytics event. This work adds no cookie.
- The disclosure comments now describe the linked contact details without a categorical legal-compliance claim. The shared strings remain unchanged.

Verification:

- The full unit run passed 690 tests, including all 35 popup tests. One test failed at `tests/view-signal.test.ts:95`.
- That test expects no `sessionStorage` global. The runtime supplies one. This work does not change that test or its module.
- The isolated test run reproduced the failure on Node v26.6.0.
- TypeScript passed with `tsc --noEmit`.
- Scoped ESLint passed with one existing image warning. The new popup files and disclosure component passed formatting.
- Full ESLint reported one error and 167 warnings. The error is an unrelated `require()` in `.scratch/social-cards/probe/avif-datauri.tsx:35`.
- The full formatting check reported 117 files. The three new popup files have no reported formatting errors.
- Standards review found one possible duplication. The shared predicate and constant remove it. The reviewer checked the fix.
- Spec review found no defects. The reviewer checked the shared definitions against the requirements.
- Checks ran sequentially. The unit runner used one worker and a 384 MiB Node heap cap.
- TypeScript and ESLint used 640 MiB Node heap caps. Peak reported RSS was 679 MiB for TypeScript.
- macOS reported 55% free memory before the checks and 50% after them. Swap use decreased from 2606.06 MiB to 2574.06 MiB.

Remaining verification, owned by the maintainer:

- Check the modal appearance, visible keyboard focus, close controls, Escape dismissal, and reduced-motion behavior in a browser.
- Check immediate closure when a Recording or sign-in modal opens. Check closure after a late Reader suppression response.
- Browser verification remains incomplete. The first preview request timed out during route compilation and memory use increased.
- The dev server and temporary BrowserSkill session stopped after the maintainer approved cleanup. No Chromium process started.
- The checks sent no real email. Apply the Reader preference migration before deployment.
- Ticket 10 still owns Reader-token wiring for the other forms.

The unchecked acceptance items require browser verification. This ticket remains `ready-for-human`, not `resolved`.
