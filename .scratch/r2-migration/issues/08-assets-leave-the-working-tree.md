# 08 — Assets leave the working tree

**What to build:** A fresh clone contains no media, and the site still works. A contributor clones, installs, runs the dev server and sees a complete site without obtaining 77 MB of Assets. Vercel receives no media on deploy.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Staging copies stay at their current locations and are added to gitignore, then removed from the index. Locations are unchanged deliberately: all 558 catalogue Asset paths stay valid, the Asset check keeps working as written, and local development keeps serving media offline.
- [ ] Vercel receives no media, because gitignored files never reach a build. Verified against a real deployment, not assumed.
- [ ] A fresh clone with no Staging copies renders correctly in the dev server.
- [ ] The ImageKit upload script is deleted and ImageKit environment variables are removed from the example env file, local env files, and the Vercel project settings.
- [ ] CI runs the Asset check in production mode. Local mode against a CI checkout would find zero Assets — and, per ticket 03, must now fail rather than report a vacuous green.
- [ ] CI passes on a metadata-only change without CDN write credentials.
- [ ] The contributing guide states that contributors never commit binary Assets, and describes how a maintainer publishes them.
- [ ] The example env file documents the CDN base URL variable.
