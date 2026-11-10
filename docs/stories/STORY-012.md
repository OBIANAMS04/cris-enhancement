# STORY-012 — Provide Ongoing Technical Support and Maintenance

As a system administrator, I want to ensure ongoing technical support and maintenance services for CRIS, so that the system remains operational and efficient.

**Release:** r0 · Initial System Setup and Support (weeks 1–4)
**Owner:** Technical Support Team
**Blocked by:** nothing — you can start this now

## The requirement this satisfies

- **REQ-001** (Functional, must) — The system must provide ongoing technical support and maintenance services for CRIS.

## How to build it

Implement a support ticketing system and schedule regular maintenance checks. Ensure all activities are logged in the support database.

## Failure paths you must handle

- Support request not logged
- Maintenance not completed on time
- Support team unavailable

## Where this fits

**Workspace:** Support Dashboard

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given the system is operational, when a technical issue arises, then the support team must resolve it within the SLA.
- [ ] Given a maintenance schedule, when maintenance is due, then the system must undergo maintenance without disrupting services.
- [ ] Trust: All support and maintenance activities must be logged and auditable.

When every box above is ticked, stop and show the demo.
