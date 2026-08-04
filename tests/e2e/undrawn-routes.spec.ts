import { expect, test } from "@playwright/test"

// Ticket 12 — the five routes the mock does not draw. The acceptance bullets
// for /aboutus, /contactus, /subscribe, /privacypolicy and /termsofservice:
// one h1 each at the hero step, the mono eyebrow opening, left-aligned bodies,
// no literal colour classes in the source, and the behaviour changes on
// /subscribe (server action + localStorage key) and /contactus (still writes).

test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.route("**/demo/**", (route) => route.abort())
})

const ROUTES = [
  { route: "/aboutus", eyebrow: "ABOUT" },
  { route: "/contactus", eyebrow: "CONTACT" },
  { route: "/subscribe", eyebrow: "NOTIFY" },
  { route: "/privacypolicy", eyebrow: "PRIVACY" },
  { route: "/termsofservice", eyebrow: "TERMS" },
] as const

const heroCSS = { "font-size": "29px", "font-weight": "500" }

for (const { route, eyebrow } of ROUTES) {
  test.describe(`${route}`, () => {
    test("opens with the mono eyebrow, exactly one h1 at the hero step, and prose in t2", async ({
      page,
    }) => {
      await page.goto(route)
      const main = page.locator("main")

      // Eyebrow: mono 9px, +0.14em letter-spacing, t3.
      const mono = main.locator("span", {
        hasText: eyebrow,
      })
      await expect(mono).toBeVisible()
      await expect(mono).toHaveCSS("font-size", "9px")
      await expect(mono).toHaveCSS("letter-spacing", "1.26px")

      await expect(page.locator("h1")).toHaveCount(1)
      await expect(page.locator("h1")).toHaveCSS(
        "font-size",
        heroCSS["font-size"]
      )
      await expect(page.locator("h1")).toHaveCSS(
        "font-weight",
        heroCSS["font-weight"]
      )

      // At least one body paragraph in t2 prose. The first <p> on every legal
      // page is the mono metric line ("Last Updated …"), so target the prose
      // class rather than the first paragraph.
      await expect(main.locator("p.text-t2").first()).toBeVisible()
      await expect(main.locator("p.text-t2").first()).toHaveCSS(
        "color",
        "rgb(79, 84, 92)"
      )
    })

    test("every route keeps the rail and the footer", async ({ page }) => {
      await page.goto(route)
      await expect(page.locator("aside")).toBeVisible()
      // Scoped to the footer: "rnui.dev" also reads the header brand and the
      // /aboutus h1 on this page, and NOTIFY the page's own eyebrow on /subscribe.
      const footer = page.locator("footer")
      await expect(footer.getByText("rnui.dev")).toBeVisible()
      await expect(footer.getByText("NOTIFY")).toBeVisible()
    })
  })
}

test.describe("/aboutus", () => {
  test("has no href='#' and the cone-slider link resolves to cone-slider", async ({
    page,
  }) => {
    await page.goto("/aboutus")
    const dead = page.locator('a[href="#"]')
    await expect(dead).toHaveCount(0)

    const cone = page.locator('a[href*="react-native-cone-slider"]')
    await expect(cone).toHaveCount(1)
    await expect(cone).toHaveText(/cone-slider/)
  })

  test("Hire me is a real link to /contactus", async ({ page }) => {
    await page.goto("/aboutus")
    const hire = page.getByRole("link", { name: "Hire me" })
    await expect(hire).toHaveAttribute("href", "/contactus")
  })

  test("carries its own title, not the root one", async ({ page }) => {
    await page.goto("/aboutus")
    await expect(page).toHaveTitle(/About/)
  })
})

test.describe("/contactus", () => {
  // The acceptance bullet: typed value AND placeholder in every field are both
  // legible in dark mode — the defect at the old page's black-on-black fields.
  // Read computed colours and compute WCAG contrast against the field
  // background; both must clear 4.5:1.
  test("typed and placeholder text stay legible in both modes", async ({
    browser,
  }) => {
    for (const scheme of ["dark", "light"] as const) {
      const context = await browser.newContext({ colorScheme: scheme })
      const page = await context.newPage()
      await page.route("**/*posthog.com/**", (r) => r.abort())
      await page.route("**/demo/**", (r) => r.abort())
      await page.goto("/contactus")

      const field = page.locator("main").getByLabel("EMAIL")
      await field.fill("a@b.com")

      const { valueContrast, placeholderContrast } = await page.evaluate(() => {
        const el = document.querySelector<HTMLInputElement>("#email")!
        const parse = (c: string) => {
          const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
          if (!m) return null
          return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] as const
        }
        // The field's own background is translucent (dark `--field` is
        // rgba(255,255,255,0.045)), so its effective background is whatever the
        // ancestor chain composites it over — up to the opaque body canvas.
        const chain: HTMLElement[] = [el]
        for (
          let node = el.parentElement;
          node && node.nodeType === 1;
          node = node.parentElement
        ) {
          chain.push(node)
          if (node === document.body) break
        }
        chain.reverse() // body … parent … el, bottom to top
        const [br, bg1, bb] = parse(
          getComputedStyle(document.body).backgroundColor
        )!
        let [r, g, b] = [br, bg1, bb]
        for (const node of chain.slice(1)) {
          const bg = parse(getComputedStyle(node).backgroundColor)
          if (!bg || bg[3] === 0) continue
          const [cr, cg, cb, ca] = bg
          r = cr * ca + r * (1 - ca)
          g = cg * ca + g * (1 - ca)
          b = cb * ca + b * (1 - ca)
        }
        const ratio = (fg: string) => {
          const [fr, fg1, fb, fa] = parse(fg)!
          const cr = fr * fa + r * (1 - fa)
          const cg = fg1 * fa + g * (1 - fa)
          const cb = fb * fa + b * (1 - fa)
          const lum = (x: number, y: number, z: number) => {
            const f = (v: number) => {
              const c = v / 255
              return c <= 0.03928
                ? c / 12.92
                : Math.pow((c + 0.055) / 1.055, 2.4)
            }
            return 0.2126 * f(x) + 0.7152 * f(y) + 0.0722 * f(z)
          }
          const l1 = lum(cr, cg, cb)
          const l2 = lum(r, g, b)
          const [hi, lo] = [Math.max(l1, l2), Math.min(l1, l2)]
          return (hi + 0.05) / (lo + 0.05)
        }
        const style = getComputedStyle(el)
        return {
          valueContrast: ratio(style.color),
          placeholderContrast: ratio(
            getComputedStyle(el, "::placeholder").color
          ),
        }
      })

      expect(
        valueContrast,
        `${scheme} typed value contrast`
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        placeholderContrast,
        `${scheme} placeholder contrast`
      ).toBeGreaterThanOrEqual(4.5)

      await context.close()
    }
  })

  test("invalid email shows the validation message", async ({ page }) => {
    await page.goto("/contactus")
    const main = page.locator("main")
    await main.getByLabel("FIRST NAME").fill("Jane")
    await main.getByLabel("LAST NAME").fill("Doe")
    await main.getByLabel("EMAIL").fill("a@b")
    await main.getByLabel("MESSAGE").fill("Hello")
    await main.getByRole("button", { name: "Submit" }).click()
    await expect(
      page.getByText("Please enter a valid email address.")
    ).toBeVisible()
  })

  test("has exactly one h1 and it reads Contact us", async ({ page }) => {
    await page.goto("/contactus")
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(
      page.getByRole("heading", { level: 1, name: "Contact us" })
    ).toBeVisible()
  })

  test("the submit transition is 120ms, and 0s under reduced motion", async ({
    page,
  }) => {
    await page.goto("/contactus")
    const button = page.getByRole("button", { name: "Submit" })
    await expect(button).toHaveCSS("transition-duration", "0.12s")
  })

  test("the submit transition computes 0s under prefers-reduced-motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/contactus")
    const button = page.getByRole("button", { name: "Submit" })
    await expect(button).toHaveCSS("transition-duration", "0s")
  })

  test("carries its own title", async ({ page }) => {
    await page.goto("/contactus")
    await expect(page).toHaveTitle(/Contact/)
  })
})

test.describe("/subscribe", () => {
  test("a valid submit writes the localStorage key for the footer's NOTIFY form", async ({
    page,
  }) => {
    await page.goto("/subscribe")
    const main = page.locator("main")
    await main.getByLabel("Email address").fill("subscriber@example.com")
    await main.getByRole("button", { name: "Subscribe" }).click()

    await expect(page.getByText(/You are on the list/)).toBeVisible()
    const key = await page.evaluate(() =>
      localStorage.getItem("newsletterSubscribed")
    )
    expect(key).toBe("true")
  })

  test("the footer's NOTIFY form shows its subscribed state on the next load", async ({
    page,
  }) => {
    await page.goto("/subscribe")
    await page.evaluate(() =>
      localStorage.setItem("newsletterSubscribed", "true")
    )
    await page.goto("/")
    await expect(page.getByText(/You are on the list/)).toBeVisible()
  })

  test("carries its own title", async ({ page }) => {
    await page.goto("/subscribe")
    await expect(page).toHaveTitle(/Subscribe/)
  })
})

test.describe("/privacypolicy and /termsofservice", () => {
  test("the heading outline is one h1 plus the section h2s", async ({
    page,
  }) => {
    await page.goto("/privacypolicy")
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(page.locator("h2")).toHaveCount(8)
    await expect(page.locator("h6")).toHaveCount(0)

    await page.goto("/termsofservice")
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(page.locator("h2")).toHaveCount(5)
    await expect(page.locator("h6")).toHaveCount(0)
  })

  test("no <br />• sequences, and real list markup", async ({ page }) => {
    for (const route of ["/privacypolicy", "/termsofservice"]) {
      await page.goto(route)
      await expect(page.locator("ul")).not.toHaveCount(0)
      const brs = await page.locator("br").count()
      expect(brs).toBe(0)
    }
  })

  test("both carry their own title", async ({ page }) => {
    await page.goto("/privacypolicy")
    await expect(page).toHaveTitle(/Privacy Policy/)
    await page.goto("/termsofservice")
    await expect(page).toHaveTitle(/Terms of Service/)
  })
})
