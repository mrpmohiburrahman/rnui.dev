# A view is a recording watched, not a button pressed

Demos autoplay muted once their tile is in view, at most five at a time, so there is no longer a play button to press. A view is now counted when a Demo has actually played for roughly two seconds while on screen, at most once per Entry per browser session, or when a visitor opens an Entry or follows its source link. Scrolling quickly past a playing tile counts nothing.

The counts already in Firestore carry forward unchanged. `view_count` therefore spans two definitions: before this change it meant a deliberate press, after it means the recording was watched. Rankings drift toward the new meaning over weeks rather than snapping on deploy.

The site already has a signal for interest — votes. Having `view_count` measure interest as well would have measured the same thing twice. Reach and interest are different questions, and the catalogue is better served by asking both.

## Considered options

- **Count every autoplay, with no threshold.** Simplest, and literally true — the recording did play. But one fast scroll through a page of 48 tiles registers dozens of views, and the number stops distinguishing watched from scrolled past. "Most viewed" degrades into "whatever sits near the top of page one", which is self-reinforcing: the highest-ranked Entries autoplay most, so they rank higher still.
- **Keep an explicit play control alongside autoplay, and count only the press.** Preserves the old definition exactly, so nothing needs explaining and no history breaks. Rejected because it puts a play button on top of a video that is already playing; visitors press it expecting something to happen.
- **Count only deliberate acts — opening an Entry or following its source link — and never autoplay.** Also preserves a clean definition. Rejected because it makes views rare: most visitors watch and leave without opening anything, so the number would describe a small minority of the actual watching, while votes already cover deliberate interest.
- **Reset every count to zero on deploy.** One consistent definition forever, at the price of a year of accumulated signal and a catalogue showing 0 views on every Entry on day one.

## Consequences

- `view_count` growth rate jumps at deploy. A reader comparing a number from before the change with one from after is comparing two different measurements, which is why this file exists.
- The two-second threshold and the once-per-Entry-per-session cap are load-bearing, not incidental. Removing either turns the metric back into an impression count.
- The self-reinforcing loop is weakened, not eliminated. Entries near the top of the first page still accumulate views faster than those on page four, because they are seen more. "Most viewed" should be read as popularity among what visitors were shown, never as quality.
- Because a view can now be earned without any interaction, `Views` and `Votes` diverge much further than before. A card showing 1,426 views and 0 votes is now normal rather than surprising.
- The counting moves into the playback owner that grants the five concurrent slots. Nothing else may increment a view, or the cap stops bounding the metric.
- A visitor browsing under `prefers-reduced-motion` can never earn an autoplay view, because no Demo is mounted for them at all. They count opens and source links and nothing else, so their views are strictly a subset of what everyone else's number measures. Nothing here is worth changing — mounting a video for them to satisfy a metric would be the tail wagging the dog — but anyone comparing two Entries, or the same Entry across a period, is comparing populations that earn views at different rates.
