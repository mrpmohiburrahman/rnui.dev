// components/newsletter-form.tsx
"use client"

import { useEffect, useState } from "react"
import { addDoc, collection, Timestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"

import { Label } from "./ui/label"

// Determine the collection name based on the environment
const COLLECTION_NAME =
  process.env.NEXT_PUBLIC_FIRESTORE_EMAIL_COLLECTION || "emails"

const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Check localStorage on component mount
  useEffect(() => {
    const subscribed = localStorage.getItem("newsletterSubscribed")
    if (subscribed === "true") {
      setIsSubscribed(true)
    }
  }, [])

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
      setIsSubscribed(true)
      localStorage.setItem("newsletterSubscribed", "true")
      console.log("Form submitted and email stored in Firebase")
    } catch (err: any) {
      console.error("Error storing email:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // if (isSubscribed) {
  //   return <div />
  // }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-foreground dark:text-secondary-foreground">
        Get notified when new animation is being added
      </h2>
      {isSubscribed ? (
        <Label htmlFor="email">You have been added to the email list.</Label>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-4">
            {/* Inline Input and Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full">
              <Input
                id="email"
                placeholder="youremail@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 w-full sm:w-auto" // Ensures input can grow
              />
              <button
                className={`mt-4 sm:mt-0 bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 text-white rounded-md h-10 px-4 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                type="submit"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Sign up →"}
                <BottomGradient />
              </button>
            </div>

            {/* Error and Success Messages */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && (
              <p className="text-green-500 text-sm">
                Thank you for signing up!
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

export default NewsletterForm

// Helper Components

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  )
}
