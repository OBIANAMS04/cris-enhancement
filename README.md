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

## Run it

It needs Node.js 20 or later and nothing else. There is no build step and there are no dependencies.

```sh
node scripts/serve.mjs        # then open http://localhost:4321/
node --test tests/            # the data layer, against the files committed here
```

The page has to be served, because a browser will not let a page opened straight from disk read the JSON files.
`tests/browser-walk.js` is a walk through the site in a real browser (every tab, every card, sample labels, the
stale-data warning, a deleted story, a missing file, phone width); it is run through Playwright.

## Where things are

| Path | What |
|---|---|
| `index.html`, `assets/` | The Command Center. `assets/js/data.js` is the only place data is loaded |
| `assets/app.css` | Styles. The brand colours are two lines at the top |
| `content/` | The project's own content: decisions and notes (`notes.json`, appended to) and the proposed data model |
| `framework/` | The project framework (goals, status, decisions, risks) and its screenshots |
| `docs/`, `.colaberry/`, `CLAUDE.md` | Written by the platform: requirements, stories, traceability, the data files |
| `tests/`, `scripts/` | Tests and the local server |

This repo is public. Never commit a password, a key, a token or a `.env` file.
