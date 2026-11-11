// The workspace store: every write is checked against the data model and written to a hash-chained audit log.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, memoryBackend } from './helpers.mjs';
import { verifyChain, StoreError } from '../lib/store.js';
import { ValidationError } from '../lib/schema.js';
import { reportIssue } from '../lib/helpdesk.js';

test('store: every table of the data model can be written, and a record that does not fit is refused', async () => {
  const { store, user } = await setup();
  await assert.rejects(store.insert('SupportTicket', { reported_by: user, summary: 'x', priority: 'whenever', status: 'open', opened_at: '2026-11-11T15:00:00Z' }), ValidationError);
  await assert.rejects(store.insert('SupportTicket', { reported_by: 'P-9999', summary: 'x', priority: 'low', status: 'open', opened_at: '2026-11-11T15:00:00Z' }), /does not exist/);
  await assert.rejects(store.insert('NoSuchTable', {}), /no table/);
});

test('store: if the save fails nothing is kept, not the record and not its audit line', async () => {
  const backend = memoryBackend();
  const { store, user } = await setup({ backend });
  const before = store.audit().length;
  backend.save = () => {
    throw new Error('quota exceeded');
  };
  await assert.rejects(reportIssue(store, { reporter: user, summary: 'Cannot sign in' }), StoreError);
  assert.equal(store.list('SupportTicket').length, 0);
  assert.equal(store.audit().length, before);
});

test('store: the audit chain catches a changed line and a deleted line', async () => {
  const { store, user } = await setup();
  await reportIssue(store, { reporter: user, summary: 'Cannot sign in' });
  assert.equal((await store.verifyAudit()).ok, true);
  const edited = store.audit();
  edited[2] = { ...edited[2], actor: 'someone else' };
  assert.match((await verifyChain(edited)).reason, /changed after it was written/);
  const gap = store.audit();
  gap.splice(1, 1);
  assert.equal((await verifyChain(gap)).ok, false);
});

test('store: append-only tables cannot be edited', async () => {
  const { store } = await setup();
  const [line] = store.audit();
  await assert.rejects(store.update('AuditEntry', line.id, { actor: 'x' }), /cannot be changed/);
});
