// STORY-001 Help desk: happy path, Trust line and the failure paths named in the plan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, articles } from './helpers.mjs';
import { reportIssue, ticketStatus, resolveTicket, reopenTicket, startWork, HelpDeskError } from '../lib/helpdesk.js';

test('STORY-001: a user reports an issue and receives assistance straight away', async () => {
  const { store, user } = await setup();
  const { ticket, assistance } = await reportIssue(store, { reporter: user, summary: 'Cannot sign in, my account is locked', priority: 'high' }, await articles());
  assert.match(ticket.id, /^TKT-/);
  assert.equal(ticket.status, 'open');
  assert.ok(assistance.assignedTo, 'a named person has it');
  assert.equal(assistance.respondBy, '2026-11-11T23:00:00.000Z', 'high priority: 8 hours');
  assert.equal(assistance.articles[0].id, 'HELP-01');
  const { history } = ticketStatus(store, ticket.id);
  assert.deepEqual(history.map((e) => e.action), ['reported', 'assistance given']);
});

test('STORY-001: a resolved issue shows as resolved when the user checks', async () => {
  const { store, user, staff, now } = await setup();
  const { ticket } = await reportIssue(store, { reporter: user, summary: 'Export is slow' });
  await startWork(store, ticket.id, { actor: staff, note: 'Looking at it' });
  now.advance(2);
  await resolveTicket(store, ticket.id, { actor: staff, resolution: 'Narrowed the query; it now runs in seconds.' });
  const status = ticketStatus(store, ticket.id);
  assert.equal(status.ticket.status, 'resolved');
  assert.equal(status.ticket.resolution, 'Narrowed the query; it now runs in seconds.');
  assert.equal(status.history.at(-1).action, 'resolved');
});

test('STORY-001 Trust: every help desk interaction is in the audit log, and the chain verifies', async () => {
  const { store, user, staff } = await setup();
  const { ticket } = await reportIssue(store, { reporter: user, summary: 'Form will not submit' });
  await resolveTicket(store, ticket.id, { actor: staff, resolution: 'Required field explained.' });
  await reopenTicket(store, ticket.id, { actor: user, reason: 'Still fails on save.' });
  const lines = store.audit().filter((e) => e.record_id === ticket.id);
  assert.deepEqual(lines.map((e) => e.action), ['issue reported', 'ticket resolved', 'ticket reopened']);
  const events = store.audit().filter((e) => e.entity === 'TicketEvent');
  assert.equal(events.length, ticketStatus(store, ticket.id).history.length, 'each ticket event has its own audit line');
  assert.equal((await store.verifyAudit()).ok, true);
});

test('STORY-001 failure paths: refused report, double submit, nobody on duty, wrong fix reopened', async () => {
  const { store, user, staff, admin } = await setup();
  await assert.rejects(reportIssue(store, { reporter: user, summary: '   ' }), HelpDeskError);
  const a = await reportIssue(store, { reporter: user, summary: 'Locked out', key: 'form-1' });
  const b = await reportIssue(store, { reporter: user, summary: 'Locked out', key: 'form-1' });
  assert.equal(a.ticket.id, b.ticket.id);
  assert.equal(store.list('SupportTicket').length, 1, 'a double submit does not double-create');
  for (const id of [staff, admin]) await store.update('Person', id, { on_duty: false }, { actor: admin, action: 'went off duty' });
  const { assistance } = await reportIssue(store, { reporter: user, summary: 'Nobody here?' });
  assert.equal(assistance.escalated, true);
  await resolveTicket(store, a.ticket.id, { actor: staff, resolution: 'Unlocked' });
  const back = await reopenTicket(store, a.ticket.id, { actor: user, reason: 'Still locked' });
  assert.equal(back.status, 'open');
  assert.equal(back.resolved_at, undefined);
});
