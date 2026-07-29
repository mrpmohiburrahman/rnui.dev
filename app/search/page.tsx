"use client"

import { useState } from "react"
import type { Entry } from "@/data/entry"

type Result = { score: number; entry: Entry }

export default function SearchPage() {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        setResults([])
      } else {
        setResults(data.results ?? [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Search</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Natural-language search over the catalog, powered by OpenAI embeddings.
        Try “swipeable card animation” or “lottie loader”.
      </p>

      <form onSubmit={run} className="mt-6 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you looking for?"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error ? (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <ul className="mt-8 space-y-4">
        {results.map(({ score, entry }) => (
          <li key={entry.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <a
                href={entry.source}
                target="_blank"
                rel="noreferrer"
                className="font-medium hover:underline"
              >
                {entry.caption}
              </a>
              <span className="text-xs text-muted-foreground">
                {score.toFixed(3)} · {entry.category}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">by {entry.author}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
