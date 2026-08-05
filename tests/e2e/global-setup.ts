// tests/e2e/global-setup.ts
//
// Runs once, after playwright.config.ts's `webServer` has already made sure
// something answers at baseURL (freshly started, or reused per
// `reuseExistingServer: !process.env.CI`) and strictly before any test file —
// including vote.spec.ts and posthog-events.spec.ts, which fire the real Vote
// server action. See tests/e2e/collection-guard.ts for why this has to ask
// the running server rather than trust this process's own env.
import { assertServerNotWritingToProduction } from "./collection-guard"

export default async function globalSetup() {
  await assertServerNotWritingToProduction("http://localhost:3000")
}
