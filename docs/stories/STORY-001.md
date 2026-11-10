# STORY-001 — Implement Help Desk Support Module

As a TxDOT user, I want to report issues and receive assistance, so that I can resolve problems quickly.

**Release:** r0 · Initial System Setup and Support (weeks 1–4)
**Owner:** Support Team
**Blocked by:** nothing — you can start this now

## The requirement this satisfies

- **REQ-002** (Functional, must) — The system must include a Help Desk Support module for users to report issues and receive assistance.

## How to build it

Develop the Help Desk Support module, integrate with existing support tools.

## Failure paths you must handle

- User cannot access help desk
- Issue not logged
- Assistance delayed
- Incorrect issue resolution
- Audit log missing

## Where this fits

**Workspace:** Help Desk · report issue

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given a user has an issue, when they report it via the help desk, then they receive assistance.
- [ ] Given a resolved issue, when the user checks the status, then it shows as resolved.
- [ ] Trust: All help desk interactions are logged for audit.

When every box above is ticked, stop and show the demo.
