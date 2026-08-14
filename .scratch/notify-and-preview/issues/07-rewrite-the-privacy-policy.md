# Rewrite the privacy policy to describe what actually happens

Status: ready-for-agent
Type: task
Blocked by: 04

## Question

`app/privacypolicy/page.tsx` currently says an email address is collected "voluntarily" and may be
shared with "trusted third-party service providers". That is a template, and it describes neither
the Digest nor Resend nor any way to get out.

It also got **1 pageview in the last 30 days**, so nobody has read it — which is a reason to make
it correct cheaply, not a reason to skip it. It is linked from the form after ticket 06, so it
starts being load-bearing then.

## Acceptance

- Purpose stated: what the Digest is and when it sends.
- Lawful basis stated (consent), and how it is withdrawn.
- Retention stated, including the sunset rule — the map's fog notes it cannot be specified yet;
  say what is known and leave the rest out rather than inventing a period.
- **Resend named by name**, not hidden behind "trusted third-party service providers".
- Data subject rights, and the contact method from ticket 04.
- A version number and effective date, so a future change is provable.
- Linked from the signup form and the Digest footer.
