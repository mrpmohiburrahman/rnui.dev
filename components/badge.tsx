// components/badge.tsx
"use client"

import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "info" | "warning" | "error"
  className?: string
}

const variantClasses = {
  default: "bg-gray-200 text-gray-800",
  success: "bg-green-100 text-green-800",
  info: "bg-blue-100 text-blue-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
