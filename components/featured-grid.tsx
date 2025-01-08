"use client"

import type React from "react"
import type { ItemType } from "@/data/items"

import { ResourceCard } from "./resource-card"

export const FeaturedGrid: React.FC<{ featuredData: ItemType[] }> = ({
  featuredData,
}) => {
  return (
    <div className="w-full mx-auto max-w-7xl bg-neutral-50/40 dark:bg-neutral-950/40 border border-dashed border-black/10 py-3 px-3 rounded-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-[200]">
        {featuredData.map((data, index) => (
          <ResourceCard
            key={data.id}
            trim={true}
            data={data}
            order={index}
            // isCompact={true}
            onClick={function (product: ItemType): void {
              throw new Error("Function not implemented.")
            }}
            isBookmarked={false}
            toggleBookmark={function (id: string): void {
              throw new Error("Function not implemented.")
            }}
            isVoted={false}
            toggleVote={function (id: string): void {
              throw new Error("Function not implemented.")
            }}
          />
        ))}
      </div>
    </div>
  )
}
