// tests/e2e/collection-guard.ts
//
// NEXT_PUBLIC_FIRESTORE_COLLECTION is inlined into the Next.js server bundle at
// BUILD time (lib/counters-firestore.ts:27). Setting it in the *test* process
// says nothing about what a server already running on :3000 was built with —
// and playwright.config.ts's `reuseExistingServer: !process.env.CI` means "the
// developer already had `pnpm start` up" is the normal case, not the edge case.
//
// So the guard asks the running server what it thinks its collection is
// (GET /api/counters-collection, which just echoes the constant it was built
// with) and refuses to let the suite start if the answer is "rnui" — the
// production collection. This is what caught vote_count on Recording
// 01KAY9B2AMN590C8YP5WTNDTHQ ("Wheel Picker") going 402 -> 419 across one
// session of test runs: tests/e2e/vote.spec.ts and tests/e2e/posthog-events.spec.ts
// click the real Vote control, which fires the real server action.

export const PRODUCTION_COLLECTION = "rnui"

export class ProductionCollectionGuardError extends Error {}

/**
 * Pure — no fetch, no server — so it can be exercised on its own. This is the
 * one runnable check: scripts/verify-collection-guard.ts calls it directly.
 */
export function assertNotProductionCollection(
  collection: string,
  serverUrl: string
): void {
  if (collection !== PRODUCTION_COLLECTION) return
  throw new ProductionCollectionGuardError(
    `Refusing to run the Playwright suite: the server at ${serverUrl} reports it is ` +
      `writing counters to "${PRODUCTION_COLLECTION}", the production Firestore ` +
      `collection. Rebuild and restart with a non-production collection set, e.g.:\n\n` +
      `  NEXT_PUBLIC_CDN_URL="http://localhost:3000" NEXT_PUBLIC_FIRESTORE_COLLECTION="rnui-e2e" pnpm build\n` +
      `  NEXT_PUBLIC_CDN_URL="http://localhost:3000" NEXT_PUBLIC_FIRESTORE_COLLECTION="rnui-e2e" pnpm start\n`
  )
}

/** Asks the server directly, then applies the pure check above. */
export async function assertServerNotWritingToProduction(
  serverUrl: string
): Promise<void> {
  const endpoint = `${serverUrl}/api/counters-collection`
  const res = await fetch(endpoint).catch((error) => {
    throw new Error(
      `Collection guard could not reach ${endpoint}: ${error}. Is a server ` +
        `actually running on ${serverUrl}?`
    )
  })
  if (!res.ok) {
    throw new Error(
      `Collection guard got ${res.status} from ${endpoint}. Is the right server ` +
        `running on ${serverUrl}?`
    )
  }
  const { collection } = (await res.json()) as { collection: string }
  assertNotProductionCollection(collection, serverUrl)
}
