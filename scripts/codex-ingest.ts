/**
 * Usage:
 *   pnpm codex:ingest -- <github-url> [--dry-run]
 *
 * Pipeline:
 *   1. Fetch GitHub repo metadata + README via `gh api`.
 *   2. Call OpenAI gpt-4o-mini with structured output to extract a catalog entry
 *      that conforms to the existing Entry schema in data/entry.ts.
 *   3. Validate via Zod.
 *   4. Append the entry to data/<file>.ts using ts-morph (preserves existing formatting).
 *   5. Print a TODO block reminding the maintainer to upload the demo video so the
 *      thumbnail pipeline (scripts/generateThumbnails.ts) can run.
 *   6. Unless --dry-run: create branch submission/<slug>, commit, push, open a PR.
 *
 * Requirements:
 *   - OPENAI_API_KEY in env.
 *   - `gh` CLI authenticated.
 */

import { execSync } from "node:child_process"
import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { Project, SyntaxKind, type ArrayLiteralExpression } from "ts-morph"
import { ulid } from "ulid"

import { CODEX_MODEL, requireOpenAIKey } from "@/lib/codex/env"
import { ExtractedEntrySchema } from "@/lib/codex/schema"
import { CATEGORIES } from "@/data/categories"
import type { Entry } from "@/data/entry"

// Produces the filename portion of an Asset path. Moves into the Asset path
// module when that lands (ticket 04); it has nothing to do with Category.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const args = process.argv.slice(2)
const rawUrl = args.find((a) => !a.startsWith("--"))
const dryRun = args.includes("--dry-run")

if (!rawUrl) {
  console.error("Usage: pnpm codex:ingest -- <github-url> [--dry-run]")
  process.exit(1)
}
const url: string = rawUrl

function fetchGitHub(repoUrl: string): { readme: string; meta: Record<string, unknown> } {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/)
  if (!match) {
    console.error(`Not a recognized GitHub URL: ${repoUrl}`)
    process.exit(1)
  }
  const [, owner, repoRaw] = match
  const repo = repoRaw.replace(/\.git$/, "")
  const meta = JSON.parse(execSync(`gh api repos/${owner}/${repo}`, { encoding: "utf8" }))
  let readme = ""
  try {
    const raw = execSync(`gh api repos/${owner}/${repo}/readme --jq .content`, {
      encoding: "utf8",
    })
    readme = Buffer.from(raw.trim(), "base64").toString("utf8")
  } catch {
    readme = "(no README available)"
  }
  return { readme, meta }
}

function appendEntry(entry: Entry, file: string, exportName: string): void {
  const project = new Project({ tsConfigFilePath: "tsconfig.json" })
  const sourceFile = project.addSourceFileAtPath(`data/${file}.ts`)
  const decl = sourceFile.getVariableDeclarationOrThrow(exportName)
  const arr = decl.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression) as ArrayLiteralExpression

  const text = [
    "{",
    `  id: ${JSON.stringify(entry.id)},`,
    `  caption: ${JSON.stringify(entry.caption)},`,
    `  demoPath: ${JSON.stringify(entry.demoPath)},`,
    `  posterPath: ${JSON.stringify(entry.posterPath)},`,
    `  author: ${JSON.stringify(entry.author)},`,
    `  source: ${JSON.stringify(entry.source)},`,
    entry.twitterId ? `  twitterId: ${JSON.stringify(entry.twitterId)},` : null,
    entry.linkedInId ? `  linkedInId: ${JSON.stringify(entry.linkedInId)},` : null,
    entry.githubId ? `  githubId: ${JSON.stringify(entry.githubId)},` : null,
    `  category: ${JSON.stringify(entry.category)},`,
    `  created_at: ${JSON.stringify(entry.created_at)},`,
    "}",
  ]
    .filter(Boolean)
    .join("\n")

  arr.addElement(text)
  sourceFile.saveSync()
}

async function main() {
  requireOpenAIKey()
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const { readme, meta } = fetchGitHub(url)

  const { object } = await generateObject({
    model: openai(CODEX_MODEL),
    schema: ExtractedEntrySchema,
    prompt: [
      "You catalog React Native UI / animation projects for rnui.dev.",
      `Source URL: ${url}`,
      `Repo metadata (truncated): ${JSON.stringify(meta).slice(0, 1500)}`,
      `README (truncated):\n${readme.slice(0, 6000)}`,
      "",
      "Extract:",
      '- caption: short human title (3-6 words, Title Case).',
      '- author: human name of the original creator if findable, else the GitHub org/user.',
      '- category: the single best fit from the enum.',
      '- twitterId / linkedInId / githubId: handles only if confidently found in README or repo metadata. Omit otherwise.',
    ].join("\n"),
  })

  const extracted = ExtractedEntrySchema.parse(object)
  const row = CATEGORIES[extracted.category]
  const slug = `${slugify(extracted.caption)}_${slugify(extracted.author)}`

  const entry: Entry = {
    id: ulid(),
    caption: extracted.caption,
    demoPath: `demo/${row.assetSlug}/${slug}.mp4`,
    posterPath: `thumbnails/${row.assetSlug}/${slug}.avif`,
    author: extracted.author,
    source: url,
    ...(extracted.twitterId ? { twitterId: extracted.twitterId } : {}),
    ...(extracted.linkedInId ? { linkedInId: extracted.linkedInId } : {}),
    ...(extracted.githubId ? { githubId: extracted.githubId } : {}),
    category: extracted.category,
    created_at: new Date().toISOString(),
  }

  console.log("\nExtracted entry:")
  console.log(JSON.stringify(entry, null, 2))
  console.log(
    [
      "",
      "ASSET TODO — the maintainer must drop the demo video here before merge:",
      `  public/${entry.demoPath}`,
      "Then run:  pnpm generate-thumbnails",
      "",
    ].join("\n")
  )

  if (dryRun) {
    console.log("--dry-run set; not writing files, not opening PR.")
    return
  }

  appendEntry(entry, row.file, row.exportName)
  console.log(`Appended to data/${row.file}.ts.`)

  const branch = `submission/${slug}`
  execSync(`git checkout -b ${branch}`, { stdio: "inherit" })
  execSync(`git add data/${row.file}.ts`, { stdio: "inherit" })
  execSync(`git commit -m "feat(catalog): add ${entry.caption} by ${entry.author}"`, {
    stdio: "inherit",
  })
  execSync(`git push -u origin ${branch}`, { stdio: "inherit" })

  const body = [
    `Automated submission via \`pnpm codex:ingest\`.`,
    "",
    `**Source:** ${url}`,
    `**Author:** ${entry.author}`,
    `**Category:** ${entry.category}`,
    "",
    "### Maintainer checklist before merge",
    `- [ ] Upload demo video to \`public/${entry.demoPath}\``,
    "- [ ] Run `pnpm generate-thumbnails`",
    "- [ ] Verify thumbnail at the expected path",
    "- [ ] `pnpm test` passes",
  ].join("\n")

  execSync(`gh pr create --title ${JSON.stringify(`Add ${entry.caption}`)} --body ${JSON.stringify(body)}`, {
    stdio: "inherit",
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
