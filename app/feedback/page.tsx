"use client"

import { useEffect, useState } from "react"
import { addDoc, collection, Timestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"

export default function FeedbackPage() {
  // State variables for form fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  // State variables for handling submission status
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // Helper function to validate email format
  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("First and Last names are required.")
      setStatus("error")
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.")
      setStatus("error")
      return
    }

    if (!message.trim()) {
      setErrorMessage("Message cannot be empty.")
      setStatus("error")
      return
    }

    setStatus("submitting")
    setErrorMessage("")

    try {
      const feedbackCollection = collection(db, "userFeedback")
      await addDoc(feedbackCollection, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        message: message.trim(),
        submittedAt: Timestamp.now(),
      })
      setFirstName("")
      setLastName("")
      setEmail("")
      setMessage("")
      setStatus("success")
    } catch (error) {
      setErrorMessage("An unexpected error occurred.")
      setStatus("error")
      console.error("Error submitting feedback:", error)
    }
  }

  // Reset status after a delay when submission is successful
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        setStatus("idle")
      }, 5000) // Reset after 5 seconds
      return () => clearTimeout(timer)
    }
  }, [status])

  return (
    <section className=" mb-96">
      {/* Container */}
      <div className="mx-auto max-w-7xl px-5 py-16 text-center md:px-10 md:py-20">
        {/* Component */}
        <h2 className="text-3xl font-bold md:text-5xl">Feedback</h2>
        <p className="mx-auto mb-8 mt-4 max-w-lg text-gray-500 md:mb-12 lg:mb-16">
          Fill the form if you have any feedback.
        </p>
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mb-4 text-left sm:px-4 md:px-20"
        >
          <div className="mb-4 grid w-full grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="mb-1 font-medium">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mb-4 block h-9 w-full rounded-md border border-solid border-black px-3 py-2 text-sm text-black"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 font-medium">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mb-4 block h-9 w-full rounded-md border border-solid border-black px-3 py-2 text-sm text-black"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="mb-1 font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 block h-9 w-full rounded-md border border-solid border-black px-3 py-2 text-sm text-black"
              required
            />
          </div>
          <div className="mb-5 md:mb-6 lg:mb-8">
            <label htmlFor="message" className="mb-1 font-medium">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              className="mb-2.5 block h-auto min-h-44 w-full rounded-md border border-solid border-black px-3 py-2 text-sm text-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "submitting" || status === "success"}
            className={`inline-block w-full rounded-md px-6 py-3 text-center font-semibold text-white transition-colors duration-300 ${
              status === "idle"
                ? "bg-black hover:bg-gray-800"
                : status === "submitting"
                  ? "bg-gray-500 cursor-not-allowed"
                  : status === "success"
                    ? "bg-green-500 cursor-not-allowed"
                    : "bg-black hover:bg-gray-800"
            }`}
          >
            {status === "submitting"
              ? "Submitting..."
              : status === "success"
                ? "Submitted"
                : "Submit"}
          </button>

          {status === "error" && (
            <p className="mt-4 text-sm text-red-500">{errorMessage}</p>
          )}
          {status === "success" && (
            <p className="mt-4 text-sm text-green-500">
              Thank you for your feedback!
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
