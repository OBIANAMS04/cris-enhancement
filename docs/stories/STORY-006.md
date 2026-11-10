# STORY-006 — Develop Reporting Engine

As a TxDOT contract manager, I want to generate required reports, so that I meet reporting obligations.

**Release:** r2 · Reporting and Compliance (weeks 9–12)
**Owner:** Reporting Team
**Blocked by:** STORY-005

## The requirement this satisfies

- **REQ-009** (Functional, must) — The system must generate required reports as specified by the TxDOT contract manager.

## How to build it

Develop reporting engine, ensure integration with financial systems.

## Failure paths you must handle

- Report not generated
- Specifications not met
- Error not logged
- Archive fails
- Integration issues

## Where this fits

**Workspace:** Reporting Engine · generate report

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given a report request, when generated, then it meets specifications.
- [ ] Given a report error, when it occurs, then it is logged and addressed.
- [ ] Trust: All reports are archived for compliance.

When every box above is ticked, stop and show the demo.
