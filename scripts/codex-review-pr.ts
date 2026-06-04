/**
 * Usage (inside GitHub Actions):
 *   PR_NUMBER=123 OPENAI_API_KEY=... GH_TOKEN=... pnpm codex:review-pr
 *
 * Reads the PR diff via `gh pr diff`, asks gpt-4o-mini to rate the change against
 * a fixed rubric (schema compliance, no duplicate IDs, sensible category, video
 * asset present in tree, description quality), then posts the review with
 * `gh pr comment`.
 */

import { execSync } from "node:child_process"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

import { CODEX_MODEL, requireOpenAIKey } from "@/lib/codex/env"

const prNumber = process.env.PR_NUMBER
if (!prNumber) {
  console.error("PR_NUMBER env var is required.")
  process.exit(1)
}

const RUBRIC = `
You are reviewing a pull request against rnui.dev, a curated React Native UI catalog.
Each PR typically adds a new entry to one of the data/<category>.ts files.

Check, in order, and respond as short Markdown bullets:

1. Schema: does the new entry have id, caption, videoSrc, thumbnailSrc, author, source, category, created_at?
2. ID: is the id a 26-char Crockford ULID? Does it look unique vs. typical existing IDs?
3. Asset paths: do videoSrc and thumbnailSrc follow demo/<slug>/<file>.mp4 and thumbnails/<slug>/<file>.avif?
4. Category: does the category match the data file the entry lives in?
5. Source URL: starts with https?:// and points to a real-looking repo/snack/gist?
6. Caption + author: non-empty, sensible length, no obvious copy-paste cruft?
7. Any non-data-entry changes that should not ship in a submission PR?

End with one line: VERDICT: ready | needs-changes | spam
`.trim()

async function main() {
  requireOpenAIKey()
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const diff = execSync(`gh pr diff ${prNumber}`, { encoding: "utf8" }).slice(0, 30000)

  const { text } = await generateText({
    model: openai(CODEX_MODEL),
    prompt: `${RUBRIC}\n\n---\nDiff:\n\`\`\`diff\n${diff}\n\`\`\``,
  })

  const body = [
    "### Codex automated review",
    "",
    text.trim(),
    "",
    "---",
    "_Posted by `.github/workflows/codex-triage.yml`. A human maintainer still has final say._",
  ].join("\n")

  execSync(`gh pr comment ${prNumber} --body ${JSON.stringify(body)}`, { stdio: "inherit" })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
