# Enable Firebase Auth, the social providers, and the nav sign-in button

Type: task
Status: open
Blocked by: 01, 03, 04

## Question

Turn on the identity provider and put a working sign-in in the nav.

Console work, which the maintainer may need to do or may delegate:

- In the Firebase console, enable Google sign-in for the project. **Leave the Email/Password
  provider off** — map constraint, not a preference to revisit.
- **Rename the Firebase project's display name to `rnui.dev`, then empirically confirm what the
  Google consent screen shows** (ticket 01's finding). The shared client displays the *project ID*,
  which reads as an untrustworthy stranger asking for an email address. If the rename does not
  propagate, lead with GitHub rather than Google in the provider UI — a UI ordering change, not a
  provider change. Do not create a Google Cloud project to fix this; the branding is not worth it.
- Confirm the authorised domains list covers `www.rnui.dev`, `old.rnui.dev`, `preview.rnui.dev`
  and `localhost`. Two Designs are live and both must keep working; see `CONTEXT.md` on the
  `$host` boundary.
- Enable GitHub alongside Google. GitHub OAuth needs no verification and no Google Cloud project,
  which makes it the dependable fallback if ticket 01 finds a warning on Google's side.
- **Confirm Identity Platform is off**, and leave it off. Enabling it drops Spark to 3,000 daily
  active users (map decision 2).
- Record the Firebase web config keys, and note which Vercel environments need them. Per the
  `public-submissions` precedent, `.env` values are not in the shell — so the maintainer sets them
  and this ticket cannot close until they are set in every environment.

Code work:

- Initialise the Firebase client once, in one module, and have the nav render a signed-out and a
  signed-in state per ticket 04's prototype.
- Fit the right-hand nav cluster without breaking the existing Saved chip, star control and mode
  toggle, at both desktop and phone widths.

Do not wire saving here. That is 07.

## Notes

The environment-variables step is HITL and is the usual reason a ticket of this shape ends
`ready-for-human` rather than resolved. Name that outcome rather than claiming `resolved` early.