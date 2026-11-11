// STORY-002: system monitoring. Each check calls a target with a timeout and one retry, and records two
// HealthSamples (availability and response time). A target that fails opens one Incident and raises an alert;
// when it answers again the incident is resolved. Samples and incidents are never deleted, so they stay archived
// for audit, and archiveBundle() exports them with a hash.
//
// What is monitored is honest about itself: in the online demo the targets are the Command Center's own files,
// because CRIS itself is not reachable from here. Pointing it at CRIS means changing the target list, nothing else.
import { sha256 } from './store.js';

export const DEFAULT_TARGETS = [
  { component: 'Command Center page', url: 'index.html' },
  { component: 'Plan data', url: '.colaberry/plan.json' },
  { component: 'Progress data', url: '.colaberry/progress.json' },
  { component: 'Data manifest', url: '.colaberry/manifest.json' },
];
export const TIMEOUT_MS = 5000;
export const RETRIES = 1;
export const SLOW_MS = 2000;
export const SOURCE = 'workspace monitor (browser)';

/** Call one target. Never throws: a failure is a result. */
export async function probe(target, { fetchImpl = globalThis.fetch, clock = () => globalThis.performance.now(), timeoutMs = TIMEOUT_MS, retries = RETRIES } = {}) {
  let last = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const t0 = clock();
    try {
      const res = await fetchImpl(target.url, { cache: 'no-store', signal: ctrl.signal });
      const ms = Math.round(clock() - t0);
      if (res.ok) return { up: true, ms, status: res.status, attempts: attempt + 1 };
      last = { up: false, ms, status: res.status, error: `HTTP ${res.status}`, attempts: attempt + 1 };
    } catch (err) {
      last = { up: false, ms: Math.round(clock() - t0), status: null, error: err.name === 'AbortError' ? `no answer within ${timeoutMs} ms` : err.message, attempts: attempt + 1 };
    } finally {
      clearTimeout(timer);
    }
  }
  return last;
}

/**
 * Check every target once and record what was seen. Returns { results, alerts }.
 * An alert is raised when a target goes down (a new incident) and when it comes back (the incident resolved).
 */
export async function runChecks(store, targets = DEFAULT_TARGETS, opts = {}) {
  const results = [];
  for (const target of targets) results.push({ target, outcome: await probe(target, opts) });

  const alerts = [];
  await store.transaction(async (tx) => {
    const at = store.now().toISOString();
    for (const { target, outcome } of results) {
      const base = { component: target.component, observed_at: at, source: opts.source ?? SOURCE };
      await tx.insert('HealthSample', { ...base, metric: 'availability', value: outcome.up ? 1 : 0, unit: 'up' }, { actor: 'monitor', action: 'sample recorded' });
      if (outcome.up) await tx.insert('HealthSample', { ...base, metric: 'response time', value: outcome.ms, unit: 'ms' }, { actor: 'monitor', action: 'sample recorded' });

      const open = tx.list('Incident', (i) => i.component === target.component && i.status !== 'resolved')[0];
      if (!outcome.up && !open) {
        const inc = await tx.insert('Incident', { title: `${target.component} is not answering: ${outcome.error}`, severity: '2', status: 'open', detected_at: at, component: target.component }, { actor: 'monitor', action: 'outage detected' });
        alerts.push({ kind: 'down', incident: inc, component: target.component, message: `ALERT: ${target.component} is down (${outcome.error}). Incident ${inc.id} opened.` });
      } else if (outcome.up && open) {
        const inc = await tx.update('Incident', open.id, { status: 'resolved', resolved_at: at }, { actor: 'monitor', action: 'outage recovered' });
        alerts.push({ kind: 'recovered', incident: inc, component: target.component, message: `${target.component} answers again. Incident ${inc.id} resolved.` });
      }
    }
  });
  return { results, alerts };
}

/** Latest reading per component, for the live view. */
export function currentStatus(store) {
  const samples = store.list('HealthSample');
  const comps = [...new Set(samples.map((s) => s.component))];
  return comps.map((component) => {
    const mine = samples.filter((s) => s.component === component);
    const lastAvail = mine.filter((s) => s.metric === 'availability').at(-1);
    const lastMs = mine.filter((s) => s.metric === 'response time').at(-1);
    const avail = mine.filter((s) => s.metric === 'availability');
    return {
      component,
      up: lastAvail ? lastAvail.value === 1 : null,
      ms: lastMs?.value ?? null,
      slow: lastMs ? lastMs.value > SLOW_MS : false,
      checkedAt: lastAvail?.observed_at ?? null,
      checks: avail.length,
      availability: avail.length ? avail.filter((s) => s.value === 1).length / avail.length : null,
    };
  });
}

/** Everything the monitor has recorded, in one file with its hash, for the audit archive. */
export async function archiveBundle(store) {
  const body = { exported_at: store.now().toISOString(), samples: store.list('HealthSample'), incidents: store.list('Incident') };
  const text = JSON.stringify(body);
  return { body, text, hash: await sha256(text) };
}
