// components/prototype/subscribe-popup-prototype.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 04, `.scratch/subscribe-popup/`.
// What does the subscribe popup look like, matching the Save gate?
//
// Sub-shape B at /prototype/subscribe-popup?variant=A|B|C|D: the popup fires
// on listing routes from a trigger that lives outside any one page, so there
// is no host page to gate with `?variant=` — same reason as
// components/prototype/sign-in-prototype.tsx. The real catalogue is mounted
// underneath (see app/prototype/subscribe-popup/page.tsx) so density is real.
//
// The shell below copies GateModal byte-for-byte
// (components/sign-in-control.tsx:303-315): scrim
// `fixed inset-0 z-[70] bg-scrim backdrop-blur-[3px]`, panel
// `fixed left-1/2 top-1/2 z-[71] w-[320px] max-w-[calc(100vw-48px)]
// -translate-x-1/2 -translate-y-1/2 rounded-card border border-line2
// bg-header p-[16px] shadow-2xl` with the same focus ring. No new tokens,
// no sheet variant (ticket 03: same centered modal on all widths).
//
// Variants are STATES, not layouts — the map forbids a new visual language:
//   A — form (email + Subscribe + SignupDisclosure + Not now)
//   B — success ("Check your inbox — the Digest starts once you confirm")
//   C — error (invalid address / send failure)
//   D — already-subscribed silent state (no modal at all)
//
// NO FIRESTORE HERE. Submit is a stubbed in-memory transition so the
// maintainer can see form → success / error without a console or a send.
// Copy is interim pending ticket 06 (popup copy): domain words per CONTEXT.md
// (Recording, Subscriber, Digest, Reader), honest frequency (only when new
// Recordings land — no fixed-weekly promise), confirm-once +
// unsubscribe-anytime. The disclosure block is the real SignupDisclosure,
// never reworded here.
"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"

import { SignupDisclosure } from "@/components/signup-disclosure"
import { SIGNUP_PROMISE } from "@/lib/sender-identity"

type VariantKey = "A" | "B" | "C" | "D"

const VARIANTS: { key: VariantKey; name: string; idea: string }[] = [
  {
    key: "A",
    name: "Form",
    idea: "Email input + Subscribe + SignupDisclosure + Not now. GateModal shell, byte-for-byte.",
  },
  {
    key: "B",
    name: "Success",
    idea: "“Check your inbox — the Digest starts once you confirm.” Nothing is a Subscriber until confirm.",
  },
  {
    key: "C",
    name: "Error",
    idea: "Invalid address / send failure inline, same slot as the footer form's error line.",
  },
  {
    key: "D",
    name: "Already subscribed — silent",
    idea: "No modal at all. This is the correct render when newsletterSubscribed is set: nothing fires.",
  },
]

const HEADLINE = "Get the Digest"
/**
 * No "unsubscribe anytime" here. The disclosure below carries it, and that is
 * the copy that counts: subscribeEmail stores `consentText: SIGNUP_DISCLOSURE`
 * on every record (app/actions/subscribe-email.ts:127), which is the grey
 * paragraph alone. CASL s.4(e)'s withdrawal statement lives there, and
 * repeating it above the field only made the card feel tight.
 *
 * Read from the real constant, not restated here, so the prototype cannot show
 * copy that the shipped form does not.
 */
const PROMISE = SIGNUP_PROMISE

function PopupShell({
  open,
  onDismiss,
  children,
}: {
  open: boolean
  onDismiss: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss()
      }}
    >
      <Dialog.Portal>
        {/* Same scrim as GateModal — components/sign-in-control.tsx:305. */}
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-scrim backdrop-blur-[3px]" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            // Same as GateModal: nowhere real to return to (the trigger was
            // scroll + dwell, not a button), so focus does not jump.
            e.preventDefault()
          }}
          // GateModal's panel — components/sign-in-control.tsx:314 — at one
          // change, w-[400px] instead of w-[320px], chosen by the maintainer on
          // 2026-10-09 as variant 3 of /prototype/subscribe-spacing. That
          // overrides ticket 03's "same centered modal as GateModal" on width
          // alone; every other token below is still byte-identical. The reason
          // was cramped: at 320px the field row shared 288px with the button,
          // leaving the input about 190px, narrower than the footer's own.
          // Ticket 03's other two rulings are untouched, so the popup is still
          // a centered modal on every width and still invents no new tokens.
          className="fixed left-1/2 top-1/2 z-[71] w-[400px] max-w-[calc(100vw-48px)] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line2 bg-header p-[16px] shadow-2xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PopupBody({
  headline,
  children,
}: {
  headline: string
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-[8px]">
        <Dialog.Title className="m-0 px-[6px] text-[15px] font-medium tracking-[-0.01em] text-t1">
          {headline}
        </Dialog.Title>
        <Dialog.Close
          aria-label="Close"
          className="shrink-0 rounded-[6px] px-[8px] py-[4px] text-[12.5px] text-t3 hover:text-t2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
        >
          ✕
        </Dialog.Close>
      </div>
      <div className="px-[6px]">{children}</div>
    </>
  )
}

function SubscribeFields({
  initialError,
  onDone,
}: {
  initialError: string | null
  onDone: () => void
}) {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
      setError("Enter a valid email address")
      return
    }
    // Stubbed send: the question is "what does it look like", not "does the
    // backend work". A beat of pending so the disabled state is visible.
    setPending(true)
    setTimeout(() => {
      setPending(false)
      onDone()
    }, 600)
  }

  // Spacing is variant 3 of /prototype/subscribe-spacing, chosen 2026-10-09:
  // field and button stack so the input takes the panel's full width, the
  // disclosure is readable rather than texture, and the gaps group the block
  // instead of running it together.
  return (
    <form onSubmit={submit}>
      <p className="m-0 pb-[18px] pt-[8px] text-[12.5px] leading-[1.5] text-t2">
        {PROMISE}
      </p>
      <div className="flex flex-col gap-[9px]">
        <input
          id="prototype-subscribe-email"
          name="email"
          type="email"
          placeholder="youremail@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email address"
          // Same shape as the footer's NOTIFY input
          // (components/newsletter-form.tsx:89): rounded-[10px], border-line,
          // bg-field, acc ring. Taller and wider here because it no longer
          // shares its row with the button.
          className="h-[40px] w-full min-w-0 rounded-[10px] border border-line bg-field px-[12px] text-[12.5px] text-t1 placeholder:text-t3 focus:outline-none focus-visible:ring-2 focus-visible:ring-acc"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-[40px] w-full shrink-0 rounded-[10px] bg-acc px-[14px] text-[12px] font-medium text-on-acc transition-colors duration-120 disabled:opacity-60 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {error && (
        <p role="alert" className="m-0 mt-[6px] text-[11px] text-destructive">
          {error}
        </p>
      )}
      <SignupDisclosure className="mt-[16px] text-[11.5px] leading-[1.55] text-t3" />
      {/* Same way out as GateModal's ProviderActions: a quiet "Not now". */}
      <Dialog.Close className="mt-[14px] w-full rounded-[6px] py-[7px] text-[11.5px] text-t3 hover:text-t2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2">
        Not now
      </Dialog.Close>
    </form>
  )
}

function VariantBody({
  variant,
  onDone,
}: {
  variant: VariantKey
  onDone: () => void
}) {
  if (variant === "B") {
    return (
      <PopupBody headline={HEADLINE}>
        <p className="m-0 pb-[4px] pt-[6px] text-[12.5px] leading-[1.5] text-t1">
          Check your inbox — the Digest starts once you confirm.
        </p>
        <p className="m-0 pb-[10px] text-[12px] leading-[1.5] text-t2">
          Nothing is sent to an address that is never confirmed.
        </p>
        <Dialog.Close className="w-full rounded-[6px] py-[6px] text-[11.5px] text-t3 hover:text-t2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2">
          Not now
        </Dialog.Close>
      </PopupBody>
    )
  }
  if (variant === "C") {
    return (
      <PopupBody headline={HEADLINE}>
        <SubscribeFields initialError="We could not send the confirmation email. Please try again." onDone={onDone} />
      </PopupBody>
    )
  }
  return (
    <PopupBody headline={HEADLINE}>
      <SubscribeFields initialError={null} onDone={onDone} />
    </PopupBody>
  )
}

function Switcher({
  current,
}: {
  current: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const go = (delta: number) => {
    const next =
      VARIANTS[(current + delta + VARIANTS.length) % VARIANTS.length]
    const params = new URLSearchParams(searchParams.toString())
    params.set("variant", next.key)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const t = e.target as HTMLElement | null
      if (t?.closest("input, textarea, select, [contenteditable]")) return
      e.preventDefault()
      go(e.key === "ArrowRight" ? 1 : -1)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  })

  if (process.env.NODE_ENV === "production") return null
  const v = VARIANTS[current]

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full bg-neutral-900 px-4 py-2.5 font-mono text-[12px] text-neutral-100 shadow-2xl ring-1 ring-white/20">
        <button onClick={() => go(-1)} aria-label="Previous variant" className="px-1 text-[16px] leading-none">←</button>
        <span className="whitespace-nowrap">
          <span className="text-neutral-400">{v.key}</span> — {v.name}
        </span>
        <button onClick={() => go(1)} aria-label="Next variant" className="px-1 text-[16px] leading-none">→</button>
      </div>
      <div className="mx-auto mt-2 max-w-[620px] rounded-lg bg-neutral-900/95 px-4 py-2.5 text-center font-sans text-[11px] leading-[1.5] text-neutral-300 shadow-xl">
        <span className="text-neutral-100">{v.idea}</span>
        <span className="mt-1 block text-neutral-500">
          GateModal shell, no new tokens · narrow the window to phone width — same centered modal · D renders nothing, correctly
        </span>
      </div>
    </div>
  )
}

function SubscribePopupByQuery() {
  const searchParams = useSearchParams()
  const key = (searchParams.get("variant") ?? "A") as VariantKey
  const current = Math.max(
    0,
    VARIANTS.findIndex((v) => v.key === key)
  )
  const variant = VARIANTS[current].key
  const [dismissed, setDismissed] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const shown: VariantKey = succeeded ? "B" : variant
  // D is the already-subscribed silent state: the trigger never fires, so no
  // modal renders at all. Dismissal also silences for the visit.
  const open = !dismissed && shown !== "D"

  return (
    <>
      <div className="border-b border-line bg-field/60 px-[26px] py-[10px] font-mono text-[10.5px] text-t3">
        PROTOTYPE · subscribe popup ·{" "}
        {shown === "D"
          ? "already-subscribed — popup correctly absent"
          : open
            ? `popup open (${shown} · ${VARIANTS[current].name})`
            : "popup dismissed for the visit — counts as shown"}
        <button
          type="button"
          onClick={() => {
            setDismissed(false)
            setSucceeded(false)
          }}
          className="ml-[10px] rounded-full border border-line px-[10px] py-[2px] font-mono text-[10.5px] text-t2 hover:text-t1"
        >
          re-arm popup
        </button>
      </div>
      <PopupShell open={open} onDismiss={() => setDismissed(true)}>
        <VariantBody variant={shown} onDone={() => setSucceeded(true)} />
      </PopupShell>
      <Switcher current={current} />
    </>
  )
}

export function SubscribePopupPrototype() {
  return (
    <Suspense fallback={null}>
      <SubscribePopupByQuery />
    </Suspense>
  )
}
