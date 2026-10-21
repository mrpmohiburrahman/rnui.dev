# 10 — Subscribing from the footer remembers the Reader too

**What to build:** A Reader who subscribes from the footer or `/subscribe` receives the same cross-device popup suppression as one who subscribes from the popup. The subscribe action already writes the Reader's account answer; this ticket puts that write on every capture surface and corrects two comments that still describe the pre-October consent string as if the postal address and contact method were still inside it.

**Blocked by:** None — can start immediately

**Status:** resolved

- [x] A signed-in Reader who submits a valid subscription from the footer is recorded as `subscribed` and is not asked again by the popup on another device.
- [x] A signed-in Reader who submits a valid subscription from `/subscribe` is recorded as `subscribed` and is not asked again by the popup on another device.
- [x] A signed-out visitor who submits from either surface writes no Reader flag and keeps the existing browser-only submitted-address memory; the submitted-address key is not renamed, repurposed, or cleared.
- [x] The existing pending-record, token, consent-record, confirmation-email, undeliverable-address, and double-opt-in behavior is unchanged.
- [x] The footer and `/subscribe` descriptions and the Privacy Policy's description of the Digest continue to state that it goes out when there is something new, and the shipped disclosure and success copy remain byte-identical to the recorded consent string.
- [x] The stale comment above the signup disclosure is corrected so it no longer claims that the mailing address and contact method are inside the consent string.
- [x] The stale comment above the sender-identity module is corrected so it no longer claims that all four consent elements are present in the string.

## Comments

### 2026-10-21 — Implementation and verification

- Added `lib/subscribe-form.ts`. `submitSubscription` fetches the Reader token, then calls `subscribeEmail` with it. The footer form, `/subscribe` and the popup all call it.
- The footer form and `/subscribe` pass the real `getReaderToken` and `subscribeEmail`. A signed-in Reader is recorded as `subscribed` by the action that ticket 08 built.
- A signed-out visitor gets a `null` token. The action writes no Reader flag. Both forms still write `newsletterSubscribed` on success. The key is exported as `SUBMITTED_ADDRESS_KEY` with the same string, and a test pins the string.
- A rejected token fetch or an unreachable action returns `{ ok: false, message: "Could not submit your address. Try again." }`. The forms show the message. Before this change the forms did not touch auth, so a silent failure was a new risk; it is closed.
- The two stale comments were already corrected by commit `b0c70c2`. This change does not touch them. `lib/submission-consent.ts:12` still says "all four required" about CASL s.4 for the Contributor consent. That comment describes a legal requirement and a different string, so it is outside this ticket. It is worth a follow-up.
- No copy changed. The disclosure, the success line, the footer and `/subscribe` descriptions and the Privacy Policy are untouched.
- Review, Standards axis: one finding, the popup kept its own copy of the two lines. Fixed by routing the popup through the same call. Review, Spec axis: one finding, the unhandled token rejection. Fixed as above.
- Verification: `tests/subscribe-form.test.ts` 6 tests pass. `tests/subscribe-popup.test.ts` 35 tests pass. Full unit run: 694 passed, 1 failed. The failure is `tests/view-signal.test.ts:95`, the pre-existing Node 26 `sessionStorage` case that ticket 08 recorded. `tsc --noEmit` and ESLint on the changed files pass.
- Peak RSS: 193 MiB for one test file, 219 MiB for the full run, 565 MiB for tsc, 348 MiB for ESLint. Each check ran alone with one worker. No build, dev server, browser test or deploy ran.
