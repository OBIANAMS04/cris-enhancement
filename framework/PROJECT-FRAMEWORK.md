# CRIS Enhancement — Project Framework

**Solicitation:** Crash Records Information System Service Agreement (TxDOT) · **Bidder:** Colaberry
**Owner:** Obi Anamelechi Kingsley · **Decision makers:** Ali Muwwakkil (Managing Director), Ram Katamaraja
**Ship-by:** 24 November 2026 · **Last updated:** 2026-11-11 · Updated after every milestone

> Everything here is built and demonstrated on synthetic data. Nothing is operating in production and nothing is
> connected to a TxDOT system. The Command Center shows no number, connection or result the project has not produced.

---

## 1. What we are doing

Colaberry is working a live, dated solicitation: the TxDOT Crash Records Information System (CRIS) Service
Agreement. The build is run through the Colaberry enterprise portal (Project Studio), story by story. Each story is
confirmed by the portal reading this repo: its acceptance criteria ticked in `.colaberry/progress.json` because they
are true, and a pushed commit that names the story.

Project in the portal: https://enterprise.colaberry.ai/portal/projects/workspace/a563218c-c3a4-433c-8ed7-4e8e0573f59c/STORY-000

## 2. Scope

20 requirements (13 functional, 5 integration constraints, 2 safety), 15 stories in 5 releases, plus STORY-000, the
Command Center. Two guardrails: compliance with federal, state and local laws (REQ-010), and TxDOT-approved cyber
security training for vendor employees (REQ-020). Two named outside systems: TxDOT and Euna Procurement.

## 3. Structure and status

Dates in this table are the ones the portal's STORY-000 brief gives. The plan file in the repo
(`.colaberry/plan.json`) carries no dates yet, so the Command Center shows none (see Blockers).

| Release | Stories | Dates in the brief | Status |
|---|---|---|---|
| — | **STORY-000** Build your Command Center | first | **Verified 2026-11-11 by the portal, 50 points.** All nine tabs live at https://obianams04.github.io/cris-enhancement/ |
| **r0** Initial System Setup and Support | 001 Help Desk Support Module · 002 System Monitoring Tools · 003 Performance Reports · 012 Ongoing Technical Support and Maintenance | 5 to 8 Nov | Not started. Already past the brief's dates |
| **r1** Enhancement and Training | 004 Feature Development Module · 005 User Training Sessions | 10 to 12 Nov | Not started |
| **r2** Reporting and Compliance | 006 Reporting Engine · 007 Compliance with Laws · 013 Required Documentation | 13 to 16 Nov | Not started |
| **r3** Response Management | 008 Response Submissions · 009 Evaluate and Score Responses | 18 to 20 Nov | Not started |
| **r4** Risk Management and Security | 010 Risk Assessment Tools · 011 Cybersecurity Compliance · 014 Performance and User-Error Risks · 015 Incident Reports and Risk Documentation | 21 to 24 Nov | Not started |

### Milestones (three to five stories at a time)

| Milestone | Contents | Target |
|---|---|---|
| M0 | STORY-000: the Command Center, all nine tabs, verified by the portal | **Done 2026-11-11** |
| M1 | STORY-001, 002, 003, 012 and 004 (everything the brief dates up to 10 Nov) | Straight after M0 |
| M2 | STORY-005, 006, 007, 013 | 16 Nov |
| M3 | STORY-008, 009, 010 | 21 Nov |
| M4 | STORY-011, 014, 015, then demo prep | 24 Nov |

Each milestone ends with: a summary, links, everything committed and pushed, the framework and its artifact
updated with current screenshots, and a short HTML presentation (three to five minutes, with charts and a story
line) for the audience.

### STORY-000 against its five acceptance criteria (2026-11-11)

All five ticked in `progress.json` because each holds in the repo, and the portal verified the story on 2026-11-11.

| Criterion | Evidence |
|---|---|
| Every tab reachable, every card drills down one level | Browser walk: 9 tabs, 65 cards, each card opens its own page |
| Sample data visibly labelled | A banner on every tab and a tag on every card; none in Real mode |
| Every tab reads plan.json and progress.json at runtime, both committed | A story removed from the plan file disappears from the page |
| manifest.json committed; data age shown, warning past a week | Every tab warns on a manifest nine days old |
| Trust: nothing shown that the project has not produced | Systems grey and not checked; agents "no runs recorded"; no dates because the file has none |

The portal's own record (downloaded with Get my progress.json and committed unedited) has three oddities worth
raising with Ali: it counts 45 criteria rather than 50, shows STORY-000 as "0 of 0" criteria, and names the first
commit (f07db58) as the verifying one. It also marks the 15 unbuilt stories "in progress".

## 4. How it is built

- A static site with no build step and no dependencies: `index.html` at the repo root, modules under `assets/js/`.
  One data layer (`assets/js/data.js`) loads the three `.colaberry/` files at runtime; no tab holds plan content.
- Every tab and every drill-down has its own address (`#/overview`, `#/overview/release/r0`).
- Real and Sample modes. Sample keeps the real plan's shape and fills in made-up dates, states and points.
- Checks: 11 unit tests on the data layer (`node --test tests/`), and a browser walk through Playwright
  (`tests/browser-walk.js`): 9 tabs, 11 cards, sample labels, stale-data warning, deleted story, missing file,
  phone width. Both pass as of 2026-11-10.
- This framework lives in `framework/`, not `docs/`: the platform rewrites `docs/` on every sync.

## 5. Decisions

| Date | Decision | By |
|---|---|---|
| 2026-11-08 | SSS is finished; move to Crash Records, the live solicitation, ship-by 24 Nov. Start with STORY-000, then the Release 0 stories in order | Ali |
| 2026-11-10 | The repo lives under Obi's own GitHub account and is public, as the portal requires for verification and GitHub Pages. It is separate from the closed SSS repo | Obi (Claude's recommendation) |
| 2026-11-10 | The Command Center is a dependency-free static site read from the `.colaberry/` files at runtime | Claude |
| 2026-11-10 | The brief lists release and story dates, but `plan.json` holds none. The page shows what the file holds: no dates, with an empty state that says so. The brief's dates are not typed into the code | Claude, per the brief's own rule |
| 2026-11-10 | Neutral colours until a brand is chosen; the brand is two lines at the top of `assets/app.css` | Claude |
| 2026-11-10 | Work in milestones of three to five stories. Each ends with an HTML presentation of three to five minutes with charts and a story line | Obi |

## 6. Blockers and owners

| Blocker | Effect | Owner | Next step |
|---|---|---|---|
| `gh` not signed in on this machine | Only the portal's push webhook waits on it (optional): without it Claude presses Sync from GitHub | Obi | Finish `gh auth login` when convenient |
| `plan.json` has no schedule, release dates or due dates | The Overview shows no dates; the Project management tab would have an empty Gantt | Ali / the platform | See whether the first sync after connecting delivers dates; if not, ask Ali |

## 7. Timeline

| Date | What happened |
|---|---|
| 2026-11-08 | Ali grants builder access on the portal and points Obi at STORY-000 |
| 2026-11-11 | Obi said "build the rest". Repo `OBIANAMS04/cris-enhancement` created (public) in the browser, pushed, connected to the portal; the other eight tabs built; a browser walk of 9 tabs and 65 cards passes; all five criteria ticked; **STORY-000 verified by the portal, 50 points**; GitHub Pages live at https://obianams04.github.io/cris-enhancement/; the portal's progress record committed. Guided-tour button gets a play icon (standing rule) |
| 2026-11-10 | SSS closed out. CRIS project folder created; plan documents downloaded from the portal; the Command Center data layer, shell and Overview built and checked locally (11 unit tests, browser walk with no failures); first local commit. Waiting on GitHub sign-in to create the repo, connect it in the portal, register the push webhook and turn on GitHub Pages |

## 8. Risks

| Risk | Effect | Action |
|---|---|---|
| 15 stories in the 14 days to 24 Nov, with Release 0 already past the brief's dates | The ship-by date is tight | Milestones of five, four, three and three stories; M1 starts the moment STORY-000 verifies |
| The stories name integrations (TxDOT IT infrastructure, TxDOT financial systems, Euna Procurement, incident management) that this project cannot reach | A demo could imply connections that do not exist | Build against synthetic stand-ins behind a clear interface, label them, and keep every indicator grey and "not checked from here" until a real system reports |
| The plan's requirements read as written for the delivered CRIS service, and also for handling the solicitation response itself (REQ-012 to 015) | Scope could be misread | Follow the story files as written; raise mismatches with Ali rather than reinterpreting |
| The repo is public | Anything committed is visible to anyone | No secrets, keys or `.env` files, ever; the push-webhook secret is run once and never saved |

## 9. Screens (2026-11-11)

All in `framework/screens/`, taken by `tests/browser-walk.js`: 01 Overview, 02 Outcomes, 03 Users, 04 Guardrails,
05 Systems, 06 Project management, 07 AI agents, 08 Knowledge base question panel, 09 Data model, 10 a guardrail
drill-down, 11 a data-model entity, 12 to 14 sample mode, 15 the stale-data warning, 16 phone width.

## 10. Links

- Portal story: https://enterprise.colaberry.ai/portal/projects/workspace/a563218c-c3a4-433c-8ed7-4e8e0573f59c/STORY-000
- Framework artifact (pinned): https://claude.ai/artifact/AZJzCgHVd2QAr4LnFCRzzf
- GitHub repo: https://github.com/OBIANAMS04/cris-enhancement
- Command Center (live): https://obianams04.github.io/cris-enhancement/

## How this document is maintained

Updated by Claude after every milestone, together with the published framework artifact, and committed with that
milestone's work.
