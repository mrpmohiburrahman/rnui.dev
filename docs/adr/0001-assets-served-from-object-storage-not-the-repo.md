# Assets are served from object storage, not from the repo

The 558 Assets (278 Demos, 73 MB; 280 Posters, 4.4 MB) were committed to the repo and served by Vercel, with ImageKit as an optional front. We are moving them to Cloudflare R2 behind `cdn.rnui.dev` and removing them from the repo entirely, because bandwidth on both the Vercel and ImageKit free tiers is metered while R2 egress is not, and because the repo should not keep growing by a video per Entry.

## Consequences

- Staging copies stay at `public/demo` and `public/thumbnails`, **gitignored** rather than moved. This keeps the 558 Asset paths in `data/*.ts` unchanged, keeps `pnpm check:videos` working as written, and keeps local dev serving media offline — while guaranteeing Vercel never receives a byte of media, since gitignored files never reach the build.
- Vercel is no longer a fallback origin: in production the Assets simply are not there. See ADR-0003.
- A fresh clone has no Staging copies. Local dev reads from `cdn.rnui.dev` like production does; only re-recording or re-uploading needs the local files.
- ImageKit is dropped rather than kept alongside. It stores its own uploaded duplicate rather than proxying the origin, and silently transcoded most uploads — which is how 48 Demos shipped as undecodable HEVC. R2 serves exactly the bytes uploaded.
