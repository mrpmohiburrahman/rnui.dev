# 02 — Turn on error tracking

Status: ready-for-human

## Problem

Exception autocapture is off (`autocapture_exceptions_opt_in: null` on project 117415), so
`$exception` has zero events and the error-tracking product is empty. The site currently has
no way to learn that something broke for a visitor.

This is not hypothetical. `components/interactive-video.tsx:23-28` carries a
`FAILURE_REASONS` map distinguishing network failure from decode failure, written after an
incident where 48 demos were encoded in HEVC and silently failed to play in some browsers.
That incident was discovered by hand. Error tracking would have surfaced it the same day.

Error tracking is included in the free tier and the site's volume is nowhere near the limit.

## Work

1. Enable exception autocapture in project settings (`autocapture_exceptions_opt_in`).
2. Add `capture_exceptions: true` to the `posthog.init` options at
   `lib/posthog-provider.tsx:14-25`, alongside the existing options.
3. Upload source maps as part of the build so stack traces resolve to real file and line
   numbers rather than minified chunk offsets. Next.js emits them under `.next/`; PostHog's
   CLI uploads them in a `postbuild` step. Note `package.json` already has a `postbuild`
   script running `next-sitemap` — chain, do not replace.
4. Set `autocapture_exceptions_errors_to_ignore` for known third-party noise once a week of
   data exists. Do not pre-populate it with guesses.
5. Add an alert on `$error_tracking_issue_created` so a new class of error is noticed.

## Acceptance

- A deliberately thrown error in a preview deployment appears in error tracking with a
  resolved stack trace pointing at the real source file.
- The demo failure path still fires its own `demo_load_failed` event (see ticket 03) —
  exception capture supplements it, it does not replace it.

## Notes

Do not enable `capture_console_log` beyond what session replay already does. Console capture
is on for replay (`capture_console_log_opt_in: true`) and that is sufficient.

## Comments

Agent pass 2026-08-01 against project 117415. Steps 1, 2, 3 and 5 are landed; step 4 is
deferred by the ticket's own wording.

**Not `resolved`.** The first acceptance criterion needs credentials on Vercel and a preview
deploy, neither of which an agent can do, and `## Acceptance` is the definition of done. Left
`ready-for-human` — "requires human implementation" per `docs/agents/triage-labels.md` — the
same state tickets 05 and 07 sit in. See "Left for the maintainer" at the bottom.

*Correction, 2026-08-01.* This paragraph used to end "Step 4's follow-up rides on this ticket
staying open." It does not any more — ticket 11 reading 1 took ownership of step 4 (setting
`autocapture_exceptions_errors_to_ignore` once a week of `$exception` data exists), so this
ticket no longer has to stay open on its account. It stays open on its own first acceptance
bullet, which still needs credentials on Vercel and a preview deploy.

### posthog-js had to be upgraded first

Step 2 could not be written as specified. The pinned `posthog-js@1.203.1` has no
`capture_exceptions` option at all — in that version exception autocapture is driven only by
the project's remote config, and adding the option would have been a type error. It also has
zero chunk-id support (`grep -c chunkId` on its bundle returns 0), and chunk ids are how
PostHog matches an uploaded source map to the served file. Step 3 could not have worked on it
either.

Upgraded to `posthog-js@1.409.0`, which has `capture_exceptions?: boolean |
ExceptionAutoCaptureConfig` and `applyChunkIds`/`chunkIdMap` in the exception path. It still
ships the `posthog-js/react` subpath, so the four files importing `usePostHog` /
`PostHogProvider` needed no change; `usePostHog()` now returns a non-nullable `PostHog`, which
leaves the existing `posthog?.capture(...)` call sites valid. Typecheck and all 169 unit tests
pass on it.

`capture_exceptions: true` is set in `posthog.init` rather than left to the project toggle so
capture starts before remote config arrives, and so flipping the PostHog setting cannot
silently switch it off.

### Source maps go through @posthog/nextjs-config, not a postbuild CLI chain

The ticket asked for the CLI in `postbuild`, chained after `next-sitemap`. Took
`@posthog/nextjs-config` instead, which wraps `next.config.ts`. Three reasons:

1. This project builds with **Turbopack** (Next 16 makes it the default and `turbopack: {}` is
   set). The wrapper detects that and sets `productionBrowserSourceMaps` plus a
   `compiler.runAfterProductionCompile` hook. A `postbuild` chain would have needed
   `productionBrowserSourceMaps` set by hand anyway.
2. It strips the dangling `//# sourceMappingURL=` comments after `--delete-after` removes the
   maps. The raw CLI leaves them, so every devtools open would 404 on a map that is not there.
3. `postbuild` runs after `next build` exits, so a failed upload would already have been
   reported as a green build.

`deleteAfterUpload` is left at its default `true`: maps are uploaded, then deleted, never
served.

Verified on a real build (`POSTHOG_API_KEY=<bogus> POSTHOG_PROJECT_ID=117415 pnpm build`):
Turbopack emitted 22 `.js.map` files under `.next/static`, the hook fired, and the CLI found
138 source pairs and injected them before failing on the deliberately invalid key. That last
part is worth knowing: **an upload failure fails the build.** A revoked or expired
`POSTHOG_API_KEY` will block a deploy rather than quietly shipping minified traces. Left as
the vendor default — a blocked deploy is loud and fixable, silently minified stack traces are
exactly what this ticket exists to prevent.

### The build still works without credentials

`@posthog/nextjs-config` throws from `resolveConfig` the moment `next.config.ts` is evaluated
if the upload is enabled with no `personalApiKey`/`projectId` — and `next dev` evaluates that
file too. Unguarded, this repository would have stopped building for every contributor and
every fork. `sourcemaps.enabled` is therefore `Boolean(personalApiKey && projectId)`, and
`tests/next-config.test.ts` pins both branches plus the `/feedback` redirect surviving the
wrapper's teardown-and-rebuild of the config.

`@posthog/cli` arrives as a transitive dependency, and its postinstall fetches the Rust
binary, so it needed `'@posthog/cli': true` under `allowBuilds` in `pnpm-workspace.yaml` —
pnpm 10 blocks build scripts by default. Vercel pins pnpm 9, which does not block them.

### Project configuration

| Setting | Before | After |
|---|---|---|
| `autocapture_exceptions_opt_in` | `null` | `true` |
| `autocapture_exceptions_errors_to_ignore` | `null` | `null` — unchanged, see below |

### Step 4 is deferred, as the ticket asks

`autocapture_exceptions_errors_to_ignore` stays `null`. The ticket says to set it "once a week
of data exists" and not to pre-populate it with guesses; zero `$exception` events exist today,
so there is nothing to ignore yet. Revisit a week after this deploys.

### Step 5: the alert is email, not Slack

`error-tracking-alerts-create` builds a HogFunction that needs an integration —
`template-slack`, `template-webhook`, `template-discord` and so on. `integrations-list` returns
**zero** integrations on this project, and wiring one needs an OAuth grant or a webhook URL
that only the maintainer can supply.

Used the insight-threshold alert instead, which delivers by email to the project's own users
and needs no integration:

| | |
|---|---|
| Insight | 10645422 `lQ52Apa4` "New error tracking issues" |
| Alert | `019fbadd-d256-0000-d416-40256b77aec8` "A new class of error appeared" |
| Trigger | `$error_tracking_issue_created`, absolute value, upper bound 0 — fires on the first one |
| Cadence | `daily` |
| Recipient | mrpmohiburrahman@gmail.com |

`daily` rather than hourly on purpose: turning autocapture on for the first time can surface a
burst of new issue classes, and one email a day bounds that. `real_time` and
`every_15_minutes` are paid tiers anyway.

The insight has `filterTestAccounts: false`, against the usual rule. `$error_tracking_issue_created`
is generated by PostHog server-side and carries no `$host` and no `$virt_is_bot`, so the three
project filters cannot classify it — applying them can only produce a false negative on an
alert whose whole job is to fire.

### Left for the maintainer

The first acceptance criterion — a thrown error in a preview deployment resolving to a real
source file — cannot be checked from here. It needs:

1. ~~`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` added to the Vercel project's environment.~~
   **Done 2026-08-05.** Both are on `mrpmohiburrahmans-projects/rnui-dev` (`prj_oJwJTNITIGO5i4MqVVGqjLaPIOfc`),
   type Sensitive, **Production only**. The key is the personal API key labelled
   `vercel-sourcemaps-rnui-dev`, org-and-project-scoped to *rnui.dev dashboard* alone, with the
   single scope `error tracking: write` — no other scope, no other project.
2. A deliberate throw, then Error tracking → the issue → confirm the frame points at a `.tsx`
   path and not a chunk offset. **This can no longer be done on a preview URL, and that is
   deliberate.** Production-only scoping keeps the two variables matched in every environment,
   so a preview build takes the disabled branch at `next.config.ts:63` and never trips the
   half-configured warning at `next.config.ts:54`. Scoping only one of them to Preview would
   print that warning on every preview build forever. So either verify on production after
   deploy A, or first run `vercel env add POSTHOG_API_KEY preview` *and*
   `vercel env add POSTHOG_PROJECT_ID preview` together — the key's value is shown once at
   creation and was deliberately not retained anywhere, so that path needs a new key.

   Note the type is Sensitive: the value cannot be read back by CLI or API, so this cannot be
   reproduced in a local build either. The first real proof is the next production build.

The second criterion holds by inspection: `demo_load_failed` is untouched at
`components/interactive-video.tsx:79` and `components/demo-tile.tsx:92`. A `<video>` that
refuses to decode fires an error *event*, not an exception, so autocapture never sees it —
the two signals do not overlap and neither replaces the other.
