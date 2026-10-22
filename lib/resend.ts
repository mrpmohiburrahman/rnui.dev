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
 * A contact plus what the account-scoped read returns for it. `properties` carries
 * Resend's own `{value, type}` shape rather than a bare string — measured
 * 2026-10-22, `GET /contacts/{email}` answers
 * `{"signup_date": {"value": "1 January 2025", "type": "string"}}`.
 */
export type ContactWithProperties = Contact & {
  id: string
  properties?: Record<string, { value: string | null; type: string }>
}

/** One contact by address, account-scoped, or null when the address is not one. */
export async function getContactByEmail(
  email: string
): Promise<ContactWithProperties | null> {
  try {
    // The raw address in the path, not an encoded one: `%40` is unmeasured here
    // and the literal form is what answered 200 and 404 on 2026-10-22.
    return await resendRequest<ContactWithProperties>(`/contacts/${email}`)
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null
    throw err
  }
}

/**
 * Sets custom properties on a contact that already exists, and nothing else.
 *
 * **This is the only write the Digest may make to an existing contact.** Measured
 * 2026-10-22 against a contact with `unsubscribed: true`: a PATCH carrying only
 * `properties` left the flag `true`, while `POST /contacts` is an upsert that
 * resets it (ticket 08). The body here carries no `unsubscribed` key at all — the
 * omission is the guarantee, not a value set to false.
 */
export async function setContactProperties(
  email: string,
  properties: Record<string, string>
): Promise<void> {
  await resendRequest(`/contacts/${email}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  })
}

/**
 * Creates a contact carrying custom properties.
 *
 * Callers must have read the address first. A POST on an address that already
 * exists answers 201 and writes `unsubscribed: false`, so calling this directly is
 * how somebody who opted out gets mailed; `ensureContactWithProperties` is the
 * guard that does the read.
 */
export async function createContactWithProperties(input: {
  email: string
  properties: Record<string, string>
}): Promise<string> {
  const created = await resendRequest<{ id: string }>("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      unsubscribed: false,
      properties: input.properties,
    }),
  })
  return created.id
}

/**
 * Puts custom properties on an address and returns its contact id, without ever
 * resurrecting anybody.
 *
 * Reads first, so the three cases stay explicit: absent → create with the
 * properties; present and unsubscribed → refuse; present and subscribed → PATCH the
 * properties. The refusal is the whole point. Ticket 08 measured that the POST
 * answers 201 and clears the flag, so the read is what makes "never resurrect"
 * structural rather than a rule every caller has to remember. This is the
 * `ensureContact` discipline with properties, and like `ensureContact` it is not the
 * path that may clear the flag.
 *
 * Segment membership is not set here: PATCH takes no `segments`, so one route
 * serves both the created and the existing contact.
 */
export async function ensureContactWithProperties(input: {
  email: string
  properties: Record<string, string>
}): Promise<{ id: string; created: boolean }> {
  const existing = await getContactByEmail(input.email)
  if (existing) {
    if (existing.unsubscribed) {
      throw new Error(
        `${existing.id} unsubscribed, so nothing may re-subscribe it`
      )
    }
    await setContactProperties(input.email, input.properties)
    return { id: existing.id, created: false }
  }
  return { id: await createContactWithProperties(input), created: true }
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
