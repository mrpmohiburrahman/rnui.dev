# The `/submit` page

Status: resolved
Type: task
Blocked by: 01, 10

## Question

Build the page a stranger uses to send rnui.dev their work. It collects **exactly** what a
Recording needs, so the maintainer's publish step stays mechanical — the field list comes from
`data/recording.ts` and the `add-recording` skill, not from invention.

Read `CONTEXT.md` first and use ticket 01's vocabulary in every label. Read
`app/contactus/page.tsx` and copy its idiom for fields, labels and status reporting: the
`fieldClass` / `labelClass` constants, the mono eyebrow at `9px` with `tracking-[0.14em]`, the
full-width `bg-acc` button, and the `NOT SENT` / `SENT` failure-and-success pair at the foot.
This page is a sibling of that one, not a new design.

Fields — required unless marked:

- Contributor display name. Ticket 01 decides the label.
- GitHub username, LinkedIn slug, X/Twitter handle — **bare slugs, never URLs or `@`**
  (`add-recording` step 2b is explicit), all optional.
- Caption: the short human title, e.g. "Radial FAB".
- Category: a select over the 18 keys in `data/categories.ts`. **Never free text** — the
  Category fix is a maintainer edit, not a submitter choice.
- Source URL: `https://` link to the Contributor's code. Reject anything failing `^https?://`.
- The Demo file: `accept="video/*"`, with the 5 MB check (decision 3) on the picked file.
- The consent checkbox, carrying ticket 10's disclosure string.

## Acceptance

- `/submit` renders on the Studio Dark tokens, light and dark, at the phone and desktop
  breakpoints, with no new design vocabulary.
- Client validation refuses a missing name, a missing caption, an absent Category, a
  non-`https` source, and every handle that is not a bare slug — each with a specific message.
- A file over 5 MB is refused **before** any compression or upload attempt, naming the limit
  and the actual size.
- Selecting a valid file shows the file name and size; clearing it returns the form to its
  initial state.
- The submit action is disabled while a submission is in flight, and the three states —
  idle, submitting, done — are visibly distinct.
- The page is reachable at `/submit` and is **not** linked from anywhere yet; ticket 11 owns
  discovery.
- `pnpm check-types`, `pnpm lint` and `pnpm test` all exit 0.

---

Resolved 2026-09-25. Built as four files:

- `lib/submission-form.ts` — the rules, as an ordinary function a test can import.
- `tests/submission-form.test.ts` — 17 cases, one per rule.
- `app/submit/page.tsx` — the form. A sibling of `app/contactus/page.tsx`: same eyebrow,
  same `fieldClass` / `labelClass`, same panel, same `NOT SENT` / `SENT` pair.
- `app/submit/layout.tsx` — the title, because a `"use client"` page cannot export metadata.

**The rules are not in the JSX.** The acceptance asks for a *specific* message per rule, and a
message can only be pinned by a test if it is not buried in markup — so `validateSubmission`
returns the messages and the page renders them. This is also what makes the size rule testable
in isolation, which matters because it is the one rule with an ordering requirement.

**Both orderings are load-bearing and are the reason the page is not simpler.** The size check
runs in `handleFile`, i.e. the moment a file is picked, before the Turnstile widget is rendered
at all. Ticket 02 measured compression in *minutes*: refusing a 9 MB file after compressing it
spends that time on work that was never going to be sent. And the widget renders only once a
file is accepted, because a token lives 300 seconds — one minted on page load is dead before a
visitor who took a minute to choose a file can submit. **Ticket 06 inserts compression between
those two steps and must not move the widget ahead of it.**

Handles are validated against `^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$` rather than
"no spaces", so `@someone`, a full URL, `someone/`, `someone.dev` and a leading or trailing
hyphen are all refused here rather than published and repaired by hand — which is what
`add-recording` step 2b exists to avoid. `http://` is accepted alongside `https://` because
step 3's own matcher is `^https?://`; refusing it would reject a source the publish path takes.

Verified against a production build, not just a dev render. `/submit` returns **200**; the
served HTML carries the `Send us a Demo` title and h1, the mono `SUBMIT` eyebrow, **one
`<select>` with 19 `<option>`s** (the 18 `data/categories.ts` keys plus the placeholder, so the
Category list is derived rather than transcribed), one file input, one consent checkbox, the
`DEMO — UP TO 5 MB` label, and the full disclosure with its last sentence as a real
`/privacypolicy` link. **The word `turnstile` does not appear in the served HTML at all**,
which is the ordering above holding by construction. The submit button ships `disabled`, and
`/` contains **zero** links to `/submit` — ticket 11 still owns discovery. Gates: `check-types`
clean, `lint` clean, Prettier clean on every touched file, `pnpm test` **20 files / 337 passing**
(was 19 / 320), `pnpm build` OK with `○ /submit` in the route table.

**What this does not do, recorded rather than implied.** The form posts `multipart/form-data` to
`SUBMIT_ENDPOINT` (`/api/submit`, declared once in `lib/submission-form.ts` because the route's
*file path* is the endpoint and nothing type-checks that pairing). That route does not exist
yet — ticket 07 builds it — so **a submission today ends in the `NOT SENT` state with a JSON
parse failure**, and the `SENT` branch has never been reached with a real response. The bytes
in the request are the picked file, not ticket 06's compressed output. Neither is a defect in
this ticket; both are why the two tickets after it exist.

**One qualification to "not linked from anywhere yet".** `pnpm build` regenerates
`public/sitemap-0.xml`, and that build added `<loc>https://www.rnui.dev/submit</loc>` — it was not
there before, and no config was touched, so `/submit` is picked up from the route tree
automatically by `next-sitemap`. The generated file was reverted rather than committed, because
regenerating it is a chore the repo commits on its own (`639c31b`). **The sitemap is a discovery
surface, and the decision about it is recorded on ticket 11**, whose acceptance already asks for
exactly that call.

**Consequences, applied to the map:** resolving this gives ticket **06** (blocked by 02, 05) and
ticket **11** (blocked by 05) their last dependency, so both become takeable.
