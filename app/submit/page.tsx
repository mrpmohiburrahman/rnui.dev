// app/submit/page.tsx
//
// The route, and the only reason it is not the form itself: the form suggests the
// Contributors the catalogue already holds, and computing that list means reading
// `data/recording.ts`, which carries all 280 Recordings. A client component that
// imported it would ship every Recording to every visitor who opened the form, so
// the names are computed here and passed in — the split `app/contributors/` and
// its `contributor-rows.tsx` already make.
//
// The title lives in app/submit/layout.tsx, which is a server component too.
//
// public-submissions ticket 13.
import { getUniqueContributors } from "@/data/recording"

import SubmitForm from "./submit-form"

export default function SubmitPage() {
  return <SubmitForm contributors={getUniqueContributors()} />
}
