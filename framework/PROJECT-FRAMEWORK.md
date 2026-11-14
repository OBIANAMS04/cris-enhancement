# CRIS Enhancement — Project Framework

**Solicitation:** Crash Records Information System Service Agreement (TxDOT) · **Bidder:** Colaberry
**Owner:** Obi Anamelechi Kingsley · **Decision makers:** Ali Muwwakkil (Managing Director), Ram Katamaraja
**Ship-by:** 24 November 2026 · **Last updated:** 2026-11-14 · Updated after every milestone

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
| **r3** Response Management | 008 Response Submissions · 009 Evaluate and Score Responses | 18 to 20 Nov | **Complete.** 008 and 009 **verified 2026-11-12**, 50 points each |
| **r4** Risk Management and Security | 010 Risk Assessment Tools · 011 Cybersecurity Compliance · 014 Performance and User-Error Risks · 015 Incident Reports and Risk Documentation | 21 to 24 Nov | **All four verified.** 010 on 12 Nov; 011, 014 and 015 on 14 Nov (Milestone 4), 50 points each. All 16 stories verified |

### Milestones (three to five stories at a time)

| Milestone | Contents | Target |
|---|---|---|
| M0 | STORY-000: the Command Center, all nine tabs, verified by the portal | **Done 2026-11-11** |
| M1 | STORY-001, 002, 003, 012 and 004: the workspace (help desk, support, monitoring, reports, features) | **Done 2026-11-11**, all five verified, 250 points |
| M2 | STORY-005, 006, 007, 013: training, reporting engine, compliance, documents | **Done 2026-11-11**, all four verified, 200 points (10 of 16 stories, 500 points on this build) |
| M3 | STORY-008, 009, 010: response submissions, evaluation and scoring, risk assessment | **Done 2026-11-12**, all three verified, 150 points (13 of 16 stories, 650 points on this build) |
| M4 | STORY-011, 014, 015, then demo prep | **Done 2026-11-14: all three verified by the portal, 150 points; 16 of 16 stories, 800 points, 50 of 50 criteria.** Demo prep for 24 Nov is next |

Each milestone ends with: a summary, links, everything committed and pushed, the framework and its artifact
updated with current screenshots, and a short HTML presentation (three to five minutes, with charts and a story
line) for the audience.

### Milestone 4 against its nine acceptance criteria (2026-11-14)

Built and pushed on 14 Nov 2026, one commit per story, each naming its story, after a groundwork commit (9660530:
the data-model fields, the new demo person and the shared pieces). All three were verified by
the portal through the push webhook.
Status: all three verified by the portal on 14 Nov 2026 through the push webhook (011: 341fd4c, 014: 5a1a8d6, 015: 15a6d44), 50 points each. With them the build is complete: 16 of 16 stories verified, 800 points, 50 of 50 criteria passed, ten days before the 24 Nov ship date.

| Story | What passes | Commit | Proof |
|---|---|---|---|
| STORY-011 Cybersecurity compliance (REQ-020, `#/security`) | Vendor staff are cleared for protected work only with TxDOT-approved cyber security training completed in the last 365 days. Without it, opening or uploading response documents is refused and logged with the reason (enforced in `lib/documents.js`). A security officer can require retraining after a breach, which suspends clearance until the course is passed again. A breach is logged as a severity-1 security incident, contained, and notified within 60 days when personal data is involved (Tex. Bus. & Com. Code §521.053). It cannot be closed until the notification is recorded. Training completions are archived in versioned reports with SHA-256. New demo person: Sage (security officer) | 341fd4c | `tests/story-011-cyber.test.mjs` (4), `tests/workspace-walk-m4.js` |
| STORY-014 Performance and user-error risks (REQ-016, `#/performance`) | Each component's response time is compared with its own baseline (median and MAD of earlier samples). An anomaly is over 3x the median, over the median plus 6 MADs, and at least 50 ms above; 5 samples are needed first. One alert per component is raised for investigation and cleared when normal. A slow-response drill records a labelled synthetic sample. Every refused action anywhere in the workspace is logged as a user error with "Try this:" suggestions computed from data: the next valid maintenance window, a period with data, the missing documents, the course to take | 5a1a8d6 | `tests/story-014-anomalies.test.mjs` (4), walk |
| STORY-015 Incident reports and risk documentation (REQ-019, `#/incident-reports`) | A report per incident with its details, the full timeline from the audit log, hours open, cause and linked risks, with a SHA-256. Each new report on the same incident is a new version that names the one it supersedes. Incident reports, risk assessments and the training archive open only for the compliance officer, risk manager, security officer, TxDOT manager, contract manager and system administrator. Every opening and every refusal is logged | 15a6d44 | `tests/story-015-incident-reports.test.mjs` (3), walk |

TxDOT's incident management system (REQ-018) is not connected; reports are built from the workspace's own incidents.

Checks: 73 unit tests pass and five browser walks pass (`tests/browser-walk.js`, `workspace-walk.js`, `-m2.js`, `-m3.js`
and `-m4.js`). The walks were made sturdier this milestone: they reload after clearing the demo store (a stale
in-memory store had masked a timing issue), the M1 walk picks a weekday for its service-hours check, and the M2 walk
waits for the monitoring check before asking for a report. The Reporting engine archive now lists only reports built
to its specifications.

The CRIS framework page source now lives in the repo at `framework/PROJECT-FRAMEWORK.html`. The scratchpad copy was
lost on 14 Nov and was recovered from the published artifact.

Limits: the 365-day and 60-day periods follow the cited rules but are not confirmed by TxDOT; the anomaly thresholds
are ours; the incident management system (REQ-018) is not connected; the store and the document files are per browser.

### Milestone 3 against its nine acceptance criteria (2026-11-12)

All nine ticked in `progress.json`, one commit per story, each naming its story, after a groundwork commit
(365ce4d: the data-model fields, the new demo person and the shared pieces). The portal verified all three on
2026-11-12 (UTC) through the push webhook, 50 points each, 150 for the milestone. The portal's record is committed
unedited (382b60b).

| Story | What passes | Commit | Proof |
|---|---|---|---|
| STORY-008 Manage response submissions (REQ-012, REQ-015, `#/submissions`) | A procurement officer or contract manager records each response. It is checked first: before the closing time, all required documents present (technical proposal, pricing, forms and certifications, HUB subcontracting plan), accepted file types and sizes. Files are stored and read back by hash. The response and its documents are saved together with a SHA-256 receipt, re-checked on the response page. A failed submission is logged as an incident per respondent, addressed by that respondent's next valid submission or by hand. A retried submission is not stored twice. Every submission, document and status change (submitted, under evaluation, awarded, not awarded) is in the audit log. Settings are in `content/solicitation.json` (demo closing time 3 pm Central, 20 Nov 2026) | 3d3dacd | `tests/story-008-submissions.test.mjs` (4), `tests/workspace-walk-m3.js` |
| STORY-009 Evaluate and score responses (REQ-014, `#/evaluation`) | Weighted criteria total 100. Evaluators (procurement officer, contract manager, TxDOT manager) score each 0 to 10. Weighted score = sum of weight x mean / 10, out of 100. Best value is the highest complete score; ties are flagged. A score more than 4 points from the other evaluators is flagged. Only its own evaluator can correct a score, with a reason, as a new score linked to the one it replaces; nothing is overwritten. The archive (ranking, every score, SHA-256) is allowed only when all responses are fully scored and every flag is resolved | 54ec087 | `tests/story-009-evaluation.test.mjs` (4), walk |
| STORY-010 Risk assessment tools (REQ-017, REQ-016, `#/risk`) | An assessment reads the live system for six conditions (below). Each finding is a Risk with likelihood, impact, a score from 1 to 9, evidence, an owner and a mitigation plan, shown on a heat map. A risk is mitigated when its condition is gone at the next assessment, or when the owner records the action. A score of 9, or a risk open past 7 days, is logged for review. Every assessment is archived with a SHA-256 | 5cbf603 | `tests/story-010-risk.test.mjs` (4), walk |

The six conditions the risk assessment reads: open incidents; availability under 99%; slow responses; user error
(reopened tickets, failed knowledge checks); operator error (late or overdue maintenance, open report errors);
security and compliance gaps (lapsed vendor cyber training, compliance violations).

Where the criteria come from. The evaluation criteria in `content/procurement-rules.json` were compiled by a research
agent from public sources: Tex. Gov't Code §2155.074 (best value; price and meeting specifications are principal
factors), §2155.075 and §2157.003 (IT best value); the Comptroller Procurement and Contract Management Guide; and
documented TxDOT examples (RFO 601440000054109: approach 50, lead time 10, price 40; a 2013 TxDOT IT services RFO
with pricing at 30%). No CRIS-specific weights are public. The demo criteria are a proposal: technical approach and
compliance 35, experience and past performance 15, key personnel 10, security, delivery and business continuity 10,
price 30. Evaluator NDA and conflict rules were found only in the HHS handbook, not for TxDOT.

Euna Procurement (formerly Bonfire). TxDOT does use it: the research found TxDOT pages and RFOs that require
submission through Euna. No public Euna API documentation was found, so the integration is not connected and
tracking happens in the workspace.

The cross-story drill in `tests/workspace-walk-m3.js`: an incomplete submission is logged and then fixed; a typo
score is flagged and corrected before archiving; an outage drill raises a score-9 risk that is logged for review and
then mitigated.

Limits: the evaluation weights and the closing time are proposals until TxDOT confirms them; the risk matrix is ours,
not TxDOT's; Euna is not connected; the store and the document files are per browser.

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
- Milestone 3 adds three pages to the workspace: Submissions (`#/submissions`), Evaluation (`#/evaluation`) and
  Risk (`#/risk`), each drawing only what the functions in `lib/` return. Content files:
  `content/solicitation.json` (closing time and required documents) and `content/procurement-rules.json`
  (evaluation criteria and their sources). A submission is saved with a SHA-256 receipt; scores are append-only, and a
  correction is a new score linked to the one it replaces. Risks are read from the live system, not typed in. One new
  synthetic demo person: Rowan (risk manager). Fields added to the data model for these stories, each marked with
  its story: the receipt, the score id, what it corrects and why, and the risk's source, score, evidence and review
  date.
- Milestone 4 adds three pages to the workspace: Security (`#/security`), Performance (`#/performance`) and
  Incident reports (`#/incident-reports`), each drawing only what the functions in `lib/` return. Clearance is
  enforced where documents are opened or uploaded (`lib/documents.js`), not only shown on a page. Every refused action
  in the workspace is logged as a user error, with suggestions computed from the data. Incident reports are versioned
  and hashed. One new synthetic demo person: Sage (security officer).
- Checks: 73 unit tests (`node --test tests/`): the data layer, the store, and each story's happy path, Trust
  line and failure paths. Five browser walks through Playwright, all passing 2026-11-14 (the first four are described
  here as at M3, and `tests/workspace-walk-m4.js` walks the three M4 pages): `tests/browser-walk.js` (Command Center: 9 tabs,
  67 cards, sample labels, stale data, deleted story, missing file, phone width), `tests/workspace-walk.js`
  (every M1 story from an empty store, the outage drill, a tampered audit line, phone width),
  `tests/workspace-walk-m2.js` (the four M2 stories, including the cross-story compliance drill, and phone width)
  and `tests/workspace-walk-m3.js` (the three M3 stories: an incomplete submission logged then fixed, a typo score
  flagged and corrected before archiving, and an outage drill raising a score-9 risk logged for review then
  mitigated).
- Background agents: each milestone uses one to three, with notifications shown in the chat. M3 used three: the
  tour rebuild, the procurement research, and this framework update. M4 used two: the tour fixes (Oge, fixed
  controls, pointer pacing) and this framework update.
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
| 2026-11-12 | Every submission gets a SHA-256 receipt, saved with the response and re-checked on the response page; a retried submission is not stored twice | Claude |
| 2026-11-12 | Corrections never overwrite scores: a correction is a new score linked to the one it replaces, with a reason, and only the original evaluator may make it | Claude |
| 2026-11-12 | Evaluation criteria and weights are a proposal built from public Texas procurement sources and shown as such, until TxDOT gives the real ones | Claude |
| 2026-11-12 | Risks are tied to live conditions and mitigated automatically when the condition is gone at the next assessment; otherwise the owner records the action | Claude |
| 2026-11-12 | The guided-tour narrator is "OBI" ("Hi, I am OBI..."), a NotebookLM-style two-host conversation (OBI leads, co-host Nia) in a deeper natural male voice. The narrator panel docks to the left beside the content with no overlay up to 125% zoom. The progress gauge and an animated cursor are synchronised with the voice | Obi |
| 2026-11-14 | Compliance is enforced at the point of access: opening or uploading a response document is refused and logged without current cyber training, not only reported on a page | Claude |
| 2026-11-14 | Anomaly thresholds: a component's response time is compared with its own baseline (median and MAD of earlier samples). An anomaly is over 3x the median, over the median plus 6 MADs, and at least 50 ms above, with 5 samples needed. One alert per component, cleared when normal | Claude |
| 2026-11-14 | "Try this:" suggestions for user errors are computed from the data (next valid maintenance window, a period with data, missing documents, the course to take), never fixed text | Claude |
| 2026-11-14 | Incident reports are version-controlled: each new report on the same incident is a new version that names the one it supersedes, with its own SHA-256 | Claude |
| 2026-11-14 | The tour co-host is renamed from Nia to Oge; the narrator panel's controls sit in a fixed bar that never covers text at any zoom; the pointer keeps pace with the voice. A background agent is applying these to every tour | Obi |

## 6. Blockers and owners

| Blocker | Effect | Owner | Next step |
|---|---|---|---|
| Service levels and service hours unconfirmed | The workspace uses proposed values, labelled as such | TxDOT, through Ali | Confirm or replace the values in `lib/sla.js` and `lib/support.js` |
| The contract manager's real list of required reports is not known | The five report specifications are proposals | TxDOT, through Ali | Send the real list; replace `content/report-specs.json` |
| No access to the TxDOT financial system (REQ-011) | The contract cost summary is refused and logged as an incident | TxDOT, through Ali | Say whether and how access can be given |
| The compliance register is not confirmed by TxDOT legal | The 14 rules are a research compilation, not legal advice | TxDOT legal, through Ali | Review `content/compliance-rules.json` |
| The real evaluation criteria and weights for this solicitation are not known | The evaluation page uses a proposed set built from public sources | TxDOT, through Ali | Send them; replace `content/procurement-rules.json` |
| Unknown whether submissions must flow through Euna Procurement, and whether an API or export is available | Euna is not connected; submissions are tracked in the workspace | TxDOT, through Ali | Say whether Euna is required and whether an API or export exists |
| TxDOT's risk matrix is not known | The risk page uses our own likelihood and impact scale (1 to 9) | TxDOT, through Ali | Send the matrix; adjust the scoring |
| Ali has not replied to the M1 to M3 updates | The questions to TxDOT above are still open | Ali | Ask again through the portal Messages, with the M4 update |
| TxDOT's incident management system (REQ-018) is not reachable | Incident reports are built from the workspace's own incidents; the system is not connected | TxDOT, through Ali | Say whether and how access can be given |
| `plan.json` has no schedule, release dates or due dates | The Overview shows no dates; the Project management tab would have an empty Gantt | Ali / the platform | See whether the first sync after connecting delivers dates; if not, ask Ali |

## 7. Timeline

| Date | What happened |
|---|---|
| 2026-11-08 | Ali grants builder access on the portal and points Obi at STORY-000 |
| 2026-11-14 | **Milestone 4 verified; the build is complete: 16 of 16 stories, 800 points.** Groundwork (9660530); cybersecurity compliance (011, 341fd4c), performance and user-error risks (014, 5a1a8d6) and incident reports and risk documentation (015, 15a6d44) built, one commit per story; 73 unit tests and five browser walks pass, the walks made sturdier; after Obi signed the portal back in, all three were confirmed verified: 16 of 16 stories, 50 of 50 criteria, 800 points. The CRIS framework page source now lives in the repo (`framework/PROJECT-FRAMEWORK.html`). New standing rules from Obi: co-host renamed from Nia to Oge, the narrator panel's controls in a fixed bar that never covers text, the pointer keeps pace with the voice; a background agent is applying them to every tour. Presentation: https://obianams04.github.io/cris-enhancement/framework/presentations/m4/ |
| 2026-11-12 | **Milestone 3 verified.** Groundwork (365ce4d); response submissions (008, 3d3dacd), evaluation and scoring (009, 54ec087) and risk assessment tools (010, 5cbf603) built, one commit per story; procurement criteria compiled by a research agent from public sources; Euna Procurement researched (TxDOT does use it, no public API found, not connected); 62 unit tests and four browser walks pass; **the portal verified all three through the push webhook, 150 points** (650 on this build, 13 of 16 stories); the portal's record committed (382b60b). Release r3 complete; r4 has 010 done and 011, 014, 015 left. New standing rules from Obi: the guided-tour narrator is OBI with co-host Nia, a deeper male voice, a left-docked panel and a voice-synchronised gauge and cursor; a background agent is rebuilding every tour to them. Presentation: https://obianams04.github.io/cris-enhancement/framework/presentations/m3/ |
| 2026-11-11 | **Milestone 2 verified.** Groundwork (e470493); training (005), reporting engine (006), document management (013) and compliance with laws (007) built, one commit per story; 14 compliance rules compiled by a research agent; 50 unit tests and three browser walks pass, including the cross-story compliance drill; **the portal verified all four within seconds of the push, without Sync from GitHub, 200 points** (500 on this build, 10 of 16 stories); the portal's record committed (afa8035). New standing rules from Obi: male voice narrator on every tour, one to three background agents per milestone, an HTML presentation at every milestone end. Releases r1 and r2 complete. Presentation: https://obianams04.github.io/cris-enhancement/framework/presentations/m2/ |
| 2026-11-11 | **Milestone 1 verified.** The 18 tables created as proposed (plus AuditEntry and MaintenanceWindow); the workspace built: help desk (001), support dashboard (012), monitoring (002), performance reports (003), feature development (004), audit log; 32 unit tests and both browser walks pass; one commit per story pushed; **the portal verified all five, 250 points** (300 on this build); the portal's record committed; push webhook registered; framework artifact v4 |
| 2026-11-11 | Obi said "build the rest". Repo `OBIANAMS04/cris-enhancement` created (public) in the browser, pushed, connected to the portal; the other eight tabs built; a browser walk of 9 tabs and 65 cards passes; all five criteria ticked; **STORY-000 verified by the portal, 50 points**; GitHub Pages live at https://obianams04.github.io/cris-enhancement/; the portal's progress record committed. Guided-tour button gets a play icon (standing rule) |
| 2026-11-10 | SSS closed out. CRIS project folder created; plan documents downloaded from the portal; the Command Center data layer, shell and Overview built and checked locally (11 unit tests, browser walk with no failures); first local commit. Waiting on GitHub sign-in to create the repo, connect it in the portal, register the push webhook and turn on GitHub Pages |

## 8. Risks

| Risk | Effect | Action |
|---|---|---|
| 10 days to 24 Nov with demo preparation left | The ship-by date is still tight, but the pace holds | Releases r0 to r3 and 010 verified (13 of 16 stories, 650 points) by 12 Nov; M4 built and pushed 14 Nov; demo preparation is next |
| Anomaly thresholds, the 365-day training period and the 60-day notification period are our reading of the rules | They could be read as TxDOT's own | Shown on screen with their sources; questions to TxDOT are in Blockers |
| The evaluation weights, the closing time and the risk scale are proposals | They could be read as TxDOT's own | Labelled as proposals on screen and in `content/`; questions to TxDOT are in Blockers |
| The compliance register is a research compilation | It could be read as legal advice | Shown on screen as to be confirmed by TxDOT legal; rules about records this build does not hold are "not applicable", never a pass |
| The workspace store is per browser | Two people do not share tickets yet | Said on screen; a shared backend replaces the store's backend without touching the stories' logic |
| The stories name integrations (TxDOT IT infrastructure, TxDOT financial systems, Euna Procurement, incident management) that this project cannot reach | A demo could imply connections that do not exist | Build against synthetic stand-ins behind a clear interface, label them, and keep every indicator grey and "not checked from here" until a real system reports |
| The plan's requirements read as written for the delivered CRIS service, and also for handling the solicitation response itself (REQ-012 to 015) | Scope could be misread | Follow the story files as written; raise mismatches with Ali rather than reinterpreting |
| The repo is public | Anything committed is visible to anyone | No secrets, keys or `.env` files, ever; the push-webhook secret is run once and never saved |

## 9. Screens (2026-11-14)

Milestone 4, in `framework/screens/` (`m4-` files): 01 a security breach logged (`m4-01-security-breach.png`),
02 document access blocked without training (`m4-02-access-blocked.png`), 03 a user error with its "Try this:"
suggestion (`m4-03-user-error-suggestion.png`), 04 a performance anomaly (`m4-04-performance-anomaly.png`),
05 an incident report (`m4-05-incident-report.png`), 06 the incident-report access log (`m4-06-incident-access-log.png`).

Milestone 3, in `framework/screens/` (`m3-` files): 01 a submission refused with its error (`m3-01-submission-error.png`),
02 response tracking, 03 evaluation with a flagged score, 04 the evaluation ranking, 05 a risk assessment with its
heat map, 06 a risk mitigated, 07 the risk page at phone width, 08 the portal showing STORY-010 completed.

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

- Portal: https://enterprise.colaberry.ai/portal/projects/workspace/a563218c-c3a4-433c-8ed7-4e8e0573f59c/STORY-001 (all 16 stories verified)
- Workspace (live): https://obianams04.github.io/cris-enhancement/workspace/
- Milestone 4 presentation: https://obianams04.github.io/cris-enhancement/framework/presentations/m4/
- Milestone 3 presentation: https://obianams04.github.io/cris-enhancement/framework/presentations/m3/
- Milestone 2 presentation: https://obianams04.github.io/cris-enhancement/framework/presentations/m2/
- Framework artifact (pinned): https://claude.ai/artifact/AZJzCgHVd2QAr4LnFCRzzf
- GitHub repo: https://github.com/OBIANAMS04/cris-enhancement
- Command Center (live): https://obianams04.github.io/cris-enhancement/

## How this document is maintained

Updated by Claude after every milestone, together with the published framework artifact, and committed with that
milestone's work.
