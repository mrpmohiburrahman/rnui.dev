# 02 — One spelling of the repository address

**What to build:** Every place this site names its own repository — two shipped links, two end-to-end
tests, and the package manifest — carries the same, current address. No reader follows a redirect, and
the next person to add a link cannot copy a stale spelling out of the codebase, because there isn't one
left to copy.

Nothing a visitor sees changes except that two links stop bouncing. This ticket is deliberately its own
commit: the star control writes this same string, so the drift is on-topic, but bundling it into the
control's pull request would make a four-line identity fix get reviewed as part of a button.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] The canonical address is `github.com/mrpmohiburrahman/rnui.dev`. It matches the domain, the social
      card, the git remote and every readme badge; the old spelling's only advocate was the package
      manifest's name field, which nothing in the app reads. The platform confirms both paths answer
      with the same full name — the old path is a redirect alias, not a second repository.
- [ ] **All four places carrying the alias are corrected, not two.** Two are shipped links (the footer's
      "Repository ↗" and the catalogue grid's "Add your own recording on GitHub ↗"). Two are end-to-end
      tests that pin the alias as a string.
- [ ] Both tests **keep their purpose**: they assert *that the served HTML carries a repository link*,
      not *which* repository link. The assertion stays; only the expected string changes. Correcting the
      links without the tests fails the suite; correcting the tests alone is not a change at all.
- [ ] The package manifest is renamed to match and gains the three fields it never had — repository,
      homepage and issue tracker. The rename removes the stale value that is the probable source of the
      drift; the repository field is what stops a future contributor guessing. The lockfile does not
      reference the root package name, so the rename touches nothing else.
- [ ] **No shared constant is introduced.** The address goes in as a literal, as it does everywhere
      today. If this drift ever reappears, that is when to revisit it.
- [ ] The catalogue grid's "Add your own recording on GitHub ↗" keeps its **wording and its
      existence** — only its address is corrected here. Whether that link should still exist, given the
      site has a real form at `/submit`, is a separate question this ticket does not answer.
- [ ] The full test suite passes with the new string.
