/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // The host the site is actually served from. This used to say rnui.pixellog.io,
  // which does not resolve at all — every URL in the generated sitemap named a host
  // that serves nothing. The apex, rnui.dev, answers with a 307 to this one, so this
  // is where a crawler ends up either way.
  siteUrl: process.env.SITE_URL || "https://www.rnui.dev",
  generateRobotsTxt: true, // (optional)

  // There is no `exclude` here, and that is a decision rather than an omission.
  //
  // next-sitemap lists every route in the build's manifest unless it is named in
  // `exclude`, so `/submit` is included by default and the question public-submissions
  // ticket 11 had to answer was whether to keep it. It is kept, on purpose:
  //
  //   * It is the front door for Contributors, and the ticket's own premise is that
  //     a form nobody can find collects nothing.
  //   * `/contactus` and `/subscribe` are listed already, so excluding a third form
  //     would be the inconsistency needing justification.
  //   * What bounds abuse is Turnstile and the 5 MB cap, not being unlisted.
  //
  // It arrived by accident: a build swept it into the committed sitemap before anyone
  // had decided. Named here so the next person reads a decision rather than a default.
  //
  // Note that the Preview hosts are noindexed outright by the `x-robots-tag` rule in
  // next.config.ts, so this only reaches crawlers once the work is on rnui.dev.
}
