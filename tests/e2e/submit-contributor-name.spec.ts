import { expect, test } from "@playwright/test"

import { getUniqueContributors } from "../../data/recording"

// Ticket 13. A Contributor's name is their identity (ADR-0009), so the submit
// form suggests the names the catalogue already holds and adopts the catalogue's
// exact spelling once the typed name means one of them.
//
// This is the only test that proves the names reach the browser at all, which is
// the entire reason app/submit/page.tsx is a server component: the list is
// computed from `data/recording.ts`, and importing that from the client would
// ship all 280 Recordings to every visitor who opens the form.
const NAMES = getUniqueContributors()
const EXISTING = "Hewad Mubariz"
const PREFIX = "Hew"

test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

test("the name field suggests the catalogue's Contributors", async ({
  page,
}) => {
  await page.goto("/submit")
  // Guards the fixture against the data rather than against itself: if this name
  // ever leaves the catalogue the assertions below are testing nothing.
  expect(NAMES).toContain(EXISTING)

  const field = page.getByLabel("CONTRIBUTOR NAME")
  await field.fill(PREFIX)

  const list = page.getByRole("listbox", { name: "Existing Contributors" })
  await expect(list).toBeVisible()
  await expect(list.getByRole("option").first()).toHaveText(EXISTING)
  await expect(field).toHaveAttribute("aria-expanded", "true")
})

test("Enter accepts the highlighted suggestion instead of submitting", async ({
  page,
}) => {
  await page.goto("/submit")
  const field = page.getByLabel("CONTRIBUTOR NAME")
  await field.fill(PREFIX)
  await field.press("ArrowDown")
  await field.press("Enter")

  await expect(field).toHaveValue(EXISTING)
  await expect(page.getByRole("listbox")).toHaveCount(0)
})

// The other half of that rule, and the one a careless handler gets wrong: Enter
// with the list open but nothing highlighted must take nothing.
test("Enter with no row highlighted does not take the first suggestion", async ({
  page,
}) => {
  await page.goto("/submit")
  const field = page.getByLabel("CONTRIBUTOR NAME")
  await field.fill(PREFIX)
  await expect(page.getByRole("listbox")).toBeVisible()

  await field.press("Enter")
  await expect(field).toHaveValue(PREFIX)
})

test("Escape closes the list and leaves the text alone", async ({ page }) => {
  await page.goto("/submit")
  const field = page.getByLabel("CONTRIBUTOR NAME")
  await field.fill(PREFIX)
  await expect(page.getByRole("listbox")).toBeVisible()

  await field.press("Escape")
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await expect(field).toHaveValue(PREFIX)
})

test("a name that already means a Contributor is said out loud", async ({
  page,
}) => {
  await page.goto("/submit")
  const field = page.getByLabel("CONTRIBUTOR NAME")
  // Typed the way somebody who is not copying would: same name, wrong case.
  await field.fill(EXISTING.toLowerCase())

  const note = page.locator("p").filter({ hasText: "Existing Contributor" })
  await expect(note).toContainText(EXISTING)
})

test("a name the catalogue does not have is not claimed to be one", async ({
  page,
}) => {
  await page.goto("/submit")
  await page.getByLabel("CONTRIBUTOR NAME").fill("Nobody Of The Catalogue")

  await expect(
    page.locator("p").filter({ hasText: "Existing Contributor" })
  ).toHaveCount(0)
  await expect(page.getByRole("listbox")).toHaveCount(0)
})
