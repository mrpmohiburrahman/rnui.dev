import { describe, expect, it } from "vitest"

import {
  bounceIsRemoved,
  copiesForStage,
  countsExpired,
  decideUnsentPending,
  DIGEST_DAILY_CAP,
  GENERAL_AUDIENCE_ID,
  isPendingStageRow,
  mergeRefreshedOutcome,
  missingRecipients,
  planDigestStages,
  parseSendLog,
  refuseAbsentRecordedHistory,
  refuseAnyComplaint,
  refuseBroadcastTarget,
  refuseCollect,
  refuseNextStage,
  refuseRecordedSend,
  refuseRepeatStage,
  refuseStageOrder,
  refuseUnloggedStage,
  stageContactRows,
  stageOutcomeFromEvents,
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

  it("refuses when the previous stage row is missing bounce or complaint counts", () => {
    expect(
      refuseNextStage(
        {
          sentAt,
        } as unknown as Parameters<typeof refuseNextStage>[0],
        nextDay
      )
    ).toMatch(/bounce or complaint|incomplete/)
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

describe("parseSendLog", () => {
  const completeStage = {
    name: "maintainer",
    sentAt: "2026-10-20T12:00:00.000Z",
    hardBounces: 0,
    complaints: 0,
    hardBouncesRemoved: true,
  }

  it("reports an absent log as absent, with no stages", () => {
    expect(parseSendLog(null)).toEqual({ stages: [], absent: true })
  })

  it("reads the stages of a log with complete stage rows", () => {
    expect(
      parseSendLog(JSON.stringify({ stages: [completeStage] }))
    ).toEqual({
      stages: [completeStage],
      absent: false,
    })
  })

  it("refuses a log that is not JSON instead of reading it as empty", () => {
    expect(() => parseSendLog("{")).toThrow(/not JSON/)
  })

  it("refuses a log with no stages array instead of reading it as empty", () => {
    expect(() => parseSendLog('{"nope":1}')).toThrow(/no stages array/)
  })

  it("refuses an existing log whose stages array is empty", () => {
    expect(() => parseSendLog('{"stages":[]}')).toThrow(/empty|no history|no recorded stages/)
  })

  it("refuses a log row with no bounce or complaint counts", () => {
    expect(() =>
      parseSendLog(
        JSON.stringify({
          stages: [{ name: "maintainer", sentAt: "2026-10-20T12:00:00.000Z" }],
        })
      )
    ).toThrow(/incomplete|bounce|complaint/)
  })
})

const realMaintainerRow = {
  name: "maintainer",
  sentAt: "2026-10-22T01:54:32.937Z",
  hardBounces: 0,
  complaints: 0,
  hardBouncesRemoved: true,
  broadcastId: "0ba0dd5c-b85d-44f4-8f54-07e102aee1af",
  emailId: "email-maintainer",
  segmentId: "segment-maintainer",
  lastEvent: "delivered",
  unsubscribeExercised: true,
}

const realFiveRow = {
  name: "five",
  sentAt: "2026-10-22T02:53:58.525Z",
  hardBounces: 0,
  complaints: 0,
  hardBouncesRemoved: true,
  broadcastId: "e6b9c9f5-f238-41d4-9ee6-eccec98e797b",
  emailId: "email-1",
  segmentId: "1d0fbcbc-89ca-4ea8-90c8-51ccbaca250e",
  lastEvent: "delivered",
  unsubscribeExercised: false,
  emailIds: ["email-1", "email-2", "email-3", "email-4", "email-5"],
  events: { delivered: 5 },
}

const pendingTenRow = {
  name: "ten",
  sentAt: "2026-10-23T03:00:00.000Z",
  broadcastId: "broadcast-ten",
  segmentId: "1d0fbcbc-89ca-4ea8-90c8-51ccbaca250e",
  recipients: ["one@example.test", "two@example.test"],
  pending: true,
}

describe("the real send log shape", () => {
  it("parses the recorded maintainer and five rows", () => {
    const log = parseSendLog(
      JSON.stringify({ stages: [realMaintainerRow, realFiveRow] })
    )
    expect(log).toEqual({
      stages: [realMaintainerRow, realFiveRow],
      absent: false,
    })
  })

  it("allows ten on the next UTC day and refuses it on the same day", () => {
    const { stages, absent } = parseSendLog<typeof realFiveRow>(
      JSON.stringify({ stages: [realMaintainerRow, realFiveRow] })
    )
    const previous = stages.at(-1) ?? null
    expect(refuseUnloggedStage("ten", absent, previous)).toBeNull()
    expect(
      refuseNextStage(previous, new Date("2026-10-23T03:00:00.000Z"))
    ).toBeNull()
    expect(
      refuseNextStage(previous, new Date("2026-10-22T23:00:00.000Z"))
    ).toBe("the next stage waits until the next UTC day")
  })
})

describe("a stage interrupted after its send", () => {
  const log = JSON.stringify({
    stages: [realMaintainerRow, realFiveRow, pendingTenRow],
  })

  it("parses a pending last row, so the log stays readable", () => {
    expect(parseSendLog(log).stages.at(-1)).toEqual(pendingTenRow)
  })

  it("records no counts on the pending row", () => {
    expect(isPendingStageRow(pendingTenRow)).toBe(true)
    expect(isPendingStageRow(realFiveRow)).toBe(false)
    expect("hardBounces" in pendingTenRow).toBe(false)
  })

  it("refuses a pending row that is not the last row", () => {
    expect(() =>
      parseSendLog(
        JSON.stringify({ stages: [realMaintainerRow, pendingTenRow, realFiveRow] })
      )
    ).toThrow(/pending/)
  })

  it("refuses a pending row with no broadcast id", () => {
    const noBroadcast: Partial<typeof pendingTenRow> = { ...pendingTenRow }
    delete noBroadcast.broadcastId
    expect(() =>
      parseSendLog(JSON.stringify({ stages: [realMaintainerRow, noBroadcast] }))
    ).toThrow(/incomplete|pending/)
  })

  it("refuses the next stage and names the collect command", () => {
    const { stages, absent } = parseSendLog<typeof pendingTenRow>(log)
    const previous = stages.at(-1) ?? null
    expect(refuseUnloggedStage("remainder", absent, previous)).toMatch(
      /--stage ten --collect/
    )
    expect(
      refuseNextStage(previous, new Date("2026-10-25T03:00:00.000Z"))
    ).toMatch(/--stage ten --collect/)
  })

  it("refuses a second send of the pending stage", () => {
    const { stages } = parseSendLog<{ name: string }>(log)
    expect(refuseRepeatStage(stages, "ten")).toBe("this stage was already sent")
  })
})

describe("a malformed pending row", () => {
  it("refuses a pending row with no recipients", () => {
    expect(() =>
      parseSendLog(
        JSON.stringify({
          stages: [realMaintainerRow, { ...pendingTenRow, recipients: [] }],
        })
      )
    ).toThrow(/incomplete|pending/)
  })

  it("refuses a row marked pending that also carries counts but no ids", () => {
    const rogue = {
      name: "ten",
      sentAt: "2026-10-23T03:00:00.000Z",
      hardBounces: 0,
      complaints: 0,
      hardBouncesRemoved: true,
      pending: true,
    }
    expect(() =>
      parseSendLog(JSON.stringify({ stages: [realMaintainerRow, rogue] }))
    ).toThrow(/incomplete|pending/)
    expect(() =>
      parseSendLog(
        JSON.stringify({ stages: [realMaintainerRow, rogue, realFiveRow] })
      )
    ).toThrow(/incomplete|pending/)
  })

  it("refuses a pending value that is not the boolean true", () => {
    expect(() =>
      parseSendLog(
        JSON.stringify({
          stages: [realMaintainerRow, { ...pendingTenRow, pending: "true" }],
        })
      )
    ).toThrow(/incomplete|pending/)
  })

  it("refuses two pending rows", () => {
    expect(() =>
      parseSendLog(
        JSON.stringify({
          stages: [realMaintainerRow, pendingTenRow, pendingTenRow],
        })
      )
    ).toThrow(/pending/)
  })

  it("blocks the maintainer stage and a maintainer collect on its own pending row", () => {
    const pendingMaintainer = {
      ...pendingTenRow,
      name: "maintainer",
      recipients: ["maintainer@example.test"],
    }
    expect(refuseUnloggedStage("maintainer", false, pendingMaintainer)).toMatch(
      /--stage maintainer --collect/
    )
    expect(refuseCollect([pendingMaintainer], "maintainer")).toBeNull()
  })
})

describe("refuseStageOrder", () => {
  const planned = ["maintainer", "five", "ten", "remainder", "yahoo"]

  it("allows only the next planned stage", () => {
    const logged = [realMaintainerRow, realFiveRow]
    expect(refuseStageOrder(logged, planned, "ten")).toBeNull()
    expect(refuseStageOrder(logged, planned, "yahoo")).toBe(
      "the next stage is ten, not yahoo"
    )
    expect(refuseStageOrder(logged, planned, "five")).toBe(
      "the next stage is ten, not five"
    )
  })

  it("starts with the maintainer stage", () => {
    expect(refuseStageOrder([], planned, "maintainer")).toBeNull()
    expect(refuseStageOrder([], planned, "five")).toMatch(/maintainer/)
  })

  it("refuses every stage after the last planned one", () => {
    expect(refuseStageOrder(planned, planned, "yahoo")).toMatch(/every planned/)
  })
})

describe("stageOutcomeFromEvents", () => {
  it("counts bounces and complaints from the latest events", () => {
    expect(
      stageOutcomeFromEvents(["delivered", "bounced", "complained", "delivered"])
    ).toEqual({
      hardBounces: 1,
      complaints: 1,
      events: { delivered: 2, bounced: 1, complained: 1 },
      lastEvent: "mixed",
    })
  })

  it("names the single event when every copy shares it", () => {
    expect(stageOutcomeFromEvents(["delivered", "delivered"]).lastEvent).toBe(
      "delivered"
    )
  })

  it("refuses a stage with no copies", () => {
    expect(() => stageOutcomeFromEvents([])).toThrow(/no copies/)
  })
})

describe("counts read again from Resend", () => {
  it("never lowers a stored complaint or bounce", () => {
    expect(
      mergeRefreshedOutcome(
        { hardBounces: 1, complaints: 1 },
        { hardBounces: 0, complaints: 0 }
      )
    ).toEqual({ hardBounces: 1, complaints: 1 })
  })

  it("raises the counts when a late complaint or bounce arrives", () => {
    expect(
      mergeRefreshedOutcome(
        { hardBounces: 0, complaints: 0 },
        { hardBounces: 2, complaints: 1 }
      )
    ).toEqual({ hardBounces: 2, complaints: 1 })
  })

  it("stops the sequence on a complaint on an earlier stage", () => {
    const complainedFive = { ...realFiveRow, complaints: 1 }
    const cleanTen = { ...realFiveRow, name: "ten" }
    expect(
      refuseAnyComplaint([realMaintainerRow, complainedFive, cleanTen])
    ).toBe("a complaint on the five stage stops the sequence")
    expect(refuseAnyComplaint([realMaintainerRow, realFiveRow])).toBeNull()
  })

  it("treats counts older than the retention window as expired", () => {
    const sentAt = "2026-10-01T00:00:00.000Z"
    expect(countsExpired(sentAt, new Date("2026-10-30T00:00:00.000Z"))).toBe(
      false
    )
    expect(countsExpired(sentAt, new Date("2026-11-01T00:00:01.000Z"))).toBe(
      true
    )
  })
})

describe("decideUnsentPending", () => {
  const settled = 11 * 60 * 1000

  it("drops a settled draft that has no sent copy", () => {
    expect(decideUnsentPending("draft", 0, settled)).toEqual({ action: "drop" })
  })

  it("refuses to drop a draft younger than 10 minutes", () => {
    expect(decideUnsentPending("draft", 0, 60 * 1000)).toMatchObject({
      action: "refuse",
    })
  })

  it("collects a draft that already has a sent copy", () => {
    expect(decideUnsentPending("draft", 1, 0)).toEqual({ action: "collect" })
  })

  it("collects a broadcast that is queued, sending or sent", () => {
    for (const status of ["queued", "sending", "sent"]) {
      expect(decideUnsentPending(status, 0, 0)).toEqual({ action: "collect" })
    }
  })

  it("refuses any other status", () => {
    expect(decideUnsentPending("failed", 0, settled)).toEqual({
      action: "refuse",
      reason: "the broadcast status is failed, so a person must check it in Resend",
    })
  })
})

describe("recorded sends", () => {
  it("refuses a second five send when the log has no five broadcast", () => {
    expect(refuseRecordedSend([realMaintainerRow], "five")).toMatch(
      /e6b9c9f5-f238-41d4-9ee6-eccec98e797b/
    )
  })

  it("refuses ten when the log has no five broadcast", () => {
    expect(refuseAbsentRecordedHistory([realMaintainerRow], "ten")).toMatch(
      /e6b9c9f5-f238-41d4-9ee6-eccec98e797b/
    )
  })

  it("allows ten when both recorded broadcasts are in the log", () => {
    const stages = [realMaintainerRow, realFiveRow]
    expect(refuseRecordedSend(stages, "ten")).toBeNull()
    expect(refuseAbsentRecordedHistory(stages, "ten")).toBeNull()
  })

  it("drops the maintainer copy from a later stage's tally", () => {
    const copies = [
      { to: ["one@example.test"], last_event: "delivered" },
      { to: ["mrpmohiburrahman@gmail.com"], last_event: "delivered" },
    ]
    expect(
      copiesForStage("five", copies, "mrpmohiburrahman@gmail.com")
    ).toEqual([copies[0]])
    expect(
      copiesForStage("maintainer", copies, "mrpmohiburrahman@gmail.com")
    ).toEqual(copies)
  })

  it("does not count a missing contact as a removed bounce", () => {
    expect(
      bounceIsRemoved({
        contactFound: false,
        deleted: false,
        confirmedAbsent: false,
      })
    ).toBe(false)
    expect(
      bounceIsRemoved({
        contactFound: false,
        deleted: false,
        confirmedAbsent: true,
      })
    ).toBe(true)
    expect(
      bounceIsRemoved({
        contactFound: true,
        deleted: true,
        confirmedAbsent: false,
      })
    ).toBe(true)
  })

  it("names the recipients that have no copy", () => {
    expect(
      missingRecipients(
        ["one@example.test", "two@example.test"],
        ["one@example.test"]
      )
    ).toEqual(["two@example.test"])
  })

  it("names a complaint on an incomplete row", () => {
    expect(() =>
      parseSendLog(
        JSON.stringify({
          stages: [
            realMaintainerRow,
            {
              name: "five",
              sentAt: "2026-10-22T02:53:58.525Z",
              complaints: 1,
              lastEvent: null,
            },
          ],
        })
      )
    ).toThrow("a complaint stops the sequence")
  })

  it("refuses the next stage while missing copies are not accepted", () => {
    expect(
      refuseNextStage(
        {
          ...realFiveRow,
          missing: 1,
          missingAcknowledged: false,
        },
        new Date("2026-10-25T03:00:00.000Z")
      )
    ).toMatch(/--accept-missing/)
  })
})

describe("refuseCollect", () => {
  it("allows a collect for the pending last stage", () => {
    expect(refuseCollect([realFiveRow, pendingTenRow], "ten")).toBeNull()
  })

  it("refuses a collect when the last stage is complete", () => {
    expect(refuseCollect([realMaintainerRow, realFiveRow], "five")).toMatch(
      /not pending/
    )
  })

  it("refuses a collect for a stage that is not the pending one", () => {
    expect(refuseCollect([realFiveRow, pendingTenRow], "remainder")).toMatch(
      /ten/
    )
  })

  it("refuses a collect when the log has no stages", () => {
    expect(refuseCollect([], "ten")).toMatch(/not pending/)
  })
})

describe("the complaint stop", () => {
  it("names the complaint even when the row has no bounce count", () => {
    expect(
      refuseNextStage(
        {
          sentAt: "2026-10-20T12:00:00.000Z",
          complaints: 1,
        } as unknown as Parameters<typeof refuseNextStage>[0],
        new Date("2026-10-21T12:00:00.000Z")
      )
    ).toBe("a complaint stops the sequence")
  })
})

describe("refuseUnloggedStage", () => {
  const completePrevious = {
    name: "five",
    sentAt: "2026-10-20T12:00:00.000Z",
    hardBounces: 0,
    complaints: 0,
    hardBouncesRemoved: true,
  }

  it("lets the maintainer stage bootstrap an absent log", () => {
    expect(refuseUnloggedStage("maintainer", true)).toBeNull()
  })

  it("refuses a survivor stage when no log exists to gate on", () => {
    expect(refuseUnloggedStage("five", true)).toMatch(/no history/)
  })

  it("refuses every non-maintainer stage when the previous stage row is missing", () => {
    for (const stage of ["five", "ten", "remainder", "yahoo"] as const) {
      expect(refuseUnloggedStage(stage, false, null)).toMatch(/no history|incomplete/)
    }
  })

  it("refuses every non-maintainer stage when the previous stage row is incomplete", () => {
    for (const stage of ["five", "ten", "remainder", "yahoo"] as const) {
      expect(
        refuseUnloggedStage(stage, false, {
          name: "maintainer",
          sentAt: "2026-10-20T12:00:00.000Z",
        })
      ).toMatch(/incomplete|bounce|complaint/)
    }
  })

  it("allows a survivor stage when the log exists and the previous stage row is complete", () => {
    expect(refuseUnloggedStage("ten", false, completePrevious)).toBeNull()
  })
})
