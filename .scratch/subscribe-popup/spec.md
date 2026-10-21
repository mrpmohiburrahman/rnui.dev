# Subscribe popup

Status: ready-for-agent

Spec synthesised from the wayfinder map at `.scratch/subscribe-popup/map.md` and its seven resolved
decision tickets. Every decision below traces to one of those tickets; the ticket name is given so a
reader can zoom to the reasoning. Where this spec and a ticket disagree, the ticket is right and this
spec is stale.

Domain vocabulary is `CONTEXT.md`. The domain is **Recording**, **Contributor** and **Reader**
(ADR-0008) — never "entry" or "author". A confirmed address is a **Subscriber**, never a user, lead
or member; the email is the **Digest**, never a newsletter or blast. A signed-in person is a
**Reader**, and a Reader who also confirms an address is not a different thing — one person may do
either or both.

## Problem Statement

A visitor who wants the Digest has exactly one way to ask for it: they have to find the form. It sits
in the footer, and again on `/subscribe`, and both wait to be found. The site's own measurement says
that almost never happens — the event the footer form captures has never fired once in the project's
history, and the list that receives the Digest holds a single address. Every decision about cadence,
vendors and consent was made for a list that does not exist yet.

The obvious fix is a prompt that asks. The obvious fix is also how a site trains its visitors to
dismiss everything it shows them: a prompt that covers the Recording they came to watch, that fights
the sign-in modal for the same pixels, that comes back after they closed it, or that promises a weekly
email the site does not actually send, costs more trust than the address it wins. The list is only
worth building if the ask is rarer, smaller and more honest than the thing it interrupts.

## Solution

A first-visit prompt, on the two listing pages only, that asks for an address for the Digest and then
goes away for good.

It appears once a visitor has both scrolled a short way and stayed a few seconds — never on arrival,
never over an open Recording, and never while the sign-in modal is up. Closing it, subscribing, or
losing the screen to something more important all count the same: it does not come back. For a
signed-in Reader that memory is part of their account and follows them to every device; for everyone
else it lives in the browser they closed it in.

The ask reuses the consent the site already collects. Nothing about how an address is confirmed,
stored or unsubscribed changes — the verdict on rethinking that plumbing was to keep all of it. What
changes is the promise: the prompt says the Digest comes when there is something new, because that is
when it comes, and it never names a day of the week.

## User Stories

1. As a visitor on the home page, I want to be asked for my address only after I have scrolled and stayed a moment, so that the ask never greets me before I have seen anything.
2. As a visitor on the catalogue, I want the same ask, so that both listing pages can win an address.
3. As a visitor who filtered the catalogue by category, I want the ask to still be available, so that narrowing the catalogue does not hide it.
4. As a visitor who searched the catalogue, I want the ask to still be available, so that searching does not hide it.
5. As a visitor who arrived and has not scrolled, I want no prompt, so that the page I came for is what I see first.
6. As a visitor who scrolled but has only been here a moment, I want no prompt, so that a fast scroll does not spring it on me.
7. As a visitor who has stayed but not scrolled, I want no prompt, so that reading the top of the page in peace is possible.
8. As a visitor on a Recording's own page, I want no prompt, so that a page about one Recording is never interrupted by an ask about email.
9. As a visitor on the subscribe page, I want no prompt, so that a page that already is the form does not also pop one up.
10. As a visitor on the bookmarks page, I want no prompt, so that a page that is usually empty for me is not where I get asked.
11. As a visitor on the contributors page, I want no prompt, so that the ask stays on the two pages where the catalogue is browsed.
12. As a visitor on a small screen, I want the same centered prompt I would see on a large one, so that the ask does not change shape between my phone and my desk.
13. As a visitor, I want the prompt to look like the sign-in modal I already know, so that it reads as part of the site rather than as a new kind of interruption.
14. As a visitor, I want the email field wide enough to see my whole address, so that I can check what I typed.
15. As a visitor, I want the field and the button stacked, so that neither is squeezed to make room for the other.
16. As a visitor, I want the small print under the field to be readable rather than texture, so that I can actually read what I am agreeing to.
17. As a visitor, I want a heading that says what I am signing up for, so that I know the prompt is about the Digest.
18. As a visitor, I want one sentence above the field telling me the Digest comes only when there is something new and that I confirm once, so that the promise is the true one.
19. As a visitor, I want the heading to name no day and no week, so that the site never promises me a schedule it does not keep.
20. As a visitor, I want the sentence above the field to say "Recordings", so that the site uses the same word everywhere else does.
21. As a visitor, I want a button that says "Subscribe", so that the verb matches the thing I become.
22. As a visitor who just subscribed, I want to be told to check my inbox and that the Digest starts once I confirm, so that I know the one step left is mine.
23. As a visitor, I want the small print to name who sends the Digest and say I can unsubscribe any time, so that I know who is asking and that I can leave.
24. As a visitor, I want "unsubscribe" said once, in the small print, so that the prompt does not repeat itself.
25. As a visitor, I want the small print to link to the privacy policy, so that the address and the contact email are one click away from where I agree.
26. As a visitor, I want the prompt to be dismissible, so that I can make it go away without subscribing.
27. As a visitor who dismissed the prompt, I want it to never return in this browser, so that my answer is remembered.
28. As a visitor who subscribed from the prompt, I want it to never return in this browser, so that subscribing is also an answer.
29. As a visitor who already subscribed from the footer, I want no prompt, so that an address I already gave is not asked for again.
30. As a visitor who already subscribed from the subscribe page, I want no prompt, so that every surface that takes an address counts.
31. As a visitor who cleared my browser's storage, I want the prompt to be willing to ask again, so that forgetting is not permanent for someone the site cannot recognise.
32. As a visitor on a second device, I want the prompt to be willing to ask again, so that a browser the site has never seen is treated as one.
33. As a visitor who prefers reduced motion, I want the prompt to fade in and out without sliding or scaling, so that motion never makes me sick.
34. As a visitor using a keyboard, I want the prompt to trap focus and show a visible focus ring, so that I can complete or dismiss it without a pointer.
35. As a visitor, I want Escape to dismiss the prompt, so that the key I use to close every other modal closes this one.
36. As a visitor who has a Recording open, I want no prompt over it, so that the thing I asked to see stays on top.
37. As a visitor who has the sign-in modal open, I want no prompt, so that signing in always wins the screen.
38. As a visitor who opens a Recording while the prompt is up, I want the prompt to close at once, so that it gets out of the way of what I just asked for.
39. As a visitor who trips the sign-in modal while the prompt is up, I want the prompt to close at once, so that the sign-in modal never has to share the screen.
40. As a visitor whose prompt closed because something more important arrived, I want that to count as having seen it, so that it does not come back later in the visit to nag me.
41. As a visitor whose prompt was ready to appear while a Recording was open, I want it to stay away for the rest of the visit, so that it never queues up behind the thing I am watching.
42. As a visitor whose prompt was ready to appear while the sign-in modal was open, I want it to stay away for the rest of the visit, so that the sign-in modal never has to be followed by a second interruption.
43. As a Reader who dismissed the prompt, I want it gone on every device I sign in to, so that my answer follows my account.
44. As a Reader who subscribed, I want it gone on every device I sign in to, so that subscribing follows my account too.
45. As a Reader who dismissed the prompt on my phone and later subscribed from the footer, I want my account to remember that I subscribed, so that the stronger answer wins.
46. As a Reader, I want a dismissal to never be downgraded, so that subscribing is the last word.
47. As a Reader whose account cannot be checked right now, I want the prompt to be willing to ask, so that a blip never silently costs the site my address.
48. As a Reader whose account turns out to have already answered, I want the prompt to close the moment that answer arrives, so that I am not left looking at a question I already settled.
49. As a Reader, I want the prompt to learn my answer from the same request the header already makes, so that asking does not cost me a second wait.
50. As a Reader who subscribes from the footer, I want my account to record it, so that the popup on my other devices already knows.
51. As a Reader who subscribes from the subscribe page, I want my account to record it, so that every surface writes the same memory.
52. As a Reader who subscribes from the prompt, I want my account to record it, so that the prompt is not a special case.
53. As a signed-out visitor, I want my dismissal remembered only in this browser, so that the site keeps no record of me that I did not ask for.
54. As a visitor, I want no cookie set by any of this, so that the site grows no new tracking surface.
55. As a visitor, I want the address I type to be confirmed by email before I count as subscribed, so that a mistyped address never joins the list.
56. As a visitor, I want the confirmation link to work exactly once, so that a forwarded link cannot be reused.
57. As a visitor, I want the confirmation link to keep working however long I take to click it, so that a slow inbox does not expire my answer.
58. As a visitor, I want the words I agreed to stored beside my address, so that what I consented to is provable later.
59. As a visitor, I want the prompt to send my address nowhere except the service that delivers the Digest, so that the ask collects nothing beyond what the footer form already does.
60. As a visitor, I want no analytics event to carry my address, so that subscribing is not a way my address leaks into the analytics project.
61. As a visitor on the catalogue, I want the site's existing corner survey to be free to appear even while the prompt is up, so that neither ask suppresses the other.
62. As a visitor, I want a survey I was shown to suppress that survey for its usual thirty days, so that the prompt changes nothing about how the site's surveys behave.
63. As a visitor who prefers the footer, I want the footer form to describe the Digest in the same words as the prompt, so that the two never disagree about what I am signing up for.
64. As a visitor on the subscribe page, I want its description to carry the same promise, so that all three surfaces tell me the same thing.
65. As a visitor reading the privacy policy, I want its description of the Digest to say it goes out when there is something new, so that the policy matches the promise I was made.
66. As a maintainer, I want the stored consent text to carry a version, so that two cohorts of Subscribers can be compared without diffing prose.
67. As a maintainer, I want the version bumped whenever the agreed words change, so that the record says which words someone saw.
68. As a maintainer, I want a comment in the code to describe the consent string as it is, so that a later session does not "fix" it back to words that were deliberately removed.
69. As a maintainer, I want the prompt to know nothing about the site's analytics surveys, so that a change to those surveys can never break the ask.
70. As a maintainer, I want the list to stay exactly where it is, so that building the prompt does not mean migrating a single stored address to a new vendor.

## Implementation Decisions

- **The plumbing is kept whole.** The verdict on rethinking the email setup was to keep all of it: the raw-HTTPS email vendor, the consent record beside it, double opt-in, and unsubscribe owned by the vendor. The confirmation link still carries no time expiry and still dies on use. No settled decision from the earlier email effort is overturned. (Keep Resend + Firestore or rebuild the email setup?)
- **One pure function decides whether the prompt shows.** It takes the route, the scroll depth, the dwell, the two browser keys, the signed-in Reader's suppression flag, and whether the sign-in modal or a Recording is open, and it returns one of three answers: show, stay hidden, or close and count as shown. Everything about timing, routes, suppression and stacking lives behind that one function, so the component is wiring and markup and nothing else. This is the seam the tests pin.
- **The trigger is both conditions, not either.** 350px of scroll and 5 seconds of dwell, both required. A visitor who bounces, or who reads the top of the page and leaves, never sees it. (Where may the popup fire, and what wins a crowded screen?)
- **Two routes, and their filtered views.** The home page and the catalogue, including the catalogue narrowed by category or search. The subscribe page, a Recording's own page, the bookmarks page and every other route are excluded. The bookmarks page is excluded because its contents arrive after load and are usually empty for a first visit, so it is a poor place to ask.
- **The sign-in modal wins, then the Recording, then the prompt.** The prompt never queues. If its trigger arrives while a Recording or the sign-in modal is open, it dies for the rest of the visit rather than waiting. If it is already open when either appears, it closes at once and that counts as shown. Nothing re-arms it.
- **The shell is the sign-in modal's, except the width.** Same scrim, same panel layering, same corner radius, border, background and shadow, same focus ring, centered at every width, no bottom-sheet variant and no new visual tokens. The width is 400px rather than the sign-in modal's 320px — the maintainer's override, made with the deviation named on a prototype in front of them, because 320px left the email field narrower than the footer's own. Field and button stack vertically; the small print renders at a size that reads as text rather than texture. A later session must not "correct" the width back. (What does the popup look like, matching the Save gate?)
- **Reduced motion fades only.** The entrance and exit are opacity alone, on the durations the site already uses for its overlay, with no translation and no scale. The site's existing reduced-motion configuration is honored rather than re-implemented.
- **The promise and the consent are different strings.** The sentence above the field states what the Reader is signing up for: new Recordings, only when there is something new, confirm once. It names no frequency. The small print below the field is the consent evidence — who sends it, that consent can be withdrawn, and a link to the privacy policy — and it is the string stored on every consent record. The withdrawal statement appears in exactly one of them. Both are shared constants, so the footer, the subscribe page and the prompt cannot drift apart.
- **No fixed frequency anywhere.** "Once a week", "weekly" and "every week" are gone from the heading, the consent string, the subscribe page's body, its page description, and the privacy policy's description of the Digest. The policy says the Digest goes out when there is something new, because a quiet stretch means no email.
- **The contact email stays out of the consent string.** The privacy policy, which the consent string links to, publishes both the postal address and the contact email, so the consent request reaches both by a link that is itself part of the stored record. This is a defensible reading rather than a certainty, and the maintainer deferred it to the agent's judgement — recorded so it can be revisited without re-litigating it. The address stays in every Digest's footer regardless, which is what the message itself is required to carry. (What exact words does the popup say?)
- **The button reads "Subscribe" and the success line names the confirmation.** "Send me the Digest" would only be the better label on a signed-in Reader's prefilled one-tap path, and that path is not this spec's default. The success line tells the visitor to check their inbox and that the Digest starts once they confirm, which is the one step double opt-in leaves them.
- **The consent version is bumped.** The stored version string moved to the date the words changed, because records made under the old wording are no longer comparable with records made under the new one. Any future change to the agreed words bumps it again in the same change.
- **Two comments are corrected in the same change as the build.** One above the disclosure component and one above the sender-identity module still assert that the mailing address and the contact method are present in the consent string. They are not, and a comment that reads as an instruction will eventually be obeyed. Both are rewritten to describe the string as it is.
- **A signed-in Reader's answer lives in one new table, one row per Reader.** Keyed by the same verified account identifier the saved-Demos table uses. Two columns beyond the key: when the prompt was suppressed, and why, constrained to exactly two values — subscribed or dismissed. No email column, because the saved-Demos table already ruled that out and the rule holds. No second timestamp, because the row is written once and never rewritten, so a column implying maintenance would lie. The table is per Reader rather than per feature, so a later flag is an added column rather than a second table.
- **Dismissal upgrades to subscribed, never the reverse.** A Reader who dismisses on one device and subscribes from the footer later is recorded as subscribed. The row records one fact, not a history; no query asks for the distinction a second column would preserve.
- **The read rides along with the saved-Demos read; the write gets its own route.** The header already asks for the Reader's saved Demos on every page, so the prompt's suppression flag is added to that response — one indexed lookup, no new round-trip. Writing the flag is a new route of its own, authenticated the same way as every other account-scoped route: the verified token, never a field in the body.
- **An unknown answer fails toward asking.** Signed out, still resolving, or failed to load all mean the prompt may show. If a late answer arrives saying already suppressed, the prompt closes and counts as shown. A Reader who dismissed on one device may therefore see the prompt once on another while the read is in flight; that is the accepted cost of not losing a signup to a blip, and it matches the saved-Demos stance that a failure is not an empty account.
- **Permanent, both reasons.** No expiry. The timestamp is written for observability and nothing reads it as a lifetime. Changing that later is a read-path decision, not a migration.
- **Subscribing writes the flag from inside the subscribe action, not from the prompt.** One write on the server, so the footer, the subscribe page and the prompt all record a signed-in Reader identically. Putting the write in the prompt alone would let a Reader who subscribed from the footer be asked again on another device.
- **A signed-out visitor grows exactly one new browser key.** The existing key that records "an address was submitted" is read and never renamed, repurposed or cleared — its meaning is deliberately not "is a Subscriber". The new key records a dismissal only, and is written on close only. It follows the browser-storage convention the remembered-set hook already uses. No cookie: the site sets none today, and a cookie would be the only new privacy surface this feature introduces. (How is "never show again" remembered for Readers vs visitors?)
- **The prompt knows nothing about the site's surveys.** It does not detect them, read their suppression state, or vary its behaviour by route to avoid them. Its entire analytics footprint is the one event the footer form already captures, carrying the route and never the address. The one survey still live on the site renders above the prompt's scrim; a corner prompt appearing over the dimmed backdrop is the accepted behaviour, not a defect, and it requires a visitor to sit on the open prompt for most of a minute without acting. (Does the popup fight the PostHog prompts that are already live?)
- **The privacy policy's version does not change.** No new data is collected, no new third party is involved, and the disclosure the policy describes is the same disclosure the footer already shows.

## Testing Decisions

- **Test behaviour at the boundary, not the wiring behind it.** A test that passes by knowing which hook owns the timer, or which element carries the scrim, is a test of the implementation rather than of the decision. The prompt's whole decision is one pure function; that function is the test surface.
- **The decision function is tested exhaustively, because it is pure.** Every route that shows and every route that does not. Each trigger condition alone and both together. Each browser key alone and both together. A signed-in Reader suppressed for each reason, an unknown flag, and a flag that arrives late. The sign-in modal open, a Recording open, and the prompt already open when either appears. Reduced motion is not this function's concern and is not asserted here.
- **The account-scoped routes are tested the way the saved-Demos route already is.** Real signed tokens verified against a stubbed key set, and an in-memory stand-in for the database keyed by the account identifier, so a query that forgot its scope fails by touching the wrong Reader's row rather than passing. Pinned behaviours: an unverifiable token is rejected and touches nothing; the saved-Demos read now carries the suppression flag and still costs one read; the write route rejects a body that names an account other than the verified one; a dismissal followed by a subscription records the subscription; a second dismissal does not move the timestamp.
- **The consent string is already pinned and those pins stay.** The existing consent tests assert the sender's name, exactly one withdrawal statement, no fixed-frequency promise, and the domain's own vocabulary. They are the regression net for every story about the words.
- **Prior art.** The pure-function tests follow the decision-function tests already in the suite; the route tests follow the saved-Demos route tests, including their rule that a mocked signature check would pass while the real verification was broken.

## Out of Scope

- **Sign-in itself.** The sign-in modal's providers, flow and account panel are read for their open state and never modified.
- **The email plumbing.** Vendor, consent store, opt-in mode and unsubscribe ownership are settled and kept. This spec adds a column to a response and a write inside the existing subscribe action; it does not reopen how an address is confirmed or stored.
- **The site's surveys.** Whether either survey should stop, move or change is another effort's surface. This spec only has to coexist, and its decision is to not know they exist.
- **A prefilled one-tap subscribe for signed-in Readers.** The button label would want to change there, and the address would come from the account. Noted as a future surface, not built here.
- **Sunset and hygiene for addresses the prompt wins.** Whether a never-engaged address is eventually removed, and whether the no-tracking promise in the policy ever changes. The policy currently says no open or click tracking, so any change to that bumps the policy version and is a decision of its own.
- **Per-Recording alert mail.** The promise is the Digest, sent when there is something new. Instant mail per Recording is a different product and stays unbuilt.
- **Deliverability posture.** The published mail policy is permissive, and whether a larger list changes that depends on the list the prompt actually wins, which nobody has measured yet.
- **Sponsor placements and commercial mail.** No sponsor copy, no third-party promotion, and nothing here sells the list.

## Further Notes

- The three prototypes that settled the width, the copy and the spacing are kept on their prototype routes as the primary source for those decisions. They are throwaway in the sense that the answer folded into the constants; they are not deleted, because a later session checking why the width is 400px should find the comparison that justified it.
- The map's destination was a build-ready spec plus a judged verdict on the email setup. Both are done: the verdict is to keep everything, and this spec is the build.
- Two patches of fog remain on the map and are deliberately not specified here: hygiene for prompt-acquired addresses, and inbox placement under the volume the prompt eventually wins. Both wait on a measurement this spec does not produce.
