// The www host, not the apex: rnui.dev answers with a 307 to www.rnui.dev, so the
// apex made every canonical and every og: URL a redirect. It also has to agree with
// next-sitemap.config.js — a sitemap and a canonical naming different hosts is worse
// than either being slightly off.
export const defaultUrl = process.env.VERCEL_URL
  ? "https://www.rnui.dev/"
  : "http://localhost:3000"
