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
import { ALL_ENTRIES as ALL } from "@/lib/codex/entries"

const limitArg = process.argv.indexOf("--limit")
const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : ALL.length

function corpusText(entry: (typeof ALL)[number]): string {
  return [entry.caption, entry.category, entry.author, entry.source].filter(Boolean).join(" — ")
}

async function main() {
  requireOpenAIKey()
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const entries = ALL.slice(0, limit)
  console.log(`Embedding ${entries.length} entries with ${CODEX_EMBED_MODEL}.`)

  const BATCH = 100
  const vectors: { id: string; embedding: number[] }[] = []

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH)
    const { embeddings } = await embedMany({
      model: openai.embedding(CODEX_EMBED_MODEL),
      values: batch.map(corpusText),
    })
    embeddings.forEach((embedding, j) => {
      vectors.push({ id: batch[j].id, embedding })
    })
    console.log(`  ${Math.min(i + BATCH, entries.length)} / ${entries.length}`)
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
