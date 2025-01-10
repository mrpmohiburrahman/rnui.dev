// app/not-found.tsx
import { redirect } from "next/navigation"

export default function NotFound() {
  redirect("/")
}
