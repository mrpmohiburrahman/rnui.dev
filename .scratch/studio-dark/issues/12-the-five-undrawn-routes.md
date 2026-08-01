# 12 — The five routes the mock does not draw

Status: ready-for-agent
Blocked by: 02, 04

Spec decision 1 puts all ten routes in scope, and names these five as the ones with no mock:
`/aboutus`, `/contactus`, `/subscribe`, `/privacypolicy`, `/termsofservice`. They inherit the
header, the rail, the `<main>` box and the footer from ticket 04, and every colour, type step,
radius and duration from ticket 02. What is left is their bodies, and those are **derived** from
the mock's vocabulary rather than ported from it, because `assets/new-ui/` draws none of them —
`grep -rn "aboutus\|contactus\|privacy\|terms" assets/new-ui/*.html` returns nothing.

**Spec checkpoint 3 applies to this ticket and to no other.** *"Before the five undrawn routes are
built. Their designs are invented rather than ported. Present them; do not ship them unreviewed."*
So the order of work is: read this, agree the treatments with the maintainer, then build. A
treatment in this file is a proposal until the maintainer has seen it, and the `## Open questions`
section at the bottom is the list of things this ticket deliberately did not decide alone.

What the presentation has to cover is: the five treatments in `## Work`, the four `## Open
questions`, and one judgement — that `/subscribe` and the footer's NOTIFY column, visible together
on one screen at 1440×900, each say something the other does not. The column asks, the page
explains; a person reading both should not be able to ask *"why is this here twice"*. That last one
is the maintainer's eye at checkpoint 3 and deliberately not an acceptance bullet: no agent can
evaluate it, and left in `## Acceptance` it would hold `Status: resolved` open for ever.

## Problem

All five predate every decision in `CONTEXT.md` and every ADR. None of them was touched by
`ui-ux-overhaul`, which restyled the catalogue and left these alone; between them they are 718
lines that speak a different visual language from the site they hang off.

### `/aboutus` is a personal CV with a dead button and a wrong link

`app/aboutus/page.tsx` is a two-column grid (`:11`) inside a `max-w-7xl` container (`:9`). The
left column is an "Available for work" badge on `bg-gray-300` with a `bg-green-500` dot
(`:14-17`), the line "Mobile App Developer (React Native)" (`:19`), an `h1` reading
"MD. MOHIBUR RAHMAN" at `text-4xl font-bold md:text-4xl` (`:22-24`) and three paragraphs of CV
prose at `text-sm text-gray-500 sm:text-xl` (`:25-36`). The right column is "Other Projects"
(`:53-55`), a `bg-black` hairline (`:56`) which is invisible against a dark canvas, four project
links (`:57-98`) and a "Hire Me" button (`:101-107`).

Two things on it are false, which spec decision 2 does not allow — *"Nothing on screen lies"*. The
"Hire Me" button's `href` is `"#"` (`:102`), so it goes nowhere. And the fourth project,
`react-native-cone-slider`, links to `https://github.com/mrpmohiburrahman/react-native-squish-button`
(`:90-92`) — the same URL as the third entry directly above it (`:80-82`). There is also a
commented-out "All Achievements" block at `:39-49` pointing at `assets.website-files.com`, a
Webflow template asset host.

### `/contactus` has no `h1`, and its form is black-on-black in dark mode

`app/contactus/page.tsx` is `text-center` (`:84`) with an `h2` reading "Contact Us" at
`text-3xl font-bold md:text-5xl` (`:86`) — the page's largest text is an `h2` and there is no `h1`
anywhere in the file. The four fields are `border-black … text-black` with no background class
(`:105`, `:118`, `:133`, `:146`). next-themes writes `style="color-scheme"` onto `<html>` (the
mechanism `app/layout.tsx:27-30` describes), so in dark mode the UA paints those fields dark and
`text-black` is typed onto them. The submit button cycles `bg-black` → `bg-gray-500` →
`bg-green-500` (`:154-162`) with `transition-colors duration-300`, and the two result messages are
`text-red-500` and `text-green-500` (`:172`, `:175`). Not one of those seven colours is in the
28-token table ticket 02 lands.

It is also the only client component on the site that still imports Firestore at module scope
(`:4-6`) and writes from the browser — `addDoc(collection(db, "userFeedback"), …)` at `:51-58`.
`next.config.ts:22` redirects `/feedback` here permanently-not-permanently, so this is the site's
only feedback surface.

### `/subscribe` is a second copy of the newsletter write, and about to have a third neighbour

`app/subscribe/page.tsx:36-39` performs the same `addDoc(emailsRef, { email, createdAt })` as
`components/newsletter-form.tsx:46-49`, against the same collection constant
(`subscribe/page.tsx:13-14` and `newsletter-form.tsx:13-14` are byte-identical lines). It differs
in one behaviour: `newsletter-form.tsx:54` writes
`localStorage.setItem("newsletterSubscribed", "true")` and `/subscribe` writes nothing, so
subscribing on the page leaves the form elsewhere on the site still asking.

Ticket 04 step 12 moves the write behind a server action, `app/actions/subscribe-email.ts`, and
says in as many words: *"Leave `app/subscribe/page.tsx` alone; its duplicate copy of the same write
is ticket 12's, and the new action is what it should call."* Ticket 04 also makes the newsletter a
fourth footer column, `NOTIFY`, on every one of the ten routes (spec decision 9), so from that
commit onwards `/subscribe` and the footer column sit on the same screen at the same time.

Visually the page is Aceternity boilerplate: a `max-w-md` card with `shadow-input bg-white
dark:bg-black` (`:52`), an `h2` reading "Awesome React Native UI" (`:53-55`), a gradient submit
button (`:83-91`) and a `BottomGradient` helper drawing cyan and indigo hairlines (`:97-104`).
`shadow-input` is not defined anywhere — `tailwind.config.ts` has no `boxShadow` extend and
`app/globals.css` defines `.input-shadow` and `.input-shadow-glow` (`:301`, `:318`), which are
different names used by `InputButton` (`components/ui/input.tsx:66`, `:78`). The class compiles to
nothing.

### The two legal pages are a template, and their headings are not headings

`app/privacypolicy/page.tsx` and `app/termsofservice/page.tsx` share one layout. Each opens with a
full-bleed tinted band, `bg-[#f2f2f7] dark:bg-gray-900 py-6 md:h-64 w-full`
(`privacypolicy:11`, `termsofservice:8`) — 256px of colour before the first sentence, and the only
full-bleed band anywhere on the site. Each then has an `h1` at `text-3xl font-bold md:text-5xl`,
a `text-[#808080]` "Last Updated as of Dec 1, 2024" line (`privacypolicy:14-16`,
`termsofservice:11-13`), a centred `max-w-3xl` intro paragraph, and an `<h6>` immediately below the
`h1` (`privacypolicy:34-36`, `termsofservice:30-34`) — a five-level jump.

The actual section headings are not headings at all. All eight in the privacy policy
(`:41`, `:56`, `:72`, `:86`, `:101`, `:113`, `:136`, `:153`) and all five in the terms
(`:39`, `:52`, `:65`, `:79`, `:92`) are `<p className="text-sm font-bold">`, so a screen reader's
heading list for either page is one `h1` and one `h6`. The bulleted lists inside them are `<br />•`
runs inside a single `<p>` (`privacypolicy:62-66`, `:91-95`, `:118-122`), not `<ul>`. The three
in-body links are `underline text-purple-400` (`:126`, `:143`, `:170`). Both files close on a
`bg-[#e2e2e2]` hairline (`privacypolicy:164`, `termsofservice:102`) — invisible in dark mode. Six
of the 21 hardcoded-hex classes ticket 02 counts across `app/` and `components/` are in these two
files.

### And three of the five end in 384px of nothing

`aboutus:7`, `contactus:82` and `subscribe:52` all carry `mb-96` — 384px of bottom margin, which
exists to clear a `fixed` footer arrangement that ticket 04 deletes. After ticket 04 the footer is
in flow, so `mb-96` is simply a gap.

## Work

Every colour, radius, type step and duration below is a ticket-02 token; the hex codes and pixel
values are quoted so the right token can be identified, **not so they can be typed into these
files**. No literal hex belongs in any of the five.

Nothing here introduces a value the mock does not already contain. The vocabulary these five pages
are built from is exactly seven things:

| element | spec | drawn at |
|---|---|---|
| mono eyebrow | JetBrains Mono `font-size:9px;letter-spacing:0.14em;color:{{ t3 }};padding-bottom:2px` | `Catalogue.dc.html:152` |
| page title | `font-size:29px;font-weight:500;line-height:1.15;letter-spacing:-0.02em;color:{{ t1 }};text-wrap:pretty` | `Catalogue.dc.html:64`; Specimen step `hero`, `29 / 500 / -2% · hero` (`:139`) |
| section head | `font-size:17px;font-weight:500;letter-spacing:-0.01em;color:{{ t1 }}` | `Catalogue.dc.html:86` with `headSize:17` at `:251`; Specimen step `section` (`:140`) |
| prose | `font-size:13px;line-height:1.55;color:{{ t2 }};max-width:520px` | `Catalogue.dc.html:102`; the 11.5px/1.5 variant at `:149`, `:158` |
| body-sm | `12 / 400 · contributor, body-sm` | `Specimen.dc.html:142` |
| panel | `padding:14px;border-radius:12px;border:1px solid {{ line }};background:{{ well }}` | `Detail.dc.html:51` (`cardBg`, renamed `--well` by ticket 02 step 2) |
| E0 hairline | `0 0 0 1px rgba(255,255,255,0.07)` dark / `0 0 0 1px rgba(16,18,22,0.10)` light | `Specimen.dc.html:151` |

Plus the 4px spacing scale — 4 icon gap, 8 control gap, 12 card meta, 16 mobile gutter, 24 grid
column gap, 28 grid row gap, 40 detail columns (`Specimen.dc.html:155-159`) — which ticket 02 step
6 maps onto Tailwind's own `1 2 3 4 6 7 10` and adds no key for.

### 1 — The column, on all five

Ticket 04 puts the rail in the layout flex for every route and ticket 05's acceptance requires it:
*"With JavaScript disabled at 1440×800, the served HTML of `/aboutus` contains a real `<aside>`
with one `<a href="/products?category=…">` per Category"*
(`.scratch/studio-dark/issues/05-rail-categories-and-contributors.md:296-298`), which
`tests/e2e/served-html.spec.ts:105` already asserts by looping `[...ROUTES, "/aboutus"]`. So these
five keep the rail. Do not hide it, and do not touch that test.

The consequence has to be handled here: at 1440px, `<main>` is 1440 − 232 rail − 26 − 26 gutters =
1156px wide, and a 1156px line of 13px prose is not readable. So every one of the five wraps its
body in a `max-width:720px` column — the width the mock gives its own widest text-bearing panel
(`Catalogue.dc.html:99`, `:112`) — with paragraphs at the 520px the mock uses for prose (`:65`,
`:102`, `:119`). `<main>`'s `padding:22px 26px 34px` comes from ticket 04 (`Catalogue.dc.html:59`);
no page adds its own container. Delete the `max-w-7xl`/`max-w-5xl` wrappers at `aboutus:9`,
`contactus:84`, `privacypolicy:20` and `termsofservice:17`, and delete `mb-96` at `aboutus:7`,
`contactus:82` and `subscribe:52`.

Each of the five opens the same way: mono eyebrow, then the 29px title as a real `h1`, then
optionally one 13px/1.5 `t2` lede at `max-width:520px`. Eyebrows are `ABOUT`, `CONTACT`, `NOTIFY`,
`PRIVACY` and `TERMS`. This is the mock's own opening grammar — a mono label above a large left-
aligned statement — and it is what makes five pages nobody drew look like the same site.

Everything is left-aligned. The mock aligns left even where a centred layout would be the obvious
choice: both empty states are `align-items:flex-start` (`Catalogue.dc.html:99`, `:112`). The
centring at `contactus:84`, `privacypolicy:22-23` and `termsofservice:19-20` is the template's idea,
not the design's.

### 2 — `/aboutus`

Eyebrow `ABOUT`, `h1` at the 29px step. Then three sections, each headed at the 17px step.

**What this is.** One 13px/1.55 `t2` paragraph at 520px. The footer's own brand blurb already says
it in the mock's voice — *"An open catalogue of React Native UI recordings. Every recording belongs
to its contributor."* (`Catalogue.dc.html:149`, with ticket 04 step 11's `entry` → `recording`) —
so this section expands that sentence rather than inventing a second description. It is the one
place on the site that can say what the catalogue is for, which the hero (29px, deliberately
sparse) does not have room for.

**Who maintains it.** Reuse the Detail's Contributor card verbatim — this is a page about a person
and the mock already draws a person. `display:flex;align-items:flex-start;gap:12px;padding:14px;
border-radius:12px;border:1px solid {{ line }};background:{{ well }}` (`Detail.dc.html:51`), with
the 38px initials square at `width:38px;height:38px;border-radius:10px;background:{{ accSoft }};
border:1px solid {{ line }}` holding mono 11px in `acc` (`:52`), a mono eyebrow at
`font-size:8.5px;letter-spacing:0.14em;color:{{ t3 }};padding-bottom:3px` reading `MAINTAINED BY`
in place of `CONTRIBUTED BY` (`:54`), the name at `font-size:14px;line-height:1.3;color:{{ t1 }};
overflow-wrap:anywhere` (`:55`), and the link row at `font-size:12px;color:{{ acc }};
text-decoration:underline;text-underline-offset:3px` with `gap:10px` (`:56-58`). The three CV
paragraphs at `aboutus:25-36` become the card's body at 11.5px/1.45 `t2` (`Detail.dc.html:61`),
trimmed to what a visitor needs; the full CV is not what this page is for.

**Other projects.** The CONTRIBUTE column's treatment (`Catalogue.dc.html:151-155`): a mono eyebrow,
then one link per project at `font-size:11.5px;color:{{ acc }};text-decoration:underline;
text-underline-offset:3px` carrying the `↗` the mock puts on every external link, each followed by
its kind (`VS CODE EXTENSION`, `CHROME EXTENSION`, `REACT NATIVE COMPONENT`) in the mono eyebrow
treatment at `t3`. **Fix the href at `aboutus:90-92`** — `react-native-cone-slider` currently points
at `react-native-squish-button`, the same URL as the item above it. Delete the commented-out block
at `:39-49` and the `bg-black` hairline at `:56`; the section head and the 4px scale carry the
separation the rule was doing.

**The two false things.** The "Hire Me" button at `:101-107` becomes a real link to `/contactus` in
the primary treatment — `font-size:12.5px;font-weight:500;padding:9px 13px;border-radius:9px;
border:none;background:{{ acc }};color:{{ onAcc }}` with `outline:3px solid {{ acc }};
outline-offset:3px` on focus (`Catalogue.dc.html:104`) — or it is deleted. It cannot keep
`href="#"`. The "Available for work" badge at `:14-17` is a claim about the maintainer's
availability that only the maintainer can confirm; see open question 1.

**No stats row.** Ticket 06 folds the `277 / 24 / 18` trio into `Hero` along with the catalogue's
hero copy (`.scratch/studio-dark/issues/06-hero-stats-and-headings.md:123`, `:184`), so putting it
on `/aboutus` would mean either a second component or a prop split ticket 06 did not build. For a
page with 29 pageviews in 90 days that is not worth a refactor.

### 3 — `/contactus`

Eyebrow `CONTACT`, an `h1` at the 29px step reading "Contact us" — an `h1`, because `:86` is
currently an `h2` and the page has none. Keep the existing lede, "Fill the form if you have any
questions or feedback." (`:88`), at 13px/1.5 `t2`, 520px.

The form goes inside one panel: `padding:14px;border-radius:12px;border:1px solid {{ line }};
background:{{ well }}` (`Detail.dc.html:51`), `max-width:520px`, fields stacked with the 12px step
of the spacing scale between them. First and Last stay side by side above `sm`, on the 24px column
gap.

Each field is the header search field's own geometry: `height:34px;padding:0 11px;
border-radius:10px;border:1px solid {{ line }};background:{{ field }}` with the value at 12.5px in
`t1` and the placeholder in `t3` (`Catalogue.dc.html:19`, `:21`, `:231-232`). On focus, the border
becomes `acc` and the field gains `box-shadow:0 0 0 3px {{ accSoft }}` — which is what the mock
draws for a field carrying a value (`:233`) — plus the standard ring `outline:3px solid {{ acc }};
outline-offset:2px` (`Tile.dc.html:11`). The labels become the mono eyebrow above each field rather
than the current 14px `font-medium` (`:97`, `:110`, `:125`, `:138`): `FIRST NAME`, `LAST NAME`,
`EMAIL`, `MESSAGE`. Keep every `htmlFor`/`id` pair exactly as it is — they are correct today and
the eyebrow is a restyling of the `<label>`, not a replacement for it.

The textarea keeps its existing `min-h-44` (176px) from `:146` and changes only its border, radius
and background to match. The Specimen draws no multi-line field and gives no height for one;
inventing a number here would be inventing a type step. See open question 3.

Submit becomes the primary button (`Catalogue.dc.html:104`), full-width inside the panel.
`transition-colors duration-300` at `:154` becomes `duration-120` — 120ms ease-out is the mock's
one small-control state change, *"Filter chip add / remove"* (`Specimen.dc.html:163`); 300ms is not
one of the five duration keys ticket 02 adds. The three `bg-*` states at `:155-162` collapse: the
button stays in the accent treatment throughout and only its label changes, `Submit` →
`Submitting…` → `Submitted`, because the mock draws no disabled or success button colour.

The result messages at `:171-178` take the mock's one failure idiom — a mono eyebrow at
`font-size:9px;letter-spacing:0.14em` above a `font-size:12px;line-height:1.45` sentence, which is
how `Tile.dc.html:21-22` says *"This recording won't play in your browser. The source is still
there."* Success reads `SENT` in `acc` above the existing "Thank you for your feedback!"; failure
reads `NOT SENT` above the existing message. The colour of the failure eyebrow is open question 2 —
`Tile.dc.html:21` uses `#F5B3A4`, which ticket 02 did not declare as a token, is drawn only in dark
mode over `rgba(4,5,8,0.9)`, and has no light-mode counterpart. Until that is settled the failure
eyebrow is `t1`, which is measured (16.44 light / 16.8 dark on canvas, `spec.md:48-52`).

Behaviour is unchanged: the validation at `:29-45`, the write at `:51-58` and the five-second
success reset at `:72-79` all stay. Whether the write moves behind a server action the way the
newsletter's does is open question 4.

At 390px the fields take the mock's phone metrics — `min-height:40px` for the field
(`CatalogueMobile.dc.html:20`) and `min-height:44px` for the submit, which is the floor the Detail's
phone action bar uses (`Detail.dc.html:98`). The gutter is 14px (`CatalogueMobile.dc.html:13`).

### 4 — `/subscribe`, and why it is not the NOTIFY column

After ticket 04 these two exist on the same screen, so each has to be obviously the other's
complement or they read as a mistake.

**The NOTIFY column is the control.** It is in the footer of all ten routes, it is one line of
11.5px/1.5 `t2` body, one 34px field and one primary button, and it asks for nothing but an
address. It is what someone who has already decided uses.

**`/subscribe` is the explanation.** It is what the NOTIFY column's own `/subscribe` link goes to
(ticket 04 step 11), and it is the only place that can say what actually arrives, how often, that
the address is stored in Firestore and nothing else, and that there is no account behind it — the
same thing the footer's THIS DEVICE column says about saves and votes,
*"Your saves and votes are stored in this browser only. No account, no sign-in, nothing synced
between devices."* (`Catalogue.dc.html:158`). The page ends with the same field and the same button
the column has. The 90-day numbers support that reading: `/subscribe` took 35 pageviews from 35
people (`.scratch/posthog-expansion/issues/09-redesign-baseline-dashboard.md:84`) — every visit a
distinct person, nobody returning. It is a link destination, not a habit.

So: eyebrow `NOTIFY`, `h1` at the 29px step, a 13px/1.55 `t2` explanation at 520px, then the field
and the button. Delete the `max-w-md … shadow-input bg-white dark:bg-black` card at `:52` — the dead
`shadow-input` class with it — the `h2` at `:53-55`, the `BottomGradient` helper at `:97-104` with
its cyan and indigo, and the gradient button at `:83-91`. The `LabelInputContainer` helper at
`:106-118` goes too; a `flex flex-col gap-2` is the 8px step of the spacing scale.

Two behaviour changes, both required rather than opportunistic:

1. **Call `subscribeEmail` from `app/actions/subscribe-email.ts`** and delete the Firestore imports
   at `:4-7` and the `COLLECTION_NAME` constant at `:13-14`. This is the half of ticket 04 step 12
   that ticket 04 explicitly left here. The page stays `"use client"` for the pending state; a
   server action is a reference, not a bundle, which is the reason
   `app/actions/increment-view-count.ts` already states.
2. **Write `localStorage.setItem("newsletterSubscribed", "true")` on success**, the way
   `components/newsletter-form.tsx:54` does and this file does not. Without it, every later visit
   to any of the ten routes has the footer's NOTIFY column still asking for the address that was
   just given — which is precisely the "these are duplicates" reading this step exists to prevent.
   With it, the column collapses to its already-built subscribed state
   (`newsletter-form.tsx:72-73`) on the next load.

   **On the next load, not on the same render.** `newsletter-form.tsx:25` reads the key once on
   mount, and a `storage` event does not fire in the tab that wrote the key, so the column already
   on screen keeps asking until the next navigation. Making it react in place would mean a shared
   context or a `router.refresh()` that ticket 04 did not build, added by a ticket whose job is the
   five undrawn routes, for a page that took 35 pageviews in 90 days. Write the key here; the
   column reads it on the next load.

### 5 — `/privacypolicy` and `/termsofservice`, weighted to what they are

These two took **14 and 15 pageviews** respectively in 90 days, against `/products` at **3,554**
(`.scratch/posthog-expansion/issues/09-redesign-baseline-dashboard.md:81-89`) — four tenths of one
percent of the catalogue's traffic, and 14 people each. They are legal pages: they have to be
legible, correct and reachable. They do not get designed. Concretely, that means **no panels, no
dashed empty-state block, no stats, no illustration and no per-section decoration** — the effort
here is spent on the type, the tokens and the markup, and nowhere else.

Both files get the same six changes:

1. **Delete the tinted band** at `privacypolicy:11-18` and `termsofservice:8-15`. `bg-[#f2f2f7]
   dark:bg-gray-900` with `md:h-64` is the only full-bleed colour band on the site and it has no
   counterpart anywhere in `assets/new-ui/`. It becomes the standard opening: mono eyebrow
   (`PRIVACY`, `TERMS`), the existing `h1` text at the 29px step, and the "Last Updated as of Dec 1,
   2024" line in the mono metric treatment — `10 / 400 · metrics, tabular` in `t3`
   (`Specimen.dc.html:143`), uppercased with CSS.
2. **Delete the `<h6>`** at `privacypolicy:34-36` and `termsofservice:30-34`. "PRIVACY POLICY" under
   an `h1` reading "PRIVACY POLICY", and "GENERAL TERMS & CONDITIONS" under "TERMS OF SERVICE", say
   nothing the title has not; the `border-b border-gray-300` rule under each becomes a single
   `border-line` hairline if a rule is wanted at all.
3. **Promote the section heads to real `<h2>`s** at the 17px step — all eight in the privacy policy
   (`:41`, `:56`, `:72`, `:86`, `:101`, `:113`, `:136`, `:153`) and all five in the terms (`:39`,
   `:52`, `:65`, `:79`, `:92`). They are `<p className="text-sm font-bold">` today, so the heading
   outline of either page is currently one `h1` and one `h6`. Sentence case rather than the current
   all-caps: the mock reserves capitals for the mono eyebrow, and 17px Space Grotesk in caps is not
   a step the Specimen has.
4. **Make the `<br />•` runs into `<ul>`/`<li>`** — `privacypolicy:62-66`, `:91-95`, `:118-122` and
   the equivalents in the terms. Body at 13px/1.55 `t2` at 520px, list items on the 8px step.
5. **Retoken the six hardcoded colours**: `text-[#808080]` → `t3`, `bg-[#e2e2e2]` → a `border-line`
   hairline (`privacypolicy:164`, `termsofservice:102`), `bg-[#f2f2f7] dark:bg-gray-900` gone with
   the band. The three `underline text-purple-400` links (`privacypolicy:126`, `:143`, `:170`)
   become `color:{{ acc }};text-decoration:underline;text-underline-offset:3px`
   (`Catalogue.dc.html:153`).
6. **Change not one word of the legal text**, and not the date. "Last Updated as of Dec 1, 2024" is
   20 months old as of today, but the text it describes has not changed, so the date is still
   accurate; making it say something else would be a legal edit dressed up as a design one. If the
   maintainer wants it revised that is separate work with a separate reviewer.

### 6 — Five titles

None of the five exports `metadata` — `grep -n "metadata" app/{aboutus,contactus,subscribe,privacypolicy,termsofservice}/page.tsx` returns nothing — so all five serve the root title from
`data/meta-data.ts:21`, "Awesome React Native UI - A list of community made animations", re-exported
at `app/layout.tsx:20`. Add a one-key `export const metadata = { title: … }` to each. It merges with
the layout's rather than replacing it, it costs four lines per file in files this ticket is already
rewriting, and "correct" for a legal page includes what the tab and the search result say.

### 7 — Checks

`pnpm check-types && pnpm lint && pnpm test && pnpm build`, then the Playwright suite —
`tests/e2e/served-html.spec.ts` in particular, whose sidebar loop at `:105` covers `/aboutus`, and
`tests/next-config.test.ts:70-81`, which asserts the `/feedback` → `/contactus` redirect still
exists.

## Acceptance

- The maintainer has seen these five treatments and agreed them **before** any of the five files is
  rewritten. Spec checkpoint 3. Record the date and what changed in `## Comments`.
- All five routes render in both modes with the ticket-04 header, rail and footer, and a body whose
  first three elements are a mono eyebrow at 9px/+0.14em in `t3`, exactly one `<h1>` at the 29px
  step, and prose in `t2`.
- `grep -nE '#[0-9A-Fa-f]{3,8}\b' app/aboutus/page.tsx app/contactus/page.tsx app/subscribe/page.tsx app/privacypolicy/page.tsx app/termsofservice/page.tsx`
  returns no matches, and `grep -nE 'text-(gray|neutral|purple|red|green|zinc|stone|cyan|indigo)-'`
  over the same five returns no matches.
- `grep -n "mb-96\|max-w-7xl\|max-w-5xl\|max-w-md\|shadow-input" ` over the same five returns
  nothing.
- Each of the five has exactly one `<h1>`, and running an accessibility tree dump on
  `/privacypolicy` lists one `h1` and eight `h2`s; on `/termsofservice`, one `h1` and five `h2`s.
  No `<h6>` remains in either.
- `/privacypolicy` and `/termsofservice` contain no `<br />•` sequence and at least one `<ul>` each;
  the text of every section, and both "Last Updated as of Dec 1, 2024" lines, are byte-identical to
  what they say today. Diff the extracted text, not the markup.
- On `/aboutus`, no anchor has `href="#"`, and the `react-native-cone-slider` link resolves to a
  URL containing `cone-slider` rather than `squish-button`.
- On `/contactus` in dark mode, the typed value in every field and the placeholder in every field
  are both legible — measure the computed foreground against the computed field background and
  record both ratios; neither may be below 4.5:1. This is the specific defect at `:105`, `:118`,
  `:133`, `:146`, so it is checked rather than assumed.
- Submitting `/contactus` with an invalid address still shows the validation message, and a
  successful submit still writes one document to `userFeedback` and still clears after five seconds.
- `/subscribe` contains no `firebase` import: `grep -n "firebase" app/subscribe/page.tsx` returns
  nothing, and the client bundle for `/subscribe` in the build output contains no Firestore module.
- Subscribing on `/subscribe` writes `newsletterSubscribed=true` to localStorage, and the footer's
  NOTIFY column shows its subscribed state on the next load of any route — not on the same render,
  for the reason step 4 gives.
- Every interactive element on all five is reachable by Tab and draws the mock's ring —
  `outline:3px solid {{ acc }}` at 2px offset on fields and 3px on buttons and links.
- At 390px all five read as one column with the 14px phone gutter, every control is at least 44px
  high, and nothing overflows horizontally.
- `tests/e2e/served-html.spec.ts` passes, including its `/aboutus` sidebar assertion at `:105`;
  `tests/next-config.test.ts` passes; `pnpm check-types`, `pnpm lint`, `pnpm test` and `pnpm build`
  all pass.
- Under `prefers-reduced-motion: reduce`, the `/contactus` submit button's colour transition
  computes `transition-duration: 0s` — ticket 02 step 7's CSS rule reaching a surface that uses it.
- All five carry their own `<title>`, and none of them serves the root title.

## Depends on

**Ticket 02**, for every value on all five pages. There is no mock to copy from here, so these
routes are built *entirely* out of the token table, the type scale and the radius scale — an
eyebrow that is not the same 9px/+0.14em `t3` as the footer's column labels, or a title that is not
the same 29px step as the hero, is the whole failure mode this ticket is trying to avoid. Landing
this before 02 means hardcoding the same hexes the two legal pages are being cleaned of.

**Ticket 04**, for the shell and for two specific hand-offs. The header, the rail's position and the
footer all come from it, and the footer's last row is what makes four of these five reachable at all
once `components/site-footer.tsx:20-54` is deleted (ticket 04 step 11, acceptance `:361-362`).
Beyond that, ticket 04 step 12 explicitly defers `app/subscribe/page.tsx` to this ticket and creates
the `app/actions/subscribe-email.ts` that step 4 above calls; and spec decision 9's NOTIFY column,
which step 4 exists to differentiate `/subscribe` from, does not exist until ticket 04 lands. Doing
this first means differentiating `/subscribe` from something that is not there.

**A coupling the spec's ticket table does not show.** The table annotates ticket 12 with
"checkpoint 3" and lists no blockers at all. The real blockers are 02 and 04, for the reasons above.
There is also a soft coupling to **ticket 05**, which does not block: its acceptance requires the
rail in the served HTML of `/aboutus` (`05:296-299`), and `tests/e2e/served-html.spec.ts:105`
already asserts it. That is what forces step 1's 720px column instead of a full-width `<main>`, and
it means no step in this ticket may hide the rail on a prose route.

## Open questions

These are the four places where the mock gave no answer. Each is named rather than decided, per
checkpoint 3.

1. **"Available for work"** (`app/aboutus/page.tsx:14-17`). A badge asserting the maintainer's
   employment availability, on the About page of a community catalogue. Spec decision 2 says
   nothing on screen lies, so it either stays and is true, or goes. Only the maintainer knows
   which. The same question covers whether "Hire Me" (`:101-107`) becomes a link to `/contactus` or
   is deleted.
2. **There is no error colour in the design.** Ticket 02 declares 28 tokens and not one of them is a
   destructive or warning colour. The mock's only failure treatment is `Tile.dc.html:21`,
   `◺ DECODE FAILED` in `#F5B3A4` — drawn once, in dark mode only, over an
   `rgba(4,5,8,0.9)` scrim, with no light-mode value and no contrast ratio published against
   `canvas`, `panel` or `well`. `/contactus` needs a failure state and so, eventually, will anything
   else that can fail. Either `#F5B3A4` gets promoted to a token with a light-mode counterpart and a
   measured ratio, or failure is carried by the mono eyebrow's wording alone in `t1`. This ticket
   defaults to the second and does not promote a token, because promoting one is ticket 02's table
   to change.
3. **No multi-line field is drawn anywhere.** Every field in `assets/new-ui/` is a 34px single-line
   input (`Catalogue.dc.html:19`) or its 40px phone form (`CatalogueMobile.dc.html:20`). The
   `/contactus` message box keeps its existing 176px `min-h-44` for that reason. If the maintainer
   wants a specified height it is one number, and this is where to say it.
4. **Whether `/contactus` should stop writing Firestore from the browser.**
   `app/contactus/page.tsx:4-6` imports the client SDK at module scope, exactly as
   `components/newsletter-form.tsx` did before ticket 04 moved it behind a server action. The
   difference is scope: the newsletter form is in the root layout after decision 9, so its imports
   land in the shared chunk on all ten routes, whereas `/contactus`'s land only on `/contactus` — 18
   pageviews in 90 days
   (`.scratch/posthog-expansion/issues/09-redesign-baseline-dashboard.md:86`). Mirroring
   `app/actions/subscribe-email.ts` is roughly ten lines and would leave one pattern rather than
   two. It is not done here because it is a behaviour change on a route this ticket is meant to be
   restyling, and because the performance argument that justified it for the newsletter does not
   transfer. Cheap to add if the maintainer wants the consistency.
