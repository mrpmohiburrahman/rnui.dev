"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

export function PlaceholdersAndVanishInput({
  placeholders,
  defaultValue,
  onChange,
  onSubmit,
}: {
  placeholders: string[]
  /** Seeds the box on mount. The child still owns the text from then on. */
  defaultValue?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length)
    }, 3000)
  }
  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current) // Clear the interval when the tab is not visible
      intervalRef.current = null
    } else if (document.visibilityState === "visible") {
      startAnimation() // Restart the interval when the tab becomes visible
    }
  }

  useEffect(() => {
    startAnimation()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [placeholders])

  const [value, setValue] = useState(defaultValue ?? "")

  // Enter used to run vanishAndSubmit, whose particle loop ends in `setValue("")`.
  // The URL kept `search=slider` while the box went blank — an animation deleting
  // the visitor's own query. The debounce upstream has already pushed the term, or
  // fires 300ms later, so Enter has nothing left to do but stop the form
  // navigating.
  //
  // The particle machinery it drove went with it: a <canvas> that was opacity-0
  // unless `animating`, and `animating` was set nowhere else. Deleting it is not
  // tidy-up — `draw()` was wired to an effect on `value`, so every keystroke
  // resized an 800×800 canvas, read it back with getImageData and walked 640,000
  // pixels for a still nobody could see. That is the same per-keystroke cost the
  // debounce upstream exists to remove.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit && onSubmit(e)
  }
  return (
    <form
      className={cn(
        "w-full relative max-w-xl mx-auto bg-white dark:bg-zinc-800 h-12 rounded-full overflow-hidden shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200",
        value && "bg-gray-50"
      )}
      onSubmit={handleSubmit}
    >
      <input
        onChange={(e) => {
          setValue(e.target.value)
          onChange && onChange(e)
        }}
        value={value}
        type="text"
        className="w-full relative text-sm sm:text-base z-50 border-none dark:text-white bg-transparent text-black h-full rounded-full focus:outline-none focus:ring-0 pl-4 sm:pl-10 pr-20"
      />

      {/* <button
        disabled={!value}
        type="submit"
        className="absolute right-2 top-1/2 z-50 -translate-y-1/2 h-8 w-8 rounded-full disabled:bg-gray-100 bg-black dark:bg-zinc-900 dark:disabled:bg-zinc-800 transition duration-200 flex items-center justify-center"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-300 h-4 w-4"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            d="M5 12l14 0"
            initial={{
              strokeDasharray: "50%",
              strokeDashoffset: "50%",
            }}
            animate={{
              strokeDashoffset: value ? 0 : "50%",
            }}
            transition={{
              duration: 0.3,
              ease: "linear",
            }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button> */}

      <div className="absolute inset-0 flex items-center rounded-full pointer-events-none">
        {/* initial={false} so the first placeholder is neither animated in nor
            served invisible. framer-motion serialises the `initial` variant into
            the style attribute during a server render, and this one starts at
            opacity 0 — so the HTML of `/` arrived with the search box captioned
            by a string nobody could see. The presence context suppresses both
            halves at once, and only for children already there on the first
            render; every later swap still fades. */}
        <AnimatePresence mode="wait" initial={false}>
          {!value && (
            <motion.p
              initial={{
                y: 5,
                opacity: 0,
              }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -15,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
              className="dark:text-zinc-500 text-sm sm:text-base font-normal text-neutral-500 pl-4 sm:pl-12 text-left w-[calc(100%-2rem)] truncate"
            >
              Search for {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}
