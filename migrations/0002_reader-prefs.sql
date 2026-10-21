CREATE TABLE reader_prefs (
  reader_uid TEXT PRIMARY KEY NOT NULL,
  popup_suppressed_at TEXT NOT NULL,
  popup_suppressed_reason TEXT NOT NULL
    CHECK (popup_suppressed_reason IN ('subscribed', 'dismissed'))
) STRICT;
