# STORY-015 — Provide Incident Reports and Risk Assessment Documentation

As a compliance officer, I want to provide incident reports and risk assessment documentation, so that stakeholders are informed of system risks and incidents.

**Release:** r4 · Risk Management and Security (weeks 17–20)
**Owner:** Compliance Team
**Blocked by:** STORY-014

## The requirement this satisfies

- **REQ-019** (Functional, must) — The system must provide incident reports and risk assessment documentation.

## How to build it

Develop a reporting tool to generate incident reports and store risk assessments. Implement version control and access logging.

## Failure paths you must handle

- Incident report not generated
- Risk assessment not accessible
- Unauthorized access to reports

## Where this fits

**Workspace:** Compliance Dashboard · report

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given an incident, when it is reported, then a detailed report must be generated and stored.
- [ ] Given a risk assessment, when it is completed, then the documentation must be accessible to authorized users.
- [ ] Trust: All reports and assessments must be version-controlled and logged.

When every box above is ticked, stop and show the demo.
