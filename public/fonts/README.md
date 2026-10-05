// public/fonts/README.md
//
// Four static TTFs, and the only font files in the repo.
//
// **Why they are here at all.** An Open Graph card is rasterised by Satori, inside
// `@vercel/og`, and Satori draws text only from fonts it is handed as bytes. It cannot use
// `next/font/google` — that returns no bytes, only a class name a browser resolves — and it
// cannot use a variable font, because the Satori compiled into Next 16.1.1 (`@vercel/og`
// 0.7.2) hard-throws on one and cannot be pinned independently of Next. Both were measured,
// not read off a list; see `.scratch/social-cards/probe/`.
//
// So a card needs real font files on disk. `next/font/local` is not an option for the same
// reason `next/font/google` is not.
//
// **Which four, and why only four.** The Contributor card sets exactly four faces:
//
//   SpaceGrotesk-500   the Contributor's name
//   SpaceGrotesk-400   the alias under it, when the name carries one
//   SpaceGrotesk-700   the `rnui.dev` wordmark and the count's numeral
//   JetBrainsMono-400   the count's label — the Design's mono, from `components/hero.tsx`
//
// **No 300.** The web uses it; no card does, so it is not here. If a card later needs a
// lighter weight it should be measured first — adding a face is cheap, and adding four
// because three were assumed is not.
//
// **Licensing.** Space Grotesk and JetBrains Mono are both SIL Open Font License 1.1, which
// permits redistribution. Fetch them from their own repositories rather than from a CDN that
// might change:
//
//   https://github.com/floriankarsten/space-grotesk
//   https://github.com/JetBrains/JetBrainsMono
//
// These copies are static instances, not the variable originals.
