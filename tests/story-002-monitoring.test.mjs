// STORY-002 Monitoring: metrics, alerts on outage, time limits and retries, the archive.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, fakeFetch, tick, targets } from './helpers.mjs';
import { runChecks, probe, currentStatus, archiveBundle } from '../lib/monitoring.js';

test('STORY-002: while the system runs, the monitor records availability and response time', async () => {
  const { store } = await setup();
  await runChecks(store, targets, { fetchImpl: fakeFetch(), clock: tick() });
  const status = currentStatus(store);
  assert.deepEqual(status.map((s) => [s.component, s.up, s.ms]), [['Web', true, 40], ['API', true, 40]]);
});

test('STORY-002: an outage raises an alert and opens one incident; recovery resolves it', async () => {
  const { store } = await setup();
  const down = new Set(['b']);
  const first = await runChecks(store, targets, { fetchImpl: fakeFetch(down), clock: tick() });
  assert.equal(first.alerts.length, 1);
  assert.match(first.alerts[0].message, /^ALERT: API is down/);
  const again = await runChecks(store, targets, { fetchImpl: fakeFetch(down), clock: tick() });
  assert.equal(again.alerts.length, 0, 'still down: no second incident');
  assert.equal(store.list('Incident').length, 1);
  down.clear();
  const back = await runChecks(store, targets, { fetchImpl: fakeFetch(down), clock: tick() });
  assert.equal(back.alerts[0].kind, 'recovered');
  assert.equal(store.list('Incident')[0].status, 'resolved');
});

test('STORY-002: a target that never answers times out and is retried once', async () => {
  let calls = 0;
  const hang = (url, { signal }) => {
    calls++;
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
  };
  const r = await probe({ url: 'x' }, { fetchImpl: hang, timeoutMs: 20, clock: tick() });
  assert.equal(r.up, false);
  assert.match(r.error, /no answer within 20 ms/);
  assert.equal(calls, 2);
});

test('STORY-002 Trust: monitoring data is archived: kept, unchangeable, exported with a hash', async () => {
  const { store } = await setup();
  await runChecks(store, targets, { fetchImpl: fakeFetch(new Set(['a'])), clock: tick() });
  const [sample] = store.list('HealthSample');
  await assert.rejects(store.update('HealthSample', sample.id, { value: 1 }), /cannot be changed/);
  const bundle = await archiveBundle(store);
  assert.equal(bundle.body.samples.length, 3);
  assert.equal(bundle.body.incidents.length, 1);
  assert.match(bundle.hash, /^[0-9a-f]{64}$/);
});
