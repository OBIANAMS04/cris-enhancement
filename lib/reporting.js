// STORY-006: the reporting engine. A contract manager picks a report specification (content/report-specs.json) and a
// period. The engine builds every section the specification lists from the store, then checks the result against the
// specification before archiving it: a required section that came out empty, or a source system that is not
// connected, is an error. Every error is logged as an incident on the reporting engine and addressed: a later
// successful run of the same specification resolves it, or someone resolves it with a stated cause. Every report that
// passes is archived once, unchangeable, with the SHA-256 of its body.
import { sha256 } from './store.js';
import { computePerformance, periodRange, ReportError } from './reports.js';
import { slaState } from './sla.js';

export class SpecError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'SpecError';
    this.problems = problems;
  }
}

/** Systems this build can actually read. Anything else a specification needs is reported as not connected. */
export const CONNECTED_SYSTEMS = new Set(['workspace store']);
const COMPONENT = (specId) => `Reporting engine: ${specId}`;
const inPeriod = (iso, start, end) => Boolean(iso) && iso >= start && iso <= end;

/** Build one section. Returns { rows, empty, note }. */
function buildSection(store, section, range, period) {
  const { start, end } = range;
  switch (section.source) {
    case 'monitoring': {
      const f = computePerformance(store, period); // throws ReportError when the period has no samples
      if (section.id === 'availability') return { rows: f.components.map((c) => ({ component: c.component, checks: c.checks, availability_pct: c.availability_pct })), summary: { overall_pct: f.availability_pct } };
      return { rows: f.components.map((c) => ({ component: c.component, p50_ms: c.p50_ms, p95_ms: c.p95_ms })), summary: f.response_ms };
    }
    case 'incidents': {
      const list = store.list('Incident', (i) => inPeriod(i.detected_at, start, end) && !String(i.component ?? '').startsWith('Reporting engine'));
      return { rows: list.map((i) => ({ id: i.id, title: i.title, severity: i.severity, status: i.status, detected_at: i.detected_at, resolved_at: i.resolved_at ?? null })) };
    }
    case 'helpdesk': {
      const t = store.list('SupportTicket', (x) => inPeriod(x.opened_at, start, end));
      if (section.id === 'sla') {
        const states = t.map((x) => slaState(x, store.now()));
        const met = states.filter((s) => s === 'met').length;
        const decided = met + states.filter((s) => s === 'missed').length;
        return { rows: decided ? [{ resolved: decided, within_service_level: met, share_pct: Math.round((met / decided) * 1000) / 10 }] : [] };
      }
      return { rows: ['urgent', 'high', 'normal', 'low'].map((p) => ({ priority: p, opened: t.filter((x) => x.priority === p).length, resolved: t.filter((x) => x.priority === p && x.resolved_at).length })).filter((r) => r.opened) };
    }
    case 'maintenance':
      return { rows: store.list('MaintenanceWindow', (w) => inPeriod(w.starts_at, start, end)).map((w) => ({ id: w.id, title: w.title, status: w.status, starts_at: w.starts_at, completed_at: w.completed_at ?? null })) };
    case 'training': {
      const sessions = store.list('TrainingSession', (s) => s.status === 'held' && inPeriod(s.held_at, start, end));
      if (section.id === 'sessions') return { rows: sessions.map((s) => ({ id: s.id, title: s.title, held_at: s.held_at, recording: s.recording_reference })) };
      const ids = new Set(sessions.map((s) => s.id));
      return { rows: store.list('TrainingAttendance', (a) => a.completed && ids.has(a.session)).map((a) => ({ session: a.session, person: store.get('Person', a.person)?.display_name ?? a.person, via: a.via, completed_on: a.completed_on })) };
    }
    case 'people':
      return { rows: store.list('Person', (p) => p.organization === 'vendor').map((p) => ({ person: p.display_name, cyber_training_completed_on: p.cyber_training_completed_on ?? null })) };
    default:
      return { rows: [], unavailable: `The data source "${section.source}" is not connected to this build.` };
  }
}

/** Build a report body to its specification, or say exactly why it cannot meet it. */
export function buildToSpec(store, spec, period) {
  const range = periodRange(period.period_start, period.period_end);
  const problems = [];
  for (const sys of spec.requires_systems ?? []) if (!CONNECTED_SYSTEMS.has(sys)) problems.push(`It needs the ${sys}, which is not connected to this build.`);
  const sections = [];
  if (!problems.length) {
    for (const sec of spec.sections) {
      let built;
      try {
        built = buildSection(store, sec, range, period);
      } catch (err) {
        if (err instanceof ReportError) {
          problems.push(`${sec.title}: ${err.message}`);
          continue;
        }
        throw err;
      }
      if (built.unavailable) problems.push(`${sec.title}: ${built.unavailable}`);
      else if (!built.rows.length && !sec.allow_empty) problems.push(`${sec.title}: the specification requires data and there is none for the period.`);
      sections.push({ id: sec.id, title: sec.title, rows: built.rows, summary: built.summary ?? null, note: built.rows.length ? null : 'None in this period.' });
    }
  }
  if (problems.length) throw new SpecError(`${spec.title} cannot meet its specification.`, problems);
  // The check against the specification: every section it lists is present, in order.
  const missing = spec.sections.filter((s, i) => sections[i]?.id !== s.id).map((s) => s.title);
  if (missing.length) throw new SpecError(`${spec.title} is missing sections.`, missing);
  return { title: `${spec.title}, ${period.period_start} to ${period.period_end}`, spec: spec.id, sections };
}

/**
 * Generate a report to a specification. On success it is archived (and any open error for the specification is
 * resolved, since the cause is addressed). On failure the error is logged as an incident and rethrown.
 */
export async function generateToSpec(store, specs, { spec: specId, period_start, period_end, requested_by }) {
  const spec = (specs ?? []).find((s) => s.id === specId);
  if (!spec) throw new SpecError('Choose a report specification.');
  if (!requested_by || !store.get('Person', requested_by)) throw new SpecError('Choose who is requesting the report.');
  const openError = () => store.list('Incident', (i) => i.component === COMPONENT(specId) && i.status !== 'resolved')[0];
  let body;
  try {
    body = buildToSpec(store, spec, { period_start, period_end });
  } catch (err) {
    if (!(err instanceof SpecError) && !(err instanceof ReportError)) throw err;
    const detail = [err.message, ...(err.problems ?? [])].join(' ');
    const existing = openError();
    const incident = existing ?? (await store.insert('Incident', { title: `Report error, ${spec.title}: ${detail}`.slice(0, 300), severity: '3', status: 'open', detected_at: store.now().toISOString(), component: COMPONENT(specId) }, { actor: requested_by, action: 'report error logged' }));
    if (existing) await store.log('report error repeated', { actor: requested_by, entity: 'Incident', record_id: existing.id, detail });
    err.incident = incident;
    throw err;
  }
  const generated_at = store.now().toISOString();
  const full = { ...body, generated_at, requested_by };
  const content_hash = await sha256(JSON.stringify(full));
  const report = await store.insert('Report', { kind: spec.kind, spec: spec.id, period_start, period_end, requested_by, generated_at, file_reference: `sha256:${content_hash}`, content_hash, body: full }, { actor: requested_by, action: 'report generated to specification and archived', detail: { spec: spec.id, period_start, period_end, content_hash } });
  const open = openError();
  if (open) await store.update('Incident', open.id, { status: 'resolved', resolved_at: generated_at, root_cause: `Addressed: ${report.id} generated to specification on retry.` }, { actor: requested_by, action: 'report error addressed' });
  return report;
}

/** Address a logged report error by hand, with the cause. */
export async function addressReportError(store, incidentId, { actor, root_cause }) {
  const inc = store.get('Incident', incidentId);
  if (!inc || !String(inc.component ?? '').startsWith('Reporting engine')) throw new SpecError(`${incidentId} is not a reporting engine error.`);
  if (inc.status === 'resolved') throw new SpecError(`${incidentId} is already resolved.`);
  if (!String(root_cause ?? '').trim()) throw new SpecError('Say what caused it and what was done.');
  return store.update('Incident', incidentId, { status: 'resolved', resolved_at: store.now().toISOString(), root_cause: root_cause.trim() }, { actor, action: 'report error addressed' });
}

export const reportErrors = (store) => store.list('Incident', (i) => String(i.component ?? '').startsWith('Reporting engine'));
