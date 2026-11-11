// Tab 9, Data model: the tables behind the system, with fields and relationships, derived from the requirements.
// The model is a proposal kept in content/data-model.json; each entity names the requirements it comes from, and
// those are read from plan.json at runtime, so a requirement removed from the plan shows up here as missing.
import { h, card, empty, section, source, table, link, pill } from '../ui.js';
import { tabHead, subPage, notFound, slug } from './common.js';

export function renderDataModel(tab, data, ctx, rest) {
  const dm = data.dataModel;
  const reqById = new Map((data.plan?.requirements ?? []).map((r) => [r.id, r]));
  const [kind, id] = rest;
  if (!dm?.entities?.length) {
    return h('div', {}, ...tabHead(tab, null), empty({ title: 'No data model yet', body: 'The model is read from content/data-model.json, which could not be read or holds no entities.', next: 'A model is proposed from the requirements and committed.' }));
  }
  const status = pill(dm.status === 'proposed' ? 'Proposed, not created' : dm.status, dm.status === 'proposed' ? 'in_progress' : 'verified');

  if (kind === 'entity') {
    const e = dm.entities.find((x) => slug(x.name) === id);
    if (!e) return notFound(tab, `entity/${id}`);
    const usedBy = dm.entities.filter((x) => (x.relations ?? []).some(([, to]) => to === e.name));
    return subPage(
      tab,
      e.name,
      h('p', { class: 'lede' }, e.purpose),
      h('p', {}, status),
      table(['Field', 'Type', 'Note'], e.fields.map(([n, t, note]) => [h('code', {}, n), dm.entities.some((x) => x.name === t) ? h('a', { href: link(`data-model/entity/${slug(t)}`) }, t) : t, note || '—']), 'Fields'),
      (e.relations ?? []).length ? table(['Through', 'Points to', 'Kind'], e.relations.map(([via, to, k]) => [h('code', {}, via), h('a', { href: link(`data-model/entity/${slug(to)}`) }, to), k]), 'Relationships') : null,
      usedBy.length ? h('p', {}, 'Referred to by: ', usedBy.map((x, i) => [i ? ', ' : null, h('a', { href: link(`data-model/entity/${slug(x.name)}`) }, x.name)])) : null,
      h('h2', {}, 'Requirements it comes from'),
      h('ul', {}, e.from_requirements.map((rid) => h('li', {}, h('a', { href: link(`knowledge/req/${rid}`) }, rid), ' ', reqById.get(rid)?.statement ?? '(not in the current plan)'))),
    );
  }
  if (kind) return notFound(tab, rest.join('/'));

  const relations = dm.entities.flatMap((e) => (e.relations ?? []).map(([via, to, k]) => [e.name, via, to, k]));
  const covered = new Set(dm.entities.flatMap((e) => e.from_requirements));
  const uncovered = [...reqById.keys()].filter((rid) => !covered.has(rid));
  return h(
    'div',
    {},
    ...tabHead(tab, 'The tables the system will need, with their fields and how they relate, derived from the requirements. Named for what CRIS stores, not for any vendor.'),
    h('p', { class: 'paused', role: 'note' }, status, ' ', dm.status_note ?? ''),
    section(
      `Entities (${dm.entities.length})`,
      h('div', { class: 'grid grid--3' }, dm.entities.map((e) => card({ to: `data-model/entity/${slug(e.name)}`, label: `${e.fields.length} fields`, value: e.name, note: `${e.purpose} From ${e.from_requirements.join(', ')}.`, wide: true }))),
    ),
    section('Relationships', relations.length ? table(['From', 'Through', 'To', 'Kind'], relations.map(([from, via, to, k]) => [h('a', { href: link(`data-model/entity/${slug(from)}`) }, from), h('code', {}, via), h('a', { href: link(`data-model/entity/${slug(to)}`) }, to), k]), 'How the entities connect') : h('p', {}, 'No relationships recorded.')),
    uncovered.length ? h('p', { class: 'source' }, `Requirements no entity comes from yet: ${uncovered.join(', ')}.`) : h('p', { class: 'source' }, `Every one of the ${reqById.size} requirements is reflected in at least one entity.`),
    source('content/data-model.json, checked against .colaberry/plan.json → requirements'),
  );
}
