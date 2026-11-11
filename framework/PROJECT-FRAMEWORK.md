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
| **r1** Enhancement and Training | 004 Feature Development Module · 005 User Training Sessions | 10 to 12 Nov | **Complete.** 004 and 005 **verified 2026-11-11**, 50 points each |
| **r2** Reporting and Compliance | 006 Reporting Engine · 007 Compliance with Laws · 013 Required Documentation | 13 to 16 Nov | **Complete.** 006, 007 and 013 **verified 2026-11-11**, 50 points each |
| **r3** Response Management | 008 Response Submissions · 009 Evaluate and Score Responses | 18 to 20 Nov | Not started |
| **r4** Risk Management and Security | 010 Risk Assessment Tools · 011 Cybersecurity Compliance · 014 Performance and User-Error Risks · 015 Incident Reports and Risk Documentation | 21 to 24 Nov | Not started |

### Milestones (three to five stories at a time)

| Milestone | Contents | Target |
|---|---|---|
| M0 | STORY-000: the Command Center, all nine tabs, verified by the portal | **Done 2026-11-11** |
| M1 | STORY-001, 002, 003, 012 and 004: the workspace (help desk, support, monitoring, reports, features) | **Done 2026-11-11**, all five verified, 250 points |
| M2 | STORY-005, 006, 007, 013: training, reporting engine, compliance, documents | **Done 2026-11-11**, all four verified, 200 points (10 of 16 stories, 500 points on this build) |
| M3 | STORY-008, 009, 010 | 21 Nov (next) |
| M4 | STORY-011, 014, 015, then demo prep | 24 Nov |

Each milestone ends with: a summary, links, everything committed and pushed, the framework and its artifact
updated with current screenshots, and a short HTML presentation (three to five minutes, with charts and a story
line) for the audience.

### Milestone 2 against its twelve acceptance criteria (2026-11-11)

All twelve ticked in `progress.json`, one commit per story, each naming its story, after a groundwork commit
(e470493: the data-model fields, the three demo roles and the shared pieces). The portal verified all four on
2026-11-11, 50 points each, 200 for the milestone. The push webhook worked: the four stories verified within
seconds of the push, without pressing Sync from GitHub. The portal's record is committed unedited (afa8035).

| Story | What passes | Commit | Proof |
|---|---|---|---|
| STORY-005 Training (REQ-007, `#/training`) | Sessions are scheduled with materials (four courses in `content/training-materials.json`, including the cyber security programme), optionally linked to the feature they teach. A session cannot be marked held without a recording. Staff complete training only by passing a knowledge check at 80% or more, live or from the recording. Every attempt and completion is logged. Completing the cyber course records the date on the person (REQ-020) | 4d2a08a | `tests/story-005-training.test.mjs` (4), `tests/workspace-walk-m2.js` |
| STORY-006 Reporting engine (REQ-009, `#/reporting-engine`) | Five report specifications (`content/report-specs.json`): system performance, incident log, help desk and support activity, training and cyber security completion, contract cost summary. Sections are built from recorded data and checked against the spec before archiving. A report that cannot meet its spec is refused and logged as an incident on the reporting engine, addressed by a later successful run or by hand with the cause. The cost summary needs the TxDOT financial system (REQ-011), which is not reachable, so it is refused and logged. Archived reports are unchangeable, with a SHA-256 | 62097be | `tests/story-006-reporting-engine.test.mjs` (4), walk |
| STORY-013 Document management (REQ-013, `#/documents`) | Response documents are filed by category (technical proposal, pricing, forms and certifications, HUB subcontracting plan, cyber security training records, other), hashed, stored in the browser's IndexedDB and read back before the upload counts. A replacement keeps the old version, marked superseded. Wrong types, empty files and files over 10 MB are refused. Opening is timed against the 2 s target and hash-checked. Only the compliance officer, procurement officer, TxDOT contract manager and system administrator may upload or open; refusals are logged | fe53baa | `tests/story-013-documents.test.mjs` (4), walk |
| STORY-007 Compliance with laws (REQ-010, `#/compliance`) | A register of 14 rules (`content/compliance-rules.json`), compiled from official public sources by a research agent, to be confirmed by TxDOT legal, not legal advice. Mechanical checks run against the live store (vendor cyber training, audit controls, retention, an automated accessibility scan). Rules about records this build does not hold are "not applicable" with that reason. A run on the workspace finds no violations. A legal update raises the rule version and re-checks it at once; older checks show as stale | a0fb8ce | `tests/story-007-compliance.test.mjs` (6), walk |

The 14 rules: Tex. Transp. Code §550.062 and §550.065 (two rules); the Driver's Privacy Protection Act, 18 U.S.C.
§2721; Transp. Code ch. 730; Gov't Code ch. 552; 23 U.S.C. §407; Gov't Code §2063.104 (formerly §2054.5192, vendor
cyber training, supports REQ-020); Gov't Code §2063.408 (TX-RAMP, formerly §2054.0593); 1 TAC ch. 202 (transferred
to ch. 477 effective 1 Aug 2026); Bus. & Com. Code ch. 521; Gov't Code §441.185 with the TxDOT retention schedule;
1 TAC §§213.10 and 206.50; 28 C.F.R. §35.200. The research found no local rule that clearly governs CRIS.

The cross-story drill in `tests/workspace-walk-m2.js`: a legal update tightening vendor training to 30 days raises
a violation; a cyber refresher completed on the Training page clears it.

Limits: the compliance register is a research compilation, not legal advice, until TxDOT legal confirms it; the
cost summary cannot be built until the TxDOT financial system is reachable; the store and the document files are
per browser.

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
- Milestone 2 adds four pages to the workspace: Training (`#/training`), Reporting engine
  (`#/reporting-engine`), Documents (`#/documents`) and Compliance (`#/compliance`), each drawing only what the
  functions in `lib/` return. Content files: `content/training-materials.json`, `content/report-specs.json`,
  `content/compliance-rules.json`. Documents are stored in the browser's IndexedDB and read back before an upload
  counts. Fields added to the data model for these stories are each marked with their story; TrainingAttendance
  gained an id. Three synthetic demo roles were added: Taylor (contract manager), Morgan (compliance officer) and
  Quinn (procurement officer).
- Checks: 50 unit tests (`node --test tests/`): the data layer, the store, and each story's happy path, Trust
  line and failure paths. Three browser walks through Playwright: `tests/browser-walk.js` (Command Center: 9 tabs,
  67 cards, sample labels, stale data, deleted story, missing file, phone width), `tests/workspace-walk.js`
  (every M1 story from an empty store, the outage drill, a tampered audit line, phone width) and
  `tests/workspace-walk-m2.js` (the four M2 stories, including the cross-story compliance drill, and phone width).
  All pass, 2026-11-11.
- Background agents: each milestone uses one to three, with notifications shown in the chat. M2 used three: the
  tour narrator, the compliance research, and this framework update.
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
| 2026-11-11 | Understanding of training is measured by a knowledge check (80% or more, live or from the recording), not by attendance | Claude |
| 2026-11-11 | A training session cannot be marked held without a recording | Claude |
| 2026-11-11 | A report that cannot meet its spec is refused and logged as an incident on the reporting engine, then addressed by a later successful run or by hand with the cause | Claude |
| 2026-11-11 | A compliance rule about records this build does not hold is "not applicable" with that reason, never a pass | Claude |
| 2026-11-11 | The compliance register is compiled from official public sources and shown as to be confirmed by TxDOT legal, not legal advice | Claude |
| 2026-11-11 | Every guided tour has a male voice narrator (added to the tour snippet `framework/tour-snippet.html`, the M0+M1 deck, the SSS framework and briefing) | Obi |
| 2026-11-11 | Each milestone uses one to three background agents whose notifications show in the chat, and ends with an exciting 3 to 5 minute HTML presentation with charts | Obi |

## 6. Blockers and owners

| Blocker | Effect | Owner | Next step |
|---|---|---|---|
| Service levels and service hours unconfirmed | The workspace uses proposed values, labelled as such | TxDOT, through Ali | Confirm or replace the values in `lib/sla.js` and `lib/support.js` |
| The contract manager's real list of required reports is not known | The five report specifications are proposals | TxDOT, through Ali | Send the real list; replace `content/report-specs.json` |
| No access to the TxDOT financial system (REQ-011) | The contract cost summary is refused and logged as an incident | TxDOT, through Ali | Say whether and how access can be given |
| The compliance register is not confirmed by TxDOT legal | The 14 rules are a research compilation, not legal advice | TxDOT legal, through Ali | Review `content/compliance-rules.json` |
| `plan.json` has no schedule, release dates or due dates | The Overview shows no dates; the Project management tab would have an empty Gantt | Ali / the platform | See whether the first sync after connecting delivers dates; if not, ask Ali |

## 7. Timeline

| Date | What happened |
|---|---|
| 2026-11-08 | Ali grants builder access on the portal and points Obi at STORY-000 |
| 2026-11-11 | **Milestone 2 verified.** Groundwork (e470493); training (005), reporting engine (006), document management (013) and compliance with laws (007) built, one commit per story; 14 compliance rules compiled by a research agent; 50 unit tests and three browser walks pass, including the cross-story compliance drill; **the portal verified all four within seconds of the push, without Sync from GitHub, 200 points** (500 on this build, 10 of 16 stories); the portal's record committed (afa8035). New standing rules from Obi: male voice narrator on every tour, one to three background agents per milestone, an HTML presentation at every milestone end. Releases r1 and r2 complete. Presentation: https://obianams04.github.io/cris-enhancement/framework/presentations/m2/ |
| 2026-11-11 | **Milestone 1 verified.** The 18 tables created as proposed (plus AuditEntry and MaintenanceWindow); the workspace built: help desk (001), support dashboard (012), monitoring (002), performance reports (003), feature development (004), audit log; 32 unit tests and both browser walks pass; one commit per story pushed; **the portal verified all five, 250 points** (300 on this build); the portal's record committed; push webhook registered; framework artifact v4 |
| 2026-11-11 | Obi said "build the rest". Repo `OBIANAMS04/cris-enhancement` created (public) in the browser, pushed, connected to the portal; the other eight tabs built; a browser walk of 9 tabs and 65 cards passes; all five criteria ticked; **STORY-000 verified by the portal, 50 points**; GitHub Pages live at https://obianams04.github.io/cris-enhancement/; the portal's progress record committed. Guided-tour button gets a play icon (standing rule) |
| 2026-11-10 | SSS closed out. CRIS project folder created; plan documents downloaded from the portal; the Command Center data layer, shell and Overview built and checked locally (11 unit tests, browser walk with no failures); first local commit. Waiting on GitHub sign-in to create the repo, connect it in the portal, register the push webhook and turn on GitHub Pages |

## 8. Risks

| Risk | Effect | Action |
|---|---|---|
| 6 stories in the 13 days to 24 Nov | The ship-by date is tight | Releases r0, r1 and r2 done on 11 Nov (10 of 16 stories); M3 (008, 009, 010) and M4 (011, 014, 015, then demo prep) remain |
| The compliance register is a research compilation | It could be read as legal advice | Shown on screen as to be confirmed by TxDOT legal; rules about records this build does not hold are "not applicable", never a pass |
| The workspace store is per browser | Two people do not share tickets yet | Said on screen; a shared backend replaces the store's backend without touching the stories' logic |
| The stories name integrations (TxDOT IT infrastructure, TxDOT financial systems, Euna Procurement, incident management) that this project cannot reach | A demo could imply connections that do not exist | Build against synthetic stand-ins behind a clear interface, label them, and keep every indicator grey and "not checked from here" until a real system reports |
| The plan's requirements read as written for the delivered CRIS service, and also for handling the solicitation response itself (REQ-012 to 015) | Scope could be misread | Follow the story files as written; raise mismatches with Ali rather than reinterpreting |
| The repo is public | Anything committed is visible to anyone | No secrets, keys or `.env` files, ever; the push-webhook secret is run once and never saved |

## 9. Screens (2026-11-11)

Milestone 2, in `framework/screens/` (`m2-` files): 01 a training session, 02 the reporting engine refusing a
report and logging the incident, 03 a report built to its spec, 04 the documents library, 05 a document opened with
its hash check, 06 compliance with no violations, 07 compliance after a legal update, 08 compliance at phone width,
09 the portal showing STORY-007 completed.

Milestone 1, taken by `tests/workspace-walk.js` (`m1-` files): 01 help desk assistance, 02 a resolved ticket,
03 support dashboard, 04 monitoring with the outage alert, 05 a report refused for missing data, 06 a performance
report with its hash check, 07 a released feature, 08 the audit log, 09 a tampered line caught, 10 phone width;
11 the portal showing STORY-001 completed.

Command Center:

All in `framework/screens/`, taken by `tests/browser-walk.js`: 01 Overview, 02 Outcomes, 03 Users, 04 Guardrails,
05 Systems, 06 Project management, 07 AI agents, 08 Knowledge base question panel, 09 Data model, 10 a guardrail
drill-down, 11 a data-model entity, 12 to 14 sample mode, 15 the stale-data warning, 16 phone width.

## 10. Links

- Portal: https://enterprise.colaberry.ai/portal/projects/workspace/a563218c-c3a4-433c-8ed7-4e8e0573f59c/STORY-001 (next: STORY-008: https://enterprise.colaberry.ai/portal/projects/workspace/a563218c-c3a4-433c-8ed7-4e8e0573f59c/STORY-008)
- Workspace (live): https://obianams04.github.io/cris-enhancement/workspace/
- Milestone 2 presentation: https://obianams04.github.io/cris-enhancement/framework/presentations/m2/
- Framework artifact (pinned): https://claude.ai/artifact/AZJzCgHVd2QAr4LnFCRzzf
- GitHub repo: https://github.com/OBIANAMS04/cris-enhancement
- Command Center (live): https://obianams04.github.io/cris-enhancement/

## How this document is maintained

Updated by Claude after every milestone, together with the published framework artifact, and committed with that
milestone's work.
