import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function Logo() {
  return (
    <Button
      className="relative w-full size-14 rounded-full overflow-visible" // Allow overflow
      variant="outline"
      size="icon" // Use a fixed size variant
      asChild
    >
      <Link href="/" className="flex items-center justify-center">
        <div className="relative h-5 w-5">
          <Image
            src="/logo.png"
            alt="logo"
            layout="fill" // Make the image fill the container
            objectFit="contain" // Ensure the image maintains aspect ratio
            className="transform scale-150" // Scale the image to 150%
          />
        </div>
      </Link>
    </Button>
  )
}
