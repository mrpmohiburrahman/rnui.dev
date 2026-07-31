import { expect, test } from "@playwright/test"

// The date is a build-time JSON import, but an effect used to render
// `Loading last updated date...` first — a string wider than the value that
// replaced it, in a fixed-padding pill inside a flex row with nothing reserving
// the width. The row shifted one render after the grid appeared.
//
// `request.get` rather than `page.goto`: it runs no JavaScript, so this reads what
// the server actually sent, and the placeholder was the server's own first render.
// The width the placeholder cost is deliberately not asserted here. Measuring it
// means catching the page between paint and hydration, and every shape of that
// tried so far — a `commit` navigation, held-back chunks — still measured after
// the swap and so passed against the defect. What the row cannot shift by is
// covered by this: with the final value in the first byte, there is no swap left.
test("the served HTML carries the date, not a placeholder", async ({
  request,
}) => {
  const html = await (await request.get("/")).text()

  expect(html).not.toContain("Loading last updated date")
  expect(html).toContain("Updated:")
  // The formatted value itself, not just the label.
  expect(html).toMatch(/\d+ (second|minute|hour|day|week|month|year)s? ago/)
})
