// lib/turnstile.ts
//
// Server-side Turnstile validation — the canonical Siteverify call, in the shape
// this repo uses: the decision as ordinary functions a test can import, with the
// network call kept to one place. Same split lib/subscription-consent.ts makes
// against its Firestore store.
//
// Why validation is mandatory rather than a second layer of caution: the widget
// runs in the visitor's browser, and a browser belongs to the visitor. Anyone can
// POST the endpoint without ever completing a challenge. Cloudflare's own words —
// "You must call the Siteverify API to complete your Turnstile implementation.
// The client-side widget alone does not protect your forms."
//
// Four properties of a token, and this file depends on every one:
//
//   * **Single use.** A redeemed token is rejected with `timeout-or-duplicate`,
//     which is the whole of the replay protection. Nothing here retries a token
//     after a failure, because the second attempt could only ever fail.
//   * **300 seconds.** Ticket 07's provisioning note records the consequence: the
//     form compresses a video before submitting, so the widget must be rendered
//     *after* compression. A token minted before a three-minute compression is
//     dead before the visitor can click anything.
//   * **Bound to an action.** Compared below, so a token minted for one surface
//     is not spendable on another.
//   * **Bound to a hostname.** Compared below against an explicit allowlist.
//
// public-submissions tickets 03 and 07, following Cloudflare's canonical Next.js
// reference, `turnstile-spin/references/nextjs-app.md`.

import { SUBMIT_ACTION } from "@/lib/turnstile-shared"

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export type TurnstileVerdict = { ok: true } | { ok: false; reason: string }

/** The subset of Siteverify's response this code reads. */
export type SiteverifyResponse = {
  success?: boolean
  hostname?: string
  action?: string
  "error-codes"?: string[]
}

/**
 * The hostnames a token may legitimately have been minted on.
 *
 * An explicit allowlist, never a wildcard and never a proxy header. `hostname`
 * is Cloudflare's assertion about where the challenge was solved, so accepting
 * whatever the response contains would make this check decorative.
 *
 * Comma-separated rather than a single value so the Preview deploy and
 * `localhost` can sit beside production without a code change — and `localhost`
 * is not a convenience: without it the form cannot be exercised locally at all,
 * because the hostname the widget reports is the one the page was served from.
 *
 * Read per call rather than at import, so a test can set it and so a missing
 * value fails at the request that needed it rather than at module load.
 */
function expectedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean)
  )
}

/**
 * The decision, as a pure function.
 *
 * Separated from the fetch so the interesting part — what counts as a pass — is
 * testable without a network, a token or a secret. Every failure returns a named
 * reason rather than a bare false, because "the submission was refused" is not
 * something a maintainer can act on and `hostname-mismatch` is.
 */
export function interpretSiteverify(
  result: SiteverifyResponse,
  hostnames: Set<string>
): TurnstileVerdict {
  if (result.success !== true) {
    return {
      ok: false,
      reason: (result["error-codes"] ?? []).join(",") || "not-successful",
    }
  }
  if (result.action !== SUBMIT_ACTION) {
    return { ok: false, reason: "action-mismatch" }
  }
  if (!result.hostname || !hostnames.has(result.hostname)) {
    return { ok: false, reason: "hostname-mismatch" }
  }
  return { ok: true }
}

/**
 * Ask Cloudflare whether this token is real, and whether it is ours.
 *
 * Fails closed in every direction, deliberately. The cost of a false refusal is
 * one visitor retrying a form; the cost of a false pass is the entire reason the
 * widget exists. So an unset secret, an empty allowlist, a missing token, an
 * unreachable Siteverify and a non-200 response all refuse.
 *
 * The two `not-configured` refusals are logged rather than silent. An endpoint
 * whose Turnstile is unconfigured refuses every submission, which a visitor reads
 * as "the form is broken" — the operator needs to be told which of the two it is,
 * and the visitor must not be.
 */
export async function verifyTurnstile(
  token: string,
  remoteip?: string
): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  const hostnames = expectedHostnames()

  if (!secret) {
    console.error(
      "turnstile: TURNSTILE_SECRET_KEY is not set — refusing the submission"
    )
    return { ok: false, reason: "not-configured" }
  }
  if (hostnames.size === 0) {
    console.error(
      "turnstile: TURNSTILE_HOSTNAMES is empty — refusing the submission, " +
        "because a token whose hostname is never checked is not a verified token"
    )
    return { ok: false, reason: "not-configured" }
  }
  if (!token) {
    return { ok: false, reason: "missing-token" }
  }

  const body = new URLSearchParams({ secret, response: token })
  // Optional, and named exactly as Siteverify expects. Sent because Cloudflare
  // can weigh it; trusted for nothing, and never used to identify a visitor.
  if (remoteip) body.set("remoteip", remoteip)

  let res: Response
  try {
    res = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
  } catch (err) {
    console.error("turnstile: siteverify request failed", err)
    return { ok: false, reason: "siteverify-unreachable" }
  }

  if (!res.ok) {
    return { ok: false, reason: `siteverify-http-${res.status}` }
  }

  return interpretSiteverify(
    (await res.json()) as SiteverifyResponse,
    hostnames
  )
}
