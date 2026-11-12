// STORY-010 Risk assessment: risks are identified and mitigated, unmitigated risks are logged for review, assessments archived.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, fakeFetch, tick, targets } from './helpers.mjs';
import { runChecks } from '../lib/monitoring.js';
import { reportIssue, resolveTicket, reopenTicket } from '../lib/helpdesk.js';
import { verifyReport } from '../lib/reports.js';
import { assess, recordMitigation, heatMap, forReview, RiskError } from '../lib/risk.js';

const riskManager = (store) => store.list('Person', (p) => p.role === 'risk manager')[0].id;

test('STORY-010: an assessment identifies outage and user-error risks from the live system', async () => {
  const { store, user, staff } = await setup();
  await runChecks(store, targets, { fetchImpl: fakeFetch(new Set(['b'])), clock: tick() });
  for (const s of ['A', 'B']) {
    const { ticket } = await reportIssue(store, { reporter: user, summary: s });
    await resolveTicket(store, ticket.id, { actor: staff, resolution: 'tried' });
    await reopenTicket(store, ticket.id, { actor: user, reason: 'still broken' });
  }
  const { identified, report } = await assess(store, { actor: riskManager(store) });
  const keys = identified.map((r) => r.source_key).sort();
  assert.deepEqual(keys, ['outage:open-incidents', 'user-error:help-and-training']);
  const outage = identified.find((r) => r.category === 'outage');
  assert.equal(outage.score, 9);
  assert.match(outage.evidence, /INC-0001/);
  assert.ok(outage.mitigation.length > 10, 'each risk comes with a mitigation plan');
  assert.equal(heatMap(store)['high|high'], 1);
  assert.equal(report.kind, 'risk assessment');
});

test('STORY-010: a risk is mitigated when its condition is gone, or when its owner records the action', async () => {
  const { store, user, staff } = await setup();
  const rm = riskManager(store);
  const down = new Set(['b']);
  await runChecks(store, targets, { fetchImpl: fakeFetch(down), clock: tick() });
  for (const s of ['A', 'B']) {
    const { ticket } = await reportIssue(store, { reporter: user, summary: s });
    await resolveTicket(store, ticket.id, { actor: staff, resolution: 'x' });
    await reopenTicket(store, ticket.id, { actor: user, reason: 'y' });
  }
  const first = await assess(store, { actor: rm });
  down.clear();
  await runChecks(store, targets, { fetchImpl: fakeFetch(down), clock: tick() });
  const second = await assess(store, { actor: rm });
  assert.deepEqual(second.mitigated.map((r) => r.source_key), ['outage:open-incidents']);
  // The user-error risk is still open and is not opened twice; the outage left availability for the period at 50%,
  // which is a new, separate risk.
  assert.deepEqual(second.identified.map((r) => r.source_key), ['outage:availability']);
  const ux = first.identified.find((r) => r.category === 'user error');
  await assert.rejects(recordMitigation(store, ux.id, { actor: rm, action: ' ' }), RiskError);
  const done = await recordMitigation(store, ux.id, { actor: rm, action: 'Refresher on the help desk held on 12 Nov.' });
  assert.equal(done.status, 'mitigated');
});

test('STORY-010: an unmitigated high risk is logged for review, and so is one past its review date', async () => {
  const ctx = await setup();
  const { store } = ctx;
  const rm = riskManager(store);
  await runChecks(store, targets, { fetchImpl: fakeFetch(new Set(['a', 'b'])), clock: tick() });
  const { forReview: flagged } = await assess(store, { actor: rm });
  assert.equal(flagged.length, 1, 'score 9 goes straight to review');
  assert.ok(store.audit().some((e) => e.action === 'risk logged for review'));
  ctx.now.advance(24 * 8);
  await store.update('Risk', flagged[0].id, { score: 4 }, { actor: rm, action: 're-rated' });
  assert.equal(forReview(store).length, 1, 'still open past its review date');
  await assert.rejects(assess(store, { actor: ctx.user }), /Only a risk manager/);
});

test('STORY-010 Trust: every assessment is archived, unchangeable and verifiable', async () => {
  const { store } = await setup();
  const rm = riskManager(store);
  const a = await assess(store, { actor: rm });
  const b = await assess(store, { actor: rm });
  assert.equal(store.list('Report', (r) => r.kind === 'risk assessment').length, 2);
  assert.equal(await verifyReport(a.report), true);
  assert.equal(await verifyReport(b.report), true);
  assert.equal(a.report.body.conditions_checked, 6);
  await assert.rejects(store.update('Report', a.report.id, { kind: 'performance' }), /cannot be changed/);
  assert.equal((await store.verifyAudit()).ok, true);
});
