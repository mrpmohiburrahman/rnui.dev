// Shared Playwright e2e globals. Only the keys this suite adds to `window`.
// Kept separate from the app's own types so the two never fight over `Window`.
export {}

declare global {
  interface Window {
    /** Event log captured by tests/e2e/posthog-events.spec.ts. */
    __captured?: Array<[string, Record<string, unknown>]>
    /** Set once `posthog.capture` has been wrapped by the test spy. */
    __wrapped?: boolean
  }
}
