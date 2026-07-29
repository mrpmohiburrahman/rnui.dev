# 08 — Assets leave the working tree

**What to build:** A fresh clone contains no media, and the site still works. A contributor clones, installs, runs the dev server and sees a complete site without obtaining 77 MB of Assets. Vercel receives no media on deploy.

**Blocked by:** 07

**Status:** resolved, except two boxes that need the Vercel dashboard and a push

- [x] Staging copies stay at their current locations and are added to gitignore, then removed from the index. Locations are unchanged deliberately: all 558 catalogue Asset paths stay valid, the Asset check keeps working as written, and local development keeps serving media offline.
- [ ] Vercel receives no media, because gitignored files never reach a build. Verified against a real deployment, not assumed. — **needs a deploy; no Vercel CLI or project link in this checkout**
- [x] A fresh clone with no Staging copies renders correctly in the dev server.
- [ ] The ImageKit upload script is deleted and ImageKit environment variables are removed from the example env file, local env files, and the Vercel project settings. — script and all three env files done; **the Vercel dashboard is a maintainer action**
- [x] CI runs the Asset check in production mode. Local mode against a CI checkout would find zero Assets — and, per ticket 03, must now fail rather than report a vacuous green.
- [ ] CI passes on a metadata-only change without CDN write credentials. — the job needs no credentials by construction, but **has not been observed running**; nothing is pushed yet.
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

**Not verified here:** that a real Vercel deployment receives no media. No Vercel
CLI or project link exists in this checkout, so the deploy and the dashboard env
var changes are maintainer actions. The mechanism — gitignored files never reach
a build — is sound, but the ticket asked for a real deployment and that has not
happened yet.
