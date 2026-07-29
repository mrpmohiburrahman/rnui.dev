import { NextResponse } from "next/server"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { embed } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

import { ALL_ENTRIES } from "@/lib/codex/entries"
import { CODEX_EMBED_MODEL } from "@/lib/codex/env"

type Vector = { id: string; embedding: number[] }
type IndexFile = { model: string; generatedAt: string; vectors: Vector[] }

const INDEX_PATH = path.join(process.cwd(), "data", "embeddings.json")

let cachedIndex: IndexFile | null = null
function loadIndex(): IndexFile | null {
  if (cachedIndex) return cachedIndex
  if (!existsSync(INDEX_PATH)) return null
  cachedIndex = JSON.parse(readFileSync(INDEX_PATH, "utf8")) as IndexFile
  return cachedIndex
}

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { q?: string } | null
  const q = body?.q?.trim()
  if (!q) {
    return NextResponse.json({ error: "Body must be { q: string }" }, { status: 400 })
  }

  const index = loadIndex()
  if (!index) {
    return NextResponse.json(
      {
        error: "Embedding index missing. Run `pnpm codex:index` to generate data/embeddings.json.",
      },
      { status: 503 }
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not set on the server." },
      { status: 503 }
    )
  }

  const openai = createOpenAI({ apiKey })
  const { embedding: queryVec } = await embed({
    model: openai.embedding(CODEX_EMBED_MODEL),
    value: q,
  })

  const byId = new Map(ALL_ENTRIES.map((entry) => [entry.id, entry]))
  const ranked = index.vectors
    .map((v) => ({ id: v.id, score: cosine(queryVec, v.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ id, score }) => ({ score, entry: byId.get(id) }))
    .filter((r) => r.entry)

  return NextResponse.json({ q, model: index.model, results: ranked })
}
