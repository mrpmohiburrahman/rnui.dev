import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// The credentials guard in next.config.ts is the whole reason this file exists.
// Both of its branches are pinned here, and so is the redirect the wrapper
// takes apart and rebuilds on the way through.

type LoadedConfig = {
  productionBrowserSourceMaps?: boolean
  compiler?: { runAfterProductionCompile?: unknown }
  redirects: () => Promise<unknown[]>
}
type ConfigFn = (
  phase: string,
  ctx: { defaultConfig: Record<string, unknown> }
) => LoadedConfig | Promise<LoadedConfig>

function withCredentials() {
  vi.stubEnv("POSTHOG_API_KEY", "phx_test")
  vi.stubEnv("POSTHOG_PROJECT_ID", "117415")
}

async function loadConfig(): Promise<LoadedConfig> {
  vi.resetModules()
  // withPostHogConfig is typed as returning NextConfig but returns the function
  // form of one, so neither branch of this can be reached by the declared type.
  const exported = (await import("@/next.config")).default as unknown as
    | ConfigFn
    | LoadedConfig

  return typeof exported === "function"
    ? await exported("phase-production-build", { defaultConfig: {} })
    : exported
}

describe("next.config", () => {
  // Cleared rather than left to the environment: whoever runs the suite may
  // have the real credentials exported, which would quietly invert the
  // no-credentials case into a second copy of the credentialled one.
  beforeEach(() => {
    vi.stubEnv("POSTHOG_API_KEY", undefined)
    vi.stubEnv("POSTHOG_PROJECT_ID", undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("uploads source maps when the build has PostHog credentials", async () => {
    withCredentials()

    const config = await loadConfig()

    // Turbopack emits browser source maps only when asked, and the compile hook
    // is what hands the built directory to the PostHog CLI. Both together are
    // what turns a minified stack trace into a real file and line.
    expect(config.productionBrowserSourceMaps).toBe(true)
    expect(typeof config.compiler?.runAfterProductionCompile).toBe("function")
  })

  it("builds without them rather than throwing", async () => {
    const config = await loadConfig()

    expect(config.productionBrowserSourceMaps).toBeFalsy()
    expect(config.compiler?.runAfterProductionCompile).toBeUndefined()
  })

  it.each([
    ["upload on", true],
    ["upload off", false],
  ])(
    "keeps the /feedback redirect with the %s",
    async (_label, credentialled) => {
      if (credentialled) withCredentials()

      const redirects = await (await loadConfig()).redirects()

      // Dropping this would 404 a live URL, silently.
      expect(redirects).toContainEqual({
        source: "/feedback",
        destination: "/contactus",
        permanent: false,
      })
    }
  )
})
