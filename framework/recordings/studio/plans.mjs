// What each rehearsal video shows and says, step by step. The words come from each kit's speaker-notes.md and
// demo-runbook.md (lightly cut to fit the clock). record.mjs plays these on stage.html and captures the tab.
// Step kinds: card (title card), deck (+ slide), ws (open a workspace page), act (a click or fill in the workspace),
// say (one narration line: OBI presents, OGE is the co-host), ring (highlight something), pause (ms).

const DISCLOSE = 'Narrated by OBI with co-host Oge in synthetic Windows voices (OBI male, Oge female); the clicks are real, in the live workspace on synthetic data.';
const REHEARSAL = 'CRIS is a Colaberry rehearsal case study. Nothing is connected to TxDOT.';

const DECK2 = 'framework/recordings/02-working-system-demo/presentation.html';
const DECK4 = 'framework/recordings/04-stakeholder-update/presentation.html';
const DECK5 = 'framework/recordings/05-final-showcase/presentation.html';

// The live proof shared by PREP-2 (full length) and PREP-5 (the 150-second beat).
const liveSubmissions = (long) => [
  { ws: 'submissions' },
  { act: 'actor', label: 'Quinn Demo (procurement officer)' },
  { ring: 'main h1' },
  { say: 'OBI', text: 'This is the Submissions page, as Quinn the procurement officer. Watch two places: Responses, which is empty, and Submission errors, which says none.' },
  { ring: null },
  { say: 'OGE', text: 'What comes in first?' },
  { say: 'OBI', text: 'Vendor A has sent a complete response: the four documents the solicitation requires.' },
  { act: 'respondent', name: 'Vendor A Demo' },
  ...(long ? [{ say: 'OBI', text: 'One file per slot: technical proposal, pricing, forms and certifications, and the HUB subcontracting plan.' }] : []),
  { act: 'attach', vendor: 'a', count: 4 },
  { ring: 'button:Record the response' },
  { say: 'OBI', text: 'Watch the top of the page and the Responses table.' },
  { act: 'click', name: 'Record the response' },
  { ring: 'notice' },
  { say: 'OBI', text: 'Recorded, with a receipt: a fingerprint of the four files. It was checked before it was stored: on time, every required document, accepted file types.' },
  { ring: null },
  ...(long ? [
    { say: 'OGE', text: 'How do we know it stays unchanged?' },
    { act: 'open', hash: 'submissions/RSP-0001' },
    { say: 'OBI', text: 'Watch for one line: whether the stored documents still match the receipt.' },
    { ring: 'text:Documents match the receipt' },
    { say: 'OBI', text: 'They match. And Tracking shows every step, read from the audit log.' },
    { ring: 'button:Move to under evaluation' },
    { say: 'OBI', text: 'Now the officer moves it on. Watch the status.' },
    { act: 'click', name: 'Move to under evaluation' },
    { ring: 'text:response under evaluation' },
    { say: 'OBI', text: 'Under evaluation. That is the outcome: a complete response, provably unchanged, tracked, and ready to score.' },
    { ring: null },
    { act: 'open', hash: 'submissions' },
  ] : []),
  { say: 'OGE', text: 'And the case it must refuse?' },
  { say: 'OBI', text: 'Vendor B sends two of the four documents. Watch the top of the page.' },
  { act: 'respondent', name: 'Vendor B Demo' },
  { act: 'attach', vendor: 'b', count: 2 },
  { act: 'click', name: 'Record the response' },
  { ring: 'notice' },
  { say: 'OBI', text: 'Refused. It names the two missing documents and tells the officer what to do: attach them.' },
  { ring: 'text:INC-0001' },
  { say: 'OBI', text: 'And it is logged: look, Submission errors, incident one, open.' },
  { ring: null },
  { say: 'OGE', text: 'What does a person do next?' },
  { say: 'OBI', text: 'The vendor sends the missing files while the solicitation is still open. Watch the error.' },
  { act: 'respondent', name: 'Vendor B Demo' },
  { act: 'attach', vendor: 'b', count: 4 },
  { act: 'click', name: 'Record the response' },
  { ring: 'text:Addressed' },
  { say: 'OBI', text: 'Recorded, and the error now says addressed.' },
  { ring: null },
  { say: 'OBI', text: 'And nothing is quietly changed.' },
  { act: 'open', hash: 'audit' },
  { ring: 'text:The chain is intact' },
  { say: 'OBI', text: 'The audit log: the chain is intact. The refusal is on the record too, next to the response that put it right.' },
  { ring: null },
];

// A deck whose slides carry their own OBI/OGE lines (data-say-script="OBI: …||OGE: …"): one step list per slide.
import { readFileSync, existsSync } from 'node:fs';
const repoFile = (p) => new URL(`../../../${p}`, import.meta.url);
const unescape = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const deckSteps = (deck) => {
  const html = readFileSync(repoFile(deck), 'utf8');
  const scripts = [...html.matchAll(/<section class="slide"[^>]*data-say-script="([^"]*)"/g)].map((m) => unescape(m[1]));
  return scripts.flatMap((script, i) => [
    i === 0 ? { deck, slide: 1 } : { slide: i + 1 },
    ...(i === 0 ? [{ card: null }] : []),
    ...script.split('||').map((part) => { const [, who, text] = /^\s*(OBI|OGE):\s*(.*)$/s.exec(part); return { say: who, text: text.trim() }; }),
  ]);
};
const DECK3 = 'framework/recordings/03-ai-visual-presentation/presentation.html';
const SLIDE1 = 'framework/recordings/01-project-introduction/slide.html';

export const plans = {
  'prep-1-project-introduction': {
    title: 'PREP-1 · Project introduction',
    rate: 1.12, // the brief is ninety seconds
    steps: [
      { card: { kicker: 'PREP-1 · Project introduction · CRIS', title: 'Catch the missing file before it costs the bid', body: [REHEARSAL, 'Narrated by OBI in a synthetic Windows voice.'] }, hold: 2000 },
      { deck: SLIDE1, slide: 1 },
      { card: null },
      { say: 'OBI', text: "I'm Obi. Picture a TxDOT procurement officer on closing day for the Crash Records solicitation, CRIS. Every response must carry every required document. The officer has to catch the one that is missing, and show why it was turned away." },
      { say: 'OBI', text: "What does one miss cost? TxDOT's published terms are plain. A response without every required document is non-responsive: it is never scored. A late one is not considered under any circumstances. One missing file costs a vendor the whole bid, and costs TxDOT a competitor." },
      { say: 'OBI', text: 'My workspace changes the intake: every response is checked before it is stored, so a complete one gets a fingerprinted receipt, and an incomplete one is refused with the reason, logged, and tracked until the vendor resubmits. What stays human: evaluators score every criterion, resolve every flagged score, and TxDOT alone decides the award. The system does the arithmetic; it never makes the award.' },
      { say: 'OBI', text: 'Next: this is a rehearsal on synthetic data, and the time it saves is not measured yet. So the next milestone is a timed trial: twenty synthetic responses, checked by hand, then in the workspace, by the same person. Done means a measured number replaces "not measured".' },
    ],
  },

  'prep-3-ai-visual-presentation': {
    title: 'PREP-3 · AI visual presentation',
    steps: [
      { card: { kicker: 'PREP-3 · AI visual presentation · CRIS', title: 'Rules check the facts; people make every decision', body: [REHEARSAL, 'Narrated by OBI with co-host Oge in synthetic Windows voices (OBI male, Oge female).'] }, hold: 4000 },
      ...deckSteps(DECK3),
      { card: { kicker: 'PREP-3 · AI visual presentation', title: 'Follow it with the sound off', body: ['Every slide carries its own evidence: drawings from TxDOT\'s published terms, real screens, measured test counts.', 'Synthetic narration (OBI and Oge, synthetic voices).'] }, hold: 3500 },
    ],
  },

  'prep-2-working-system-demo': {
    title: 'PREP-2 · Working-system demo',
    steps: [
      { card: { kicker: 'PREP-2 · Working-system demo · CRIS', title: 'A vendor response, from inbox to evaluation', body: [REHEARSAL, DISCLOSE] }, hold: 4500 },
      { deck: DECK2, slide: 1 },
      { card: null },
      { say: 'OBI', text: "Hi, I'm OBI. This is the Crash Records workspace built for the TxDOT CRIS service agreement, a Colaberry rehearsal case study. In seven minutes I'll take one vendor response from the moment it arrives to the moment it is ready to be scored, and I'll show you the response it refuses." },
      { say: 'OGE', text: "What's the job?" },
      { slide: 2 },
      { say: 'OBI', text: 'A TxDOT procurement officer receives vendor responses. Every one must arrive before the closing time with every required document, and the officer must be able to show why any response was turned away. TxDOT\'s own terms say an incomplete response is never scored.' },
      { say: 'OBI', text: "I'm going to act as Quinn, the procurement officer, on synthetic data: made-up vendors, nothing connected to TxDOT." },
      ...liveSubmissions(true),
      { deck: DECK2, slide: 7 },
      { say: 'OBI', text: 'It refused an incomplete bid, said why, logged it, and let the vendor put it right. People still score every response, and TxDOT alone decides the award.' },
      { say: 'OGE', text: 'What did the system refuse to do, and are you glad it refused?' },
      { say: 'OBI', text: "It refused to store a response missing two required documents. Yes, I'm glad: storing it would have let an incomplete bid reach scoring, which TxDOT's own terms forbid, and nobody would have known why it was missing later. Thank you." },
      { card: { kicker: 'PREP-2 · Working-system demo', title: 'Refused, logged, put right', body: ['Synthetic data only. The four required documents and the closing time are working assumptions, labelled on screen.', DISCLOSE] }, hold: 4000 },
    ],
  },

  'prep-4-stakeholder-update': {
    title: 'PREP-4 · Stakeholder update',
    steps: [
      { card: { kicker: 'PREP-4 · Stakeholder update · CRIS', title: 'Build done; one decision needed', body: [REHEARSAL, 'Narrated by OBI with co-host Oge in synthetic Windows voices (OBI male, Oge female).'] }, hold: 4000 },
      { deck: DECK4, slide: 1 },
      { card: null },
      { say: 'OBI', text: 'Ali, the Crash Records update. The build is done and on track for the twenty-fourth. The case-study recordings were late: they were due on the thirtieth of October. The introduction and the slides are handed in, and the videos are recorded and handed in before Demo Day.' },
      { slide: 2 },
      { say: 'OGE', text: 'What is done?' },
      { say: 'OBI', text: 'All sixteen stories are verified by the portal: fifty of fifty acceptance criteria, eight hundred points. The evidence I would point to is the rehearsal: one browser walk that runs all sixteen stories in the order of the demo, from an empty workspace, and passes. Seventy-three unit tests pass too.' },
      { say: 'OBI', text: 'Rehearsing found three real problems: a refusal message drawn off screen, a doubled word, and a Documents banner that contradicted the training rule. All three are fixed.' },
      { slide: 3 },
      { say: 'OGE', text: 'What is stuck?' },
      { say: 'OBI', text: 'Only one thing, and it is mine: the recordings. Nothing is waiting on TxDOT. This is a rehearsal, so TxDOT is not consulted. Where the solicitation\'s own values are not public, the build uses working assumptions from TxDOT\'s published terms: the scoring weights, the required documents, the closing time and the service levels. Each one is labelled on screen and kept in one file.' },
      { slide: 4 },
      { say: 'OGE', text: 'What do you recommend?' },
      { say: 'OBI', text: 'Accept those working assumptions as the baseline for the case study, and on Demo Day show the evaluation with the proposed weights, labelled as proposals, which the page already does. The scoring rules work the same with any weights, so the demo proves the method. In a live engagement, the client\'s weights replace one file and nothing else changes.' },
      { slide: 5 },
      { say: 'OBI', text: 'So, one decision. Option A: accept the working assumptions and close the case study with the evaluation shown, labelled as proposals. Option B: keep the evaluation step out of Demo Day. I recommend A. Which one?' },
      { pause: 1500 },
      { card: { kicker: 'PREP-4 · Stakeholder update', title: 'Option A or option B?', body: ['Recommendation: A, accept the working assumptions, shown labelled as proposals.', 'Synthetic narration (OBI and Oge, synthetic voices).'] }, hold: 3500 },
    ],
  },

  'prep-5-final-showcase': {
    title: 'PREP-5 · Final showcase',
    steps: [
      { card: { kicker: 'PREP-5 · Final showcase · CRIS', title: 'One missing file costs a vendor the whole bid', body: [REHEARSAL, DISCLOSE] }, hold: 4500 },
      { deck: DECK5, slide: 1 },
      { card: null },
      { say: 'OBI', text: "Hi, I'm OBI. Picture a TxDOT procurement officer receiving vendor responses to the Crash Records solicitation, CRIS. Every response must carry every required document and arrive before the closing time, and the officer must be able to show why any response was turned away." },
      { say: 'OGE', text: 'What does one miss cost?' },
      { say: 'OBI', text: "TxDOT's own published terms are plain: a response without every required document is non-responsive. It is never scored. A late one is not considered at all. So one missing file costs a vendor the whole bid, and costs TxDOT a competitor. Let me show you the check that catches it." },
      { slide: 2 },
      { say: 'OBI', text: "I'm acting as Quinn, the procurement officer, on synthetic data: made-up vendors, nothing connected to TxDOT. Watch four things: a complete response recorded with a receipt; an incomplete one refused, with the reason, and logged; the fix; and the audit log." },
      ...liveSubmissions(false),
      { deck: DECK5, slide: 4 },
      { say: 'OBI', text: 'It refused an incomplete bid, said why, logged it, and let the vendor put it right.' },
      { say: 'OGE', text: 'So who decides what?' },
      { say: 'OBI', text: 'Here is the line, as a rule. The system decides three things alone: whether a response is complete and on time; whether a score is so far from the others that it must be checked; and whether a person is cleared for protected work, which means current TxDOT-approved cyber training.' },
      { say: 'OBI', text: 'It never decides four things: the scores, which evaluators give; the award, which TxDOT alone decides; closing a security breach without a recorded notification; and anything about real vendors, because it holds none.' },
      { say: 'OGE', text: 'Is there AI inside?' },
      { say: 'OBI', text: 'To be exact: there is no AI model inside this workspace. Its checks are fixed rules, written down and tested. The build itself was made with AI assistance, Claude Code, and every rule is checked by tests.' },
      { slide: 5 },
      { say: 'OGE', text: 'What did that produce?' },
      { say: 'OBI', text: 'Every number here carries a label. Measured: sixteen of sixteen stories verified by the Colaberry portal, fifty of fifty acceptance criteria, eight hundred points. Seventy-three unit tests passing. A browser rehearsal of all sixteen stories passing from a clean start, about eighty-seven seconds of clicks. And a stored document retrieved within its two-second criterion.' },
      { say: 'OBI', text: 'What is not measured: time saved for TxDOT procurement staff. I have no figure, so I will not give you one. And the values along the bottom are targets: the service levels, the scoring weights, the four required documents and the closing time are working assumptions, drawn from TxDOT\'s published terms and labelled on screen.' },
      { slide: 6 },
      { say: 'OGE', text: 'Which brings us to what it does not do.' },
      { say: 'OBI', text: 'Five limits. One: synthetic data only. Two: nothing is connected: not TxDOT, not Euna Procurement, not TxDOT\'s financial or incident systems. A live engagement would need the agency\'s access and Euna\'s export documentation.' },
      { say: 'OBI', text: 'Three: it runs in one browser, with no server-side storage, no accounts and no sign-in. Four: the required documents, scoring weights, service levels and risk matrix are working assumptions, each in one file, so a live engagement replaces that file and nothing else. Five: there is no hosting cost. It is a static site, run locally or on GitHub Pages.' },
      { slide: 7 },
      { say: 'OGE', text: 'So what is the next decision?' },
      { say: 'OBI', text: 'It belongs to Ali and Ram. Option A, which I recommend: accept the CRIS case study as complete, with its working assumptions documented. Option B: hold it open. The evidence today: every working assumption is labelled on screen and lives in one file, and the sixteen-story rehearsal passes from a clean start.' },
      { say: 'OBI', text: 'For any live engagement, the next step is one timed trial with a procurement officer: minutes per response checked by hand against minutes in the workspace. Until that trial, time saved is not measured, and I give no figure.' },
      { slide: 8 },
      { say: 'OGE', text: 'Which limit were you most tempted to leave out?' },
      { say: 'OBI', text: "That there is no AI model inside: the checks are fixed rules. I was tempted because AI is what people expect to hear in a showcase like this. It is the important one because fixed rules only catch what was written down. That is exactly why people score every response, TxDOT alone decides the award, and every refusal is logged for a person to see. Thank you. Questions?" },
      { card: { kicker: 'PREP-5 · Final showcase', title: 'Accept the case study, assumptions documented', body: ['Measured: 16 of 16 stories, 50 of 50 criteria, 800 points, 73 tests. Time saved: not measured yet.', DISCLOSE] }, hold: 4000 },
    ],
  },
};

// PREP-6 · Present at Demo Day. CRIS is a rehearsal, so the Demo Day presentation is produced from the kit like the
// others: the final showcase run as it would be on the day (05-final-showcase/demo-day-notes.md), followed by the five
// minutes of questions, with Oge putting the five likely questions from rehearsal-checklist.md and OBI answering
// from the repo only.
const showcase = plans['prep-5-final-showcase'].steps;
plans['prep-6-demo-day'] = {
  title: 'PREP-6 · Demo Day',
  steps: [
    { card: { kicker: 'PREP-6 · Demo Day · CRIS', title: 'The final showcase, then five questions', body: [REHEARSAL, 'Eight minutes of showcase, then the questions a Demo Day room asks, answered from the repo only.', DISCLOSE] }, hold: 5000 },
    ...showcase.slice(1, -1),
    { say: 'OGE', text: "Let's take questions. I'll put the five the room is most likely to ask. First: where is the AI in this?" },
    { say: 'OBI', text: 'There is no AI model in the workspace. Its checks are fixed rules, one file per story, tested by seventy-three unit tests. AI was used to build it: Claude Code wrote code under my direction, and the tests, the sixteen-story rehearsal and the portal\'s verification are how it was checked. It decides completeness, timeliness, outlier flags and clearance. People decide scores, and TxDOT decides the award.' },
    { say: 'OGE', text: 'How much time does this save TxDOT?' },
    { say: 'OBI', text: 'I do not know yet. It is not measured. What is measured is that the check runs before anything is stored, and every refusal is named and logged. For any live engagement, the next step is one timed trial with a procurement officer.' },
    { say: 'OGE', text: 'Is it connected to TxDOT or Euna Procurement?' },
    { say: 'OBI', text: 'No. Synthetic data, in one browser. TxDOT does use Euna, but this rehearsal has no Euna access, so it is closed by a working assumption kept in one settings file. A live engagement replaces that file with the agency\'s own process.' },
    { say: 'OGE', text: 'What if your rules are wrong: the documents, the weights, the closing time?' },
    { say: 'OBI', text: 'They are working assumptions from TxDOT\'s published terms and public Texas procurement practice, labelled as proposals on screen. Each lives in one file, so the agency\'s real values replace that file without touching the logic, and the tests and rehearsal are run again.' },
    { say: 'OGE', text: 'Last one. Who can see the documents, and how do you know nothing was changed?' },
    { say: 'OBI', text: 'Four roles can open response documents, and vendor staff also need current cyber training. Every refusal is logged. Each file is stored and read back by its SHA-256 hash, the receipt re-checks it, and every action sits on an audit log chained by hashes, so a changed line is reported. There is no real sign-in: the Acting as picker stands in for it.' },
    { say: 'OGE', text: 'Thank you, OBI.' },
    { say: 'OBI', text: 'Thank you all. The recommendation stands: option A, accept the case study with its working assumptions documented.' },
    { card: { kicker: 'PREP-6 · Demo Day', title: 'Accept the case study, assumptions documented', body: ['Measured: 16 of 16 stories, 50 of 50 criteria, 800 points, 73 tests. Time saved: not measured yet.', DISCLOSE] }, hold: 4500 },
  ],
};

// The two portfolio types no PREP task names (built by extra-decks.mjs from the repo's own README and code).
const DECK6 = 'framework/recordings/06-architecture-review/presentation.html';
const DECK7 = 'framework/recordings/07-client-handoff/presentation.html';
const NARR = 'Narrated by OBI with co-host Oge in synthetic Windows voices (OBI male, Oge female).';
plans['prep-arch-architecture-review'] = {
  title: 'Architecture review',
  steps: [
    { card: { kicker: 'Architecture review · CRIS', title: 'What I chose, what I rejected, what would change my mind', body: [REHEARSAL, NARR] }, hold: 4000 },
    ...deckSteps(DECK6),
    { card: { kicker: 'Architecture review', title: 'The rules move; the store is one module', body: ['Static site, rules in lib/, audit in the same save, assumptions one file each.', NARR] }, hold: 3500 },
  ],
};
plans['prep-handoff-client-handoff'] = {
  title: 'Client handoff',
  steps: [
    { card: { kicker: 'Client handoff · CRIS', title: 'Run it, own it, fix it when it misbehaves', body: [REHEARSAL, NARR] }, hold: 4000 },
    ...deckSteps(DECK7),
    { card: { kicker: 'Client handoff', title: 'People score; TxDOT awards', body: ['Run: node scripts/serve.mjs 4321. Prove a change: node --test tests/ and the 16-story rehearsal.', NARR] }, hold: 3500 },
  ],
};

// The Selective Service System (SSS) rehearsal build's demo prep, from decks written in the SSS repo
// (docs/demo/recordings/sss-decks.mjs) and built into framework/recordings/sss/ (not committed here) for recording.
const SSS_R = 'Selective Service System Modernization: a Colaberry rehearsal demo on synthetic data. Not connected to the real Selective Service System.';
const sssTitles = {
  'sss-1-project-introduction': ['SSS · Project introduction', 'Project introduction'],
  'sss-2-working-system-demo': ['SSS · Working-system demo', 'Working-system demo'],
  'sss-3-ai-visual-presentation': ['SSS · AI visual presentation', 'AI visual presentation'],
  'sss-4-stakeholder-update': ['SSS · Stakeholder update', 'Stakeholder update'],
  'sss-5-final-showcase': ['SSS · Final showcase', 'Final showcase'],
  'sss-6-demo-day': ['SSS · Demo Day', 'Demo Day'],
  'sss-arch-architecture-review': ['SSS · Architecture review', 'Architecture review'],
  'sss-handoff-client-handoff': ['SSS · Client handoff', 'Client handoff'],
};
for (const [key, [title, kind]] of Object.entries(sssTitles)) {
  const deck = `framework/recordings/sss/${key}/presentation.html`;
  if (!existsSync(repoFile(deck))) continue;
  plans[key] = {
    ...(key === 'sss-1-project-introduction' ? { rate: 1.3 } : {}), // the brief is ninety seconds
    title,
    steps: [
      { card: { kicker: `${kind} · Selective Service rehearsal`, title, body: [SSS_R, NARR] }, hold: 4000 },
      ...deckSteps(deck),
      { card: { kicker: kind, title: 'Selective Service Modernization (rehearsal)', body: [SSS_R, NARR] }, hold: 3000 },
    ],
  };
}

// Spoken forms, so the voices say the names the way the kits' pronunciation tables ask.
export const say = (text) => text
  .replace(/TxDOT's/g, "Tex Dot's").replace(/TxDOT/g, 'Tex Dot')
  .replace(/\bCRIS\b/g, 'Chris')
  .replace(/\bOBI\b/g, 'Oh-bee').replace(/\bObi\b/g, 'Oh-bee')
  .replace(/\bOge\b/g, 'Oh-geh')
  .replace(/\bEuna\b/g, 'Yoo-nuh')
  .replace(/\bHUB\b/g, 'hub')
  .replace(/RSP-0001/g, 'R S P one')
  .replace(/Claude Code/g, 'Clawd Code')
  .replace(/\bSSS\b/g, 'S S S').replace(/\bJWT_SECRET\b/g, 'J W T secret').replace(/\bJWT\b/g, 'J W T').replace(/\bMFA\b/g, 'M F A').replace(/GovCloud/g, 'Gov Cloud');
