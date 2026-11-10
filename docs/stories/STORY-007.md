# STORY-007 — Ensure Compliance with Laws

As a compliance officer, I want to ensure system compliance with laws, so that TxDOT avoids legal issues.

**Release:** r2 · Reporting and Compliance (weeks 9–12)
**Owner:** Compliance Team
**Blocked by:** STORY-006

## The requirement this satisfies

- **REQ-010** (Safety, must) — The system must ensure compliance with federal, state, and local laws.

## How to build it

Implement compliance tracking tools, update system as laws change.

## Failure paths you must handle

- Compliance check fails
- Legal update missed
- Violation not logged
- System not updated
- Audit trail missing

## Where this fits

**Runs headless:** Compliance Tracking — no page shows this; it is background work.

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given a compliance check, when conducted, then no violations are found.
- [ ] Given a legal update, when it occurs, then the system is updated accordingly.
- [ ] Trust: Compliance checks are logged.

When every box above is ticked, stop and show the demo.
