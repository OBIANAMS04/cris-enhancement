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
| **r0** Initial System Setup and Support | 001 Help Desk Support Module · 002 System Monitoring Tools · 003 Performance Reports · 012 Ongoing Technical Support and Maintenance | 5 to 8 Nov | **All four verified 2026-11-11**, 50 points each. Workspace live at https://obianams04.github.io/cris-enhancement/workspace/ |
| **r1** Enhancement and Training | 004 Feature Development Module · 005 User Training Sessions | 10 to 12 Nov | 004 **verified 2026-11-11**; 005 next (Milestone 2) |
| **r2** Reporting and Compliance | 006 Reporting Engine · 007 Compliance with Laws · 013 Required Documentation | 13 to 16 Nov | Not started |
| **r3** Response Management | 008 Response Submissions · 009 Evaluate and Score Responses | 18 to 20 Nov | Not started |
| **r4** Risk Management and Security | 010 Risk Assessment Tools · 011 Cybersecurity Compliance · 014 Performance and User-Error Risks · 015 Incident Reports and Risk Documentation | 21 to 24 Nov | Not started |

### Milestones (three to five stories at a time)

| Milestone | Contents | Target |
|---|---|---|
| M0 | STORY-000: the Command Center, all nine tabs, verified by the portal | **Done 2026-11-11** |
| M1 | STORY-001, 002, 003, 012 and 004: the workspace (help desk, support, monitoring, reports, features) | **Done 2026-11-11**, all five verified, 250 points |
| M2 | STORY-005, 006, 007, 013 | 16 Nov (next) |
| M3 | STORY-008, 009, 010 | 21 Nov |
| M4 | STORY-011, 014, 015, then demo prep | 24 Nov |

Each milestone ends with: a summary, links, everything committed and pushed, the framework and its artifact
updated with current screenshots, and a short HTML presentation (three to five minutes, with charts and a story
line) for the audience.

### Milestone 1 against its fifteen acceptance criteria (2026-11-11)

All fifteen ticked in `progress.json` with the platform's exact wording, one commit per story, each naming its
story; the portal verified all five on 2026-11-11 against those commits. The portal's record is committed unedited.

| Story | What passes | Commit | Proof |
|---|---|---|---|
| STORY-001 Help desk (REQ-002) | A user reports an issue and gets a reference, a named person, a deadline and matching help; checking the reference shows it resolved; every interaction is in the hash-chained audit log | 26bb333 | `tests/story-001-helpdesk.test.mjs`, `tests/store.test.mjs`, walk |
| STORY-012 Support and maintenance (REQ-001) | Tickets tracked against service levels; maintenance only outside service hours and never overlapping; overdue and late flagged; all logged | 3aff0b1 | `tests/story-012-support.test.mjs`, walk |
| STORY-002 Monitoring (REQ-003) | Real checks (5 s limit, one retry) show availability and response time; an outage opens one incident and raises an alert; samples archived and append-only | a8fb1d4 | `tests/story-002-monitoring.test.mjs`, walk |
| STORY-003 Performance reports (REQ-005) | Computed from the period's recorded data; refused with an error naming what is missing; archived once with a SHA-256 checked on opening | b07c1e0 | `tests/story-003-reports.test.mjs`, walk |
| STORY-004 Feature development (REQ-006) | Feedback becomes a change released only with a recorded check that it meets the need; infeasible requests answered with the reason; every step documented | 9f87093 | `tests/story-004-features.test.mjs`, walk |

Limits stated in each story's enrichment file: the store is per browser (no shared backend yet); service levels
and service hours are proposals; monitoring checks the site itself because CRIS is not reachable; "meets user needs"
is a recorded statement at release, not a measured outcome.

### STORY-000 against its five acceptance criteria (2026-11-11)

All five ticked in `progress.json` because each holds in the repo, and the portal verified the story on 2026-11-11.

| Criterion | Evidence |
|---|---|
| Every tab reachable, every card drills down one level | Browser walk: 9 tabs, 65 cards, each card opens its own page |
| Sample data visibly labelled | A banner on every tab and a tag on every card; none in Real mode |
| Every tab reads plan.json and progress.json at runtime, both committed | A story removed from the plan file disappears from the page |
| manifest.json committed; data age shown, warning past a week | Every tab warns on a manifest nine days old |
| Trust: nothing shown that the project has not produced | Systems grey and not checked; agents "no runs recorded"; no dates because the file has none |

The portal's own record (downloaded with Get my progress.json and committed unedited) has oddities worth raising
with Ali: after M1 its totals say 35 criteria with 5 passed although 20 are ticked and 6 stories are verified; each
verified story page still reads "0 of 3 confirmed"; STORY-000 is credited to the first commit (f07db58); and the
unbuilt stories are marked "in progress".

## 4. How it is built

- A static site with no build step and no dependencies: `index.html` at the repo root, modules under `assets/js/`.
  One data layer (`assets/js/data.js`) loads the three `.colaberry/` files at runtime; no tab holds plan content.
- Every tab and every drill-down has its own address (`#/overview`, `#/overview/release/r0`).
- Real and Sample modes. Sample keeps the real plan's shape and fills in made-up dates, states and points.
- The workspace (`workspace/`, Milestone 1): one page per story, drawing only what the functions in `lib/` return.
  `lib/store.js` holds the tables of the data model in the browser (localStorage), checks every write against
  `content/data-model.json`, and appends every write to a SHA-256 hash-chained audit log in the same save.
  Synthetic people only (`content/demo-people.json`); nothing reaches TxDOT.
- Checks: 32 unit tests (`node --test tests/`): the data layer, the store, and each M1 story's happy path, Trust
  line and failure paths. Two browser walks through Playwright: `tests/browser-walk.js` (Command Center: 9 tabs,
  67 cards, sample labels, stale data, deleted story, missing file, phone width) and `tests/workspace-walk.js`
  (every M1 story from an empty store, the outage drill, a tampered audit line, phone width). All pass, 2026-11-11.
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
| 2026-11-11 | The 18 proposed tables are created as proposed (no changes requested); AuditEntry and MaintenanceWindow are added because the M1 stories need them | Obi |
| 2026-11-11 | The workspace runs in the browser with a localStorage store and synthetic people, so the public site demonstrates every story and nothing reaches TxDOT | Claude |
| 2026-11-11 | Every write is saved together with its hash-chained audit line or not at all; events, samples and reports are append-only | Claude |
| 2026-11-11 | Service levels (4, 8, 24, 72 hours) and service hours (Mon to Fri, 6:00 to 20:00 Central) are proposals in one file, marked on screen, until TxDOT confirms | Claude |
| 2026-11-11 | No Basecamp ticket for CRIS: milestone updates go to Ali through the portal | Ali, as relayed by Obi |
| 2026-11-11 | The portal's push webhook is registered from GitHub's settings page, so `gh` is not needed | Obi |

## 6. Blockers and owners

| Blocker | Effect | Owner | Next step |
|---|---|---|---|
| Service levels and service hours unconfirmed | The workspace uses proposed values, labelled as such | TxDOT, through Ali | Confirm or replace the values in `lib/sla.js` and `lib/support.js` |
| `plan.json` has no schedule, release dates or due dates | The Overview shows no dates; the Project management tab would have an empty Gantt | Ali / the platform | See whether the first sync after connecting delivers dates; if not, ask Ali |

## 7. Timeline

| Date | What happened |
|---|---|
| 2026-11-08 | Ali grants builder access on the portal and points Obi at STORY-000 |
| 2026-11-11 | **Milestone 1 verified.** The 18 tables created as proposed (plus AuditEntry and MaintenanceWindow); the workspace built: help desk (001), support dashboard (012), monitoring (002), performance reports (003), feature development (004), audit log; 32 unit tests and both browser walks pass; one commit per story pushed; **the portal verified all five, 250 points** (300 on this build); the portal's record committed; push webhook registered; framework artifact v4 |
| 2026-11-11 | Obi said "build the rest". Repo `OBIANAMS04/cris-enhancement` created (public) in the browser, pushed, connected to the portal; the other eight tabs built; a browser walk of 9 tabs and 65 cards passes; all five criteria ticked; **STORY-000 verified by the portal, 50 points**; GitHub Pages live at https://obianams04.github.io/cris-enhancement/; the portal's progress record committed. Guided-tour button gets a play icon (standing rule) |
| 2026-11-10 | SSS closed out. CRIS project folder created; plan documents downloaded from the portal; the Command Center data layer, shell and Overview built and checked locally (11 unit tests, browser walk with no failures); first local commit. Waiting on GitHub sign-in to create the repo, connect it in the portal, register the push webhook and turn on GitHub Pages |

## 8. Risks

| Risk | Effect | Action |
|---|---|---|
| 10 stories in the 13 days to 24 Nov | The ship-by date is tight | Release 0 and half of Release 1 done on 11 Nov; milestones of four, three and three stories remain |
| The workspace store is per browser | Two people do not share tickets yet | Said on screen; a shared backend replaces the store's backend without touching the stories' logic |
| The stories name integrations (TxDOT IT infrastructure, TxDOT financial systems, Euna Procurement, incident management) that this project cannot reach | A demo could imply connections that do not exist | Build against synthetic stand-ins behind a clear interface, label them, and keep every indicator grey and "not checked from here" until a real system reports |
| The plan's requirements read as written for the delivered CRIS service, and also for handling the solicitation response itself (REQ-012 to 015) | Scope could be misread | Follow the story files as written; raise mismatches with Ali rather than reinterpreting |
| The repo is public | Anything committed is visible to anyone | No secrets, keys or `.env` files, ever; the push-webhook secret is run once and never saved |

## 9. Screens (2026-11-11)

Milestone 1, taken by `tests/workspace-walk.js` (`m1-` files): 01 help desk assistance, 02 a resolved ticket,
03 support dashboard, 04 monitoring with the outage alert, 05 a report refused for missing data, 06 a performance
report with its hash check, 07 a released feature, 08 the audit log, 09 a tampered line caught, 10 phone width;
11 the portal showing STORY-001 completed.

Command Center:

All in `framework/screens/`, taken by `tests/browser-walk.js`: 01 Overview, 02 Outcomes, 03 Users, 04 Guardrails,
05 Systems, 06 Project management, 07 AI agents, 08 Knowledge base question panel, 09 Data model, 10 a guardrail
drill-down, 11 a data-model entity, 12 to 14 sample mode, 15 the stale-data warning, 16 phone width.

## 10. Links

- Portal: https://enterprise.colaberry.ai/portal/projects/workspace/a563218c-c3a4-433c-8ed7-4e8e0573f59c/STORY-001 (next: STORY-005)
- Workspace (live): https://obianams04.github.io/cris-enhancement/workspace/
- Framework artifact (pinned): https://claude.ai/artifact/AZJzCgHVd2QAr4LnFCRzzf
- GitHub repo: https://github.com/OBIANAMS04/cris-enhancement
- Command Center (live): https://obianams04.github.io/cris-enhancement/

## How this document is maintained

Updated by Claude after every milestone, together with the published framework artifact, and committed with that
milestone's work.
