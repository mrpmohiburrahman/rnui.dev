#!/usr/bin/env tsx
/**
 * Creates and sends a Resend Broadcast through the API.
 * Run via: pnpm broadcast:test
 *
 * notify-and-preview ticket 05. The acceptance is specific about why this is a
 * script rather than the dashboard: Resend cannot send a dashboard-drafted
 * broadcast programmatically, so ticket 11's weekly job would have nothing to
 * fire. These four functions are what that job will call.
 *
 * `main()` is ticket 05's own one-off — one test Digest to the maintainer, so
 * that `From:` alignment and the one-click unsubscribe can be verified against a
 * real delivered message rather than assumed.
 *
 * Deliberately not here: reading Firestore, rendering a real Digest, and
 * deciding who owns "unsubscribed". Those are tickets 09, 11 and 08.
 *
 * No SDK — `resend` would be a dependency for four fetch calls.
 */
import { pathToFileURL } from "node:url"

// Same pair of files, same order, as scripts/measure-demos.ts.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file)
  } catch {}
}

const API = "https://api.resend.com"

/** Fixed forever by ticket 04 — changing it later resets sender reputation. */
export const FROM = "rnui.dev <digest@mail.rnui.dev>"
export const REPLY_TO = "hello@rnui.dev"

async function api<T>(path: string, init?: RequestInit): Promise<T> {
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
type ContactPage = { data: { email: string }[]; has_more?: boolean }

export async function ensureAudience(name: string): Promise<string> {
  const { data } = await api<{ data: Audience[] }>("/audiences")
  const found = data.find((a) => a.name === name)
  if (found) return found.id
  const created = await api<Audience>("/audiences", {
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
    await api(`/audiences/${audienceId}/contacts`, {
      method: "POST",
      body: JSON.stringify({ email, unsubscribed: false }),
    })
  } catch (err) {
    if ((err as { status?: number }).status !== 409) throw err
  }
}

export async function createBroadcast(input: {
  audienceId: string
  subject: string
  html: string
}): Promise<string> {
  const { id } = await api<{ id: string }>("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      audience_id: input.audienceId,
      from: FROM,
      reply_to: REPLY_TO,
      subject: input.subject,
      html: input.html,
    }),
  })
  return id
}

export async function sendBroadcast(id: string): Promise<void> {
  await api(`/broadcasts/${id}/send`, { method: "POST" })
}

/**
 * A Resend broadcast goes to the *whole* audience, so a test send is only safe
 * when the audience is provably just the test recipient. Tickets 09/11 populate
 * an audience from the 29 survivors; a careless `pnpm broadcast:test` after that
 * mails all of them a test, and 1 complaint in 29 is 3.4% — roughly eleven times
 * Google's 0.3% threshold.
 *
 * `has_more` is half the check. `GET /audiences/{id}/contacts` is paginated, and
 * a page that happens to show only the test recipient proves nothing about the
 * rest, so an unread remainder refuses too. Returns the reason, or null to send.
 *
 * Deliberately *not* `normalise()` from scrub-email-list.ts, which also folds
 * gmail dots. Folding makes more addresses compare equal, which here means fewer
 * strangers detected and a send that should have been refused. A guard wants the
 * stricter comparison; the two disagreeing is the point, not an oversight.
 */
export function refuseSendReason(page: ContactPage, to: string): string | null {
  const key = (e: string) => e.trim().toLowerCase()
  const others = page.data.filter((c) => key(c.email) !== key(to))
  if (others.length) return `audience holds ${others.length} other contact(s)`
  if (page.has_more) return "audience holds more contacts than one page shows"
  return null
}

// The footer identity block from ticket 04, verbatim, minus `{{SIGNUP_DATE}}` —
// that token is per-recipient and ticket 09 fills it from each survivor's
// `createdAt`. The maintainer is not one of the 29, so the test says so rather
// than inventing a consent date.
const TEST_HTML = `<p>Test send for notify-and-preview ticket 05. Not a Digest.</p>
<p>What it is checking: that <code>digest@mail.rnui.dev</code> authenticates,
and that the one-click unsubscribe below actually removes an address.</p>
<hr>
<p style="font-size:13px;color:#666">
rnui.dev — MD. MOHIBUR RAHMAN<br>
Halima Nagar, Cumilla 3502, Bangladesh<br>
hello@rnui.dev
</p>
<p style="font-size:13px;color:#666">
A weekly Digest of Recordings added to rnui.dev. No sponsor mail, no third-party
marketing, and your address is never shared.
</p>
<p style="font-size:13px;color:#666">
<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a> ·
<a href="https://rnui.dev/privacy">Privacy Policy</a>
</p>`

async function main() {
  const to = process.argv[2] ?? "mrpmohiburrahman@gmail.com"
  const audienceId = await ensureAudience("General")
  await addContact(audienceId, to)
  const page = await api<ContactPage>(`/audiences/${audienceId}/contacts`)
  const reason = refuseSendReason(page, to)
  if (reason) {
    throw new Error(
      `refusing to send: ${reason} (audience ${audienceId}). ` +
        `This is a test send, not a Digest.`
    )
  }
  const id = await createBroadcast({
    audienceId,
    subject: "rnui.dev — test send, ticket 05",
    html: TEST_HTML,
  })
  await sendBroadcast(id)
  console.log(`sent broadcast ${id} to audience ${audienceId} (${to})`)
  console.log(
    `verify: the List-Unsubscribe-Post URL in the delivered message, POSTed, ` +
      `must flip this contact to unsubscribed:\n` +
      `  GET /audiences/${audienceId}/contacts/${to}`
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
