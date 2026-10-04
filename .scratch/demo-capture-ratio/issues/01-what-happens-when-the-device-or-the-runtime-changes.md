# What happens when the device or the runtime changes?

Status: open
Type: grilling
Blocked by: 02

## Question

A standard that names a device expires. This ticket decides **how it expires** — deliberately, in
advance, rather than the first time somebody records on a new iPhone and wonders whether the rule
still applies.

The measured facts make this sharper than it sounds. Across six device/runtime pairs the ratio spans
**0.46%** — but the *dimensions* are not constant even where the ratio is:

| Device | Runtime | Dimensions | Ratio |
| --- | --- | --- | --- |
| iPhone 18 Pro | iOS 27.0 | 1206×2622 | 0.459954 |
| iPhone 17 | iOS 27.0 | 1206×2622 | 0.459954 |
| iPhone 17 Pro | iOS 26.5 | 1206×2622 | 0.459954 |
| iPhone Air | iOS 27.0 | 1260×2736 | 0.460526 |
| iPhone 17e | iOS 27.0 | 1170×2532 | 0.462085 |
| iPhone 18 Pro Max | iOS 27.0 | 1320×2868 | 0.460251 |

So three different devices already produce byte-identical geometry on two different runtimes, and
three more produce *different geometry at the same ratio*. Whether that matters is the question.

### What to decide

1. **What is named — the ratio, the dimensions, or the device?** These come apart. A ratio rule
   survives a resolution bump and expires on a shape change (a 19.5:9 → 20:9 iPhone would break it
   and every existing Demo would need re-recording). A dimension rule survives neither. A device
   rule survives everything but tells the maintainer nothing they can check.
2. **Is the runtime version pinned?** If yes, the rule expires on every iOS point release and needs a
   maintainer decision each time — which may be exactly right, or may be noise. If no, a runtime
   could change the geometry without anybody noticing.
3. **What is the trigger to revisit?** Options worth weighing: an explicit annual check; a check
   that fires when a measured capture falls outside the band from ticket 04; nothing, on the grounds
   that the next Demo recorded on a new device will reveal it immediately; or a note in the skill
   saying "if the ratio is wrong, the device changed — re-measure before publishing".
4. **Is a new device automatically a new standard, or a deviation to be measured first?** The
   asymmetry matters: adopting a device silently changes what "the standard" means, while measuring
   first costs a minute and produces a fact.
5. **What happens to the rule if the ratio genuinely changes** — say a future iPhone is 20:9? The
   171 in-band Demos become out-of-band, the Detail boxes change height, and the tolerance in ticket
   04 is meaningless. Is that a deliberate re-standardisation with a re-record, or is the band simply
   widened to include history?

### Why this is not a later-round question

It looks like a distant concern, but it decides what ticket 03 writes down. If the answer is "a
ratio, and it expires on a shape change", then the standard is a sentence about `0.46`, and the
device is an implementation detail that belongs only in the skill. If the answer is "the device", the
ADR is a sentence about iPhone 18 Pro and the ratio is a footnote. Those produce different documents.
