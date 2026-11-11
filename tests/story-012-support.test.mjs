// STORY-012 Support and maintenance: service levels, maintenance outside service hours, everything logged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, clock } from './helpers.mjs';
import { reportIssue, resolveTicket } from '../lib/helpdesk.js';
import { slaState } from '../lib/sla.js';
import { scheduleMaintenance, completeMaintenance, overdueMaintenance, supportSummary, setOnDuty, inServiceHours, SupportError } from '../lib/support.js';

test('STORY-012: a ticket is resolved within its service level, and one left open breaches it', async () => {
  const { store, user, staff, now } = await setup();
  const fast = (await reportIssue(store, { reporter: user, summary: 'A', priority: 'urgent' })).ticket;
  const slow = (await reportIssue(store, { reporter: user, summary: 'B', priority: 'urgent' })).ticket;
  now.advance(2);
  await resolveTicket(store, fast.id, { actor: staff, resolution: 'Fixed' });
  assert.equal(slaState(store.get('SupportTicket', slow.id), now()), 'on track');
  now.advance(1.5);
  assert.equal(slaState(store.get('SupportTicket', slow.id), now()), 'at risk', 'last quarter of its 4 hours');
  now.advance(1.5);
  assert.equal(slaState(store.get('SupportTicket', fast.id), now()), 'met');
  assert.equal(slaState(store.get('SupportTicket', slow.id), now()), 'breached');
  const s = supportSummary(store);
  assert.equal(s.breached, 1);
  assert.equal(s.metShare, 1);
});

test('STORY-012: maintenance is scheduled only outside service hours, and late completion is flagged', async () => {
  const now = clock('2026-11-11T15:00:00.000Z'); // Wednesday 9:00 Central
  const { store, admin } = await setup({ now });
  assert.equal(inServiceHours(new Date('2026-11-11T15:00:00Z')), true);
  await assert.rejects(scheduleMaintenance(store, { title: 'Patch', component: 'web', starts_at: '2026-11-12T15:00:00Z', ends_at: '2026-11-12T16:00:00Z', scheduled_by: admin }), SupportError);
  // Thursday 23:00 to Friday 01:00 Central = Friday 05:00 to 07:00 UTC
  const w = await scheduleMaintenance(store, { title: 'Patch', component: 'web', starts_at: '2026-11-13T05:00:00Z', ends_at: '2026-11-13T07:00:00Z', scheduled_by: admin });
  await assert.rejects(scheduleMaintenance(store, { title: 'Clash', component: 'db', starts_at: '2026-11-13T06:00:00Z', ends_at: '2026-11-13T08:00:00Z', scheduled_by: admin }), (err) => err.problems.some((p) => /overlaps MW-/.test(p)));
  now.set('2026-11-13T09:00:00Z');
  assert.equal(overdueMaintenance(store).length, 1, 'past its end and not done: overdue');
  const done = await completeMaintenance(store, w.id, { actor: admin });
  assert.equal(done.status, 'completed');
  assert.equal(store.audit().at(-1).action, 'maintenance completed late');
});

test('STORY-012 Trust: support and maintenance activity is logged and auditable', async () => {
  const { store, admin, staff } = await setup({ now: clock('2026-11-11T15:00:00.000Z') });
  await setOnDuty(store, staff, false, admin);
  await scheduleMaintenance(store, { title: 'Index rebuild', component: 'db', starts_at: '2026-11-14T10:00:00Z', ends_at: '2026-11-14T12:00:00Z', scheduled_by: admin });
  const actions = store.audit().map((e) => e.action);
  assert.ok(actions.includes('went off duty'));
  assert.ok(actions.includes('maintenance scheduled'));
  assert.equal((await store.verifyAudit()).ok, true);
});
