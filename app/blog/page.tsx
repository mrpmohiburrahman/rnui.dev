import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing about the React Native stack and the tools used on rnui.dev.",
}

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-[720px] pb-28">
      <h1 className="text-hero text-t1">Blog</h1>
      <article className="mt-10 border-t border-line pt-6">
        <p className="font-mono text-[11px] text-t3">2026-11-06</p>
        <h2 className="mt-3 text-section text-t1">
          <Link
            href="/blog/react-native-stack-2026"
            className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-acc focus-visible:outline-offset-4"
          >
            The React Native stack I start with in 2026
          </Link>
        </h2>
        <p className="mt-3 max-w-[620px] text-sm leading-6 text-t2">
          Nine areas for a new production app. Each pick names its limit.
        </p>
      </article>
    </div>
  )
}
