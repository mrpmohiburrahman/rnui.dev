// app/products/page.tsx

import type { ReactElement } from "react"

import EntriesPageClient from "@/components/entries-page-client"

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
      <EntriesPageClient
        sortedData={data}
        search={search}
        category={category}
        label={label}
        tag={tag}
        author={author}
      />
    </div>
  )
}

export default EntriesPage
