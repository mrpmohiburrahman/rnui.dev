// app/products/page.tsx

import type { ReactElement } from "react"
import { BoxIcon, Hash, Search, TagIcon, User } from "lucide-react"

import { CataloguePage } from "@/components/catalogue-page"
import { GradientHeading } from "@/components/cult/gradient-heading"

// Adjust the import path if necessary
import { getEntries } from "../actions/get-entries"

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    label?: string
    tag?: string
    author?: string
  }>
}

const EntriesPage = async ({
  searchParams,
}: PageProps): Promise<ReactElement> => {
  // Next.js 15 requires awaiting searchParams
  const params = await searchParams
  const { search, category, label, tag, author } = params
  const data = await getEntries(search, category, label, tag, author)

  return (
    <div className="flex">
      <div className=" max-w-full pt-4">
        <CataloguePage entries={data} treatment="plain">
          {(search || category || label || tag || author) && (
            <div className="md:mr-auto mx-auto flex flex-col items-center md:items-start">
              <div className="flex mb-1 justify-center md:justify-start">
                {search && (
                  <Search className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                )}
                {category && (
                  <BoxIcon className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                )}
                {author && (
                  <User className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                )}
                {label && (
                  <Hash className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                )}
                {tag && (
                  <TagIcon className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                )}
                {search && "search"}
                {category && "category"}
                {label && "label"}
                {tag && "tag"}
                {author && "Author"}
              </div>
              <GradientHeading size="xxl">
                {search || category || label || tag || author}
              </GradientHeading>
            </div>
          )}
        </CataloguePage>
      </div>
    </div>
  )
}

export default EntriesPage
