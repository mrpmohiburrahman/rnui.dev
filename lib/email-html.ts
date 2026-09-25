// lib/email-html.ts
//
// The two things every outbound message in this repo must do to a value before it
// goes into a body or a header. Extracted when the second message arrived
// (submission-receipt ticket 07) rather than copied: escaping that exists twice is
// escaping that can be fixed once, and the copy that was not fixed is the one that
// ships.

/**
 * Escape everything a stranger wrote.
 *
 * Every interpolated value in these messages is a visitor's text, a name, a caption,
 * a handle, a source URL, and this is HTML rendered in somebody's mail client.
 * Without escaping, a caption of
 * `<a href="https://evil.example">Open the Dashboard</a>` arrives as a link wearing
 * rnui.dev's sender reputation. Mail clients block script; they do not block a forged
 * link, which is the half that matters.
 *
 * `&` is replaced first, so an already-escaped entity is not escaped twice.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Flatten to one line, for a Subject only.
 *
 * A newline in a header is broken formatting at best and header injection at worst.
 * The validator trims a field's ends but does not forbid a newline in the middle, so
 * an interpolated subject is flattened rather than trusted.
 */
export function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}
