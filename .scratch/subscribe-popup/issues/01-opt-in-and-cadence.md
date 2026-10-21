# Is a confirmation email the right call, and what cadence may the list carry?

Status: resolved
Type: research

## Question

The maintainer wants the best setup for collecting addresses now while the send cadence is undecided (weekly Digest vs ad-hoc "any time" sends), and asks whether requiring a confirmation email is right — "find it for yourself."

Resolve with evidence, not instinct:

1. Single vs double opt-in for this list: deliverability, consent provability (CASL/GDPR posture the repo already keeps), and what changes if sends become ad-hoc rather than the promised weekly-if-new Digest.
2. What the confirmation email must contain and how long its link stays valid (current link dies on use; is expiry needed?).
3. Whether undecided cadence constrains the consent wording — can one disclosure cover both weekly and ad-hoc, or must the promise name a frequency?

Do not rebuild the vendor comparison here (that is ticket 02). Confine this to opt-in mode + cadence + confirmation shape, reusing the two notify-and-preview research files as the baseline and overturning them only with dated evidence.

## Answer

**Keep double opt-in; keep the confirmation shape and its use-once link; reword the disclosure off "once a week" so one text can cover weekly and ad-hoc sends.** The pending-record + HMAC-token + spend-on-confirm flow is both the consent proof and the bot filter (18/51 signups were bots), and the token deliberately carries no time expiry. Full evidence in [research/opt-in-and-cadence.md](../research/opt-in-and-cadence.md). This unblocks the copy ticket, which now carries the reword + version-bump constraint.
