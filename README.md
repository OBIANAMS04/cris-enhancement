# Crash Records Information System (CRIS) Enhancement

A Colaberry build for the TxDOT Crash Records Information System Service Agreement solicitation: enhancing and
maintaining CRIS, with compliance, performance and user satisfaction as the aims. Everything here runs on synthetic
data. Nothing in this repo is operating in production and nothing here is connected to a TxDOT system.

## The Command Center

`index.html` at the root of this repo is the Command Center (STORY-000): one site that shows what is being built,
what it is meant to move, and how far along it is. It has nine tabs, and every card opens its own page.

It reads three files at runtime and holds no copy of their contents:

| File | What it is |
|---|---|
| `.colaberry/plan.json` | The plan: requirements, stories, releases, dates |
| `.colaberry/progress.json` | What is done: ticked criteria and the platform's verification of each story |
| `.colaberry/manifest.json` | When that data last changed, shown on every tab as "Data as of" |

`docs/DATA_CONTRACT.md` is the field-by-field description of those files. `docs/` and `.colaberry/` are written by
the Colaberry platform; do not build anything else in `docs/`.

**Real and Sample.** The switch at the top right is on every tab. Real shows only what the project has produced.
Sample fills the page with made-up values so its shape can be seen, and labels every screen and card as sample.

**What the page will not show.** A number, a connection or a result the project has not produced. A value that is
not in the files is shown as an empty state that says what is missing and what has to happen first.

## The workspace (Milestone 1)

`workspace/` is where the stories run: the Help desk (STORY-001), the Support dashboard (STORY-012), Monitoring
(STORY-002), Performance reports (STORY-003), Feature development (STORY-004), and the Audit log that every one of
them writes to. Open it from the Command Center's header, or at `/workspace/`.

- The rules live in `lib/`, one file per story, and are tested with `node --test tests/`. The pages in
  `workspace/js/` only call those functions and draw what they return.
- `lib/store.js` keeps the tables from `content/data-model.json` and checks every write against them. Every write
  also appends a line to an audit log chained by SHA-256, in the same save, so an action is never stored unlogged
  and a changed line is detected.
- The demo store lives in the browser (localStorage) with synthetic people. Nothing here reaches TxDOT. Service
  levels and service hours are proposals until TxDOT confirms them (`lib/sla.js`, `lib/support.js`).

## The workspace (Milestone 2)

Four more pages, built the same way (rules in `lib/`, pages in `workspace/js/`):

- Training (STORY-005, `#/training`): sessions with materials from `content/training-materials.json`. A session
  needs a recording to be marked held; staff complete training by passing a knowledge check at 80% or more.
- Reporting engine (STORY-006, `#/reporting-engine`): five report specifications in `content/report-specs.json`.
  A report that cannot meet its spec is refused and logged as an incident; archived reports carry a SHA-256.
- Documents (STORY-013, `#/documents`): response documents by category, hashed and stored in the browser's
  IndexedDB, with role checks and a 10 MB limit.
- Compliance (STORY-007, `#/compliance`): a register of 14 rules in `content/compliance-rules.json`, checked against
  the live store. The register is compiled from public sources, to be confirmed by TxDOT legal; it is not legal advice.

`tests/workspace-walk-m2.js` walks these four pages in a real browser, including a legal update that raises a
compliance violation and a training refresher that clears it.

## The workspace (Milestone 3)

Three more pages, built the same way:

- Submissions (STORY-008, `#/submissions`): a procurement officer or contract manager records each response. It is
  checked first (closing time, all required documents, file types and sizes). The response and its documents are
  saved together with a SHA-256 receipt; a failed submission is logged as an incident; a retried one is not stored
  twice. Settings are in `content/solicitation.json`. Euna Procurement is not connected.
- Evaluation (STORY-009, `#/evaluation`): weighted criteria (total 100) in `content/procurement-rules.json`,
  compiled from public sources and proposed, not TxDOT's. Evaluators score 0 to 10; outliers are flagged; a
  correction is a new score linked to the old one. The archive needs every response fully scored and every flag resolved.
- Risk (STORY-010, `#/risk`): an assessment reads the live system for six conditions and records each finding as a
  risk with a score from 1 to 9, an owner and a mitigation plan, on a heat map. Risks clear when the condition is gone.

`tests/workspace-walk-m3.js` walks these three pages in a real browser: an incomplete submission logged then fixed,
a typo score flagged and corrected before archiving, and an outage drill that raises a score-9 risk.

## Run it

It needs Node.js 20 or later and nothing else. There is no build step and there are no dependencies.

```sh
node scripts/serve.mjs        # then open http://localhost:4321/
node --test tests/            # the data layer, against the files committed here
```

The page has to be served, because a browser will not let a page opened straight from disk read the JSON files.
`tests/browser-walk.js`, `tests/workspace-walk.js`, `tests/workspace-walk-m2.js` and `tests/workspace-walk-m3.js` are walks through the site in a real browser (every tab, every card, sample labels, the
stale-data warning, a deleted story, a missing file, phone width); it is run through Playwright.

## Where things are

| Path | What |
|---|---|
| `index.html`, `assets/` | The Command Center. `assets/js/data.js` is the only place data is loaded |
| `workspace/`, `lib/` | The Milestone 1, 2 and 3 workspace: pages in `workspace/js/`, rules and the store in `lib/` |
| `assets/app.css` | Styles. The brand colours are two lines at the top |
| `content/` | The project's own content: decisions and notes (`notes.json`, appended to) and the proposed data model |
| `framework/` | The project framework (goals, status, decisions, risks) and its screenshots |
| `docs/`, `.colaberry/`, `CLAUDE.md` | Written by the platform: requirements, stories, traceability, the data files |
| `tests/`, `scripts/` | Tests and the local server |

This repo is public. Never commit a password, a key, a token or a `.env` file.
