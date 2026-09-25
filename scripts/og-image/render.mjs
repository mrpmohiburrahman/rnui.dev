import { chromium } from "@playwright/test"
import { fileURLToPath } from "node:url"
import path from "node:path"

const here = path.dirname(fileURLToPath(import.meta.url))
const html = path.join(here, "og-image.html")
const out = path.join(here, "..", "..", "public", "og-rnui-dev.png")

const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})
await page.goto(`file://${html}`)
await page.waitForLoadState("networkidle")
await page.screenshot({ path: out, type: "png" })
await browser.close()
console.log(`wrote ${out}`)