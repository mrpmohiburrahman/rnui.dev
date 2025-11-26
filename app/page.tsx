// app/page.tsx
import type { ItemType } from "@/data/items"

import { FadeIn } from "@/components/cult/fade-in"
import DirectoryPageClient from "@/components/directory-page-client"
import { DirectorySearch } from "@/components/directory-search"
import { Hero } from "@/components/hero"
import NewsletterForm from "@/components/newsletter-form"

import { getProducts } from "./actions/get-products"

const FEATURED_IDS: string[] = []

async function Page({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const params = await searchParams
  const data = await getProducts(params.search)
  const filteredFeaturedData = data.filter((d: ItemType) =>
    FEATURED_IDS.includes(d.id)
  )

  return (
    <div
      className="max-w-full px-2 md:pl-4 md:pr-0 pt-2"
    // style={{ borderWidth: 1, borderColor: "purple" }}
    >
      <FadeIn>
        <DirectoryPageClient
          sortedData={data}
          filteredFeaturedData={filteredFeaturedData}
        >
          <div
            className="grid grid-cols-1 md:grid-cols-6 lg:gap-16 py-2 relative"
          // style={{ borderWidth: 1, borderColor: "purple" }}
          >
            {/* First Column */}
            <div className="col-span-1 md:col-span-2 z-10">
              <Hero title="Awesome React Native UI">
                <DirectorySearch />
              </Hero>
            </div>

            {/* Second Column */}
            {/* Newsletter Subscription Form */}
            <div className=" col-span-1 md:col-span-4 mt-6 md:mt-0 min-w-[300px] p-6 bg-card dark:bg-secondary rounded-lg shadow-elevationLight">
              <NewsletterForm />
            </div>
          </div>
        </DirectoryPageClient>
      </FadeIn>
    </div>
  )
}

export default Page
