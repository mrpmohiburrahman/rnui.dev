// app/404.tsx
import { Suspense } from "react"
import Link from "next/link"

import { NavSidebar } from "@/components/nav/nav-side-bar"

export default function NotFound() {
  return (
    <>
      <div className="flex">
        <Suspense fallback={<div>Loading sidebar...</div>}>
          <NavSidebar categories={[]} /> {/* Pass necessary props */}
        </Suspense>
        <main className="p-4 pl-96">
          <h1>404 - Page Not Found</h1>
          <p>Sorry, the page you are looking for does not exist.</p>
          <p className="text-sm text-gray-500 mt-6">
            navigate back to our
            <Link
              href="/"
              className="text-blue-500 hover:underline"
              prefetch={false}
            >
              Home Page
            </Link>
            .
          </p>
        </main>
      </div>
    </>
  )
}
