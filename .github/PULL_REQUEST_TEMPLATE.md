## Summary

<!-- One sentence: what does this PR do? -->

## Type

- [ ] New catalog entry
- [ ] Bug fix
- [ ] Documentation
- [ ] Tooling / CI

## Checklist

- [ ] `pnpm check-types` passes locally
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] If adding an entry: schema fields complete, no duplicate `id`, and the
      Asset paths are the ones `lib/asset-path.ts` derives — no binary files
- [ ] If adding an entry, the maintainer publishing it: Demo dropped in Staging,
      `pnpm posters:generate`, `pnpm check:videos`, `pnpm assets:publish`

## Screenshots (if UI change)
