# STORY-010 — Implement Risk Assessment Tools

As a risk manager, I want to identify and mitigate risks, so that CRIS operates smoothly.

**Release:** r4 · Risk Management and Security (weeks 17–20)
**Owner:** Risk Management Team
**Blocked by:** STORY-009

## The requirement this satisfies

- **REQ-017** (Functional, must) — The system must include tools to identify and mitigate risks related to system outages or operator errors.

## How to build it

Develop risk assessment tools, integrate with incident management systems.

## Failure paths you must handle

- Risk not identified
- Mitigation fails
- Assessment not archived
- Integration issues
- Review process fails

## Where this fits

**Workspace:** Risk Management · assess risk

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given a risk assessment, when conducted, then risks are identified and mitigated.
- [ ] Given a risk, when it is not mitigated, then it is logged for review.
- [ ] Trust: All risk assessments are archived.

When every box above is ticked, stop and show the demo.
