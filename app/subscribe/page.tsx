// app/subscribe/page.tsx
//
// The explanation half of the NOTIFY pairing (ticket 12 step 4): the footer's
// NOTIFY column (components/site-footer.tsx) is the control — one field, one
// button, asks for nothing but an address. This page is where that column's
// own link goes, and the only place that can say what actually arrives, how
// often, that the address is stored in Firestore and nothing else, and that
// there is no account behind it. Each is obviously the other's complement.
//
// The Firestore write lives behind the same server action the footer's form
// uses (app/actions/subscribe-email.ts) — ticket 04 step 12 left this page's
// duplicate copy of the write here for this ticket to remove. The
// `newsletterSubscribed` localStorage key is written on success so the footer
// column collapses to its already-built subscribed state on the NEXT load
// (not the same render: newsletter-form.tsx reads the key once on mount and a
// storage event does not fire in the tab that wrote the key).
//
// notify-and-preview ticket 06 made this page double opt-in's landing pad as
// well as its second capture point: app/api/confirm-subscription/route.ts
// redirects here with ?confirmed=yes|no once a token has been spent. The old
// copy promised "one email when a new recording is added... nothing on a
// schedule", which is a different promise from the weekly Digest the form now
// makes and stores, so it says the promise that is actually being kept.

"use client"

import { Suspense, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"

import { SIGNUP_HEADING } from "@/lib/sender-identity"
import { SignupDisclosure } from "@/components/signup-disclosure"
import { subscribeEmail } from "@/app/actions/subscribe-email"

const notice = "mt-[10px] text-[12px] leading-[1.45]"

function SubscribeForm() {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmed = useSearchParams().get("confirmed")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await subscribeEmail(new FormData(e.currentTarget))
      if (result.ok) {
        setEmail("")
        setDone(true)
        localStorage.setItem("newsletterSubscribed", "true")
      } else {
        setError(result.message)
      }
    })
  }

  return (
    <div className="max-w-[720px]">
      <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
        NOTIFY
      </span>
      <h1 className="m-0 text-hero text-t1">{SIGNUP_HEADING}</h1>

      {/* The confirm route's two outcomes. Deliberately not distinguishing an
          unknown token from a spent one: from out here they are the same event,
          and telling them apart would tell a stranger which tokens exist. */}
      {confirmed === "yes" && (
        <p className={`${notice} text-t1`}>
          Confirmed — you are on the list. The next Digest goes out at the end
          of the week.
        </p>
      )}
      {confirmed === "no" && (
        <p className={`${notice} text-fail`}>
          That confirmation link is not valid, or it has already been used. If
          you have confirmed once you are on the list; if not, subscribe again
          below.
        </p>
      )}

      <p className="mt-[9px] max-w-[520px] text-[13px] leading-[1.55] text-t2">
        A weekly Digest of the Recordings added to the catalogue, sent only in a
        week when there is at least one. Your address is stored in Firestore and
        sent to Resend, the service that delivers the Digest, and is used for
        nothing else. There is no account, no sign-in and nothing synced between
        devices.
      </p>
      <p className="mt-[9px] max-w-[520px] text-[13px] leading-[1.55] text-t2">
        Subscribing takes two steps: enter an address, then click the link in
        the confirmation email. Nothing is sent to an address that is never
        confirmed.
      </p>

      <form onSubmit={handleSubmit} className="mt-[18px] max-w-[520px]">
        <label
          htmlFor="email"
          className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3"
        >
          EMAIL
        </label>
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
            className="min-h-[40px] w-full min-w-0 rounded-[10px] border border-line bg-field px-[11px] text-[12.5px] text-t1 placeholder:text-t3 focus:border-acc focus:shadow-[0_0_0_3px_var(--acc-soft)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2 md:h-[34px] md:min-h-0"
          />
          <button
            type="submit"
            disabled={isPending || done}
            className="min-h-[44px] h-[34px] shrink-0 rounded-[9px] bg-acc px-[14px] text-[11.5px] font-medium text-on-acc transition-colors duration-120 disabled:opacity-60 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 md:min-h-0"
          >
            {/* Not "Check your inbox" — that is the notice below, and two
                elements with the same text make every locator for it ambiguous.
                Not "Subscribed ✓" either: nobody is subscribed until they
                confirm, which is the whole point of this ticket. */}
            {isPending ? "Subscribing…" : done ? "Sent ✓" : "Subscribe"}
          </button>
        </div>

        {done && (
          <p className={`${notice} text-t1`}>
            Check your inbox — the Digest starts once you confirm.
          </p>
        )}
        {error && !done && <p className={`${notice} text-fail`}>{error}</p>}

        <SignupDisclosure className="mt-[12px] max-w-[520px] text-[11.5px] leading-[1.5] text-t3" />
      </form>
    </div>
  )
}

// useSearchParams reads a value that only exists per request, so the shell
// prerenders and the param resolves on the client. Without the boundary the
// build refuses the page outright.
export default function SubscribePage() {
  return (
    <Suspense>
      <SubscribeForm />
    </Suspense>
  )
}
