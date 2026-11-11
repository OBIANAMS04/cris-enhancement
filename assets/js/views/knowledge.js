// Tab 8, Knowledge base: requirements, stories, the traceability table, and decisions and notes.
// Sources: plan.requirements, plan.stories, progress.json for verification, and content/notes.json for the notes the
// project adds as it goes (a file that grows; it is appended to, never regenerated).
import { h, card, empty, section, source, table, link, statePill, pill } from '../ui.js';
import { tabHead, subPage, notFound, model, storiesTable, storyPage, isBuilt } from './common.js';
import { answer } from '../answer.js';

function coverage(req, byId) {
  const ids = req.fulfilled_by ?? [];
  if (!ids.length) return pill(req.priority === 'must' ? 'Gap: no story covers it' : 'No story yet', 'not_started');
  if (isBuilt(req, byId)) return pill('Built', 'verified');
  return pill('Not verified yet', 'unknown');
}

function chatPanel(data, notes) {
  const log = h('div', { class: 'chat__log', 'aria-live': 'polite' }, h('p', { class: 'chat__hint' }, 'Ask about the requirements, stories, roles, guardrails, systems or schedule. Answers come only from this page’s data and name the tab they came from.'));
  const input = h('input', { id: 'kb-question', type: 'text', class: 'chat__input', placeholder: 'For example: which stories cover REQ-010?', autocomplete: 'off' });
  const form = h('form', { class: 'chat__form' }, h('label', { for: 'kb-question', class: 'visually-hidden' }, 'Your question'), input, h('button', { type: 'submit', class: 'chat__send' }, 'Ask'));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    const a = answer(q, data, notes);
    log.append(
      h('p', { class: 'chat__q' }, q),
      h(
        'div',
        { class: 'chat__a' },
        a.text.split('\n').map((line) => h('p', {}, line)),
        a.sources.length ? h('p', { class: 'chat__src' }, 'From: ', a.sources.map(([label, to], i) => [i ? ', ' : null, h('a', { href: link(to) }, label)])) : null,
        data.sample ? h('p', { class: 'chat__src' }, 'Answered from sample data.') : null,
      ),
    );
    input.value = '';
    log.lastElementChild.scrollIntoView({ block: 'nearest' });
  });
  return h('section', { class: 'block chat', 'aria-labelledby': 'chat-h' }, h('h2', { id: 'chat-h' }, 'Ask the knowledge base'), log, form);
}

export function renderKnowledge(tab, data, ctx, rest) {
  const plan = data.plan;
  const reqs = plan?.requirements ?? [];
  const { rows, byId } = model(data);
  const notes = data.notes ?? [];
  const gaps = reqs.filter((r) => r.priority === 'must' && !(r.fulfilled_by ?? []).length);
  const [kind, id] = rest;

  if (kind === 'story') {
    const row = byId.get(id);
    return row ? storyPage(tab, row, plan) : notFound(tab, `story/${id}`);
  }
  if (kind === 'req') {
    const r = reqs.find((x) => x.id === id);
    if (!r) return notFound(tab, `req/${id}`);
    return subPage(
      tab,
      r.id,
      h('p', { class: 'lede' }, r.statement),
      h('p', {}, coverage(r, byId)),
      h('dl', { class: 'facts' }, h('dt', {}, 'Kind'), h('dd', {}, r.kind), h('dt', {}, 'Priority'), h('dd', {}, r.priority), h('dt', {}, 'Capability'), h('dd', {}, r.cluster ?? '—')),
      (r.fulfilled_by ?? []).length ? storiesTable(tab, rows.filter((x) => r.fulfilled_by.includes(x.id)), 'Stories that cover it') : empty({ title: 'No story covers this requirement', next: 'A story that fulfils it is added to the plan.' }),
    );
  }
  if (kind === 'requirements') {
    return subPage(
      tab,
      'Requirements',
      table(['Id', 'Requirement', 'Kind', 'Priority'], reqs.map((r) => [h('a', { href: link(`knowledge/req/${r.id}`) }, r.id), r.statement, r.kind, r.priority]), `${reqs.length} requirements in the plan`),
    );
  }
  if (kind === 'stories') return subPage(tab, 'Stories', storiesTable(tab, rows, `${rows.length} stories`));
  if (kind === 'traceability') {
    return subPage(
      tab,
      'Traceability',
      h('p', { class: 'lede' }, 'Every requirement, the stories that cover it, and whether those stories are verified. A must-have with no story is a real gap and stays in the table.'),
      table(
        ['Requirement', 'Covered by', 'Status'],
        reqs.map((r) => [h('a', { href: link(`knowledge/req/${r.id}`) }, `${r.id} · ${r.kind}, ${r.priority}`), (r.fulfilled_by ?? []).length ? r.fulfilled_by.map((sid, i) => [i ? ', ' : null, h('a', { href: link(`knowledge/story/${sid}`) }, sid), ' ', statePill(byId.get(sid)?.state ?? null)]) : 'None', coverage(r, byId)]),
        'From requirements[].fulfilled_by',
      ),
    );
  }
  if (kind === 'notes') {
    return subPage(
      tab,
      'Decisions and notes',
      notes.length
        ? h('ul', { class: 'notes' }, notes.map((n) => h('li', {}, h('p', { class: 'notes__meta' }, `${n.date} · ${n.kind}${n.story ? ` · ${n.story}` : ''}`), h('p', { class: 'notes__title' }, n.title), h('p', {}, n.text))))
        : empty({ title: 'No notes yet', body: 'Decisions and notes are added to content/notes.json as the project goes.', next: 'The first decision is recorded.' }),
      h('p', { class: 'source' }, 'Read at runtime from ', h('code', {}, 'content/notes.json'), ', which grows with the project.'),
    );
  }
  if (kind) return notFound(tab, rest.join('/'));

  const built = reqs.filter((r) => isBuilt(r, byId)).length;
  return h(
    'div',
    {},
    ...tabHead(tab, 'Everything the project knows about itself: its requirements, its stories, how they trace to each other, and the decisions made along the way.'),
    section(
      'What is here',
      h(
        'div',
        { class: 'grid grid--2' },
        card({ to: 'knowledge/requirements', label: 'Requirements', value: String(reqs.length), note: 'Every requirement in the plan, by kind and priority.' }),
        card({ to: 'knowledge/stories', label: 'Stories', value: String(rows.length), note: 'Every story with its state.' }),
        card({ to: 'knowledge/traceability', label: 'Traceability', value: `${built} of ${reqs.length} built`, note: gaps.length ? `${gaps.length} must-have requirement(s) have no story.` : 'Every must-have requirement has at least one story. A requirement counts as built when all its stories are verified.' }),
        card({ to: 'knowledge/notes', label: 'Decisions and notes', value: String(notes.length), note: notes.length ? `Latest: ${notes[notes.length - 1].title}` : 'None recorded yet.' }),
      ),
    ),
    chatPanel(data, notes),
    source('.colaberry/plan.json → requirements and stories; .colaberry/progress.json; content/notes.json'),
  );
}
