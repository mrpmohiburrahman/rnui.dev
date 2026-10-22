// lib/site-origin.ts
//
// The production origin, hard coded on purpose, for every message this repo sends.
//
// **Not `defaultUrl` from data/default-url.ts**, even though that constant exists and
// names the same host. It resolves to `http://localhost:3000` whenever `VERCEL_URL` is
// unset, and these builders run from a local shell, so importing it would put localhost
// links in a stranger's inbox the first time somebody sent outside a Vercel build.
//
// `www` rather than the apex because the apex is a redirect: `https://rnui.dev/recording/x`
// answers 307 to `https://www.rnui.dev/recording/x`, measured 2026-09-25. That also agrees
// with data/default-url.ts, whose own comment records the apex making every canonical and
// every `og:` URL a redirect.
//
// Lifted out of lib/publication-notice.ts when the Digest became the second message that
// needs it: two copies of a hostname drift exactly as readily as two copies of a postal
// address, which is the argument lib/sender-identity.ts already makes one level up.

export const SITE_ORIGIN = "https://www.rnui.dev"
