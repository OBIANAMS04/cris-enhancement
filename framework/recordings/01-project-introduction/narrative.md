# The story you will tell on Demo Day (Prepare hand-in, PREP-1)

**Project:** CRIS Enhancement, a workspace built for the TxDOT Crash Records Information System (CRIS) Service
Agreement solicitation · **Owner:** Obi Anamelechi Kingsley · **Demo Day:** 24 November 2026

Paste the three sections below into the portal. CRIS is a Colaberry rehearsal case study: everything in the build
runs on synthetic data, nothing is connected to TxDOT, and TxDOT is not consulted. Where the solicitation's own
values are not public, the build uses working assumptions taken from TxDOT's published terms, each labelled on screen
and kept in one file.

---

## The problem

A TxDOT procurement officer receiving vendor responses to a solicitation has to make sure every response carries every
required document and arrived before the closing time, and has to be able to show why any response was turned away.
The cost of a miss is set by TxDOT's own published terms: a response without every required document is
non-responsive and is never scored, and a late response is not considered under any circumstances. So one missing
file costs a vendor its whole bid, and costs TxDOT a competitor.

*Sources (in `content/procurement-rules.json`): rule EV-04, TxDOT RFO 601440000054109 sec. 17.1 and 17.6 and RFO
601440000051864 sec. 17.6 (incomplete responses are non-responsive and are not scored); rule SUB-04, TxDOT Terms and
Conditions 2.02(b) (late responses are not considered). These are TxDOT's published terms for other solicitations,
used here as working assumptions for CRIS. No time figure is claimed: how long a hand check takes is not measured yet,
and measuring it is the next milestone.)*

## The one moment

On the Submissions page, acting as the procurement officer, I record Vendor A's response with all four required
documents: "RSP-0001 recorded", saved with a fingerprinted (SHA-256) receipt. Then I record Vendor B with only two of
the four: it is refused on the spot with the reason ("Missing required document: ..."), and the failure is logged as an
incident, not lost. Vendor B resubmits with all four: "RSP-0002 recorded", and the logged error now reads "Addressed".
I open RSP-0001 ("Documents match the receipt") and move both responses to "under evaluation". I end on the Audit log:
"The chain is intact": every one of those steps is there, in order, chained by hashes.

## The guardrail

The check runs before anything is stored, so an incomplete or late response can never slip into evaluation: it is
refused with the reason, logged as an incident, and tracked until the vendor's next valid submission (or until an
officer records the cause by hand). Files are checked for type and size, stored and read back by hash, and a retried
submission is never stored twice. Every action is written to an audit log chained by SHA-256 in the same save, so a
changed record is caught. People keep the decisions: evaluators score every criterion, a score far from the others is
flagged and must be resolved before the evaluation can be archived, a correction never overwrites the original, and
TxDOT alone decides the award. Values that are working assumptions (closing time, required documents, scoring
weights) are labelled as proposals on screen.

**How I will show it:** the refused Vendor B response with its reason and logged incident (above), then on the Audit
log I change one line in the browser console and reload: the page says "line 4 was changed after it was written".
