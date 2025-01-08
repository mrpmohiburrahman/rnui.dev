// hooks/useModal.ts
import { useState } from "react"
import type { ItemType } from "@/data/items"

const useModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ItemType | null>(null)

  const openModal = (product: ItemType) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  return {
    isModalOpen,
    selectedProduct,
    openModal,
    closeModal,
  }
}

export default useModal
