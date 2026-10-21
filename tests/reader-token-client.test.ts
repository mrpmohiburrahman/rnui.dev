import { afterEach, describe, expect, it, vi } from "vitest"

import { getReaderToken } from "../hooks/use-reader"

const { auth } = vi.hoisted(() => {
  const auth: {
    currentUser: { uid: string; getIdToken: () => Promise<string> } | null
  } = { currentUser: null }
  return { auth }
})

vi.mock("@/lib/firebase", () => ({
  auth,
  githubProvider: null,
  googleProvider: null,
}))

afterEach(() => {
  auth.currentUser = null
})

describe("Reader-bound tokens", () => {
  it("returns the current Reader token with or without an expected identity", async () => {
    auth.currentUser = { uid: "reader-a", getIdToken: async () => "token-a" }
    expect(await getReaderToken("reader-a")).toBe("token-a")
    expect(await getReaderToken()).toBe("token-a")
    auth.currentUser = null
    expect(await getReaderToken("reader-a")).toBeNull()
  })

  it.each(["reader-b", null])(
    "rejects a token when identity becomes %s during refresh",
    async (uid) => {
      let resolve!: (value: string) => void
      auth.currentUser = {
        uid: "reader-a",
        getIdToken: () =>
          new Promise<string>((done) => {
            resolve = done
          }),
      }
      const pending = getReaderToken("reader-a")
      auth.currentUser = uid ? { uid, getIdToken: async () => "token-b" } : null
      resolve("token-a")
      expect(await pending).toBeNull()
    }
  )

  it("refuses a token when identity changes before a saved-Demos load starts", async () => {
    const getIdToken = vi.fn(async () => "token-b")
    auth.currentUser = { uid: "reader-b", getIdToken }
    expect(await getReaderToken("reader-a")).toBeNull()
    expect(getIdToken).not.toHaveBeenCalled()
  })
})
