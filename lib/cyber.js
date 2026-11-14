// STORY-011: cybersecurity compliance (REQ-020). Completing the TxDOT-approved cyber security training is what clears a
// vendor employee to work on CRIS: without a completion inside the validity period, protected actions (opening or
// uploading response documents) are refused, so compliance is enforced, not just reported. A security breach is logged
// as a severity-1 security incident, contained, and closed with its cause; when sensitive personal information is
// involved the Texas notification deadline (Tex. Bus. & Com. Code §521.053: 60 days) is set and closing waits until
// notification is recorded. Every training completion is archived in a report with its SHA-256.
import { sha256 } from './store.js';

export class CyberError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'CyberError';
    this.problems = problems;
  }
}

export const VALID_DAYS = 365;
export const NOTIFY_DAYS = 60;
const DAY = 86400000;
const SECURITY = 'Security';
const SECURITY_ROLES = new Set(['security officer', 'system administrator', 'compliance officer']);

/** Whether a person may do protected work: TxDOT staff always; vendor staff only with current cyber training. */
export function clearance(store, personId, now = store.now()) {
  const p = store.get('Person', personId);
  if (!p) return { cleared: false, reason: 'Unknown person.' };
  if (p.organization !== 'vendor') return { cleared: true, reason: 'TxDOT staff.' };
  if (!p.cyber_training_completed_on) return { cleared: false, reason: `${p.display_name} has not completed the TxDOT-approved cyber security training.` };
  const age = (now.getTime() - Date.parse(p.cyber_training_completed_on)) / DAY;
  if (age > VALID_DAYS) return { cleared: false, reason: `${p.display_name}'s cyber security training expired (completed ${p.cyber_training_completed_on}).` };
  return { cleared: true, reason: `Trained on ${p.cyber_training_completed_on}; valid until ${new Date(Date.parse(p.cyber_training_completed_on) + VALID_DAYS * DAY).toISOString().slice(0, 10)}.` };
}

/** The vendor staff list with each person's clearance, for the Security page. */
export const vendorClearances = (store) => store.list('Person', (p) => p.organization === 'vendor').map((p) => ({ person: p, ...clearance(store, p.id) }));

export async function reportBreach(store, { actor, title, description, personal_data = false }) {
  const problems = [];
  if (!store.get('Person', actor)) problems.push('Choose who is reporting the breach.');
  if (!String(title ?? '').trim()) problems.push('Say what happened.');
  if (problems.length) throw new CyberError('The breach was not logged.', problems);
  const at = store.now();
  return store.insert('Incident', { title: `Security breach: ${title.trim()}`.slice(0, 300), severity: '1', status: 'open', detected_at: at.toISOString(), component: SECURITY, personal_data: Boolean(personal_data), notify_by: personal_data ? new Date(at.getTime() + NOTIFY_DAYS * DAY).toISOString().slice(0, 10) : undefined }, { actor, action: 'security breach logged', detail: { description: String(description ?? '').trim() || null, personal_data: Boolean(personal_data) } });
}

/** Contain a breach: record what was done. The incident becomes mitigated. */
export async function containBreach(store, id, { actor, containment }) {
  const inc = store.get('Incident', id);
  if (!inc || inc.component !== SECURITY) throw new CyberError(`${id} is not a security breach.`);
  if (inc.status !== 'open') throw new CyberError(`${id} is already ${inc.status}.`);
  if (!SECURITY_ROLES.has(store.get('Person', actor)?.role)) throw new CyberError('Only a security officer, a system administrator or the compliance officer can act on a breach.');
  if (!String(containment ?? '').trim()) throw new CyberError('Say what was done to contain it.');
  return store.update('Incident', id, { status: 'mitigated', containment: containment.trim() }, { actor, action: 'security breach contained' });
}

/** Record that affected people (and, where required, the attorney general) were notified. */
export async function recordNotification(store, id, { actor, details }) {
  const inc = store.get('Incident', id);
  if (!inc?.personal_data) throw new CyberError(`${id} did not involve personal information; no notification is needed.`);
  if (!String(details ?? '').trim()) throw new CyberError('Say who was notified and when.');
  return store.log('breach notification recorded', { actor, entity: 'Incident', record_id: id, detail: { details: details.trim(), notify_by: inc.notify_by, on_time: store.now().toISOString().slice(0, 10) <= inc.notify_by } });
}

export const notified = (store, id) => store.audit().some((e) => e.record_id === id && e.action === 'breach notification recorded');

/** Close a breach with its cause. Refused while it is not contained, or while a required notification is missing. */
export async function closeBreach(store, id, { actor, root_cause }) {
  const inc = store.get('Incident', id);
  if (!inc || inc.component !== SECURITY) throw new CyberError(`${id} is not a security breach.`);
  const problems = [];
  if (inc.status !== 'mitigated') problems.push('Contain the breach first.');
  if (inc.personal_data && !notified(store, id)) problems.push(`Personal information was involved: record the notification (due by ${inc.notify_by}) first.`);
  if (!String(root_cause ?? '').trim()) problems.push('Say what caused it.');
  if (!SECURITY_ROLES.has(store.get('Person', actor)?.role)) problems.push('Only a security officer, a system administrator or the compliance officer can close a breach.');
  if (problems.length) throw new CyberError(`${id} cannot be closed yet.`, problems);
  return store.update('Incident', id, { status: 'resolved', resolved_at: store.now().toISOString(), root_cause: root_cause.trim() }, { actor, action: 'security breach closed' });
}

export const breaches = (store) => store.list('Incident', (i) => i.component === SECURITY);

/** Archive every cyber security training completion, with the clearance of each vendor employee at that moment. */
export async function archiveTraining(store, { actor }) {
  const cyberSessions = new Set(store.list('TrainingSession', (s) => s.kind === 'cyber security').map((s) => s.id));
  const completions = store.list('TrainingAttendance', (a) => a.completed && cyberSessions.has(a.session)).map((a) => ({ ...a, person_name: store.get('Person', a.person)?.display_name }));
  const generated_at = store.now().toISOString();
  const body = { title: 'Cyber security training completions', generated_at, rule: 'REQ-020; Tex. Gov\'t Code §2063.104', completions, vendor_clearance: vendorClearances(store).map((c) => ({ person: c.person.display_name, cleared: c.cleared, reason: c.reason })) };
  const content_hash = await sha256(JSON.stringify(body));
  const previous = store.list('Report', (r) => r.spec === 'CYBER-TRAINING').length;
  const day = generated_at.slice(0, 10);
  return store.insert('Report', { kind: 'compliance', spec: 'CYBER-TRAINING', subject: 'cyber security training', version: previous + 1, period_start: day, period_end: day, requested_by: actor, generated_at, file_reference: `sha256:${content_hash}`, content_hash, body }, { actor, action: 'training completions archived', detail: { content_hash, completions: completions.length } });
}

/**
 * After a breach (or any doubt), a security officer can require a vendor employee to retake the training. Their
 * clearance is suspended until they pass the course again; earlier completions stay archived.
 */
export async function requireRetraining(store, personId, { actor, reason }) {
  const p = store.get('Person', personId);
  if (!p || p.organization !== 'vendor') throw new CyberError('Retraining applies to vendor staff.');
  if (!SECURITY_ROLES.has(store.get('Person', actor)?.role)) throw new CyberError('Only a security officer, a system administrator or the compliance officer can require retraining.');
  if (!String(reason ?? '').trim()) throw new CyberError('Say why retraining is required.');
  return store.update('Person', personId, { cyber_training_completed_on: undefined }, { actor, action: 'cyber clearance suspended: retraining required', detail: { reason: reason.trim(), previous: p.cyber_training_completed_on ?? null } });
}
