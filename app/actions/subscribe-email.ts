// app/actions/subscribe-email.ts
//
// The one place the email write lives. The two client forms that used to call
// addDoc themselves — components/newsletter-form.tsx and app/subscribe/page.tsx —
// now call this, so the Firestore write and its validation are not duplicated.
// It follows the pattern app/actions/increment-view-count.ts sets: a thin
// "use server" delegate over lib/, callable from a client component.

"use server"

import { addDoc, collection, Timestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"

const COLLECTION_NAME =
  process.env.NEXT_PUBLIC_FIRESTORE_EMAIL_COLLECTION || "emails"

export type SubscribeResult =
  | { ok: true; message?: never }
  | { ok: false; message: string }

export async function subscribeEmail(
  formData: FormData
): Promise<SubscribeResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()

  if (!email) {
    return { ok: false, message: "Email is required" }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address" }
  }

  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      email,
      createdAt: Timestamp.now(),
    })
  } catch (err) {
    console.error("subscribeEmail: storing email failed", err)
    return {
      ok: false,
      message: "An unexpected error occurred. Please, try again later.",
    }
  }

  return { ok: true }
}
