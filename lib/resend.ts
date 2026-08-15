// lib/resend.ts
//
// The Resend HTTP surface this repo uses. No `resend` SDK — it would be a
// dependency for a handful of fetch calls.
//
// Lifted out of scripts/resend-broadcast.ts by notify-and-preview ticket 06,
// which needs `sendEmail` for the double-opt-in confirmation and `addContact`
// for the moment a pending address becomes a Subscriber. The script kept what is
// only ever a script's: broadcasts, and the guard that refuses a test send.
//
// RESEND_API_KEY is read per call rather than at import. It carries no
// NEXT_PUBLIC_ prefix, so it is never inlined into a client bundle, and reading
// it lazily keeps this module importable from a test that never sets it.

import { FROM, REPLY_TO } from "@/lib/sender-identity"

const API = "https://api.resend.com"

export async function resendRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY is not set — see .env.local")
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...init?.headers,
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    // The status rides on the error rather than only inside its message: the
    // message interpolates the response body, so a caller matching on the text
    // "409" would also match an id, a count or a timestamp that happens to
    // contain it, and swallow a failure it meant to rethrow.
    const err = new Error(
      `${init?.method ?? "GET"} ${path} → ${res.status} ${JSON.stringify(body)}`
    )
    throw Object.assign(err, { status: res.status })
  }
  return body as T
}

type Audience = { id: string; name: string }

/** One page of `GET /audiences/{id}/contacts`. */
export type ContactPage = { data: { email: string }[]; has_more?: boolean }

export async function ensureAudience(name: string): Promise<string> {
  const { data } = await resendRequest<{ data: Audience[] }>("/audiences")
  const found = data.find((a) => a.name === name)
  if (found) return found.id
  const created = await resendRequest<Audience>("/audiences", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
  return created.id
}

/** Resend 409s on a duplicate address, which is a no-op here, not a failure. */
export async function addContact(
  audienceId: string,
  email: string
): Promise<void> {
  try {
    await resendRequest(`/audiences/${audienceId}/contacts`, {
      method: "POST",
      body: JSON.stringify({ email, unsubscribed: false }),
    })
  } catch (err) {
    if ((err as { status?: number }).status !== 409) throw err
  }
}

/**
 * One transactional message to one address — the confirmation email, as opposed
 * to a broadcast, which goes to a whole audience. Ticket 06 is the only caller;
 * the Digest is a broadcast and belongs to ticket 11.
 */
export async function sendEmail(input: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  await resendRequest("/emails", {
    method: "POST",
    body: JSON.stringify({
      from: FROM,
      reply_to: REPLY_TO,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  })
}
