import { describe, expect, it, vi } from "vitest"

import {
  createSubscribePopup,
  decideSubscribePopup,
  type SubscribePopupInput,
} from "../lib/subscribe-popup"

function browserMemory(contents: Record<string, string> = {}) {
  const data = new Map(Object.entries(contents))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value)
    }),
  }
}

function makePopup(
  adapters: Partial<Parameters<typeof createSubscribePopup>[0]> = {}
) {
  return createSubscribePopup({
    storage: () => null,
    getReaderToken: async () => null,
    request: vi.fn(),
    subscribeEmail: vi
      .fn<Parameters<typeof createSubscribePopup>[0]["subscribeEmail"]>()
      .mockResolvedValue({ ok: true }),
    newsletterSubmitted: vi.fn(),
    ...adapters,
  })
}

const eligible: SubscribePopupInput = {
  route: "/",
  scrollDepth: 350,
  dwellMs: 5000,
  submitted: false,
  dismissed: false,
  readerSuppressed: null,
  signInOpen: false,
  recordingOpen: false,
  open: false,
  shown: false,
}

describe("popup submission", () => {
  it("rejects duplicate presses while a confirmation request is pending", async () => {
    const storage = browserMemory()
    const newsletterSubmitted = vi.fn()
    const getReaderToken = vi.fn(async () => null)
    let finish!: (value: { ok: true }) => void
    const subscribeEmail = vi.fn(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          finish = resolve
        })
    )
    const popup = makePopup({
      storage: () => storage,
      getReaderToken,
      subscribeEmail,
      newsletterSubmitted,
    })
    popup.update(eligible)
    const first = popup.submit(new FormData(), "/")
    await Promise.resolve()
    await popup.submit(new FormData(), "/")
    expect(popup.getSnapshot().pending).toBe(true)
    expect(subscribeEmail).toHaveBeenCalledTimes(1)
    expect(getReaderToken).toHaveBeenCalledTimes(1)
    finish({ ok: true })
    await first
    expect(newsletterSubmitted.mock.calls).toEqual([["/"]])
    expect(storage.setItem.mock.calls).toEqual([
      ["newsletterSubscribed", "true"],
    ])
  })

  it("keeps errors retryable and records nothing until the action succeeds", async () => {
    const storage = browserMemory()
    const newsletterSubmitted = vi.fn()
    const subscribeEmail = vi
      .fn<Parameters<typeof createSubscribePopup>[0]["subscribeEmail"]>()
      .mockResolvedValueOnce({
        ok: false,
        message: "Enter a valid email address",
      })
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: true })
    const popup = makePopup({
      storage: () => storage,
      subscribeEmail,
      newsletterSubmitted,
    })
    popup.update(eligible)
    await popup.submit(new FormData(), "/")
    expect(popup.getSnapshot()).toMatchObject({
      error: "Enter a valid email address",
      pending: false,
      submitted: false,
      open: true,
    })
    await popup.submit(new FormData(), "/")
    expect(popup.getSnapshot()).toMatchObject({
      pending: false,
      submitted: false,
      open: true,
    })
    expect(popup.getSnapshot().error).toBeTruthy()
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(newsletterSubmitted).not.toHaveBeenCalled()
    await popup.submit(new FormData(), "/?q=private")
    expect(subscribeEmail).toHaveBeenLastCalledWith(expect.any(FormData), null)
    expect(newsletterSubmitted.mock.calls).toEqual([["/"]])
  })

  it("does not reopen after the visitor closes an in-flight subscription", async () => {
    let finish!: (value: { ok: true }) => void
    const popup = makePopup({
      subscribeEmail: () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    })
    popup.update(eligible)
    const pending = popup.submit(new FormData(), "/")
    await Promise.resolve()
    await popup.dismiss()
    finish({ ok: true })
    await pending
    popup.update(eligible)
    expect(popup.getSnapshot()).toMatchObject({
      open: false,
      shown: true,
      submitted: true,
    })
  })

  it("uses double opt-in once, forwards the Reader token, and measures only the route", async () => {
    const storage = browserMemory()
    const subscribeEmail = vi.fn(async () => ({ ok: true as const }))
    const newsletterSubmitted = vi.fn()
    const popup = makePopup({
      storage: () => storage,
      getReaderToken: async () => "reader-token",
      subscribeEmail,
      newsletterSubmitted,
    })
    popup.update(eligible)
    const form = new FormData()
    form.set("email", "reader@example.com")
    await popup.submit(form, "/products")
    await popup.submit(form, "/products")
    expect(subscribeEmail).toHaveBeenCalledExactlyOnceWith(form, "reader-token")
    expect(newsletterSubmitted.mock.calls).toEqual([["/products"]])
    expect(storage.setItem.mock.calls).toEqual([
      ["newsletterSubscribed", "true"],
    ])
    popup.update(eligible)
    expect(popup.getSnapshot()).toMatchObject({
      open: true,
      submitted: true,
      pending: false,
      error: null,
    })
    await popup.dismiss()
    expect(storage.setItem.mock.calls).toEqual([
      ["newsletterSubscribed", "true"],
    ])
  })
})

describe("the popup visit", () => {
  it("tolerates blocked browser storage without repeating during the visit", async () => {
    const popup = makePopup({
      storage: () => {
        throw new Error("blocked")
      },
    })
    popup.update(eligible)
    expect(popup.getSnapshot().open).toBe(true)
    await expect(popup.dismiss()).resolves.toBeUndefined()
    popup.update(eligible)
    expect(popup.getSnapshot().open).toBe(false)
  })

  it.each([401, 500])(
    "keeps a local fallback if a Reader dismissal returns %s",
    async (status) => {
      const storage = browserMemory()
      const popup = makePopup({
        storage: () => storage,
        getReaderToken: async () => "reader-token",
        request: vi.fn(async () => new Response(null, { status })),
      })
      popup.update(eligible)
      await popup.dismiss()
      expect(storage.setItem.mock.calls).toEqual([
        ["rnui:popup-dismissed", "true"],
      ])
      expect(popup.getSnapshot().open).toBe(false)
    }
  )

  it("publishes state changes and removes observers on unsubscribe", async () => {
    const popup = makePopup()
    const changed = vi.fn()
    const unsubscribe = popup.subscribe(changed)
    popup.update(eligible)
    popup.update(eligible)
    expect(changed).toHaveBeenCalledTimes(1)
    unsubscribe()
    await popup.dismiss()
    expect(changed).toHaveBeenCalledTimes(1)
  })

  it("persists a Reader dismissal through the authenticated preference route", async () => {
    const storage = browserMemory()
    const request = vi.fn(async () => new Response('{"ok":true}'))
    const popup = makePopup({
      storage: () => storage,
      getReaderToken: async () => "reader-token",
      request,
    })
    popup.update(eligible)
    await popup.dismiss()
    expect(request).toHaveBeenCalledExactlyOnceWith("/api/reader-prefs", {
      method: "POST",
      headers: {
        Authorization: "Bearer reader-token",
        "Content-Type": "application/json",
      },
      body: '{"reason":"dismissed"}',
    })
    expect(storage.setItem).not.toHaveBeenCalled()
    popup.update(eligible)
    expect(popup.getSnapshot().open).toBe(false)
  })

  it.each(["newsletterSubscribed", "rnui:popup-dismissed"])(
    "honors %s in a fresh visit without changing it",
    (key) => {
      const storage = browserMemory({ [key]: "true" })
      const popup = makePopup({
        storage: () => storage,
        getReaderToken: async () => null,
        request: vi.fn(),
      })
      popup.update(eligible)
      expect(popup.getSnapshot().open).toBe(false)
      expect(storage.setItem).not.toHaveBeenCalled()
      storage.data.clear()
      const fresh = makePopup({
        storage: () => storage,
        getReaderToken: async () => null,
        request: vi.fn(),
      })
      fresh.update(eligible)
      expect(fresh.getSnapshot().open).toBe(true)
    }
  )

  it("spends only the visit on crowding and does not write permanent dismissal", () => {
    const storage = browserMemory()
    const request = vi.fn()
    const popup = makePopup({
      storage: () => storage,
      getReaderToken: async () => null,
      request,
    })
    popup.update({ ...eligible, recordingOpen: true })
    popup.update(eligible)
    expect(popup.getSnapshot()).toMatchObject({ open: false, shown: true })
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
  })

  it("closes on a late suppression answer but not on a late failed read", () => {
    const popup = makePopup({
      storage: () => null,
      getReaderToken: async () => null,
      request: vi.fn(),
    })
    popup.update(eligible)
    popup.update({ ...eligible, readerSuppressed: null })
    expect(popup.getSnapshot().open).toBe(true)
    popup.update({ ...eligible, readerSuppressed: "dismissed" })
    expect(popup.getSnapshot()).toMatchObject({ open: false, shown: true })
    popup.update(eligible)
    expect(popup.getSnapshot().open).toBe(false)
  })

  it("remembers a visitor dismissal without changing the submitted-address key", async () => {
    const storage = browserMemory()
    const token = vi.fn(async () => null)
    const request = vi.fn()
    const popup = makePopup({
      storage: () => storage,
      getReaderToken: token,
      request,
    })
    popup.update(eligible)
    expect(popup.getSnapshot().open).toBe(true)
    await popup.dismiss()
    expect(popup.getSnapshot().open).toBe(false)
    expect(storage.setItem.mock.calls).toEqual([
      ["rnui:popup-dismissed", "true"],
    ])
    expect(storage.data.has("newsletterSubscribed")).toBe(false)
    expect(request).not.toHaveBeenCalled()
    popup.update(eligible)
    expect(popup.getSnapshot().open).toBe(false)
  })
})

describe("the subscribe popup decision", () => {
  it("requires both 350px of scroll and five seconds on a listing route", () => {
    const input = eligible
    expect(decideSubscribePopup(input)).toBe("show")
    expect(decideSubscribePopup({ ...input, scrollDepth: 349 })).toBe(
      "stay-hidden"
    )
    expect(decideSubscribePopup({ ...input, dwellMs: 4999 })).toBe(
      "stay-hidden"
    )
  })

  it.each(["/", "/products", "/products?category=buttons", "/products?q=menu"])(
    "shows on %s",
    (route) => expect(decideSubscribePopup({ ...eligible, route })).toBe("show")
  )

  it.each([
    "/subscribe",
    "/recording/demo",
    "/bookmarks",
    "/contributors",
    "/contactus",
    "/products/other",
  ])("stays hidden on %s", (route) =>
    expect(decideSubscribePopup({ ...eligible, route })).toBe("stay-hidden")
  )

  it.each<Partial<SubscribePopupInput>>([
    { submitted: true },
    { dismissed: true },
    { submitted: true, dismissed: true },
    { readerSuppressed: "subscribed" },
    { readerSuppressed: "dismissed" },
    { shown: true },
  ])("respects suppression %j", (suppression) => {
    expect(decideSubscribePopup({ ...eligible, ...suppression })).toBe(
      "stay-hidden"
    )
    expect(
      decideSubscribePopup({ ...eligible, ...suppression, open: true })
    ).toBe("close-and-count-as-shown")
  })

  it.each<Partial<SubscribePopupInput>>([
    { signInOpen: true },
    { recordingOpen: true },
    { signInOpen: true, recordingOpen: true },
  ])("spends this visit rather than queuing behind %j", (crowding) => {
    expect(decideSubscribePopup({ ...eligible, ...crowding })).toBe(
      "close-and-count-as-shown"
    )
    expect(
      decideSubscribePopup({ ...eligible, ...crowding, dwellMs: 4999 })
    ).toBe("stay-hidden")
    expect(
      decideSubscribePopup({ ...eligible, ...crowding, scrollDepth: 349 })
    ).toBe("stay-hidden")
    expect(
      decideSubscribePopup({
        ...eligible,
        ...crowding,
        open: true,
        dwellMs: 0,
        scrollDepth: 0,
      })
    ).toBe("close-and-count-as-shown")
  })

  it("keeps an open popup visible after scrolling back and closes it when leaving the route", () => {
    expect(
      decideSubscribePopup({ ...eligible, open: true, scrollDepth: 0 })
    ).toBe("show")
    expect(
      decideSubscribePopup({ ...eligible, open: true, route: "/subscribe" })
    ).toBe("close-and-count-as-shown")
  })
})
