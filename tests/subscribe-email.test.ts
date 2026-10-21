import { readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { setDoc } from "firebase/firestore"
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
  type KeyInput,
} from "jose"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { subscribeEmail } from "../app/actions/subscribe-email"
import { readPopupSuppression, suppressPopup } from "../lib/reader-prefs"
import { CONSENT_FORM_VERSION, SIGNUP_DISCLOSURE } from "../lib/sender-identity"

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "rnui.dev" }),
}))
vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore")>()),
  setDoc: vi.fn(async () => {}),
}))

const project = "rnui-pixellog-d1008"
let privateKey: KeyInput
let publicJwk: JWK
let database: DatabaseSync
let calls: { url: string; body: Record<string, unknown> }[]

beforeAll(async () => {
  const pair = await generateKeyPair("RS256")
  privateKey = pair.privateKey
  publicJwk = {
    ...(await exportJWK(pair.publicKey)),
    kid: "subscribe-test",
    alg: "RS256",
    use: "sig",
  }
})

beforeEach(() => {
  database = new DatabaseSync(":memory:")
  database.exec(readFileSync("migrations/0002_reader-prefs.sql", "utf8"))
  calls = []
  vi.stubEnv("FIREBASE_PROJECT_ID", project)
  vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account")
  vi.stubEnv("CLOUDFLARE_D1_DATABASE_ID", "test-database")
  vi.stubEnv("CLOUDFLARE_D1_API_TOKEN", "test-d1-token")
  vi.stubEnv("RESEND_API_KEY", "test-email-token")
  vi.stubEnv("SUBSCRIBE_TOKEN_SECRET", "test-secret-long-enough-for-hmac")
  vi.mocked(setDoc).mockReset().mockResolvedValue(undefined)
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<
        string,
        unknown
      >
      calls.push({ url, body })
      if (url.startsWith("https://www.googleapis.com/")) {
        return Response.json({ keys: [publicJwk] })
      }
      if (url === "https://api.resend.com/emails")
        return Response.json({ id: "sent" })
      if (url.startsWith("https://api.cloudflare.com/")) {
        const results = database
          .prepare(String(body.sql))
          .all(...(body.params as string[]))
        return Response.json({ result: [{ success: true, results }] })
      }
      throw new Error("Unexpected network request")
    })
  )
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  database?.close()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

async function token(uid = "reader-a", key = privateKey) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: "subscribe-test" })
    .setIssuer(`https://securetoken.google.com/${project}`)
    .setAudience(project)
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key)
}

function form(email = "reader@deliverable.dev") {
  const data = new FormData()
  data.set("email", email)
  return data
}

describe("subscribeEmail Reader suppression", () => {
  it("keeps signed-out subscriptions pending without any Reader storage or token lookup", async () => {
    expect(await subscribeEmail(form())).toEqual({ ok: true })
    expect(calls.map(({ url }) => url)).toEqual([
      "https://api.resend.com/emails",
    ])
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ confirmed: false })
    )
  })

  it("keeps reserved addresses pending without sending, with optional Reader suppression", async () => {
    expect(await subscribeEmail(form("reader@example.test"))).toEqual({
      ok: true,
    })
    expect(calls).toEqual([])
    expect(setDoc).toHaveBeenCalledTimes(1)
    expect(
      await subscribeEmail(form("reader@example.test"), await token())
    ).toEqual({ ok: true })
    expect(
      calls.some(({ url }) => url === "https://api.resend.com/emails")
    ).toBe(false)
    expect(await readPopupSuppression("reader-a")).toBe("subscribed")
  })

  it("rejects invalid Reader tokens before storing consent or sending mail", async () => {
    const attacker = await generateKeyPair("RS256")
    for (const supplied of [
      "",
      "unknown",
      await token("reader-b", attacker.privateKey),
    ]) {
      expect((await subscribeEmail(form(), supplied)).ok).toBe(false)
    }
    expect(setDoc).not.toHaveBeenCalled()
    expect(
      calls.every(({ url }) => url.startsWith("https://www.googleapis.com/"))
    ).toBe(true)
  })

  it("does not suppress when email validation or the pending write fails", async () => {
    expect((await subscribeEmail(form("invalid"), await token())).ok).toBe(
      false
    )
    vi.mocked(setDoc).mockRejectedValueOnce(new Error("Firestore unavailable"))
    expect((await subscribeEmail(form(), await token())).ok).toBe(false)
    expect(calls.some(({ body }) => body.sql)).toBe(false)
    expect(
      calls.some(({ url }) => url === "https://api.resend.com/emails")
    ).toBe(false)
  })

  it("does not suppress when confirmation mail fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    expect((await subscribeEmail(form(), await token())).ok).toBe(false)
    expect(setDoc).toHaveBeenCalledTimes(1)
    expect(calls.some(({ body }) => body.sql)).toBe(false)
  })

  it("reports a failed preference write rather than claiming complete success", async () => {
    vi.stubEnv("CLOUDFLARE_D1_API_TOKEN", "")
    expect(await subscribeEmail(form(), await token())).toEqual({
      ok: false,
      message:
        "We received your subscription request. We could not save your preference. Try again.",
    })
    expect(
      calls.some(({ url }) => url === "https://api.resend.com/emails")
    ).toBe(true)
  })

  it("upgrades the verified Reader after the confirmation send without changing consent", async () => {
    await suppressPopup("reader-a", "dismissed")
    await suppressPopup("reader-b", "dismissed")
    calls = []
    const data = form("  READER@deliverable.dev ")
    data.set("uid", "reader-b")
    expect(await subscribeEmail(data, await token())).toEqual({ ok: true })
    const emailIndex = calls.findIndex(
      ({ url }) => url === "https://api.resend.com/emails"
    )
    const writes = calls.filter(({ body }) =>
      String(body.sql).startsWith("INSERT")
    )
    expect(writes).toHaveLength(1)
    expect(calls.indexOf(writes[0])).toBeGreaterThan(emailIndex)
    expect(writes[0].body.params).toEqual([
      "reader-a",
      expect.any(String),
      "subscribed",
    ])
    expect(await readPopupSuppression("reader-a")).toBe("subscribed")
    expect(await readPopupSuppression("reader-b")).toBe("dismissed")
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        email: "reader@deliverable.dev",
        confirmed: false,
        consentText: SIGNUP_DISCLOSURE,
        formVersion: CONSENT_FORM_VERSION,
      })
    )
  })
})
