import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Source-map upload is wired into next.config.ts, and @posthog/nextjs-config
// throws from `resolveConfig` the moment the config module is evaluated if the
// upload is enabled without credentials. next.config.ts is evaluated by `next
// dev` too, so an unguarded wrapper would stop a contributor who has no PostHog
// personal API key from running the site at all. The guard is the whole reason
// this file exists.

const CREDENTIALS = ["POSTHOG_API_KEY", "POSTHOG_PROJECT_ID"] as const

type LoadedConfig = {
  productionBrowserSourceMaps?: boolean
  compiler?: { runAfterProductionCompile?: unknown }
  redirects: () => Promise<unknown[]>
}
type ConfigFn = (
  phase: string,
  ctx: { defaultConfig: Record<string, unknown> }
) => LoadedConfig | Promise<LoadedConfig>

async function loadConfig(): Promise<LoadedConfig> {
  vi.resetModules()
  const exported = (await import("@/next.config")).default as unknown as
    | ConfigFn
    | LoadedConfig

  // withPostHogConfig returns the function form of a Next config; the bare
  // object is what next.config.ts exports when the wrapper is not applied.
  return typeof exported === "function"
    ? await exported("phase-production-build", { defaultConfig: {} })
    : exported
}

describe("next.config", () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of CREDENTIALS) {
      saved[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    for (const key of CREDENTIALS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
  })

  it("uploads source maps when the build has PostHog credentials", async () => {
    process.env.POSTHOG_API_KEY = "phx_test"
    process.env.POSTHOG_PROJECT_ID = "117415"

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

  it("keeps the /feedback redirect whether or not the upload is on", async () => {
    for (const credentialled of [false, true]) {
      if (credentialled) {
        process.env.POSTHOG_API_KEY = "phx_test"
        process.env.POSTHOG_PROJECT_ID = "117415"
      }

      const config = await loadConfig()
      const redirects = await config.redirects()

      // The wrapper takes the whole user config apart and rebuilds it. A
      // rebuild that dropped this would 404 a live URL, silently.
      expect(redirects).toContainEqual({
        source: "/feedback",
        destination: "/contactus",
        permanent: false,
      })
    }
  })
})
