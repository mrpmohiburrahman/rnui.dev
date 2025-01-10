// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define a mapping of old paths to new URLs
const redirects: { [key: string]: string } = {
  "/onboardings": "/products?category=Onboarding",
  "/carousels": "/products?category=Carousels",
  "/parallaxes": "/products?category=Parallaxes",
  "/dropdowns": "/products?category=Drop%20Down",
  "/pickers": "/products?category=Pickers",
  "/headers": "/products?category=Headers",
  "/lists": "/products?category=List",
  "/arcsliders": "/products?category=Arc%20Sliders",
  "/sliders": "/products?category=Sliders",
  "/tabbars": "/products?category=Tab%20bars",
  "/bottomsheets": "/products?category=Bottom%20Sheets",
  "/loaders": "/products?category=Loaders",
  "/circular-progress-bars": "/products?category=Circular%20Progress%20Bars",
  "/charts": "/products?category=Charts",
  "/buttons": "/products?category=Buttons",
  "/accordions": "/products?category=Accordions",
  "/miscellaneous": "/products?category=Misc",
  "/fullapps": "/products?category=Full%20Apps",
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Use Object.hasOwn to check for property existence
  if (Object.hasOwn(redirects, pathname)) {
    const destination = redirects[pathname]
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // If no redirect is matched, proceed as normal
  return NextResponse.next()
}

// Specify the paths the middleware should run on
export const config = {
  matcher: [
    "/onboardings",
    "/carousels",
    "/parallaxes",
    "/dropdowns",
    "/pickers",
    "/headers",
    "/lists",
    "/arcsliders",
    "/sliders",
    "/tabbars",
    "/bottomsheets",
    "/loaders",
    "/circular-progress-bars",
    "/charts",
    "/buttons",
    "/accordions",
    "/miscellaneous",
    "/fullapps",
  ],
}
