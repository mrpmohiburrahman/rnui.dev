"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

/**
 * The search field, restyled from the hero's h-12 rounded-full to the header's
 * 34px / 10px box (Catalogue.dc.html:19). The two strings — `placeholder` and
 * `aria-label` — stay deliberately one: a non-empty placeholder is itself a
 * naming mechanism, so the field stays named even if the label is lost; the
 * label is the name that survives the visitor typing, when the placeholder
 * disappears. A voice-control visitor says what they can see, so the two have
 * to match (WCAG 2.5.3).
 */
export function PlaceholdersAndVanishInput({
  defaultValue,
  onChange,
  onSubmit,
  recordingCount,
}: {
  /** Seeds the box on mount. The child still owns the text from then on. */
  defaultValue?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  /** The whole catalogue's size, for the mock's `Search 277 recordings`. */
  recordingCount: number
}) {
  const [value, setValue] = useState(defaultValue ?? "")

  const searchLabel = `Search ${recordingCount} recordings`

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
        "flex w-full relative h-[34px] items-center gap-[9px] rounded-[10px] overflow-hidden border bg-field transition duration-200",
        // The value-present state the mock draws (searchBorder/searchGlow,
        // Catalogue.dc.html:230-233), and the focus ring it uses elsewhere
        // (:78): the mock never draws focus on this field, so it gets the
        // standard one. Drawn on the field box, not the input, because the
        // form's own overflow-hidden would clip an outline offset on the child.
        value
          ? "border-acc shadow-[0_0_0_3px_var(--acc-soft)] focus-within:outline focus-within:outline-[3px] focus-within:outline-acc focus-within:outline-offset-2"
          : "border-line focus-within:outline focus-within:outline-[3px] focus-within:outline-acc focus-within:outline-offset-2"
      )}
      onSubmit={handleSubmit}
    >
      {/* The mock draws ⌕ + the value or placeholder + the / key chip as sibling
          spans inside the field (Catalogue.dc.html:20-22); the input is the
          middle span here. */}
      <span aria-hidden="true" className="z-50 pl-[11px] text-[12px] text-t3">
        ⌕
      </span>
      <input
        onChange={(e) => {
          setValue(e.target.value)
          onChange && onChange(e)
        }}
        value={value}
        // Not type="search": WebKit draws a clear button of its own inside it.
        type="text"
        name="search"
        aria-label={searchLabel}
        aria-keyshortcuts="/"
        // The hint used to be an animated <p> overlaying the box, cycling
        // through all 18 Categories every 3 seconds — unconditionally, with no
        // prefers-reduced-motion check, and named by nothing, so the field had
        // no accessible name at all. The placeholder attribute does the same job
        // standing still, and names the field while it is at it.
        placeholder={searchLabel}
        className="relative z-50 h-full w-full border-none bg-transparent pr-[11px] text-[12.5px] text-t1 outline-none placeholder:text-t3 focus:outline-none"
      />
      {/* A picture of a key, so it is not a name for anything: the shortcut it
          advertises is handled in components/site-header.tsx. The phone header
          draws no chip, so this is md and up. */}
      <span
        aria-hidden="true"
        className="z-50 ml-auto mr-[6px] hidden rounded-[4px] border border-line px-[5px] py-[2px] font-mono text-[9px] text-t3 md:block"
      >
        /
      </span>
    </form>
  )
}
