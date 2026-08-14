# What postal address and sender identity does rnui.dev publish?

Status: ready-for-agent
Type: grilling

## Question

This is the one decision the charting grill could not default, and three tickets wait on it.

Every regime wants an identity attached to the mail. CAN-SPAM requires a **valid physical postal
address** in the message. CASL's ECPR s.4 required the consent request itself to carry a name, a
mailing address and a contact method — which is exactly what the old form lacked. GDPR's informed
limb wants the controller identified.

rnui.dev is run by one person. Publishing a home address to a mailing list, in a footer that will
sit in strangers' inboxes indefinitely and in an archive, is a real and irreversible privacy cost —
and it is not the kind of thing that can be walked back after the first send.

The options, and none is obviously right:

1. **The maintainer's home address.** Compliant everywhere, free, and unretractable.
2. **A registered business address.** Compliant and separable from the home, but means registering
   something.
3. **A PO box or virtual mailbox.** The usual answer for solo operators. Small annual cost. Check
   it is accepted as a "valid physical postal address" — some virtual-office services are not.
4. **Publish no postal address**, on the argument that a Digest of new Recordings is not commercial
   email and CAN-SPAM's requirement therefore does not attach. Cheapest, and the weakest position
   if it is ever tested.

Decide alongside it: the **From: name and address** the Digest sends under. It must be consistent
forever — changing it later resets whatever sender reputation has accrued.

## Acceptance

- One of the four chosen, with the reasoning recorded, including what was accepted as a risk.
- The exact footer identity block written out verbatim, ready for tickets 06, 07 and 09 to paste.
- The From: name and address fixed.
