import { describe, expect, it } from "vitest"

import { BYLINE, findNote, noteAfter, type Note } from "@/data/notes"

function note(id: string): Note {
  return {
    id,
    topic: "Stack",
    date: "1 Jan 2026",
    read: "1 min",
    title: id,
    dek: id,
    pull: id,
    sections: [{ heading: id, paragraphs: [id] }],
  }
}

const notes = [note("first"), note("second"), note("third")]

describe("the Blog's Note helpers", () => {
  it("finds a Note by its id and refuses an unknown id", () => {
    expect(findNote(notes, "second")).toBe(notes[1])
    expect(findNote(notes, "not-a-note")).toBeUndefined()
  })

  it("moves to the next Note and wraps after the last", () => {
    expect(noteAfter(notes, "first")?.id).toBe("second")
    expect(noteAfter(notes, "second")?.id).toBe("third")
    expect(noteAfter(notes, "third")?.id).toBe("first")
    expect(noteAfter(notes, "not-a-note")).toBeUndefined()
  })

  it("names the maintainer in the byline", () => {
    expect(BYLINE).toBe("MD. Mohibur Rahman · rnui.dev maintainer")
  })
})
