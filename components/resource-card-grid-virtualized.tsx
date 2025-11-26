// components/resource-card-grid-virtualized.tsx
"use client"

import { Suspense, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import type { ItemType } from "@/data/items"
import { useVirtualizer } from "@tanstack/react-virtual"

import { cn } from "@/lib/utils"

import LastUpdated from "./last-updated"
import { ResourceCard } from "./resource-card"
import { ResourceCardSkeleton } from "./ui/skeleton"

export interface ResourceCardGridProps {
    sortedData?: ItemType[]
    filteredFeaturedData?: ItemType[] | null
    children?: React.ReactNode
    openModal: (product: ItemType) => void
    bookmarks: string[]
    toggleBookmark: (id: string) => void
    votedItems: string[]
    toggleVote: (id: string) => void
    setSort?: (sort: "recent" | "top-voted" | "top-viewed") => void
    currentSort?: "recent" | "top-voted" | "top-viewed"
}

const COLUMN_COUNT = 5 // xl:grid-cols-5
const CARD_WIDTH = 221 // sm:w-[221px]
const GAP = 24 // gap-6 (1.5rem = 24px)
const CARD_HEIGHT = 550 // Approximate height (aspect ratio 9:16 + padding)

export const ResourceCardGrid: React.FC<ResourceCardGridProps> = ({
    sortedData = [],
    children,
    openModal,
    bookmarks,
    toggleBookmark,
    votedItems,
    toggleVote,
    setSort,
    currentSort,
}) => {
    const pathname = usePathname()
    const [isSortDropdownOpen, setSortDropdownOpen] = useState(false)
    const parentRef = useRef<HTMLDivElement>(null)

    // Calculate number of columns based on viewport (responsive)
    const getColumnCount = () => {
        if (typeof window === 'undefined') return COLUMN_COUNT
        const width = window.innerWidth
        if (width < 640) return 1  // sm
        if (width < 768) return 2  // md
        if (width < 1024) return 3  // lg
        if (width < 1280) return 4  // xl
        return 5  // 2xl
    }

    const [columnCount, setColumnCount] = useState(getColumnCount)

    // Update column count on resize
    useMemo(() => {
        if (typeof window === 'undefined') return

        const handleResize = () => {
            setColumnCount(getColumnCount())
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Calculate rows needed for grid layout
    const rowCount = Math.ceil(sortedData.length / columnCount)

    // Virtualizer for rows
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => CARD_HEIGHT + GAP, // Row height + gap
        overscan: 2, // Render 2 rows above and below viewport
    })

    return (
        <div className="flex flex-col md:items-start gap-4 overflow-hidden pb-4 md:mx-4 mx-0 relative">
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
                                className={` px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${currentSort === "recent" ? "border-2 border-gray-100" : ""
                                    }`}
                                onClick={() => setSort("recent")}
                            >
                                <span className="w-full text-center">Recent</span>
                            </button>

                            <button
                                type="button"
                                className={`px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${currentSort === "top-viewed" ? "border-2 border-gray-100" : ""
                                    }`}
                                onClick={() => setSort("top-viewed")}
                            >
                                <span className="w-full text-center">Top Viewed</span>
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${currentSort === "top-voted" ? "border-2 border-gray-100" : ""
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
                            className={`w-4 h-4 transition-transform duration-200 ${isSortDropdownOpen ? "transform rotate-180" : ""
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
                {/* last update and total number of items */}
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

            {/* Virtualized Grid Container */}
            <div
                className={cn(
                    "p-4 w-full",
                    pathname.includes("/products")
                        ? ""
                        : "bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]"
                )}
            >
                <Suspense fallback={<ResourceCardSkeleton />}>
                    <div
                        ref={parentRef}
                        className="h-[800px] overflow-auto" // Fixed height for scroller
                    >
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const startIndex = virtualRow.index * columnCount
                                const rowItemsInRow = sortedData.slice(startIndex, startIndex + columnCount)

                                return (
                                    <div
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                            {rowItemsInRow.map((data, colIndex) => (
                                                <ResourceCard
                                                    key={`${startIndex + colIndex}-${data.id}`}
                                                    data={data}
                                                    order={startIndex + colIndex}
                                                    onClick={openModal}
                                                    isBookmarked={bookmarks.includes(data.id)}
                                                    toggleBookmark={toggleBookmark}
                                                    isVoted={votedItems.includes(data.id)}
                                                    toggleVote={toggleVote}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </Suspense>
            </div>
        </div>
    )
}
