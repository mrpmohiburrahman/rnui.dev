"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

/**
 * Deliberately one string used twice, as the `placeholder` and as the
 * `aria-label`. A non-empty placeholder is itself a naming mechanism, so the
 * field stays named even if the label is lost; the label is the name that
 * survives the visitor typing, when the placeholder disappears. A voice-control
 * visitor says what they can see, so the two have to match (WCAG 2.5.3).
 */
const SEARCH_LABEL = "Search the catalogue"

export function PlaceholdersAndVanishInput({
  defaultValue,
  onChange,
  onSubmit,
}: {
  /** Seeds the box on mount. The child still owns the text from then on. */
  defaultValue?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
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
        // Not type="search": WebKit draws a clear button of its own inside it.
        type="text"
        name="search"
        aria-label={SEARCH_LABEL}
        // The hint used to be an animated <p> overlaying the box, cycling
        // through all 18 Categories every 3 seconds — unconditionally, with no
        // prefers-reduced-motion check, and named by nothing, so the field had
        // no accessible name at all. The placeholder attribute does the same job
        // standing still, and names the field while it is at it.
        //
        // The two colour utilities carry the <p>'s colour over: app/globals.css
        // sets a global `::placeholder { color: #a0aec0 }` that otherwise wins.
        placeholder={SEARCH_LABEL}
        className="w-full relative text-sm sm:text-base z-50 border-none dark:text-white bg-transparent text-black h-full rounded-full focus:outline-none focus:ring-0 pl-4 sm:pl-10 pr-20 placeholder:text-neutral-500 dark:placeholder:text-zinc-500"
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
    </form>
  )
}
