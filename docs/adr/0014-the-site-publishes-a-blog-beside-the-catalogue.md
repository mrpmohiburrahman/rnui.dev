# The site publishes a Blog beside the catalogue

rnui.dev was a catalogue and nothing else. `CONTEXT.md` defines a **Recording** and a **Contributor**. The header carries no section links. The site now publishes a **Blog** at `/blog`, and every **Note** in it has a page at `/blog/[slug]`. The header gains **Catalogue** and **Blog** links on every route. The catalogue remains the product. The Blog is a second surface, not a second catalogue.

The decision is five choices that only work together.

**The Blog is a section, not a separate site.** It shares the current Design, the header, the footer, and the analytics project. A subdomain or a second deployment would duplicate the chrome and split the audience. It would also need a second set of environment values. The Blog reads as part of rnui.dev because rnui.dev serves it.

**Each Note owns a URL.** The Blog index keeps the Fold list. A row opens a short preview, and "Read the note" navigates to `/blog/[slug]`. The note page has a back link and the next Note. The index restores the open row through `?open=<slug>` when the visitor returns. A Note that exists only inside an accordion cannot be shared or indexed.

**The header carries two section links on every route.** The site had no section navigation, so a Blog would be unreachable from the catalogue. "Catalogue" is active on `/`, `/products`, `/bookmarks`, `/contributors`, and `/recording/*`. "Blog" is active on `/blog` and `/blog/[slug]`. Neither link is active on the utility and legal routes. The Recording detail keeps its own 62px header and gains both links. The phone header gets a third row under the controls.

**The Blog is a reading surface, not a catalogue view.** The catalogue rail is absent from `/blog`. The header search still finds Recordings, and its placeholder says so. The Blog adds no PostHog event. `$pageview` is the only signal it contributes. `/blog` and every Note are indexable and enter `sitemap.xml` through the existing next-sitemap output.

**The Blog ships before its first Note.** The Note list starts empty. `/blog` still renders the nav, the heading, the maintainer line, and an empty panel that links to the Digest and the catalogue. A Blog that waits for its first post cannot be reviewed, linked, or indexed before that post exists. Every Note address that is not in the list follows the site's 404, which sends the visitor to the catalogue.

## Considered options

- **Publish at `blog.rnui.dev`.** Rejected: a second deployment, a second environment set, and a split analytics project. The chrome and the Design would drift from the catalogue.
- **Keep the Fold inline and give no Note a URL.** Rejected: a Note could not be shared, linked from outside, or indexed alone. A blog without addresses is a feed.
- **Load Notes from MDX files.** Rejected: the Blog has one Maintainer and no Notes yet. A typed module in `data/` matches how Recordings live and needs no new dependency.
- **Add the links only on `/blog`.** Rejected: a section that the catalogue cannot reach is the defect this change exists to fix. The user asked for the navigation bar on the real site.
- **Keep `app/prototype/blog` as the shipped route.** Rejected: that route opts out of the site shell, so it cannot show the header. The defect and the prototype have the same cause.

## Consequences

- `CONTEXT.md` gains **Blog**, **Note**, and **Maintainer**. **Contributor** keeps its catalogue meaning and does not name a Note's author.
- `components/site-shell.tsx` grows a second opt-out for the rail, beside the detail route and the prototype seam.
- The header has three responsive forms. Links sit inline at `lg` and up. A link row shows from `md` to `lg`. Another row sits under the phone controls.
- `data/notes.ts` starts with no Notes. The index renders an empty state until the first Note joins the list.
- `next-sitemap.config.js` needs no `exclude` entry. It lists every built route, so the Blog enters `sitemap.xml`, and each Note enters it when the build creates its page.
- The Blog adds no event name to `lib/analytics.ts`. No dashboard gains a section it cannot attribute.
- This change deletes `app/prototype/blog` and its picker harness. `app/prototype/stack-navigation` stays as the record of the navigation comparison.
- The Recording detail keeps its `OPENED FROM A SHARED LINK` header. Its phone form shows the wordmark, the back link, and the Blog link.
- The byline is "MD. Mohibur Rahman · rnui.dev maintainer" on each Note. The index says "Notes from the maintainer".
