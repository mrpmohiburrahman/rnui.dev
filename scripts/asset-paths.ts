// scripts/asset-paths.ts
//
// Prints every Asset path the catalogue references, one per line, so that shell
// tooling can work from the catalogue rather than from the filesystem. That
// distinction matters once Staging copies leave the repo: CI has no Assets on
// disk, so "what should exist" can only come from the data files.
//
//   pnpm assets:paths           every Asset path
//   pnpm assets:paths demo      Demos only
//   pnpm assets:paths posters   Posters only

import { allAssetPaths } from "../data/catalogue"
import { DEMO_PREFIX, POSTER_PREFIX } from "../lib/asset-path"

const kind = process.argv[2] ?? "all"
const prefix = {
  all: "",
  demo: `${DEMO_PREFIX}/`,
  posters: `${POSTER_PREFIX}/`,
}[kind]

if (prefix === undefined) {
  console.error(`unknown kind "${kind}" — expected all, demo or posters`)
  process.exit(2)
}

process.stdout.write(
  allAssetPaths.filter((p) => p.startsWith(prefix)).join("\n") + "\n"
)
