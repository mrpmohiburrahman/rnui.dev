// app/products/page.tsx

import type { ReactElement } from "react"

import ProductsPageClient from "@/components/products-page-client"

// Adjust the import path if necessary
import { getProducts } from "../actions/get-products"

interface PageProps {
  searchParams: {
    search?: string
    category?: string
    label?: string
    tag?: string
    author?: string
  }
}

const ProductsPage = async ({
  searchParams,
}: PageProps): Promise<ReactElement> => {
  const { search, category, label, tag, author } = searchParams
  const data = await getProducts(search, category, label, tag, author)

  return (
    <div className="flex">
      <ProductsPageClient
        sortedData={data}
        filteredFeaturedData={null}
        search={search}
        category={category}
        label={label}
        tag={tag}
        author={author}
      />
    </div>
  )
}

export default ProductsPage
