// prototypes/og-cards/probe/fonts.ts
//
// The four faces every probe here registers with Satori, loaded once.
//
// **These files were never type-checked before they moved here.** `tsconfig.json` includes
// `**/*.ts` and `**/*.tsx`, and TypeScript's glob does not match paths beginning with a dot —
// so everything under `.scratch/` was invisible to `pnpm check-types`. Eight probes each carried
// their own copy of the loader, and every copy typed `data` as `ArrayBufferLike` by handing
// `Buffer.buffer.slice()` straight to Satori. That is wrong (`ArrayBufferLike` includes
// `SharedArrayBuffer`, which Satori cannot use) and it only type-checked by never being looked
// at.
//
// One loader, typed correctly, imported by all of them.

import { readFileSync } from "node:fs"

/**
 * Satori matches a face to a `font-weight` by **family** and by exact weight value, and has no
 * interpolation — which is why these are four static instances rather than one variable font.
 */
export type ProbeWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export type ProbeFont = { name: string; data: ArrayBuffer; weight: ProbeWeight; style: "normal" }

/**
 * `public/fonts/`, which is the one committed copy in the repo. Nothing here keeps a second
 * set of TTFs — a prototype that drifts from the font the site ships would render a card that
 * is not the card.
 */
const DIR = new URL("../../../public/fonts/", import.meta.url)

function load(family: string, weight: ProbeWeight): ProbeFont {
  const b = readFileSync(new URL(`${family}-${weight}.ttf`, DIR))
  // The copy is what narrows `ArrayBufferLike` to `ArrayBuffer`. `b.buffer.slice(...)` does
  // not: it is still `ArrayBufferLike`, and that is the bug this line replaces.
  return { name: family, data: new Uint8Array(b).buffer, weight, style: "normal" }
}

let cached: ProbeFont[] | null = null

/** Space Grotesk 400/500/700 and JetBrains Mono 400 — the four the Contributor card sets. */
export function probeFonts(): ProbeFont[] {
  if (cached) return cached
  cached = [load("SpaceGrotesk", 400), load("SpaceGrotesk", 500), load("SpaceGrotesk", 700), load("JetBrainsMono", 400)]
  return cached
}
