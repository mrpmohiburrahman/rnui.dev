# Standards Axis Review: Diff 2179028..HEAD

Report: standard violations / baseline smells. Hard vs calls.

---

## `components/sign-in-control.tsx`

**(a)** No standard violations. Ticket-08 join-flow code. No list; "account" is Firebase technical context, `Reader` is domain term per ADR-0013.

**(b)** No baseline smells. ProviderSheet `linkAction.kind` dispatch is discriminated-union, not Feature Envy. No "Repeated Switches" — that switch is in `reader-link.ts`. Comments explain why (ticket 08), not what.

---

## `hooks/use-reader.ts`

**(a)** No standard violations. `linkPhase`, `linkCache`, `PendingCredentialError`, `pendingLinkFrom`, `credentialFrom`, `linkPendingTo` — all ticket-08. `PendingCredentialError` loose typing is Firebase-change guard, not Primitive Obsession (code validates shape). No `user`/`member`; `Reader` consistent per CONTEXT.md/ADR-0013.

**(b)** Baseline smells:

- **Divergent Change?** No. One coherent concern: ticket-08 join flow.

- **`pendingLinkCache().consume({ linked: true })`** — Judgement call. Type system makes "drop credential on failure" a type error, preventing data loss 08.

- `linkPhase` / `linkCache` addition: one concern, not Divergent Change.

---

## `lib/reader-link.ts` (new file)

**(a)** No standard violations. New file: Firebase-free for node testability, pure merge semantics, explicit invariants.

**(b)** Baseline smells:

- **`PendingLinkCache.consume(proof: { linked: true })`** — Judgement call: the invariant ("credential survives every failure") is ticket 08's whole point. Without `linked: true` compile-time requirement, a developer could discard the credential in failure, losing the Reader's only route back.

- **`decideLinkAction` switch on `LinkPhase`** — Right shape, not Repeated Switches. Switch on finite, well-named enum; each branch lands Reader somewhere actionable. No other switch on `LinkPhase`; sole dispatch using types.

- **Data Clumps** (`providerId`, `pendingToken`, `nonce`, `credentialJson`) — Bundled by design, not a smell. `PendingLink` groups them; `credentialJson` is explicitly opaque and never read in this module.

- **Comments explain why, not what**. File-top and inline comments justify the defect, Firebase constraint, and `consume` invariant. No pure narration.

---

## `tests/reader-link.test.ts` (new file)

**(a)** No standard violations. Validates the three ticket-08 invariants.

**(b)** No baseline smells. `never calls the signed-in person a user or member` test passes because copy uses `"account"` (Firebase terminology), not `"user"`/`"member"` — consistent with project using `Reader` as domain term.

---

## Summary

**Hard violations:** None. No CONTEXT.md, ADR-0013, CLAUDE.md, or CONTRIBUTING.md breaches.

**Baseline smells:** All judgement calls justified by ticket 08: `pendingLinkCache().consume({ linked: true })` — type-system invariant encoding; `decideLinkAction` switch on `LinkPhase` — right shape, not Repeated Switches; `credentialJson` opacity and `PendingLink` bundling — Firebase-free testability by design.

`hooks/use-reader.ts` ~450 lines is one coherent concern (sign-in joining flow), not Divergent Change. All tooling (tsc, eslint, prettier) passes.