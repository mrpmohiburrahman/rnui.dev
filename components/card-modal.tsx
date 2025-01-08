import React, { useState } from "react"
import type { ItemType } from "@/data/items"

import { incrementViewCount } from "@/app/actions/increment-view-count"

import InteractiveVideo from "./interactive-video"
import Modal from "./modal"

export default function CardModal({
  selectedProduct,
  isModalOpen,
  closeModal,
}: {
  selectedProduct: ItemType | null
  isModalOpen: boolean
  closeModal: () => void
}) {
  const [viewCount, setViewCount] = useState<number>(
    selectedProduct?.view_count || 0
  )
  const incrementViewCountLocal = async () => {
    try {
      if (selectedProduct) {
        await incrementViewCount(selectedProduct.id)
        setViewCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error incrementing view count:", error)
    }
  }
  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      {selectedProduct && (
        <div className="flex flex-col md:flex-row md:h-[80vh] space-y-4 md:space-y-0 md:space-x-6 p-4">
          {/* Left Side: Video Demo */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            {selectedProduct.videoSrc ? (
              <div className="w-full h-full">
                <InteractiveVideo
                  incrementViewCount={incrementViewCountLocal}
                  src={selectedProduct.videoSrc}
                  className="w-full h-full object-contain rounded-lg shadow-md"
                  controls
                  poster={selectedProduct.thumbnailSrc}
                  caption={`video demo of ${selectedProduct.caption}`}
                  loop
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-gray-500">No Video Available</span>
              </div>
            )}
          </div>

          {/* Right Side: Product Information */}
          <div className="w-full md:w-1/2 flex flex-col space-y-4 overflow-y-auto">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                {selectedProduct.author}
              </h2>
              {selectedProduct.twitterId && (
                <p className="text-gray-500">@{selectedProduct.twitterId}</p>
              )}
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                {selectedProduct.caption}
              </p>
            </div>
            <div>
              <a
                href={selectedProduct.source}
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
