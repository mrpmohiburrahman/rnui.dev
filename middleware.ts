// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { LEGACY_REDIRECTS } from "@/data/categories"

export function middleware(request: NextRequest) {
  // A pathname always starts with "/", so it can never collide with an
  // inherited object key.
  const destination = LEGACY_REDIRECTS[request.nextUrl.pathname]
  if (destination) {
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // If no redirect is matched, proceed as normal
  return NextResponse.next()
}

// The paths the middleware runs on. Next.js parses this out of the source at
// build time and rejects anything it cannot read statically, so — like the
// catalogue merge in data/catalogue.ts — this is the one list the Category
// table cannot generate. tests/data-integrity.test.ts asserts it matches.
export const config = {
  matcher: [
    "/accordions",
    "/arcsliders",
    "/bottomsheets",
    "/buttons",
    "/carousels",
    "/charts",
    "/circular-progress-bars",
    "/dropdowns",
    "/fullapps",
    "/headers",
    "/lists",
    "/loaders",
    "/miscellaneous",
    "/onboardings",
    "/parallaxes",
    "/pickers",
    "/sliders",
    "/tabbars",
  ],
}
