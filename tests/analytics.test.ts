import type { Recording } from "@/data/recording"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  bookmarkAdded,
  bookmarkRemoved,
  demoLoadFailed,
  demoPlayed,
  demoWatched,
  filterApplied,
  filterCleared,
  loadMoreClicked,
  newsletterSubmitted,
  recordingFacts,
  recordingOpened,
  repoClicked,
  searchPerformed,
  sortChanged,
  voteCast,
} from "@/lib/analytics"

// The double goes in before @/lib/analytics is loaded, because that module takes
// the posthog-js singleton at import time. Nothing below needs a browser, a
// network or an initialised PostHog.
const { capture } = vi.hoisted(() => ({ capture: vi.fn() }))
vi.mock("posthog-js", () => ({ default: { capture } }))

// This suite exists for the third acceptance bullet of ticket 03 — no event
// carries a raw search string, an email, or any visitor-entered text — and for
// the property names, which are the whole reason @/lib/analytics is a module
// rather than thirteen string literals spread over eight components. A renamed
// property is silent in a dashboard: the tile just stops having data.

const RECORDING: Recording = {
  id: "01ABCDEFGHJKMNPQRSTVWXYZ01",
  caption: "Split button",
  demoPath: "demo/buttons/split_button.mp4",
  posterPath: "poster/buttons/split_button.avif",
  contributor: "Hewad Mubariz",
  source: "https://github.com/example/split-button",
  category: "Buttons",
}

/** The single capture this test provoked, as `[name, properties]`. */
const onlyCapture = () => {
  expect(capture).toHaveBeenCalledTimes(1)
  return capture.mock.calls[0] as [string, Record<string, unknown>]
}

beforeEach(() => capture.mockClear())

describe("recordingFacts", () => {
  it("is the one place `id` becomes `recording_id`", () => {
    expect(recordingFacts(RECORDING)).toEqual({
      recording_id: "01ABCDEFGHJKMNPQRSTVWXYZ01",
      caption: "Split button",
      category: "Buttons",
      contributor: "Hewad Mubariz",
    })
  })

  it("carries nothing else off the Recording", () => {
    // Asset paths, source URLs and the counts are not behaviour, and an event
    // that quietly grew a `source` would be describing the catalogue rather than
    // the visit. Four keys, checked as a set rather than by absence, so a fifth
    // one added later has to be added here too.
    expect(Object.keys(recordingFacts(RECORDING)).sort()).toEqual([
      "caption",
      "category",
      "contributor",
      "recording_id",
    ])
  })
})

describe("search_performed", () => {
  it("reports a length and a count, and never the term", () => {
    searchPerformed("star".length, 12)
    const [name, props] = onlyCapture()

    expect(name).toBe("search_performed")
    expect(props).toEqual({ query_length: 4, result_count: 12 })
    // The assertion the acceptance bullet is actually about: whatever the
    // visitor typed cannot be reconstructed from what was sent.
    expect(Object.values(props).every((v) => typeof v === "number")).toBe(true)
  })
})

describe("the funnel's three events", () => {
  // Ticket 09's funnel tile is demo_played → recording_opened → repo_clicked, in
  // that order, and it silently returns zero at any step whose name or property
  // set has drifted. Property names are written out here rather than spread from
  // `facts`, so a rename in @/lib/analytics has to be made twice on purpose.
  const facts = recordingFacts(RECORDING)
  const spelled = {
    recording_id: "01ABCDEFGHJKMNPQRSTVWXYZ01",
    caption: "Split button",
    category: "Buttons",
    contributor: "Hewad Mubariz",
  }

  it("step 1 — demo_played, with the surface and what started it", () => {
    demoPlayed(facts, "grid", "autoplay")
    expect(onlyCapture()).toEqual([
      "demo_played",
      { ...spelled, surface: "grid", trigger: "autoplay" },
    ])
  })

  it("step 2 — recording_opened, with where the open came from", () => {
    recordingOpened(facts, "url")
    expect(onlyCapture()).toEqual([
      "recording_opened",
      { ...spelled, opened_from: "url" },
    ])
  })

  it("step 3 — repo_clicked, which carries no category", () => {
    repoClicked(facts, "detail")
    // The Category is on recording_opened one step earlier; repeating it here would
    // count a Category twice per funnel.
    expect(onlyCapture()).toEqual([
      "repo_clicked",
      {
        recording_id: spelled.recording_id,
        caption: spelled.caption,
        contributor: spelled.contributor,
        surface: "detail",
      },
    ])
  })
})

describe("the two Demo events that are not funnel steps", () => {
  it("demo_watched adds the seconds that actually played", () => {
    demoWatched(recordingFacts(RECORDING), "grid", "autoplay", 2.24)
    expect(onlyCapture()).toEqual([
      "demo_watched",
      {
        recording_id: RECORDING.id,
        caption: RECORDING.caption,
        category: RECORDING.category,
        contributor: RECORDING.contributor,
        surface: "grid",
        trigger: "autoplay",
        seconds: 2.24,
      },
    ])
  })

  it("demo_load_failed names the Asset path, not the Recording", () => {
    // ADR-0003: an Asset path identifies specific bytes. The failure is those
    // bytes being wrong, which is why this one event does not carry the facts —
    // and why "Failed demos" can be a replay playlist filtered on the path.
    demoLoadFailed(
      RECORDING.demoPath,
      "decode",
      `https://cdn.example/${RECORDING.demoPath}`
    )
    expect(onlyCapture()).toEqual([
      "demo_load_failed",
      {
        asset_path: "demo/buttons/split_button.mp4",
        reason: "decode",
        url: "https://cdn.example/demo/buttons/split_button.mp4",
      },
    ])
  })
})

describe("the catalogue controls", () => {
  it("counts the facets in force after a filter is applied", () => {
    filterApplied("contributor", "Hewad Mubariz", 2)
    expect(onlyCapture()).toEqual([
      "filter_applied",
      { facet: "contributor", value: "Hewad Mubariz", active_filter_count: 2 },
    ])
  })

  it("clears without a count, because the count is on the apply", () => {
    filterCleared("category", "Buttons")
    expect(onlyCapture()).toEqual([
      "filter_cleared",
      { facet: "category", value: "Buttons" },
    ])
  })

  it("spells sort the way the query param does", () => {
    // `?sort=top-viewed` and this property have to agree or the dashboard
    // cannot be read against the URL that produced it.
    sortChanged("top-viewed")
    expect(onlyCapture()).toEqual(["sort_changed", { sort: "top-viewed" }])
  })

  it("reports the page arrived at", () => {
    loadMoreClicked(2, 96)
    expect(onlyCapture()).toEqual([
      "load_more_clicked",
      { page: 2, recordings_shown: 96 },
    ])
  })
})

describe("the two-property events", () => {
  it("save and vote carry the id and the caption, and no more", () => {
    const facts = recordingFacts(RECORDING)
    const expected = { recording_id: RECORDING.id, caption: RECORDING.caption }

    for (const [report, name] of [
      [bookmarkAdded, "bookmark_added"],
      [bookmarkRemoved, "bookmark_removed"],
      [voteCast, "vote_cast"],
    ] as const) {
      capture.mockClear()
      report(facts)
      expect(onlyCapture()).toEqual([name, expected])
    }
  })
})

describe("newsletter_submitted (the fourteenth event, ticket 15.1)", () => {
  it("carries the route it fired from and nothing reconstructing an email", () => {
    // Decision 9 put NOTIFY on every route; the event measures the conversion,
    // not the visitor. The form takes an address, but the event carries only the
    // path — a route is a string literal, an address is PII.
    newsletterSubmitted("/products")
    const [name, props] = onlyCapture()

    expect(name).toBe("newsletter_submitted")
    expect(props).toEqual({ route: "/products" })
    // The assertion the acceptance is actually about: whatever fired, it cannot
    // be used to reconstruct the typed email. Exactly one key, and it is `route`.
    expect(Object.keys(props).sort()).toEqual(["route"])
  })
})
