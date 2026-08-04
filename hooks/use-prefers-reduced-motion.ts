"use client"

import { useSyncExternalStore } from "react"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

const subscribe = (onChange: () => void) => {
  const query = matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/**
 * React's own hook rather than framer-motion's `useReducedMotion`: that one
 * reports `false` on the server, which mounts a <video> for one frame in exactly
 * the case the Specimen says must never mount one.
 *
 * The server snapshot is a parameter, not a constant, because the two callers
 * have opposite honesty constraints:
 *
 * - The tile (components/demo-tile.tsx) passes `true`, so the served HTML ships
 *   no <video> for anybody — the omission is the correctness, and the element
 *   appears only after hydration for visitors who did not ask for less motion.
 * - The catalogue result line (components/recording-card-grid.tsx) passes
 *   `false`, because the served document must not claim STILLS ONLY for a
 *   visitor who will play Demos — decision 2 ("nothing on screen lies") cuts
 *   the other way when the text is a positive statement.
 *
 * In both callers the hydration controller lives in the browser, so the value
 * converges to the truth the moment matchMedia can be consulted.
 */
export function usePrefersReducedMotion(serverSnapshot = true) {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(REDUCED_MOTION).matches,
    () => serverSnapshot
  )
}