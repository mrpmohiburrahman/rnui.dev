// lib/contributor-initials.ts
//
// The Contributor block avatar's initials, Detail.dc.html:52. The uppercased
// first character of the first two whitespace-separated words that begin with a
// letter, so `Thomino` gives `T`, `Daehyeon Mun (文…)` gives `DM`, and
// `Epicode | 0xV` gives `E` rather than `E|`.
//
// A pure function in its own module so both the Recording detail (a client
// component, which draws the block for every Recording) and the About page (a
// server component, which draws the same block for the maintainer) can call it
// — a client component cannot be imported from a server component at all, and
// this function is what made /aboutus a prerender error until it moved out.
export function contributorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("")
}
