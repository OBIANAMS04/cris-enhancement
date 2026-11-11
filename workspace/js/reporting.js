// STORY-006: the Reporting engine page: generate a report to a specification, see errors and address them, open archived reports.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, field, form, button, onClick, download } from './common.js';
import { generateToSpec, addressReportError, reportErrors } from '../../lib/reporting.js';
import { verifyReport } from '../../lib/reports.js';

export function reportingEngine(page, rest, ctx) {
  if (!ctx.specs || ctx.specs.error) return h('div', {}, ...head(page, 'Reporting engine'), h('div', { class: 'notice notice--bad', role: 'alert' }, 'The report specifications (content/report-specs.json) could not be read. No report can be generated until they are.'));
  if (rest[0]) return reportPage(page, rest[0], ctx);
  const s = ctx.store;
  const specs = ctx.specs.specs;
  const today = s.now().toISOString().slice(0, 10);
  const errors = reportErrors(s).reverse();
  const archived = s.list('Report', (r) => r.spec).reverse();
  return h(
    'div',
    {},
    ...head(page, 'Reporting engine', 'Required reports, built to their specification. Each section is computed from recorded data; a report that cannot meet its specification is refused, logged as an error, and addressed.'),
    flash(ctx),
    section(
      'Generate a report',
      form('form form--inline', [
        field('Specification', h('select', { name: 'spec' }, specs.map((x) => h('option', { value: x.id }, x.title)))),
        field('From', h('input', { name: 'from', type: 'date', value: today, required: true })),
        field('To', h('input', { name: 'to', type: 'date', value: today, required: true })),
        h('div', { class: 'actions' }, button('Generate')),
      ], (fd) => act(ctx, () => generateToSpec(s, specs, { spec: fd.get('spec'), period_start: fd.get('from'), period_end: fd.get('to'), requested_by: ctx.actor }), (r) => ({ tone: 'ok', title: `${r.id} generated to ${r.spec} and archived.` }))),
    ),
    section('Specifications', table(['Report', 'Kind', 'Sections', 'Needs'], specs.map((x) => [x.title, x.kind, x.sections.map((sec) => sec.title).join(' · '), (x.requires_systems ?? []).length ? h('span', { class: 'pill pill--warn' }, `${x.requires_systems.join(', ')}: not connected`) : 'Workspace data']))),
    section(
      'Errors',
      errors.length
        ? errors.map((i) => h('div', { class: 'form' }, h('p', {}, h('strong', {}, i.id), ' ', badge(i.status), ` · ${when(i.detected_at)} · `, i.title), i.status === 'resolved' ? h('p', {}, h('strong', {}, 'Addressed: '), i.root_cause) : form('form form--inline', [field('Cause and action taken', h('input', { name: 'cause', required: true })), h('div', { class: 'actions' }, button('Mark addressed', 'btn btn--quiet'))], (fd) => act(ctx, () => addressReportError(s, i.id, { actor: ctx.actor, root_cause: fd.get('cause') }), `${i.id} addressed.`))))
        : empty({ title: 'No errors', body: 'A report that cannot meet its specification is logged here until it is addressed.' }),
    ),
    section('Archive', archived.length ? table(['Report', 'Specification', 'Period', 'Requested by', 'Generated'], archived.map((r) => [h('a', { href: `#/reporting-engine/${r.id}` }, r.id), r.spec, `${r.period_start} to ${r.period_end}`, person(ctx, r.requested_by), when(r.generated_at)])) : empty({ title: 'No reports yet', body: 'Generated reports are archived here and cannot be changed.' })),
  );
}

const cell = (v) => (v === null || v === undefined ? '—' : typeof v === 'number' ? String(v) : String(v));

function reportPage(page, id, ctx) {
  const r = ctx.store.get('Report', id);
  if (!r || !r.spec) return h('div', {}, h('h1', { tabindex: '-1' }, 'No such report'), h('p', {}, h('a', { href: '#/reporting-engine' }, 'Back to the Reporting engine'), '.'));
  const verdict = h('span', { class: 'pill pill--unknown' }, 'Not checked yet');
  verifyReport(r).then((ok) => {
    verdict.className = `pill pill--${ok ? 'ok' : 'bad'}`;
    verdict.textContent = ok ? 'Matches its archived hash' : 'Does not match its archived hash';
  });
  return h(
    'div',
    {},
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/reporting-engine' }, 'Reporting engine'), ' › ', h('span', { 'aria-current': 'page' }, id)),
    ...head(page, r.body.title, `Built to ${r.spec}; generated ${when(r.generated_at)} for ${person(ctx, r.requested_by)}.`),
    h('p', {}, verdict, ' ', h('span', { class: 'hash' }, r.file_reference)),
    ...r.body.sections.map((sec) => section(sec.title, sec.rows.length ? table(Object.keys(sec.rows[0]).map((k) => k.replace(/_/g, ' ')), sec.rows.map((row) => Object.values(row).map(cell))) : h('p', { class: 'muted' }, sec.note ?? 'None in this period.'))),
    onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, 'Download this report'), () => download(`${r.id}.json`, JSON.stringify(r, null, 2))),
  );
}
