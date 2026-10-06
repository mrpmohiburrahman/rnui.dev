import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
  type KeyInput,
} from "jose"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// sign-in-to-save ticket 05, scaffolding the module ticket 02 specified.
//
// Every test signs a REAL token with a REAL RSA key and points the verifier at a
// REAL JWKS document served by a stubbed fetch. Nothing about the signature path
// is mocked, because a mocked signature path would pass while the real check was
// broken — and this file is what stands between an anonymous internet and a
// Reader's saved Demos.
//
// The eight cases the ticket requires are all here: expired, wrong aud, wrong
// iss, unexpected kid, alg: none, empty sub, missing header, and JWKS
// unreachable failing closed.
//
// Two of them earn their keep beyond the list. `alg: none` is why
// `algorithms: ["RS256"]` is pinned rather than left to the library's default.
// JWKS-unreachable is why ticket 07's merge must not delete a browser's local
// bookmarks on a successful merge alone: it is the one condition that is an
// outage rather than a rejection, and it fails closed on purpose.
//
// The module is imported through `loadModule()` in every test rather than at the
// top of this file. `lib/firebase-token.ts` holds one `createRemoteJWKSet`, which
// memoises its fetched keys for the lifetime of the process — a single static
// import would make the first test's key the JWKS for all of them, and whichever
// test ran second would be asserting nothing.

const PROJECT_ID = "rnui-pixellog-d1008"
const ISSUER = `https://securetoken.google.com/${PROJECT_ID}`

type Module = typeof import("../lib/firebase-token")

/** A fresh copy of the module, with its own empty JWKS cache. */
async function loadModule(): Promise<Module> {
  vi.resetModules()
  return import("../lib/firebase-token")
}

/**
 * A signer the tests own, standing in for Google's. The module fetches its JWKS
 * from a URL of Google's, and the stub answers that URL with this key's public
 * half — which is the whole trust boundary. If the verifier trusted the token's
 * own key rather than the fetched JWKS, not one of these tokens would pass.
 */
async function signer(
  kid = "test-kid-1"
): Promise<{ privateKey: KeyInput; publicJwk: JWK }> {
  const { privateKey, publicKey } = await generateKeyPair("RS256")
  return {
    privateKey,
    publicJwk: {
      ...(await exportJWK(publicKey)),
      kid,
      alg: "RS256",
      use: "sig",
    },
  }
}

const NOW = () => Math.floor(Date.now() / 1000)

/** Re-import a JWK as a public CryptoKey, so its bits can be read as an HMAC secret. */
async function importPublicKey(jwk: JWK): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty!, n: jwk.n!, e: jwk.e! },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["verify"]
  )
}

async function mint(
  key: KeyInput,
  options: {
    audience?: string
    issuer?: string
    subject?: string
    issuedAt?: number
    expiresAt?: number
    alg?: string
    kid?: string
  } = {}
): Promise<string> {
  const now = NOW()
  return new SignJWT({
    email: "reader@example.com",
    email_verified: true,
    auth_time: now - 60,
  })
    .setProtectedHeader({
      alg: options.alg ?? "RS256",
      kid: options.kid ?? "test-kid-1",
    })
    .setIssuer(options.issuer ?? ISSUER)
    .setAudience(options.audience ?? PROJECT_ID)
    .setSubject(options.subject ?? "reader-uid-1")
    .setIssuedAt(options.issuedAt ?? now - 10)
    .setExpirationTime(options.expiresAt ?? now + 3600)
    .sign(key)
}

const restorers: (() => void)[] = []

/** Serve a JWKS over a stubbed fetch, and count how often it is asked. */
function serveJwks(jwks: JWK, headers: Record<string, string> = {}) {
  const calls: string[] = []
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input))
    return new Response(JSON.stringify({ keys: [jwks] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...headers },
    })
  }) as typeof fetch
  const restore = () => {
    globalThis.fetch = realFetch
  }
  restorers.push(restore)
  return { calls, restore }
}

/** A fetch that always fails, for the JWKS-unreachable case. */
function serveUnreachable() {
  const realFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed")
  }) as typeof fetch
  restorers.push(() => {
    globalThis.fetch = realFetch
  })
}

const savedProjectId = process.env.FIREBASE_PROJECT_ID

beforeEach(() => {
  process.env.FIREBASE_PROJECT_ID = PROJECT_ID
  // jose's cache freshness is measured with Date.now(), so the cooldown test
  // below needs a clock it can move. Real timers otherwise.
  vi.useRealTimers()
})

afterEach(() => {
  for (const restore of restorers.splice(0)) restore()
  // `undefined` deleted rather than assigned, because assigning it writes the
  // STRING "undefined" — the same trap tests/turnstile.test.ts documents.
  if (savedProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID
  else process.env.FIREBASE_PROJECT_ID = savedProjectId
})

describe("verifyReader", () => {
  it("accepts a token this project minted, and returns its sub as the uid", async () => {
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk, { "Cache-Control": "max-age=3600" })
    const { verifyReader } = await loadModule()

    const reader = await verifyReader(`Bearer ${await mint(privateKey)}`)

    expect(reader.uid).toBe("reader-uid-1")
    expect(reader.email).toBe("reader@example.com")
    expect(reader.emailVerified).toBe(true)
  })

  it("verifies against the JWKS it fetched, not a key the token carries", async () => {
    // The whole file in one test: a token signed by a key that is NOT in the
    // JWKS is rejected, so minting your own token buys an attacker nothing.
    const ours = await signer()
    const theirs = await signer()
    serveJwks(ours.publicJwk)
    const { verifyReader } = await loadModule()

    await expect(
      verifyReader(`Bearer ${await mint(theirs.privateKey)}`)
    ).rejects.toThrow(/Invalid session token/)
  })

  it("REJECTS an expired token", async () => {
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { verifyReader } = await loadModule()

    const expired = await mint(privateKey, {
      issuedAt: NOW() - 7200,
      expiresAt: NOW() - 3600,
    })

    await expect(verifyReader(`Bearer ${expired}`)).rejects.toThrow(
      /Invalid session token/
    )
  })

  it("REJECTS a token whose aud is another Firebase project", async () => {
    // Signed by OUR key, for OUR issuer, and still rejected, because `aud` is
    // pinned. This is the side-project case ticket 02 named.
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { verifyReader } = await loadModule()

    const wrongAudience = await mint(privateKey, {
      audience: "some-other-firebase-project",
    })

    await expect(verifyReader(`Bearer ${wrongAudience}`)).rejects.toThrow(
      /Invalid session token/
    )
  })

  it("REJECTS a token whose iss is another Firebase project", async () => {
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { verifyReader } = await loadModule()

    const wrongIssuer = await mint(privateKey, {
      issuer: "https://securetoken.google.com/some-other-firebase-project",
    })

    await expect(verifyReader(`Bearer ${wrongIssuer}`)).rejects.toThrow(
      /Invalid session token/
    )
  })

  it("REJECTS a token signed by a key not in the JWKS (unexpected kid)", async () => {
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { verifyReader } = await loadModule()

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", kid: "a-kid-we-have-never-seen" })
      .setIssuer(ISSUER)
      .setAudience(PROJECT_ID)
      .setSubject("reader-uid-1")
      .setIssuedAt(NOW() - 10)
      .setExpirationTime(NOW() + 3600)
      .sign(privateKey)

    await expect(verifyReader(`Bearer ${token}`)).rejects.toThrow(
      /Invalid session token/
    )
  })

  it("REJECTS alg: none, and rejects it as a disallowed algorithm", async () => {
    // Two claims, and the second is the one that is easy to lose.
    //
    // First: the token is rejected. Second: it is rejected *because the algorithm
    // list excludes it*, which is `JOSEAlgNotAllowed`. That distinction is
    // load-bearing for the pin and nothing else — jose 6.2.12 already refuses an
    // `alg: none` token on its own, with `JOSENotSupported`, because it will not
    // verify with a key whose type does not match the header. So a test that
    // only asserted "it throws" passed with the pin deleted, which is how a
    // defence-in-depth line quietly stops being defended. Asserting the cause
    // makes the pin load-bearing again: unpin it and this fails.
    serveJwks((await signer()).publicJwk)
    const { verifyReader } = await loadModule()

    const header = Buffer.from(
      JSON.stringify({ alg: "none", typ: "JWT" })
    ).toString("base64url")
    const claims = Buffer.from(
      JSON.stringify({
        iss: ISSUER,
        aud: PROJECT_ID,
        sub: "attacker",
        iat: NOW() - 10,
        exp: NOW() + 3600,
      })
    ).toString("base64url")

    const failure = await verifyReader(`Bearer ${header}.${claims}.`).catch(
      (err: unknown) => err as Error & { cause?: { name?: string } }
    )

    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toMatch(/Invalid session token/)
    expect((failure as { cause?: { name?: string } }).cause?.name).toBe(
      "JOSEAlgNotAllowed"
    )
  })

  it("REJECTS an HMAC downgrade using the published public key as the secret", async () => {
    // The attack the algorithm pin exists for, and the reason it stays even
    // though the case above now also fails on jose's own. A public key is, by
    // construction, not secret: if the verifier will use whatever is in the JWKS
    // as an HMAC shared secret, anybody can read the JWKS and sign their own
    // tokens. Pinned to RS256, the public key is only ever a verification key.
    const ours = await signer()
    serveJwks(ours.publicJwk)
    const { verifyReader } = await loadModule()

    // Sign HS256, using the RSA public key's modulus as the HMAC secret.
    const exported = (await crypto.subtle.exportKey(
      "jwk",
      await importPublicKey(ours.publicJwk)
    )) as JsonWebKey & { n: string }
    const hmacKey = await crypto.subtle.importKey(
      "jwk",
      { kty: "oct", k: exported.n, alg: "HS256" },
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const now = NOW()
    const forged = await new SignJWT({
      iss: ISSUER,
      aud: PROJECT_ID,
      sub: "attacker",
      iat: now - 10,
      exp: now + 3600,
    })
      .setProtectedHeader({ alg: "HS256", kid: "test-kid-1" })
      .sign(hmacKey)

    await expect(verifyReader(`Bearer ${forged}`)).rejects.toThrow(
      /Invalid session token/
    )
  })

  it("REJECTS a valid token carrying an empty sub", async () => {
    // jwtVerify checks exp, iat and nbf; it does not check that `sub` is
    // present. An empty uid would key every such Reader to the same row, and one
    // visitor's saved Demos would read as another's.
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { verifyReader } = await loadModule()

    await expect(
      verifyReader(`Bearer ${await mint(privateKey, { subject: "" })}`)
    ).rejects.toThrow(/Invalid session token/)
  })

  it("REJECTS a missing or malformed Authorization header, before any crypto", async () => {
    // No fetch stub on purpose. If this reached the network it would fail
    // loudly instead, and the test would be asserting the wrong error.
    const { verifyReader } = await loadModule()

    await expect(verifyReader(null)).rejects.toThrow(/Missing bearer token/)
    await expect(verifyReader(undefined)).rejects.toThrow(
      /Missing bearer token/
    )
    await expect(verifyReader("")).rejects.toThrow(/Missing bearer token/)
    await expect(verifyReader("Basic abc")).rejects.toThrow(
      /Missing bearer token/
    )
    await expect(verifyReader("Bearer   ")).rejects.toThrow(
      /Missing bearer token/
    )
  })

  it("FAILS CLOSED when the JWKS endpoint is unreachable", async () => {
    const { privateKey } = await signer()
    serveUnreachable()
    const { verifyReader } = await loadModule()

    // A perfectly valid token, and no way to check it, so the answer is no.
    // Any fallback here is the failure this asserts away — and it is why
    // ticket 07 keeps the browser's copy of a Reader's bookmarks.
    await expect(
      verifyReader(`Bearer ${await mint(privateKey)}`)
    ).rejects.toThrow(/Invalid session token/)
  })

  it("refuses every token when FIREBASE_PROJECT_ID is unset", async () => {
    delete process.env.FIREBASE_PROJECT_ID
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { verifyReader } = await loadModule()

    // A hard error, not "unauthenticated". A missing project id is a deployment
    // mistake, and reporting it as merely-not-signed-in would turn a broken
    // deploy into a site where saving quietly stopped working.
    await expect(
      verifyReader(`Bearer ${await mint(privateKey)}`)
    ).rejects.toThrow(/FIREBASE_PROJECT_ID is not set/)
  })

  it("gives the same message for every cryptographic failure", async () => {
    // One message, deliberately. A verifier that distinguishes "wrong audience"
    // from "wrong signature" is an oracle for probing tokens, and no caller needs
    // the difference.
    serveJwks((await signer()).publicJwk)
    const { verifyReader } = await loadModule()

    await expect(verifyReader("Bearer not.a.jwt")).rejects.toThrow(
      new Error("Invalid session token")
    )
  })
})

describe("currentReader", () => {
  it("returns the Reader for a token that verifies", async () => {
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { currentReader } = await loadModule()

    expect(
      await currentReader(`Bearer ${await mint(privateKey)}`)
    ).toMatchObject({
      uid: "reader-uid-1",
    })
  })

  it("returns null rather than throwing when nobody is signed in", async () => {
    const { currentReader } = await loadModule()
    expect(await currentReader(null)).toBeNull()
  })

  it("returns null for a token that fails to verify — the same answer", async () => {
    // The point of currentReader: "no token" and "a token we could not check" are
    // both simply not-signed-in, so neither can become an identity. A route that
    // must tell them apart calls verifyReader and lets the throw reach a 401.
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { currentReader } = await loadModule()

    const expired = await mint(privateKey, {
      issuedAt: NOW() - 7200,
      expiresAt: NOW() - 3600,
    })

    expect(await currentReader(`Bearer ${expired}`)).toBeNull()
  })

  it("returns null when the JWKS is unreachable, rather than an identity", async () => {
    const { privateKey } = await signer()
    serveUnreachable()
    const { currentReader } = await loadModule()

    expect(await currentReader(`Bearer ${await mint(privateKey)}`)).toBeNull()
  })

  it("never returns a Reader with an empty uid", async () => {
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    const { currentReader } = await loadModule()

    expect(
      await currentReader(`Bearer ${await mint(privateKey, { subject: "" })}`)
    ).toBeNull()
  })
})

describe("the JWKS is cached, not refetched per request", () => {
  it("fetches Google's keys once and reuses them across verifications", async () => {
    // The alternative is a network round trip to Google on the save path — the
    // per-request cost D1 was chosen to avoid, reintroduced through the front
    // door. This is the test that catches `createRemoteJWKSet` moving inside the
    // verify function, which compiles fine and reads tidily.
    const { privateKey, publicJwk } = await signer()
    const server = serveJwks(publicJwk, { "Cache-Control": "max-age=3600" })
    const { verifyReader } = await loadModule()
    const token = await mint(privateKey)

    await verifyReader(`Bearer ${token}`)
    await verifyReader(`Bearer ${token}`)
    await verifyReader(`Bearer ${token}`)

    expect(server.calls).toHaveLength(1)
    expect(server.calls[0]).toContain("securetoken@system.gserviceaccount.com")
  })

  it("recovers from a Firebase key rotation without a deploy", async () => {
    // The behaviour worth pinning, because the instinct on seeing "saving
    // stopped working" is to redeploy — and a redeploy changes nothing here.
    //
    // jose refetches on an unknown `kid` only when the cached key set is already
    // older than its 30-second cooldown. So a rotation costs at most ~30 seconds
    // of saves failing closed, and then the next token carrying the new `kid`
    // fetches the new key set and succeeds. Measured below rather than assumed:
    // an earlier draft of this test expected an instant refetch, which jose does
    // not do.
    const known = await signer("kid-1")
    const rotated = await signer("kid-2") // A rotation publishes a NEW kid.
    const realFetch = globalThis.fetch
    let published = [known.publicJwk]
    const calls: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input))
      return new Response(JSON.stringify({ keys: published }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=3600",
        },
      })
    }) as typeof fetch
    restorers.push(() => {
      globalThis.fetch = realFetch
    })
    const { verifyReader } = await loadModule()

    // Warm the cache with the pre-rotation key.
    await verifyReader(
      `Bearer ${await mint(known.privateKey, { kid: "kid-1" })}`
    )
    expect(calls).toHaveLength(1)

    // Firebase rotates server-side. Our cached key set is still the old one.
    published = [rotated.publicJwk]

    // Inside the cooldown: fails closed, and does not hammer Google trying.
    await expect(
      verifyReader(`Bearer ${await mint(rotated.privateKey, { kid: "kid-2" })}`)
    ).rejects.toThrow(/Invalid session token/)
    expect(calls).toHaveLength(1)

    // Past the cooldown: one refetch, and the rotation resolves itself.
    vi.setSystemTime(Date.now() + 31_000)
    restorers.push(() => vi.useRealTimers())

    const reader = await verifyReader(
      `Bearer ${await mint(rotated.privateKey, { kid: "kid-2" })}`
    )

    expect(reader.uid).toBe("reader-uid-1")
    expect(calls).toHaveLength(2)
  })

  it("does not refetch on every request inside the cache window", async () => {
    // The other half of the same claim, and the one that matters for cost: a
    // client that saves four Demos in a row must cost one JWKS fetch, not four.
    const { privateKey, publicJwk } = await signer()
    const server = serveJwks(publicJwk, { "Cache-Control": "max-age=3600" })
    const { verifyReader } = await loadModule()

    for (let i = 0; i < 4; i++) {
      await verifyReader(`Bearer ${await mint(privateKey)}`)
    }

    expect(server.calls).toHaveLength(1)
  })
})

describe("the module reads its project id at call time", () => {
  it("does not freeze it at import", async () => {
    // A value read at import would be captured by the first request in the
    // process. The Vercel project sets this as an environment variable rather
    // than in a .env file, and a module that froze it would fail in a way no
    // local run reproduces.
    const { verifyReader } = await loadModule()
    delete process.env.FIREBASE_PROJECT_ID

    await expect(verifyReader("Bearer whatever")).rejects.toThrow(
      /FIREBASE_PROJECT_ID is not set/
    )

    // And it recovers rather than staying broken for the process's lifetime.
    process.env.FIREBASE_PROJECT_ID = PROJECT_ID
    const { privateKey, publicJwk } = await signer()
    serveJwks(publicJwk)
    await expect(
      verifyReader(`Bearer ${await mint(privateKey)}`)
    ).resolves.toMatchObject({ uid: "reader-uid-1" })
  })
})
