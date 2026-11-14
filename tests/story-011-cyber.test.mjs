// STORY-011 Cybersecurity compliance: training completion ensures compliance, breaches are logged and addressed, completions archived.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup, clock } from './helpers.mjs';
import { clearance, requireRetraining, reportBreach, containBreach, recordNotification, closeBreach, archiveTraining, breaches, CyberError } from '../lib/cyber.js';
import { scheduleSession, holdSession, takeCheck, courseById } from '../lib/training.js';
import { uploadDocument, memoryBlobs } from '../lib/documents.js';
import { verifyReport } from '../lib/reports.js';

const materials = JSON.parse(await readFile(new URL('../content/training-materials.json', import.meta.url), 'utf8'));
const role = (store, r) => store.list('Person', (p) => p.role === r)[0].id;
const file = { name: 'p.pdf', bytes: new TextEncoder().encode('x') };

async function trainCyber(ctx, people) {
  const s = await scheduleSession(ctx.store, materials, { course: 'COURSE-CYBER', scheduled_at: new Date(ctx.now().getTime() + 3600000).toISOString(), trainer: ctx.admin });
  ctx.now.advance(2);
  await holdSession(ctx.store, s.id, { actor: ctx.admin, recording_reference: 'rec/cyber.mp4' });
  const answers = courseById(materials, 'COURSE-CYBER').questions.map((q) => q.answer);
  for (const p of people) await takeCheck(ctx.store, materials, { session: s.id, person: p, answers });
}

test('STORY-011: completing the cyber training is what clears a vendor employee for protected work', async () => {
  const ctx = await setup({ now: clock('2027-11-01T15:00:00.000Z') }); // a year on: the demo dates of 2026-10-01 have expired
  const { store, admin } = ctx;
  assert.equal(clearance(store, admin).cleared, false);
  await assert.rejects(uploadDocument(store, memoryBlobs(), { actor: admin, category: 'Other', file }), /training expired/);
  assert.ok(store.audit().some((e) => e.action === 'document access refused' && e.detail.reason.includes('expired')));
  await trainCyber(ctx, [admin]);
  assert.equal(clearance(store, admin).cleared, true);
  const doc = await uploadDocument(store, memoryBlobs(), { actor: admin, category: 'Other', file });
  assert.equal(doc.status, 'current');
  assert.equal(clearance(store, role(store, 'TxDOT manager')).cleared, true, 'TxDOT staff are not gated by the vendor rule');
});

test('STORY-011: a breach is logged, contained, notified when personal data is involved, and closed with its cause', async () => {
  const { store, user } = await setup();
  const sec = role(store, 'security officer');
  const b = await reportBreach(store, { actor: sec, title: 'Phishing email opened by a vendor account', personal_data: true });
  assert.equal(b.severity, '1');
  assert.equal(b.notify_by, '2027-01-10', '60 days from 11 Nov 2026');
  await assert.rejects(closeBreach(store, b.id, { actor: sec, root_cause: 'x' }), (e) => /Contain the breach first/.test(e.problems.join()));
  await assert.rejects(containBreach(store, b.id, { actor: user, containment: 'x' }), /Only a security officer/);
  await containBreach(store, b.id, { actor: sec, containment: 'Account disabled, password reset, sessions revoked.' });
  await assert.rejects(closeBreach(store, b.id, { actor: sec, root_cause: 'Phishing' }), (e) => /record the notification/.test(e.problems.join()));
  await recordNotification(store, b.id, { actor: sec, details: 'Affected requesters notified by letter on 12 Nov.' });
  const closed = await closeBreach(store, b.id, { actor: sec, root_cause: 'Credential phishing; MFA enforced for vendor accounts.' });
  assert.equal(closed.status, 'resolved');
  assert.deepEqual(store.audit().filter((e) => e.record_id === b.id).map((e) => e.action), ['security breach logged', 'security breach contained', 'breach notification recorded', 'security breach closed']);
  await assert.rejects(reportBreach(store, { actor: sec, title: ' ' }), CyberError);
  assert.equal(breaches(store).length, 1);
});

test('STORY-011 Trust: every training completion is archived, unchangeable and verifiable', async () => {
  const ctx = await setup();
  await trainCyber(ctx, [ctx.admin, ctx.dev]);
  const r = await archiveTraining(ctx.store, { actor: role(ctx.store, 'security officer') });
  assert.equal(r.body.completions.length, 2);
  assert.ok(r.body.vendor_clearance.every((c) => c.cleared));
  assert.equal(await verifyReport(r), true);
  await assert.rejects(ctx.store.update('Report', r.id, { kind: 'performance' }), /cannot be changed/);
  const r2 = await archiveTraining(ctx.store, { actor: role(ctx.store, 'security officer') });
  assert.equal(r2.version, 2);
});

test('STORY-011: after a breach, a vendor employee can be required to retrain, and is blocked until they pass', async () => {
  const ctx = await setup();
  const { store, admin } = ctx;
  const sec = role(store, 'security officer');
  await assert.rejects(requireRetraining(store, admin, { actor: ctx.user, reason: 'x' }), /Only a security officer/);
  await requireRetraining(store, admin, { actor: sec, reason: 'Account involved in the phishing breach.' });
  assert.equal(clearance(store, admin).cleared, false);
  await assert.rejects(uploadDocument(store, memoryBlobs(), { actor: admin, category: 'Other', file }), /has not completed/);
  await trainCyber(ctx, [admin]);
  assert.equal(clearance(store, admin).cleared, true);
  assert.ok(store.audit().some((e) => e.action === 'cyber clearance suspended: retraining required'));
});
