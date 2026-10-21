import { d1Query } from "@/lib/d1"
import {
  isPopupSuppression,
  type PopupSuppression,
} from "@/lib/popup-suppression"

function checkUid(uid: string): string {
  if (!uid) throw new Error("A Reader uid is required")
  return uid
}

export async function readPopupSuppression(
  uid: string
): Promise<PopupSuppression | null> {
  const rows = await d1Query(
    "SELECT popup_suppressed_reason FROM reader_prefs WHERE reader_uid = ?",
    [checkUid(uid)]
  )
  if (rows.length === 0) return null
  const reason = rows[0].popup_suppressed_reason
  if (!isPopupSuppression(reason)) {
    throw new Error("Invalid Reader suppression state")
  }
  return reason
}

export async function suppressPopup(
  uid: string,
  reason: PopupSuppression
): Promise<void> {
  await d1Query(
    `INSERT INTO reader_prefs (reader_uid, popup_suppressed_at, popup_suppressed_reason)
     VALUES (?, ?, ?)
     ON CONFLICT(reader_uid) DO UPDATE SET
       popup_suppressed_reason = excluded.popup_suppressed_reason
     WHERE reader_prefs.popup_suppressed_reason = 'dismissed'
       AND excluded.popup_suppressed_reason = 'subscribed'`,
    [checkUid(uid), new Date().toISOString(), reason]
  )
}
