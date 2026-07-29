# 08 — Assets leave the working tree

**What to build:** A fresh clone contains no media, and the site still works. A contributor clones, installs, runs the dev server and sees a complete site without obtaining 77 MB of Assets. Vercel receives no media on deploy.

**Blocked by:** 07

**Status:** resolved

- [x] Staging copies stay at their current locations and are added to gitignore, then removed from the index. Locations are unchanged deliberately: all 558 catalogue Asset paths stay valid, the Asset check keeps working as written, and local development keeps serving media offline.
- [x] Vercel receives no media, because gitignored files never reach a build. Verified against a real deployment, not assumed.
- [x] A fresh clone with no Staging copies renders correctly in the dev server.
- [x] The ImageKit upload script is deleted and ImageKit environment variables are removed from the example env file, local env files, and the Vercel project settings.
- [x] CI runs the Asset check in production mode. Local mode against a CI checkout would find zero Assets — and, per ticket 03, must now fail rather than report a vacuous green.
- [x] CI passes on a metadata-only change without CDN write credentials.
- [x] The contributing guide states that contributors never commit binary Assets, and describes how a maintainer publishes them.
- [x] The example env file documents the CDN base URL variable.

## Outcome

- `public/demo/` and `public/thumbnails/` are gitignored and removed from the index (`git rm -r --cached`): **556 files left the index and all 556 stayed on disk.** Locations unchanged, so all 554 catalogue Asset paths still resolve and local development still serves media offline. (556 rather than 554 because of the 2 orphans; the 5 `.DS_Store` files under those directories were never tracked.)
- Only the app shell remains tracked under `public/`: favicons, logo, robots, sitemaps, manifest.
- ImageKit upload script deleted; env vars removed from `.env`, `.env.local` and `.env.example`; the `imagekit` npm dependency dropped and the lockfile updated.
- CI gains an `assets` job running `pnpm check:videos:production`. Public reads only — no credentials, so it passes on a fork's PR.
- `CONTRIBUTING.md` states that contributors never commit binary Assets and how a maintainer publishes them. `.env.example` documents `NEXT_PUBLIC_CDN_URL`.
- `docs/r2-setup.md` records the configuration.

Verified by moving both Staging directories out of the tree entirely and
rerunning: the production build succeeded, all 3 e2e tests passed including real
playback from the CDN, the production Asset check passed over all 554, and local
mode correctly refused to report a green over an empty tree.

### Verified against the real deployment

Vercel project `rnui-dev` was updated through the dashboard: `NEXT_PUBLIC_CDN_URL`
= `https://cdn.rnui.dev` added for All Environments and not marked Sensitive (it
is a public URL inlined into the client bundle), and
`NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` deleted. It was the only ImageKit variable
the project had — the other three only ever existed locally.

Then main was pushed and Vercel built and promoted it. On the live site:

- `https://www.rnui.dev/demo/…​.mp4` and `…/thumbnails/….avif` both return **404**.
  Vercel is serving no media at all. `logo.png`, `favicon-32x32.png` and
  `robots.txt` still return 200, so the app shell is untouched.
- A home page load issues **278 media requests, every one to `cdn.rnui.dev`** —
  zero to ImageKit, zero root-relative. `preconnect` and `dns-prefetch` both
  resolve to the CDN.
- Clicking a card on production plays: `currentTime` reached 0.019s of a 4.36s
  Demo streamed from the CDN.

CI on the same commit: `quality`, `assets` and `e2e` all green. The `assets` job
runs the production check with no credentials, which is what makes it pass on a
fork's PR.
