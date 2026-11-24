// The two portfolio types no PREP task names: Architecture review and Client handoff. Built into
// framework/recordings/06-architecture-review/ and 07-client-handoff/ by: node extra-decks.mjs
import { buildDeck } from './deck-builder.mjs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const R = 'CRIS is a Colaberry rehearsal case study on synthetic data. Nothing is connected to TxDOT.';

export const archDeck = {
  title: 'CRIS · Architecture review', kicker: 'Architecture review · CRIS',
  slides: [
    { title: 'What I chose, what I rejected, and what would change my mind', lede: R, cols: 4,
      tiles: [
        { h: 'Static site', p: ['No server, no dependencies. Runs locally or on GitHub Pages.'] },
        { h: 'Rules apart from pages', p: ['lib/ holds the rules, one file per story. Pages only draw.'] },
        { h: 'Audit in the same save', p: ['Every write appends a SHA-256 chained audit line, atomically.'] },
        { h: 'Assumptions in one file', p: ['Documents, weights, closing time and service levels: one file each.'], tone: 'warn' },
      ],
      say: [['OBI', "I'm OBI. This is the architecture review of the Crash Records workspace: four choices I made, what I rejected for each, and what would make me change my mind."], ['OGE', 'Four choices. Start with the shape.']] },
    { title: 'The shape: four parts, one direction', cols: 4,
      tiles: [
        { h: 'Command Center', p: ['index.html reads the plan and progress files the Colaberry platform writes.', 'Shows only what the project produced.'] },
        { h: 'Workspace pages', p: ['workspace/js: one page per story.', 'They call rules and draw what comes back.'] },
        { h: 'Rules', p: ['lib/: nineteen small files, plain functions.', '73 unit tests run with node --test.'], tone: 'ok' },
        { h: 'Store', p: ['Browser storage, checked against the data model on every write.', 'Documents in IndexedDB by SHA-256.'] },
      ],
      say: [['OBI', 'The Command Center reads the files the platform writes and shows only what the project has produced.'], ['OBI', 'The workspace pages call the rules and draw what comes back. The rules are plain functions in lib, one file per story, with seventy-three unit tests.'], ['OGE', 'And the store?'], ['OBI', 'The store keeps the tables of the data model in the browser and checks every write against them. Documents are kept by their SHA-256 hash.']] },
    { title: 'Choice 1: a static site, no server', cols: 3,
      tiles: [
        { h: 'Chosen', p: ['Static files, no build step, no packages.', 'Zero hosting cost; nothing to patch or secure.'], tone: 'ok' },
        { h: 'Rejected', p: ['A Node and Postgres server, like the Selective Service rehearsal.', 'Sign-in, hosting and secrets for synthetic data only.'], tone: 'no' },
        { h: 'Price paid', p: ['One browser, one person at a time.', 'No real sign-in: an "Acting as" picker stands in.'], tone: 'warn' },
      ],
      say: [['OBI', 'First choice: a static site. No server, no build step, no packages, so there is no hosting cost and nothing to patch.'], ['OGE', 'What did you turn down?'], ['OBI', 'A Node and Postgres server, which I used for the Selective Service rehearsal. Here it would have meant sign-in, hosting and secrets, to hold synthetic data.'], ['OBI', 'The price: it runs in one browser for one person at a time, and there is no real sign-in. The Acting as picker stands in for it, and every screen says so.']] },
    { title: 'Choice 2: rules apart from pages', cols: 3,
      tiles: [
        { h: 'Chosen', p: ['Every decision is a function in lib/.', 'The page never decides; it shows the answer and the reason.'], tone: 'ok' },
        { h: 'Rejected', p: ['Checks written inside page scripts.', 'Quick to start, but only testable by clicking.'], tone: 'no' },
        { h: 'What it bought', p: ['73 unit tests in seconds.', 'A 16-story browser rehearsal on top.'] },
      ],
      say: [['OBI', 'Second choice: every decision lives in a rule function, never in a page. The page shows the answer and the reason.'], ['OGE', 'And the alternative?'], ['OBI', 'Checks inside the page scripts. Quicker to start, but only testable by clicking through. Keeping them apart bought seventy-three unit tests that run in seconds, with the sixteen-story browser rehearsal on top.']] },
    { title: 'Choice 3: the audit line is written in the same save', cols: 3,
      tiles: [
        { h: 'Chosen', p: ['Record and audit line saved together.', 'Each line carries the hash of the one before.'], tone: 'ok' },
        { h: 'Rejected', p: ['Write the record, then log it.', 'A failure in between stores an action nobody can see.'], tone: 'no' },
        { h: 'How it shows', p: ['The Audit log page checks the chain.', '"The chain is broken" names the line that changed.'] },
      ],
      say: [['OBI', 'Third choice: the audit line is saved in the same write as the record, and each line carries the hash of the line before it.'], ['OGE', 'Why not log afterwards?'], ['OBI', 'Because a failure between the two would store an action nobody can see. With the chain, the Audit log page checks every line, and if one is changed it says the chain is broken.']] },
    { title: 'Choice 4: working assumptions, one file each', cols: 3,
      tiles: [
        { h: 'Chosen', p: ['Required documents and closing time: content/solicitation.json.', 'Scoring weights: content/procurement-rules.json.'], tone: 'ok' },
        { h: 'Rejected', p: ['Hard-coding the values in the rules.', 'Or stopping until the client supplies them.'], tone: 'no' },
        { h: 'Labelled', p: ['Every assumption is marked as a proposal on screen.', 'A live engagement swaps the file; the rules stay.'], tone: 'warn' },
      ],
      say: [['OBI', "Fourth choice: the values a client must own are working assumptions from TxDOT's published terms, one file each. The required documents and closing time in one, the scoring weights in another."], ['OGE', 'Why not just wait for the real values?'], ['OBI', 'Because the method can be proved now. Each value is labelled as a proposal on screen, and a live engagement replaces the file without touching the rules.']] },
    { title: 'What would change my mind', cols: 4,
      tiles: [
        { h: 'Several users at once', p: ['Then a server, real sign-in and shared storage.'], tone: 'warn' },
        { h: 'Real documents', p: ['Then encrypted server storage and records retention.'], tone: 'warn' },
        { h: 'A Euna export', p: ['Then import responses instead of recording them.'], tone: 'warn' },
        { h: 'Volume', p: ['Past browser storage limits, a database.'], tone: 'warn' },
      ],
      say: [['OGE', 'So what would make you change your mind?'], ['OBI', 'Four things. Several people working at once means a server, real sign-in and shared storage. Real vendor documents mean encrypted server storage and a records-retention rule.'], ['OBI', 'An export from Euna Procurement would let responses be imported instead of recorded by hand. And volume past what a browser holds means a database. The rules in lib move across unchanged.']] },
    { title: 'The choice I am least sure of', cols: 2,
      tiles: [
        { h: 'Browser-only storage', p: ['Right for a rehearsal on synthetic data.', 'Wrong the day a real response arrives.'], tone: 'warn' },
        { h: 'What protects it', p: ['The rules do not know where data lives.', 'Moving the store is one module, tested by the same 73 tests.'], tone: 'ok' },
      ],
      say: [['OGE', 'Which choice are you least sure of?'], ['OBI', 'Browser-only storage. It is right for a rehearsal on synthetic data and wrong the day a real response arrives. What protects it is that the rules never know where data lives, so moving the store is one module, checked by the same tests. Thank you.']] },
  ],
};

export const handoffDeck = {
  title: 'CRIS · Client handoff', kicker: 'Client handoff · CRIS',
  slides: [
    { title: 'Run it, own it, and fix it when it misbehaves', lede: R, cols: 3,
      tiles: [
        { h: 'Run it', p: ['One command, one browser.'] },
        { h: 'Change it', p: ['Settings in content/, rules in lib/, tests prove both.'] },
        { h: 'When it misbehaves', p: ['What each warning means, and what to do.'], tone: 'warn' },
      ],
      say: [['OBI', "I'm OBI. This is the handoff of the Crash Records workspace: how to run it, how to change it safely, and what to do when it misbehaves."], ['OGE', "I'm the new owner. Where do I start?"]] },
    { title: 'Run it', cols: 3,
      tiles: [
        { h: '1. Get the code', p: ['Clone github.com/OBIANAMS04/cris-enhancement.', 'Node is the only tool needed.'] },
        { h: '2. Serve it', p: ['node scripts/serve.mjs 4321', 'Open localhost:4321/workspace/.'] },
        { h: '3. Or the public copy', p: ['GitHub Pages serves the same files.', 'Each browser keeps its own synthetic data.'] },
      ],
      say: [['OBI', 'Clone the repository. Node is the only tool you need. Run node scripts slash serve, port forty-three twenty-one, and open the workspace.'], ['OGE', 'And without installing anything?'], ['OBI', 'GitHub Pages serves the same files. Remember that each browser keeps its own synthetic data, so two people never see each other\'s work.']] },
    { title: 'Where things live', cols: 4,
      tiles: [
        { h: 'lib/', p: ['The rules, one file per story. Change behaviour here.'] },
        { h: 'workspace/js/', p: ['The pages. They draw; they never decide.'] },
        { h: 'content/', p: ['Settings and seed data: documents, weights, report specs.'], tone: 'warn' },
        { h: 'tests/', p: ['Unit tests and the 16-story rehearsal.'], tone: 'ok' },
      ],
      say: [['OBI', 'Four folders. lib holds the rules: change behaviour there. workspace js holds the pages, which only draw.'], ['OBI', 'content holds the settings: the required documents, the scoring weights, the report specifications. And tests holds the unit tests and the sixteen-story rehearsal.']] },
    { title: 'Change a setting safely', cols: 3,
      tiles: [
        { h: 'Edit one file', p: ['Example: a fifth required document goes in content/solicitation.json.'] },
        { h: 'Run the tests', p: ['node --test tests/', '73 should pass before and after.'], tone: 'ok' },
        { h: 'Run the rehearsal', p: ['tests/demo-rehearsal.js walks all 16 stories from an empty store.'], tone: 'ok' },
      ],
      say: [['OGE', 'Say the client adds a fifth required document.'], ['OBI', 'Add it to content slash solicitation dot json. Then run node dash dash test on the tests folder: seventy-three should pass.'], ['OBI', 'Then run the rehearsal, which walks all sixteen stories from an empty store. If both pass, the change is safe to publish.']] },
    { title: 'When it misbehaves', cols: 3,
      tiles: [
        { h: '"The chain is broken"', p: ['A stored audit line was changed.', 'Download the audit log first; it names the line. Do not edit it back by hand.'], tone: 'no' },
        { h: 'A response is refused', p: ['Working as designed: the message names what is missing.', 'It is logged as an incident until put right.'], tone: 'warn' },
        { h: 'A document will not store', p: ['Over 10 MB, a refused file type, or a role without access.', 'The message says which.'], tone: 'warn' },
      ],
      say: [['OGE', 'What if it says the chain is broken?'], ['OBI', 'A stored audit line was changed. Download the audit log first, from the Audit log page; it names the line. Do not edit it back by hand: that is the evidence.'], ['OGE', 'And a refused response?'], ['OBI', 'That is the system working: the message names the missing documents, and it stays logged as an incident until the vendor puts it right. A document that will not store is over ten megabytes, a refused file type, or a role without access, and the message says which.']] },
    { title: 'Start over, and what you own', cols: 2,
      tiles: [
        { h: 'Start over', p: ['Audit log page: "Keep or start over". Press twice to wipe this browser\'s demo data.', 'Download the audit log first if you need it.'], tone: 'warn' },
        { h: 'What you own now', p: ['The settings files in content/, the tests, and the rule that people score and TxDOT awards.'], tone: 'ok' },
      ],
      say: [['OBI', "To start over, the Audit log page has Keep or start over. Press it twice to wipe this browser's demo data, and download the audit log first if you need it."], ['OGE', 'So what do I own now?'], ['OBI', 'The settings files, the tests, and one rule that does not change: people score every response, and TxDOT alone decides the award. Thank you.']] },
  ],
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(buildDeck(archDeck, fileURLToPath(new URL('06-architecture-review/presentation.html', root))));
  console.log(buildDeck(handoffDeck, fileURLToPath(new URL('07-client-handoff/presentation.html', root))));
}
