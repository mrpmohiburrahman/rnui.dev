// components/resource-card-grid.tsx
"use client"

import { Suspense, useState } from "react"
import { usePathname } from "next/navigation"
import type { ItemType } from "@/data/items"

import { cn } from "@/lib/utils"

import LastUpdated from "./last-updated"
import { ResourceCard } from "./resource-card"

export interface ResourceCardGridProps {
  sortedData?: ItemType[]
  filteredFeaturedData?: ItemType[] | null
  children?: React.ReactNode
  openModal: (product: ItemType) => void
  bookmarks: string[]
  toggleBookmark: (id: string) => void
  votedItems: string[]
  toggleVote: (id: string) => void
  setSort?: (sort: "recent" | "top-voted" | "top-viewed") => void // New prop
  currentSort?: "recent" | "top-voted" | "top-viewed" // New prop
}

export const ResourceCardGrid: React.FC<ResourceCardGridProps> = ({
  sortedData,
  children,
  openModal,
  bookmarks,
  toggleBookmark,
  votedItems,
  toggleVote,
  setSort, // Destructure new prop
  currentSort, // Destructure new prop
}) => {
  const pathname = usePathname()
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false)
  return (
    <div
      // style={{ borderWidth: 1, borderColor: "purple" }}
      className="flex flex-col md:items-start gap-4 overflow-hidden pb-4 md:mx-4 mx-0  relative"
    >
      <div
        className={cn(
          "px-4",
          pathname.includes("/products")
            ? "md:p-4 md:gap-3"
            : "bg-white p-4 gap-3 dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]"
        )}
      >
        {children}
      </div>
      <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center space-y-4 sm:space-y-0">
        {setSort && currentSort && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {/* Desktop Sorting Buttons */}
            <div className="hidden sm:flex flex-row space-x-4 w-full">
              <button
                type="button"
                className={` px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${
                  currentSort === "recent" ? "border-2 border-gray-100" : ""
                }`}
                onClick={() => setSort("recent")}
              >
                <span className="w-full text-center">Recent</span>
              </button>

              <button
                type="button"
                className={`px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${
                  currentSort === "top-viewed" ? "border-2 border-gray-100" : ""
                }`}
                onClick={() => setSort("top-viewed")}
              >
                <span className="w-full text-center">Top Viewed</span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${
                  currentSort === "top-voted" ? "border-2 border-gray-100" : ""
                }`}
                onClick={() => setSort("top-voted")}
              >
                <span className="w-full text-center">Top Voted</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex sm:hidden flex-col w-full">
          <button
            type="button"
            className="w-full px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-inner border-2 border-transparent flex justify-between items-center transition-colors duration-200"
            onClick={() => setSortDropdownOpen(!isSortDropdownOpen)}
            aria-haspopup="true"
            aria-expanded={isSortDropdownOpen}
          >
            <span>
              {currentSort === "recent"
                ? "Recent"
                : currentSort === "top-viewed"
                  ? "Top Viewed"
                  : "Top Voted"}
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isSortDropdownOpen ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isSortDropdownOpen && (
            <div className="mt-2 w-full bg-white dark:bg-[#1E1E1E] rounded-[1rem] shadow-inner border border-transparent">
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-t-[1rem] transition-colors duration-200"
                onClick={() => {
                  setSort?.("recent")
                  setSortDropdownOpen(false)
                }}
              >
                Recent
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] transition-colors duration-200"
                onClick={() => {
                  setSort?.("top-viewed")
                  setSortDropdownOpen(false)
                }}
              >
                Top Viewed
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-b-[1rem] transition-colors duration-200"
                onClick={() => {
                  setSort?.("top-voted")
                  setSortDropdownOpen(false)
                }}
              >
                Top Voted
              </button>
            </div>
          )}
        </div>
        {/* last updade and total number of ites */}
        <div className="flex flex-row space-x-4">
          <button
            type="button"
            className={
              "px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] "
            }
          >
            <LastUpdated />
          </button>
          <button
            type="button"
            className={
              "px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] "
            }
          >
            <span>Total Items: {sortedData?.length}</span>
          </button>
        </div>
      </div>
      <div
        className={cn(
          "p-4 w-full",
          pathname.includes("/products")
            ? ""
            : "bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]"
        )}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <div className="relative">
            {/* Adjusted Grid Columns for Smaller Portrait Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {sortedData?.map((data, index) => (
                <ResourceCard
                  key={`${index}-${data.id}`}
                  data={data}
                  order={index}
                  onClick={openModal}
                  isBookmarked={bookmarks.includes(data.id)}
                  toggleBookmark={toggleBookmark}
                  isVoted={votedItems.includes(data.id)}
                  toggleVote={toggleVote}
                />
              ))}
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  )
}
