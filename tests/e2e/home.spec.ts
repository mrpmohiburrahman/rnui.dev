import { expect, test } from "@playwright/test"

test("home page renders catalog and search", async ({ page }) => {
  await page.goto("/")
  await expect(page).not.toHaveTitle(/error/i)

  // Hero / title visible
  await expect(page.getByText("Awesome React Native UI")).toBeVisible()

  // Search input present
  await expect(page.locator("input[placeholder]")).toBeVisible()
})
