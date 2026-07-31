import React from "react"
import type { Entry } from "@/data/entry"

import { incrementViewCount } from "@/app/actions/increment-view-count"

import InteractiveVideo from "./interactive-video"
import Modal from "./modal"

export default function CardModal({
  selectedEntry,
  isModalOpen,
  closeModal,
}: {
  selectedEntry: Entry | null
  isModalOpen: boolean
  closeModal: () => void
}) {
  // No local view count here. This component mounts before anything is selected,
  // so the count it held was seeded from nothing, incremented on every open, and
  // rendered nowhere — state that could not be right and could not be seen.
  const incrementViewCountLocal = async () => {
    try {
      if (selectedEntry) {
        await incrementViewCount(selectedEntry.id)
      }
    } catch (error) {
      console.error("Error incrementing view count:", error)
    }
  }
  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      {selectedEntry && (
        <div className="flex flex-col md:flex-row md:h-[80vh] space-y-4 md:space-y-0 md:space-x-6 p-4">
          {/* Left Side: Video Demo */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            {selectedEntry.demoPath ? (
              <div className="w-full h-full">
                <InteractiveVideo
                  incrementViewCount={incrementViewCountLocal}
                  src={selectedEntry.demoPath}
                  className="w-full h-full object-contain rounded-lg shadow-md"
                  controls
                  poster={selectedEntry.posterPath}
                  caption={`video demo of ${selectedEntry.caption}`}
                  loop
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-gray-500">No Video Available</span>
              </div>
            )}
          </div>

          {/* Right Side: Entry Information */}
          <div className="w-full md:w-1/2 flex flex-col space-y-4 overflow-y-auto">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                {selectedEntry.caption}
              </h2>
              {selectedEntry.twitterId && (
                <p className="text-gray-500">@{selectedEntry.twitterId}</p>
              )}
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                {selectedEntry.author}
              </p>
            </div>
            <div>
              <a
                href={selectedEntry.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                GitHub Repository
              </a>
            </div>
            {/* Additional Content */}
            {/* You can add more content here if needed */}
          </div>
        </div>
      )}
    </Modal>
  )
}
