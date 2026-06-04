export function requireOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    console.error(
      "OPENAI_API_KEY is not set. Export it in your shell or place it in .env.local."
    )
    process.exit(1)
  }
  return key
}

export const CODEX_MODEL = "gpt-4o-mini"
export const CODEX_EMBED_MODEL = "text-embedding-3-small"
