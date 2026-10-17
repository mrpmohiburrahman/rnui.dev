// app/prototype/subscribe-spacing/page.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 04, `.scratch/subscribe-popup/`.
//
// /prototype/subscribe-spacing — the chosen option C copy at three levels of
// breathing room, so the maintainer can point at the one that is not cramped.
//
// Static page, no query parameter and no catalogue underneath: the three cards
// are one string at three spacings, so unlike app/prototype/subscribe-popup/page.tsx
// there is no host page to gate and no `searchParams` read needed to stay dynamic.

import { SubscribePopupSpacingPrototype } from "@/components/prototype/subscribe-popup-spacing-prototype"

export default function Page() {
  return <SubscribePopupSpacingPrototype />
}