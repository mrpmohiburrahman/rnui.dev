// components/signup-disclosure.tsx
//
// Every subscribe form uses this disclosure. It names the sender and states
// the right to withdraw consent. Its policy link provides the postal address
// and contact email. The text does not include those contact details.
//
// One component rather than two copies of the same paragraph: the exact words
// are also what app/actions/subscribe-email.ts stores on every record, and a
// form that drifts from the stored consent string makes the record a fiction.

import Link from "next/link"

import {
  PRIVACY_PATH,
  SIGNUP_DISCLOSURE_BODY,
  SIGNUP_DISCLOSURE_POLICY_SENTENCE,
} from "@/lib/sender-identity"

export function SignupDisclosure({ className }: { className: string }) {
  return (
    <p className={className}>
      {SIGNUP_DISCLOSURE_BODY}{" "}
      <Link
        href={PRIVACY_PATH}
        className="text-acc underline underline-offset-3 focus-visible:rounded-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
      >
        {SIGNUP_DISCLOSURE_POLICY_SENTENCE}
      </Link>
    </p>
  )
}
