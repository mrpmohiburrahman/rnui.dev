import { Suspense } from "react"
import type { Metadata } from "next"

import { NOTES } from "@/data/notes"

import { FoldIndex, FoldList } from "@/components/blog/fold-index"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes from the rnui.dev maintainer on React Native tools and the apps we build.",
}

export default function BlogPage() {
  return (
    <main className="mx-auto w-full max-w-[760px] px-[22px] pb-[120px] pt-[36px]">
      <p className="font-mono text-label text-acc">Blog</p>
      <h1 className="mt-[8px] text-detail font-semibold tracking-[-0.02em] text-t1">
        Notes
      </h1>
      <p className="mt-[8px] max-w-[58ch] text-[15px] leading-[1.5] text-t2">
        Stack picks, routing, state, and the services that ship an app.
      </p>
      <p className="mt-[10px] font-mono text-[10px] uppercase tracking-[0.12em] text-t3">
        Notes from the maintainer
      </p>
      <Suspense fallback={<FoldList notes={NOTES} />}>
        <FoldIndex notes={NOTES} />
      </Suspense>
    </main>
  )
}
