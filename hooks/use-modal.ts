// hooks/useModal.ts
import { useState } from "react"
import type { Entry } from "@/data/entry"

const useModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)

  const openModal = (entry: Entry) => {
    setSelectedEntry(entry)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEntry(null)
  }

  return {
    isModalOpen,
    selectedEntry,
    openModal,
    closeModal,
  }
}

export default useModal
