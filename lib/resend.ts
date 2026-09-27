// lib/resend.ts
//
// The Resend HTTP surface this repo uses. No `resend` SDK — it would be a
// dependency for a handful of fetch calls.
//
// Lifted out of scripts/resend-broadcast.ts by notify-and-preview ticket 06,
// which needs `sendEmail` for the double-opt-in confirmation and a way to put a
// confirmed address in the audience. The script kept what is only ever a
// script's: broadcasts, and the guard that refuses a test send.
//
// Ticket 08 split the contact write in two, and the split is the decision:
// `ensureContact` creates only when absent and can never clear `unsubscribed`,
// so an import cannot resurrect someone who opted out; `subscribeContact` may
// clear it, and only the confirmation route calls it.
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

/**
 * A contact as Resend reports it. `unsubscribed` is the whole of the
 * suppression state — there is no second ledger (notify-and-preview ticket 08).
 */
export type Contact = { email: string; unsubscribed: boolean }

/** One page of `GET /audiences/{id}/contacts`. */
export type ContactPage = { data: Contact[]; has_more?: boolean }

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

/** One contact by address, or null. A `get`, never a `list`. */
export async function getContact(
  audienceId: string,
  email: string
): Promise<Contact | null> {
  try {
    return await resendRequest<Contact>(
      `/audiences/${audienceId}/contacts/${email}`
    )
  } catch (err) {
    // 404 is "no such contact", which is a normal answer here, not a failure.
    // Matched on the number, not on the message: the message interpolates the
    // request path, so an audience id holding the digits would match text alone.
    if ((err as { status?: number }).status === 404) return null
    throw err
  }
}

/**
 * Creates the contact if it is absent and does nothing at all if it is present.
 *
 * **This is the import path, and "does nothing at all" is the whole of ticket
 * 08.** `POST /audiences/{id}/contacts` is an *upsert*: measured 2026-09-26, it
 * answers 201 for an address that already exists and writes `unsubscribed:
 * false` when the field is absent from the body, so posting an address that has
 * opted out silently re-subscribes them and the next broadcast mails them. The
 * old `addContact` did exactly that, and its 409 catch — the thing that was
 * supposed to make a duplicate a no-op — never ran, because there is no 409.
 *
 * So a bulk import, a re-run, or ticket 11's audience step must come through
 * here: reading first is what makes "never resurrect" structural rather than a
 * rule everyone has to remember. `subscribeContact` below is the one path
 * allowed to clear the flag, and it needs the address owner to click.
 */
export async function ensureContact(
  audienceId: string,
  email: string
): Promise<void> {
  if (await getContact(audienceId, email)) return
  await subscribeContact(audienceId, email)
}

/**
 * Creates the contact, or re-subscribes one that is already there. Only the
 * confirmation route calls this: it runs after somebody followed a link that was
 * mailed to the address and signed by this server, which is fresh express
 * consent and is the one thing that legitimately overrides an earlier
 * unsubscribe. Nothing unattended may call it.
 */
export async function subscribeContact(
  audienceId: string,
  email: string
): Promise<void> {
  await resendRequest(`/audiences/${audienceId}/contacts`, {
    method: "POST",
    body: JSON.stringify({ email, unsubscribed: false }),
  })
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
