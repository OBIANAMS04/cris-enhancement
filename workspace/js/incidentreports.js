// STORY-015: the Incident reports page: generate versioned reports, and open risk documentation with access control.
import { h, table, section, empty } from '../../assets/js/ui.js';
import { head, when, person, badge, flash, act, onClick } from './common.js';
import { generateIncidentReport, openDocumentation, versions, documentation, accessLog, DOC_ROLES } from '../../lib/incidentreports.js';
import { verifyReport } from '../../lib/reports.js';

const cell = (v) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

export function incidentReportsPage(page, rest, ctx) {
  if (rest[0]) return docPage(page, rest[0], ctx);
  const s = ctx.store;
  const incidents = s.list('Incident').reverse();
  const docs = documentation(s).reverse();
  const me = s.get('Person', ctx.actor);
  const allowed = me && DOC_ROLES.has(me.role);
  return h(
    'div',
    {},
    ...head(page, 'Incident reports', 'A detailed report for any incident: its details, full timeline, time open, cause and linked risks. Each new report on the same incident is a new version; every version is kept. Incident and risk documentation opens for authorised roles only, and every opening is logged.'),
    h('p', { class: `notice notice--${allowed ? 'ok' : 'warn'}`, role: 'note' }, allowed ? `${me.display_name} may produce and open incident and risk documentation.` : `Only ${[...DOC_ROLES].join(', ')} may produce or open this documentation; attempts by others are refused and logged.`),
    flash(ctx),
    section('Incidents', incidents.length ? table(['Incident', 'What', 'Severity', 'Status', 'Detected', 'Reports', ''], incidents.map((i) => [i.id, i.title, i.severity, badge(i.status), when(i.detected_at), versions(s, i.id).length, onClick(h('button', { type: 'button', class: 'btn btn--quiet' }, versions(s, i.id).length ? 'New version' : 'Generate report'), () => act(ctx, () => generateIncidentReport(s, i.id, { actor: ctx.actor }), (r) => ({ tone: 'ok', title: `${r.id}: report on ${i.id}, version ${r.version}, stored.` })))])) : empty({ title: 'No incidents', body: 'Incidents from monitoring, anomalies, breaches and errors appear here.' })),
    section('Documentation', docs.length ? table(['Document', 'Kind', 'Subject', 'Version', 'Generated', ''], docs.map((r) => [r.id, r.kind, r.subject ?? '—', r.version ?? 1, when(r.generated_at), h('a', { href: `#/incident-reports/${r.id}` }, 'Open')])) : empty({ title: 'No documentation yet', body: 'Incident reports, risk assessments and the cyber training archive are listed here.' })),
    section('Access log', (() => {
      const log = accessLog(s).reverse().slice(0, 40);
      return log.length ? table(['When', 'Who', 'Document', 'Result'], log.map((e) => [when(e.at), person(ctx, e.actor), e.record_id, e.action === 'documentation opened' ? h('span', { class: 'pill pill--ok' }, 'opened') : h('span', { class: 'pill pill--bad' }, 'refused')])) : h('p', { class: 'muted' }, 'No openings yet.');
    })()),
  );
}

function docPage(page, id, ctx) {
  const holder = h('div', {}, h('p', { role: 'status' }, 'Checking access…'));
  openDocumentation(ctx.store, id, { actor: ctx.actor }).then((r) => {
    const verdict = h('span', { class: 'pill pill--unknown' }, '…');
    verifyReport(r).then((ok) => { verdict.className = `pill pill--${ok ? 'ok' : 'bad'}`; verdict.textContent = ok ? 'Matches its archived hash' : 'Does not match its hash'; });
    const all = r.subject ? versions(ctx.store, r.subject) : [r];
    const b = r.body;
    holder.replaceChildren(
      h('p', {}, verdict, ' ', h('span', { class: 'hash' }, r.file_reference)),
      all.length > 1 ? h('p', {}, 'Versions: ', all.map((v, i) => [i ? ' · ' : '', v.id === r.id ? h('strong', {}, `v${v.version}`) : h('a', { href: `#/incident-reports/${v.id}` }, `v${v.version}`)])) : null,
      b.incident ? section('Incident', table(['Field', 'Value'], Object.entries(b.incident).map(([k, v]) => [k.replace(/_/g, ' '), cell(v)])), h('p', {}, `Open for ${b.hours_open} hours.`)) : null,
      b.timeline ? section('Timeline', table(['When', 'Who', 'What'], b.timeline.map((e) => [when(e.at), e.actor, e.action]))) : null,
      b.related_risks?.length ? section('Related risks', table(['Risk', 'Title', 'Score', 'Status'], b.related_risks.map((x) => [x.id, x.title, x.score, x.status]))) : null,
      b.register ? section('Risk register at the time', table(['Risk', 'Title', 'Score', 'Status'], b.register.map((x) => [x.id, x.title, x.score, x.status]))) : null,
      b.completions ? section('Training completions', table(['Person', 'Completed', 'How'], b.completions.map((c) => [c.person_name, c.completed_on, c.via]))) : null,
    );
  }, (err) => holder.replaceChildren(h('div', { class: 'notice notice--bad', role: 'alert' }, err.message)));
  const r = ctx.store.get('Report', id);
  return h('div', {}, h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/incident-reports' }, 'Incident reports'), ' › ', h('span', { 'aria-current': 'page' }, id)), ...head(page, r?.body?.title ?? id, r ? `Generated ${when(r.generated_at)} by ${person(ctx, r.requested_by)}.` : ''), holder);
}
