// STORY-006 Reporting engine: reports meet their specification, errors are logged and addressed, reports are archived.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup, fakeFetch, tick, targets } from './helpers.mjs';
import { runChecks } from '../lib/monitoring.js';
import { reportIssue, resolveTicket } from '../lib/helpdesk.js';
import { verifyReport } from '../lib/reports.js';
import { generateToSpec, addressReportError, reportErrors, SpecError } from '../lib/reporting.js';

const { specs } = JSON.parse(await readFile(new URL('../content/report-specs.json', import.meta.url), 'utf8'));
const day = { period_start: '2026-11-11', period_end: '2026-11-11' };

test('STORY-006: a requested report has every section its specification lists', async () => {
  const { store, manager, user, staff } = await setup();
  await runChecks(store, targets, { fetchImpl: fakeFetch(), clock: tick() });
  const { ticket } = await reportIssue(store, { reporter: user, summary: 'Slow', priority: 'high' });
  await resolveTicket(store, ticket.id, { actor: staff, resolution: 'Fixed' });
  for (const id of ['SPEC-PERF', 'SPEC-INCIDENTS', 'SPEC-SUPPORT', 'SPEC-TRAINING']) {
    const spec = specs.find((s) => s.id === id);
    const r = await generateToSpec(store, specs, { spec: id, ...day, requested_by: manager });
    assert.deepEqual(r.body.sections.map((s) => s.id), spec.sections.map((s) => s.id), `${id} sections`);
    assert.equal(r.spec, id);
    assert.equal(r.kind, spec.kind);
  }
  const support = store.list('Report', (r) => r.spec === 'SPEC-SUPPORT')[0];
  assert.deepEqual(support.body.sections[0].rows, [{ priority: 'high', opened: 1, resolved: 1 }]);
});

test('STORY-006: a report error is logged as an incident, and addressed when the report later succeeds', async () => {
  const { store, manager } = await setup();
  await assert.rejects(generateToSpec(store, specs, { spec: 'SPEC-PERF', ...day, requested_by: manager }), (e) => e instanceof SpecError || /No monitoring/.test(e.message));
  await assert.rejects(generateToSpec(store, specs, { spec: 'SPEC-PERF', ...day, requested_by: manager }));
  const errs = reportErrors(store);
  assert.equal(errs.length, 1, 'a repeated failure does not open a second incident');
  assert.equal(errs[0].status, 'open');
  assert.ok(store.audit().some((e) => e.action === 'report error repeated'));
  await runChecks(store, targets, { fetchImpl: fakeFetch(), clock: tick() });
  await generateToSpec(store, specs, { spec: 'SPEC-PERF', ...day, requested_by: manager });
  const after = store.get('Incident', errs[0].id);
  assert.equal(after.status, 'resolved');
  assert.match(after.root_cause, /generated to specification on retry/);
});

test('STORY-006: a report that needs an unconnected system is refused, logged, and can be addressed by hand', async () => {
  const { store, manager } = await setup();
  const err = await generateToSpec(store, specs, { spec: 'SPEC-COST', ...day, requested_by: manager }).catch((e) => e);
  assert.match(err.problems.join(), /TxDOT financial system, which is not connected/);
  assert.ok(err.incident.id);
  await assert.rejects(addressReportError(store, err.incident.id, { actor: manager, root_cause: ' ' }), /what caused it/);
  const done = await addressReportError(store, err.incident.id, { actor: manager, root_cause: 'Waiting on TxDOT to grant read access to the financial system.' });
  assert.equal(done.status, 'resolved');
  assert.equal(store.list('Report').length, 0, 'nothing archived for a report that failed');
});

test('STORY-006 Trust: every generated report is archived, unchangeable and verifiable', async () => {
  const { store, manager } = await setup();
  const r = await generateToSpec(store, specs, { spec: 'SPEC-INCIDENTS', ...day, requested_by: manager });
  assert.equal(r.body.sections[0].note, 'None in this period.');
  assert.equal(await verifyReport(r), true);
  await assert.rejects(store.update('Report', r.id, { kind: 'performance' }), /cannot be changed/);
  assert.ok(store.audit().some((e) => e.record_id === r.id && e.action === 'report generated to specification and archived'));
});
