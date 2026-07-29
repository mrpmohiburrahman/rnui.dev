import { describe, expect, it } from "vitest"

import {
  parseRememberedIds,
  serialiseRememberedIds,
} from "../hooks/use-remembered-set"

// The branchy half of the stored-set hook, lifted out so it can be tested at all.
// The hook itself needs a browser; this pair does not, so it stays in the node
// test environment rather than pulling in a DOM one for two functions.
describe("parseRememberedIds", () => {
  it("returns the stored ids when the stored value is an array", () => {
    expect(parseRememberedIds('["a","b"]')).toEqual({
      ids: ["a", "b"],
      problem: null,
    })
  })

  it("treats absent state as an empty set, and not as a problem", () => {
    // A first-time visitor. Nothing was lost, so nothing is reported.
    expect(parseRememberedIds(null)).toEqual({ ids: [], problem: null })
  })

  it("reports state that parses but is not an array", () => {
    // Whatever this visitor had is gone. That is the one case worth reporting:
    // it is the only signal that somebody's bookmarks were silently reset.
    expect(parseRememberedIds('{"a":1}')).toEqual({
      ids: [],
      problem: "not-an-array",
    })
    expect(parseRememberedIds('"a"')).toEqual({
      ids: [],
      problem: "not-an-array",
    })
    expect(parseRememberedIds("42")).toEqual({ ids: [], problem: "not-an-array" })
  })

  it("reports state that does not parse", () => {
    expect(parseRememberedIds("{not json")).toEqual({
      ids: [],
      problem: "unreadable",
    })
  })

  it("treats an empty string as unreadable rather than as absent", () => {
    // localStorage.getItem returns null for a missing key, so an empty string is
    // a key someone wrote badly, not a key nobody has written.
    expect(parseRememberedIds("")).toEqual({ ids: [], problem: "unreadable" })
  })
})

describe("serialiseRememberedIds", () => {
  it("round-trips through parseRememberedIds", () => {
    const ids = ["01ARZ3NDEKTSV4RRFFQ69G5FAV", "01BX5ZZKBKACTAV9WEVGEMMVRZ"]
    expect(parseRememberedIds(serialiseRememberedIds(ids))).toEqual({
      ids,
      problem: null,
    })
  })

  it("round-trips an empty set", () => {
    expect(parseRememberedIds(serialiseRememberedIds([]))).toEqual({
      ids: [],
      problem: null,
    })
  })

  it("writes the shape the previous build wrote", () => {
    // Visitors already hold state written by the old hooks. If this ever stops
    // being a plain JSON array of strings, everything they saved is unreadable.
    expect(serialiseRememberedIds(["a", "b"])).toBe('["a","b"]')
  })
})
