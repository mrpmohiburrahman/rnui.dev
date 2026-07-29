/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // The host the site is actually served from. This used to say rnui.pixellog.io,
  // which does not resolve at all — every URL in the generated sitemap named a host
  // that serves nothing. The apex, rnui.dev, answers with a 307 to this one, so this
  // is where a crawler ends up either way.
  siteUrl: process.env.SITE_URL || "https://www.rnui.dev",
  generateRobotsTxt: true, // (optional)
  // /search is an orphan: nothing in the tree links to it, and the API it posts to
  // answers 503 in production, so every search on it fails. Listing it aimed
  // crawlers at a page that cannot do the one thing it exists for.
  exclude: ["/search"],
}
