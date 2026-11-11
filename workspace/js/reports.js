// STORY-003: Performance reports: generate, the archive, and one report with its hash check.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, flash, act, field, form, button, onClick, download } from './common.js';
import { generatePerformanceReport, verifyReport } from '../../lib/reports.js';


export function reports(page, rest, ctx) {
  if (rest[0]) return reportPage(page, rest[0], ctx);
  const s = ctx.store;
  const today = s.now().toISOString().slice(0, 10);
  // Reports built by the reporting engine (STORY-006) carry a specification and are listed on its own page.
  const archived = s.list('Report', (r) => !r.spec).reverse();
  return h(
    'div',
    {},
    ...head(page, 'Performance reports', 'A report is computed from what has been measured and recorded in the period you choose. If the period has no monitoring data, the report is refused and says what is missing.'),
    flash(ctx),
    section(
      'Generate a report',
      form(
        'form form--inline',
        [field('From', h('input', { name: 'from', type: 'date', value: today, required: true })), field('To', h('input', { name: 'to', type: 'date', value: today, required: true })), h('div', { class: 'actions' }, button('Generate'))],
        (fd) => act(ctx, () => generatePerformanceReport(s, { period_start: fd.get('from'), period_end: fd.get('to'), requested_by: ctx.actor }), (r) => ({ tone: 'ok', title: `${r.id} generated and archived.`, body: 'Open it below.' })),
      ),
      h('p', { class: 'source' }, 'Dates are whole days in UTC.'),
    ),
    section(
      'Archive',
      archived.length ? table(['Report', 'Period', 'Availability', 'Requested by', 'Generated'], archived.map((r) => [h('a', { href: `#/reports/${r.id}` }, r.id), `${r.period_start} to ${r.period_end}`, `${r.body.figures.availability_pct}%`, person(ctx, r.requested_by), when(r.generated_at)]), 'Archived reports, newest first') : empty({ title: 'No reports yet', body: 'Generated reports are archived here and cannot be changed.' }),
    ),
  );
}

function bar(label, pct, note) {
  const fill = h('span', { class: `bar__fill${pct < 95 ? (pct < 80 ? ' bar__fill--bad' : ' bar__fill--warn') : ''}` });
  fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  return h('div', { class: 'bar' }, h('span', {}, label), h('span', { class: 'bar__track', role: 'img', 'aria-label': `${label}: ${pct}%` }, fill), h('span', {}, note ?? `${pct}%`));
}

function reportPage(page, id, ctx) {
  const r = ctx.store.get('Report', id);
  if (!r) return h('div', {}, h('h1', { tabindex: '-1' }, 'No such report'), h('p', {}, h('a', { href: '#/reports' }, 'Back to the reports'), '.'));
  const f = r.body.figures;
  const verdict = h('span', { class: 'pill pill--unknown' }, 'Not checked yet');
  verifyReport(r).then((ok) => {
    verdict.className = `pill pill--${ok ? 'ok' : 'bad'}`;
    verdict.textContent = ok ? 'Matches its archived hash' : 'Does not match its archived hash';
  });
  return h(
    'div',
    {},
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/reports' }, 'Performance reports'), ' › ', h('span', { 'aria-current': 'page' }, id)),
    ...head(page, r.body.title, `Generated ${when(r.generated_at)} for ${person(ctx, r.requested_by)}. ${r.body.data_note}`),
    h('p', {}, verdict, ' ', h('span', { class: 'hash' }, r.file_reference)),
    section('Availability', h('div', { class: 'bars' }, bar('All components', f.availability_pct), f.components.map((c) => bar(c.component, c.availability_pct)))),
    section(
      'Figures',
      table(
        ['Measure', 'Value'],
        [
          ['Checks in the period', f.checks],
          ['Response time, median', f.response_ms.p50 === null ? 'No successful checks' : `${f.response_ms.p50} ms`],
          ['Response time, 95th percentile', f.response_ms.p95 === null ? 'No successful checks' : `${f.response_ms.p95} ms`],
          ['Incidents opened / resolved', `${f.incidents.opened} / ${f.incidents.resolved}`],
          ['Help desk tickets opened / resolved', `${f.help_desk.opened} / ${f.help_desk.resolved}`],
          ['Resolved within service level', f.help_desk.sla_met_pct === null ? 'None resolved' : `${f.help_desk.sla_met_pct}%`],
          ['Mean time to resolve', f.help_desk.mean_hours_to_resolve === null ? 'None resolved' : `${f.help_desk.mean_hours_to_resolve} h`],
        ],
      ),
      table(['Component', 'Checks', 'Availability', 'Median', '95th percentile'], f.components.map((c) => [c.component, c.checks, `${c.availability_pct}%`, c.p50_ms === null ? '—' : `${c.p50_ms} ms`, c.p95_ms === null ? '—' : `${c.p95_ms} ms`]), 'By component'),
    ),
    onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, 'Download this report'), () => download(`${r.id}.json`, JSON.stringify(r, null, 2))),
  );
}

