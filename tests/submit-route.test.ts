import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "../app/api/submit/route"
import { sendEmail } from "../lib/resend"
import { CONTACT_EMAIL } from "../lib/sender-identity"
import {
  SUBMISSION_DISCLOSURE,
  SUBMISSION_FORM_VERSION,
} from "../lib/submission-consent"
import { writeSubmissionConsent } from "../lib/submission-consent-firestore"
import { DEMO_FIELD, SUBMISSION_FIELD } from "../lib/submission-form"
import { SUBMIT_ACTION, TURNSTILE_FIELD } from "../lib/turnstile-shared"

// public-submissions ticket 07. A route handler is the one place where a mistake
// is invisible from a browser: a form that quietly skips a check, or writes a
// consent record for bytes that were never stored, looks exactly like a form that
// works. So what is pinned here is the ORDER and the failures rather than the
// happy path alone, nothing is stored when the challenge fails, a record never
// exists without its object, and a record that cannot be written costs the object
// instead of being logged and forgotten.

// A factory, not a bare vi.mock: the real module imports lib/firebase, which
// initialises the Firebase SDK at import time with whatever config the environment
// has. The route's only interest in that module is this one function.
vi.mock("../lib/submission-consent-firestore", () => ({
  writeSubmissionConsent: vi.fn(),
}))

const writeConsent = vi.mocked(writeSubmissionConsent)

// The same reason and the same shape as the mock above. There is a second reason
// here: the SENDING HOLD (CLAUDE.md) says nothing transmits until the maintainer
// lifts it, and a unit suite that reached the real Resend would be a live send
// dressed up as a test.
vi.mock("../lib/resend", () => ({ sendEmail: vi.fn() }))

const sendMail = vi.mocked(sendEmail)

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const TURNSTILE_SECRET = "a-secret"

const saved = {
  secret: process.env.TURNSTILE_SECRET_KEY,
  hostnames: process.env.TURNSTILE_HOSTNAMES,
  account: process.env.CLOUDFLARE_ACCOUNT_ID,
  token: process.env.CLOUDFLARE_R2_TOKEN,
}

function restore(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

beforeEach(() => {
  process.env.TURNSTILE_SECRET_KEY = TURNSTILE_SECRET
  process.env.TURNSTILE_HOSTNAMES = "rnui.dev"
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct-123"
  process.env.CLOUDFLARE_R2_TOKEN = "tok-456"
  writeConsent.mockReset()
  sendMail.mockReset()
})

afterEach(() => {
  restore("TURNSTILE_SECRET_KEY", saved.secret)
  restore("TURNSTILE_HOSTNAMES", saved.hostnames)
  restore("CLOUDFLARE_ACCOUNT_ID", saved.account)
  restore("CLOUDFLARE_R2_TOKEN", saved.token)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** Siteverify's success response, shaped as Cloudflare actually returns it. */
const passing = (overrides: Record<string, unknown> = {}) => ({
  success: true,
  action: SUBMIT_ACTION,
  hostname: "rnui.dev",
  "error-codes": [],
  ...overrides,
})

type FetchCall = {
  url: string
  init: { method?: string; headers: Record<string, string>; body?: unknown }
}

/**
 * Siteverify and R2, dispatched on the URL rather than on call order, the order
 * is one of the things under test here, and a stub that answered by sequence
 * would hide a reordering.
 */
function stubNetwork(
  options: {
    turnstile?: unknown
    turnstileStatus?: number
    putStatus?: number
    deleteStatus?: number
  } = {}
) {
  const calls: FetchCall[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url
      calls.push({ url, init: (init ?? {}) as FetchCall["init"] })
      if (url === SITEVERIFY) {
        return new Response(JSON.stringify(options.turnstile ?? passing()), {
          status: options.turnstileStatus ?? 200,
        })
      }
      const status =
        init?.method === "DELETE"
          ? (options.deleteStatus ?? 200)
          : (options.putStatus ?? 200)
      return new Response("", { status })
    })
  )
  const r2 = () => calls.filter((c) => c.url.includes("/r2/buckets/"))
  return { calls, r2, puts: () => r2().filter((c) => c.init.method === "PUT") }
}

/** A valid submission, so each case can spoil exactly one thing. */
const VALID: Record<string, string> = {
  [SUBMISSION_FIELD.contributor]: "Hewad Mubariz",
  // Deliberately mixed case: the address is lowercased on the way in, and the
  // tests below assert that the lowercased form is what gets stored and mailed.
  [SUBMISSION_FIELD.email]: "Hewad@Example.COM",
  [SUBMISSION_FIELD.github]: "hewad-mubariz",
  [SUBMISSION_FIELD.linkedin]: "",
  [SUBMISSION_FIELD.twitter]: "",
  [SUBMISSION_FIELD.caption]: "Radial FAB",
  [SUBMISSION_FIELD.category]: "Buttons",
  [SUBMISSION_FIELD.source]: "https://github.com/example/radial-fab",
  [SUBMISSION_FIELD.consent]: "true",
  [TURNSTILE_FIELD]: "a-real-looking-token",
}

function demo(bytes = 1024, type = "video/mp4"): File {
  return new File([new Uint8Array(bytes)], "demo.mp4", { type })
}

function submit(
  overrides: Record<string, string | null> = {},
  options: { file?: File | null; ip?: string | null } = {}
): Request {
  const form = new FormData()
  for (const [name, value] of Object.entries({ ...VALID, ...overrides })) {
    if (value !== null) form.set(name, value)
  }
  const file = options.file === undefined ? demo() : options.file
  if (file) form.set(DEMO_FIELD, file)

  const headers = new Headers()
  const ip = options.ip === undefined ? "203.0.113.9, 10.0.0.1" : options.ip
  if (ip) headers.set("x-forwarded-for", ip)

  return new Request("https://rnui.dev/api/submit", {
    method: "POST",
    headers,
    body: form,
  })
}

describe("POST /api/submit, the path that works", () => {
  it("stores the Demo, records the consent, and answers ok", async () => {
    const net = stubNetwork()
    const res = await POST(submit())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })

    const puts = net.puts()
    expect(puts).toHaveLength(1)
    expect(puts[0].url).toMatch(/\/objects\/[0-9A-HJKMNP-TV-Z]{26}\.mp4$/)
    expect(puts[0].init.headers.Authorization).toBe("Bearer tok-456")
    expect(puts[0].init.headers["Content-Type"]).toBe("video/mp4")
    // The bytes that were handed over, measured rather than described.
    expect((puts[0].init.body as ArrayBuffer).byteLength).toBe(1024)

    expect(writeConsent).toHaveBeenCalledTimes(1)
    const [id, consent] = writeConsent.mock.calls[0]
    // The document id IS the object key. That is how the record and the bytes
    // find each other without a fifth field, which firestore.rules would refuse.
    expect(puts[0].url.endsWith(`/objects/${id}`)).toBe(true)
    expect(consent.disclosure).toBe(SUBMISSION_DISCLOSURE)
    expect(consent.formVersion).toBe(SUBMISSION_FORM_VERSION)
    // Lowercased on the way in, so one person cannot end up as two records that
    // differ only in capitalisation.
    expect(consent.email).toBe("hewad@example.com")
    // First entry of the list, not the whole header: the client is first and the
    // proxies behind it are not the visitor.
    expect(consent.ip).toBe("203.0.113.9")
    expect(consent.at).toBeInstanceOf(Date)
  })

  it("writes no consent record before the object exists", async () => {
    // Ordering, asserted directly: the call order is the claim being made.
    const net = stubNetwork()
    await POST(submit())
    expect(net.puts()).toHaveLength(1)
    expect(writeConsent).toHaveBeenCalledTimes(1)
    // And the challenge is settled before any of it.
    expect(net.calls[0].url).toBe(SITEVERIFY)
  })

  it("is 'unknown' rather than empty when there is no forwarding header", async () => {
    // firestore.rules requires an `ip` string, so "" would be refused by the
    // database rather than at the edge, a failure with no useful log line.
    stubNetwork()
    await POST(submit({}, { ip: null }))
    expect(writeConsent.mock.calls[0][1].ip).toBe("unknown")
  })
})

describe("POST /api/submit, nothing is stored unless everything passed", () => {
  it("refuses a failed challenge, and stores nothing", async () => {
    const net = stubNetwork({
      turnstile: { success: false, "error-codes": ["timeout-or-duplicate"] },
    })
    const res = await POST(submit())

    expect(res.status).toBe(403)
    expect(net.r2()).toHaveLength(0)
    expect(writeConsent).not.toHaveBeenCalled()
  })

  it("refuses a token minted for a different action", async () => {
    const net = stubNetwork({ turnstile: passing({ action: "signup" }) })
    expect((await POST(submit())).status).toBe(403)
    expect(net.r2()).toHaveLength(0)
  })

  it("names the reason in the log and not to the visitor", async () => {
    // A visitor can act on exactly one thing, try again. Naming
    // `hostname-mismatch` would tell a prober how the check is configured and
    // tell the visitor nothing.
    const logged = vi.spyOn(console, "error").mockImplementation(() => {})
    stubNetwork({ turnstile: passing({ hostname: "evil.example" }) })

    const body = (await (await POST(submit())).json()) as { message: string }
    expect(body.message).not.toMatch(/hostname/)
    expect(logged.mock.calls.flat().join(" ")).toMatch(/hostname-mismatch/)
  })

  it("refuses an unticked consent box", async () => {
    const net = stubNetwork()
    const res = await POST(submit({ [SUBMISSION_FIELD.consent]: "false" }))
    expect(res.status).toBe(400)
    expect(((await res.json()) as { message: string }).message).toMatch(
      /Tick the box/
    )
    expect(net.r2()).toHaveLength(0)
  })

  it("repeats the field rules the browser already ran", async () => {
    // A client is not a validator. Both of these are refused in the browser too,
    // and the point is that they are refused here as well, by the same function.
    const net = stubNetwork()
    const res = await POST(
      submit({
        [SUBMISSION_FIELD.source]: "github.com/example/x",
        [SUBMISSION_FIELD.github]: "@hewad",
      })
    )
    expect(res.status).toBe(400)
    const { message } = (await res.json()) as { message: string }
    expect(message).toMatch(/link starting with https/)
    expect(message).toMatch(/no @ and no URL/)
    expect(net.r2()).toHaveLength(0)
  })

  it("refuses a Category that is not in the table", async () => {
    stubNetwork()
    const res = await POST(
      submit({ [SUBMISSION_FIELD.category]: "Transitions" })
    )
    expect(res.status).toBe(400)
    expect(((await res.json()) as { message: string }).message).toMatch(
      /Choose the Category/
    )
  })

  it("refuses a missing or malformed email, storing nothing", async () => {
    // The field is required because it is the only way back to the Contributor.
    const net = stubNetwork()
    for (const bad of ["", "hewad", "hewad@"]) {
      const res = await POST(submit({ [SUBMISSION_FIELD.email]: bad }))
      expect(res.status, `expected "${bad}" to be refused`).toBe(400)
      expect(((await res.json()) as { message: string }).message).toMatch(
        /email address so we can reach you/
      )
    }
    expect(net.r2()).toHaveLength(0)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it("refuses a missing file, naming the rule", async () => {
    const net = stubNetwork()
    const res = await POST(submit({}, { file: null }))
    expect(res.status).toBe(400)
    expect(((await res.json()) as { message: string }).message).toMatch(
      /Choose a Demo/
    )
    expect(net.r2()).toHaveLength(0)
  })

  it("refuses an oversized file, naming the limit AND the actual size", async () => {
    const net = stubNetwork()
    const res = await POST(submit({}, { file: demo(6 * 1024 * 1024) }))
    expect(res.status).toBe(400)
    expect(((await res.json()) as { message: string }).message).toMatch(
      /at most 5 MB.*6\.0 MB/
    )
    expect(net.r2()).toHaveLength(0)
  })

  it("refuses a file that is not a video", async () => {
    const net = stubNetwork()
    const res = await POST(submit({}, { file: demo(64, "application/zip") }))
    expect(res.status).toBe(400)
    expect(((await res.json()) as { message: string }).message).toMatch(
      /has to be a video file/
    )
    expect(net.r2()).toHaveLength(0)
  })

  it("refuses a text part named `demo`", async () => {
    // asFile narrows rather than casts, so a `demo` that arrived as a plain
    // string cannot reach arrayBuffer() and be stored as nothing. `file: null`
    // so the helper does not overwrite the string with its default File, the
    // first version of this test did exactly that, and passed 200 for a request
    // that had nothing to do with the case it named.
    const net = stubNetwork()
    const res = await POST(
      submit({ [DEMO_FIELD]: "not-a-file" }, { file: null })
    )
    expect(res.status).toBe(400)
    expect(net.r2()).toHaveLength(0)
  })

  it("refuses a body that is not a multipart form", async () => {
    const net = stubNetwork()
    const res = await POST(
      new Request("https://rnui.dev/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
    )
    expect(res.status).toBe(400)
    expect(net.calls).toHaveLength(0)
  })
})

describe("POST /api/submit, what a failure leaves behind", () => {
  it("promises nothing when the object could not be stored", async () => {
    stubNetwork({ putStatus: 500 })
    const res = await POST(submit())

    expect(res.status).toBe(500)
    expect(((await res.json()) as { ok: boolean }).ok).toBe(false)
    // No record, because there is no object for it to describe.
    expect(writeConsent).not.toHaveBeenCalled()
  })

  it("takes the object back when the consent record cannot be written", async () => {
    const net = stubNetwork()
    writeConsent.mockRejectedValueOnce(new Error("firestore unavailable"))
    vi.spyOn(console, "error").mockImplementation(() => {})

    expect((await POST(submit())).status).toBe(500)

    expect(net.r2().map((c) => c.init.method)).toEqual(["PUT", "DELETE"])
    // The delete addresses the object that was just written, not some other key.
    expect(net.r2()[1].url).toBe(net.r2()[0].url)
  })

  it("logs an orphan loudly when even the clean-up fails", async () => {
    // The one path that leaves an orphan. The 30-day lifecycle rule is the floor
    // under it rather than a fix, so the key has to be findable in the log.
    const net = stubNetwork({ deleteStatus: 403 })
    writeConsent.mockRejectedValueOnce(new Error("firestore unavailable"))
    const logged = vi.spyOn(console, "error").mockImplementation(() => {})

    expect((await POST(submit())).status).toBe(500)
    expect(net.r2().map((c) => c.init.method)).toEqual(["PUT", "DELETE"])

    const text = logged.mock.calls.flat().map(String).join(" | ")
    expect(text).toMatch(/ORPHAN/)
    expect(text).toMatch(/rnui-submissions/)
    expect(text).toMatch(/lifecycle rule/)
  })
})

describe("POST /api/submit, the notification (ticket 09)", () => {
  it("sends exactly one email, to the address that forwards to the maintainer", async () => {
    stubNetwork()
    await POST(submit())

    expect(sendMail).toHaveBeenCalledTimes(1)
    const sent = sendMail.mock.calls[0][0]
    expect(sent.to).toBe(CONTACT_EMAIL)
    expect(sent.subject).toMatch(/^New Submission: Radial FAB/)
  })

  it("carries the address the Contributor gave, lowercased", async () => {
    stubNetwork()
    await POST(submit())
    expect(sendMail.mock.calls[0][0].html).toContain("hewad@example.com")
    expect(sendMail.mock.calls[0][0].html).not.toContain("Hewad@Example.COM")
  })

  it("carries the key and the command, so publishing needs no second lookup", async () => {
    stubNetwork()
    await POST(submit())

    const { html } = sendMail.mock.calls[0][0]
    // The same key the consent record is filed under, so the two cannot disagree.
    const key = writeConsent.mock.calls[0][0]
    expect(html).toContain(key)
    expect(html).toContain(`pnpm submissions:open ${key}`)
  })

  it("goes out after the object and the record, never before", async () => {
    const net = stubNetwork()
    await POST(submit())
    expect(net.puts()).toHaveLength(1)
    expect(writeConsent).toHaveBeenCalledTimes(1)
    expect(sendMail).toHaveBeenCalledTimes(1)
  })

  it("sends nothing at all when the request was refused", async () => {
    // One email per Submission, not one per attempt: a bot POSTing the endpoint
    // without a challenge must not be able to make rnui.dev mail anybody.
    stubNetwork({
      turnstile: { success: false, "error-codes": ["invalid-input-response"] },
    })
    await POST(submit())
    expect(sendMail).not.toHaveBeenCalled()
  })

  it("keeps the Submission when the send fails, and says so loudly", async () => {
    // This ticket's stated worst outcome is losing somebody's work because a
    // vendor 500'd, so nothing is rolled back: the object stays, the consent
    // record stays, the visitor is not asked to send it again (which would store a
    // duplicate and write a second consent record), and the log names the recovery.
    const net = stubNetwork()
    sendMail.mockRejectedValueOnce(new Error("resend 500"))
    const logged = vi.spyOn(console, "error").mockImplementation(() => {})

    const res = await POST(submit())

    expect(res.status).toBe(200)
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true)
    expect(net.puts()).toHaveLength(1)
    // No compensating delete, unlike the consent-record failure: there is nothing
    // to compensate for.
    expect(net.r2().map((c) => c.init.method)).toEqual(["PUT"])
    expect(writeConsent).toHaveBeenCalledTimes(1)

    const text = logged.mock.calls.flat().map(String).join(" | ")
    expect(text).toMatch(/NOTIFICATION FAILED/)
    expect(text).toMatch(/pnpm submissions:open --list/)
  })
})
