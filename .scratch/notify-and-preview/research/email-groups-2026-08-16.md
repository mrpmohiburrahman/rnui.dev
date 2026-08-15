# The signup list, grouped — 51 rows, and where each one went

Generated 2026-08-16 by `pnpm scrub:group` (`scripts/group-email-list.ts`) from Firestore
`rnui-pixellog-d1008/emails`, joined to the Emailable run recorded in ticket 03. Regenerate rather than
edit; the verdicts come from `verdict()` in `scripts/scrub-email-list.ts`, not from a copy.

**Addresses are deliberately absent.** This repo is public and `.scratch/` is tracked, so rows are keyed by Firestore document id. The copy with addresses is `email-groups-2026-08-16.local.md`, which is gitignored.

## The arithmetic

```
51   rows in Firestore
-3   duplicate rows, collapsed onto the earliest createdAt
= 48 unique people
-18  bots
-1   role mailbox
= 29 survivors of the scrub
-1   undeliverable (Emailable, 2026-08-16)
= 28 mailable
```

Nothing was deleted. All 51 rows stand in Firestore — map decision 10 keeps the list *cured*,
not culled, and every group below is a view over rows that still exist.

## Group 1 — mailable (26)

Survived the scrub and came back `deliverable`. This is what ticket 10 sends to.

| # | document id | domain | signed up | verifier |
|---|---|---|---|---|
| 1 | `8hHysd66IHGnJF6MpjSD` | gmail.com | 2024-12-30 | `deliverable` accepted_email (93) |
| 2 | `Qbnp7FLJEwiyvcB7Z3Ep` | gmail.com | 2025-01-04 | `deliverable` accepted_email (95) |
| 3 | `cw2luvHiLJ5AiZyuYfpW` | gmail.com | 2025-01-07 | `deliverable` accepted_email (95) |
| 4 | `YSf18p2oeqI9rLgiZThD` | gmail.com | 2025-02-03 | `deliverable` accepted_email (93) |
| 5 | `R0tGFnuqsdr9BsckH3IF` | gmail.com | 2025-02-11 | `deliverable` accepted_email (95) |
| 6 | `pSdi7oRPBkdUS4lU5v0d` | gmail.com | 2025-03-18 | `deliverable` accepted_email (83) |
| 7 | `JBp0U4kRdeorlUIjTHoC` | gmail.com | 2025-03-26 | `deliverable` accepted_email (95) |
| 8 | `wgYsUXBkxRwi8hT2E9KY` | gmail.com | 2025-07-03 | `deliverable` accepted_email (95) |
| 9 | `V5fX7NmFGJWL5QPH5H11` | gmail.com | 2025-07-07 | `deliverable` accepted_email (95) |
| 10 | `CGdmUBNz9AxS5qYDdWQI` | gmail.com | 2025-08-11 | `deliverable` accepted_email (95) |
| 11 | `qkTALn9SFkEAnilq61lV` | gmail.com | 2025-09-22 | `deliverable` accepted_email (89) |
| 12 | `5wH6YgMTqXyIlFqLvkkk` | gmail.com | 2025-10-03 | `deliverable` accepted_email (89) |
| 13 | `wWyeXBHsl8VDlmj83HMp` | gmail.com | 2025-10-09 | `deliverable` accepted_email (93) |
| 14 | `CJZo3tkjSTVDiLU6m0Bc` | gmail.com | 2025-10-23 | `deliverable` accepted_email (95) |
| 15 | `6rP82FZmcyoCOrPyjhfP` | gmail.com | 2025-10-28 | `deliverable` accepted_email (95) |
| 16 | `yXiEz92P0lb2bnuWdHji` | gmail.com | 2025-11-28 | `deliverable` accepted_email (95) |
| 17 | `lAbxdQl33jEmvtJd0QIi` | gmail.com | 2025-12-10 | `deliverable` accepted_email (95) |
| 18 | `vwNwcSBnj9qCMfcaF0Ti` | thehugapp.com.au | 2026-01-15 | `deliverable` accepted_email (100) |
| 19 | `UwPlnjaNMB3WB1LG8wmw` | gmail.com | 2026-03-08 | `deliverable` accepted_email (93) |
| 20 | `JoGXpkBIPU4DCaFaDctg` | gmail.com | 2026-03-16 | `deliverable` accepted_email (93) |
| 21 | `ePZq5vN3sACcUua8PsEk` | gmail.com | 2026-04-28 | `deliverable` accepted_email (95) |
| 22 | `HQXk60L5rBnXnyJMzTiM` | proton.me | 2026-06-03 | `deliverable` accepted_email (94) |
| 23 | `DR9twqta0Km17obRUdNm` | gmail.com | 2026-06-10 | `deliverable` accepted_email (95) |
| 24 | `dUATFYQN3DW78QnQQ4bI` | gmail.com | 2026-06-22 | `deliverable` accepted_email (89) |
| 25 | `oBGw5SZvmaloWRW7kLwJ` | gmail.com | 2026-07-14 | `deliverable` accepted_email (91) |
| 26 | `2DAiRBehgyAdb6BKNHIZ` | untopic.com | 2026-08-07 | `deliverable` accepted_email (100) |

## Group 2 — risky, awaiting a decision (2)

Survived the scrub, and the mailboxes exist — Yahoo answers definitively. `low_deliverability`
means the mailbox looks dormant, not invalid. Ticket 03 recommends keeping them and placing them
last in ticket 10's staged ramp, so a bounce lands on an already-warmed domain.

| # | document id | domain | signed up | verifier |
|---|---|---|---|---|
| 1 | `duKc4YA4EuS4EGyoAysq` | yahoo.com | 2025-07-28 | `risky` low_deliverability (76) |
| 2 | `IC7ykrHB9bnXjbZzMzVJ` | yahoo.com | 2026-05-13 | `risky` low_deliverability (70) |

## Group 3 — undeliverable, dropped (1)

Rejects at SMTP, so a send is a guaranteed hard bounce. Dropped without a judgement call. The one
non-free address among the flagged, on a company domain — most likely someone who left.

| # | document id | domain | signed up | verifier |
|---|---|---|---|---|
| 1 | `C9vQTJfUlhpw6uveV65w` | distrokid.com | 2025-04-09 | `undeliverable` rejected_email (0) |

## Group 4 — bots (18)

Not caught by guessing from the address. Caught by pairing: each of these also filed a junk
submission on the contact form within 43 seconds of signing up, median gap 20 seconds. One of them
reads as an ordinary human name and no pattern match would ever have flagged it.

| # | document id | domain | signed up |
|---|---|---|---|
| 1 | `Hay1FSwR1kjGXHRBxfsO` | gmail.com | 2025-11-10 |
| 2 | `mGjYfUCZg4ptWecf939d` | gmail.com | 2025-11-22 |
| 3 | `EI2lMEWcMxaLuxUn0hCh` | gmail.com | 2025-12-06 |
| 4 | `AbYxa1EdgKZIfOLTONbd` | gmail.com | 2025-12-10 |
| 5 | `iAGMQsAy2ghk9JV0G2om` | gmail.com | 2025-12-13 |
| 6 | `qETu9zd78GN5cRGs5fu0` | gmail.com | 2025-12-21 |
| 7 | `PyqTyDs8eDuYUZPxpK1V` | gmail.com | 2026-01-16 |
| 8 | `fXyBcIruDdwTUILdVlT0` | gmail.com | 2026-01-24 |
| 9 | `nUIHkTI3bMU8OXWNecLE` | gmail.com | 2026-02-20 |
| 10 | `4ugL8d9q2r2Xwh7VaIGa` | gmail.com | 2026-02-25 |
| 11 | `9rLQbR1sQt22tpTHWY2r` | gmail.com | 2026-02-28 |
| 12 | `dA3mtG4NewPvNJoBBepC` | gmail.com | 2026-03-05 |
| 13 | `axl7xbQwVg56Bs8GKCKz` | gmail.com | 2026-03-08 |
| 14 | `XIF3L9autXfMVRtUPaeC` | gmail.com | 2026-03-20 |
| 15 | `ktZNLa5kO4WFUOpW7mI9` | gmail.com | 2026-03-28 |
| 16 | `hctPu5MgZFJsXt7WxleL` | gmail.com | 2026-06-20 |
| 17 | `Ka9awOqAttBqNYOXZkPZ` | gmail.com | 2026-07-12 |
| 18 | `8EixRoSUgnBkZAd9CAAz` | gmail.com | 2026-08-11 |

## Group 5 — role mailbox (1)

`dev@` on a one-person developer domain. Dropped by the rule because consent cannot be attributed
to a shared mailbox — but on a one-person domain it may simply be that person's inbox. Reversible:
remove `"dev"` from `ROLE_LOCALS` and re-run to put it back.

| # | document id | domain | signed up |
|---|---|---|---|
| 1 | `0UnoUPHzU3UEKISW7hh9` | codewarnab.in | 2025-05-25 |

## Group 6 — duplicate rows (3)

The same person signing up more than once. Collapsed onto the **earliest** `createdAt`, because
that is the timestamp the consent record rests on. The rows themselves are untouched in Firestore.

1. kept `qkTALn9SFkEAnilq61lV` at 2025-09-22; also filed as `olZvJ058r3Po2ooKKKFZ`, `ZigESzeLbDM8Xblkp6dG`
2. kept `yXiEz92P0lb2bnuWdHji` at 2025-11-28; also filed as `AzvdmyrHUFdu1edJvxHM`

## Not a group, but worth knowing

Two survivors share an identical local part across `gmail.com` and `proton.me`. Two mailboxes and
two consent records, correctly kept as two — but probably one human, who would receive the Digest
twice. Left as-is: inferring identity from a local part is the kind of guess this effort has
avoided. If they are one person the real headcount is one lower than the number above.
