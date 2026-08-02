// app/page.tsx
import { CataloguePage } from "@/components/catalogue-page"
import { Hero } from "@/components/hero"

import { getRecordings } from "./actions/get-recordings"

async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const data = await getRecordings(params.search)

  return (
    <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
      <CataloguePage recordings={data} treatment="framed">
        <div className="grid grid-cols-1 md:grid-cols-6 lg:gap-16 py-2 relative">
          <div className="col-span-1 md:col-span-2 z-10">
            {/* The search field moved into the site header (ticket 04 step 5),
                which is the only one now — two boxes on one page would not agree
                with each other. The Hero stays for now: ticket 06 rewrites it,
                and tests/e2e/home.spec.ts:48 pins its h1 in the meantime. */}
            <Hero title="Awesome React Native UI" />
          </div>
        </div>
      </CataloguePage>
    </div>
  )
}

export default Page
