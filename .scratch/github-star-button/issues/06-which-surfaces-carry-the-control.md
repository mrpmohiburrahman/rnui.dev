# Which surfaces carry the control

Status: resolved
Type: grilling
Blocked by:

## Question

**This repo serves at least three surfaces, and one of them is a trap.**

Per `CLAUDE.md`: `www.rnui.dev` serves the current Design, `old.rnui.dev` serves the previous one —
a **separate, frozen Vercel project** (`rnui-dev-archive`) that must never be merged into — and a
public branch Preview lives at `preview.rnui.dev`, noindexed, reporting into a different PostHog
project. `SiteHeader` renders from `app/layout.tsx`, so anything added to it appears on all three.

Decide:

- **Does the Preview carry it?** It is public and reachable without Vercel Authentication, and the
  Preview already runs a *different* PostHog project (559028 vs 117415). A star button on a
  noindexed branch preview asks a favour of whoever stumbles onto a URL that is not the site. Its
  analytics would also land somewhere the main dashboards do not read. This is the surface where the
  question is not obvious, and it is the one most likely to be forgotten because it never appears in
  local development.
- **Does `old.rnui.dev`?** `old` is frozen and takes no new code by definition, so the answer is
  almost certainly no — but say so explicitly rather than leaving it implied, because "we added it to
  the header" and "it appears on both live Designs" are different claims.
- **Does the phone header carry it, or is it desktop-only?** `old` is one question; the phone is a
  design question already inside [Five directions for the star control](#01) and should be settled
  there, not duplicated here. This ticket is about *deployments*, not breakpoints.

If the answer is "production only", that is a condition on the implementation — an env check or a
build-time branch test — and it belongs in the spec, so state which mechanism is expected rather than
leaving the implementer to pick.

**The answer is a per-surface yes/no with the mechanism named for any "no".** This is cheap to decide
now and expensive to discover after a Preview has been asking strangers for stars.

## Answer

Resolved 2026-10-05. **The control ships on the live site only.** The mechanism is
`process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview"`, evaluated once at the top of `SiteHeaderBar` and
read by both layouts.

### The ticket's premise was out of date, and correcting it is the substance of the answer

The question names `preview.rnui.dev` as the trap. **That host no longer serves a build.** Measured
2026-10-05:

| Surface | HTTP | PostHog key compiled into its client bundle |
|---|---|---|
| `www.rnui.dev` | 200 | `phc_6cIcFcQK…` — **117415** |
| `old.rnui.dev` | 200 | `phc_6cIcFcQK…` — **117415** |
| `preview.rnui.dev` | **308** → `www.rnui.dev` | serves nothing of its own |
| `rnui-dev-git-feat-studio-dark-…vercel.app` | **200** | **`phc_oFZiXjSi…` — 559028** |

`preview.rnui.dev` 308s on `/` and on a deep path alike, so a visitor who lands there is on the live
site before a control could render. There is nothing to exclude there. The surface that *can* carry
the control is the one this ticket never named: **every Vercel branch deployment of `rnui-dev`**,
which is public — Vercel Authentication was turned off for this project in `notify-and-preview`
ticket 12 and has stayed off — and which compiles the **retired** project 559028's key.

So the trap is real and it moved. It is also smaller than it looked: branch URLs only travel to people
already inside this work, so nobody is being asked to star the repo by a stranger. What the trap would
actually have cost is quieter — ticket 05's `star_clicked` firing into a drawer nobody opens, on the
one surface where the click is easiest to test.

### 1. Branch deployments — **no**

`SiteHeader` renders from `app/layout.tsx` with no environment check anywhere in it, so a branch
build would carry the control by default. **It must not.**

Rejected the alternative — showing it on previews and dropping the analytics — because it is
visually identical to excluding it and costs a second check for no visible gain.

**The cost, stated rather than buried:** the control is compiled *out* of preview bundles, so it
cannot be seen on a preview at all. Nothing is lost: ticket 01 measured the whole width table against
the live site, and this map never intended a preview to be the place the design is judged.

### 2. The mechanism

```ts
// components/site-header.tsx, in SiteHeaderBar, above both layouts
const onProduction = process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview"
```

`NEXT_PUBLIC_VERCEL_ENV` is a Vercel **system** variable — `production`, `preview` or `development` —
so this adds no variable for a maintainer to set and cannot be set wrongly. It is inlined at build
time, which is what makes it readable from a `"use client"` component.

Four properties worth writing into the spec:

- **One predicate, both layouts.** Evaluated once in `SiteHeaderBar` and read by the desktop bar and
  the phone header. Ticket 05 fixed the `Saved` chip by requiring exactly this — two spellings of one
  control is how the phone chip came to announce a bare "12". The star control must not be able to
  drift the same way.
- **It fails open.** If the variable is ever absent, the control shows. That is deliberate: local
  `next dev` does not set it, and the control must be buildable and visible on a maintainer's machine.
  The price is that a silent rename of the variable would put the control back on previews, so the
  spec requires a unit test pinning the truth table rather than leaving it to inspection.
- **It does not exclude the Archive, and must not be claimed to.** `old.rnui.dev` is *also*
  `production` — on its own Vercel project, whose Production branch is `old`. A `VERCEL_ENV` check
  passes there. What actually keeps the control off the Archive is that `old` never receives the code
  (see §3). The two facts are independent and the spec must not conflate them.
- **Verify the injection before trusting it.** Vercel's documentation lists the variable; this repo
  has never read it, so there is no in-repo evidence it is populated. The implementer's first check is
  to grep the built preview chunk for `phc_` and confirm the preview build differs from production.
  That is the same check that caught ADR-0010's error below, and it costs one command.

`NEXT_PUBLIC_VERCEL_ENV` is preferred over the two alternatives on the table. A server-side host check
in `app/layout.tsx` — the shape `next.config.ts` already uses for `noindex` — would force every route
dynamic to answer a question one `if` can answer. A new dedicated `NEXT_PUBLIC_*` variable, matching
`.env.example`'s per-environment pattern, would be one more thing set on Vercel and one more thing
that can be wrong without looking wrong.

### 3. The Archive — **no, and it already carries a different star ask**

`origin/old` has **no `components/site-header.tsx`**. Its header is `components/nav/top-nav-bar.tsx`,
an 83px fixed `NavigationMenu`, and `:63-76` carries a star ask of its own:

> `☆ Star us on GitHub` → `github.com/mrpmohiburrahman/awesome-react-native-ui`

That is the **old alias** ticket 04 corrected in four places on `main`. So the Archive is not silent
about stars — it says something, to a different repository, in a shape this map is not replacing.

**Left alone, and the divergence recorded.** The Archive's promise is that it shows the previous
Design as it was; a link corrected to today's repository would be a false claim about the past. ADR-0010
already rules backporting out of scope ("Frozen is frozen, including fixes"), and this adds nothing to
that ruling — it only records that the divergence exists, so the next reader does not file it as a bug.
Carried into the map's Out of scope.

### 4. `old.rnui.dev` — **no, structurally**

Not by a check. `old` is a branch in a **separate Vercel project** whose Production branch is `old`,
so a change on `main` cannot reach it at all. There is no mechanism to name because none is needed,
and no deployment could be configured to carry the control without merging into a frozen Design.

### 5. ADR-0010 is wrong as written, and this map amends it

ADR-0010 states, of project 559028:

> "nothing writes to it at all — measured, not inferred: no deployed build compiles its
> `phc_oFZiXjSi…` key, and `www.rnui.dev` and `old.rnui.dev` both compile 117415's."

**False today.** The measurement covered two hostnames. `rnui-dev-git-feat-studio-dark-…vercel.app`
answers 200 and compiles `phc_oFZiXjSi…` — measured 2026-10-05 by fetching each deployment's JS
assets and grepping them, not by reading an env var.

The sentence's *intent* survives — no **visitor** traffic reaches 559028 — but the claim as phrased
reads as settled and is not, which is the exact failure mode the ADR names two paragraphs later: "each
time the word outlived the thing it named." A false "measured, not inferred" is the most expensive
kind of sentence in `docs/adr/`.

**Amended in this effort, as its own commit** — the same treatment ticket 04 gave its URL correction,
for the same reason: a one-line truth does not get reviewed as part of a star button. The replacement
says what is true — no build **serving a hostname** compiles that key, and branch deployments still
do, because Vercel hands every branch deployment the Preview environment's variables, which is the
same scoping rule the ADR's own second paragraph rests on.

### What this settles elsewhere

**Ticket 09** asked whether the site should acknowledge a star the visitor made elsewhere, and named
two dependencies. Both are now answered: ticket 05 already put `star_clicked` on the control, so
09's PostHog-only option **is** 05's decision and needs no second one; and 09's surface question —
"on `old` and the Preview, with a number nothing will ever refresh" — resolves to *there is no such
surface any more*. The Archive cannot carry the control and the Preview hostname 308s, so a visible
acknowledgement would exist on exactly one surface and could not be contradicted by a second. 09's
remaining question is the one it was really asking: does the live site narrate an action it cannot
observe.

### Carried into the spec, not decided here

- One environment predicate, one place, both layouts, with a test pinning its truth table.
- A first-step verification that the variable is actually injected into the preview build.
- An out-of-scope statement on the Archive's alias link, so it is never mistaken for drift this map
  left behind.

## Comments