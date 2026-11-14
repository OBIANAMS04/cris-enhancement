// STORY-014 Performance and user error: anomalies raise alerts, user errors get corrective suggestions, both are logged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, clock } from './helpers.mjs';
import { analyse, scanAnomalies, anomalyAlerts, MIN_BASELINE } from '../lib/anomaly.js';
import { suggestionsFor, recordUserError, nextMaintenanceSlot, userErrors, errorPatterns } from '../lib/usererrors.js';
import { scheduleMaintenance, windowProblems } from '../lib/support.js';
import { runChecks } from '../lib/monitoring.js';

async function samples(store, values) {
  for (const v of values) await store.insert('HealthSample', { component: 'Web', metric: 'response time', value: v, unit: 'ms', observed_at: store.now().toISOString(), source: 'test' }, { actor: 'monitor' });
}

test('STORY-014: a response-time anomaly raises one alert for investigation, cleared when back to normal', async () => {
  const { store } = await setup();
  await samples(store, [10, 12, 11, 9, 10, 11]);
  let scan = await scanAnomalies(store);
  assert.equal(scan.raised.length, 0, 'normal samples raise nothing');
  await samples(store, [480]);
  scan = await scanAnomalies(store);
  assert.equal(scan.raised.length, 1);
  assert.match(scan.raised[0].title, /480 ms against a baseline of 10.5 ms/);
  await samples(store, [520]);
  assert.equal((await scanAnomalies(store)).raised.length, 0, 'still anomalous: no second alert');
  await samples(store, [11]);
  const back = await scanAnomalies(store);
  assert.equal(back.cleared.length, 1);
  assert.equal(anomalyAlerts(store)[0].status, 'resolved');
});

test('STORY-014: with too few samples there is no baseline, and the scan says so', async () => {
  const { store } = await setup();
  await samples(store, [10, 900]);
  const [r] = analyse(store);
  assert.equal(r.baseline, null);
  assert.match(r.note, new RegExp(`${MIN_BASELINE} needed`));
  assert.equal((await scanAnomalies(store)).raised.length, 0);
});

test('STORY-014: user errors get corrective suggestions worked out from the data', async () => {
  const { store, admin } = await setup({ now: clock('2026-11-11T15:00:00.000Z') });
  const err = await scheduleMaintenance(store, { title: 'Patch', component: 'web', starts_at: '2026-11-12T15:00:00Z', ends_at: '2026-11-12T17:00:00Z', scheduled_by: admin }).catch((e) => e);
  const s = suggestionsFor(store, err.message, err.problems);
  assert.match(s[0], /Book it outside service hours, for example 2026-11-12 04:00/);
  const slot = nextMaintenanceSlot(store);
  assert.deepEqual(windowProblems(slot, [], store.now()), [], 'the suggested slot passes every rule');
  await runChecks(store, [{ component: 'Web', url: 'a' }], { fetchImpl: async () => ({ ok: true, status: 200 }), clock: (() => { let t = 0; return () => (t += 5); })() });
  assert.match(suggestionsFor(store, 'No monitoring samples between 2026-10-01 and 2026-10-02.')[0], /includes a day with data: 2026-11-11/);
  assert.match(suggestionsFor(store, 'x', ['Missing required document: Pricing.', 'Missing required document: HUB subcontracting plan.'])[0], /Pricing, HUB subcontracting plan/);
  assert.deepEqual(suggestionsFor(store, 'Something entirely unexpected'), []);
});

test('STORY-014 Trust: every anomaly and user error is logged for audit', async () => {
  const { store, user } = await setup();
  await samples(store, [10, 10, 10, 10, 10, 10, 400]);
  await scanAnomalies(store);
  const suggestions = await recordUserError(store, { actor: user, where: 'maintenance', message: 'This maintenance window cannot be scheduled.', problems: ['It overlaps service hours (Monday to Friday, 6:00 to 20:00 Central), so users would be disrupted.'] });
  assert.equal(suggestions.length, 1);
  const logged = userErrors(store)[0];
  assert.equal(logged.actor, user);
  assert.deepEqual(logged.detail.suggestions, suggestions);
  assert.ok(store.audit().some((e) => e.action === 'performance anomaly alert'));
  assert.deepEqual(errorPatterns(store), [{ where: 'maintenance', count: 1 }]);
  assert.equal((await store.verifyAudit()).ok, true);
});
