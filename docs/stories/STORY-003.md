# STORY-003 — Generate Performance Reports

As a TxDOT manager, I want regular performance reports, so that I can assess system health.

**Release:** r0 · Initial System Setup and Support (weeks 1–4)
**Owner:** Reporting Team
**Blocked by:** nothing — you can start this now

## The requirement this satisfies

- **REQ-005** (Functional, must) — The system must provide regular performance reports and incident resolution logs.

## How to build it

Develop reporting templates, automate report generation.

## Failure paths you must handle

- Report generation fails
- Data missing
- Incorrect data in report
- Report not archived
- Access denied

## Where this fits

**Workspace:** Performance Reports · generate report

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given system data, when a report is generated, then it reflects current performance.
- [ ] Given a report request, when data is missing, then an error is shown.
- [ ] Trust: Reports are archived for future reference.

When every box above is ticked, stop and show the demo.
