// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/onboardings")) {
    return NextResponse.redirect(
      new URL("/products?category=Onboarding", request.url)
    )
  }

  if (pathname.startsWith("/another-old-page")) {
    return NextResponse.redirect(new URL("/another-new-page", request.url))
  }

  // Add more redirection rules as needed

  return NextResponse.next()
}

export const config = {
  matcher: "/:path*", // Apply middleware to all routes
}
