// scripts/verify-collection-guard.ts
//
// Self-check for tests/e2e/collection-guard.ts — the guard that stops the
// Playwright suite writing votes into the production Firestore collection.
// The guard's decision is a pure function, so this exercises it directly: no
// server, no Playwright, no build. Run it with:
//
//   pnpm exec tsx scripts/verify-collection-guard.ts
//
// Revert the guard (e.g. make assertNotProductionCollection a no-op) and this
// fails loudly instead of passing quietly.
import assert from "node:assert/strict"

import {
  assertNotProductionCollection,
  PRODUCTION_COLLECTION,
  ProductionCollectionGuardError,
} from "../tests/e2e/collection-guard"

assert.equal(
  PRODUCTION_COLLECTION,
  "rnui",
  "the production collection name drifted from what lib/counters-firestore.ts falls back to"
)

assert.throws(
  () => assertNotProductionCollection("rnui", "http://localhost:3000"),
  ProductionCollectionGuardError,
  "the guard must refuse a server that reports the production collection"
)

assert.doesNotThrow(
  () => assertNotProductionCollection("rnui-e2e", "http://localhost:3000"),
  "the guard must allow a server that reports a non-production collection"
)

console.log(
  'OK — the collection guard refuses "rnui" and allows anything else.'
)
