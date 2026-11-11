// STORY-007: compliance tracking. The register of laws (content/compliance-rules.json, compiled from public sources and
// to be confirmed by TxDOT legal) is loaded as ComplianceRule records. A compliance run checks every rule and stores a
// ComplianceCheck for each: pass, fail or not applicable, with the evidence. Rules this build can check mechanically are
// checked against the live store; rules about records this build does not hold (crash reports, releases, public
// information requests) are "not applicable" with that reason, never a silent pass. A failure is a violation: logged,
// and shown until a later run passes. When a law changes, the update is recorded on the rule (its version goes up) and
// that rule is re-checked at once, so the system follows the law; checks made against an older version show as stale.
import { verifyChain, APPEND_ONLY } from './store.js';

export class ComplianceError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'ComplianceError';
    this.problems = problems;
  }
}

const DAY = 86400000;
/** Values the checks use, per rule, until a legal update changes them. */
export const DEFAULT_PARAMETERS = { 'CR-08': { valid_days: 365 }, 'CR-12': { retain_years: 11 } };
const NO_CRASH_RECORDS = 'This build holds no crash reports, releases or public information requests, so there is nothing to check yet. The check runs once those records are in scope.';

/** Put the register's rules into the store, once each. */
export async function syncRules(store, register, actor) {
  if (!register?.rules?.length) throw new ComplianceError('The compliance register is empty or could not be read.');
  for (const r of register.rules) {
    await store.insert('ComplianceRule', { id: r.id, title: r.title, jurisdiction: r.jurisdiction, source_reference: r.source_reference, source_url: r.source_url, summary: r.summary, check_kind: r.check_kind, version: 1, parameters: DEFAULT_PARAMETERS[r.id] ?? {} }, { actor, action: 'compliance rule registered', key: `rule:${r.id}` });
  }
  return store.list('ComplianceRule');
}

/** Each evaluator returns { result, evidence }. `env.accessibility()` is supplied by the page (it scans the DOM). */
const EVALUATORS = {
  'CR-08': (store, rule) => {
    const days = rule.parameters?.valid_days ?? 365;
    const now = store.now().getTime();
    const vendors = store.list('Person', (p) => p.organization === 'vendor');
    if (!vendors.length) return { result: 'not applicable', evidence: 'No vendor staff are recorded.' };
    const lapsed = vendors.filter((p) => !p.cyber_training_completed_on || now - Date.parse(p.cyber_training_completed_on) > days * DAY);
    return lapsed.length
      ? { result: 'fail', evidence: `${lapsed.length} of ${vendors.length} vendor staff lack cyber security training completed within ${days} days: ${lapsed.map((p) => p.display_name).join(', ')}.` }
      : { result: 'pass', evidence: `All ${vendors.length} vendor staff completed cyber security training within ${days} days.` };
  },
  'CR-09': () => ({ result: 'not applicable', evidence: 'No cloud service processes CRIS data in this build: the demo runs in the browser on synthetic data. The check applies once a hosted service holds CRIS data.' }),
  'CR-10': async (store) => {
    const chain = await verifyChain(store.audit());
    const audited = new Set(store.audit().map((e) => `${e.entity}:${e.record_id}`));
    const tables = [...store.schema.tables.keys()].filter((t) => t !== 'AuditEntry');
    const unlogged = tables.flatMap((t) => store.list(t).filter((r) => r.id && !audited.has(`${t}:${r.id}`)).map((r) => `${t} ${r.id}`));
    if (!chain.ok) return { result: 'fail', evidence: `The audit chain is broken: ${chain.reason}.` };
    if (unlogged.length) return { result: 'fail', evidence: `Records with no audit line: ${unlogged.slice(0, 5).join(', ')}${unlogged.length > 5 ? '…' : ''}.` };
    return { result: 'pass', evidence: `Audit and integrity controls hold: ${chain.count} audit lines verify, every stored record has its audit line, and ${[...APPEND_ONLY].join(', ')} are append-only. The full control catalogue mapping is a manual review.` };
  },
  'CR-11': () => ({ result: 'not applicable', evidence: 'Breach notification applies to sensitive personal information; this build holds synthetic people only. Recorded for the incident response plan review.' }),
  'CR-12': async (store, rule) => {
    const years = rule.parameters?.retain_years ?? 11;
    const chain = await verifyChain(store.audit());
    const cutoff = store.now().getTime() - years * 365.25 * DAY;
    const old = store.list('Report', (r) => Date.parse(r.generated_at) < cutoff).length;
    if (!chain.ok) return { result: 'fail', evidence: `Records may have been removed: ${chain.reason}.` };
    return { result: 'pass', evidence: `No record has been removed (the audit chain is complete) and ${old} reports are past the ${years}-year window, so nothing is due for disposal.` };
  },
  'CR-13': (store, rule, env) => accessibility(env, 'WCAG 2.0 AA'),
  'CR-14': (store, rule, env) => accessibility(env, 'WCAG 2.1 AA'),
};

function accessibility(env, level) {
  if (!env?.accessibility) return { result: 'not applicable', evidence: `Run from the workspace page: the automated check scans the page in the browser. A manual ${level} review is still required.` };
  const issues = env.accessibility();
  return issues.length
    ? { result: 'fail', evidence: `Automated scan found ${issues.length} issue(s): ${issues.slice(0, 4).join('; ')}.` }
    : { result: 'pass', evidence: `Automated scan of the workspace page found no unlabeled controls, images without text alternatives, or missing page language. A manual ${level} review is still required.` };
}

/** A small automated accessibility scan of a document (the browser passes `document`). */
export function scanDocument(doc) {
  const issues = [];
  if (!doc.documentElement.getAttribute('lang')) issues.push('the page has no language set');
  for (const img of doc.querySelectorAll('img')) if (!img.hasAttribute('alt')) issues.push(`an image has no text alternative (${img.getAttribute('src')})`);
  for (const el of doc.querySelectorAll('input:not([type=hidden]), select, textarea')) {
    const labelled = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.type === 'radio' && el.closest('label'));
    if (!labelled) issues.push(`a ${el.tagName.toLowerCase()} named "${el.name || el.id || '?'}" has no label`);
  }
  for (const b of doc.querySelectorAll('button')) if (!b.textContent.trim() && !b.getAttribute('aria-label')) issues.push('a button has no name');
  return issues;
}

async function checkRule(tx, store, rule, actor, env) {
  const ev = EVALUATORS[rule.id];
  const { result, evidence } = ev ? await ev(store, rule, env) : { result: 'not applicable', evidence: NO_CRASH_RECORDS };
  const check = await tx.insert('ComplianceCheck', { rule: rule.id, checked_at: store.now().toISOString(), result, evidence, checked_by: actor, rule_version: rule.version ?? 1 }, { actor, action: result === 'fail' ? 'compliance violation found' : `compliance check ${result}` });
  return check;
}

/** Check every rule. Returns the new checks; any "fail" is a violation, already logged. */
export async function runCompliance(store, { actor, env } = {}) {
  if (!actor || !store.get('Person', actor)) throw new ComplianceError('Choose who is running the checks.');
  const rules = store.list('ComplianceRule');
  if (!rules.length) throw new ComplianceError('No compliance rules are registered yet.');
  return store.transaction(async (tx) => {
    const out = [];
    for (const rule of rules) out.push(await checkRule(tx, store, rule, actor, env));
    return out;
  });
}

/**
 * Record a change in the law on its rule: the summary, new parameter values and the date it takes effect. The rule's
 * version goes up and the rule is re-checked straight away against the new version.
 */
export async function applyLegalUpdate(store, ruleId, { actor, summary, parameters = {}, effective_on, env }) {
  const rule = store.get('ComplianceRule', ruleId);
  if (!rule) throw new ComplianceError(`Rule ${ruleId} does not exist.`);
  if (!String(summary ?? '').trim()) throw new ComplianceError('Describe the legal change.');
  return store.transaction(async (tx) => {
    const updated = await tx.update('ComplianceRule', ruleId, { version: (rule.version ?? 1) + 1, parameters: { ...(rule.parameters ?? {}), ...parameters }, summary: `${rule.summary ?? ''} Updated: ${summary.trim()}`.trim(), effective_on: effective_on || undefined }, { actor, action: 'legal update applied', detail: { summary, parameters, effective_on } });
    const check = await checkRule(tx, store, updated, actor, env);
    return { rule: updated, check };
  });
}

/** Where each rule stands: its latest check, and whether that check predates the rule's current version. */
export function complianceStatus(store) {
  const checks = store.list('ComplianceCheck');
  return store.list('ComplianceRule').map((rule) => {
    const mine = checks.filter((c) => c.rule === rule.id).sort((a, b) => a.checked_at.localeCompare(b.checked_at) || a.id.localeCompare(b.id));
    const last = mine.at(-1) ?? null;
    const stale = last ? (last.rule_version ?? 1) < (rule.version ?? 1) : false;
    return { rule, last, stale, state: !last ? 'not checked' : stale ? 'stale' : last.result };
  });
}

export const violations = (store) => complianceStatus(store).filter((s) => s.state === 'fail');
