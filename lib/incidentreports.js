// STORY-015: incident reports and risk assessment documentation. A report on an incident gathers everything recorded
// about it: its details, its full timeline from the audit log, how long it was open, its cause, and the risks that
// cite it. Each report is stored once with its SHA-256; a later report on the same incident is a new version, so every
// version is kept (version control). Risk assessment documentation (the archived assessments from STORY-010, these
// incident reports and the cyber training archive) can be opened only by authorised roles; every opening and every
// refused attempt is logged.
import { sha256 } from './store.js';

export class ReportAccessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReportAccessError';
  }
}

export const DOC_ROLES = new Set(['compliance officer', 'risk manager', 'security officer', 'TxDOT manager', 'TxDOT contract manager', 'system administrator']);
const DOC_SPECS = new Set(['INCIDENT-REPORT', 'RISK-ASSESSMENT', 'CYBER-TRAINING']);
const HOUR = 3600000;

/** Generate (or re-generate as a new version) the detailed report for one incident. */
export async function generateIncidentReport(store, incidentId, { actor }) {
  if (!DOC_ROLES.has(store.get('Person', actor)?.role)) throw new ReportAccessError('Only authorised roles can produce incident reports.');
  const inc = store.get('Incident', incidentId);
  if (!inc) throw new ReportAccessError(`Incident ${incidentId} does not exist.`);
  const timeline = store.audit().filter((e) => e.record_id === incidentId).map((e) => ({ at: e.at, actor: store.get('Person', e.actor)?.display_name ?? e.actor, action: e.action }));
  const risks = store.list('Risk', (r) => String(r.evidence ?? '').includes(incidentId)).map((r) => ({ id: r.id, title: r.title, score: r.score, status: r.status }));
  const end = inc.resolved_at ? Date.parse(inc.resolved_at) : store.now().getTime();
  const generated_at = store.now().toISOString();
  const previous = store.list('Report', (r) => r.spec === 'INCIDENT-REPORT' && r.subject === incidentId);
  const version = previous.length + 1;
  const body = {
    title: `Incident report ${incidentId}, version ${version}`,
    generated_at,
    incident: { id: inc.id, title: inc.title, severity: inc.severity, status: inc.status, component: inc.component ?? null, detected_at: inc.detected_at, resolved_at: inc.resolved_at ?? null, root_cause: inc.root_cause ?? null, containment: inc.containment ?? null, personal_data: inc.personal_data ?? false, notify_by: inc.notify_by ?? null },
    hours_open: Math.round(((end - Date.parse(inc.detected_at)) / HOUR) * 10) / 10,
    timeline,
    related_risks: risks,
    supersedes: previous.at(-1)?.id ?? null,
  };
  const content_hash = await sha256(JSON.stringify(body));
  const day = generated_at.slice(0, 10);
  return store.insert('Report', { kind: 'incident log', spec: 'INCIDENT-REPORT', subject: incidentId, version, period_start: inc.detected_at.slice(0, 10), period_end: day, requested_by: actor, generated_at, file_reference: `sha256:${content_hash}`, content_hash, body }, { actor, action: `incident report generated (version ${version})`, detail: { incident: incidentId, content_hash } });
}

/** Every version of the documentation for one subject, oldest first. */
export const versions = (store, subject) => store.list('Report', (r) => r.subject === subject).sort((a, b) => (a.version ?? 1) - (b.version ?? 1));

/** The documentation library: incident reports, risk assessments and the training archive. */
export const documentation = (store) => store.list('Report', (r) => DOC_SPECS.has(r.spec));

/** Open one document. Authorised roles only; every opening and every refusal is logged. */
export async function openDocumentation(store, reportId, { actor }) {
  const r = store.get('Report', reportId);
  if (!r || !DOC_SPECS.has(r.spec)) throw new ReportAccessError(`${reportId} is not incident or risk documentation.`);
  const role = store.get('Person', actor)?.role;
  if (!DOC_ROLES.has(role)) {
    await store.log('documentation access refused', { actor, entity: 'Report', record_id: reportId, detail: { role: role ?? 'unknown' } });
    throw new ReportAccessError(`Access refused: incident and risk documentation is for ${[...DOC_ROLES].join(', ')}. The attempt has been logged.`);
  }
  await store.log('documentation opened', { actor, entity: 'Report', record_id: reportId, detail: { spec: r.spec, version: r.version ?? 1 } });
  return r;
}

export const accessLog = (store) => store.audit().filter((e) => e.action === 'documentation opened' || e.action === 'documentation access refused');
