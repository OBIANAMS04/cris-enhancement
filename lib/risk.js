// STORY-010: risk assessment. An assessment reads the live system for the conditions REQ-016 and REQ-017 name:
// outages, slow performance, user error, operator error and security lapses. Each condition found is a Risk with a
// likelihood, an impact, a score (likelihood × impact, 1 to 9), the evidence, an owner and a mitigation plan. A risk is
// mitigated when its condition is gone at a later assessment, or when its owner records the action taken; one that is
// still open past its review date, or high and unmitigated, is logged for review. Every assessment is archived as a
// report with its SHA-256. Incidents from monitoring feed the outage risk, so the incident record and the risk register
// stay linked through the evidence.
import { sha256 } from './store.js';
import { currentStatus, SLOW_MS } from './monitoring.js';

export class RiskError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'RiskError';
    this.problems = problems;
  }
}

const LEVEL = { low: 1, medium: 2, high: 3 };
export const REVIEW_DAYS = 7;
const DAY = 86400000;
const ASSESSORS = new Set(['risk manager', 'system administrator', 'TxDOT manager']);

/** The conditions an assessment looks for. Each returns null when the condition is absent. */
const DETECTORS = [
  (s) => {
    const open = s.list('Incident', (i) => i.status !== 'resolved' && !String(i.component ?? '').startsWith('Reporting engine') && i.component !== 'Response submissions');
    return open.length ? { key: 'outage:open-incidents', title: 'Components not answering', category: 'outage', likelihood: 'high', impact: 'high', evidence: `${open.length} open incident(s): ${open.map((i) => i.id).join(', ')}.`, mitigation: 'Restore the component, then resolve the incident; check the monitor every minute until stable.' } : null;
  },
  (s) => {
    const down = currentStatus(s).filter((c) => c.availability !== null && c.availability < 0.99 && c.checks >= 2);
    return down.length ? { key: 'outage:availability', title: 'Availability below 99%', category: 'outage', likelihood: 'medium', impact: 'high', evidence: down.map((c) => `${c.component} ${Math.round(c.availability * 1000) / 10}%`).join('; ') + '.', mitigation: 'Find the cause of the failed checks and add redundancy for the component.' } : null;
  },
  (s) => {
    const slow = currentStatus(s).filter((c) => c.ms !== null && c.ms > SLOW_MS);
    return slow.length ? { key: 'performance:slow', title: 'Responses slower than the target', category: 'performance', likelihood: 'medium', impact: 'medium', evidence: slow.map((c) => `${c.component} ${c.ms} ms`).join('; ') + `; target ${SLOW_MS} ms.`, mitigation: 'Profile the slow component and tune or scale it.' } : null;
  },
  (s) => {
    const reopened = s.audit().filter((e) => e.action === 'ticket reopened').length;
    const failed = s.list('TrainingAttendance', (a) => a.completed === false).length;
    return reopened + failed >= 2 ? { key: 'user-error:help-and-training', title: 'Users struggling with the system', category: 'user error', likelihood: 'medium', impact: 'medium', evidence: `${reopened} reopened ticket(s) and ${failed} failed knowledge check(s).`, mitigation: 'Run a refresher session on the areas behind the reopened tickets; improve the help articles.' } : null;
  },
  (s) => {
    const late = s.audit().filter((e) => e.action === 'maintenance completed late').length;
    const overdue = s.list('MaintenanceWindow', (w) => w.status === 'scheduled' && Date.parse(w.ends_at) < s.now().getTime()).length;
    const reportErrors = s.list('Incident', (i) => String(i.component ?? '').startsWith('Reporting engine') && i.status !== 'resolved').length;
    return late + overdue + reportErrors ? { key: 'operator-error:procedures', title: 'Operational procedures not followed', category: 'operator error', likelihood: 'medium', impact: 'medium', evidence: `${late} maintenance window(s) finished late, ${overdue} overdue, ${reportErrors} report error(s) open.`, mitigation: 'Review the runbook with the operators; add a reminder before each maintenance window ends.' } : null;
  },
  (s) => {
    const now = s.now().getTime();
    const lapsed = s.list('Person', (p) => p.organization === 'vendor' && (!p.cyber_training_completed_on || now - Date.parse(p.cyber_training_completed_on) > 365 * DAY));
    const violations = (() => {
      const checks = s.list('ComplianceCheck');
      const last = new Map();
      for (const c of checks) last.set(c.rule, c);
      return [...last.values()].filter((c) => c.result === 'fail');
    })();
    return lapsed.length || violations.length ? { key: 'security:training-and-compliance', title: 'Security or compliance gap', category: 'security', likelihood: violations.length ? 'high' : 'medium', impact: 'high', evidence: `${lapsed.length} vendor staff without current cyber security training; ${violations.length} open compliance violation(s).`, mitigation: 'Schedule the cyber security course for the people named; re-run the compliance checks.' } : null;
  },
];

/**
 * Run an assessment. New conditions become open risks; risks whose condition has gone are marked mitigated; open risks
 * past review, or high-scoring without mitigation, are logged for review. The assessment is archived.
 * Returns { report, identified, mitigated, forReview }.
 */
export async function assess(store, { actor }) {
  if (!ASSESSORS.has(store.get('Person', actor)?.role)) throw new RiskError('Only a risk manager, a system administrator or a TxDOT manager can run a risk assessment.');
  const now = store.now();
  const at = now.toISOString();
  const found = DETECTORS.map((d) => d(store)).filter(Boolean);
  const result = await store.transaction(async (tx) => {
    const identified = [];
    const mitigated = [];
    for (const f of found) {
      const existing = tx.list('Risk', (r) => r.source_key === f.key && r.status === 'open')[0];
      const score = LEVEL[f.likelihood] * LEVEL[f.impact];
      if (existing) {
        await tx.update('Risk', existing.id, { evidence: f.evidence, likelihood: f.likelihood, impact: f.impact, score, last_assessed_at: at }, { actor, action: 'risk still present' });
      } else {
        identified.push(await tx.insert('Risk', { title: f.title, category: f.category, likelihood: f.likelihood, impact: f.impact, owner: actor, mitigation: f.mitigation, status: 'open', source_key: f.key, score, evidence: f.evidence, identified_at: at, review_by: new Date(now.getTime() + REVIEW_DAYS * DAY).toISOString().slice(0, 10), last_assessed_at: at }, { actor, action: 'risk identified' }));
      }
    }
    const keys = new Set(found.map((f) => f.key));
    for (const r of tx.list('Risk', (x) => x.status === 'open' && x.source_key && !keys.has(x.source_key))) {
      mitigated.push(await tx.update('Risk', r.id, { status: 'mitigated', last_assessed_at: at, evidence: `${r.evidence} Condition no longer present at ${at}.` }, { actor, action: 'risk mitigated (condition gone)' }));
    }
    const forReview = [];
    for (const r of tx.list('Risk', (x) => x.status === 'open')) {
      if ((r.review_by && r.review_by < at.slice(0, 10)) || r.score >= 9) {
        await tx.log('risk logged for review', { actor, entity: 'Risk', record_id: r.id, detail: { score: r.score, review_by: r.review_by } });
        forReview.push(r);
      }
    }
    return { identified, mitigated, forReview };
  });
  const body = { title: 'CRIS risk assessment', generated_at: at, conditions_checked: DETECTORS.length, found, register: store.list('Risk'), for_review: result.forReview.map((r) => r.id) };
  const content_hash = await sha256(JSON.stringify(body));
  const day = at.slice(0, 10);
  const report = await store.insert('Report', { kind: 'risk assessment', spec: 'RISK-ASSESSMENT', period_start: day, period_end: day, requested_by: actor, generated_at: at, file_reference: `sha256:${content_hash}`, content_hash, body }, { actor, action: 'risk assessment archived', detail: { content_hash, found: found.length } });
  return { report, ...result };
}

/** The owner records the action taken. The risk is mitigated; a later assessment reopens it if the condition returns. */
export async function recordMitigation(store, id, { actor, action }) {
  const r = store.get('Risk', id);
  if (!r) throw new RiskError(`Risk ${id} does not exist.`);
  if (r.status !== 'open') throw new RiskError(`${id} is already ${r.status}.`);
  if (!String(action ?? '').trim()) throw new RiskError('Say what was done to mitigate the risk.');
  return store.update('Risk', id, { status: 'mitigated', mitigation: `${r.mitigation} Done: ${action.trim()}` }, { actor, action: 'risk mitigated (action recorded)' });
}

/** Counts per likelihood × impact cell, for the heat map. */
export function heatMap(store, statuses = ['open']) {
  const cells = {};
  for (const l of Object.keys(LEVEL)) for (const i of Object.keys(LEVEL)) cells[`${l}|${i}`] = 0;
  for (const r of store.list('Risk', (x) => statuses.includes(x.status))) cells[`${r.likelihood}|${r.impact}`] += 1;
  return cells;
}

export const forReview = (store) => store.list('Risk', (r) => r.status === 'open' && ((r.review_by && r.review_by < store.now().toISOString().slice(0, 10)) || r.score >= 9));
