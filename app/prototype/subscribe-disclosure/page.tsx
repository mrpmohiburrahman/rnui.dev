// app/prototype/subscribe-disclosure/page.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 04, `.scratch/subscribe-popup/`.
//
// /prototype/subscribe-disclosure — the consent paragraph, three ways, side
// by side, each inside the real popup shell. Built because the maintainer
// asked to see all the options before choosing between them.
//
// No query parameter and no catalogue underneath: this page compares three
// static strings, so unlike app/prototype/subscribe-popup/page.tsx it has no
// host page to gate and needs no `searchParams` read to stay dynamic.

import { DisclosureOptionsPrototype } from "@/components/prototype/disclosure-options-prototype"

export default function Page() {
  return <DisclosureOptionsPrototype />
}