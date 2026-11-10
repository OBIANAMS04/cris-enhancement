# STORY-009 — Evaluate and Score Responses

As a procurement officer, I want to evaluate and score responses, so that I determine the best value offer.

**Release:** r3 · Response Management (weeks 13–16)
**Owner:** Procurement Team
**Blocked by:** STORY-008

## The requirement this satisfies

- **REQ-014** (Functional, must) — The system must evaluate and score responses based on TxDOT’s weighted scoring system.

## How to build it

Develop evaluation metrics, ensure scoring system aligns with TxDOT standards.

## Failure paths you must handle

- Evaluation fails
- Scoring error not corrected
- Metrics not aligned
- Scores not archived
- Transparency issues

## Where this fits

**Workspace:** Response Evaluation · evaluate response

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given a response, when evaluated, then it is scored accurately.
- [ ] Given a scoring error, when it occurs, then it is corrected.
- [ ] Trust: All scores are archived for transparency.

When every box above is ticked, stop and show the demo.
