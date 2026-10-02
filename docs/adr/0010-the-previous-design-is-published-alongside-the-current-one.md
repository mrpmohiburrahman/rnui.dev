# The previous design is published alongside the current one, not replaced by it

`rnui.dev` served the deploy-A design and `preview.rnui.dev` served the studio-dark
design. The two are swapped: the studio-dark design takes `www.rnui.dev`, and the deploy-A
design is republished at `old.rnui.dev` rather than being dropped. `preview.rnui.dev` 301s
to the root once the swap lands.

The swap is four decisions that only make sense together.

**Two Vercel projects, not two branches of one.** Vercel scopes environment variables to
*environments* (Production / Preview / Development), not to branches — a branch deployment
always receives the Preview set. Publishing the previous design as a branch of the same
project would therefore hand it the Preview PostHog key and the Preview Turnstile hostnames,
and neither can be corrected per-branch without breaking every feature-branch preview. A
second project (`rnui-dev-archive`) has its own Production environment, which is what makes
the Archive genuinely frozen rather than merely pointed somewhere.

**`main` is re-cut from `feat/studio-dark`.** `main` has meant "what visitors see" in every
spec since `ui-ux-overhaul`, and the alternative — `main` continuing to mean the retired
design — makes that word lie in five `.scratch/` documents and in `CLAUDE.md`. The merge is
real, not a fast-forward: `main` was not an ancestor of `feat/studio-dark` (merge-base
`3d479be`, two commits behind, 114 ahead). Main's two extra commits are a README portfolio
link and a `scripts/lastCommitDate.json` timestamp.

**Both hosts report to PostHog project 117415, separated by `$host`.** The studio-dark
branch compiled `phc_oFZiXjSi…` (project 559028) while `www` compiled `phc_6cIcFcQK…`
(project 117415). Letting the live site inherit 559028 would have split deploy A's five
weeks of data, dashboard `1937576`, both surveys and the two annotated boundaries across
two projects — which is the attribution `studio-dark`'s spec spends an entire section
protecting.

Sharing one project is safe, and it needs **no code to make it safe**: posthog-js attaches
`$host` to every capture from the client's own `location`, so `www.rnui.dev` and
`old.rnui.dev` are already separable on every one of the fourteen events. What the sharing
costs is discipline, not plumbing — every insight and heatmap that has survived the restyle
now needs a `$host` filter, or it silently blends Archive traffic into live numbers, and
`bookmark_added` / `vote_cast` from the Archive are indistinguishable from live ones by
anything but that filter. Ticket 15 owns the inventory.

The Archive fires all fourteen events and `$pageview`. It is a frozen design, not a dead
one, and the question actually worth asking about it — does anybody visit it at all — is
answered by `$pageview`; the other thirteen describe catalogue behaviour the Archive's
stale counters cannot honestly measure.

One consequence of the shared key that is not a filter problem: `person_profiles: "always"`
means one browser is **one person** across both hosts, so a visitor who uses `www` and then
`old` is a single person with double the pageviews. Correct for the Archive's traffic count
and wrong for anything per-person.

**The Archive is noindexed, keeps two of three forms, and is published rather than
private.** It is public content, so there is nothing to authenticate, but it must carry the
same `X-Robots-Tag: noindex` the Preview carried — otherwise it serves all 277 Recordings as
indexable duplicate content against the live site while `next-sitemap.config.js` claims the
same canonical URLs for both. `/submit` is the one route it does not serve: Turnstile's
hostnames are scoped per environment and `old.rnui.dev` is in none of them, so the form
would refuse every visitor anyway, and a working Submission form on a frozen host would
point `NEXT_PUBLIC_SITE_ORIGIN` at a host that is not the catalogue. `/subscribe` and
`/contactus` stay — and the Archive **must** pin `NEXT_PUBLIC_SITE_ORIGIN`, because
`app/actions/subscribe-email.ts` otherwise falls back to the attacker-controlled `Host`
header, which that file's own comment calls a phishing primitive.

`components/preview-survey.tsx` is deleted. It was the only survey on the site getting
answers — the PostHog exit survey is 14-shown / 0-completed — and it was built to fix
exactly that. Its first question, *"Compared to the old rnui.dev, this is…"*, is unanswerable
the moment `old.rnui.dev` is a real link rather than a description: a visitor who was never
sent to the Archive cannot answer a comparison against it. Its deletion also makes the
no-visitor-entered-text rule in `lib/analytics.ts` total instead of exceptional, since
`preview_survey_note` was the only event that carried a sentence somebody typed.

Consequences worth naming. The deploy A → deploy B boundary stops being a *deploy* boundary
and becomes a *host* boundary: the annotation that was going to sit on the deploy-B cut now
sits on the `www`/`old` split, and both hosts live in one PostHog project, so
`studio-dark` spec Goal 4 is met by a filter rather than by a timestamp. And survey `019fbc46`
— "Didn't find what you were looking for?" — still has to be anchored away from the Archive,
because `/products` is served by both and `icontains` matches both.

## The retired project is named for what it is not

Project 559028 was renamed `rnui.dev old` on 2026-10-02, from `rnui.dev Preview`. The name
had started lying the moment the swap landed: it named a host that 308s to `www`, and nothing
writes to it at all — measured, not inferred: no deployed build compiles its `phc_oFZiXjSi…`
key, and `www.rnui.dev` and `old.rnui.dev` both compile 117415's.

**It does not hold the previous Design's numbers, and its name cannot be read as though it
does.** Its data is the *current* Design's behaviour while that Design was still under review
at `preview.rnui.dev`, between 2026-08-15 and 2026-10-02. The previous Design's numbers are
in 117415, before 2026-08-15, and the Archive's numbers are in 117415 too. So the honest
one-line reading is: `rnui.dev old` is *the old host's project*, and 117415 is the only
project any Design's live traffic has ever gone to. That sentence is repeated in the
project's own `product_description`, because a name in a project switcher is read without the
ADR open beside it.

This is the third naming that had to be corrected by the swap rather than by taste — `old
rnui.dev` was a description inside a survey question before it was a hostname, and
`preview.rnui.dev` was a live host before it was a redirect. Each time the word outlived the
thing it named, and in an analytics project the cost is a number read against the wrong
Design.