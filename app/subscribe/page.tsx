// app/subscribe/page.tsx
"use client"

import { useState } from "react"
import { addDoc, collection, Timestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Determine the collection name based on the environment
const COLLECTION_NAME =
  process.env.NEXT_PUBLIC_FIRESTORE_EMAIL_COLLECTION || "emails"
export default function Page() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!email) {
        throw new Error("Email is required")
      }

      // Reference to the 'emails' collection
      const emailsRef = collection(db, COLLECTION_NAME)

      // Add a new document with the email and timestamp
      await addDoc(emailsRef, {
        email: email,
        createdAt: Timestamp.now(),
      })

      setSuccess(true)
      setEmail("")
      console.log("Form submitted and email stored in Firebase")
    } catch (err) {
      console.error("Error storing email:", err)
      setError("An unexpected error occurred. Please, try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black mb-96 ">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Awesome React Native UI
      </h2>

      <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
        Get notified when new animation is being added
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="youremail@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </LabelInputContainer>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {success && (
          <p className="text-green-500 text-sm mb-4">
            Thank you for signing up!
          </p>
        )}

        <button
          className={`bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          type="submit"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Sign up →"}
          <BottomGradient />
        </button>
      </form>
    </div>
  )
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  )
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  )
}
