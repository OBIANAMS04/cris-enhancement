// STORY-003 Performance reports: current figures, an error when data is missing, archived reports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, fakeFetch, tick, targets } from './helpers.mjs';
import { runChecks } from '../lib/monitoring.js';
import { reportIssue, resolveTicket } from '../lib/helpdesk.js';
import { generatePerformanceReport, verifyReport, ReportError, percentile } from '../lib/reports.js';

test('STORY-003: a report reflects current performance', async () => {
  const { store, manager, user, staff } = await setup();
  await runChecks(store, targets, { fetchImpl: fakeFetch(), clock: tick() });
  await runChecks(store, targets, { fetchImpl: fakeFetch(new Set(['b'])), clock: tick() });
  const { ticket } = await reportIssue(store, { reporter: user, summary: 'Slow' });
  await resolveTicket(store, ticket.id, { actor: staff, resolution: 'Done' });
  const r = await generatePerformanceReport(store, { period_start: '2026-11-11', period_end: '2026-11-11', requested_by: manager });
  const f = r.body.figures;
  assert.equal(f.checks, 4);
  assert.equal(f.availability_pct, 75);
  assert.equal(f.incidents.opened, 1);
  assert.equal(f.help_desk.opened, 1);
  assert.equal(f.help_desk.resolved, 1);
  assert.deepEqual(f.components.map((c) => c.availability_pct), [100, 50]);
});

test('STORY-003: with no data for the period, an error is shown and nothing is archived', async () => {
  const { store, manager } = await setup();
  await assert.rejects(generatePerformanceReport(store, { period_start: '2026-11-01', period_end: '2026-11-02', requested_by: manager }), (err) => err instanceof ReportError && err.missing.includes('monitoring samples'));
  await assert.rejects(generatePerformanceReport(store, { period_start: '2026-11-05', period_end: '2026-11-01', requested_by: manager }), /ends before it starts/);
  assert.equal(store.list('Report').length, 0);
});

test('STORY-003 Trust: reports are archived, cannot be edited, and their hash detects a changed copy', async () => {
  const { store, manager } = await setup();
  await runChecks(store, targets, { fetchImpl: fakeFetch(), clock: tick() });
  const r = await generatePerformanceReport(store, { period_start: '2026-11-11', period_end: '2026-11-11', requested_by: manager });
  assert.equal(store.list('Report').length, 1);
  assert.equal(await verifyReport(r), true);
  assert.equal(await verifyReport({ ...r, body: { ...r.body, title: 'edited' } }), false);
  await assert.rejects(store.update('Report', r.id, { kind: 'compliance' }), /cannot be changed/);
  assert.equal(percentile([5, 1, 3], 50), 3);
});
