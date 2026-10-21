# 09 — The visitor popup, visible and measured

**What to build:** A centered subscribe popup can appear on the two listing routes after a visitor both scrolls 350px and dwells for 5 seconds. It uses the sign-in modal shell at 400px, asks with the shipped `SIGNUP_PROMISE`, disclosure, button, and success copy, and remembers an answer in the correct place for a Reader or a signed-out visitor. When the screen is crowded, it gets out of the way instead of competing with a Recording or the sign-in modal.

**Blocked by:** 08 — Reader suppression memory end-to-end

**Status:** resolved

- [x] A pure decision seam returns `show`, `stay-hidden`, or `close-and-count-as-shown` from the route, scroll depth, dwell, browser keys, Reader suppression state, and whether the sign-in modal or a Recording is open; exhaustive tests cover each route and each trigger, suppression, dismissal, and stacking input.
- [x] The popup mounts only on `/` and `/products`, including the catalogue narrowed by category or search. It does not mount on `/subscribe`, a Recording's own page, `/bookmarks`, or another route.
- [x] The popup never appears until the visitor has both scrolled at least 350px and remained on the route for at least 5 seconds; neither condition alone may fire it.
- [x] The centered modal uses the sign-in modal's scrim, layering, radius, border, background, shadow, and focus ring at 400px, with the email field and button stacked and the disclosure readable at 11.5px. It creates no bottom-sheet variant and no new visual tokens.
- [x] The promise line is the shared `SIGNUP_PROMISE` and appears above the field; the shipped disclosure and `Subscribe` button are used, and a successful submission shows the shipped success line telling the visitor to check their inbox and that the Digest starts once they confirm.
- [x] A signed-out visitor who closes the popup writes only the new dismissal browser key, while an existing submitted-address key continues to suppress the popup and is never renamed, repurposed, or cleared. Clearing browser storage or using a new browser may show the popup again.
- [x] A Reader whose flag says `subscribed` or `dismissed` never sees the popup. If the flag is unknown, signed out, still resolving, or the read has failed, the popup may appear according to the local rules.
- [x] If an open popup later learns that the Reader is suppressed, it closes and counts as shown. A late failure is not treated as a saved-Demos-empty account.
- [x] If the trigger would fire while a Recording or the sign-in modal is open, the popup stays away for the rest of the visit instead of queuing behind the more important surface. If the popup is already open when either appears, it closes at once and counts as shown.
- [x] Reduced motion fades the popup in and out without translation or scale, using the site's existing reduced-motion handling.
- [x] Submission uses the existing double-opt-in subscribe action, sends exactly one analytics event carrying the route and never the address, and sets no cookie.
- [x] A visitor can dismiss the prompt with its close control or Escape, and keyboard focus remains visibly identifiable while the modal is open.

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

### 2026-10-21 — Browser check

Checked in one webpack dev server and one browser session. No email was sent.

- The open modal is 400px, centered. Field and button are stacked. Disclosure computes to 11.5px. Scrim is z-70 with a 3px blur. The panel is z-71, `bg-header`, `border-line2`, and `shadow-2xl`. Same computed background, border, shadow, and radius as the sign-in gate. `rounded-card` computes to 0 on both, because that token is not in `tailwind.config.ts`. No bottom sheet.
- The close control had a 3px accent outline. Escape, the close control, and Not now each dismiss the popup. A signed-out dismiss writes only `rnui:popup-dismissed`.
- Dwell alone, at scroll 0 for 6 seconds, does not open it. Scroll after that dwell does.
- With the sign-in gate already open, scroll plus dwell does not open the popup, and it stays away after the gate closes. With the popup already open, opening the gate closes it at once. Neither path writes the dismissal key.
- With the popup open, a client navigation to a Recording closes it at once and does not write the key. Back on `/`, scrolling again does not reopen it.
- Reduced motion was forced with a same-origin media override, then removed. Enter and exit kept one transform, `matrix(1, 0, 0, 1, -200, -156)`, and faded opacity only. No scale and no 8px shift.

Still unchecked: a signed-in Reader whose suppression arrives after the popup is open. This session was signed out, so that path was not driven. Status stays `ready-for-human`.

### 2026-10-21 — Final browser verification

This check completes the remaining acceptance criterion. No application code changed.

- The maintainer completed sign-in in one BrowserSkill session against the local webpack server.
- BrowserSkill supplied controlled responses for `GET /api/saved-demos`. Each response had a 10-second delay. The page used its normal Reader hooks.
- A `dismissed` response closed the open popup. The header showed the returned saved Demo.
- A `subscribed` response also closed the open popup. Observation recorded opening at 5.061 seconds and closure at 10.640 seconds.
- The popup stayed closed after sign-out and another scroll. Neither suppression reason wrote `rnui:popup-dismissed` or `newsletterSubscribed`.
- A delayed HTTP 503 left the popup open. The header restored the browser's saved Demo after the failed read.
- The browser retained `bookmarkedItems`. The failure did not replace the saved Demo with an empty list.
- BrowserSkill blocked saved-Demo and preference POST requests. The saved-Demo POST rule blocked one automatic merge attempt.
- The check restored the three browser keys to their original values. It removed the response rules and closed the session.
- The webpack server stopped before the command checks. No email, migration, deployment, or live preference write occurred.

Verification scope:

- The delayed responses check browser behavior, not live storage or endpoint authentication.
- The initial unmodified local saved-Demos request returned HTTP 401. This check does not establish that deployed authentication works.
- Apply `migrations/0002_reader-prefs.sql` before deployment. Deployment remains outside this verification.

Command checks:

- The focused popup, subscription-form, and saved-Demos client tests passed: 52 tests.
- `pnpm run check-types` passed.
- `pnpm test --maxWorkers=1 --no-file-parallelism` passed 696 tests. The existing `tests/view-signal.test.ts:95` failure remained.
- That test expects no `sessionStorage` global. This Node runtime supplies one.
- `pnpm run lint` reported one existing error and 167 warnings. The error remains in the untracked `.scratch/social-cards/probe/avif-datauri.tsx:35`.
- Commands ran sequentially. Tests used one worker and a 384 MiB heap cap. TypeScript and ESLint used 640 MiB heap caps.
- macOS reported 67% available memory before startup and 47% after server cleanup. Swap use changed from 4253.94 MiB to 4345.12 MiB.

Review results:

- Standards review: zero findings.
- Spec review: zero findings. The controlled responses establish client behavior only. Live authentication, storage, and deployment remain outside this check.

All acceptance criteria are complete. Status is `resolved`.

### Production migration — 2026-10-21

- `cf d1 migrations apply c55f79bd-cd22-4a8e-9047-269024722ff7` applied `0002_reader-prefs.sql` to the live `rnui-saved-demos` database at 2026-10-21 07:55:10 UTC.
- `pnpm saved:d1:migrate` did not run. No shell secret holds `CLOUDFLARE_D1_API_TOKEN`, and D1 refused `CLOUDFLARE_API_TOKEN`. The `cf` OAuth login applied the migration.
- `d1_migrations` records `0001_saved-demos.sql` and `0002_reader-prefs.sql`. `cf d1 migrations list` reports no unapplied file.
- `reader_prefs` is `STRICT`. It has `reader_uid` as the primary key, `popup_suppressed_at`, and `popup_suppressed_reason` with the `subscribed` or `dismissed` check. It has 0 rows.
