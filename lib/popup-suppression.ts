export type PopupSuppression = "subscribed" | "dismissed"

export function isPopupSuppression(value: unknown): value is PopupSuppression {
  return value === "subscribed" || value === "dismissed"
}
