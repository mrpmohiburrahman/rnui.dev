/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // The host the site is actually served from. This used to say rnui.pixellog.io,
  // which does not resolve at all — every URL in the generated sitemap named a host
  // that serves nothing. The apex, rnui.dev, answers with a 307 to this one, so this
  // is where a crawler ends up either way.
  siteUrl: process.env.SITE_URL || "https://www.rnui.dev",
  generateRobotsTxt: true, // (optional)
}
