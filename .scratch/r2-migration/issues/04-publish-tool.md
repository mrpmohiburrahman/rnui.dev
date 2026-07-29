# 04 — Publish tool

**What to build:** One command that takes Staging copies and makes them Published Assets, and that cannot silently do the wrong thing. It refuses to run if the Assets would not play, refuses to overwrite anything already published, and reports what happened to every file rather than exiting 0 and leaving you to hope.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] A single command publishes Staging copies to the bucket, deriving each object key from the Asset path so the catalogue needs no edits.
- [ ] Every object is written with `Cache-Control: public, max-age=31536000, immutable` and a correct content type, set as object metadata so the header travels with the object rather than depending on a CDN rule.
- [ ] The codec check runs against the Staging copies first and the tool aborts before uploading anything if it fails. A Demo that browsers cannot decode must never become a Published Asset.
- [ ] **Publishing refuses to overwrite an existing key.** This makes ADR-0003 a mechanism instead of a discipline; an accidental re-publish becomes a loud failure rather than silent cache poisoning that lasts a year.
- [ ] Per-Asset result reported, and a non-zero exit if any Asset failed, so a partial upload is visible rather than assumed complete.
- [ ] Re-running after a successful publish is safe and reports every object as already published.
- [ ] Verified end-to-end on a single small Category before being used on the full catalogue.
- [ ] Credentials come from the environment and are never committed.
