import { z } from "zod"

export const CATEGORY_VALUES = [
  "Accordions",
  "Arc Sliders",
  "Bottom Sheets",
  "Buttons",
  "Carousels",
  "Charts",
  "Circular Progress Bars",
  "Drop Down",
  "Full Apps",
  "Headers",
  "List",
  "Loaders",
  "Misc",
  "Onboarding",
  "Parallaxes",
  "Pickers",
  "Sliders",
  "Tab bars",
] as const

export const ExtractedEntrySchema = z.object({
  caption: z.string().min(2).max(80),
  author: z.string().min(1).max(80),
  category: z.enum(CATEGORY_VALUES),
  twitterId: z.string().max(40).optional(),
  linkedInId: z.string().max(80).optional(),
  githubId: z.string().max(40).optional(),
})

export type ExtractedEntry = z.infer<typeof ExtractedEntrySchema>
