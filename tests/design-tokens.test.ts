import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import config from "../tailwind.config"

// The design system, pinned twice so it cannot drift in silence.
//
// The expectations in this file are written out by hand — deliberately not
// imported from app/globals.css or tailwind.config.ts — so a token that
// changes, or is deleted, is caught here. A test that takes its expectation
// from the thing under test can no longer catch that thing being wrong. Do not
// merge the two. See docs/adr/0005-the-data-test-states-the-asset-path-rules-independently.md.
//
// The source of truth these hand-written values restate is the Studio Dark
// block in app/globals.css, which was written from assets/new-ui/Specimen.dc.html
// plus the Tile/Detail/CatalogueMobile extras ticket 02 arbitrated.
const EXPECTED: Record<"dark" | "light", Record<string, string>> = {
  light: {
    "--canvas": "#F4F4F1",
    "--panel": "#FFFFFF",
    "--rail": "#EFEFEB",
    "--header": "rgba(244,244,241,0.94)",
    "--line": "rgba(16,18,22,0.13)",
    "--line2": "rgba(16,18,22,0.24)",
    "--t1": "#14161A",
    "--t2": "#4F545C",
    "--t3": "#666B74",
    "--acc": "#0E7062",
    "--acc-soft": "rgba(14,112,98,0.09)",
    "--on-acc": "#FFFFFF",
    "--field": "#FFFFFF",
    "--filter-bar": "#FFFFFF",
    "--empty": "#FBFBF9",
    "--x-bg": "rgba(16,18,22,0.10)",
    "--scrim": "rgba(24,26,30,0.52)",
    "--skel": "rgba(16,18,22,0.07)",
    "--new-fg": "#5C4204",
    "--raise": "#FFFFFF",
    "--plinth": "#080A0E",
    "--ctrl": "#FFFFFF",
    "--well": "#FBFBF9",
    "--bar-track": "rgba(16,18,22,0.10)",
    "--bar-fill": "rgba(16,18,22,0.34)",
    "--new-bg": "rgba(255,238,190,0.94)",
    "--dock": "rgba(239,239,235,0.96)",
  },
  dark: {
    "--canvas": "#0A0B0D",
    "--panel": "#101216",
    "--rail": "#0C0D11",
    "--header": "rgba(10,11,13,0.92)",
    "--line": "rgba(255,255,255,0.11)",
    "--line2": "rgba(255,255,255,0.22)",
    "--t1": "#F1F2F4",
    "--t2": "#B2B8C2",
    "--t3": "#8E949F",
    "--acc": "#6FE3CC",
    "--acc-soft": "rgba(111,227,204,0.13)",
    "--on-acc": "#06120F",
    "--field": "rgba(255,255,255,0.045)",
    "--filter-bar": "rgba(255,255,255,0.03)",
    "--empty": "rgba(255,255,255,0.02)",
    "--x-bg": "rgba(255,255,255,0.13)",
    "--scrim": "rgba(4,5,8,0.74)",
    "--skel": "rgba(255,255,255,0.07)",
    "--new-fg": "#F3DEA6",
    "--raise": "#15181D",
    "--plinth": "#05060A",
    "--ctrl": "rgba(255,255,255,0.04)",
    "--well": "rgba(255,255,255,0.03)",
    "--bar-track": "rgba(255,255,255,0.09)",
    "--bar-fill": "rgba(255,255,255,0.34)",
    "--new-bg": "rgba(235,208,138,0.22)",
    "--dock": "rgba(12,13,17,0.94)",
  },
}

const css = readFileSync("app/globals.css", "utf8")

// The shadcn tokens live in the first @layer base block and the Studio Dark
// palette in the second, so the palette block is the one that declares
// --canvas. Split on the layer opener and keep the block that does.
const studioLayer = css
  .split("@layer base {")
  .find((block) => block.includes("--canvas"))

function parseVars(block: string): Record<string, string> {
  const vars: Record<string, string> = {}
  const re = /(--[a-z0-9-]+)\s*:\s*([^;}]+);/g
  let match: RegExpExecArray | null
  while ((match = re.exec(block))) {
    vars[match[1]] = match[2].trim()
  }
  return vars
}

const rootBlock = studioLayer?.match(/:root\s*\{([^}]*)\}/)?.[1]
const darkBlock = studioLayer?.match(/\.dark\s*\{([^}]*)\}/)?.[1]

const rootVars = parseVars(rootBlock ?? "")
const darkVars = parseVars(darkBlock ?? "")

describe("studio dark tokens", () => {
  it("the palette block exists in globals.css", () => {
    expect(studioLayer, "no @layer base block declares --canvas").toBeTruthy()
    expect(rootBlock).toBeTruthy()
    expect(darkBlock).toBeTruthy()
  })

  it("all twenty-seven palette tokens are declared in :root with the exact values", () => {
    expect(rootVars).toMatchObject(EXPECTED.light)
  })

  it("all twenty-seven palette tokens are declared in .dark with the exact values", () => {
    expect(darkVars).toMatchObject(EXPECTED.dark)
  })

  it("the elevation tokens and tile hue are declared", () => {
    expect(rootVars["--tile-hue"]).toBe("175")
    expect(rootVars["--e0"]).toBe("0 0 0 1px rgba(16,18,22,0.10)")
    expect(rootVars["--e2"]).toBe("0 40px 100px -30px rgba(16,18,22,0.45)")
    expect(darkVars["--e0"]).toBe("0 0 0 1px rgba(255,255,255,0.07)")
    expect(darkVars["--e2"]).toBe("0 40px 120px -30px rgba(0,0,0,0.9)")
    expect(darkVars["--e1"]).toContain("hsla(var(--tile-hue),60%,60%,0.24)")
    expect(rootVars["--e1"]).toContain("hsla(var(--tile-hue),55%,40%,0.55)")
  })
})

describe("tailwind surfaces the tokens", () => {
  const colors = config.theme!.extend!.colors as Record<string, unknown>
  const colorVar = (key: string) => colors[key]
  const declaredVars = new Set([
    ...Object.keys(rootVars),
    ...Object.keys(darkVars),
  ])

  it("every theme.extend.colors key that references a var() points at a declared variable", () => {
    const referencing = Object.entries(colors).filter(
      ([, value]) => typeof value === "string" && value.startsWith("var(--")
    )
    expect(referencing.length).toBeGreaterThan(0)
    for (const [key, value] of referencing) {
      if (typeof value !== "string") continue
      const name = value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1]
      expect(
        name,
        `theme.extend.colors.${key} = "${value}" is not a var()`
      ).toBeTruthy()
      expect(
        declaredVars,
        `"${name}" is not declared in globals.css`
      ).toContain(name)
    }
  })

  it("every palette token is surfaced as a theme.extend.colors key", () => {
    for (const token of Object.keys(EXPECTED.dark)) {
      const key = token.slice(2)
      expect(
        colorVar(key),
        `theme.extend.colors.${key} is missing or not "var(${token})"`
      ).toBe(`var(${token})`)
    }
  })
})

describe("the font wiring matches layout.tsx", () => {
  const fontFamily = config.theme!.extend!.fontFamily!
  const layout = readFileSync("app/layout.tsx", "utf8")

  it("font-sans and font-mono lead with the loaded variables", () => {
    expect(fontFamily.sans[0]).toBe("var(--font-grotesk)")
    expect(fontFamily.mono[0]).toBe("var(--font-jetbrains)")
  })

  it("the two variable names are the two variable: strings in app/layout.tsx", () => {
    const passed = [...layout.matchAll(/variable:\s*["'](--[a-z0-9-]+)["']/g)]
      .map((m) => m[1])
      .sort()
    expect(passed).toEqual(["--font-grotesk", "--font-jetbrains"].sort())
  })
})
