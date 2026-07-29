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

import { ASSET_PATH_SHAPE } from "@/lib/asset-path"
import { CODEX_MODEL, requireOpenAIKey } from "@/lib/codex/env"

const prNumber = process.env.PR_NUMBER
if (!prNumber) {
  console.error("PR_NUMBER env var is required.")
  process.exit(1)
}

// The path shape is read from lib/asset-path.ts rather than typed out, so the
// reviewer cannot go on asking for a shape the tooling stopped producing.
const RUBRIC = `
You are reviewing a pull request against rnui.dev, a curated React Native UI catalog.
Each PR typically adds a new entry to one of the data/<category>.ts files.

Check, in order, and respond as short Markdown bullets:

1. Schema: does the new entry have id, caption, demoPath, posterPath, author, source, category, created_at?
2. ID: is the id a 26-char Crockford ULID? Does it look unique vs. typical existing IDs?
3. Asset paths: do demoPath and posterPath follow ${ASSET_PATH_SHAPE}?
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
