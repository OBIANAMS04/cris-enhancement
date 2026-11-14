// STORY-015 Incident reports and risk documentation: detailed reports stored, access for authorised users, versioned and logged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, fakeFetch, tick, targets } from './helpers.mjs';
import { runChecks } from '../lib/monitoring.js';
import { assess } from '../lib/risk.js';
import { verifyReport } from '../lib/reports.js';
import { generateIncidentReport, openDocumentation, versions, documentation, accessLog, ReportAccessError } from '../lib/incidentreports.js';

const role = (store, r) => store.list('Person', (p) => p.role === r)[0].id;

async function outage(ctx) {
  const down = new Set(['b']);
  await runChecks(ctx.store, targets, { fetchImpl: fakeFetch(down), clock: tick() });
  await assess(ctx.store, { actor: role(ctx.store, 'risk manager') });
  return { down, incident: ctx.store.list('Incident')[0] };
}

test('STORY-015: a reported incident gets a detailed report, generated and stored', async () => {
  const ctx = await setup();
  const { incident } = await outage(ctx);
  const r = await generateIncidentReport(ctx.store, incident.id, { actor: role(ctx.store, 'compliance officer') });
  assert.equal(r.kind, 'incident log');
  assert.equal(r.version, 1);
  assert.equal(r.body.incident.id, incident.id);
  assert.ok(r.body.timeline.some((e) => e.action === 'outage detected'));
  assert.equal(r.body.related_risks[0].score, 9, 'the outage risk that cites it is linked');
  assert.equal(await verifyReport(r), true);
});

test('STORY-015: risk assessment documentation is open to authorised users and refused to others', async () => {
  const ctx = await setup();
  await outage(ctx);
  const assessment = documentation(ctx.store).find((r) => r.spec === 'RISK-ASSESSMENT');
  const opened = await openDocumentation(ctx.store, assessment.id, { actor: role(ctx.store, 'compliance officer') });
  assert.equal(opened.id, assessment.id);
  await assert.rejects(openDocumentation(ctx.store, assessment.id, { actor: ctx.user }), ReportAccessError);
  await assert.rejects(generateIncidentReport(ctx.store, 'INC-0001', { actor: ctx.user }), /Only authorised roles/);
  assert.deepEqual(accessLog(ctx.store).map((e) => e.action), ['documentation opened', 'documentation access refused']);
});

test('STORY-015 Trust: reports are version-controlled: each new report on an incident is a new, kept version', async () => {
  const ctx = await setup();
  const { down, incident } = await outage(ctx);
  const co = role(ctx.store, 'compliance officer');
  const v1 = await generateIncidentReport(ctx.store, incident.id, { actor: co });
  down.clear();
  await runChecks(ctx.store, targets, { fetchImpl: fakeFetch(down), clock: tick() });
  const v2 = await generateIncidentReport(ctx.store, incident.id, { actor: co });
  assert.equal(v2.version, 2);
  assert.equal(v2.body.supersedes, v1.id);
  assert.equal(v2.body.incident.status, 'resolved');
  assert.deepEqual(versions(ctx.store, incident.id).map((r) => r.version), [1, 2]);
  assert.equal(await verifyReport(v1), true, 'version 1 is kept unchanged');
  await assert.rejects(ctx.store.update('Report', v1.id, { version: 5 }), /cannot be changed/);
  assert.ok(ctx.store.audit().some((e) => e.action === 'incident report generated (version 2)'));
});
