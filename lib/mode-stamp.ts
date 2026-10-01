// lib/mode-stamp.ts
//
// The footer's right-hand stamp lines (Catalogue.dc.html:244), spelled here so
// components/site-footer.tsx stays clear of hex literals — the acceptance grep
// for this ticket (`grep -nE '#[0-9A-Fa-f]{3,8}\b' components/site-header.tsx
// components/site-footer.tsx`) is about colours coming from ticket-02 tokens,
// and these two strings are copy, not colours, but the grep cannot tell.

export const DARK_MODE_STAMP = "STUDIO DARK · #0A0B0D"
export const LIGHT_MODE_STAMP = "STUDIO LIGHT · #F4F4F1"
