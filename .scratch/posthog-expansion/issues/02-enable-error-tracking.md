# 02 — Turn on error tracking

Status: ready-for-agent

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
