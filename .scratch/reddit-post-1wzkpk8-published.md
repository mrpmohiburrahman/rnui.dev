# Published: [Showcase] Awesome React Native UI

Live post, fetched with `rdt read 1wzkpk8` after it went up.

| | |
|---|---|
| URL | https://reddit.com/r/reactnative/comments/1wzkpk8/showcase_awesome_react_native_ui_rnuidev_has_had/ |
| Posted | 2026-10-07 08:03 UTC |
| Subreddit | r/reactnative |
| Type | Video post, `is_self: false`, media at `https://v.redd.it/cff25442dyth1` |
| Score at fetch | 1 |
| Comments at fetch | 0 |
| Upvote ratio | 1.00 |
| Removed | No. `removed: None`, `removed_by_category: None` |
| Flair applied | **None.** `link_flair_text: None` |

## As published

Title:

> [Showcase] Awesome React Native UI (rnui.dev) has had a UI overhaul and now performs much better

Body:

> I posted about this around two years ago when it had about 100 animations. It's 298 now.
>
> \* Rebuilt the UI. New layout with search and filters.
> \* Much lighter. Videos come off a CDN and only load when you click one, so nothing streams while you scroll. The old site ate a lot of memory on lower end machines.
> \* 21 new animations. 14 from Enzo, 7 from David Mokos.
>
> You can submit your own from the site, no PR needed: [https://www.rnui.dev/submit](https://www.rnui.dev/submit)

Bullets rendered as `*` rather than `-`. Content is otherwise the draft as approved.

## What changed between the draft and the live post

**The video is the post body.** `is_self` is false, so this went up as a video submission with the text as the caption. The `[VIDEO ATTACHED]` line in the draft was a placeholder for the thing Reddit itself now hosts. That is the better shape and it matches the hook, so no change needed.

**The closing line got dropped.** "I maintain it. Tell me what I got wrong." is in the draft file but is not in the published body. This was the disclosure and the invitation to criticize in one sentence. Without it the post reads as an announcement with no authorial position and nothing to reply to.

Adding it back is a one line edit on the live post, and it is worth doing while the post is young.

**No flair was applied.** `link_flair_text` is null. The `[Showcase]` prefix sits in the title text, which is the convention your two surviving 2024 posts used, so the post is shaped correctly either way. Applying the real flair as well would be belt and braces.

**Two words of drift.** The opener reads "around two years ago" against the draft's "two years ago", and the closing line trails off. Neither changes a claim.

## The rule 1 question is still open

r/reactnative rule 1 reads: "No self promotion. It is not allowed to promote your company in any way, shape or form."

The post is up and not removed as of the fetch. That is the good outcome, and being up for minutes is not the same as surviving the day, since r/reactnative runs automated filters that catch link-heavy self posts after the fact.

The modmail message in the draft file is still the cheapest insurance:

> rules question, I maintain an open source (MIT) catalogue of community made RN demos. Plan is a showcase post with a short before and after video of a UI rebuild, plus a line saying contributors can submit through the site's own form. Allowed?

## Claims in the post, for the record

Every claim was verified against the live site before posting. See the "Verified before writing this" table in `reddit-post-298.md` for the method behind each.

| Claim | Status |
|---|---|
| 298 animations | Verified from live HTML. 24 contributors, 18 categories |
| 21 new since the 2024 post | Verified from pinned test totals, 277 to 298 |
| 14 from Enzo, 7 from David Mokos | Verified from commit messages, sums to 21 |
| Videos load from a CDN | 298 of 298 demos returned HTTP 206 with byte range support. Zero failures |
| Nothing streams while you scroll | `<video>` only mounts on `isPlaying`, posters are `loading="lazy"` |
| Submit works | Live Turnstile 403 on a bad token, which proves the secret is configured. Linked from footer and `/contributors` |

The post says "much lighter" and "performs much better" with no measured figure. That is deliberate. The only LCP numbers in the repo are labelled poor band in their own commit message, so they describe the problem rather than a result. If someone asks for numbers, run Lighthouse and answer with it.