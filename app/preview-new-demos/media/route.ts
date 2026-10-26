import { NextResponse } from "next/server"

const ALLOWED_HOSTS = new Set([
  "vz-5e32a7cb-1ab.b-cdn.net",
  "video.twimg.com",
  "pub-4f02f6295cfb4d38ad95eef187b3610d.r2.dev",
])

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get("url")
  if (!rawUrl) {
    return NextResponse.json({ message: "Missing url." }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return NextResponse.json({ message: "Invalid url." }, { status: 400 })
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ message: "Host not allowed." }, { status: 403 })
  }

  const upstreamHeaders = new Headers({
    "User-Agent": "Mozilla/5.0",
  })

  if (parsed.hostname === "vz-5e32a7cb-1ab.b-cdn.net") {
    upstreamHeaders.set("Referer", "https://expo.dev/")
  }

  const range = request.headers.get("range")
  if (range) {
    upstreamHeaders.set("Range", range)
  }

  let upstream: Response
  try {
    upstream = await fetch(parsed.toString(), {
      headers: upstreamHeaders,
      cache: "no-store",
      signal: request.signal,
    })
  } catch {
    return new Response(null, { status: 499 })
  }

  const responseHeaders = new Headers()
  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
  ]) {
    const value = upstream.headers.get(name)
    if (value) {
      responseHeaders.set(name, value)
    }
  }
  responseHeaders.set("cache-control", "public, max-age=3600")

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
