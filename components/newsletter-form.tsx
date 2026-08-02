// components/newsletter-form.tsx
//
// The footer's NOTIFY form (not drawn in any mock — the mock's footer is
// CONTRIBUTE and THIS DEVICE, Catalogue.dc.html:151-158). Decision 9 derives
// it: the column label lives in site-footer.tsx, this is the input plus button,
// using the search field's own metrics (h-9, rounded-[10px], border-line,
// bg-field) and the primary button (bg-acc, text-on-acc). The Firestore write
// is a single server action, app/actions/subscribe-email.ts — this component
// keeps only its client concerns: the controlled input, the localStorage
// already-subscribed gate, and the three transient states.

"use client"

import { useEffect, useState, useTransition } from "react"

import { subscribeEmail } from "@/app/actions/subscribe-email"

const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Check localStorage on component mount.
  useEffect(() => {
    const subscribed = localStorage.getItem("newsletterSubscribed")
    if (subscribed !== "true") return
    // Reading localStorage on mount is the only SSR-safe way to hydrate this —
    // the same reasoning hooks/use-remembered-set.ts:95-100 gives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSubscribed(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await subscribeEmail(new FormData(e.currentTarget))
      if (result.ok) {
        setEmail("")
        setIsSubscribed(true)
        localStorage.setItem("newsletterSubscribed", "true")
      } else {
        setError(result.message)
      }
    })
  }

  if (isSubscribed) {
    return (
      <p className="text-[11.5px] leading-[1.5] text-t2">
        You are on the list — watch your inbox for new recordings.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-[9px]">
        <input
          id="email"
          name="email"
          type="email"
          placeholder="youremail@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email address"
          className="h-[34px] w-full min-w-0 max-w-[220px] rounded-[10px] border border-line bg-field px-[11px] text-[12px] text-t1 placeholder:text-t3 focus:outline-none focus-visible:ring-2 focus-visible:ring-acc"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-[34px] shrink-0 rounded-[9px] bg-acc px-[14px] text-[11.5px] font-medium text-on-acc transition-opacity duration-160 hover:opacity-80 disabled:opacity-60"
        >
          {isPending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {error && (
        <p className="mt-[6px] text-[11px] text-destructive">{error}</p>
      )}
    </form>
  )
}

export default NewsletterForm
