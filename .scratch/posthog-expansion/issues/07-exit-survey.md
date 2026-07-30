# 07 — One exit survey

Status: ready-for-human

## Problem

`surveys_opt_in` is null and zero surveys exist. Every signal the site has is behavioural:
what visitors clicked, how long a page took. Nothing records what they were looking for and
whether they found it.

For a catalogue whose whole job is "help me find a component like that", the most valuable
unknown is the search that returned nothing useful. Behaviour cannot distinguish "browsed
happily and left satisfied" from "could not find it and gave up" — both look like a session
that ends.

Surveys are free up to 250 responses per month. At ~1,100 human visitors per 90 days, a
low-frequency survey will not come close.

`ready-for-human` because the wording is an editorial decision, not an implementation one.

## Work

1. Enable surveys in project settings.
2. Ship exactly one survey. Resist adding a second — this site does not have the traffic to
   support two without annoying people.

   Proposed: a single open question, shown once per person, on the catalogue only, after
   ~45 seconds on page, never on a first pageview, and never on the legal pages.

   > **Didn't find what you were looking for?**
   > What were you searching for? (optional)

3. Target it away from AI-agent traffic (see ticket 01) so crawlers do not consume the quota.
4. Review responses monthly. If a component keeps being asked for and does not exist, that is
   a contribution request, not a UI problem — route it to the repo.

## Acceptance

- One survey is live, capped to one response per person.
- It does not appear on a visitor's first pageview.
- Responses are readable in PostHog and the first month's themes are summarised under
  `## Comments`.

## Open question for the maintainer

Is a survey wanted at all? It is the only qualitative instrument available and it is free, but
it is also the only thing in this whole spec that interrupts a visitor. Reasonable to decline.
