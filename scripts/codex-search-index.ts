/**
 * Usage:
 *   pnpm codex:index [--limit N]
 *
 * Reads every entry from data/<category>.ts, calls
 * openai.embeddings.create({ model: "text-embedding-3-small" }) per entry, and
 * writes data/embeddings.json:
 *
 *   { model: "text-embedding-3-small", generatedAt: "...", vectors: [{ id, embedding }] }
 *
 * This is the local-fallback for the Supabase pgvector setup described in
 * CODEX-GRANT-PROMPT.md §4 Phase 3c. Search ranks via cosine similarity over
 * this JSON at request time (see app/api/search/route.ts). Good enough for
 * the current catalog size; swap to pgvector when the catalog outgrows JSON.
 *
 * Requires OPENAI_API_KEY.
 */

import { writeFileSync } from "node:fs"
import { embedMany } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

import { CODEX_EMBED_MODEL, requireOpenAIKey } from "@/lib/codex/env"
import { accordions } from "@/data/accordions"
import { arcsliders } from "@/data/arcsliders"
import { bottomsheets } from "@/data/bottomsheets"
import { buttons } from "@/data/buttons"
import { carousels } from "@/data/carousels"
import { charts } from "@/data/charts"
import { circular_progress_bars } from "@/data/circular-progress-bars"
import { drop_down } from "@/data/dropdowns"
import { full_apps } from "@/data/fullapps"
import { headers } from "@/data/headers"
import { list } from "@/data/lists"
import { loaders } from "@/data/loaders"
import { misc } from "@/data/misc"
import { onboarding } from "@/data/onboardings"
import { parallaxes } from "@/data/parallaxes"
import { pickers } from "@/data/pickers"
import { sliders } from "@/data/sliders"
import { tabbars } from "@/data/tabbars"

const ALL = [
  ...accordions,
  ...arcsliders,
  ...bottomsheets,
  ...buttons,
  ...carousels,
  ...charts,
  ...circular_progress_bars,
  ...drop_down,
  ...full_apps,
  ...headers,
  ...list,
  ...loaders,
  ...misc,
  ...onboarding,
  ...parallaxes,
  ...pickers,
  ...sliders,
  ...tabbars,
]

const limitArg = process.argv.indexOf("--limit")
const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : ALL.length

function corpusText(item: (typeof ALL)[number]): string {
  return [item.caption, item.category, item.author, item.source].filter(Boolean).join(" — ")
}

async function main() {
  requireOpenAIKey()
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const items = ALL.slice(0, limit)
  console.log(`Embedding ${items.length} entries with ${CODEX_EMBED_MODEL}.`)

  const BATCH = 100
  const vectors: { id: string; embedding: number[] }[] = []

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH)
    const { embeddings } = await embedMany({
      model: openai.embedding(CODEX_EMBED_MODEL),
      values: batch.map(corpusText),
    })
    embeddings.forEach((embedding, j) => {
      vectors.push({ id: batch[j].id, embedding })
    })
    console.log(`  ${Math.min(i + BATCH, items.length)} / ${items.length}`)
  }

  const out = {
    model: CODEX_EMBED_MODEL,
    generatedAt: new Date().toISOString(),
    vectors,
  }
  writeFileSync("data/embeddings.json", JSON.stringify(out))
  console.log(`Wrote data/embeddings.json (${vectors.length} vectors).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
