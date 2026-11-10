# STORY-011 — Ensure Cybersecurity Compliance

As a security officer, I want to ensure cybersecurity compliance, so that TxDOT systems are secure.

**Release:** r4 · Risk Management and Security (weeks 17–20)
**Owner:** Security Team
**Blocked by:** STORY-010

## The requirement this satisfies

- **REQ-020** (Safety, must) — Vendor employees must complete a TxDOT-approved cyber security training program.

## How to build it

Implement cybersecurity training program, ensure all employees complete it.

## Failure paths you must handle

- Training not completed
- Breach not logged
- Compliance not ensured
- Training archive fails
- Security measures outdated

## Where this fits

**Runs headless:** Cybersecurity Training — no page shows this; it is background work.

## Acceptance — your stop condition

Tick each box as it genuinely passes. This file is yours — the platform reads
the same criteria out of `.colaberry/progress.json`, which Claude Code keeps in
step (see the managed block in CLAUDE.md). Ticking something you have not
actually met only misleads you.

- [ ] Given a cybersecurity training, when completed, then compliance is ensured.
- [ ] Given a security breach, when it occurs, then it is logged and addressed.
- [ ] Trust: All training completions are archived.

When every box above is ticked, stop and show the demo.
