"use client"

import { useEffect, useState } from "react"
import { addDoc, collection, Timestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"

// Ticket 12 restyles this page; behaviour is unchanged per open question 4 —
// this is the site's only feedback surface (next.config.ts redirects /feedback
// here) and it keeps writing Firestore from the browser, the way it has.

export default function ContactPage() {
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

// The header search field's own geometry (Catalogue.dc.html:19,21): 34px,
  // border-line on bg-field, acc border + acc-soft glow on focus. `min-h-[40px]`
  // is the phone metric (CatalogueMobile.dc.html:20); md restores the desktop
  // 34px while keeping the touch target above the 44px floor only on the submit.
  const fieldClass =
    "min-h-[40px] w-full rounded-[10px] border border-line bg-field px-[11px] text-[12.5px] text-t1 placeholder:text-t3 focus:border-acc focus:shadow-[0_0_0_3px_var(--acc-soft)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2 md:h-[34px] md:min-h-0"
  const labelClass =
    "pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3"

  return (
    <div className="max-w-[720px]">
      <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
        CONTACT
      </span>
      <h1 className="m-0 text-hero text-t1">Contact us</h1>
      <p className="mt-[9px] max-w-[520px] text-[13px] leading-[1.5] text-t2">
        Fill the form if you have any questions or feedback.
      </p>

      {/* The form in one panel (Detail.dc.html:51): 14px pad, 12px radius,
          border-line on bg-well. First and Last side by side above sm on the
          24px grid column gap; below sm the whole form is one column. */}
      <form
        onSubmit={handleSubmit}
        className="mt-[18px] max-w-[520px] rounded-panel border border-line bg-well p-3.5"
      >
        <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 sm:gap-[24px]">
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="firstName" className={labelClass}>
              FIRST NAME
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={fieldClass}
              required
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="lastName" className={labelClass}>
              LAST NAME
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={fieldClass}
              required
            />
          </div>
        </div>

        <div className="mt-[12px] flex flex-col gap-[4px]">
          <label htmlFor="email" className={labelClass}>
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            required
          />
        </div>

        <div className="mt-[12px] flex flex-col gap-[4px]">
          <label htmlFor="message" className={labelClass}>
            MESSAGE
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
            className="min-h-[176px] w-full rounded-[10px] border border-line bg-field px-[11px] py-[9px] text-[12.5px] text-t1 placeholder:text-t2 focus:border-acc focus:shadow-[0_0_0_3px_var(--acc-soft)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
            required
          />
        </div>

        {/* The primary button, full width (Catalogue.dc.html:104). 120ms ease-out
            is the mock's one small-control state change (Specimen:163); the old
            300ms is not a token. The three bg states collapse — the mock draws
            no disabled or success colour, so it stays accent and only the label
            changes. */}
        <button
          type="submit"
          disabled={status === "submitting" || status === "success"}
          className="mt-[18px] min-h-[44px] w-full rounded-[9px] bg-acc px-[13px] py-[9px] text-[12.5px] font-medium text-on-acc transition-colors duration-120 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 disabled:opacity-70 md:min-h-0"
        >
          {status === "submitting"
            ? "Submitting…"
            : status === "success"
              ? "Submitted"
              : "Submit"}
        </button>

        {/* The mock's one failure idiom (Tile.dc.html:21-22): a mono eyebrow
            above a 12px sentence. Success in acc, failure in the promoted
            ticket-12 fail token. */}
        {status === "error" && (
          <div className="mt-[14px]">
            <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-fail">
              NOT SENT
            </span>
            <p className="m-0 text-[12px] leading-[1.45] text-t1">
              {errorMessage}
            </p>
          </div>
        )}
        {status === "success" && (
          <div className="mt-[14px]">
            <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-acc">
              SENT
            </span>
            <p className="m-0 text-[12px] leading-[1.45] text-t1">
              Thank you for your feedback!
            </p>
          </div>
        )}
      </form>
    </div>
  )
}