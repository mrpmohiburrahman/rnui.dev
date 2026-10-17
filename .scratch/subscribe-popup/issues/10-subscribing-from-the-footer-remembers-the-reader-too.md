# 10 — Subscribing from the footer remembers the Reader too

**What to build:** A Reader who subscribes from the footer or `/subscribe` receives the same cross-device popup suppression as one who subscribes from the popup. The subscribe action already writes the Reader's account answer; this ticket puts that write on every capture surface and corrects two comments that still describe the pre-October consent string as if the postal address and contact method were still inside it.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] A signed-in Reader who submits a valid subscription from the footer is recorded as `subscribed` and is not asked again by the popup on another device.
- [ ] A signed-in Reader who submits a valid subscription from `/subscribe` is recorded as `subscribed` and is not asked again by the popup on another device.
- [ ] A signed-out visitor who submits from either surface writes no Reader flag and keeps the existing browser-only submitted-address memory; the submitted-address key is not renamed, repurposed, or cleared.
- [ ] The existing pending-record, token, consent-record, confirmation-email, undeliverable-address, and double-opt-in behavior is unchanged.
- [ ] The footer and `/subscribe` descriptions and the Privacy Policy's description of the Digest continue to state that it goes out when there is something new, and the shipped disclosure and success copy remain byte-identical to the recorded consent string.
- [ ] The stale comment above the signup disclosure is corrected so it no longer claims that the mailing address and contact method are inside the consent string.
- [ ] The stale comment above the sender-identity module is corrected so it no longer claims that all four consent elements are present in the string.
