import { expect, test } from "@playwright/test"

import { recordServerActions } from "./server-actions"

// A view is a recording watched, not a button pressed (ADR-0007). There is no
// play control left to press: a Demo counts once it has actually advanced two
// seconds while holding one of the five playback slots, at most once per Entry
// per browser session.
//
// This file used to assert the opposite — that playing the Demo *in the modal*
// was the one view. Both halves of the rule it now pins are called load-bearing
// by ADR-0007's own consequences: drop the threshold and this is an impression
// count, drop the cap and it is a scroll counter.
test("a page of autoplaying Demos bills each Entry once, and a reload bills none", async ({
  browser,
}) => {
  let beforeReload = 0

  const fired = await recordServerActions(
    browser,
    "/",
    async (page, sofar) => {
      // Polled rather than slept: the first view lands two seconds after the
      // tile starts playing, and how long the Demo takes to arrive from the CDN
      // is not this test's to guess.
      await expect
        .poll(() => sofar.length, {
          timeout: 20_000,
          message: "no Demo ever played long enough to count",
        })
        .toBeGreaterThan(0)
      // Long enough for the rest of the granted five to cross the threshold too.
      await page.waitForTimeout(2_000)
      beforeReload = sofar.length

      // Same tab, so sessionStorage survives — which is the cap's whole storage.
      await page.reload()
      await page.waitForTimeout(4_000)
    },
    { playDemos: true }
  )

  // At most five, because at most five ever played: the cap on concurrent
  // playback is what bounds the metric (ADR-0007's last line).
  expect(beforeReload).toBeGreaterThan(0)
  expect(beforeReload).toBeLessThanOrEqual(5)

  // One per Entry. The body is the only place the id appears — the address is
  // the page's and the Next-Action header is opaque.
  const entries = new Set(fired.map((action) => action.body))
  expect(entries.size).toBe(fired.length)
  for (const body of entries) expect(body).toMatch(/^\["[0-9A-Z]{26}"\]$/)

  // The reload replayed every one of those Demos past two seconds and billed
  // nothing, which is the once-per-Entry-per-session cap.
  expect(fired).toHaveLength(beforeReload)
})
