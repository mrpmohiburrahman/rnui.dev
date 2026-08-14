# Put Studio Dark on preview.rnui.dev

Status: ready-for-agent
Type: task
Blocked by: 02

## Question

Serve the Studio Dark build at `preview.rnui.dev`, alongside the live site rather than instead of
it. This is what lets deploy A collect undisturbed for six weeks without hiding the redesign from
anyone who wants to see it — the two goals stopped competing the moment the Preview got its own
address.

Two things must be right or it does damage:

**Its PostHog events go to a separate project.** Decision 3. If the Preview reports into the main
project, deploy A's baseline becomes a blend of old-site and Studio Dark visitors, and the entire
reason for splitting into two deploys is gone. The `api_host` constraint still holds —
`https://us.i.posthog.com`, per `studio-dark/spec.md`; a first-party proxy previously got rnui.dev
categorised as Malware.

**It must not be indexed.** 277 Recordings served on two hostnames is duplicate content, and
Google may well rank the Preview against the real site. Cheap to prevent, tedious to undo.

The Preview is retired at deploy B, not merged — Studio Dark reaches `rnui.dev` through the normal
deploy, and `preview.rnui.dev` 301s to the root afterwards.

## Acceptance

- `preview.rnui.dev` serving the Studio Dark build.
- A **separate PostHog project**, its key in the Preview's environment only. Verified by confirming
  no Preview event appears in the main project.
- `X-Robots-Tag: noindex` (or equivalent) on every Preview response, and verified on a live URL.
- `api_host` unchanged.
- The deploy-B retirement plan — 301 to root — written down here, so it is not rediscovered later.
