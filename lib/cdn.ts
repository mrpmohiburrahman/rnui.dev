// lib/cdn.ts
//
// Asset path in, Published Asset URL out. That is the whole module.
//
// It replaced an ImageKit helper that also offered thumbnail transforms, a LQIP
// builder and an untransformed base URL. Those are gone rather than ported: R2
// is a dumb store that hands back exactly the bytes uploaded, so there is no
// transformation to express, and nothing ever called them.
//
// See docs/adr/0001-assets-served-from-object-storage-not-the-repo.md.

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || ""

if (!CDN_URL) {
  console.warn("NEXT_PUBLIC_CDN_URL is not defined in .env")
}

/**
 * The origin to warm up with a resource hint, or "" when none can be derived.
 *
 * Never throws: this is evaluated at module scope, so a malformed
 * NEXT_PUBLIC_CDN_URL would otherwise take down every page rather than cost a
 * resource hint.
 */
export const CDN_ORIGIN = (() => {
  try {
    return CDN_URL ? new URL(CDN_URL).origin : ""
  } catch {
    console.warn(`NEXT_PUBLIC_CDN_URL is not a valid URL: ${CDN_URL}`)
    return ""
  }
})()

/**
 * Resolve an Asset path to the URL users fetch it from.
 * @param path - Asset path. A leading slash is tolerated; the catalogue no
 *   longer contains one, but the helper this replaced accepted both and
 *   callers outside the catalogue may still pass one.
 */
export function getCdnUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `${CDN_URL}/${cleanPath}`
}
