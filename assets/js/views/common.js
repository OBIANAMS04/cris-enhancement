// Pieces several tabs share: a story's own page, page headers, and the joins every tab needs.
// Everything is computed from the plan and progress files passed in; nothing here holds plan content.
import { h, statePill, empty, crumbs, table, link, sampleTag } from '../ui.js';
import { storyRows, formatDate } from '../data.js';

/** A stable, address-safe name for something that only has a display name (a role, a system, an owner). */
export const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A page one level below a tab: breadcrumb back to the tab, a heading, then the content. */
export function subPage(tab, title, ...kids) {
  return h('div', {}, crumbs([{ label: tab.label, to: tab.id }, { label: title }]), h('h1', { tabindex: '-1' }, title, sampleTag()), ...kids);
}

/** A tab's own top: kicker, heading and one line on what the tab is for. */
export function tabHead(tab, lede) {
  return [h('p', { class: 'kicker' }, tab.label), h('h1', { tabindex: '-1' }, tab.label, sampleTag()), lede ? h('p', { class: 'lede' }, lede) : null];
}

export function notFound(tab, what) {
  return subPage(tab, 'Not found', empty({ title: `There is no such page under ${tab.label}`, body: `Nothing in the plan files matches "${what}".` }));
}

/** Rows (plan joined to progress) and a lookup by id, built once per render. */
export function model(data) {
  const rows = storyRows(data.plan, data.progress);
  return { rows, byId: new Map(rows.map((r) => [r.id, r])) };
}

export const storyName = (row) => (row.title ? `${row.id} · ${row.title}` : row.id);

export function storyCell(tab, row) {
  return h('a', { href: link(`${tab.id}/story/${row.id}`) }, storyName(row));
}

export function criteriaText(row) {
  if (row.verification) return `${row.verification.criteria_passed} of ${row.verification.criteria_total} passed`;
  return `${row.claimed} of ${row.criteriaTotal} ticked in the file, not checked yet`;
}

/** Stories listed as a table, each opening its page under the given tab. */
export function storiesTable(tab, rows, caption) {
  return table(
    ['Story', 'Release', 'State', 'Criteria'],
    rows.map((r) => [storyCell(tab, r), r.release ?? '—', statePill(r.state), criteriaText(r)]),
    caption,
  );
}

/** A story's own page, reachable from any tab that lists it. */
export function storyPage(tab, row, plan) {
  const story = (plan?.stories ?? []).find((s) => s.id === row.id);
  const reqs = (plan?.requirements ?? []).filter((r) => (r.fulfilled_by ?? []).includes(row.id) || (story?.fulfills ?? []).includes(r.id));
  const v = row.verification;
  return subPage(
    tab,
    storyName(row),
    h('p', { class: 'lede' }, statePill(row.state), ' ', criteriaText(row), '.'),
    row.narrative ? h('p', {}, row.narrative) : null,
    h(
      'dl',
      { class: 'facts' },
      h('dt', {}, 'Release'),
      h('dd', {}, row.release ?? 'Not in the plan file'),
      h('dt', {}, 'Owner'),
      h('dd', {}, row.owner ?? 'Not in the plan file'),
      h('dt', {}, 'Due'),
      h('dd', {}, formatDate(row.due_on) ?? 'No date in the plan file yet'),
      h('dt', {}, 'First given due date'),
      h('dd', {}, formatDate(row.due_baseline_on) ?? 'No date in the plan file yet'),
      story?.blocked_by?.length ? [h('dt', {}, 'Blocked by'), h('dd', {}, story.blocked_by.join(', '))] : null,
      v?.commit_sha ? [h('dt', {}, 'Verified commit'), h('dd', {}, v.commit_url ? h('a', { href: v.commit_url }, v.commit_sha) : v.commit_sha)] : null,
    ),
    reqs.length ? [h('h2', {}, 'Requirements it fulfils'), h('ul', {}, reqs.map((r) => h('li', {}, h('a', { href: link(`knowledge/req/${r.id}`) }, r.id), ` ${r.statement}`)))] : null,
    h('h2', {}, 'Acceptance criteria'),
    row.criteria.length
      ? h('ul', { class: 'criteria' }, row.criteria.map((c) => h('li', { class: c.passed ? 'is-ticked' : '' }, h('span', { class: 'criteria__mark' }, c.passed ? 'Ticked' : 'Not ticked'), c.text)))
      : h('p', {}, 'No criteria are listed for this story in progress.json.'),
    story?.failure_paths?.length ? [h('h2', {}, 'What can go wrong'), h('ul', {}, story.failure_paths.map((f) => h('li', {}, f)))] : null,
    story?.task_guidance ? [h('h2', {}, 'Guidance'), h('p', {}, story.task_guidance)] : null,
  );
}

/** The stories written for a role: their narrative starts "As a <role>," or "As an <role>,". */
export function storiesForRole(plan, role) {
  const wanted = role.toLowerCase();
  return (plan?.stories ?? []).filter((s) => {
    const m = /^as an? (.+?),/i.exec(s.narrative ?? '');
    return m && m[1].trim().toLowerCase() === wanted;
  });
}

/** Requirements whose wording names a system. That is all the files know about how a system is used. */
export function requirementsNaming(plan, system) {
  const name = system.toLowerCase();
  return (plan?.requirements ?? []).filter((r) => (r.statement ?? '').toLowerCase().includes(name));
}

/** True only when every story that fulfils the requirement is verified. Never stored, always derived. */
export function isBuilt(req, byId) {
  const ids = req.fulfilled_by ?? [];
  return ids.length > 0 && ids.every((id) => byId.get(id)?.state === 'verified');
}
