# Reddit post for r/reactnative

Draft, not posted yet. Attach the old to new video before you submit.

---

## Title

`[Showcase] Awesome React Native UI (rnui.dev) has had a UI overhaul and now performs much better`

---

## Body

I posted about this two years ago when it had about 100 animations. It's 298 now.

[VIDEO ATTACHED: old site, then new site]

- Rebuilt the UI. New layout with search and filters.
- Much lighter. Videos come off a CDN and only load when you click one, so nothing streams while you scroll. The old site ate a lot of memory on lower end machines.
- 21 new animations. 14 from Enzo, 7 from David Mokos.
- You can submit your own from the site, no PR needed: https://www.rnui.dev/submit

I maintain it. Tell me what I got wrong.

---

## Attach the video

Put it first. That's the hook, and it's the one thing nobody else can copy. Frame it so the site starts changing before anyone reads anything.

## A note on the title

Dropped the spaces inside the parentheses, so it's `(rnui.dev)` rather than `( rnui.dev )`, and swapped "got UI overhaul" for "has had a UI overhaul". Reddit titles don't need the parens at all if you'd rather drop them, but the site name is worth keeping since the sub has 180K members and only some will recognise the domain.

---

## What the humanizer changed

Ran `blader/humanizer` over the draft. It flagged five things, all decoration rather than content:

| Pattern                  | What it was                                                                     | Fix                                                     |
| ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Bold as decoration (§19) | Every bullet opened with a bold label and a period                              | Dropped the labels. The bullets read fine without them  |
| Repeated openings (§7)   | The bullets shared one shape, label plus two sentences                          | Varied them. One is now a single sentence               |
| Staged run-up (§4)       | "What's new:" announced the list instead of saying anything                     | Cut it                                                  |
| Redundancy               | "I rebuilt the whole site" in the opener, then "Rebuilt UI" again in bullet one | Kept the rebuild in the bullet only                     |
| Repeated phrase          | "much lighter" in the title, then verbatim in bullet one                        | Title carries it, bullet explains the mechanism instead |

Every claim survived the pass: the CDN and memory point, Enzo and David, the 21 new animations, the submit link last. Only the framing around them moved.

Split into four bullets afterwards, so the performance work got its own line instead of sharing one with the rebuild.

---

## Verified before writing this

Checked against the live site today, not assumed from the repo.

| Claim                                          | How it was checked                                                                                                                                                                                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 298 animations, 24 contributors, 18 categories | Scraped from live `www.rnui.dev` HTML                                                                                                                                                                                                                           |
| 21 new since the 2024 post                     | `git log` on `tests/recording-counts.test.ts` pinned totals, 277 to 298                                                                                                                                                                                         |
| 14 from Enzo, 7 from David Mokos               | Per commit messages and diffs, counts sum to 21                                                                                                                                                                                                                 |
| Videos load from a CDN                         | Range GET on every demo referenced on page 1 of all 18 categories. **298 of 298 returned HTTP 206 with byte range support. Zero failures**                                                                                                                      |
| Nothing streams while you scroll               | Videos are click to play. The `<video>` element only mounts when `isPlaying`, so no demo bytes load until asked. Posters are `loading="lazy"`                                                                                                                   |
| Submit works                                   | `POST /api/submit` with a real multipart body and a bad Turnstile token returns `403 "We could not verify the browser check."` It reached Siteverify, which only happens with a configured secret. **Pipeline is live.** Linked from footer and `/contributors` |

## Two corrections to what I told you earlier

**`/submit` is not a dead form.** I said don't invite submissions because `CLAUDE.md` claims the endpoint refuses every visitor for want of `TURNSTILE_SECRET_KEY`. That line is stale. `vercel env ls` shows the Turnstile secrets in Production, Preview and Development, 12 days old. My first two probes returned a generic 400 and I misread it; the handler returns that for any body it can't parse as multipart, before Turnstile runs. With the right format I got the Turnstile specific 403, which proves the pipeline is live.

**Don't add a performance number.** The only LCP figures in the repo (`4,212ms desktop / 4,515ms mobile`) are from a commit message and are described there as poor band. That's the problem being complained about, not a result. There's no PostHog web vitals capture wired up either. So the post says "much lighter" and "performs much better", which the structural facts support, and quotes no measured figure. Run Lighthouse first if you want a number.

---

## Before you submit

**Retake any screenshot from `www.rnui.dev`, not `old.rnui.dev`.** The frozen archive says "Total items: 277" and still carries the old header. The video may make a screenshot unnecessary.

**Keep the `[Showcase]` tag.** r/reactnative rule 1 reads "No self promotion. It is not allowed to promote your company in any way, shape or form." Both of your 2024 posts that survived carried it.

**Consider modmail first.** One message, a real answer:

> rules question, I maintain an open source (MIT) catalogue of community made RN demos. Plan is a showcase post with a short before and after video of a UI rebuild, plus a line saying contributors can submit through the site's own form. Allowed?
