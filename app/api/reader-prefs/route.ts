import { NextResponse } from "next/server"

import { verifyReader } from "@/lib/firebase-token"
import { isPopupSuppression } from "@/lib/popup-suppression"
import { suppressPopup } from "@/lib/reader-prefs"

export async function POST(request: Request) {
  let uid: string
  try {
    uid = (await verifyReader(request.headers.get("authorization"))).uid
  } catch {
    return NextResponse.json(
      { message: "Sign in to save preferences." },
      { status: 401 }
    )
  }

  const body: unknown = await request.json().catch(() => null)
  if (
    typeof body !== "object" ||
    body === null ||
    Object.keys(body).length !== 1 ||
    !("reason" in body) ||
    !isPopupSuppression(body.reason)
  ) {
    return NextResponse.json(
      { message: "Send only a reason: subscribed or dismissed." },
      { status: 400 }
    )
  }

  try {
    await suppressPopup(uid, body.reason)
    return NextResponse.json({ ok: true })
  } catch {
    console.error("POST /api/reader-prefs failed")
    return NextResponse.json(
      { message: "Could not save preferences. Try again." },
      { status: 500 }
    )
  }
}
