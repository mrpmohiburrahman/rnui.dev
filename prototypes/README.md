# prototypes/

Work that is **kept but not shipped**. Nothing in here is imported by `app/`, `components/`,
`lib/` or `data/`, so Next never routes it, never bundles it, and never traces it into a
deployment.

## Why this directory exists at all

`.scratch/` was where this work lived, and `.scratch/` has two problems for anything meant to
outlive a session: it is untracked, and **TypeScript never type-checked it.** `tsconfig.json`
includes `**/*.ts` and `**/*.tsx`, and TypeScript's glob does not match paths beginning with a
dot — so every file under `.scratch/` was invisible to `pnpm check-types`. Eight probe files
sat there carrying type errors that no amount of running would have surfaced, and one of them
(`probe/fonts.ts`, now) was a single loader duplicated eight times.

Moving them here makes them visible to `pnpm check-types` and `pnpm lint`, which is the point.
If a prototype here breaks the build, that is the directory working as intended rather than a
prototype interfering with the site.

## What lives where

| | |
|---|---|
| `og-cards/` | the Contributor Open Graph card — five variants, the renderer, the guard, and the probes their numbers came from |

## The rule

A prototype may be referenced by nothing. If a prototype starts being imported by `app/`, it has
stopped being a prototype and should move into the tree proper, with its own review.
