import { describe, expect, it } from "vitest"

import {
  DIGEST_DAILY_CAP,
  GENERAL_AUDIENCE_ID,
  planDigestStages,
  refuseBroadcastTarget,
  refuseNextStage,
  refuseRepeatStage,
  stageContactRows,
  unsubscribeUrlFromHtml,
} from "../lib/digest-stages"

const YAHOO = ["yahoo-a", "yahoo-b"] as const

function ids(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${i + 1}`)
}

describe("planDigestStages", () => {
  it("puts the maintainer first, then 5, then 10, then the remainder, then yahoo", () => {
    const deliverable = ids("d", 26)
    const stages = planDigestStages({
      deliverableDocIds: deliverable,
      yahooDocIds: YAHOO,
    })

    expect(stages.map((stage) => stage.name)).toEqual([
      "maintainer",
      "five",
      "ten",
      "remainder",
      "yahoo",
    ])
    expect(stages[0].docIds).toEqual([])
    expect(stages[1].docIds).toEqual(deliverable.slice(0, 5))
    expect(stages[2].docIds).toEqual(deliverable.slice(5, 15))
    expect(stages[3].docIds).toEqual(deliverable.slice(15))
    expect(stages[4].docIds).toEqual([...YAHOO])
  })

  it("keeps a yahoo id out of the first three survivor stages", () => {
    const deliverable = [...ids("d", 26), ...YAHOO]
    const stages = planDigestStages({
      deliverableDocIds: deliverable,
      yahooDocIds: YAHOO,
    })
    const early = stages
      .filter((stage) => stage.name !== "yahoo" && stage.name !== "maintainer")
      .flatMap((stage) => stage.docIds)

    expect(early).not.toEqual(expect.arrayContaining([...YAHOO]))
    expect(stages.at(-1)?.docIds).toEqual([...YAHOO])
  })

  it("drops an undeliverable id from every stage", () => {
    const stages = planDigestStages({
      deliverableDocIds: ["d-1", "dropped"],
      yahooDocIds: ["yahoo-a"],
      droppedDocIds: ["dropped"],
    })
    expect(stages.flatMap((stage) => stage.docIds)).not.toContain("dropped")
  })

  it("splits a remainder that would pass the daily cap", () => {
    const deliverable = ids("d", 120)
    const stages = planDigestStages({
      deliverableDocIds: deliverable,
      yahooDocIds: [],
    })
    const remainder = stages.filter((stage) => stage.name === "remainder")

    expect(remainder.map((stage) => stage.docIds.length)).toEqual([
      DIGEST_DAILY_CAP,
      5,
    ])
    for (const stage of stages) {
      const size = stage.name === "maintainer" ? 1 : stage.docIds.length
      expect(size).toBeLessThanOrEqual(DIGEST_DAILY_CAP)
    }
  })
})

describe("refuseNextStage", () => {
  const sentAt = "2026-10-20T12:00:00.000Z"
  const nextDay = new Date("2026-10-21T12:00:00.000Z")

  it("allows the maintainer stage when nothing has been sent", () => {
    expect(refuseNextStage(null, nextDay)).toBeNull()
  })

  it("stops the sequence on any complaint", () => {
    expect(
      refuseNextStage(
        {
          sentAt,
          hardBounces: 0,
          complaints: 1,
          hardBouncesRemoved: true,
        },
        nextDay
      )
    ).toBe("a complaint stops the sequence")
  })

  it("refuses while a hard bounce is still on the list", () => {
    expect(
      refuseNextStage(
        {
          sentAt,
          hardBounces: 2,
          complaints: 0,
          hardBouncesRemoved: false,
        },
        nextDay
      )
    ).toBe("hard bounces must be removed before the next stage")
  })

  it("refuses a second stage on the same UTC day", () => {
    expect(
      refuseNextStage(
        {
          sentAt,
          hardBounces: 0,
          complaints: 0,
          hardBouncesRemoved: true,
        },
        new Date("2026-10-20T18:00:00.000Z")
      )
    ).toBe("the next stage waits until the next UTC day")
  })

  it("allows the next stage the following UTC day once bounces are gone", () => {
    expect(
      refuseNextStage(
        {
          sentAt,
          hardBounces: 1,
          complaints: 0,
          hardBouncesRemoved: true,
        },
        nextDay
      )
    ).toBeNull()
  })
})

describe("the send target", () => {
  it("refuses an audience, and refuses the General audience id", () => {
    expect(
      refuseBroadcastTarget({
        segmentId: "seg-1",
        audienceId: GENERAL_AUDIENCE_ID,
      })
    ).toBe("a Digest stage never targets an audience")
    expect(refuseBroadcastTarget({ segmentId: GENERAL_AUDIENCE_ID })).toBe(
      "a Digest stage needs its own segment"
    )
    expect(refuseBroadcastTarget({ segmentId: "seg-1" })).toBeNull()
  })

  it("reads the rewritten unsubscribe href and rejects a leftover token", () => {
    const html =
      '<a href="https://example.com/u?a=1&' + 'amp;b=2">Unsubscribe</a>'
    expect(unsubscribeUrlFromHtml(html)).toBe("https://example.com/u?a=1&b=2")
    expect(() =>
      unsubscribeUrlFromHtml(
        '<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a>'
      )
    ).toThrow(/token/)
  })

  it("refuses to send a stage that is already in the log", () => {
    expect(refuseRepeatStage([{ name: "maintainer" }], "maintainer")).toBe(
      "this stage was already sent"
    )
    expect(refuseRepeatStage([], "maintainer")).toBeNull()
  })
})

describe("stageContactRows", () => {
  const consent = [
    { docId: "a", createdAt: "2024-12-30T09:38:23.316Z" },
    { docId: "b", createdAt: "2026-01-15T02:32:01.168Z" },
  ]
  const addresses = { a: "one@example.test", b: "two@example.test" }

  it("formats each consent instant as a UTC Digest date", () => {
    expect(stageContactRows({ docIds: ["a", "b"], consent, addresses })).toEqual([
      { docId: "a", email: "one@example.test", signupDate: "30 December 2024" },
      { docId: "b", email: "two@example.test", signupDate: "15 January 2026" },
    ])
  })

  it("reads a consent just before UTC midnight as that same UTC day", () => {
    const rows = stageContactRows({
      docIds: ["late"],
      consent: [{ docId: "late", createdAt: "2026-03-08T23:59:00.000Z" }],
      addresses: { late: "late@example.test" },
    })

    expect(rows[0].signupDate).toBe("8 March 2026")
  })

  it("refuses a docId with no address, naming it", () => {
    expect(() =>
      stageContactRows({
        docIds: ["a", "b"],
        consent,
        addresses: { a: "one@example.test" },
      })
    ).toThrow("b")
  })

  it("refuses a docId with no consent date, naming it", () => {
    expect(() => stageContactRows({ docIds: ["a"], consent: [], addresses })).toThrow(
      "a"
    )
  })

  it("refuses a consent instant it cannot read as a date", () => {
    expect(() =>
      stageContactRows({
        docIds: ["a"],
        consent: [{ docId: "a", createdAt: "not a date" }],
        addresses,
      })
    ).toThrow()
  })

  it("keeps the order the stage plan gave, so a stage is reproducible", () => {
    const rows = stageContactRows({ docIds: ["b", "a"], consent, addresses })

    expect(rows.map((row) => row.docId)).toEqual(["b", "a"])
  })
})
