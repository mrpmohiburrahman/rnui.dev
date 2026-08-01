import { expect, test } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"
import {
  expectOneRecordingTargeted,
  recordServerActions,
} from "./server-actions"

// A view is a recording watched, not a button pressed (ADR-0007). There is no
// play control left to press on the grid: a Demo counts once it has actually
// advanced two seconds while holding one of the five playback slots, at most
// once per Recording per browser session. Two deliberate acts count as well and are
// uncapped — opening a Recording, and following its source link out (ADR-0007:3).
//
// This file used to assert the opposite — that playing the Demo *in the modal*
// was the one view. Both halves of the autoplay rule it now pins are called
// load-bearing by ADR-0007's own consequences: drop the threshold and this is an
// impression count, drop the cap and it is a scroll counter.
test("a page of autoplaying Demos bills each Recording once, and a reload bills none", async ({
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

  // One per Recording. The body is the only place the id appears — the address is
  // the page's and the Next-Action header is opaque.
  const recordings = new Set(fired.map((action) => action.body))
  expect(recordings.size).toBe(fired.length)
  for (const body of recordings) expect(body).toMatch(/^\["[0-9A-Z]{26}"\]$/)

  // The reload replayed every one of those Demos past two seconds and billed
  // nothing, which is the once-per-Recording-per-session cap.
  expect(fired).toHaveLength(beforeReload)
})

// The other two signals, and the only two a visitor under prefers-reduced-motion
// can ever produce — no Demo is mounted for them at all. Demos are aborted here
// so the autoplay signal cannot land in the middle of the claim; what is left is
// exactly the deliberate acts.
test("opening a Recording and following its Source link bill one view each", async ({
  browser,
}) => {
  const fired = await recordServerActions(browser, "/", async (page) => {
    // The panel's Source link is a target=_blank to a real repository. Left
    // alone the popup fetches github.com on every run, which is neither this
    // test's claim nor its to pay for.
    await page
      .context()
      .route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => route.abort())

    // The heading, not the card: the bookmark button sits over the top-right
    // corner and the Demo fills the top. Both open the Recording the same way.
    await page.getByRole("heading", { level: 3 }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("link", { name: "GitHub Repository" }).click()
  })

  // Two, from one Recording. expectNoActionRepeated is deliberately not used: this
  // is the same action id twice, which is the thing being asserted rather than a
  // double billing. Three would mean the panel's Demo counted a press as well.
  expect(fired).toHaveLength(2)
  expectOneRecordingTargeted(fired)
})

// Two claims about the standalone Recording page, which is the one place they can be
// seen apart: it has no grid, so no playback owner and no autoplay, and nothing
// clicked a card to get here. Every action recorded is therefore attributable.
//
// The open is counted from an effect rather than a click because there is no
// click — the visitor arrived from a shared link or a cmd-clicked headline, and
// ADR-0007:3 counts that as an open all the same.
test("a Recording opened cold counts one view, and playing its Demo adds none", async ({
  page,
}) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())

  const fired: string[] = []
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"])
      fired.push(request.postData() ?? "")
  })

  const recording = allRecordings[0]
  await page.goto(`/recording/${recording.id}`)

  // Exactly one, and it names this Recording. Polled rather than slept: the effect
  // fires after hydration, and how long that takes is not this test's to guess.
  await expect
    .poll(() => fired.length, {
      timeout: 20_000,
      message: "the cold open billed no view",
    })
    .toBe(1)
  expect(fired[0]).toBe(JSON.stringify([recording.id]))

  await page.getByRole("button", { name: "Play video" }).click()

  // Played, not merely mounted. Past the two-second threshold on purpose: a Demo
  // stopped at 0.1s would satisfy "the press billed nothing" vacuously.
  const video = page.locator("video")
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime), {
      timeout: 20_000,
      message: "the Demo never played",
    })
    .toBeGreaterThan(2)

  // Still one. InteractiveVideo cannot tell watched from pressed, so it counts
  // nothing at all — only the playback owner holds enough to decide, and it is
  // not on this page.
  expect(fired).toHaveLength(1)
})
